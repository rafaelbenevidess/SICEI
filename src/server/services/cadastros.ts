import 'server-only'
import { codigoEquivalente, padronizarCodigo } from '@/domain/codigo'
import { avaliarAtribuicao, codigoDaPosicao } from '@/domain/posicao'
import { exigirPermissao } from '@/domain/permissoes'
import { validar } from '@/domain/schemas/comum'
import {
  schemaColaborador,
  schemaDestino,
  schemaFabricante,
  schemaFornecedor,
  schemaFornecedorRapido,
  schemaItem,
  schemaLimites,
  schemaPosicao,
  schemaVinculoFornecedor,
} from '@/domain/schemas/cadastros'
import type { z } from 'zod'
import { registrarAuditoria } from '../audit/registrar'
import type { Ator } from '../contexto'
import { prisma, type Tx } from '../db'
import { ehViolacaoDeUnicidade, ErroDeNegocio, exigirUuid, naoEncontrado } from '../erros'
import { recalcularItem } from '../estoque'

function validarOuFalhar<S extends z.ZodType>(schema: S, entrada: unknown): z.output<S> {
  const v = validar(schema, entrada)
  if (!v.ok) throw new ErroDeNegocio('Confira os campos destacados.', v.erros)
  return v.dados
}

async function auditar(
  tx: Tx,
  ator: Ator,
  acao: string,
  entidade: string,
  entidadeId: string,
  antes: unknown,
  depois: unknown,
): Promise<void> {
  await registrarAuditoria(tx, {
    acao,
    entidade,
    entidadeId,
    antes,
    depois,
    usuarioId: ator.usuarioId,
    ip: ator.ip,
    userAgent: ator.userAgent,
  })
}

/** Traduz violação de unicidade na mensagem do campo. */
async function comUnicidade<T>(campo: string, mensagem: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (ehViolacaoDeUnicidade(e)) throw new ErroDeNegocio(mensagem, { [campo]: mensagem })
    throw e
  }
}

// ---------------- Fabricantes (RF-04) ----------------

export async function salvarFabricante(ator: Ator, entrada: unknown, id?: string) {
  exigirPermissao(ator.perfil, 'cadastros:editar')
  const dados = validarOuFalhar(schemaFabricante, entrada)
  const nomeChave = dados.nome.trim().toLowerCase()
  return comUnicidade('nome', 'Já existe um fabricante com este nome.', () =>
    prisma.$transaction(async (tx) => {
      if (id) {
        exigirUuid(id, 'Fabricante')
        const antes = await tx.fabricante.findUnique({ where: { id } })
        if (!antes) throw naoEncontrado('Fabricante')
        const f = await tx.fabricante.update({
          where: { id },
          data: { nome: dados.nome, nomeChave },
        })
        await auditar(tx, ator, 'FABRICANTE_ALTERADO', 'fabricante', id, antes, f)
        return f
      }
      const f = await tx.fabricante.create({ data: { nome: dados.nome, nomeChave } })
      await auditar(tx, ator, 'FABRICANTE_CRIADO', 'fabricante', f.id, null, f)
      return f
    }),
  )
}

// ---------------- Fornecedores (RF-05) ----------------

export async function salvarFornecedor(ator: Ator, entrada: unknown, id?: string) {
  exigirPermissao(ator.perfil, 'cadastros:editar')
  const dados = validarOuFalhar(schemaFornecedor, entrada)
  const data = {
    razaoSocial: dados.razaoSocial,
    nomeFantasia: dados.nomeFantasia ?? null,
    cnpj: dados.cnpj,
    telefone: dados.telefone ?? null,
    contato: dados.contato ?? null,
  }
  return comUnicidade('cnpj', 'Já existe um fornecedor com este CNPJ.', () =>
    prisma.$transaction(async (tx) => {
      if (id) {
        exigirUuid(id, 'Fornecedor')
        const antes = await tx.fornecedor.findUnique({ where: { id } })
        if (!antes) throw naoEncontrado('Fornecedor')
        const f = await tx.fornecedor.update({ where: { id }, data })
        await auditar(tx, ator, 'FORNECEDOR_ALTERADO', 'fornecedor', id, antes, f)
        return f
      }
      const f = await tx.fornecedor.create({ data })
      await auditar(tx, ator, 'FORNECEDOR_CRIADO', 'fornecedor', f.id, null, f)
      return f
    }),
  )
}

