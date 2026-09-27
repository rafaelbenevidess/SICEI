import { describe, expect, it } from 'vitest'
import {
  alvoDeEstoque,
  coberturaEmDias,
  consumoMedioDiario,
  escalaDoNivel,
  leadTimeParaCalculo,
  pontoDeReposicao,
  quantidadeEmUnidades,
  statusDoItem,
  sugestaoDeCompra,
  validarLimites,
} from './estoque'
import {
  casosConsumoMedio,
  casosConversao,
  casosLeadTime,
  casosLimites,
  casosPontoReposicao,
  casosStatus,
  casosSugestao,
} from './estoque.casos'

describe('RN-16 · Consumo médio diário', () => {
  it.each(casosConsumoMedio)('$descricao', ({ entrada, esperado }) => {
    expect(consumoMedioDiario(entrada)).toBe(esperado)
  })
  it('janela de zero dias é um erro', () => {
    expect(() => consumoMedioDiario({ totalConsumido: 10, janelaDias: 0 })).toThrow()
  })
  it('total negativo é um erro', () => {
    expect(() => consumoMedioDiario({ totalConsumido: -1, janelaDias: 90 })).toThrow()
  })
})

describe('RN-15 · Ponto de reposição', () => {
  it.each(casosPontoReposicao)('$descricao', ({ entrada, esperado }) => {
    expect(pontoDeReposicao(entrada)).toBe(esperado)
  })
  it('mínimo negativo é um erro', () => {
    expect(() => pontoDeReposicao({ minimo: -5, consumoDiario: 1, leadTime: 1 })).toThrow()
  })
})

describe('RN-15 · Lead time usado no cálculo', () => {
  it.each(casosLeadTime)('$descricao', ({ entrada, esperado }) => {
    expect(leadTimeParaCalculo(entrada)).toBe(esperado)
  })
})

describe('RN-17 · Status do item', () => {
  it.each(casosStatus)('$descricao', ({ entrada, esperado }) => {
    expect(statusDoItem(entrada)).toBe(esperado)
  })
})

describe('RN-20 · Sugestão de compra', () => {
  it.each(casosSugestao)('$descricao', ({ entrada, esperado }) => {
    expect(sugestaoDeCompra(entrada)).toEqual(esperado)
  })
  it('consumo fracionado não gera erro de arredondamento: 0,1/dia × 30 = 3', () => {
    const r = sugestaoDeCompra({
      saldo: 0,
      minimo: 0,
      pontoReposicao: 0,
      maximo: null,
      consumoDiario: 0.1,
      embalagem: 1,
    })
    expect(r.quantidade).toBe(3)
  })
  it('máximo abaixo do saldo não sugere compra', () => {
    const r = sugestaoDeCompra({
      saldo: 10,
      minimo: 20,
      pontoReposicao: 41,
      maximo: 5,
      consumoDiario: 1,
      embalagem: 10,
    })
    expect(r).toEqual({ quantidade: 0, caixas: 0 })
  })
  it('embalagem zero é um erro', () => {
    expect(() =>
      sugestaoDeCompra({
        saldo: 0,
        minimo: 1,
        pontoReposicao: 1,
        maximo: null,
        consumoDiario: 0,
        embalagem: 0,
      }),
    ).toThrow()
  })
})

describe('RN-07 · Conversão de caixas em unidades', () => {
  it.each(casosConversao)('$descricao', ({ entrada, esperado }) => {
    expect(quantidadeEmUnidades(entrada)).toEqual(esperado)
  })
  it('caixa com embalagem inválida é recusada', () => {
    expect(quantidadeEmUnidades({ quantidade: 2, unidade: 'CAIXA', embalagem: 0 }).ok).toBe(false)
  })
})

describe('RN-14 · Estoque mínimo e máximo', () => {
  it.each(casosLimites)('$descricao', ({ entrada, esperado }) => {
    expect(validarLimites(entrada)).toEqual(esperado)
  })
  it('máximo fracionado é recusado', () => {
    expect(validarLimites({ minimo: 1, maximo: 2.5 }).ok).toBe(false)
  })
})

describe('RN-20 · Alvo de estoque', () => {
  it.each([
    [{ maximo: 80, pontoReposicao: 41, consumoDiario: 3 }, 80, 'com máximo, o alvo é o máximo'],
    [{ maximo: null, pontoReposicao: 41, consumoDiario: 3 }, 131, 'sem máximo: 41 + 30 dias × 3'],
    [{ maximo: null, pontoReposicao: 26, consumoDiario: 1.4 }, 68, 'sem máximo: 26 + teto(42)'],
    [
      { maximo: null, pontoReposicao: 10, consumoDiario: 0 },
      10,
      'sem consumo: fica no ponto de reposição',
    ],
  ] as [Parameters<typeof alvoDeEstoque>[0], number, string][])(
    '%j → %i (%s)',
    (entrada, esperado) => {
      expect(alvoDeEstoque(entrada)).toBe(esperado)
    },
  )
})

describe('Barra de nível do estoque', () => {
  it('escala = max(alvo, saldo) × 1,08; saldo 35, mínimo 20, reposição 41, alvo 131', () => {
    expect(escalaDoNivel({ saldo: 35, minimo: 20, pontoReposicao: 41, alvo: 131 })).toEqual({
      saldo: 24.7,
      minimo: 14.1,
      reposicao: 29,
      alvo: 92.6,
    })
  })

  it('saldo acima do alvo vira a referência da escala e fica em 92,6%', () => {
    expect(escalaDoNivel({ saldo: 200, minimo: 20, pontoReposicao: 41, alvo: 100 }).saldo).toBe(
      92.6,
    )
  })

  it('tudo zerado não divide por zero', () => {
    expect(escalaDoNivel({ saldo: 0, minimo: 0, pontoReposicao: 0, alvo: 0 })).toEqual({
      saldo: 0,
      minimo: 0,
      reposicao: 0,
      alvo: 0,
    })
  })
})

describe('Cobertura estimada em dias', () => {
  it.each([
    [35, 3, 11],
    [0, 3, 0],
    [10, 0, null],
    [10, -1, null],
  ])('saldo %i com consumo %d/dia → %j dias', (saldo, consumo, esperado) => {
    expect(coberturaEmDias(saldo, consumo)).toBe(esperado)
  })
})
