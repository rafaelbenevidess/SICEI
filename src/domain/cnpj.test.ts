import { describe, expect, it } from 'vitest'
import { cnpjValido, formatarCnpj, limparCnpj } from './cnpj'
import { casosCnpj } from './cnpj.casos'

describe('RN-04 · Validação de CNPJ', () => {
  it.each(casosCnpj)('$descricao', ({ entrada, esperado }) => {
    expect(cnpjValido(entrada)).toBe(esperado)
  })
  it('aceita letras minúsculas no alfanumérico', () => {
    expect(cnpjValido('12.abc.345/01de-35')).toBe(true)
  })
  it('limpa pontuação', () => {
    expect(limparCnpj('11.222.333/0001-81')).toBe('11222333000181')
  })
  it('formata com pontuação', () => {
    expect(formatarCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(formatarCnpj('123')).toBe('123')
  })
})
