import { describe, expect, it } from 'vitest'
import { cnpjValido, formatarCnpj, limparCnpj, mascararCnpj, situacaoDoCnpj } from './cnpj'
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

describe('RN-04 · CNPJ no cadastro rápido de fornecedor', () => {
  it.each([
    ['1', '1'],
    ['112', '11.2'],
    ['11222333', '11.222.333'],
    ['112223330001', '11.222.333/0001'],
    ['11222333000181', '11.222.333/0001-81'],
    ['11.222.333/0001-8199', '11.222.333/0001-81'],
    ['12abc34501de35', '12.ABC.345/01DE-35'],
  ])('máscara ao digitar "%s" → "%s"', (entrada, esperado) => {
    expect(mascararCnpj(entrada)).toBe(esperado)
  })

  const existentes = { '11222333000181': 'Ferramentas Sul' }
  it.each([
    ['', 'vazio', null],
    ['11.222.333/0001', 'incompleto', null],
    ['11.222.333/0001-82', 'invalido', 'Dígito verificador inválido.'],
    ['11.222.333/0001-81', 'duplicado', 'CNPJ já cadastrado (Ferramentas Sul).'],
    ['12.ABC.345/01DE-35', 'valido', 'CNPJ válido.'],
  ])('"%s" → %s', (valor, estado, mensagem) => {
    expect(situacaoDoCnpj(valor, existentes)).toEqual({ estado, mensagem })
  })
})
