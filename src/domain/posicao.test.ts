import { describe, expect, it } from 'vitest'
import { avaliarAtribuicao, codigoDaPosicao, lerCodigoDaPosicao } from './posicao'
import { casosAtribuicao, casosCodigoPosicao } from './posicao.casos'

describe('RN-25 · Código da posição', () => {
  it.each(casosCodigoPosicao)('$descricao', ({ entrada, esperado }) => {
    expect(codigoDaPosicao(entrada)).toEqual(esperado)
  })
  it('lê o código de volta', () => {
    expect(lerCodigoDaPosicao('a01-g03-c04')).toEqual({ armario: 1, gaveta: 3, compartimento: 4 })
  })
  it('formato errado ou nível zero → null', () => {
    expect(lerCodigoDaPosicao('A1-G3-C4')).toBeNull()
    expect(lerCodigoDaPosicao('A00-G03-C04')).toBeNull()
  })
})

describe('RN-25 · Um item por compartimento', () => {
  it.each(casosAtribuicao)('$descricao', ({ entrada, esperado }) => {
    expect(avaliarAtribuicao(entrada)).toEqual(esperado)
  })
})
