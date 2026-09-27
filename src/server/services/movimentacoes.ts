import 'server-only'
import { quantidadeEmUnidades } from '@/domain/estoque'
import {
  ajusteDeInventario,
  avaliarEstorno,
  avaliarMovimentacao,
  type TipoComum,
} from '@/domain/movimentacao'
import { exigirPermissao, permissaoDoTipo } from '@/domain/permissoes'
import { validar } from '@/domain/schemas/comum'
import { schemaEstorno, schemaInventario, schemaMovimentacao } from '@/domain/schemas/movimentacao'
import type { StatusItem } from '@/domain/tipos'
import type { Movimentacao } from '@/generated/prisma/client'
import { registrarAuditoria } from '../audit/registrar'
import type { Ator } from '../contexto'
import { prisma, type Tx } from '../db'
import { ehUuid, ehViolacaoDeUnicidade, ErroDeNegocio, exigirUuid, naoEncontrado } from '../erros'
import { recalcularItem } from '../estoque'

interface ItemTravado {
  id: string
  codigo: string
  saldo: number
  ativo: boolean
  embalagem: number
}

/** RN-08: trava a linha do item até o fim da transação. Outra movimentação do mesmo item espera aqui. */
export async function travarItem(tx: Tx, itemId: string): Promise<ItemTravado> {
  exigirUuid(itemId, 'Item')
  const [item] = await tx.$queryRaw<ItemTravado[]>`
    SELECT id, codigo, saldo, ativo, embalagem FROM item WHERE id = ${itemId}::uuid FOR UPDATE`
  if (!item) throw naoEncontrado('Item')
  return item
}

export interface ResultadoMovimentacao {
  movimentacao: Movimentacao
  saldo: number
  /** Status do item depois da movimentação (RN-17) */
  status: StatusItem
  notificacoes: string[]
}

function auditoriaDaMovimentacao(m: Movimentacao) {
  return {
    id: m.id,
    itemId: m.itemId,
    tipo: m.tipo,
    quantidade: m.quantidade,
    saldoAnterior: m.saldoAnterior,
    saldoPosterior: m.saldoPosterior,
    fornecedorId: m.fornecedorId,
    precoUnitario: m.precoUnitario,
    notaFiscal: m.notaFiscal,
    destinoId: m.destinoId,
    ordemProducao: m.ordemProducao,
    colaboradorId: m.colaboradorId,
    motivo: m.motivo,
    observacao: m.observacao,
    estornaId: m.estornaId,
    usuarioId: m.usuarioId,
    ip: m.ip,
    userAgent: m.userAgent,
    criadoEm: m.criadoEm,
  }
}

async function exigirAtivo(
  buscar: () => Promise<{ ativo: boolean } | null>,
  oQue: string,
  campo: string,
): Promise<void> {
  const r = await buscar()
  if (!r) throw new ErroDeNegocio(`${oQue} não encontrado.`, { [campo]: `${oQue} não encontrado.` })
  if (!r.ativo)
    throw new ErroDeNegocio(`${oQue} está inativo.`, { [campo]: `${oQue} está inativo.` })
}

