import { describe, expect, it } from 'vitest'
import { hrefAtivo, MENU, menuDoPerfil, trilha } from './menu'

const todos = MENU.flatMap((g) => g.itens)
const ativo = (url: string) => {
  const u = new URL(url, 'http://x')
  return hrefAtivo(todos, u.pathname, u.searchParams)
}

describe('Menu lateral · Itens por perfil', () => {
  it('Consulta vê só Operação e Cadastros, sem Movimentações nem Relatórios', () => {
    const m = menuDoPerfil('CONSULTA')
    expect(m.map((g) => g.titulo)).toEqual(['Operação', 'Gestão'])
    expect(m[0].itens.map((i) => i.rotulo)).toEqual(['Painel', 'Itens', 'Alertas'])
    expect(m[1].itens.map((i) => i.rotulo)).toEqual(['Cadastros'])
  })

  it('Almoxarife registra entrada e saída e imprime etiquetas, sem Administração', () => {
    const m = menuDoPerfil('ALMOXARIFE')
    expect(m.map((g) => g.titulo)).toEqual(['Operação', 'Registrar', 'Gestão'])
    expect(m[2].itens.map((i) => i.rotulo)).toEqual(['Cadastros'])
  })

  it('Administrador vê os 12 itens', () => {
    expect(menuDoPerfil('ADMIN').flatMap((g) => g.itens)).toHaveLength(12)
  })

  it('cada tela tem um lugar só: sugestão de compra, análise e etiquetas são abas, não itens', () => {
    const rotulos = MENU.flatMap((g) => g.itens.map((i) => i.rotulo))
    for (const aba of ['Sugestão de compra', 'Análise', 'Etiquetas QR']) {
      expect(rotulos).not.toContain(aba)
    }
    expect(new Set(rotulos).size).toBe(rotulos.length)
  })

  it('RF-17a: Relatórios, que leva à Análise, só aparece para Gestor e Administrador', () => {
    for (const perfil of ['GESTOR', 'ADMIN'] as const) {
      const gestao = menuDoPerfil(perfil).find((g) => g.titulo === 'Gestão')!
      expect(gestao.itens.map((i) => i.rotulo)).toContain('Relatórios')
    }
    expect(menuDoPerfil('ALMOXARIFE').flatMap((g) => g.itens.map((i) => i.rotulo))).not.toContain(
      'Relatórios',
    )
  })
})

describe('Menu lateral · Item ativo', () => {
  it.each([
    ['/painel', '/painel'],
    ['/itens/abc', '/itens'],
    ['/itens/abc/editar', '/itens'],
    ['/relatorios', '/relatorios'],
    ['/relatorios?tipo=consumo', '/relatorios'],
    // abas de Relatórios e de Cadastros mantêm o item da tela aceso
    ['/analise?itens=PST-001', '/relatorios'],
    ['/relatorios?tipo=reposicao', '/relatorios'],
    ['/cadastros?aba=fornecedores', '/cadastros'],
    ['/cadastros/posicoes/etiquetas', '/cadastros'],
    ['/movimentacoes', '/movimentacoes'],
    ['/movimentacoes/nova?modo=saida', '/movimentacoes/nova?modo=saida'],
    ['/movimentacoes/nova?modo=entrada', '/movimentacoes/nova?modo=entrada'],
    ['/trocar-senha', null],
  ])('%s → %s', (url, esperado) => {
    expect(ativo(url)).toBe(esperado)
  })
})

describe('Topo · Trilha', () => {
  it('mostra o grupo e a tela da página aberta', () => {
    const u = new URL('http://x/admin/auditoria')
    expect(trilha(menuDoPerfil('ADMIN'), u.pathname, u.searchParams)).toEqual({
      grupo: 'Administração',
      tela: 'Auditoria',
    })
  })

  it('fora do menu não há trilha', () => {
    expect(trilha(menuDoPerfil('ADMIN'), '/trocar-senha', new URLSearchParams())).toBeNull()
  })
})
