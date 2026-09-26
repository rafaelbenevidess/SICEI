import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { fimDoDia, inicioDoDia } from '@/lib/formatar'
import { prisma } from '../db'

export const POR_PAGINA_LOG = 50

/** RF-21: log de auditoria filtrável. */
export async function listarAuditoria(
  f: { de?: string; ate?: string; acao?: string; usuario?: string },
  pagina = 1,
) {
  const where: Prisma.AuditLogWhereInput = {}
  const de = f.de ? inicioDoDia(f.de) : null
  const ate = f.ate ? fimDoDia(f.ate) : null
  if (de || ate) where.criadoEm = { ...(de ? { gte: de } : {}), ...(ate ? { lte: ate } : {}) }
  if (f.acao?.trim()) where.acao = { contains: f.acao.trim().toUpperCase() }
  if (f.usuario?.trim()) {
    const usuarios = await prisma.usuario.findMany({
      where: { login: { contains: f.usuario.trim().toLowerCase() } },
      select: { id: true },
    })
    where.usuarioId = { in: usuarios.map((u) => u.id) }
  }
  const [total, linhas] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { seq: 'desc' },
      skip: (Math.max(1, pagina) - 1) * POR_PAGINA_LOG,
      take: POR_PAGINA_LOG,
    }),
  ])
  const ids = [...new Set(linhas.map((l) => l.usuarioId).filter((x): x is string => !!x))]
  const logins = new Map(
    (
      await prisma.usuario.findMany({
        where: { id: { in: ids } },
        select: { id: true, login: true },
      })
    ).map((u) => [u.id, u.login]),
  )
  return {
    total,
    paginas: Math.max(1, Math.ceil(total / POR_PAGINA_LOG)),
    linhas: linhas.map((l) => ({
      ...l,
      seq: Number(l.seq),
      login: l.usuarioId ? (logins.get(l.usuarioId) ?? '?') : 'sistema',
    })),
  }
}