// ---------------- Destinos (RF-06) e colaboradores (RF-27) ----------------

export async function salvarDestino(ator: Ator, entrada: unknown, id?: string) {
  exigirPermissao(ator.perfil, 'cadastros:editar')
  const dados = validarOuFalhar(schemaDestino, entrada)
  return comUnicidade('codigo', 'Já existe um destino com este código.', () =>
    prisma.$transaction(async (tx) => {
      if (id) {
        exigirUuid(id, 'Destino')
        const antes = await tx.destino.findUnique({ where: { id } })
        if (!antes) throw naoEncontrado('Destino')
        const d = await tx.destino.update({ where: { id }, data: dados })
        await auditar(tx, ator, 'DESTINO_ALTERADO', 'destino', id, antes, d)
        return d
      }
      const d = await tx.destino.create({ data: dados })
      await auditar(tx, ator, 'DESTINO_CRIADO', 'destino', d.id, null, d)
      return d
    }),
  )
}

export async function salvarColaborador(ator: Ator, entrada: unknown, id?: string) {
  exigirPermissao(ator.perfil, 'cadastros:editar')
  const dados = validarOuFalhar(schemaColaborador, entrada)
  const data = { nome: dados.nome, setor: dados.setor, matricula: dados.matricula ?? null }
  return comUnicidade('matricula', 'Já existe um colaborador com esta matrícula.', () =>
    prisma.$transaction(async (tx) => {
      if (id) {
        exigirUuid(id, 'Colaborador')
        const antes = await tx.colaborador.findUnique({ where: { id } })
        if (!antes) throw naoEncontrado('Colaborador')
        const c = await tx.colaborador.update({ where: { id }, data })
        await auditar(tx, ator, 'COLABORADOR_ALTERADO', 'colaborador', id, antes, c)
        return c
      }
      const c = await tx.colaborador.create({ data })
      await auditar(tx, ator, 'COLABORADOR_CRIADO', 'colaborador', c.id, null, c)
      return c
    }),
  )
}

// ---------------- Posições (RF-28, RN-25) ----------------

export async function criarPosicao(ator: Ator, entrada: unknown) {
  exigirPermissao(ator.perfil, 'cadastros:editar')
  const dados = validarOuFalhar(schemaPosicao, entrada)
  const codigo = codigoDaPosicao(dados)
  if (!codigo.ok) throw new ErroDeNegocio(codigo.motivo)
  return comUnicidade('armario', `A posição ${codigo.valor} já existe.`, () =>
    prisma.$transaction(async (tx) => {
      const p = await tx.posicao.create({ data: { ...dados, codigo: codigo.valor } })
      await auditar(tx, ator, 'POSICAO_CRIADA', 'posicao', p.id, null, p)
      return p
    }),
  )
}

// ---------------- Situação (RN-02: nada com histórico é apagado, só inativado) ----------------

type EntidadeSimples = 'fabricante' | 'fornecedor' | 'destino' | 'colaborador' | 'posicao'

