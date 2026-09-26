import { describe, expect, it } from 'vitest'
import { destinoSeguro } from './redirecionamento'

describe('Doc 03 seção 5.6 · Redirecionamento só para caminhos internos', () => {
  it.each([
    ['/itens/123', '/itens/123'],
    ['/p/A01-G03-C04', '/p/A01-G03-C04'],
    [null, '/painel'],
    ['', '/painel'],
    ['https://site-malicioso.com', '/painel'],
    ['//site-malicioso.com', '/painel'],
    ['/\\site-malicioso.com', '/painel'],
    ['/login?volta=/x', '/painel'],
    ['/itens\r\nSet-Cookie: x', '/painel'],
    ['/javascript:alert(1)', '/painel'],
  ])('volta=%s → %s', (volta, esperado) => {
    expect(destinoSeguro(volta)).toBe(esperado)
  })
})
