import { describe, expect, it } from 'vitest'
import { urlBanco, urlCom } from './url'

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

describe('URL do banco (SSL)', () => {
  it('troca sslmode=require, prefer ou verify-ca por verify-full', () => {
    expect(urlBanco('postgresql://u:s@ep.neon.tech/db?sslmode=require')).toBe(
      'postgresql://u:s@ep.neon.tech/db?sslmode=verify-full',
    )
    expect(urlBanco('postgresql://u:s@ep.neon.tech/db?connect_timeout=15&sslmode=prefer')).toBe(
      'postgresql://u:s@ep.neon.tech/db?connect_timeout=15&sslmode=verify-full',
    )
  })

  it('mantém URLs locais, vazias ou com uselibpqcompat=true', () => {
    expect(urlBanco(undefined)).toBeUndefined()
    expect(urlBanco('postgresql://u:s@localhost:5432/db')).toBe(
      'postgresql://u:s@localhost:5432/db',
    )
    expect(urlBanco('postgresql://u:s@ep.neon.tech/db?uselibpqcompat=true&sslmode=require')).toBe(
      'postgresql://u:s@ep.neon.tech/db?uselibpqcompat=true&sslmode=require',
    )
  })
})