export async function alterarSituacao(
  ator: Ator,
  entidade: EntidadeSimples,
  id: string,
  ativo: boolean,
) {
  exigirPermissao(ator.perfil, 'cadastros:editar')
  exigirUuid(id, 'Cadastro')
  await prisma.$transaction(async (tx) => {
    // o Prisma não aceita um delegate genérico; cada caso é explícito
    const antes =
      entidade === 'fabricante'
        ? await tx.fabricante.findUnique({ where: { id } })
        : entidade === 'fornecedor'
          ? await tx.fornecedor.findUnique({ where: { id } })
          : entidade === 'destino'
            ? await tx.destino.findUnique({ where: { id } })
            : entidade === 'colaborador'
              ? await tx.colaborador.findUnique({ where: { id } })
              : await tx.posicao.findUnique({ where: { id } })
    if (!antes) throw naoEncontrado('Cadastro')
    if (entidade === 'posicao' && !ativo && (antes as { itemId: string | null }).itemId) {
      throw new ErroDeNegocio('Retire o item da posição antes de inativá-la.')
    }
    const data = { ativo }
    if (entidade === 'fabricante') await tx.fabricante.update({ where: { id }, data })
    else if (entidade === 'fornecedor') await tx.fornecedor.update({ where: { id }, data })
    else if (entidade === 'destino') await tx.destino.update({ where: { id }, data })
    else if (entidade === 'colaborador') await tx.colaborador.update({ where: { id }, data })
    else await tx.posicao.update({ where: { id }, data })
    await auditar(
      tx,
      ator,
      `${entidade.toUpperCase()}_${ativo ? 'REATIVADO' : 'INATIVADO'}`,
      entidade,
      id,
      { ativo: antes.ativo },
      { ativo },
    )
  })
}

// ---------------- Itens (RF-03, RF-12, RN-01, RN-03, RN-14) ----------------

/**
 * RN-01: o código entra no padrão da sequência ("pst8" vira PST-008) e não pode ser o mesmo de
 * outro item escrito de outro jeito ("PST1" e PST-001). O índice único do banco só pega a
 * igualdade exata; esta checagem pega o resto.
 */
async function codigoPadronizadoELivre(
  tx: Tx,
  codigo: string,
  ignorarId?: string,
): Promise<string> {
  const outros = (
    await tx.item.findMany({
      where: ignorarId ? { id: { not: ignorarId } } : undefined,
      select: { codigo: true },
    })
  ).map((i) => i.codigo)
  const padronizado = padronizarCodigo(codigo, outros)
  const igual = codigoEquivalente(padronizado, outros)
  if (igual) {
    throw new ErroDeNegocio(`O código ${igual} já existe (RN-01).`, {
      codigo:
        igual === padronizado
          ? `${igual} já está em uso.`
          : `${codigo} é o mesmo código que ${igual}, já em uso.`,
    })
  }
  return padronizado
}

/** Na criação, o item já nasce com o primeiro fornecedor (RN-05). */
export async function criarItem(
  ator: Ator,
  entrada: unknown,
  primeiroFornecedor: {
    fornecedorId: string
    leadTimeDias?: number | null
    codigoNoFornecedor?: string | null
  },
) {
  exigirPermissao(ator.perfil, 'cadastros:editar')
  const dados = validarOuFalhar(schemaItem, entrada)
  if (!primeiroFornecedor.fornecedorId) {
    throw new ErroDeNegocio('Informe pelo menos um fornecedor (RN-05).', {
      fornecedorId: 'Escolha o fornecedor.',
    })
  }
  exigirUuid(dados.fabricanteId, 'Fabricante')
  exigirUuid(primeiroFornecedor.fornecedorId, 'Fornecedor')
  return comUnicidade('codigo', 'Já existe um item com este código.', () =>
    prisma.$transaction(async (tx) => {
      const fab = await tx.fabricante.findUnique({ where: { id: dados.fabricanteId } })
      if (!fab?.ativo)
        throw new ErroDeNegocio('Fabricante inválido.', {
          fabricanteId: 'Escolha um fabricante ativo.',
        })
      const forn = await tx.fornecedor.findUnique({
        where: { id: primeiroFornecedor.fornecedorId },
      })
      if (!forn?.ativo)
        throw new ErroDeNegocio('Fornecedor inválido.', {
          fornecedorId: 'Escolha um fornecedor ativo.',
        })
      const codigo = await codigoPadronizadoELivre(tx, dados.codigo)
      const item = await tx.item.create({
        data: {
          codigo,
          descricao: dados.descricao,
          iso: dados.iso ?? null,
          classe: dados.classe ?? null,
          cobertura: dados.cobertura ?? null,
          aplicacao: dados.aplicacao,
          fabricanteId: dados.fabricanteId,
          embalagem: dados.embalagem,
          estoqueMinimo: dados.estoqueMinimo,
          estoqueMaximo: dados.estoqueMaximo ?? null,
          pontoReposicao: dados.estoqueMinimo,
        },
      })
      await tx.itemFornecedor.create({
        data: {
          itemId: item.id,
          fornecedorId: forn.id,
          leadTimeDias: primeiroFornecedor.leadTimeDias ?? null,
          codigoNoFornecedor: primeiroFornecedor.codigoNoFornecedor ?? null,
          preferencial: true,
        },
      })
      await recalcularItem(tx, item.id)
      await auditar(tx, ator, 'ITEM_CRIADO', 'item', item.id, null, item)
      return item
    }),
  )
}

