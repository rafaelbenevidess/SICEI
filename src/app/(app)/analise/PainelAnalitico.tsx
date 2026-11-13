'use client'

import { X } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
import {
  COR_CINZA,
  COR_SERIE,
  GraficoComparacao,
  GraficoEmpilhado,
  GraficoFluxo,
  GraficoLinha,
  GraficoRanking,
  Legenda,
  MapaDeCalor,
  Minilinha,
  VerDados,
} from '@/components/graficos'
import {
  baldesDoPeriodo,
  compararNaEvolucao,
  completarSelecao,
  diasNoPeriodo,
  CORES_DISTINTAS,
  maioresEOutros,
  mapaDeCalor,
  serieNoTempo,
  tamanhoDoBalde,
  variacao,
  type Parcela,
} from '@/domain/analise'
import { formatarNumero, formatarVariacao } from '@/lib/formatar'

export interface DadosDoPainel {
  deIso: string
  ateIso: string
  anterior: { deIso: string; ateIso: string }
  dimensao: { singular: string; plural: string }
  /** como mostrar cada um: pelo código (item, destino), pelo nome da pessoa ou só pelo nome */
  apresentar: 'codigo' | 'pessoa' | 'nome'
  medida: { titulo: string; curto: string; pico: string }
  /** escolhidos da dimensão comparada, na ordem em que foram escolhidos */
  escolhidos: { chave: string; nome: string }[]
  /** subtítulo do gráfico de entradas e saídas (diz se os filtros valem para ele) */
  notaDoFluxo: string
  /** os alertas contam só os itens dos filtros */
  alertasFiltrados: boolean
  porDia: { dia: string; chave: string; nome: string; quantidade: number; vezes: number }[]
  porHora: { diaSemana: number; hora: number; chave: string; quantidade: number }[]
  fluxo: { dia: string; entradas: number; saidas: number }[]
  situacao: Record<string, number>
}

const MOSTRAR_NO_RANKING = 10
const NOME_DO_BALDE = { dia: 'dia', semana: 'semana', mes: 'mês' } as const

function Cartao({
  titulo,
  subtitulo,
  children,
  className = '',
}: {
  titulo: string
  subtitulo?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section aria-label={titulo} className={`min-w-0 cartao p-5 break-inside-avoid ${className}`}>
      <header className="mb-4">
        <h2 className="text-[15px] font-semibold">{titulo}</h2>
        {subtitulo && <p className="mt-0.5 text-[13px] text-ink-3">{subtitulo}</p>}
      </header>
      {children}
    </section>
  )
}

function Numero({
  rotulo,
  valor,
  detalhe,
  children,
}: {
  rotulo: string
  valor: string
  detalhe?: ReactNode
  /** minilinha do tempo, ao lado do rótulo */
  children?: ReactNode
}) {
  return (
    <section aria-label={rotulo} className="flex min-w-0 flex-col gap-2 cartao p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-ink-2">{rotulo}</p>
        {children}
      </div>
      <p className="text-[32px] leading-none font-semibold tracking-[-0.03em] whitespace-nowrap">
        {valor}
      </p>
      {detalhe && <p className="text-[13px] text-ink-3">{detalhe}</p>}
    </section>
  )
}

const somar = (valores: number[]) => valores.reduce((s, v) => s + v, 0)

/**
 * RF-17a: painel de análise, no estilo de um painel de BI. Os filtros da página já chegam
 * aplicados pelo servidor; aqui, clicar numa barra do ranking põe aquele em foco (os números e
 * os gráficos de consumo mostram só ele) e clicar de novo, ou no "x", tira o foco. Todas as
 * contas vêm de domain/analise.ts.
 */
