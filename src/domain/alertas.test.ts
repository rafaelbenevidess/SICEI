import { describe, expect, it } from 'vitest'
import { decidirAlerta } from './alertas'
import { casosAlerta } from './alertas.casos'

describe('RN-18 / RN-19 · Alertas sem repetição', () => {
  it.each(casosAlerta)('$descricao', ({ entrada, esperado }) => {
    expect(decidirAlerta(entrada)).toEqual(esperado)
  })
})