export async function alterarItem(ator: Ator, id: string, entrada: unknown) {
  exigirPermissao(ator.perfil, 'cadastros:editar')
  exigirUuid(id, 'Item')
  const dados = validarOuFalhar(schemaItem, entrada)
  return comUnicidade('codigo', 'Já existe um item com este código.', () =>
    prisma.$transaction(async (tx) => {
      const antes = await tx.item.findUnique({ where: { id } })
      if (!antes) throw naoEncontrado('Item')
      const codigo =
        dados.codigo === antes.codigo
          ? antes.codigo
          : await codigoPadronizadoELivre(tx, dados.codigo, id)
      // RN-01: depois da primeira movimentação, o código fica travado
      if (codigo !== antes.codigo && (await tx.movimentacao.count({ where: { itemId: id } })) > 0) {
        throw new ErroDeNegocio(
          'O código não pode mudar depois da primeira movimentação (RN-01).',
          {
            codigo: 'Código travado: o item já tem movimentações.',
          },
        )
      }
      const item = await tx.item.update({
        where: { id },
        data: {
          codigo,
          descricao: dados.descricao,
          iso: dados.iso ?? null,
          classe: dados.classe ?? null,
          cobertura: dados.cobertura ?? null,
          aplicacao: dados.aplicacao,
          fabricanteId: dados.fabricanteId,
          embalagem: dados.embalagem,
          estoqueMinimo: dados.estoqueMinimo,
          estoqueMaximo: dados.estoqueMaximo ?? null,
        },
      })
      await recalcularItem(tx, id)
      await auditar(tx, ator, 'ITEM_ALTERADO', 'item', id, antes, item)
      return item
    }),
  )
}

/** RF-12: mínimo e máximo. O status é recalculado na hora e a mudança fica no log. */
export async function alterarLimites(ator: Ator, entrada: unknown) {
  exigirPermissao(ator.perfil, 'limites:editar')
  const dados = validarOuFalhar(schemaLimites, entrada)
  exigirUuid(dados.itemId, 'Item')
  return prisma.$transaction(async (tx) => {
    const antes = await tx.item.findUnique({ where: { id: dados.itemId } })
    if (!antes) throw naoEncontrado('Item')
    await tx.item.update({
      where: { id: dados.itemId },
      data: { estoqueMinimo: dados.estoqueMinimo, estoqueMaximo: dados.estoqueMaximo ?? null },
    })
    const r = await recalcularItem(tx, dados.itemId)
    await auditar(
      tx,
      ator,
      'ITEM_LIMITES_ALTERADOS',
      'item',
      dados.itemId,
      { estoqueMinimo: antes.estoqueMinimo, estoqueMaximo: antes.estoqueMaximo },
      { estoqueMinimo: dados.estoqueMinimo, estoqueMaximo: dados.estoqueMaximo ?? null },
    )
    return r
  })
}

