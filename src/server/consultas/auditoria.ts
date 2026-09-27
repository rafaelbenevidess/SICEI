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
  if (f.acao?.trim()) where.acao = f.acao.trim().toUpperCase()
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

/** RF-26: últimas alterações de parâmetros, lidas do log. */
export async function historicoDeParametros(quantos = 10) {
  const linhas = await prisma.auditLog.findMany({
    where: { acao: 'PARAMETROS_ALTERADOS' },
    orderBy: { seq: 'desc' },
    take: quantos,
  })
  const ids = [...new Set(linhas.map((l) => l.usuarioId).filter((x): x is string => !!x))]
  const logins = new Map(
    (
      await prisma.usuario.findMany({
        where: { id: { in: ids } },
        select: { id: true, login: true },
      })
    ).map((u) => [u.id, u.login]),
  )
  return linhas.map((l) => ({
    antes: l.antes,
    depois: l.depois,
    quando: l.criadoEm,
    login: l.usuarioId ? (logins.get(l.usuarioId) ?? '?') : 'sistema',
  }))
}

/** Ações que já aparecem no log, para o filtro não esconder nenhuma (RF-21). */
export async function acoesGravadas(): Promise<string[]> {
  const linhas = await prisma.auditLog.findMany({ distinct: ['acao'], select: { acao: true } })
  return linhas.map((l) => l.acao)
}
