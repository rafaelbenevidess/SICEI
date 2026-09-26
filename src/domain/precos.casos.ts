import type { CasoDeTeste } from './tipos'
import type { CompraRegistrada } from './precos'

/** Exemplo do doc 01 (RN-05b): compras do Fornecedor A. */
export const comprasFornecedorA: CompraRegistrada[] = [
  { data: '2026-05-03', precoUnitario: 37.0, quantidade: 50, estornada: false },
  { data: '2026-07-10', precoUnitario: 37.4, quantidade: 30, estornada: false },
  { data: '2026-09-02', precoUnitario: 38.9, quantidade: 40, estornada: false },
]

export const casosVariacao: CasoDeTeste<{ anterior: number; atual: number }, number>[] = [
  {
    descricao: 'exemplo do doc 01: R$ 37,40 → R$ 38,90 = +4,0%',
    entrada: { anterior: 37.4, atual: 38.9 },
    esperado: 4,
  },
  {
    descricao: 'exemplo do doc 01: R$ 37,00 → R$ 37,40 = +1,1%',
    entrada: { anterior: 37.0, atual: 37.4 },
    esperado: 1.1,
  },
  {
    descricao: 'queda de preço: R$ 40,00 → R$ 36,00 = −10%',
    entrada: { anterior: 40, atual: 36 },
    esperado: -10,
  },
  { descricao: 'preço igual → 0%', entrada: { anterior: 25.5, atual: 25.5 }, esperado: 0 },
]

export const casosUltimoPreco: CasoDeTeste<CompraRegistrada[], number | null>[] = [
  {
    descricao: 'exemplo do doc 01: último preço do Fornecedor A é R$ 38,90',
    entrada: comprasFornecedorA,
    esperado: 38.9,
  },
  {
    descricao: 'critério do RF-05a: última compra estornada → vale a compra válida anterior',
    entrada: [...comprasFornecedorA.slice(0, 2), { ...comprasFornecedorA[2], estornada: true }],
    esperado: 37.4,
  },
  { descricao: 'sem compras → sem preço', entrada: [], esperado: null },
]
