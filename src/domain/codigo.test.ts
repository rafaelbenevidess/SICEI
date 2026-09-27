import { describe, expect, it } from 'vitest'
import { codigoEmUso, proximoCodigo } from './codigo'
import { casosProximoCodigo } from './codigo.casos'

describe('RF-03 · Próximo código interno', () => {
  it.each(casosProximoCodigo)('$descricao', ({ entrada, esperado }) => {
    expect(proximoCodigo(entrada)).toBe(esperado)
  })
})

describe('RN-01 · Código já usado', () => {
  it.each([
    ['PST-003', ['PST-001', 'PST-003'], true],
    [' pst-003 ', ['PST-003'], true],
    ['PST-004', ['PST-001', 'PST-003'], false],
    ['', ['PST-001'], false],
  ] as const)('%s em %j → %s', (codigo, existentes, esperado) => {
    expect(codigoEmUso(codigo, [...existentes])).toBe(esperado)
  })
})
