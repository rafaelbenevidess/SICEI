/** Testes criados pelo avaliador, guardados só no navegador dele (localStorage). */
export interface MeuTeste {
  id: string
  suite: string
  valores: Record<string, string>
  esperado: string
}

const CHAVE = 'simi.laboratorio.meusTestes'

export function lerMeusTestes(): MeuTeste[] {
  try {
    const bruto = globalThis.localStorage?.getItem(CHAVE)
    const lista = bruto ? (JSON.parse(bruto) as unknown) : []
    return Array.isArray(lista) ? (lista as MeuTeste[]) : []
  } catch {
    return []
  }
}

export function gravarMeusTestes(lista: MeuTeste[]): void {
  try {
    globalThis.localStorage?.setItem(CHAVE, JSON.stringify(lista))
  } catch {
    // navegador sem armazenamento: os testes valem só nesta visita
  }
}

export function chaveDaSuite(s: { id: string; titulo: string }): string {
  return `${s.id} · ${s.titulo}`
}
