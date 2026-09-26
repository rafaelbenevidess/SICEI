/**
 * Endereçamento no almoxarifado (doc 01, RN-25): Armário → Gaveta → Compartimento,
 * no formato A01-G03-C04. Um item por compartimento e um compartimento por item.
 */
import { aceita, recusada, type Decisao } from './tipos'

export const LIMITE_NIVEL = 99

export interface EnderecoPosicao {
  armario: number
  gaveta: number
  compartimento: number
}

function nivelValido(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= LIMITE_NIVEL
}

const doisDigitos = (n: number) => String(n).padStart(2, '0')

/** Monta o código da posição, ex.: {1, 3, 4} → A01-G03-C04. */
export function codigoDaPosicao(endereco: EnderecoPosicao): Decisao<string> {
  const { armario, gaveta, compartimento } = endereco
  if (![armario, gaveta, compartimento].every(nivelValido)) {
    return recusada(`Armário, gaveta e compartimento precisam ser inteiros de 1 a ${LIMITE_NIVEL}.`)
  }
  return aceita(`A${doisDigitos(armario)}-G${doisDigitos(gaveta)}-C${doisDigitos(compartimento)}`)
}

/** Lê um código como A01-G03-C04; devolve null se o formato estiver errado. */
export function lerCodigoDaPosicao(codigo: string): EnderecoPosicao | null {
  const m = /^A(\d{2})-G(\d{2})-C(\d{2})$/.exec(codigo.trim().toUpperCase())
  if (!m) return null
  const endereco = { armario: Number(m[1]), gaveta: Number(m[2]), compartimento: Number(m[3]) }
  return [endereco.armario, endereco.gaveta, endereco.compartimento].every(nivelValido)
    ? endereco
    : null
}

/** RN-25: decide se o item pode ser guardado na posição. */
export function avaliarAtribuicao(entrada: {
  itemId: string
  posicaoAtiva: boolean
  ocupadaPorItemId: string | null
}): Decisao<true> {
  const { itemId, posicaoAtiva, ocupadaPorItemId } = entrada
  if (!posicaoAtiva) return recusada('Esta posição está inativa.')
  if (ocupadaPorItemId !== null && ocupadaPorItemId !== itemId)
    return recusada('Esta posição já está ocupada por outro item.')
  return aceita(true)
}
