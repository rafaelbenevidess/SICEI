import 'server-only'
import { leadTimeParaCalculo, sugestaoDeCompra } from '@/domain/estoque'
import { listaDeFornecedores } from '@/domain/precos'
import { prisma } from '../db'
import { lerParametros } from '../parametros'

export type Agrupamento = 'item' | 'destino' | 'colaborador'

/** RF-17: consumo da produção por item, destino ou colaborador, sem as saídas estornadas. */
export async function relatorioConsumo(de: Date, ate: Date, agrupar: Agrupamento) {
  const dias = Math.max(1, Math.ceil((ate.getTime() - de.getTime()) / 86_400_000))
  const linhas = await prisma.$queryRaw<
    { chave: string; nome: string; total: bigint; movimentacoes: bigint }[]
  >`
    SELECT
      CASE ${agrupar}::text WHEN 'item' THEN i.codigo WHEN 'destino' THEN d.codigo ELSE COALESCE(c.matricula, c.nome) END AS chave,
      CASE ${agrupar}::text WHEN 'item' THEN i.descricao WHEN 'destino' THEN d.nome ELSE c.nome END AS nome,
      SUM(m.quantidade)::bigint AS total,
      COUNT(*)::bigint AS movimentacoes
      FROM movimentacao m
      JOIN item i ON i.id = m.item_id
      LEFT JOIN destino d ON d.id = m.destino_id
      LEFT JOIN colaborador c ON c.id = m.colaborador_id
     WHERE m.tipo = 'CONSUMO_PRODUCAO' AND m.criado_em BETWEEN ${de} AND ${ate}
       AND NOT EXISTS (SELECT 1 FROM movimentacao e WHERE e.estorna_id = m.id)
     GROUP BY 1, 2
     ORDER BY total DESC`
  return linhas.map((l) => ({
    chave: l.chave,
    nome: l.nome,
    total: Number(l.total),
    movimentacoes: Number(l.movimentacoes),
    mediaDiaria: Number(l.total) / dias,
  }))
}

/** RF-18: saldo inicial, entradas, saídas e saldo final de cada item no período. */
export async function relatorioMovimentacao(de: Date, ate: Date) {
  const linhas = await prisma.$queryRaw<
    {
      id: string
      codigo: string
      descricao: string
      saldo_atual: number
      inicial: bigint
      entradas: bigint
      saidas: bigint
    }[]
  >`
    WITH efeito AS (
      SELECT m.item_id, m.criado_em, (m.saldo_posterior - m.saldo_anterior) AS delta FROM movimentacao m
    )
    SELECT i.id, i.codigo, i.descricao, i.saldo AS saldo_atual,
           COALESCE(SUM(e.delta) FILTER (WHERE e.criado_em < ${de}), 0)::bigint AS inicial,
           COALESCE(SUM(e.delta) FILTER (WHERE e.criado_em BETWEEN ${de} AND ${ate} AND e.delta > 0), 0)::bigint AS entradas,
           COALESCE(-SUM(e.delta) FILTER (WHERE e.criado_em BETWEEN ${de} AND ${ate} AND e.delta < 0), 0)::bigint AS saidas
      FROM item i LEFT JOIN efeito e ON e.item_id = i.id
     GROUP BY i.id, i.codigo, i.descricao, i.saldo
     ORDER BY i.codigo`
  return linhas.map((l) => {
    const inicial = Number(l.inicial)
    const entradas = Number(l.entradas)
    const saidas = Number(l.saidas)
    return {
      id: l.id,
      codigo: l.codigo,
      descricao: l.descricao,
      inicial,
      entradas,
      saidas,
      final: inicial + entradas - saidas,
      saldoAtual: l.saldo_atual,
    }
  })
}

/** RF-19 / RN-20: necessidade de reposição, só itens ativos em ATENCAO, CRITICO ou ZERADO. */
export async function relatorioReposicao() {
  const { janelaConsumoDias } = await lerParametros()
  const itens = await prisma.item.findMany({
    where: { ativo: true, status: { in: ['ATENCAO', 'CRITICO', 'ZERADO'] } },
    include: { fornecedores: { include: { fornecedor: true } }, posicao: true },
    orderBy: [{ status: 'desc' }, { codigo: 'asc' }],
  })
  const consumos = await prisma.$queryRaw<{ item_id: string; total: bigint }[]>`
    SELECT m.item_id, SUM(m.quantidade)::bigint AS total FROM movimentacao m
     WHERE m.tipo = 'CONSUMO_PRODUCAO' AND m.criado_em >= now() - make_interval(days => ${janelaConsumoDias}::int)
       AND NOT EXISTS (SELECT 1 FROM movimentacao e WHERE e.estorna_id = m.id)
     GROUP BY m.item_id`
  const consumoPorItem = new Map(
    consumos.map((c) => [c.item_id, Number(c.total) / janelaConsumoDias]),
  )

  return itens.map((item) => {
    const consumoDiario = consumoPorItem.get(item.id) ?? 0
    const sugestao = sugestaoDeCompra({
      saldo: item.saldo,
      minimo: item.estoqueMinimo,
      pontoReposicao: item.pontoReposicao,
      maximo: item.estoqueMaximo,
      consumoDiario,
      embalagem: item.embalagem,
    })
    const fornecedores = listaDeFornecedores(
      item.fornecedores.map((v) => ({
        fornecedorId: v.fornecedorId,
        nome: v.fornecedor.nomeFantasia ?? v.fornecedor.razaoSocial,
        leadTimeDias: v.leadTimeDias,
        preferencial: v.preferencial,
        compras: v.ultimoPreco
          ? [
              {
                data: v.dataUltimaCompra?.toISOString() ?? '',
                precoUnitario: Number(v.ultimoPreco),
                quantidade: 0,
                estornada: false,
              },
            ]
          : [],
      })),
    )
    const preferencial = fornecedores.find((f) => f.preferencial) ?? null
    const maisBarato = fornecedores.find((f) => f.ultimoPreco !== null) ?? null
    return {
      item,
      consumoDiario,
      sugestao,
      preferencial,
      maisBarato,
      leadTime: leadTimeParaCalculo(
        fornecedores.map((f) => ({
          preferencial: f.preferencial,
          ultimoPreco: f.ultimoPreco,
          leadTimeDias: f.leadTimeDias,
        })),
      ),
    }
  })
}

