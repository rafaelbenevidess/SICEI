import type { CasoDeTeste } from '../tipos'
import { DIMENSOES, FILTRO_DA_DIMENSAO, type FiltrosDaAnalise } from './analise'

type Parametros = Record<string, string | undefined>
type Resumo = { por: string; medida: string; de?: string; ate?: string; filtros: string }

/** Os filtros em forma curta, para comparar com o esperado. */
export function resumirFiltros(f: FiltrosDaAnalise) {
  const filtros = DIMENSOES.map((d) => FILTRO_DA_DIMENSAO[d])
    .filter((k) => f[k].length)
    .map((k) => `${k}=${f[k].join(',')}`)
    .join('; ')
  return {
    por: f.por,
    medida: f.medida,
    ...(f.de ? { de: f.de } : {}),
    ...(f.ate ? { ate: f.ate } : {}),
    filtros,
  }
}

/** Entrada: os parâmetros da URL. Esperado: os filtros que o painel usa. */
export const casosFiltrosDaAnalise: CasoDeTeste<Parametros, Resumo>[] = [
  {
    descricao: 'sem parâmetros → consumo por item, sem filtros',
    entrada: {},
    esperado: { por: 'item', medida: 'consumo', filtros: '' },
  },
  {
    descricao: 'itens "PST-001,PST-004" por destino, medindo perdas',
    entrada: { por: 'destino', medida: 'perdas', itens: 'PST-001,PST-004' },
    esperado: { por: 'destino', medida: 'perdas', filtros: 'itens=PST-001,PST-004' },
  },
  {
    descricao: 'dimensão e medida desconhecidas → os padrões, sem erro',
    entrada: { por: 'preco', medida: 'reais' },
    esperado: { por: 'item', medida: 'consumo', filtros: '' },
  },
  {
    descricao: 'aplicação que não existe é descartada; a válida fica',
    entrada: { aplicacoes: 'TORNEAMENTO,SOLDA' },
    esperado: { por: 'item', medida: 'consumo', filtros: 'aplicacoes=TORNEAMENTO' },
  },
  {
    descricao: 'período invertido (27/09 a 01/09) → 01/09 a 27/09',
    entrada: { de: '2026-09-27', ate: '2026-09-01' },
    esperado: {
      por: 'item',
      medida: 'consumo',
      de: '2026-09-01',
      ate: '2026-09-27',
      filtros: '',
    },
  },
  {
    descricao: 'data em outro formato (27/09/2026) é ignorada',
    entrada: { de: '27/09/2026' },
    esperado: { por: 'item', medida: 'consumo', filtros: '' },
  },
  {
    descricao: 'vários filtros ao mesmo tempo somam as condições',
    entrada: { itens: 'PST-001', destinos: 'CNC-01', fabricantes: 'Sandvik' },
    esperado: {
      por: 'item',
      medida: 'consumo',
      filtros: 'itens=PST-001; destinos=CNC-01; fabricantes=Sandvik',
    },
  },
]
