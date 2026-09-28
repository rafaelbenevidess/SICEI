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
  dadosDaAnalise,
  relatorioConsumo,
  relatorioMovimentacao,
  relatorioReposicao,
  type Agrupamento,
} from './relatorios'

export type TipoRelatorio = 'consumo' | 'movimentacao' | 'reposicao' | 'analise'

export interface ParametrosRelatorio {
  tipo?: string
  de?: string
  ate?: string
  agrupar?: string
}

export function normalizarParametros(p: ParametrosRelatorio) {
  const tipo: TipoRelatorio =
    p.tipo === 'movimentacao' || p.tipo === 'reposicao' || p.tipo === 'analise' ? p.tipo : 'consumo'
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
  if (n.tipo === 'analise') {
    // o CSV do painel traz o consumo dia a dia do período, sem o anterior, para outros
    // gráficos numa planilha
    const dados = await dadosDaAnalise(n.de, n.ate, n.de, n.agrupar)
    const nomeChave = { item: 'Código', destino: 'Destino', colaborador: 'Matrícula / nome' }[
      n.agrupar
    ]
    return {
      ...n,
      titulo: 'Consumo por dia',
      cabecalho: ['Dia', nomeChave, 'Descrição', 'Quantidade consumida'],
      linhas: dados.porDia
        .sort((a, b) => a.dia.localeCompare(b.dia) || a.chave.localeCompare(b.chave))
        .map((l) => [l.dia, l.chave, l.nome, l.quantidade]),
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