/** Um grupo do relatório (item, destino ou colaborador): chave curta e nome por extenso. */
export interface GrupoDaAnalise {
  chave: string
  nome: string
}

/**
 * RF-17a: números do painel analítico. O banco só agrega; os gráficos e o filtro por clique
 * são montados na tela com as funções de domain/analise.ts. As datas e horas são as de São
 * Paulo, para "segunda às 7h" ser a hora do relógio da fábrica.
 */
export async function dadosDaAnalise(de: Date, ate: Date, deAnterior: Date, agrupar: Agrupamento) {
  const [porDia, porHora, fluxo, situacao] = await Promise.all([
    prisma.$queryRaw<{ dia: string; chave: string; nome: string; total: bigint }[]>`
      SELECT to_char((m.criado_em AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS dia,
        CASE ${agrupar}::text WHEN 'item' THEN i.codigo WHEN 'destino' THEN d.codigo ELSE COALESCE(c.matricula, c.nome) END AS chave,
        CASE ${agrupar}::text WHEN 'item' THEN i.descricao WHEN 'destino' THEN d.nome ELSE c.nome END AS nome,
        SUM(m.quantidade)::bigint AS total
        FROM movimentacao m
        JOIN item i ON i.id = m.item_id
        LEFT JOIN destino d ON d.id = m.destino_id
        LEFT JOIN colaborador c ON c.id = m.colaborador_id
       WHERE m.tipo = 'CONSUMO_PRODUCAO' AND m.criado_em BETWEEN ${deAnterior} AND ${ate}
         AND NOT EXISTS (SELECT 1 FROM movimentacao e WHERE e.estorna_id = m.id)
       GROUP BY 1, 2, 3`,
    prisma.$queryRaw<{ dia_semana: number; hora: number; chave: string; total: bigint }[]>`
      SELECT EXTRACT(DOW FROM m.criado_em AT TIME ZONE 'America/Sao_Paulo')::int AS dia_semana,
        EXTRACT(HOUR FROM m.criado_em AT TIME ZONE 'America/Sao_Paulo')::int AS hora,
        CASE ${agrupar}::text WHEN 'item' THEN i.codigo WHEN 'destino' THEN d.codigo ELSE COALESCE(c.matricula, c.nome) END AS chave,
        SUM(m.quantidade)::bigint AS total
        FROM movimentacao m
        JOIN item i ON i.id = m.item_id
        LEFT JOIN destino d ON d.id = m.destino_id
        LEFT JOIN colaborador c ON c.id = m.colaborador_id
       WHERE m.tipo = 'CONSUMO_PRODUCAO' AND m.criado_em BETWEEN ${de} AND ${ate}
         AND NOT EXISTS (SELECT 1 FROM movimentacao e WHERE e.estorna_id = m.id)
       GROUP BY 1, 2, 3`,
    // entradas e saídas pelo efeito no saldo: inclui ajustes, inventários e estornos
    prisma.$queryRaw<{ dia: string; entradas: bigint; saidas: bigint }[]>`
      SELECT to_char((m.criado_em AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS dia,
        COALESCE(SUM(m.saldo_posterior - m.saldo_anterior) FILTER (WHERE m.saldo_posterior > m.saldo_anterior), 0)::bigint AS entradas,
        COALESCE(SUM(m.saldo_anterior - m.saldo_posterior) FILTER (WHERE m.saldo_posterior < m.saldo_anterior), 0)::bigint AS saidas
        FROM movimentacao m
       WHERE m.criado_em BETWEEN ${de} AND ${ate}
       GROUP BY 1`,
    prisma.item.groupBy({ by: ['status'], where: { ativo: true }, _count: { _all: true } }),
  ])
  return {
    porDia: porDia.map((l) => ({
      dia: l.dia,
      chave: l.chave,
      nome: l.nome,
      quantidade: Number(l.total),
    })),
    porHora: porHora.map((l) => ({
      diaSemana: l.dia_semana,
      hora: l.hora,
      chave: l.chave,
      quantidade: Number(l.total),
    })),
    fluxo: fluxo.map((l) => ({
      dia: l.dia,
      entradas: Number(l.entradas),
      saidas: Number(l.saidas),
    })),
    situacao: Object.fromEntries(situacao.map((s) => [s.status, s._count._all])) as Record<
      string,
      number
    >,
  }
}

export type DadosDaAnalise = Awaited<ReturnType<typeof dadosDaAnalise>>
