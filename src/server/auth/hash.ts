import 'server-only'
import { hash, verify } from '@node-rs/argon2'

// Argon2id com os parâmetros recomendados pela OWASP (19 MiB, 2 iterações, 1 via).
const OPCOES = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const

export function hashDeSenha(senha: string): Promise<string> {
  return hash(senha, OPCOES)
}

export async function senhaConfere(hashGuardado: string, senha: string): Promise<boolean> {
  try {
    return await verify(hashGuardado, senha)
  } catch {
    return false
  }
}

// Hash de uma senha qualquer, usado quando o login não existe: o tempo de resposta fica
// parecido com o de um login existente, e ninguém descobre quais logins existem medindo o tempo.
let hashFicticio: Promise<string> | null = null
export async function gastarTempoComoSeVerificasse(senha: string): Promise<void> {
  hashFicticio ??= hashDeSenha('senha-ficticia-para-equalizar-tempo')
  await senhaConfere(await hashFicticio, senha)
}
