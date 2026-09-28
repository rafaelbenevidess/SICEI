import { z } from 'zod'
import { normalizarSelecao } from '../analise'
import { APLICACOES } from './cadastros'

/** RF-17a: o que o painel de análise compara (a "dimensão" do ranking e das cores). */
export const DIMENSOES = ['item', 'destino', 'colaborador', 'aplicacao', 'fabricante'] as const
export type Dimensao = (typeof DIMENSOES)[number]

/** RF-17a: o que o painel soma. Estorno nunca conta (RN-12). */
export const MEDIDAS = ['consumo', 'perdas', 'saidas'] as const
export type Medida = (typeof MEDIDAS)[number]

export const NOME_DA_DIMENSAO: Record<
  Dimensao,
  { singular: string; plural: string; todos: string }
> = {
  item: { singular: 'Item', plural: 'Itens', todos: 'Todos os itens' },
  destino: { singular: 'Destino', plural: 'Destinos', todos: 'Todos os destinos' },
  colaborador: {
    singular: 'Colaborador',
    plural: 'Colaboradores',
    todos: 'Todos os colaboradores',
  },
  aplicacao: { singular: 'Aplicação', plural: 'Aplicações', todos: 'Todas as aplicações' },
  fabricante: { singular: 'Fabricante', plural: 'Fabricantes', todos: 'Todos os fabricantes' },
}

export const NOME_DA_MEDIDA: Record<Medida, { titulo: string; curto: string; pico: string }> = {
  consumo: { titulo: 'Consumo na produção', curto: 'Consumo', pico: 'Maior consumo' },
  perdas: { titulo: 'Perdas e quebras', curto: 'Perdas', pico: 'Mais perdas' },
  saidas: { titulo: 'Consumo + perdas', curto: 'Saídas', pico: 'Mais saídas' },
}

/** Tipos de movimentação somados em cada medida. Ajuste de inventário não é uso da pastilha. */
export const TIPOS_DA_MEDIDA: Record<Medida, string[]> = {
  consumo: ['CONSUMO_PRODUCAO'],
  perdas: ['PERDA_QUEBRA'],
  saidas: ['CONSUMO_PRODUCAO', 'PERDA_QUEBRA'],
}

/** Filtro de uma dimensão: "PST-001,PST-004" na URL; valor comprido demais é descartado. */
const selecao = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .catch(undefined)
  .transform((v) => normalizarSelecao(v).filter((c) => c.length <= 120))

const data = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined)

/**
 * Os filtros chegam pela URL e ninguém digita a URL à mão: valor estranho vira o padrão em
 * vez de erro. Período invertido é desvirado.
 */
export const schemaFiltrosDaAnalise = z
  .object({
    de: data,
    ate: data,
    por: z.enum(DIMENSOES).catch('item'),
    medida: z.enum(MEDIDAS).catch('consumo'),
    itens: selecao,
    destinos: selecao,
    colaboradores: selecao,
    aplicacoes: selecao.transform((l) =>
      l.filter((a) => (APLICACOES as readonly string[]).includes(a)),
    ),
    fabricantes: selecao,
  })
  .transform((f) => (f.de && f.ate && f.de > f.ate ? { ...f, de: f.ate, ate: f.de } : f))

export type FiltrosDaAnalise = z.output<typeof schemaFiltrosDaAnalise>
export type SelecoesDaAnalise = Pick<
  FiltrosDaAnalise,
  'itens' | 'destinos' | 'colaboradores' | 'aplicacoes' | 'fabricantes'
>

/** Nome do parâmetro da URL que filtra cada dimensão. */
export const FILTRO_DA_DIMENSAO: Record<Dimensao, keyof SelecoesDaAnalise> = {
  item: 'itens',
  destino: 'destinos',
  colaborador: 'colaboradores',
  aplicacao: 'aplicacoes',
  fabricante: 'fabricantes',
}

/** Os escolhidos da dimensão que o painel compara (definem as cores e a comparação). */
export function escolhidosDaDimensao(f: FiltrosDaAnalise): string[] {
  return f[FILTRO_DA_DIMENSAO[f.por]]
}

/** Quantos filtros de dimensão estão ativos. */
export function filtrosAtivos(f: SelecoesDaAnalise): number {
  return DIMENSOES.filter((d) => f[FILTRO_DA_DIMENSAO[d]].length > 0).length
}

/**
 * Parâmetros da URL para os filtros, só com o que foge do padrão. Serve para os atalhos de
 * período e para o CSV levarem os mesmos filtros da tela.
 */
export function parametrosDaAnalise(
  f: Omit<FiltrosDaAnalise, 'de' | 'ate'> & { de: string; ate: string },
): Record<string, string> {
  const p: Record<string, string> = { de: f.de, ate: f.ate }
  if (f.por !== 'item') p.por = f.por
  if (f.medida !== 'consumo') p.medida = f.medida
  for (const d of DIMENSOES) {
    const chave = FILTRO_DA_DIMENSAO[d]
    if (f[chave].length) p[chave] = f[chave].join(',')
  }
  return p
}
