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

/** Máscara enquanto digita: aplica a pontuação conforme os caracteres chegam (até 14). */
export function mascararCnpj(valor: string): string {
  const l = limparCnpj(valor)
    .replace(/[^0-9A-Z]/g, '')
    .slice(0, 14)
  const partes = [l.slice(0, 2), l.slice(2, 5), l.slice(5, 8), l.slice(8, 12), l.slice(12, 14)]
  let r = partes[0]
  if (partes[1]) r += `.${partes[1]}`
  if (partes[2]) r += `.${partes[2]}`
  if (partes[3]) r += `/${partes[3]}`
  if (partes[4]) r += `-${partes[4]}`
  return r
}

export type SituacaoCnpj =
  | { estado: 'vazio' | 'incompleto'; mensagem: null }
  | { estado: 'invalido' | 'duplicado' | 'valido'; mensagem: string }

/**
 * Situação do CNPJ digitado no cadastro rápido de fornecedor (RN-04):
 * incompleto, dígito verificador inválido, já cadastrado ou válido.
 * existentes: CNPJ limpo → nome do fornecedor que já usa.
 */
export function situacaoDoCnpj(valor: string, existentes: Record<string, string>): SituacaoCnpj {
  const l = limparCnpj(valor)
  if (!l) return { estado: 'vazio', mensagem: null }
  if (l.length < 14) return { estado: 'incompleto', mensagem: null }
  if (!cnpjValido(l)) return { estado: 'invalido', mensagem: 'Dígito verificador inválido.' }
  if (existentes[l])
    return { estado: 'duplicado', mensagem: `CNPJ já cadastrado (${existentes[l]}).` }
  return { estado: 'valido', mensagem: 'CNPJ válido.' }
}