/** Entrada ou saída (RF-07, RF-08): COMPRA, DEVOLUCAO_PRODUCAO, CONSUMO_PRODUCAO, PERDA_QUEBRA. */
export async function registrarMovimentacao(
  ator: Ator,
  entrada: unknown,
): Promise<ResultadoMovimentacao> {
  const v = validar(schemaMovimentacao, entrada)
  if (!v.ok) throw new ErroDeNegocio('Confira os campos destacados.', v.erros)
  const dados = v.dados
  exigirPermissao(ator.perfil, permissaoDoTipo(dados.tipo))

  return prisma.$transaction(async (tx) => {
    const item = await travarItem(tx, dados.itemId)
    const qtd = quantidadeEmUnidades({
      quantidade: dados.quantidade,
      unidade: dados.unidade,
      embalagem: item.embalagem,
    })
    if (!qtd.ok) throw new ErroDeNegocio(qtd.motivo, { quantidade: qtd.motivo })

    if (dados.tipo === 'COMPRA') {
      if (!ehUuid(dados.fornecedorId))
        throw new ErroDeNegocio('Fornecedor não encontrado.', {
          fornecedorId: 'Fornecedor não encontrado.',
        })
      const vinculo = await tx.itemFornecedor.findUnique({
        where: { itemId_fornecedorId: { itemId: item.id, fornecedorId: dados.fornecedorId } },
        include: { fornecedor: true },
      })
      if (!vinculo) {
        throw new ErroDeNegocio('Este fornecedor não está vinculado ao item.', {
          fornecedorId: 'Fornecedor não vinculado ao item (RN-10).',
        })
      }
      if (!vinculo.fornecedor.ativo)
        throw new ErroDeNegocio('Fornecedor inativo.', { fornecedorId: 'Fornecedor inativo.' })
    }
    if (dados.tipo === 'CONSUMO_PRODUCAO' || dados.tipo === 'DEVOLUCAO_PRODUCAO') {
      if (!ehUuid(dados.destinoId))
        throw new ErroDeNegocio('Destino não encontrado.', { destinoId: 'Destino não encontrado.' })
      if (!ehUuid(dados.colaboradorId))
        throw new ErroDeNegocio('Colaborador não encontrado.', {
          colaboradorId: 'Colaborador não encontrado.',
        })
      await exigirAtivo(
        () => tx.destino.findUnique({ where: { id: dados.destinoId } }),
        'Destino',
        'destinoId',
      )
      await exigirAtivo(
        () => tx.colaborador.findUnique({ where: { id: dados.colaboradorId } }),
        'Colaborador',
        'colaboradorId',
      )
    }

    const decisao = avaliarMovimentacao({
      tipo: dados.tipo,
      quantidade: qtd.valor,
      saldoAtual: item.saldo,
      itemAtivo: item.ativo,
    })
    if (!decisao.ok) throw new ErroDeNegocio(decisao.motivo, { quantidade: decisao.motivo })

    const movimentacao = await tx.movimentacao.create({
      data: {
        itemId: item.id,
        tipo: dados.tipo,
        quantidade: qtd.valor,
        saldoAnterior: decisao.valor.saldoAnterior,
        saldoPosterior: decisao.valor.saldoPosterior,
        fornecedorId: dados.tipo === 'COMPRA' ? dados.fornecedorId : null,
        precoUnitario: dados.tipo === 'COMPRA' ? dados.precoUnitario : null,
        notaFiscal: dados.tipo === 'COMPRA' ? dados.notaFiscal : null,
        destinoId: 'destinoId' in dados ? dados.destinoId : null,
        ordemProducao: dados.tipo === 'CONSUMO_PRODUCAO' ? dados.ordemProducao : null,
        colaboradorId: 'colaboradorId' in dados ? dados.colaboradorId : null,
        motivo: 'motivo' in dados ? dados.motivo : null,
        observacao: dados.observacao ?? null,
        usuarioId: ator.usuarioId,
        ip: ator.ip,
        userAgent: ator.userAgent,
      },
    })
    await tx.item.update({ where: { id: item.id }, data: { saldo: decisao.valor.saldoPosterior } })

    if (dados.tipo === 'COMPRA') {
      await tx.itemFornecedor.update({
        where: { itemId_fornecedorId: { itemId: item.id, fornecedorId: dados.fornecedorId } },
        data: { ultimoPreco: dados.precoUnitario, dataUltimaCompra: movimentacao.criadoEm },
      })
    }

    const recalculo = await recalcularItem(tx, item.id)
    await registrarAuditoria(tx, {
      acao: `MOVIMENTACAO_${dados.tipo}`,
      entidade: 'movimentacao',
      entidadeId: movimentacao.id,
      depois: auditoriaDaMovimentacao(movimentacao),
      usuarioId: ator.usuarioId,
      ip: ator.ip,
      userAgent: ator.userAgent,
    })
    return {
      movimentacao,
      saldo: decisao.valor.saldoPosterior,
      status: recalculo.status,
      notificacoes: recalculo.notificacoes,
    }
  })
}

/** RN-05a: depois de estornar uma compra, o último preço volta para a compra válida anterior. */
async function recalcularUltimoPreco(tx: Tx, itemId: string, fornecedorId: string): Promise<void> {
  const ultima = await tx.movimentacao.findFirst({
    where: { itemId, fornecedorId, tipo: 'COMPRA', estornadaPor: null },
    orderBy: { criadoEm: 'desc' },
  })
  await tx.itemFornecedor.update({
    where: { itemId_fornecedorId: { itemId, fornecedorId } },
    data: {
      ultimoPreco: ultima?.precoUnitario ?? null,
      dataUltimaCompra: ultima?.criadoEm ?? null,
    },
  })
}

