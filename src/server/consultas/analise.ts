import 'server-only'
import { Prisma } from '@/generated/prisma/client'
import { periodoAnterior } from '@/domain/analise'
import { validar } from '@/domain/schemas/comum'
import {
  NOME_DA_DIMENSAO,
  NOME_DA_MEDIDA,
  schemaFiltrosDaAnalise,
  TIPOS_DA_MEDIDA,
  type Dimensao,
  type FiltrosDaAnalise,
} from '@/domain/schemas/analise'
import { APLICACOES } from '@/domain/schemas/cadastros'
import { diasAtrasIso, fimDoDia, hojeIso, inicioDoDia, NOME_APLICACAO } from '@/lib/formatar'
import { prisma } from '../db'

/** Filtros prontos para a consulta: o período sempre preenchido, com as datas do servidor. */
export type FiltrosNormalizados = Omit<FiltrosDaAnalise, 'de' | 'ate'> & {
  de: string
  ate: string
}

/** RF-17a: lê os filtros da URL. Sem período, os últimos 30 dias (o atalho "30 dias"). */
export function lerFiltrosDaAnalise(parametros: Record<string, unknown>): FiltrosNormalizados {
  const r = validar(schemaFiltrosDaAnalise, parametros)
  // o schema não recusa: valor estranho vira o padrão
  const f = r.ok ? r.dados : schemaFiltrosDaAnalise.parse({})
  return { ...f, de: f.de ?? diasAtrasIso(29), ate: f.ate ?? hojeIso() }
}

/** Chave e nome de cada dimensão. Saída sem destino ou sem colaborador (perda) tem um nome próprio. */
function chaveDa(por: Dimensao): Prisma.Sql {
  switch (por) {
    case 'item':
      return Prisma.sql`i.codigo`
    case 'destino':
      return Prisma.sql`COALESCE(d.codigo, 'Sem destino')`
    case 'colaborador':
      return Prisma.sql`COALESCE(c.matricula, c.nome, 'Sem colaborador')`
    case 'aplicacao':
      return Prisma.sql`i.aplicacao::text`
    case 'fabricante':
      return Prisma.sql`f.nome`
  }
}
function nomeDa(por: Dimensao): Prisma.Sql {
  switch (por) {
    case 'item':
      return Prisma.sql`i.descricao`
    case 'destino':
      return Prisma.sql`COALESCE(d.nome, 'Sem destino')`
    case 'colaborador':
      return Prisma.sql`COALESCE(c.nome, 'Sem colaborador')`
    case 'aplicacao':
      return Prisma.sql`i.aplicacao::text`
    case 'fabricante':
      return Prisma.sql`f.nome`
  }
}

/** Filtros que dizem respeito ao item: valem também para entradas e saídas e para os alertas. */
function filtroDoItem(f: FiltrosNormalizados): Prisma.Sql {
  return Prisma.sql`
    (cardinality(${f.itens}::text[]) = 0 OR i.codigo = ANY(${f.itens}::text[]))
    AND (cardinality(${f.aplicacoes}::text[]) = 0 OR i.aplicacao::text = ANY(${f.aplicacoes}::text[]))
    AND (cardinality(${f.fabricantes}::text[]) = 0 OR f.nome = ANY(${f.fabricantes}::text[]))`
}

/** Todos os filtros, para as saídas somadas (consumo, perdas). */
function filtroDaSaida(f: FiltrosNormalizados): Prisma.Sql {
  return Prisma.sql`${filtroDoItem(f)}
    AND (cardinality(${f.destinos}::text[]) = 0 OR d.codigo = ANY(${f.destinos}::text[]))
    AND (cardinality(${f.colaboradores}::text[]) = 0
         OR COALESCE(c.matricula, c.nome) = ANY(${f.colaboradores}::text[]))`
}

const JUNCOES = Prisma.sql`
  FROM movimentacao m
  JOIN item i ON i.id = m.item_id
  JOIN fabricante f ON f.id = i.fabricante_id
  LEFT JOIN destino d ON d.id = m.destino_id
  LEFT JOIN colaborador c ON c.id = m.colaborador_id`

const nomeLegivel = (por: Dimensao, nome: string) =>
  por === 'aplicacao' ? (NOME_APLICACAO[nome] ?? nome) : nome

/**
 * RF-17a: números do painel de análise, agregados no banco. O consumo por dia vai do início do
 * período anterior até o fim do atual, para a comparação. Estornadas não contam (RN-12). Datas
 * e horas no fuso de São Paulo, para "segunda às 7h" ser a hora do relógio da fábrica.
 */
