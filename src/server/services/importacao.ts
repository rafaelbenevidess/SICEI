import 'server-only'
import Papa from 'papaparse'
import {
  colunasFaltando,
  COLUNAS_IMPORTACAO,
  resumoDaLinha,
  validarLinhasImportacao,
  type LinhaDaPrevia,
} from '@/domain/importacao'
import { lerCodigoDaPosicao } from '@/domain/posicao'
import { exigirPermissao } from '@/domain/permissoes'
import { registrarAuditoria } from '../audit/registrar'
import type { Ator } from '../contexto'
import { prisma } from '../db'
import { ErroDeNegocio } from '../erros'
import { recalcularItem } from '../estoque'

export const LIMITE_LINHAS_IMPORTACAO = 5000
export const JUSTIFICATIVA_SALDO_INICIAL = 'saldo inicial da implantação'

export function modeloCsv(): string {
  return [
    COLUNAS_IMPORTACAO.join(';'),
    'PST-001;Pastilha CNMG 120408 P25;CNMG 120408;P25;CVD;TORNEAMENTO;Sandvik;10;20;;11.222.333/0001-81;5;A01-G03-C04;35',
  ].join('\n')
}

/** Lê o CSV (separador ; ou ,) e valida linha a linha, sem gravar nada (critério 1 do RF-25). */
export async function previaImportacao(ator: Ator, conteudo: string): Promise<LinhaDaPrevia[]> {
  exigirPermissao(ator.perfil, 'importacao:executar')
  const r = Papa.parse<Record<string, string>>(conteudo.replace(/^﻿/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toLowerCase(),
  })
  const faltando = colunasFaltando(r.meta.fields ?? [])
  if (faltando.length)
    throw new ErroDeNegocio(`Colunas faltando no arquivo: ${faltando.join(', ')}.`)
  if (r.data.length === 0) throw new ErroDeNegocio('O arquivo não tem linhas de dados.')
  if (r.data.length > LIMITE_LINHAS_IMPORTACAO) {
    throw new ErroDeNegocio(`O arquivo tem mais de ${LIMITE_LINHAS_IMPORTACAO} linhas.`)
  }
  const resultados = validarLinhasImportacao(r.data)

  // referências no banco: fornecedor precisa existir; código não pode existir
  const cnpjs = [...new Set(resultados.flatMap((l) => (l.ok ? [l.dados.fornecedor_cnpj] : [])))]
  const codigos = resultados.flatMap((l) => (l.ok ? [l.dados.codigo] : []))
  const fornecedores = new Map(
    (await prisma.fornecedor.findMany({ where: { cnpj: { in: cnpjs } } })).map((f) => [f.cnpj, f]),
  )
  const existentes = new Set(
    (
      await prisma.item.findMany({ where: { codigo: { in: codigos } }, select: { codigo: true } })
    ).map((i) => i.codigo),
  )
  const posicoesOcupadas = new Set(
    (
      await prisma.posicao.findMany({ where: { itemId: { not: null } }, select: { codigo: true } })
    ).map((p) => p.codigo),
  )
  return resultados.map((l, i): LinhaDaPrevia => {
    const bruta = r.data[i]
    if (!l.ok) return { ...l, resumo: resumoDaLinha(bruta) }
    const erros: string[] = []
    const f = fornecedores.get(l.dados.fornecedor_cnpj)
    if (!f) erros.push('fornecedor_cnpj: fornecedor não cadastrado no SICEI.')
    else if (!f.ativo) erros.push('fornecedor_cnpj: fornecedor inativo.')
    if (existentes.has(l.dados.codigo)) erros.push('codigo: já existe um item com este código.')
    if (l.dados.posicao && posicoesOcupadas.has(l.dados.posicao.toUpperCase()))
      erros.push('posicao: posição já ocupada.')
    const resumo = resumoDaLinha(bruta, f ? (f.nomeFantasia ?? f.razaoSocial) : undefined)
    return erros.length ? { linha: l.linha, ok: false, erros, resumo } : { ...l, resumo }
  })
}

/** Grava tudo numa única transação: se qualquer linha falhar, nada é gravado (critério 2 do RF-25). */
export async function importarPlanilha(ator: Ator, conteudo: string): Promise<{ itens: number }> {
  const previa = await previaImportacao(ator, conteudo)
  if (previa.some((l) => !l.ok))
    throw new ErroDeNegocio('Corrija as linhas com erro antes de importar.')
  const linhas = previa.flatMap((l) => (l.ok ? [l.dados] : []))

  return prisma.$transaction(
    async (tx) => {
      for (const l of linhas) {
        const nomeChave = l.fabricante.trim().toLowerCase()
        const fabricante = await tx.fabricante.upsert({
          where: { nomeChave },
          create: { nome: l.fabricante.trim(), nomeChave },
          update: {},
        })
        const fornecedor = await tx.fornecedor.findUniqueOrThrow({
          where: { cnpj: l.fornecedor_cnpj },
        })
        const item = await tx.item.create({
          data: {
            codigo: l.codigo,
            descricao: l.descricao,
            iso: l.iso ?? null,
            classe: l.classe ?? null,
            cobertura: l.cobertura ?? null,
            aplicacao: l.aplicacao,
            fabricanteId: fabricante.id,
            embalagem: l.embalagem,
            estoqueMinimo: l.estoque_minimo,
            estoqueMaximo: l.estoque_maximo ?? null,
            saldo: l.saldo_inicial,
          },
        })
        await tx.itemFornecedor.create({
          data: {
            itemId: item.id,
            fornecedorId: fornecedor.id,
            leadTimeDias: l.lead_time_dias ?? null,
            preferencial: true,
          },
        })
        if (l.posicao) {
          const end = lerCodigoDaPosicao(l.posicao)!
          const codigo = l.posicao.toUpperCase()
          await tx.posicao.upsert({
            where: { codigo },
            create: { ...end, codigo, itemId: item.id, etiquetaPendente: true },
            update: { itemId: item.id, etiquetaPendente: true },
          })
        }
        if (l.saldo_inicial > 0) {
          const mov = await tx.movimentacao.create({
            data: {
              itemId: item.id,
              tipo: 'AJUSTE_POSITIVO',
              quantidade: l.saldo_inicial,
              saldoAnterior: 0,
              saldoPosterior: l.saldo_inicial,
              motivo: JUSTIFICATIVA_SALDO_INICIAL,
              usuarioId: ator.usuarioId,
              ip: ator.ip,
              userAgent: ator.userAgent,
            },
          })
          await registrarAuditoria(tx, {
            acao: 'MOVIMENTACAO_AJUSTE_POSITIVO',
            entidade: 'movimentacao',
            entidadeId: mov.id,
            depois: mov,
            usuarioId: ator.usuarioId,
            ip: ator.ip,
            userAgent: ator.userAgent,
          })
        }
        await recalcularItem(tx, item.id)
      }
      await registrarAuditoria(tx, {
        acao: 'IMPORTACAO_PLANILHA',
        entidade: 'item',
        depois: { itens: linhas.length, codigos: linhas.map((l) => l.codigo) },
        usuarioId: ator.usuarioId,
        ip: ator.ip,
        userAgent: ator.userAgent,
      })
      return { itens: linhas.length }
    },
    { timeout: 120_000 },
  )
}
