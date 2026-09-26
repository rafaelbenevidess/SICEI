/**
 * Preços por fornecedor (doc 01, RN-05, RN-05a e RN-05b). O histórico vem das
 * movimentações COMPRA; compras estornadas continuam no histórico, marcadas.
 */

export interface CompraRegistrada {
  data: string // ISO 8601
  precoUnitario: number
  quantidade: number
  estornada: boolean
}

export interface FornecedorDoItem {
  fornecedorId: string
  nome: string
  leadTimeDias: number | null
  preferencial: boolean
  compras: CompraRegistrada[]
}

export interface LinhaFornecedor {
  fornecedorId: string
  nome: string
  leadTimeDias: number | null
  preferencial: boolean
  ultimoPreco: number | null
  dataUltimaCompra: string | null
}

export interface LinhaHistorico extends CompraRegistrada {
  /** Variação percentual em relação à compra válida anterior, com 1 casa decimal. */
  variacaoPercentual: number | null
}

function porDataDecrescente(a: CompraRegistrada, b: CompraRegistrada): number {
  return b.data.localeCompare(a.data)
}

/** RN-05a: o último preço é o da compra mais recente que não foi estornada. */
export function ultimoPrecoValido(compras: CompraRegistrada[]): CompraRegistrada | null {
  return [...compras].filter((c) => !c.estornada).sort(porDataDecrescente)[0] ?? null
}

/** RN-05b: fornecedores do menor para o maior último preço; sem compras vão para o fim. */
export function listaDeFornecedores(fornecedores: FornecedorDoItem[]): LinhaFornecedor[] {
  return fornecedores
    .map((f) => {
      const ultima = ultimoPrecoValido(f.compras)
      return {
        fornecedorId: f.fornecedorId,
        nome: f.nome,
        leadTimeDias: f.leadTimeDias,
        preferencial: f.preferencial,
        ultimoPreco: ultima?.precoUnitario ?? null,
        dataUltimaCompra: ultima?.data ?? null,
      }
    })
    .sort((a, b) => {
      if (a.ultimoPreco === null && b.ultimoPreco === null) return a.nome.localeCompare(b.nome)
      if (a.ultimoPreco === null) return 1
      if (b.ultimoPreco === null) return -1
      return a.ultimoPreco - b.ultimoPreco
    })
}

/** Variação percentual arredondada a 1 casa: 37,00 → 37,40 = +1,1. */
export function variacaoPercentual(anterior: number, atual: number): number {
  if (anterior <= 0) throw new Error('O preço anterior precisa ser maior que zero.')
  return Math.round(((atual - anterior) / anterior) * 1000) / 10
}

/**
 * RN-05b: histórico completo, da compra mais recente para a mais antiga,
 * com a variação de cada compra válida em relação à compra válida anterior.
 */
export function historicoComVariacao(compras: CompraRegistrada[]): LinhaHistorico[] {
  const ordenadas = [...compras].sort(porDataDecrescente)
  return ordenadas.map((compra, i) => {
    if (compra.estornada) return { ...compra, variacaoPercentual: null }
    const anterior = ordenadas.slice(i + 1).find((c) => !c.estornada)
    return {
      ...compra,
      variacaoPercentual: anterior
        ? variacaoPercentual(anterior.precoUnitario, compra.precoUnitario)
        : null,
    }
  })
}
