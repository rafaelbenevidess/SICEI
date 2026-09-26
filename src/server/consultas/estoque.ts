import 'server-only'
import { pode } from '@/domain/permissoes'
import { historicoComVariacao, listaDeFornecedores, type CompraRegistrada } from '@/domain/precos'
import { consumoMedioDiario, sugestaoDeCompra } from '@/domain/estoque'
import type { Perfil, StatusItem } from '@/domain/tipos'
import type { Prisma } from '@/generated/prisma/client'
import { prisma } from '../db'
import { ehUuid } from '../erros'
import { totalConsumidoNaJanela } from '../estoque'
import { lerParametros } from '../parametros'

export interface FiltroItens {
  q?: string
  status?: string
  aplicacao?: string
  inativos?: boolean
}

/** RF-11: saldo em tempo real, com status, posição e filtros. */
export async function listarItens(f: FiltroItens) {
  const where: Prisma.ItemWhereInput = { ativo: f.inativos ? undefined : true }
  const q = f.q?.trim()
  if (q) {
    where.OR = [
      { codigo: { contains: q, mode: 'insensitive' } },
      { descricao: { contains: q, mode: 'insensitive' } },
      { iso: { contains: q, mode: 'insensitive' } },
      { classe: { contains: q, mode: 'insensitive' } },
      { posicao: { codigo: { contains: q, mode: 'insensitive' } } },
    ]
  }
  if (f.status === 'ALERTA') where.status = { in: ['ATENCAO', 'CRITICO', 'ZERADO'] }
  else if (f.status === 'CRITICOS') where.status = { in: ['CRITICO', 'ZERADO'] }
  else if (f.status && ['OK', 'ATENCAO', 'CRITICO', 'ZERADO'].includes(f.status))
    where.status = f.status as StatusItem
  if (f.aplicacao) where.aplicacao = f.aplicacao as Prisma.ItemWhereInput['aplicacao']
  return prisma.item.findMany({
    where,
    include: { posicao: { select: { codigo: true } }, fabricante: { select: { nome: true } } },
    orderBy: [{ codigo: 'asc' }],
    take: 500,
  })
}

