'use client'

import { X } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
import {
  COR_CINZA,
  COR_SERIE,
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
  diasNoPeriodo,
  maioresEOutros,
  mapaDeCalor,
  serieNoTempo,
  tamanhoDoBalde,
  variacao,
} from '@/domain/analise'
import { formatarNumero, formatarVariacao } from '@/lib/formatar'

export interface DadosDoPainel {
  deIso: string
  ateIso: string
  anterior: { deIso: string; ateIso: string }
  /** nome da dimensão: Item, Destino ou Colaborador */
  dimensao: string
  porDia: { dia: string; chave: string; nome: string; quantidade: number }[]
  porHora: { diaSemana: number; hora: number; chave: string; quantidade: number }[]
  fluxo: { dia: string; entradas: number; saidas: number }[]
  situacao: Record<string, number>
}

const MOSTRAR_NO_RANKING = 10
const CORES_NA_COMPOSICAO = 4
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
    <section
      aria-label={titulo}
      className={`min-w-0 rounded-[14px] border border-line bg-surface p-5 shadow-cartao break-inside-avoid ${className}`}
    >
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
    <section
      aria-label={rotulo}
      className="flex min-w-0 flex-col gap-2 rounded-[14px] border border-line bg-surface p-5 shadow-cartao"
    >
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

/**
 * RF-17a: painel analítico dos relatórios, no estilo de um painel de BI. Clicar num item do
 * ranking filtra os gráficos de consumo e os números; clicar de novo, ou no "x", tira o filtro.
 * Todas as contas vêm de domain/analise.ts; o servidor só entrega os números agregados.
 */
