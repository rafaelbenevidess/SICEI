import { describe, expect, it } from 'vitest'
import { codigoEmUso, codigoEquivalente, padronizarCodigo, proximoCodigo } from './codigo'
import {
  casosCodigoEquivalente,
  casosPadronizarCodigo,
  casosProximoCodigo,
  CODIGOS_CADASTRADOS,
} from './codigo.casos'

describe('RF-03 · Próximo código interno', () => {
  it.each(casosProximoCodigo)('$descricao', ({ entrada, esperado }) => {
    expect(proximoCodigo(entrada)).toBe(esperado)
  })
})

describe('RN-01 · Código já usado', () => {
  it.each([
    ['PST-003', ['PST-001', 'PST-003'], true],
    [' pst-003 ', ['PST-003'], true],
    ['PST3', ['PST-003'], true],
    ['PST-004', ['PST-001', 'PST-003'], false],
    ['', ['PST-001'], false],
  ] as const)('%s em %j → %s', (codigo, existentes, esperado) => {
    expect(codigoEmUso(codigo, [...existentes])).toBe(esperado)
  })
})

describe('RN-01 · Código digitado vira o padrão da sequência', () => {
  it.each(casosPadronizarCodigo)('$descricao', ({ entrada, esperado }) => {
    expect(padronizarCodigo(entrada, CODIGOS_CADASTRADOS)).toBe(esperado)
  })
})

describe('RN-01 · Código escrito de outro jeito é o mesmo código', () => {
  it.each(casosCodigoEquivalente)('$descricao', ({ entrada, esperado }) => {
    expect(codigoEquivalente(entrada, CODIGOS_CADASTRADOS)).toBe(esperado)
  })
})
