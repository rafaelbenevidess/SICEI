/**
 * Geração de login a partir do nome (doc 01, RN-21 e RN-21b).
 * Formato nome.sobrenome, minúsculas, sem acentos; login nunca é reaproveitado.
 */

export const PARTICULAS = [
  'de',
  'da',
  'do',
  'dos',
  'das',
  'e',
  'di',
  'du',
  'del',
  'van',
  'von',
] as const

/** Remove acentos e tudo que não for letra, e passa para minúsculas. */
export function normalizarParte(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

function palavras(texto: string): string[] {
  return texto
    .trim()
    .split(/\s+/)
    .map(normalizarParte)
    .filter((p) => p.length > 0 && !(PARTICULAS as readonly string[]).includes(p))
}

/** Primeiro nome + último sobrenome, ignorando partículas. */
export function loginBase(nome: string, sobrenome: string): string {
  const primeiro = palavras(nome)[0]
  const ultimo = palavras(sobrenome).at(-1)
  if (!primeiro) throw new Error('Informe o nome do funcionário.')
  if (!ultimo) throw new Error('Informe o sobrenome do funcionário.')
  return `${primeiro}.${ultimo}`
}

/**
 * Gera o login. Se a base já existe ou já existiu (inclusive de usuário inativo),
 * acrescenta o menor número livre a partir de 2: joao.silva2, joao.silva3...
 */
export function gerarLogin(nome: string, sobrenome: string, loginsExistentes: string[]): string {
  const base = loginBase(nome, sobrenome)
  const existentes = new Set(loginsExistentes.map((l) => l.toLowerCase()))
  if (!existentes.has(base)) return base
  let n = 2
  while (existentes.has(`${base}${n}`)) n++
  return `${base}${n}`
}