export function PainelAnalitico({ dados }: { dados: DadosDoPainel }) {
  const [filtro, setFiltro] = useState<string | null>(null)
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
  const doFiltro = (chave: string) => filtro === null || chave === filtro

  // ranking e cores são do período inteiro, sem filtro: a cor segue o item, não a posição
  const parcelas = useMemo(() => {
    const m = new Map<string, { chave: string; nome: string; total: number }>()
    for (const r of dados.porDia) {
      if (!noPeriodo(r.dia)) continue
      const p = m.get(r.chave) ?? { chave: r.chave, nome: r.nome, total: 0 }
      p.total += r.quantidade
      m.set(r.chave, p)
    }
    return [...m.values()]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados])
  const ranking = maioresEOutros(parcelas, MOSTRAR_NO_RANKING)
  const destaques = maioresEOutros(parcelas, CORES_NA_COMPOSICAO).filter(
    (p) => p.chave !== 'Outros',
  )
  const corDo = (chave: string) => {
    const i = destaques.findIndex((d) => d.chave === chave)
    return i >= 0 ? COR_SERIE[i] : COR_CINZA
  }
  const nomeDoFiltro = parcelas.find((p) => p.chave === filtro)?.nome

  const atual = serieNoTempo(
    dados.porDia.filter((r) => noPeriodo(r.dia) && doFiltro(r.chave)),
    baldes,
    tamanho,
  )
  const anterior = serieNoTempo(
    dados.porDia.filter((r) => noAnterior(r.dia) && doFiltro(r.chave)),
    baldesAnteriores,
    tamanho,
  )
  // os dois períodos lado a lado pela posição (1º dia com 1º dia)
  const anteriorAlinhado = baldes.map((_, i) => anterior[i] ?? 0)
  const total = atual.reduce((s, v) => s + v, 0)
  const totalAnterior = anterior.reduce((s, v) => s + v, 0)
  const delta = variacao(total, totalAnterior)
  const indicePico = atual.indexOf(Math.max(...atual))
  const emAlerta =
    (dados.situacao.ATENCAO ?? 0) + (dados.situacao.CRITICO ?? 0) + (dados.situacao.ZERADO ?? 0)

  const composicao =
    filtro !== null
      ? [
          {
            nome: filtro,
            cor: corDo(filtro) === COR_CINZA ? COR_SERIE[0] : corDo(filtro),
            valores: atual,
          },
        ]
      : [
          ...destaques.map((d, i) => ({
            nome: d.chave,
            cor: COR_SERIE[i],
            valores: serieNoTempo(
              dados.porDia.filter((r) => noPeriodo(r.dia) && r.chave === d.chave),
              baldes,
              tamanho,
            ),
          })),
          ...(parcelas.length > destaques.length
            ? [
                {
                  nome: 'Outros',
                  cor: COR_CINZA,
                  valores: serieNoTempo(
                    dados.porDia.filter(
                      (r) => noPeriodo(r.dia) && !destaques.some((d) => d.chave === r.chave),
                    ),
                    baldes,
                    tamanho,
                  ),
                },
              ]
            : []),
        ]

  const calor = mapaDeCalor(dados.porHora.filter((r) => doFiltro(r.chave)))
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
  const rotulos = baldes.map((b) => b.rotulo)
  const porBalde = `por ${NOME_DO_BALDE[tamanho]}`
  const sufixoFiltro = filtro ? ` · ${filtro}` : ''

  if (parcelas.length === 0 && dados.fluxo.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-line-2 p-8 text-center text-ink-2">
        Nenhuma movimentação neste período. Escolha outro período acima.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {filtro && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-accent bg-accent-soft px-4 py-2.5 text-[13px] text-accent-ink"
        >
          <span>
            Filtrando por <strong>{filtro}</strong>
            {nomeDoFiltro ? ` · ${nomeDoFiltro}` : ''}. Os gráficos de consumo e os números mostram
            só este {dados.dimensao.toLowerCase()}.
          </span>
          <button
            type="button"
            onClick={() => setFiltro(null)}
            className="nao-imprimir ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium hover:bg-surface"
          >
            <X aria-hidden className="size-3.5" />
            Tirar o filtro
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 min-[75rem]:grid-cols-4">
        <Numero
          rotulo={`Consumo no período${sufixoFiltro}`}
          valor={`${formatarNumero(total)} un.`}
          detalhe={
            delta === null
              ? 'Sem consumo no período anterior para comparar.'
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
          rotulo={`Maior consumo num só ${NOME_DO_BALDE[tamanho]}`}
          valor={total > 0 ? `${formatarNumero(atual[indicePico])} un.` : '—'}
          detalhe={total > 0 ? `em ${rotulos[indicePico]}` : 'Nenhum consumo no período.'}
        />
        <Numero
          rotulo="Itens em alerta agora"
          valor={formatarNumero(emAlerta)}
          detalhe={
            <>
              {dados.situacao.ZERADO ?? 0} zerados, {dados.situacao.CRITICO ?? 0} críticos.{' '}
              <Link href="/alertas" className="nao-imprimir">
                Ver alertas
              </Link>
            </>
          }
        />
      </div>

      <div className="grid gap-6 min-[75rem]:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Cartao
          titulo={`Evolução do consumo${sufixoFiltro}`}
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
            rotulo="Evolução do consumo"
            cabecalho={[
              NOME_DO_BALDE[tamanho] === 'mês' ? 'Mês' : 'Início',
              'Este período',
              'Período anterior',
            ]}
            linhas={rotulos.map((r, i) => [r, atual[i], anteriorAlinhado[i]])}
          />
        </Cartao>
        <Cartao
          titulo={`Consumo por ${dados.dimensao.toLowerCase()}`}
          subtitulo="Clique numa barra para filtrar o painel."
        >
          <GraficoRanking
            linhas={ranking.map((p) => ({ ...p, filtravel: p.chave !== 'Outros' }))}
            selecionado={filtro}
            aoSelecionar={setFiltro}
          />
        </Cartao>
      </div>

      <div className="grid gap-6 min-[75rem]:grid-cols-2">
        <Cartao
          titulo={filtro ? `Consumo de ${filtro} ${porBalde}` : `Quem mais consome, ${porBalde}`}
          subtitulo={
            filtro
              ? 'Só o item filtrado.'
              : `Os ${destaques.length} maiores e o resto somado em "Outros".`
          }
        >
          <div className="mb-3">
            <Legenda itens={composicao.map((s) => ({ nome: s.nome, cor: s.cor }))} />
          </div>
          <GraficoEmpilhado rotulos={rotulos} series={composicao} />
          <VerDados
            rotulo="Composição do consumo"
            cabecalho={['Período', ...composicao.map((s) => s.nome)]}
            linhas={rotulos.map((r, i) => [r, ...composicao.map((s) => s.valores[i])])}
          />
        </Cartao>
        <Cartao
          titulo={`Quando as pastilhas saem${sufixoFiltro}`}
          subtitulo="Unidades consumidas por dia da semana e hora (horário de Brasília)."
        >
          <MapaDeCalor matriz={calor} />
        </Cartao>
      </div>

      <Cartao
        titulo="Entradas e saídas do estoque"
        subtitulo={`Todos os itens, ${porBalde}: compras, devoluções e ajustes para cima; consumo, perdas e ajustes para baixo.`}
      >
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
    </div>
  )
}