/** RN-03: só inativa com saldo zero; libera a posição. Reativar exige pelo menos um fornecedor. */
export async function alterarSituacaoItem(ator: Ator, id: string, ativo: boolean) {
  exigirPermissao(ator.perfil, 'cadastros:editar')
  exigirUuid(id, 'Item')
  await prisma.$transaction(async (tx) => {
    const [item] = await tx.$queryRaw<{ id: string; saldo: number; ativo: boolean }[]>`
      SELECT id, saldo, ativo FROM item WHERE id = ${id}::uuid FOR UPDATE`
    if (!item) throw naoEncontrado('Item')
    if (!ativo && item.saldo > 0) {
      throw new ErroDeNegocio(
        `Só é possível inativar um item com saldo zero. Saldo atual: ${item.saldo}.`,
      )
    }
    if (ativo && (await tx.itemFornecedor.count({ where: { itemId: id } })) === 0) {
      throw new ErroDeNegocio('Vincule pelo menos um fornecedor antes de reativar o item.')
    }
    await tx.item.update({ where: { id }, data: { ativo } })
    if (!ativo)
      await tx.posicao.updateMany({
        where: { itemId: id },
        data: { itemId: null, etiquetaPendente: false },
      })
    await recalcularItem(tx, id)
    await auditar(
      tx,
      ator,
      ativo ? 'ITEM_REATIVADO' : 'ITEM_INATIVADO',
      'item',
      id,
      { ativo: item.ativo },
      { ativo },
    )
  })
}

/** RF-05 / RN-05: vincula ou atualiza um fornecedor do item. Só um preferencial por item. */
export async function vincularFornecedor(ator: Ator, entrada: unknown) {
  exigirPermissao(ator.perfil, 'cadastros:editar')
  const dados = validarOuFalhar(schemaVinculoFornecedor, entrada)
  exigirUuid(dados.itemId, 'Item')
  exigirUuid(dados.fornecedorId, 'Fornecedor')
  return prisma.$transaction(async (tx) => {
    const forn = await tx.fornecedor.findUnique({ where: { id: dados.fornecedorId } })
    if (!forn?.ativo)
      throw new ErroDeNegocio('Fornecedor inválido.', {
        fornecedorId: 'Escolha um fornecedor ativo.',
      })
    if (!(await tx.item.findUnique({ where: { id: dados.itemId } }))) throw naoEncontrado('Item')
    const chave = {
      itemId_fornecedorId: { itemId: dados.itemId, fornecedorId: dados.fornecedorId },
    }
    const antes = await tx.itemFornecedor.findUnique({ where: chave })
    if (dados.preferencial) {
      await tx.itemFornecedor.updateMany({
        where: { itemId: dados.itemId },
        data: { preferencial: false },
      })
    }
    const v = await tx.itemFornecedor.upsert({
      where: chave,
      create: {
        itemId: dados.itemId,
        fornecedorId: dados.fornecedorId,
        codigoNoFornecedor: dados.codigoNoFornecedor ?? null,
        leadTimeDias: dados.leadTimeDias ?? null,
        preferencial: dados.preferencial,
      },
      update: {
        codigoNoFornecedor: dados.codigoNoFornecedor ?? null,
        leadTimeDias: dados.leadTimeDias ?? null,
        preferencial: dados.preferencial,
      },
    })
    await recalcularItem(tx, dados.itemId)
    await auditar(
      tx,
      ator,
      antes ? 'FORNECEDOR_VINCULO_ALTERADO' : 'FORNECEDOR_VINCULADO',
      'item',
      dados.itemId,
      antes,
      v,
    )
    return v
  })
}

/**
 * Cadastro rápido (tela de entrada): cria o fornecedor e o vínculo com o item na mesma
 * transação, com os dois registros no log. O fornecedor novo não vira preferencial.
 */
export async function cadastrarFornecedorParaItem(ator: Ator, entrada: unknown) {
  exigirPermissao(ator.perfil, 'cadastros:editar')
  const dados = validarOuFalhar(schemaFornecedorRapido, entrada)
  exigirUuid(dados.itemId, 'Item')
  return comUnicidade('cnpj', 'Já existe um fornecedor com este CNPJ.', () =>
    prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id: dados.itemId } })
      if (!item) throw naoEncontrado('Item')
      if (!item.ativo) throw new ErroDeNegocio('O item está inativo.')
      const f = await tx.fornecedor.create({
        data: { razaoSocial: dados.razaoSocial, cnpj: dados.cnpj },
      })
      await auditar(tx, ator, 'FORNECEDOR_CRIADO', 'fornecedor', f.id, null, f)
      const v = await tx.itemFornecedor.create({
        data: {
          itemId: item.id,
          fornecedorId: f.id,
          codigoNoFornecedor: dados.codigoNoFornecedor ?? null,
          leadTimeDias: dados.leadTimeDias ?? null,
          preferencial: false,
        },
      })
      await recalcularItem(tx, item.id)
      await auditar(tx, ator, 'FORNECEDOR_VINCULADO', 'item', item.id, null, v)
      return f
    }),
  )
}

