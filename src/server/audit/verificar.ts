import 'server-only'
import {
  jsonCanonico,
  verificarCadeia,
  type RegistroEncadeado,
  type ResultadoVerificacao,
} from '@/domain/auditoria'
import { prisma } from '../db'
import { dadosDoRegistro, jsonLimpo } from './registrar'

/** RF-21 / RN-09a: recalcula a cadeia inteira do log e confere as movimentações contra o log. */
export async function verificarIntegridade(): Promise<{
  cadeia: ResultadoVerificacao
  movimentacoesDivergentes: string[]
}> {
  const linhas = await prisma.auditLog.findMany({ orderBy: { seq: 'asc' } })
  const registros: RegistroEncadeado[] = linhas.map((l) => ({
    seq: Number(l.seq),
    prevHash: l.prevHash,
    hash: l.hash,
    dados: dadosDoRegistro(l),
  }))
  const cadeia = await verificarCadeia(registros)

  // cada movimentação precisa bater com o registro de auditoria gravado junto com ela
  const porMovimentacao = new Map(
    linhas
      .filter((l) => l.entidade === 'movimentacao' && l.entidadeId)
      .map((l) => [l.entidadeId!, l.depois]),
  )
  const movimentacoes = await prisma.movimentacao.findMany()
  const movimentacoesDivergentes = movimentacoes
    .filter((m) => {
      const registrado = porMovimentacao.get(m.id)
      return !registrado || jsonCanonico(jsonLimpo(m)) !== jsonCanonico(registrado)
    })
    .map((m) => m.id)

  return { cadeia, movimentacoesDivergentes }
}

export interface Divergencia {
  itemId: string
  codigo: string
  saldoGuardado: number
  saldoPelasMovimentacoes: number
}

/** RN-09b: compara o saldo guardado de cada item com a soma das movimentações. */
export async function conferirSaldos(): Promise<Divergencia[]> {
  const linhas = await prisma.$queryRaw<
    { item_id: string; codigo: string; saldo: number; calculado: bigint }[]
  >`
    SELECT i.id AS item_id, i.codigo, i.saldo,
           COALESCE(SUM(
             CASE
               WHEN m.tipo IN ('COMPRA', 'DEVOLUCAO_PRODUCAO', 'AJUSTE_POSITIVO') THEN m.quantidade
               WHEN m.tipo IN ('CONSUMO_PRODUCAO', 'PERDA_QUEBRA', 'AJUSTE_NEGATIVO') THEN -m.quantidade
               WHEN o.tipo IN ('COMPRA', 'DEVOLUCAO_PRODUCAO', 'AJUSTE_POSITIVO') THEN -m.quantidade
               ELSE m.quantidade
             END), 0)::bigint AS calculado
      FROM item i
      LEFT JOIN movimentacao m ON m.item_id = i.id
      LEFT JOIN movimentacao o ON o.id = m.estorna_id
     GROUP BY i.id, i.codigo, i.saldo`
  return linhas
    .filter((l) => Number(l.calculado) !== l.saldo)
    .map((l) => ({
      itemId: l.item_id,
      codigo: l.codigo,
      saldoGuardado: l.saldo,
      saldoPelasMovimentacoes: Number(l.calculado),
    }))
}
