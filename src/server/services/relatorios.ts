import 'server-only'
import { exigirPermissao } from '@/domain/permissoes'
import { registrarAuditoria } from '../audit/registrar'
import type { Ator } from '../contexto'
import { prisma } from '../db'

/** RN-23: a exportação de relatórios fica no log de auditoria. */
export async function registrarExportacao(
  ator: Ator,
  dados: Record<string, unknown>,
): Promise<void> {
  exigirPermissao(ator.perfil, 'relatorios:ver')
  await prisma.$transaction((tx) =>
    registrarAuditoria(tx, {
      acao: 'RELATORIO_EXPORTADO',
      entidade: 'relatorio',
      depois: dados,
      usuarioId: ator.usuarioId,
      ip: ator.ip,
      userAgent: ator.userAgent,
    }),
  )
}