/** Critério do RF-05: o último fornecedor de um item ativo não pode ser desvinculado. */
export async function desvincularFornecedor(ator: Ator, itemId: string, fornecedorId: string) {
  exigirPermissao(ator.perfil, 'cadastros:editar')
  exigirUuid(itemId, 'Item')
  exigirUuid(fornecedorId, 'Fornecedor')
  await prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({
      where: { id: itemId },
      include: { fornecedores: true },
    })
    if (!item) throw naoEncontrado('Item')
    const vinculo = item.fornecedores.find((f) => f.fornecedorId === fornecedorId)
    if (!vinculo) throw naoEncontrado('Vínculo')
    if (item.ativo && item.fornecedores.length === 1) {
      throw new ErroDeNegocio('Um item ativo precisa ter pelo menos um fornecedor (RN-05).')
    }
    if ((await tx.movimentacao.count({ where: { itemId, fornecedorId } })) > 0) {
      throw new ErroDeNegocio(
        'Este fornecedor já tem compras deste item; o vínculo faz parte do histórico (RN-02).',
      )
    }
    await tx.itemFornecedor.delete({ where: { itemId_fornecedorId: { itemId, fornecedorId } } })
    await recalcularItem(tx, itemId)
    await auditar(tx, ator, 'FORNECEDOR_DESVINCULADO', 'item', itemId, vinculo, null)
  })
}

/** RN-25: guarda o item numa posição (ou tira, com posicaoId nulo). A troca fica no log. */
export async function atribuirPosicao(ator: Ator, itemId: string, posicaoId: string | null) {
  exigirPermissao(ator.perfil, 'cadastros:editar')
  exigirUuid(itemId, 'Item')
  if (posicaoId) exigirUuid(posicaoId, 'Posição')
  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({ where: { id: itemId }, include: { posicao: true } })
    if (!item) throw naoEncontrado('Item')
    if (!item.ativo) throw new ErroDeNegocio('Item inativo não ocupa posição.')
    const antes = item.posicao?.codigo ?? null
    if (posicaoId) {
      const [pos] = await tx.$queryRaw<
        { id: string; codigo: string; ativo: boolean; item_id: string | null }[]
      >`
        SELECT id, codigo, ativo, item_id FROM posicao WHERE id = ${posicaoId}::uuid FOR UPDATE`
      if (!pos) throw naoEncontrado('Posição')
      const d = avaliarAtribuicao({
        itemId,
        posicaoAtiva: pos.ativo,
        ocupadaPorItemId: pos.item_id,
      })
      if (!d.ok) throw new ErroDeNegocio(d.motivo, { posicaoId: d.motivo })
      if (pos.item_id === itemId) return { codigo: pos.codigo, reimprimirEtiqueta: false }
      await tx.posicao.updateMany({
        where: { itemId },
        data: { itemId: null, etiquetaPendente: false },
      })
      // RN-26: a etiqueta da nova posição precisa ser impressa
      await tx.posicao.update({
        where: { id: posicaoId },
        data: { itemId, etiquetaPendente: true },
      })
      await auditar(
        tx,
        ator,
        'ITEM_POSICAO_ALTERADA',
        'item',
        itemId,
        { posicao: antes },
        { posicao: pos.codigo },
      )
      return { codigo: pos.codigo, reimprimirEtiqueta: true }
    }
    await tx.posicao.updateMany({
      where: { itemId },
      data: { itemId: null, etiquetaPendente: false },
    })
    await auditar(
      tx,
      ator,
      'ITEM_POSICAO_ALTERADA',
      'item',
      itemId,
      { posicao: antes },
      { posicao: null },
    )
    return { codigo: null, reimprimirEtiqueta: false }
  })
}
