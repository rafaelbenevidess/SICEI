import { describe, expect, it } from 'vitest'
import {
  historicoComVariacao,
  listaDeFornecedores,
  ultimoPrecoValido,
  variacaoPercentual,
} from './precos'
import { casosUltimoPreco, casosVariacao, comprasFornecedorA } from './precos.casos'

describe('RN-05a · Último preço válido', () => {
  it.each(casosUltimoPreco)('$descricao', ({ entrada, esperado }) => {
    expect(ultimoPrecoValido(entrada)?.precoUnitario ?? null).toBe(esperado)
  })
})

describe('RN-05b · Variação entre compras', () => {
  it.each(casosVariacao)('$descricao', ({ entrada, esperado }) => {
    expect(variacaoPercentual(entrada.anterior, entrada.atual)).toBe(esperado)
  })
  it('preço anterior zero é um erro', () => {
    expect(() => variacaoPercentual(0, 10)).toThrow()
  })
})

describe('RN-05b · Lista de fornecedores do item', () => {
  it('exemplo do doc 01: A (R$ 38,90), B (R$ 41,20) e C sem compras, nessa ordem', () => {
    const lista = listaDeFornecedores([
      {
        fornecedorId: 'c',
        nome: 'Fornecedor C',
        leadTimeDias: 4,
        preferencial: false,
        compras: [],
      },
      {
        fornecedorId: 'b',
        nome: 'Fornecedor B',
        leadTimeDias: 3,
        preferencial: false,
        compras: [{ data: '2026-08-15', precoUnitario: 41.2, quantidade: 20, estornada: false }],
      },
      {
        fornecedorId: 'a',
        nome: 'Fornecedor A',
        leadTimeDias: 5,
        preferencial: true,
        compras: comprasFornecedorA,
      },
    ])
    expect(lista.map((l) => [l.nome, l.ultimoPreco, l.dataUltimaCompra])).toEqual([
      ['Fornecedor A', 38.9, '2026-09-02'],
      ['Fornecedor B', 41.2, '2026-08-15'],
      ['Fornecedor C', null, null],
    ])
  })
  it('dois fornecedores sem compras ficam em ordem alfabética', () => {
    const lista = listaDeFornecedores([
      { fornecedorId: '2', nome: 'Zeta', leadTimeDias: null, preferencial: false, compras: [] },
      { fornecedorId: '1', nome: 'Alfa', leadTimeDias: null, preferencial: false, compras: [] },
    ])
    expect(lista.map((l) => l.nome)).toEqual(['Alfa', 'Zeta'])
  })
})

describe('RN-05b · Histórico de preços com variação', () => {
  it('exemplo do doc 01: 02/09 +4,0%, 10/07 +1,1%, 03/05 sem anterior', () => {
    expect(
      historicoComVariacao(comprasFornecedorA).map((h) => [h.data, h.variacaoPercentual]),
    ).toEqual([
      ['2026-09-02', 4],
      ['2026-07-10', 1.1],
      ['2026-05-03', null],
    ])
  })
  it('compra estornada fica no histórico, sem variação, e é pulada no cálculo da seguinte', () => {
    const compras = [
      comprasFornecedorA[0],
      { ...comprasFornecedorA[1], estornada: true },
      comprasFornecedorA[2],
    ]
    const h = historicoComVariacao(compras)
    expect(h).toHaveLength(3)
    expect(h[1]).toMatchObject({ data: '2026-07-10', estornada: true, variacaoPercentual: null })
    // 37,00 → 38,90 = +5,1%
    expect(h[0].variacaoPercentual).toBe(5.1)
  })
})
