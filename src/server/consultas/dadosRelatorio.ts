import 'server-only'
import {
  diasAtrasIso,
  fimDoDia,
  formatarMoeda,
  formatarNumero,
  hojeIso,
  inicioDoDia,
  NOME_STATUS,
} from '@/lib/formatar'
import {
  relatorioConsumo,
  relatorioMovimentacao,
  relatorioReposicao,
  type Agrupamento,
} from './relatorios'

export type TipoRelatorio = 'consumo' | 'movimentacao' | 'reposicao'

export interface ParametrosRelatorio {
  tipo?: string
  de?: string
  ate?: string
  agrupar?: string
}

export function normalizarParametros(p: ParametrosRelatorio) {
  const tipo: TipoRelatorio =
    p.tipo === 'movimentacao' || p.tipo === 'reposicao' ? p.tipo : 'consumo'
  const deIso = p.de && inicioDoDia(p.de) ? p.de : diasAtrasIso(30)
  const ateIso = p.ate && fimDoDia(p.ate) ? p.ate : hojeIso()
  const agrupar: Agrupamento =
    p.agrupar === 'destino' || p.agrupar === 'colaborador' ? p.agrupar : 'item'
  return { tipo, deIso, ateIso, de: inicioDoDia(deIso)!, ate: fimDoDia(ateIso)!, agrupar }
}

/** Monta cabeçalho e linhas de qualquer relatório; usado na tela e no CSV (RF-17 a RF-20). */
export async function montarRelatorio(p: ParametrosRelatorio, verPrecos: boolean) {
  const n = normalizarParametros(p)
  if (n.tipo === 'consumo') {
    const linhas = await relatorioConsumo(n.de, n.ate, n.agrupar)
    const nomeChave = { item: 'Código', destino: 'Destino', colaborador: 'Matrícula / nome' }[
      n.agrupar
    ]
    return {
      ...n,
      titulo: 'Relatório de consumo',
      cabecalho: [nomeChave, 'Descrição', 'Quantidade consumida', 'Saídas', 'Média diária'],
      linhas: linhas.map((l) => [
        l.chave,
        l.nome,
        l.total,
        l.movimentacoes,
        formatarNumero(l.mediaDiaria),
      ]),
    }
  }
  if (n.tipo === 'movimentacao') {
    const linhas = await relatorioMovimentacao(n.de, n.ate)
    return {
      ...n,
      titulo: 'Relatório de movimentação',
      cabecalho: ['Código', 'Descrição', 'Saldo inicial', 'Entradas', 'Saídas', 'Saldo final'],
      linhas: linhas.map((l) => [l.codigo, l.descricao, l.inicial, l.entradas, l.saidas, l.final]),
    }
  }
  const linhas = await relatorioReposicao()
  return {
    ...n,
    titulo: 'Necessidade de reposição',
    cabecalho: [
      'Código',
      'Descrição',
      'Status',
      'Saldo',
      'Ponto de reposição',
      'Sugestão (un.)',
      'Caixas',
      'Fornecedor preferencial',
      'Menor último preço',
      'Lead time (dias)',
    ],
    linhas: linhas.map((l) => [
      l.item.codigo,
      l.item.descricao,
      NOME_STATUS[l.item.status],
      l.item.saldo,
      l.item.pontoReposicao,
      l.sugestao.quantidade,
      l.sugestao.caixas,
      l.preferencial?.nome ?? '—',
      l.maisBarato
        ? `${l.maisBarato.nome}${verPrecos ? ` (${formatarMoeda(l.maisBarato.ultimoPreco)})` : ''}`
        : '—',
      l.leadTime ?? '—',
    ]),
  }
}
