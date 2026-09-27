import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ACOES_DO_LOG, nomeDaAcao, opcoesDoFiltroDeAcao } from './acoesDoLog'

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n)
    return statSync(p).isDirectory() ? arquivos(p) : p.endsWith('.ts') ? [p] : []
  })
}

describe('RF-21 · Ações do filtro do log', () => {
  it('toda ação fixa gravada pelos services está no catálogo', () => {
    const codigo = arquivos(path.resolve('src/server')).map((f) => readFileSync(f, 'utf8'))
    const gravadas = new Set(
      codigo.flatMap((c) => [...c.matchAll(/acao: '([A-Z_]+)'/g)].map((m) => m[1])),
    )
    // ações passadas para o helper auditar(tx, ator, 'ACAO', ...)
    for (const c of codigo)
      for (const m of c.matchAll(/auditar\(\s*tx,\s*ator,\s*'([A-Z_]+)'/g)) gravadas.add(m[1])
    const catalogo = new Set(ACOES_DO_LOG.map((a) => a.acao))
    expect([...gravadas].filter((a) => !catalogo.has(a))).toEqual([])
  })

  it('não repete ação no catálogo', () => {
    const acoes = ACOES_DO_LOG.map((a) => a.acao)
    expect(new Set(acoes).size).toBe(acoes.length)
  })

  it('ação gravada que o catálogo não conhece entra no grupo "Outras"', () => {
    const grupos = opcoesDoFiltroDeAcao(['LOGIN', 'ACAO_FUTURA', 'ACAO_FUTURA', ''])
    expect(grupos.at(-1)).toEqual({
      grupo: 'Outras',
      acoes: [{ acao: 'ACAO_FUTURA', rotulo: 'ACAO_FUTURA', grupo: 'Outras' }],
    })
    expect(grupos[0].grupo).toBe('Movimentações')
  })

  it('sem ações desconhecidas, não existe grupo "Outras"', () => {
    expect(opcoesDoFiltroDeAcao(['LOGIN']).map((g) => g.grupo)).not.toContain('Outras')
  })

  it('nome legível: MOVIMENTACAO_ESTORNO → Estorno; desconhecida volta igual', () => {
    expect(nomeDaAcao('MOVIMENTACAO_ESTORNO')).toBe('Estorno')
    expect(nomeDaAcao('XYZ')).toBe('XYZ')
  })
})
