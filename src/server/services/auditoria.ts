import 'server-only'
import { exigirPermissao } from '@/domain/permissoes'
import { registrarAuditoria } from '../audit/registrar'
import type { Ator } from '../contexto'
import { prisma } from '../db'

/** RN-23: a execução da conferência e o resultado dela ficam no log. */
export async function registrarConferencia(
  ator: Ator,
  resultado: Record<string, unknown>,
): Promise<void> {
  exigirPermissao(ator.perfil, 'auditoria:ver')
  await prisma.$transaction((tx) =>
    registrarAuditoria(tx, {
      acao: 'CONFERENCIA_INTEGRIDADE',
      entidade: 'audit_log',
      depois: resultado,
      usuarioId: ator.usuarioId,
      ip: ator.ip,
      userAgent: ator.userAgent,
    }),
  )
}
