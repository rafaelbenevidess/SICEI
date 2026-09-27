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

/**
 * Prévia do login na tela de novo usuário (RF-02): o mesmo cálculo do servidor, com a
 * explicação da regra. Sem nome ou sobrenome ainda, não há prévia.
 */
export function previaDoLogin(
  nome: string,
  sobrenome: string,
  loginsExistentes: string[],
): { login: string; nota: string } | null {
  if (palavras(nome).length === 0 || palavras(sobrenome).length === 0) return null
  const base = loginBase(nome, sobrenome)
  const login = gerarLogin(nome, sobrenome, loginsExistentes)
  return {
    login,
    nota:
      login === base
        ? 'Sem acentos, sem partículas, último sobrenome.'
        : `${base} já existe ou existiu: recebe o próximo número livre.`,
  }
}
