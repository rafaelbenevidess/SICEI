import 'server-only'
import { exigirPermissao } from '@/domain/permissoes'
import { registrarAuditoria } from '../audit/registrar'
import { conferirSaldos, verificarIntegridade, type Divergencia } from '../audit/verificar'
import type { Ator } from '../contexto'
import { prisma } from '../db'

export interface ResultadoConferencia {
  cadeiaIntegra: boolean
  registrosConferidos: number
  /** Primeiro registro adulterado, quando a cadeia quebra. */
  adulteracao: { seq: number; motivo: string } | null
  movimentacoesDivergentes: string[]
  saldosDivergentes: Divergencia[]
  itensConferidos: number
  instante: Date
}

/**
 * RF-21 / RN-09a / RN-09b: recalcula a cadeia do log, confere as movimentações com o log e os
 * saldos com as movimentações. A execução e o resultado ficam no log (RN-23).
 */
export async function conferirIntegridade(ator: Ator): Promise<ResultadoConferencia> {
  exigirPermissao(ator.perfil, 'auditoria:ver')
  const [verificacao, saldosDivergentes, itensConferidos] = await Promise.all([
    verificarIntegridade(),
    conferirSaldos(),
    prisma.item.count(),
  ])
  const { cadeia } = verificacao
  const resultado: ResultadoConferencia = {
    cadeiaIntegra: cadeia.integra,
    registrosConferidos: cadeia.integra ? cadeia.verificados : 0,
    adulteracao: cadeia.integra ? null : { seq: cadeia.seq, motivo: cadeia.motivo },
    movimentacoesDivergentes: verificacao.movimentacoesDivergentes,
    saldosDivergentes,
    itensConferidos,
    instante: new Date(),
  }
  await prisma.$transaction((tx) =>
    registrarAuditoria(tx, {
      acao: 'CONFERENCIA_INTEGRIDADE',
      entidade: 'audit_log',
      depois: {
        cadeiaIntegra: resultado.cadeiaIntegra,
        movimentacoesDivergentes: resultado.movimentacoesDivergentes.length,
        saldosDivergentes: resultado.saldosDivergentes.length,
      },
      usuarioId: ator.usuarioId,
      ip: ator.ip,
      userAgent: ator.userAgent,
    }),
  )
  return resultado
}
