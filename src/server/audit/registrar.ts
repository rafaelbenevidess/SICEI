import 'server-only'
import { calcularHash, HASH_INICIAL, jsonCanonico } from '@/domain/auditoria'
import { Prisma } from '@/generated/prisma/client'
import type { Tx } from '../db'

/** Chave do advisory lock que serializa a gravação do log (doc 03, seção 5.2). */
const CHAVE_LOCK_AUDITORIA = 731_020_26

export interface EventoAuditoria {
  acao: string
  entidade: string
  entidadeId?: string | null
  antes?: unknown
  depois?: unknown
  usuarioId: string | null
  ip: string | null
  userAgent: string | null
}

/** Normaliza para JSON puro: datas viram ISO, Decimal vira texto, chaves ordenadas. */
export function jsonLimpo(valor: unknown): unknown {
  if (valor === undefined || valor === null) return null
  return JSON.parse(jsonCanonico(valor))
}

/** Os dados que entram no hash de um registro. A verificação monta o mesmo objeto a partir da linha gravada. */
export function dadosDoRegistro(r: {
  acao: string
  entidade: string
  entidadeId: string | null
  antes: unknown
  depois: unknown
  usuarioId: string | null
  ip: string | null
  userAgent: string | null
  criadoEm: Date
}) {
  return {
    acao: r.acao,
    entidade: r.entidade,
    entidadeId: r.entidadeId ?? null,
    antes: r.antes ?? null,
    depois: r.depois ?? null,
    usuarioId: r.usuarioId ?? null,
    ip: r.ip ?? null,
    userAgent: r.userAgent ?? null,
    criadoEm: r.criadoEm.toISOString(),
  }
}

/**
 * Grava um registro no log encadeado, dentro da transação do chamador.
 * O advisory lock garante que dois registros não disputem o mesmo "anterior".
 */
export async function registrarAuditoria(tx: Tx, evento: EventoAuditoria): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${CHAVE_LOCK_AUDITORIA}::bigint)`
  const [ultimo] = await tx.$queryRaw<{ seq: bigint; hash: string }[]>`
    SELECT seq, hash FROM audit_log ORDER BY seq DESC LIMIT 1`
  const [{ agora }] = await tx.$queryRaw<{ agora: Date }[]>`SELECT now() AS agora`

  const seq = ultimo ? Number(ultimo.seq) + 1 : 1
  const prevHash = ultimo?.hash ?? HASH_INICIAL
  const antes = jsonLimpo(evento.antes)
  const depois = jsonLimpo(evento.depois)
  const registro = {
    acao: evento.acao,
    entidade: evento.entidade,
    entidadeId: evento.entidadeId ?? null,
    antes,
    depois,
    usuarioId: evento.usuarioId,
    ip: evento.ip,
    userAgent: evento.userAgent,
    criadoEm: agora,
  }
  const hash = await calcularHash(prevHash, seq, dadosDoRegistro(registro))

  await tx.auditLog.create({
    data: {
      seq: BigInt(seq),
      ...registro,
      antes: antes === null ? Prisma.DbNull : (antes as Prisma.InputJsonValue),
      depois: depois === null ? Prisma.DbNull : (depois as Prisma.InputJsonValue),
      prevHash,
      hash,
    },
  })
}
