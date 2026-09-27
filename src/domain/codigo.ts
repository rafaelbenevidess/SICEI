/**
 * RF-03 / RN-01: sugestão do próximo código interno. Os códigos seguem uma sequência
 * (PST-001, PST-002…); o sistema propõe o seguinte da sequência mais usada, pulando qualquer
 * código que já exista ou tenha existido (item inativo também conta).
 */

import { mesmaSequencia, normalizarBusca } from './busca'

export const CODIGO_INICIAL = 'PST-001'

interface Sequencia {
  prefixo: string
  maior: number
  digitos: number
  quantos: number
}

/** Separa "PST-012" em prefixo "PST-" e número 12 (com 3 dígitos). */
function partes(codigo: string): { prefixo: string; numero: number; digitos: number } | null {
  const m = /^(.*?)(\d+)$/.exec(codigo.trim().toUpperCase())
  if (!m) return null
  return { prefixo: m[1], numero: Number(m[2]), digitos: m[2].length }
}

/** Próximo código livre da sequência com mais itens (empate: a de prefixo em ordem alfabética). */
export function proximoCodigo(existentes: string[]): string {
  const usados = new Set(existentes.map((c) => c.trim().toUpperCase()))
  const sequencias = new Map<string, Sequencia>()
  for (const c of usados) {
    const p = partes(c)
    if (!p) continue
    const s = sequencias.get(p.prefixo) ?? {
      prefixo: p.prefixo,
      maior: 0,
      digitos: 0,
      quantos: 0,
    }
    s.maior = Math.max(s.maior, p.numero)
    s.digitos = Math.max(s.digitos, p.digitos)
    s.quantos += 1
    sequencias.set(p.prefixo, s)
  }
  const escolhida = [...sequencias.values()].sort(
    (a, b) => b.quantos - a.quantos || a.prefixo.localeCompare(b.prefixo),
  )[0]
  if (!escolhida) return CODIGO_INICIAL
  let n = escolhida.maior + 1
  const montar = (x: number) => `${escolhida.prefixo}${String(x).padStart(escolhida.digitos, '0')}`
  while (usados.has(montar(n))) n += 1
  return montar(n)
}

/**
 * Código já cadastrado que é o mesmo que o digitado, escrito de outro jeito: "pst001", "PST1" e
 * "PST-001" são o mesmo código. Devolve o código existente ou null.
 */
export function codigoEquivalente(codigo: string, existentes: string[]): string | null {
  const c = normalizarBusca(codigo)
  if (!c) return null
  return existentes.find((e) => normalizarBusca(e) === c || mesmaSequencia(codigo, e)) ?? null
}

/** O código digitado já pertence a um item, mesmo escrito de outro jeito? */
export function codigoEmUso(codigo: string, existentes: string[]): boolean {
  return codigoEquivalente(codigo, existentes) !== null
}

/**
 * Deixa o código no padrão da sequência que já existe: com PST-001 cadastrado, "pst8" e
 * "PST-8" viram "PST-008". Sem sequência parecida, só tira os espaços das pontas e põe em
 * maiúsculas.
 */
export function padronizarCodigo(texto: string, existentes: string[]): string {
  const limpo = texto.trim().toUpperCase()
  const m = /^([A-Z]+)(\d+)$/.exec(normalizarBusca(limpo))
  if (!m) return limpo
  const [, letras, numero] = m
  let modelo: { prefixo: string; digitos: number } | null = null
  for (const e of existentes) {
    const p = /^(.*?)(\d+)$/.exec(e.trim().toUpperCase())
    if (!p || normalizarBusca(p[1]) !== letras) continue
    if (!modelo || p[2].length > modelo.digitos) modelo = { prefixo: p[1], digitos: p[2].length }
  }
  if (!modelo) return limpo
  return `${modelo.prefixo}${numero.replace(/^0+(?=\d)/, '').padStart(modelo.digitos, '0')}`
}
