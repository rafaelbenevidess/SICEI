import { describe, expect, it } from 'vitest'
import { ipDoCliente } from './ip'

const h = (valores: Record<string, string>) => new Headers(valores)

describe('RN-09 / RN-22 · IP do cliente não pode ser escolhido pelo próprio cliente', () => {
  it('usa o X-Real-IP gravado pelo proxy de borda', () => {
    expect(
      ipDoCliente(h({ 'x-real-ip': '200.1.2.3', 'x-forwarded-for': '1.1.1.1, 200.1.2.3' })),
    ).toBe('200.1.2.3')
  })
  it('sem X-Real-IP, usa o último endereço de X-Forwarded-For (o acrescentado pelo proxy)', () => {
    expect(ipDoCliente(h({ 'x-forwarded-for': '6.6.6.6-inventado, 200.1.2.3' }))).toBe('200.1.2.3')
  })
  it('sem cabeçalhos, não há IP', () => {
    expect(ipDoCliente(h({}))).toBeNull()
    expect(ipDoCliente(h({ 'x-forwarded-for': ' , ' }))).toBeNull()
  })
  it('valor gigante é cortado', () => {
    expect(ipDoCliente(h({ 'x-real-ip': 'a'.repeat(500) }))?.length).toBe(64)
  })
})
