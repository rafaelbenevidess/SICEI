import { describe, expect, it } from 'vitest'
import { filtrosDaUrl } from './filtros'

describe('RF-15 / RN-23 · Filtros do histórico lidos da URL', () => {
  it('guarda só os campos conhecidos e ignora vazios', () => {
    const p = new URLSearchParams('de=2026-09-01&tipo=COMPRA&busca=&qualquer=coisa&pagina=3')
    expect(filtrosDaUrl(p)).toEqual({ de: '2026-09-01', tipo: 'COMPRA' })
  })

  it('tira espaços e corta valores longos em 100 caracteres', () => {
    const p = new URLSearchParams({ busca: `  ${'x'.repeat(300)}  `, op: ' 2026-0457 ' })
    const f = filtrosDaUrl(p)
    expect(f.busca).toHaveLength(100)
    expect(f.op).toBe('2026-0457')
  })
})
