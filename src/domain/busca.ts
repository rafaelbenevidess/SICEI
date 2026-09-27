/**
 * RF-11: busca de itens que aceita o código escrito de qualquer jeito. "Pst001", "pst 1",
 * "PST-1" e "PST001" acham o PST-001; "a01g01c02" acha a posição A01-G01-C02; "cnmg120408"
 * acha a ISO "CNMG 120408". A pontuação ordena as sugestões: código exato primeiro.
 */

export interface ItemBuscavel {
  codigo: string
  descricao: string
  iso?: string | null
  classe?: string | null
  posicao?: string | null
}

/** Maiúsculas, sem acento e só letras e números: "Pst-001" → "PST001". */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

/** "A01G01C02" → ["A", 1, "G", 1, "C", 2]: letras e números, sem zeros à esquerda. */
function partes(normalizado: string): (string | number)[] {
  return (normalizado.match(/[A-Z]+|\d+/g) ?? []).map((p) => (/^\d/.test(p) ? Number(p) : p))
}

/** Mesma sequência de letras e números, ignorando zeros à esquerda: "PST1" = "PST001". */
export function mesmaSequencia(a: string, b: string): boolean {
  const pa = partes(normalizarBusca(a))
  const pb = partes(normalizarBusca(b))
  return pa.length > 0 && pa.length === pb.length && pa.every((p, i) => p === pb[i])
}

/** Pontos da combinação entre o termo e o item; 0 quer dizer que não combina. */
export function pontuarBusca(termo: string, item: ItemBuscavel): number {
  const t = normalizarBusca(termo)
  if (!t) return 1
  const codigo = normalizarBusca(item.codigo)
  const posicao = item.posicao ? normalizarBusca(item.posicao) : ''
  if (codigo === t || mesmaSequencia(termo, item.codigo)) return 100
  if (posicao && (posicao === t || mesmaSequencia(termo, item.posicao!))) return 90
  if (codigo.startsWith(t)) return 80
  if (codigo.includes(t)) return 60
  if (posicao.includes(t)) return 50
  if (normalizarBusca(item.iso ?? '').includes(t)) return 40
  if (normalizarBusca(item.classe ?? '').includes(t)) return 30
  if (normalizarBusca(item.descricao).includes(t)) return 20
  // várias palavras ("cnmg p25"): cada uma precisa aparecer em algum campo
  // (palavras de um caractere, como o "1" de "pst 1", não bastam para combinar)
  const palavras = termo
    .split(/\s+/)
    .map(normalizarBusca)
    .filter((p) => p.length > 1)
  if (palavras.length > 1) {
    const tudo = [codigo, posicao, item.iso, item.classe, item.descricao]
      .map((c) => normalizarBusca(c ?? ''))
      .join(' ')
    if (palavras.every((p) => tudo.includes(p))) return 10
  }
  return 0
}

/** Itens que combinam com o termo, do mais parecido para o menos; empate pelo código. */
export function buscarItens<T extends ItemBuscavel>(termo: string, itens: T[]): T[] {
  return itens
    .map((item) => ({ item, pontos: pontuarBusca(termo, item) }))
    .filter((r) => r.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos || a.item.codigo.localeCompare(b.item.codigo))
    .map((r) => r.item)
}

/**
 * Busca genérica em opções de uma lista (fornecedor, fabricante, colaborador, destino,
 * posição, login). O primeiro texto é o nome; os outros são apoio (CNPJ, matrícula, setor…).
 * Mesma tolerância da busca de itens.
 */
export function pontuarTexto(termo: string, textos: (string | null | undefined)[]): number {
  const t = normalizarBusca(termo)
  if (!t) return 1
  let melhor = 0
  textos.forEach((texto, i) => {
    if (!texto) return
    const bonus = i === 0 ? 5 : 0
    const n = normalizarBusca(texto)
    const palavrasDoTexto = texto
      .split(/[\s\-/.,()]+/)
      .map(normalizarBusca)
      .filter(Boolean)
    let p = 0
    if (n === t || mesmaSequencia(termo, texto)) p = 95
    else if (n.startsWith(t)) p = 80
    else if (palavrasDoTexto.some((w) => w.startsWith(t))) p = 70
    else if (n.includes(t)) p = 50
    if (p) melhor = Math.max(melhor, p + bonus)
  })
  if (melhor) return melhor
  // várias palavras ("carlos per"): cada uma precisa aparecer em algum texto
  const palavras = termo
    .split(/\s+/)
    .map(normalizarBusca)
    .filter((w) => w.length > 1)
  if (palavras.length > 1) {
    const tudo = textos.map((x) => normalizarBusca(x ?? '')).join(' ')
    if (palavras.every((w) => tudo.includes(w))) return 10
  }
  return 0
}

export interface OpcaoBuscavel {
  valor: string
  rotulo: string
  /** textos que também servem para achar a opção (CNPJ, matrícula, código…) */
  busca?: string[]
}

/** Opções que combinam, da mais parecida para a menos; empate na ordem original. */
export function buscarOpcoes<T extends OpcaoBuscavel>(termo: string, opcoes: T[]): T[] {
  return opcoes
    .map((o, i) => ({ o, i, p: pontuarTexto(termo, [o.rotulo, ...(o.busca ?? [])]) }))
    .filter((r) => r.p > 0)
    .sort((a, b) => b.p - a.p || a.i - b.i)
    .map((r) => r.o)
}
