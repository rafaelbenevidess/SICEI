import { describe, expect, it } from 'vitest'
import { formatarNomeProprio, matriculaValida, normalizarMatricula } from './pessoa'
import { casosMatricula, casosNomeProprio, casosSobrenome } from './pessoa.casos'

describe('RF-02 · Nome do usuário gravado com cara de nome', () => {
  it.each(casosNomeProprio)('$descricao', ({ entrada, esperado }) => {
    expect(formatarNomeProprio(entrada)).toBe(esperado)
  })
})

describe('RF-02 · Sobrenome continua o nome', () => {
  it.each(casosSobrenome)('$descricao', ({ entrada, esperado }) => {
    expect(formatarNomeProprio(entrada, { sobrenome: true })).toBe(esperado)
  })
})

describe('RN-21d · Matrícula do usuário', () => {
  it.each(casosMatricula)('$descricao', ({ entrada, esperado }) => {
    expect({ matricula: normalizarMatricula(entrada), valida: matriculaValida(entrada) }).toEqual(
      esperado,
    )
  })
})