export function PainelAnalitico({ dados }: { dados: DadosDoPainel }) {
  const [foco, setFoco] = useState<string | null>(null)
  const dias = diasNoPeriodo(dados.deIso, dados.ateIso)
  const tamanho = tamanhoDoBalde(dias)
  const baldes = useMemo(
    () => baldesDoPeriodo(dados.deIso, dados.ateIso, tamanho),
    [dados.deIso, dados.ateIso, tamanho],
  )
  const baldesAnteriores = useMemo(
    () => baldesDoPeriodo(dados.anterior.deIso, dados.anterior.ateIso, tamanho),
    [dados.anterior, tamanho],
  )
  const noPeriodo = (dia: string) => dia >= dados.deIso && dia <= dados.ateIso
  const noAnterior = (dia: string) => dia >= dados.anterior.deIso && dia <= dados.anterior.ateIso
  const doFoco = (chave: string) => foco === null || chave === foco
  const medida = dados.medida.curto.toLowerCase()
  const unidadeDaDimensao = dados.dimensao.singular.toLowerCase()

  // totais por chave no período (e no anterior, para a tabela de detalhe)
  const { parcelas, anteriores, vezes } = useMemo(() => {
    const m = new Map<string, Parcela>()
    const ant = new Map<string, number>()
    const vz = new Map<string, number>()
    for (const r of dados.porDia) {
      if (noAnterior(r.dia)) ant.set(r.chave, (ant.get(r.chave) ?? 0) + r.quantidade)
      if (!noPeriodo(r.dia)) continue
      const p = m.get(r.chave) ?? { chave: r.chave, nome: r.nome, total: 0 }
      p.total += r.quantidade
      m.set(r.chave, p)
      vz.set(r.chave, (vz.get(r.chave) ?? 0) + r.vezes)
    }
    return {
      parcelas: completarSelecao([...m.values()], dados.escolhidos),
      anteriores: ant,
      vezes: vz,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados])

  const nomeDe = (chave: string) =>
    parcelas.find((p) => p.chave === chave)?.nome ??
    dados.escolhidos.find((e) => e.chave === chave)?.nome ??
    chave
  const rotuloDe = (chave: string) => (dados.apresentar === 'codigo' ? chave : nomeDe(chave))
  const detalheDe = (chave: string) => {
    const nome = nomeDe(chave)
    if (dados.apresentar === 'codigo') return nome
    if (dados.apresentar === 'pessoa' && chave !== nome) return `Matrícula ${chave}`
    return undefined
  }

  // cores: os escolhidos, na ordem da escolha; sem escolha, os 8 maiores. A cor segue o item.
  const comEscolha = dados.escolhidos.length > 0
  const coloridos = comEscolha
    ? dados.escolhidos.slice(0, CORES_DISTINTAS).map((e) => e.chave)
    : maioresEOutros(parcelas, CORES_DISTINTAS)
        .filter((p) => p.chave !== 'Outros')
        .map((p) => p.chave)
  const corDo = (chave: string) => {
    const i = coloridos.indexOf(chave)
    return i >= 0 ? COR_SERIE[i] : COR_CINZA
  }

  const serieDe = (filtro: (chave: string) => boolean) =>
    serieNoTempo(
      dados.porDia.filter((r) => noPeriodo(r.dia) && filtro(r.chave)),
      baldes,
      tamanho,
    )
  const atual = serieDe(doFoco)
  const anterior = serieNoTempo(
    dados.porDia.filter((r) => noAnterior(r.dia) && doFoco(r.chave)),
    baldesAnteriores,
    tamanho,
  )
  // os dois períodos lado a lado pela posição (1º dia com 1º dia)
  const anteriorAlinhado = baldes.map((_, i) => anterior[i] ?? 0)
  const total = somar(atual)
  const totalAnterior = somar(anterior)
  const delta = variacao(total, totalAnterior)
  const indicePico = atual.indexOf(Math.max(...atual))
  const emAlerta =
    (dados.situacao.ATENCAO ?? 0) + (dados.situacao.CRITICO ?? 0) + (dados.situacao.ZERADO ?? 0)

  const rotulos = baldes.map((b) => b.rotulo)
  const porBalde = `por ${NOME_DO_BALDE[tamanho]}`
  const sufixoFoco = foco ? ` · ${rotuloDe(foco)}` : ''
  const comparar = compararNaEvolucao(dados.escolhidos.length, foco !== null)
  const comparacao = dados.escolhidos.map((e) => ({
    nome: rotuloDe(e.chave),
    cor: corDo(e.chave),
    valores: serieDe((c) => c === e.chave),
  }))

  const composicao =
    foco !== null
      ? [
          {
            nome: rotuloDe(foco),
            cor: corDo(foco) === COR_CINZA ? COR_SERIE[0] : corDo(foco),
            valores: atual,
          },
        ]
      : [
          ...coloridos.map((chave) => ({
            nome: rotuloDe(chave),
            cor: corDo(chave),
            valores: serieDe((c) => c === chave),
          })),
          ...(parcelas.some((p) => !coloridos.includes(p.chave))
            ? [
                {
                  nome: 'Outros',
                  cor: COR_CINZA,
                  valores: serieDe((c) => !coloridos.includes(c)),
                },
              ]
            : []),
        ]

  const ranking = maioresEOutros(parcelas, MOSTRAR_NO_RANKING)
  const calor = mapaDeCalor(dados.porHora.filter((r) => doFoco(r.chave)))
  const entradas = serieNoTempo(
    dados.fluxo.map((f) => ({ dia: f.dia, quantidade: f.entradas })),
    baldes,
    tamanho,
  )
  const saidas = serieNoTempo(
    dados.fluxo.map((f) => ({ dia: f.dia, quantidade: f.saidas })),
    baldes,
    tamanho,
  )
  const totalDoPeriodo = somar(parcelas.map((p) => p.total))
  const detalhe = [...parcelas].sort((a, b) => b.total - a.total || a.chave.localeCompare(b.chave))

  if (parcelas.length === 0 && dados.fluxo.length === 0) {
    return (
      <p className="rounded-cartao border border-dashed border-line-2 p-8 text-center text-ink-2">
        Nada encontrado com estes filtros neste período. Mude o período ou tire algum filtro.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {foco && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-accent bg-accent-soft px-4 py-2.5 text-[13px] text-accent-ink"
        >
          <span>
            Em foco: <strong>{rotuloDe(foco)}</strong>
            {detalheDe(foco) ? ` · ${detalheDe(foco)}` : ''}. Os números e os gráficos de {medida}{' '}
            mostram só este {unidadeDaDimensao}.
          </span>
          <button
            type="button"
            onClick={() => setFoco(null)}
            className="nao-imprimir ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium hover:bg-surface"
          >
            <X aria-hidden className="size-3.5" />
            Tirar o foco
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 min-[75rem]:grid-cols-4">
        <Numero
          rotulo={`${dados.medida.curto} no período${sufixoFoco}`}
          valor={`${formatarNumero(total)} un.`}
          detalhe={
            delta === null
              ? 'Nada no período anterior para comparar.'
              : `${formatarVariacao(delta)} em relação aos ${dias} dias anteriores (${formatarNumero(totalAnterior)} un.)`
          }
        >
          <Minilinha valores={atual} />
        </Numero>
        <Numero
          rotulo="Média por dia"
          valor={`${formatarNumero(Math.round((total / dias) * 10) / 10)} un.`}
          detalhe={`${dias} ${dias === 1 ? 'dia' : 'dias'} no período`}
        />
        <Numero
          rotulo={`${dados.medida.pico} num só ${NOME_DO_BALDE[tamanho]}`}
          valor={total > 0 ? `${formatarNumero(atual[indicePico])} un.` : '—'}
          detalhe={total > 0 ? `em ${rotulos[indicePico]}` : 'Nada no período.'}
        />
        <Numero
          rotulo="Itens em alerta agora"
          valor={formatarNumero(emAlerta)}
          detalhe={
            <>
              {dados.alertasFiltrados ? 'Dos itens dos filtros: ' : ''}
              {dados.situacao.ZERADO ?? 0} zerados, {dados.situacao.CRITICO ?? 0} críticos.{' '}
              <Link href="/alertas" className="nao-imprimir">
                Ver alertas
              </Link>
            </>
          }
        />
      </div>

      <div className="grid gap-6 min-[75rem]:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {comparar ? (
          <Cartao
            titulo="Evolução, lado a lado"
            subtitulo={`Unidades ${porBalde} de cada ${unidadeDaDimensao} escolhido.`}
          >
            <div className="mb-3">
              <Legenda
                itens={comparacao.map((s) => ({ nome: s.nome, cor: s.cor, forma: 'linha' }))}
              />
            </div>
            <GraficoComparacao rotulos={rotulos} series={comparacao} />
            <VerDados
              rotulo="Evolução lado a lado"
              cabecalho={['Período', ...comparacao.map((s) => s.nome)]}
              linhas={rotulos.map((r, i) => [r, ...comparacao.map((s) => s.valores[i])])}
            />
          </Cartao>
        ) : (
          <Cartao
            titulo={`Evolução${sufixoFoco}`}
            subtitulo={`Unidades ${porBalde}, comparadas com o período anterior do mesmo tamanho.`}
          >
            <div className="mb-3">
              <Legenda
                itens={[
                  { nome: 'Este período', cor: 'var(--serie-1)', forma: 'linha' },
                  { nome: 'Período anterior', cor: COR_CINZA, forma: 'linha' },
                ]}
              />
            </div>
            <GraficoLinha
              rotulos={rotulos}
              atual={atual}
              anterior={anteriorAlinhado}
              nomeAtual="este período"
              nomeAnterior="período anterior"
            />
            <VerDados
              rotulo="Evolução"
              cabecalho={[tamanho === 'mes' ? 'Mês' : 'Início', 'Este período', 'Período anterior']}
              linhas={rotulos.map((r, i) => [r, atual[i], anteriorAlinhado[i]])}
            />
          </Cartao>
        )}
        <Cartao
          titulo={`Por ${unidadeDaDimensao}`}
          subtitulo="Clique numa barra para pôr em foco; clique de novo para tirar."
        >
          <GraficoRanking
            linhas={ranking.map((p) => ({
              chave: p.chave,
              rotulo: p.chave === 'Outros' ? 'Outros' : rotuloDe(p.chave),
              detalhe: p.chave === 'Outros' ? p.nome : detalheDe(p.chave),
              total: p.total,
              filtravel: p.chave !== 'Outros',
              cor: corDo(p.chave),
            }))}
            selecionado={foco}
            aoSelecionar={setFoco}
          />
        </Cartao>
      </div>

      <div className="grid gap-6 min-[75rem]:grid-cols-2">
        <Cartao
          titulo={foco ? `Composição · ${rotuloDe(foco)}` : 'Composição'}
          subtitulo={
            foco
              ? `Só o ${unidadeDaDimensao} em foco, ${porBalde}.`
              : parcelas.length > CORES_DISTINTAS
                ? `Cada um na sua cor, ${porBalde}; do ${CORES_DISTINTAS + 1}º em diante, somados em "Outros".`
                : `Cada um na sua cor, ${porBalde}.`
          }
        >
          <div className="mb-3">
            <Legenda itens={composicao.map((s) => ({ nome: s.nome, cor: s.cor }))} />
          </div>
          <GraficoEmpilhado rotulos={rotulos} series={composicao} />
          <VerDados
            rotulo="Composição"
            cabecalho={['Período', ...composicao.map((s) => s.nome)]}
            linhas={rotulos.map((r, i) => [r, ...composicao.map((s) => s.valores[i])])}
          />
        </Cartao>
        <Cartao
          titulo={`Quando as pastilhas saem${sufixoFoco}`}
          subtitulo="Unidades por dia da semana e hora (horário de Brasília)."
        >
          <MapaDeCalor matriz={calor} />
        </Cartao>
      </div>

      <Cartao titulo="Entradas e saídas do estoque" subtitulo={dados.notaDoFluxo}>
        <div className="mb-3">
          <Legenda
            itens={[
              { nome: 'Entradas', cor: 'var(--serie-1)' },
              { nome: 'Saídas', cor: 'var(--serie-2)' },
            ]}
          />
        </div>
        <GraficoFluxo rotulos={rotulos} entradas={entradas} saidas={saidas} />
        <VerDados
          rotulo="Entradas e saídas"
          cabecalho={['Período', 'Entradas', 'Saídas', 'Saldo']}
          linhas={rotulos.map((r, i) => [r, entradas[i], saidas[i], entradas[i] - saidas[i]])}
        />
      </Cartao>

      <Cartao
        titulo={`Detalhe por ${unidadeDaDimensao}`}
        subtitulo={`${dados.medida.titulo} de cada ${unidadeDaDimensao}, comparado com os ${dias} dias anteriores.`}
      >
        <div className="overflow-x-auto print:overflow-visible">
          <table
            aria-label={`Detalhe por ${unidadeDaDimensao}`}
            className="w-full min-w-[40rem] text-left text-[13px] tabular-nums print:min-w-0 print:text-xs"
          >
            <thead className="text-xs text-ink-3">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-medium">{dados.dimensao.singular}</th>
                <th className="px-3 py-2 text-right font-medium">No período</th>
                <th className="px-3 py-2 text-right font-medium">Anterior</th>
                <th className="px-3 py-2 text-right font-medium">Variação</th>
                <th className="px-3 py-2 text-right font-medium">Por dia</th>
                <th className="px-3 py-2 text-right font-medium">Do total</th>
                <th className="py-2 pl-3 text-right font-medium">Retiradas</th>
              </tr>
            </thead>
            <tbody>
              {detalhe.map((p) => {
                const ant = anteriores.get(p.chave) ?? 0
                const v = variacao(p.total, ant)
                return (
                  <tr
                    key={p.chave}
                    className={`border-b border-line last:border-0 ${p.chave === foco ? 'bg-accent-soft' : ''}`}
                  >
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-2">
                        {corDo(p.chave) !== COR_CINZA && (
                          <span
                            aria-hidden
                            className="size-2.5 shrink-0 rounded-[3px]"
                            style={{ background: corDo(p.chave) }}
                          />
                        )}
                        <span className="min-w-0">
                          <span className="block font-medium text-ink">{rotuloDe(p.chave)}</span>
                          {detalheDe(p.chave) && (
                            <span className="block text-xs text-ink-3">{detalheDe(p.chave)}</span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-ink">
                      {formatarNumero(p.total)}
                    </td>
                    <td className="px-3 py-2 text-right text-ink-2">{formatarNumero(ant)}</td>
                    <td className="px-3 py-2 text-right text-ink-2">
                      {v === null ? '—' : formatarVariacao(v)}
                    </td>
                    <td className="px-3 py-2 text-right text-ink-2">
                      {formatarNumero(Math.round((p.total / dias) * 10) / 10)}
                    </td>
                    <td className="px-3 py-2 text-right text-ink-2">
                      {totalDoPeriodo
                        ? `${formatarNumero(Math.round((p.total / totalDoPeriodo) * 1000) / 10)}%`
                        : '—'}
                    </td>
                    <td className="py-2 pl-3 text-right text-ink-2">
                      {formatarNumero(vezes.get(p.chave) ?? 0)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Cartao>
    </div>
  )
}
