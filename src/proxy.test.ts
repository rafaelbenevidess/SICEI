import { describe, expect, it } from 'vitest'
import { ehPublica, montarCsp } from './proxy'

describe('Proxy · rotas públicas', () => {
  it.each([
    ['/', true],
    ['/login', true],
    ['/testes', true],
    ['/api/cron/diario', true],
    ['/painel', false],
    ['/itens/123', false],
    ['/loginx', false],
    ['/admin/usuarios', false],
  ])('%s é pública? %s', (caminho, esperado) => {
    expect(ehPublica(caminho)).toBe(esperado)
  })
})

describe('Doc 03 seção 6 · CSP', () => {
  it('produção: nonce, sem unsafe-eval, sem frames e com upgrade para HTTPS', () => {
    const csp = montarCsp('abc', false)
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'")
    expect(csp).not.toContain('unsafe-eval')
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/)
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain('upgrade-insecure-requests')
  })
  it('desenvolvimento permite eval (exigido pelo React em dev)', () => {
    expect(montarCsp('abc', true)).toContain("'unsafe-eval'")
  })
})