/** RN-12 / RF-09: estorno com justificativa, uma única vez. */
export async function estornarMovimentacao(
  ator: Ator,
  entrada: unknown,
): Promise<ResultadoMovimentacao> {
  exigirPermissao(ator.perfil, 'movimentacao:estornar')
  const v = validar(schemaEstorno, entrada)
  if (!v.ok) throw new ErroDeNegocio('Confira os campos destacados.', v.erros)
  const { movimentacaoId, justificativa } = v.dados
  exigirUuid(movimentacaoId, 'Movimentação')

  try {
    return await prisma.$transaction(async (tx) => {
      const original = await tx.movimentacao.findUnique({
        where: { id: movimentacaoId },
        include: { estornadaPor: { select: { id: true } } },
      })
      if (!original) throw naoEncontrado('Movimentação')
      const item = await travarItem(tx, original.itemId)
      const decisao = avaliarEstorno({
        original: {
          tipo: original.tipo,
          quantidade: original.quantidade,
          jaEstornada: original.estornadaPor !== null,
        },
        saldoAtual: item.saldo,
        justificativa,
        itemAtivo: item.ativo,
      })
      if (!decisao.ok) throw new ErroDeNegocio(decisao.motivo)

      const estorno = await tx.movimentacao.create({
        data: {
          itemId: item.id,
          tipo: 'ESTORNO',
          quantidade: original.quantidade,
          saldoAnterior: decisao.valor.saldoAnterior,
          saldoPosterior: decisao.valor.saldoPosterior,
          motivo: justificativa,
          estornaId: original.id,
          usuarioId: ator.usuarioId,
          ip: ator.ip,
          userAgent: ator.userAgent,
        },
      })
      await tx.item.update({
        where: { id: item.id },
        data: { saldo: decisao.valor.saldoPosterior },
      })
      if (original.tipo === 'COMPRA' && original.fornecedorId) {
        await recalcularUltimoPreco(tx, item.id, original.fornecedorId)
      }
      const recalculo = await recalcularItem(tx, item.id)
      await registrarAuditoria(tx, {
        acao: 'MOVIMENTACAO_ESTORNO',
        entidade: 'movimentacao',
        entidadeId: estorno.id,
        antes: { estornada: original.id, tipoOriginal: original.tipo },
        depois: auditoriaDaMovimentacao(estorno),
        usuarioId: ator.usuarioId,
        ip: ator.ip,
        userAgent: ator.userAgent,
      })
      return {
        movimentacao: estorno,
        saldo: decisao.valor.saldoPosterior,
        status: recalculo.status,
        notificacoes: recalculo.notificacoes,
      }
    })
  } catch (e) {
    // duas pessoas estornando ao mesmo tempo: o índice único de estorna_id barra a segunda
    if (ehViolacaoDeUnicidade(e)) throw new ErroDeNegocio('Esta movimentação já foi estornada.')
    throw e
  }
}

/** RN-13 / RF-10: inventário gera o ajuste da diferença, ou só registra a conferência. */
export async function registrarInventario(
  ator: Ator,
  entrada: unknown,
): Promise<{ ajuste: Movimentacao | null; saldo: number; notificacoes: string[] }> {
  exigirPermissao(ator.perfil, 'movimentacao:ajuste')
  const v = validar(schemaInventario, entrada)
  if (!v.ok) throw new ErroDeNegocio('Confira os campos destacados.', v.erros)
  const { itemId, contado, justificativa } = v.dados

  return prisma.$transaction(async (tx) => {
    const item = await travarItem(tx, itemId)
    if (!item.ativo) throw new ErroDeNegocio('Item inativo não recebe movimentação.')
    const decisao = ajusteDeInventario({ saldo: item.saldo, contado })
    if (!decisao.ok) throw new ErroDeNegocio(decisao.motivo, { contado: decisao.motivo })

    const auditoriaBase = { usuarioId: ator.usuarioId, ip: ator.ip, userAgent: ator.userAgent }
    if (decisao.valor === null) {
      await registrarAuditoria(tx, {
        acao: 'INVENTARIO_CONFERIDO',
        entidade: 'item',
        entidadeId: item.id,
        depois: { saldo: item.saldo, contado, justificativa },
        ...auditoriaBase,
      })
      return { ajuste: null, saldo: item.saldo, notificacoes: [] }
    }

    const tipo: TipoComum = decisao.valor.tipo
    const quantidade = decisao.valor.quantidade
    const saldoPosterior = contado
    const ajuste = await tx.movimentacao.create({
      data: {
        itemId: item.id,
        tipo,
        quantidade,
        saldoAnterior: item.saldo,
        saldoPosterior,
        motivo: justificativa,
        usuarioId: ator.usuarioId,
        ip: ator.ip,
        userAgent: ator.userAgent,
      },
    })
    await tx.item.update({ where: { id: item.id }, data: { saldo: saldoPosterior } })
    const recalculo = await recalcularItem(tx, item.id)
    await registrarAuditoria(tx, {
      acao: `MOVIMENTACAO_${tipo}`,
      entidade: 'movimentacao',
      entidadeId: ajuste.id,
      antes: { saldo: item.saldo, contado },
      depois: auditoriaDaMovimentacao(ajuste),
      ...auditoriaBase,
    })
    return { ajuste, saldo: saldoPosterior, notificacoes: recalculo.notificacoes }
  })
}
