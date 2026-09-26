/**
 * Log de auditoria encadeado (doc 01, RN-09a; doc 03, seção 5.2).
 * hash = SHA-256( prev_hash || seq || JSON canônico do registro ).
 * Usa a Web Crypto, que existe no Node e no navegador (o Laboratório usa estas funções).
 */

export const HASH_INICIAL = '0'.repeat(64)

type Json = null | boolean | number | string | Json[] | { [k: string]: Json }

/** JSON com as chaves em ordem alfabética, para o mesmo registro gerar sempre o mesmo texto. */
export function jsonCanonico(valor: unknown): string {
  const normalizar = (v: unknown): Json => {
    if (v === null || v === undefined) return null
    if (v instanceof Date) return v.toISOString()
    if (Array.isArray(v)) return v.map(normalizar)
    if (typeof v === 'object') {
      const obj = v as Record<string, unknown>
      return Object.keys(obj)
        .filter((k) => obj[k] !== undefined)
        .sort()
        .reduce<Record<string, Json>>((acc, k) => {
          acc[k] = normalizar(obj[k])
          return acc
        }, {})
    }
    if (typeof v === 'bigint') return v.toString()
    return v as Json
  }
  return JSON.stringify(normalizar(valor))
}

export async function sha256Hex(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function calcularHash(prevHash: string, seq: number, dados: unknown): Promise<string> {
  return sha256Hex(`${prevHash}|${seq}|${jsonCanonico(dados)}`)
}

export interface RegistroEncadeado<T = unknown> {
  seq: number
  dados: T
  prevHash: string
  hash: string
}

/** Encadeia uma lista de registros a partir de um hash anterior. */
export async function encadear<T>(
  registros: { seq: number; dados: T }[],
  prevHashInicial = HASH_INICIAL,
): Promise<RegistroEncadeado<T>[]> {
  const saida: RegistroEncadeado<T>[] = []
  let prev = prevHashInicial
  for (const r of registros) {
    const hash = await calcularHash(prev, r.seq, r.dados)
    saida.push({ seq: r.seq, dados: r.dados, prevHash: prev, hash })
    prev = hash
  }
  return saida
}

export type ResultadoVerificacao =
  { integra: true; verificados: number } | { integra: false; seq: number; motivo: string }

/**
 * Percorre a cadeia em ordem e aponta o primeiro registro em que a conta não fecha.
 * Detecta registro alterado, removido, inserido ou fora de ordem.
 */
export async function verificarCadeia(
  registros: RegistroEncadeado[],
  prevHashInicial = HASH_INICIAL,
): Promise<ResultadoVerificacao> {
  let prev = prevHashInicial
  let seqAnterior: number | null = null
  for (const r of registros) {
    if (seqAnterior !== null && r.seq !== seqAnterior + 1) {
      return {
        integra: false,
        seq: r.seq,
        motivo: `Sequência quebrada: depois do registro ${seqAnterior} veio o ${r.seq}.`,
      }
    }
    if (r.prevHash !== prev) {
      return {
        integra: false,
        seq: r.seq,
        motivo: 'O registro não aponta para o hash do registro anterior.',
      }
    }
    const esperado = await calcularHash(prev, r.seq, r.dados)
    if (esperado !== r.hash) {
      return {
        integra: false,
        seq: r.seq,
        motivo: 'O conteúdo do registro foi alterado depois de gravado.',
      }
    }
    prev = r.hash
    seqAnterior = r.seq
  }
  return { integra: true, verificados: registros.length }
}
