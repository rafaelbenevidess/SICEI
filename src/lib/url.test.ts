import { describe, expect, it } from 'vitest'
import { urlCom } from './url'

describe('Filtros na URL', () => {
  it('mantém os filtros atuais e troca só o pedido', () => {
    expect(urlCom('/itens', { q: 'cnmg', status: 'OK' }, { status: 'ALERTA' })).toBe(
      '/itens?q=cnmg&status=ALERTA',
    )
  })

  it('null ou vazio tira o parâmetro; sem parâmetros fica só o caminho', () => {
    expect(urlCom('/itens', { status: 'OK' }, { status: null })).toBe('/itens')
    expect(urlCom('/itens', { q: '' }, { status: '' })).toBe('/itens')
  })

  it('ignora parâmetros repetidos (arrays) da URL atual', () => {
    expect(urlCom('/itens', { q: ['a', 'b'], aplicacao: 'FRESAMENTO' }, {})).toBe(
      '/itens?aplicacao=FRESAMENTO',
    )
  })
})