export async function dadosDaAnalise(f: FiltrosNormalizados) {
  const de = inicioDoDia(f.de)!
  const ate = fimDoDia(f.ate)!
  const deAnterior = inicioDoDia(periodoAnterior(f.de, f.ate).deIso)!
  const tipos = TIPOS_DA_MEDIDA[f.medida]
  const chave = chaveDa(f.por)
  const nome = nomeDa(f.por)
  const naoEstornada = Prisma.sql`NOT EXISTS (SELECT 1 FROM movimentacao e WHERE e.estorna_id = m.id)`

  const [porDia, porHora, fluxo, situacao] = await Promise.all([
    prisma.$queryRaw<{ dia: string; chave: string; nome: string; total: bigint; vezes: bigint }[]>`
      SELECT to_char((m.criado_em AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS dia,
             ${chave} AS chave, ${nome} AS nome,
             SUM(m.quantidade)::bigint AS total, COUNT(*)::bigint AS vezes
      ${JUNCOES}
      WHERE m.tipo::text = ANY(${tipos}::text[])
        AND m.criado_em BETWEEN ${deAnterior} AND ${ate}
        AND ${naoEstornada}
        AND ${filtroDaSaida(f)}
      GROUP BY 1, 2, 3`,
    prisma.$queryRaw<{ dia_semana: number; hora: number; chave: string; total: bigint }[]>`
      SELECT EXTRACT(DOW FROM m.criado_em AT TIME ZONE 'America/Sao_Paulo')::int AS dia_semana,
             EXTRACT(HOUR FROM m.criado_em AT TIME ZONE 'America/Sao_Paulo')::int AS hora,
             ${chave} AS chave, SUM(m.quantidade)::bigint AS total
      ${JUNCOES}
      WHERE m.tipo::text = ANY(${tipos}::text[])
        AND m.criado_em BETWEEN ${de} AND ${ate}
        AND ${naoEstornada}
        AND ${filtroDaSaida(f)}
      GROUP BY 1, 2, 3`,
    // entradas e saídas pelo efeito no saldo (inclui ajustes, inventários e estornos)
    prisma.$queryRaw<{ dia: string; entradas: bigint; saidas: bigint }[]>`
      SELECT to_char((m.criado_em AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS dia,
             COALESCE(SUM(m.saldo_posterior - m.saldo_anterior)
               FILTER (WHERE m.saldo_posterior > m.saldo_anterior), 0)::bigint AS entradas,
             COALESCE(SUM(m.saldo_anterior - m.saldo_posterior)
               FILTER (WHERE m.saldo_posterior < m.saldo_anterior), 0)::bigint AS saidas
      FROM movimentacao m
      JOIN item i ON i.id = m.item_id
      JOIN fabricante f ON f.id = i.fabricante_id
      WHERE m.criado_em BETWEEN ${de} AND ${ate} AND ${filtroDoItem(f)}
      GROUP BY 1`,
    prisma.$queryRaw<{ status: string; total: bigint }[]>`
      SELECT i.status::text AS status, COUNT(*)::bigint AS total
      FROM item i JOIN fabricante f ON f.id = i.fabricante_id
      WHERE i.ativo AND ${filtroDoItem(f)}
      GROUP BY 1`,
  ])
  return {
    porDia: porDia.map((l) => ({
      dia: l.dia,
      chave: l.chave,
      nome: nomeLegivel(f.por, l.nome),
      quantidade: Number(l.total),
      vezes: Number(l.vezes),
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
    situacao: Object.fromEntries(situacao.map((s) => [s.status, Number(s.total)])) as Record<
      string,
      number
    >,
  }
}

export type DadosDaAnalise = Awaited<ReturnType<typeof dadosDaAnalise>>

export interface OpcaoDaAnalise {
  valor: string
  rotulo: string
  detalhe?: string
  busca?: string[]
}

/** Opções dos filtros: tudo o que existe, inclusive o inativo, que ainda tem histórico (RN-02). */
export async function opcoesDaAnalise(): Promise<Record<Dimensao, OpcaoDaAnalise[]>> {
  const [itens, destinos, colaboradores, fabricantes] = await Promise.all([
    prisma.item.findMany({
      select: { codigo: true, descricao: true, iso: true, classe: true, ativo: true },
      orderBy: { codigo: 'asc' },
    }),
    prisma.destino.findMany({
      select: { codigo: true, nome: true, ativo: true },
      orderBy: { codigo: 'asc' },
    }),
    prisma.colaborador.findMany({
      select: { nome: true, matricula: true, setor: true, ativo: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.fabricante.findMany({ select: { nome: true, ativo: true }, orderBy: { nome: 'asc' } }),
  ])
  const inativo = (ativo: boolean) => (ativo ? '' : ' · inativo')
  return {
    item: itens.map((i) => ({
      valor: i.codigo,
      rotulo: i.codigo,
      detalhe: `${i.descricao}${inativo(i.ativo)}`,
      busca: [i.descricao, i.iso ?? '', i.classe ?? ''].filter(Boolean),
    })),
    destino: destinos.map((d) => ({
      valor: d.codigo,
      rotulo: d.codigo,
      detalhe: `${d.nome}${inativo(d.ativo)}`,
      busca: [d.nome],
    })),
    colaborador: colaboradores.map((c) => ({
      valor: c.matricula ?? c.nome,
      rotulo: c.nome,
      detalhe: `${c.matricula ? `Matrícula ${c.matricula}` : 'Sem matrícula'}${c.setor ? ` · ${c.setor}` : ''}${inativo(c.ativo)}`,
      busca: c.matricula ? [c.matricula] : [],
    })),
    aplicacao: APLICACOES.map((a) => ({ valor: a, rotulo: NOME_APLICACAO[a] ?? a })),
    fabricante: fabricantes.map((x) => ({
      valor: x.nome,
      rotulo: x.nome,
      detalhe: x.ativo ? undefined : 'inativo',
    })),
  }
}

/**
 * RF-20: CSV da análise, com os mesmos filtros da tela: o consumo dia a dia do período, para
 * montar outros gráficos numa planilha.
 */
export async function montarCsvDaAnalise(parametros: Record<string, unknown>) {
  const f = lerFiltrosDaAnalise(parametros)
  const d = await dadosDaAnalise(f)
  return {
    filtros: f,
    cabecalho: [
      'Dia',
      NOME_DA_DIMENSAO[f.por].singular,
      'Descrição',
      NOME_DA_MEDIDA[f.medida].curto,
      'Retiradas',
    ],
    linhas: d.porDia
      .filter((l) => l.dia >= f.de)
      .sort((a, b) => a.dia.localeCompare(b.dia) || a.chave.localeCompare(b.chave))
      .map((l) => [l.dia, l.chave, l.nome, l.quantidade, l.vezes]),
  }
}
