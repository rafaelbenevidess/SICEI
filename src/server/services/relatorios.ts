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

/** RN-23: a exportação da lista de itens (saldo, sem preços) também fica no log. */
export async function registrarExportacaoDeItens(
  ator: Ator,
  dados: Record<string, unknown>,
): Promise<void> {
  exigirPermissao(ator.perfil, 'saldo:ver')
  await prisma.$transaction((tx) =>
    registrarAuditoria(tx, {
      acao: 'RELATORIO_EXPORTADO',
      entidade: 'relatorio',
      depois: { tipo: 'itens', ...dados },
      usuarioId: ator.usuarioId,
      ip: ator.ip,
      userAgent: ator.userAgent,
    }),
  )
}

/** RN-23: a exportação do histórico de movimentações também fica no log. */
export async function registrarExportacaoDeMovimentacoes(
  ator: Ator,
  dados: Record<string, unknown>,
): Promise<void> {
  exigirPermissao(ator.perfil, 'historico:ver')
  await prisma.$transaction((tx) =>
    registrarAuditoria(tx, {
      acao: 'RELATORIO_EXPORTADO',
      entidade: 'relatorio',
      depois: { tipo: 'movimentacoes', ...dados },
      usuarioId: ator.usuarioId,
      ip: ator.ip,
      userAgent: ator.userAgent,
    }),
  )
}