/** Página do item: dados, fornecedores com preços (RN-05b), histórico e movimentações recentes. */
export async function detalheItem(id: string, perfil: Perfil) {
  if (!ehUuid(id)) return null
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      fabricante: true,
      posicao: true,
      fornecedores: { include: { fornecedor: true } },
      alertas: { where: { fechadoEm: null }, include: { cientePor: { select: { login: true } } } },
    },
  })
  if (!item) return null

  const compras = await prisma.movimentacao.findMany({
    where: { itemId: id, tipo: 'COMPRA' },
    include: { estornadaPor: { select: { id: true } }, usuario: { select: { login: true } } },
    orderBy: { criadoEm: 'desc' },
  })
  const verPrecos = pode(perfil, 'precos:ver')
  const porFornecedor = (
    fornecedorId: string,
  ): (CompraRegistrada & { notaFiscal: string | null; usuario: string })[] =>
    compras
      .filter((c) => c.fornecedorId === fornecedorId)
      .map((c) => ({
        data: c.criadoEm.toISOString(),
        precoUnitario: Number(c.precoUnitario),
        quantidade: c.quantidade,
        estornada: c.estornadaPor !== null,
        notaFiscal: c.notaFiscal,
        usuario: c.usuario.login,
      }))

  const lista = listaDeFornecedores(
    item.fornecedores.map((v) => ({
      fornecedorId: v.fornecedorId,
      nome: v.fornecedor.nomeFantasia ?? v.fornecedor.razaoSocial,
      leadTimeDias: v.leadTimeDias,
      preferencial: v.preferencial,
      compras: porFornecedor(v.fornecedorId),
    })),
  )
  // sem permissão de ver preços, a ordem não pode entregar quem é o mais barato
  const ordenada = verPrecos ? lista : [...lista].sort((a, b) => a.nome.localeCompare(b.nome))
  const fornecedores = ordenada.map((l) => {
    const vinculo = item.fornecedores.find((v) => v.fornecedorId === l.fornecedorId)!
    const historico = historicoComVariacao(porFornecedor(l.fornecedorId)).map((h) => ({
      ...h,
      notaFiscal: porFornecedor(l.fornecedorId).find((c) => c.data === h.data)?.notaFiscal ?? null,
      usuario: porFornecedor(l.fornecedorId).find((c) => c.data === h.data)?.usuario ?? '',
    }))
    return {
      ...l,
      codigoNoFornecedor: vinculo.codigoNoFornecedor,
      ativo: vinculo.fornecedor.ativo,
      // perfil Consulta não vê preços (decisão 10 do doc 01)
      ultimoPreco: verPrecos ? l.ultimoPreco : null,
      dataUltimaCompra: verPrecos ? l.dataUltimaCompra : null,
      historico: verPrecos ? historico : [],
    }
  })

  const parametros = await lerParametros()
  const total = await prisma.$transaction((tx) =>
    totalConsumidoNaJanela(tx, id, parametros.janelaConsumoDias),
  )
  const consumoDiario = consumoMedioDiario({
    totalConsumido: total,
    janelaDias: parametros.janelaConsumoDias,
  })
  const sugestao = sugestaoDeCompra({
    saldo: item.saldo,
    minimo: item.estoqueMinimo,
    pontoReposicao: item.pontoReposicao,
    maximo: item.estoqueMaximo,
    consumoDiario,
    embalagem: item.embalagem,
  })

  // o perfil Consulta não vê o histórico de movimentações (doc 02, seção 5)
  const movimentacoes = !pode(perfil, 'historico:ver')
    ? []
    : await prisma.movimentacao.findMany({
        where: { itemId: id },
        include: {
          usuario: { select: { login: true } },
          destino: { select: { nome: true } },
          colaborador: { select: { nome: true } },
          estornadaPor: { select: { id: true } },
        },
        orderBy: { criadoEm: 'desc' },
        take: 15,
      })

  return {
    item,
    fornecedores,
    verPrecos,
    consumoDiario,
    janela: parametros.janelaConsumoDias,
    sugestao,
    movimentacoes,
  }
}

/** Listas para os formulários de movimentação do item. */
export async function opcoesDeMovimentacao(itemId: string) {
  const [vinculos, destinos, colaboradores] = await Promise.all([
    prisma.itemFornecedor.findMany({
      where: { itemId, fornecedor: { ativo: true } },
      include: { fornecedor: true },
    }),
    prisma.destino.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
    prisma.colaborador.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
  ])
  return {
    fornecedores: vinculos.map((v) => ({
      valor: v.fornecedorId,
      rotulo: v.fornecedor.nomeFantasia ?? v.fornecedor.razaoSocial,
    })),
    destinos: destinos.map((d) => ({ valor: d.id, rotulo: `${d.nome} (${d.codigo})` })),
    colaboradores: colaboradores.map((c) => ({
      valor: c.id,
      rotulo: c.matricula ? `${c.nome} · ${c.matricula}` : c.nome,
    })),
  }
}

export function contarAlertasAbertos() {
  return prisma.alerta.count({ where: { fechadoEm: null, item: { ativo: true } } })
}

export async function listarAlertas() {
  const [abertos, fechados] = await Promise.all([
    prisma.alerta.findMany({
      where: { fechadoEm: null },
      include: { item: { include: { posicao: true } }, cientePor: { select: { login: true } } },
      orderBy: [{ nivel: 'desc' }, { abertoEm: 'asc' }],
    }),
    prisma.alerta.findMany({
      where: { fechadoEm: { not: null } },
      include: { item: true },
      orderBy: { fechadoEm: 'desc' },
      take: 20,
    }),
  ])
  return { abertos, fechados }
}

/** Dados do item para o formulário de edição, e se o código já está travado (RN-01). */
export async function itemParaEdicao(id: string) {
  if (!ehUuid(id)) return null
  const [item, movimentacoes] = await Promise.all([
    prisma.item.findUnique({ where: { id } }),
    prisma.movimentacao.count({ where: { itemId: id } }),
  ])
  return item ? { item, codigoTravado: movimentacoes > 0 } : null
}
