/**
 * Validação de CNPJ (doc 01, RN-04). Aceita o formato numérico e o alfanumérico,
 * em vigor desde julho de 2026: os 12 primeiros caracteres podem ter letras e
 * os 2 dígitos verificadores continuam numéricos. O valor de cada caractere é
 * o código ASCII menos 48, e o cálculo é o módulo 11 de sempre.
 */

const PESOS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const PESOS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

/** Remove pontuação e passa para maiúsculas. */
export function limparCnpj(cnpj: string): string {
  return cnpj.replace(/[.\-/\s]/g, '').toUpperCase()
}

function digitoVerificador(base: string, pesos: number[]): number {
  const soma = [...base].reduce((acc, c, i) => acc + (c.charCodeAt(0) - 48) * pesos[i], 0)
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

export function cnpjValido(cnpj: string): boolean {
  const limpo = limparCnpj(cnpj)
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(limpo)) return false
  if (/^(\d)\1{13}$/.test(limpo)) return false
  const d1 = digitoVerificador(limpo.slice(0, 12), PESOS_1)
  const d2 = digitoVerificador(limpo.slice(0, 12) + d1, PESOS_2)
  return limpo.endsWith(`${d1}${d2}`)
}

/** 11222333000181 → 11.222.333/0001-81 */
export function formatarCnpj(cnpj: string): string {
  const l = limparCnpj(cnpj)
  if (l.length !== 14) return cnpj
  return `${l.slice(0, 2)}.${l.slice(2, 5)}.${l.slice(5, 8)}/${l.slice(8, 12)}-${l.slice(12)}`
}
