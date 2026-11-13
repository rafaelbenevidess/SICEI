import { pode, type Permissao } from '@/domain/permissoes'
import type { Perfil } from '@/domain/tipos'

/** Nome do ícone Lucide de cada item (o componente cliente resolve o ícone). */
export type NomeIcone =
  | 'painel'
  | 'itens'
  | 'movimentacoes'
  | 'alertas'
  | 'entrada'
  | 'saida'
  | 'relatorios'
  | 'cadastros'
  | 'usuarios'
  | 'auditoria'
  | 'parametros'
  | 'importacao'

export interface ItemMenu {
  href: string
  rotulo: string
  icone: NomeIcone
  permissao: Permissao
  /** outras rotas que são abas desta mesma tela e mantêm este item aceso */
  tambem?: string[]
}

export interface GrupoMenu {
  titulo: string
  itens: ItemMenu[]
}

/**
 * Menu lateral. Cada tela tem um lugar só no menu: o que é parte de outra tela (sugestão de
 * compra, análise, etiquetas QR) aparece como aba dela, não como item solto (doc 03, 10.10).
 */
export const MENU: GrupoMenu[] = [
  {
    titulo: 'Operação',
    itens: [
      { href: '/painel', rotulo: 'Painel', icone: 'painel', permissao: 'painel:ver' },
      { href: '/itens', rotulo: 'Itens', icone: 'itens', permissao: 'saldo:ver' },
      {
        href: '/movimentacoes',
        rotulo: 'Movimentações',
        icone: 'movimentacoes',
        permissao: 'historico:ver',
      },
      { href: '/alertas', rotulo: 'Alertas', icone: 'alertas', permissao: 'alertas:ver' },
    ],
  },
  {
    titulo: 'Registrar',
    itens: [
      {
        href: '/movimentacoes/nova?modo=entrada',
        rotulo: 'Entrada',
        icone: 'entrada',
        permissao: 'movimentacao:entrada',
      },
      {
        href: '/movimentacoes/nova?modo=saida',
        rotulo: 'Saída',
        icone: 'saida',
        permissao: 'movimentacao:saida',
      },
    ],
  },
  {
    titulo: 'Gestão',
    itens: [
      {
        href: '/relatorios',
        rotulo: 'Relatórios',
        icone: 'relatorios',
        permissao: 'relatorios:ver',
        tambem: ['/analise'],
      },
      { href: '/cadastros', rotulo: 'Cadastros', icone: 'cadastros', permissao: 'cadastros:ver' },
    ],
  },
  {
    titulo: 'Administração',
    itens: [
      {
        href: '/admin/usuarios',
        rotulo: 'Usuários',
        icone: 'usuarios',
        permissao: 'usuarios:gerenciar',
      },
      {
        href: '/admin/auditoria',
        rotulo: 'Auditoria',
        icone: 'auditoria',
        permissao: 'auditoria:ver',
      },
      {
        href: '/admin/parametros',
        rotulo: 'Parâmetros',
        icone: 'parametros',
        permissao: 'parametros:gerenciar',
      },
      {
        href: '/admin/importacao',
        rotulo: 'Importação',
        icone: 'importacao',
        permissao: 'importacao:executar',
      },
    ],
  },
]

/** Grupos com só os itens que o perfil pode ver; grupos vazios somem. */
export function menuDoPerfil(perfil: Perfil): GrupoMenu[] {
  return MENU.map((g) => ({
    ...g,
    itens: g.itens.filter((i) => pode(perfil, i.permissao)),
  })).filter((g) => g.itens.length > 0)
}

/**
 * Item do menu que corresponde à página aberta. Vence o link mais específico: o caminho
 * precisa ser igual ou um prefixo, e os parâmetros do link precisam estar na URL. As rotas
 * em `tambem` valem como o próprio item.
 */
export function hrefAtivo(
  itens: (string | Pick<ItemMenu, 'href' | 'tambem'>)[],
  caminho: string,
  parametros: URLSearchParams,
): string | null {
  let melhor: string | null = null
  let pontos = -1
  for (const item of itens) {
    const { href, tambem = [] } = typeof item === 'string' ? { href: item } : item
    for (const alvo of [href, ...tambem]) {
      const [rota, consulta = ''] = alvo.split('?')
      if (caminho !== rota && !caminho.startsWith(`${rota}/`)) continue
      const exigidos = [...new URLSearchParams(consulta)]
      if (!exigidos.every(([k, v]) => parametros.get(k) === v)) continue
      const p = rota.length * 10 + exigidos.length
      if (p > pontos) {
        pontos = p
        melhor = href
      }
    }
  }
  return melhor
}

/** Trilha "Grupo › Tela" do topo. */
export function trilha(
  grupos: GrupoMenu[],
  caminho: string,
  parametros: URLSearchParams,
): { grupo: string; tela: string } | null {
  const ativo = hrefAtivo(
    grupos.flatMap((g) => g.itens),
    caminho,
    parametros,
  )
  for (const g of grupos) {
    const item = g.itens.find((i) => i.href === ativo)
    if (item) return { grupo: g.titulo, tela: item.rotulo }
  }
  return null
}
