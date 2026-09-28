'use client'

/*
 * Gráficos do painel analítico (RF-17a), em SVG e HTML simples, sem biblioteca.
 * Segue o guia de visualização do projeto: linhas de 2 px, barras finas com ponta arredondada,
 * grade discreta, um só eixo por gráfico, cores da paleta validada (--serie-*, --calor-*),
 * texto sempre nas cores de texto, dica ao passar o mouse ou focar pelo teclado, e cada
 * gráfico com a tabela dos mesmos números ("Ver dados"), para ninguém depender da cor.
 */

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { afastarRotulos, escalaDoEixo } from '@/domain/analise'
import { formatarNumero } from '@/lib/formatar'

export const COR_SERIE = ['var(--serie-1)', 'var(--serie-2)', 'var(--serie-3)', 'var(--serie-4)']
export const COR_CINZA = 'var(--serie-cinza)'

const num = (v: number) => formatarNumero(Math.round(v * 10) / 10)

/** Largura real do contêiner, para o SVG desenhar em pixels de verdade (texto sem distorção). */
function useLargura(inicial = 640) {
  const ref = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(inicial)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => setLargura(Math.max(240, Math.floor(el.getBoundingClientRect().width)))
    medir()
    // navegador antigo (ou jsdom nos testes): fica com a primeira medida
    if (typeof ResizeObserver === 'undefined') return
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, largura }
}

/** Dica flutuante: o valor em destaque e o nome em segundo plano. */
function Dica({
  x,
  y,
  largura,
  children,
}: {
  x: number
  y: number
  largura: number
  children: ReactNode
}) {
  const aDireita = x < largura / 2
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 min-w-36 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop"
      style={{
        top: Math.max(0, y - 8),
        left: aDireita ? x + 14 : undefined,
        right: aDireita ? undefined : largura - x + 14,
      }}
    >
      {children}
    </div>
  )
}

/** Linha da dica: traço curto na cor da série, valor forte, nome discreto. */
export function LinhaDaDica({ cor, valor, nome }: { cor: string; valor: string; nome: string }) {
  return (
    <span className="flex items-center gap-2 py-0.5 whitespace-nowrap">
      <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: cor }} />
      <strong className="font-semibold text-ink">{valor}</strong>
      <span className="text-ink-3">{nome}</span>
    </span>
  )
}

/** Legenda: amostra com a forma da marca (traço para linha, quadrado para barra) e o nome. */
export function Legenda({
  itens,
}: {
  itens: { nome: string; cor: string; forma?: 'linha' | 'barra' }[]
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      {itens.map((i) => (
        <li key={i.nome} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={i.forma === 'linha' ? 'h-0.5 w-4 rounded-full' : 'size-2.5 rounded-[3px]'}
            style={{ background: i.cor }}
          />
          {i.nome}
        </li>
      ))}
    </ul>
  )
}

/** Tabela com os mesmos números do gráfico, aberta sob demanda (acessibilidade e conferência). */
export function VerDados({
  rotulo,
  cabecalho,
  linhas,
}: {
  rotulo: string
  cabecalho: string[]
  linhas: (string | number)[][]
}) {
  return (
    <details className="nao-imprimir mt-3 text-[13px]">
      <summary className="cursor-pointer text-ink-3 hover:text-ink-2">Ver dados em tabela</summary>
      <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-line">
        <table aria-label={rotulo} className="w-full text-left tabular-nums">
          <thead className="sticky top-0 bg-surface-2 text-xs text-ink-3">
            <tr>
              {cabecalho.map((c, i) => (
                <th key={c} className={`px-3 py-2 font-medium ${i > 0 ? 'text-right' : ''}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} className="border-t border-line">
                {l.map((c, j) => (
                  <td key={j} className={`px-3 py-1.5 ${j > 0 ? 'text-right' : ''}`}>
                    {typeof c === 'number' ? num(c) : c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

/** Navegação pelo teclado nos gráficos de tempo: setas mudam o ponto em foco. */
function useFoco(total: number) {
  const [ativo, setAtivo] = useState<number | null>(null)
  const aoTeclar = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const passo = e.key === 'ArrowRight' ? 1 : -1
      setAtivo((a) => Math.min(total - 1, Math.max(0, (a ?? (passo > 0 ? -1 : total)) + passo)))
    } else if (e.key === 'Escape') setAtivo(null)
  }
  return { ativo, setAtivo, aoTeclar }
}

const ALTURA_EIXO_X = 22
const MARGEM = { topo: 12, direita: 12, esquerda: 40 }

/** Rótulos do eixo X sem encavalar: mostra no máximo um a cada ~56 px. */
function rotulosVisiveis(total: number, larguraUtil: number): Set<number> {
  const cabem = Math.max(2, Math.floor(larguraUtil / 56))
  const passo = Math.max(1, Math.ceil(total / cabem))
  const s = new Set<number>()
  for (let i = 0; i < total; i += passo) s.add(i)
  // o último sempre aparece (ancorado à direita); o anterior sai se ficar a menos de 56 px dele
  const penultimo = Math.floor((total - 1) / passo) * passo
  const pxPorPonto = larguraUtil / Math.max(1, total - 1)
  if (penultimo !== total - 1 && (total - 1 - penultimo) * pxPorPonto < 56) s.delete(penultimo)
  s.add(total - 1)
  return s
}

/** Âncora do rótulo do eixo X: o primeiro encosta à esquerda e o último à direita. */
function ancora(i: number, total: number): 'start' | 'middle' | 'end' {
  return total > 1 && i === 0 ? 'start' : total > 1 && i === total - 1 ? 'end' : 'middle'
}

/**
 * Evolução no tempo: a série do período em azul, com área suave, e o período anterior em
 * cinza para comparação (mesma escala, mesmo eixo). Linha vertical segue o mouse.
 */
export function GraficoLinha({
  rotulos,
  atual,
  anterior,
  nomeAtual,
  nomeAnterior,
  unidade = 'un.',
  altura = 240,
}: {
  rotulos: string[]
  atual: number[]
  anterior?: number[]
  nomeAtual: string
  nomeAnterior?: string
  unidade?: string
  altura?: number
}) {
  const { ref, largura } = useLargura()
  const { ativo, setAtivo, aoTeclar } = useFoco(rotulos.length)
  const escala = escalaDoEixo(Math.max(1, ...atual, ...(anterior ?? [0])))
  const util = largura - MARGEM.esquerda - MARGEM.direita
  const alturaPlot = altura - MARGEM.topo - ALTURA_EIXO_X
  const x = (i: number) =>
    MARGEM.esquerda + (rotulos.length <= 1 ? util / 2 : (i / (rotulos.length - 1)) * util)
  const y = (v: number) => MARGEM.topo + alturaPlot - (v / escala.topo) * alturaPlot
  const caminho = (serie: number[]) =>
    serie.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join('')
  const area = `${caminho(atual)}L${x(atual.length - 1)},${y(0)}L${x(0)},${y(0)}Z`
  const visiveis = rotulosVisiveis(rotulos.length, util)
  const ultimo = atual.length - 1

  return (
    <div ref={ref} className="relative">
      <svg
        width={largura}
        height={altura}
        role="img"
        aria-label={`${nomeAtual}: ${rotulos.length} pontos, de ${rotulos[0]} a ${rotulos[ultimo]}. Use as setas para percorrer.`}
        tabIndex={0}
        onKeyDown={aoTeclar}
        onBlur={() => setAtivo(null)}
        onPointerLeave={() => setAtivo(null)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const px = e.clientX - r.left - MARGEM.esquerda
          const i = Math.round((px / Math.max(1, util)) * (rotulos.length - 1))
          setAtivo(Math.min(ultimo, Math.max(0, i)))
        }}
        className="block touch-none outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {escala.passos.map((p) => (
          <g key={p}>
            <line
              x1={MARGEM.esquerda}
              x2={largura - MARGEM.direita}
              y1={y(p)}
              y2={y(p)}
              stroke="var(--line)"
              strokeWidth={1}
            />
            <text
              x={MARGEM.esquerda - 8}
              y={y(p)}
              dy="0.32em"
              textAnchor="end"
              className="fill-ink-3 text-[11px] tabular-nums"
            >
              {formatarNumero(p)}
            </text>
          </g>
        ))}
        {rotulos.map((r, i) =>
          visiveis.has(i) ? (
            <text
              key={r + i}
              x={x(i)}
              y={altura - 6}
              textAnchor={ancora(i, rotulos.length)}
              className="fill-ink-3 text-[11px]"
            >
              {r}
            </text>
          ) : null,
        )}
        <path d={area} fill="var(--serie-1)" opacity={0.1} />
        {anterior && (
          <path
            d={caminho(anterior)}
            fill="none"
            stroke={COR_CINZA}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        <path
          d={caminho(atual)}
          fill="none"
          stroke="var(--serie-1)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {ativo !== null && (
          <line
            x1={x(ativo)}
            x2={x(ativo)}
            y1={MARGEM.topo}
            y2={MARGEM.topo + alturaPlot}
            stroke="var(--line-2)"
            strokeWidth={1}
          />
        )}
        {/* ponto final com anel na cor do fundo, e o ponto em foco */}
        {[ultimo, ...(ativo !== null && ativo !== ultimo ? [ativo] : [])].map((i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(atual[i])}
            r={4.5}
            fill="var(--serie-1)"
            stroke="var(--surface)"
            strokeWidth={2}
          />
        ))}
      </svg>
      {ativo !== null && (
        <Dica x={x(ativo)} y={y(atual[ativo])} largura={largura}>
          <p className="mb-1 text-ink-3">{rotulos[ativo]}</p>
          <LinhaDaDica
            cor="var(--serie-1)"
            valor={`${num(atual[ativo])} ${unidade}`}
            nome={nomeAtual}
          />
          {anterior && nomeAnterior && (
            <LinhaDaDica
              cor={COR_CINZA}
              valor={`${num(anterior[ativo] ?? 0)} ${unidade}`}
              nome={nomeAnterior}
            />
          )}
        </Dica>
      )}
    </div>
  )
}

/**
 * Comparação de 2 a 4 séries no tempo: um traço de 2 px por série, na cor dela, com o nome
 * na ponta (além da legenda). A dica lista todas, da maior para a menor.
 */
export function GraficoComparacao({
  rotulos,
  series,
  unidade = 'un.',
  altura = 240,
}: {
  rotulos: string[]
  series: { nome: string; cor: string; valores: number[] }[]
  unidade?: string
  altura?: number
}) {
  const { ref, largura } = useLargura()
  const { ativo, setAtivo, aoTeclar } = useFoco(rotulos.length)
  const direita = 76
  const escala = escalaDoEixo(Math.max(1, ...series.flatMap((s) => s.valores)))
  const util = largura - MARGEM.esquerda - direita
  const alturaPlot = altura - MARGEM.topo - ALTURA_EIXO_X
  const x = (i: number) =>
    MARGEM.esquerda + (rotulos.length <= 1 ? util / 2 : (i / (rotulos.length - 1)) * util)
  const y = (v: number) => MARGEM.topo + alturaPlot - (v / escala.topo) * alturaPlot
  const caminho = (serie: number[]) =>
    serie.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join('')
  const visiveis = rotulosVisiveis(rotulos.length, util)
  const ultimo = rotulos.length - 1
  const yRotulos = afastarRotulos(
    series.map((s) => y(s.valores[ultimo] ?? 0)),
    MARGEM.topo + alturaPlot,
  )

  return (
    <div ref={ref} className="relative">
      <svg
        width={largura}
        height={altura}
        role="img"
        aria-label={`Comparação de ${series.map((s) => s.nome).join(', ')}: ${rotulos.length} pontos, de ${rotulos[0]} a ${rotulos[ultimo]}. Use as setas para percorrer.`}
        tabIndex={0}
        onKeyDown={aoTeclar}
        onBlur={() => setAtivo(null)}
        onPointerLeave={() => setAtivo(null)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const px = e.clientX - r.left - MARGEM.esquerda
          const i = Math.round((px / Math.max(1, util)) * (rotulos.length - 1))
          setAtivo(Math.min(ultimo, Math.max(0, i)))
        }}
        className="block touch-none outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {escala.passos.map((p) => (
          <g key={p}>
            <line
              x1={MARGEM.esquerda}
              x2={MARGEM.esquerda + util}
              y1={y(p)}
              y2={y(p)}
              stroke="var(--line)"
              strokeWidth={1}
            />
            <text
              x={MARGEM.esquerda - 8}
              y={y(p)}
              dy="0.32em"
              textAnchor="end"
              className="fill-ink-3 text-[11px] tabular-nums"
            >
              {formatarNumero(p)}
            </text>
          </g>
        ))}
        {rotulos.map((r, i) =>
          visiveis.has(i) ? (
            <text
              key={r + i}
              x={x(i)}
              y={altura - 6}
              textAnchor={ancora(i, rotulos.length)}
              className="fill-ink-3 text-[11px]"
            >
              {r}
            </text>
          ) : null,
        )}
        {series.map((s) => (
          <path
            key={s.nome}
            d={caminho(s.valores)}
            fill="none"
            stroke={s.cor}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {ativo !== null && (
          <line
            x1={x(ativo)}
            x2={x(ativo)}
            y1={MARGEM.topo}
            y2={MARGEM.topo + alturaPlot}
            stroke="var(--line-2)"
            strokeWidth={1}
          />
        )}
        {series.map((s, k) => (
          <g key={s.nome}>
            {[ultimo, ...(ativo !== null && ativo !== ultimo ? [ativo] : [])].map((i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(s.valores[i] ?? 0)}
                r={4}
                fill={s.cor}
                stroke="var(--surface)"
                strokeWidth={2}
              />
            ))}
            <text
              x={x(ultimo) + 10}
              y={yRotulos[k]}
              dy="0.32em"
              className="fill-ink-2 text-[11px] font-medium"
            >
              {s.nome}
            </text>
          </g>
        ))}
      </svg>
      {ativo !== null && (
        <Dica
          x={x(ativo)}
          y={Math.min(...series.map((s) => y(s.valores[ativo] ?? 0)))}
          largura={largura}
        >
          <p className="mb-1 text-ink-3">{rotulos[ativo]}</p>
          {[...series]
            .sort((a, b) => (b.valores[ativo] ?? 0) - (a.valores[ativo] ?? 0))
            .map((s) => (
              <LinhaDaDica
                key={s.nome}
                cor={s.cor}
                valor={`${num(s.valores[ativo] ?? 0)} ${unidade}`}
                nome={s.nome}
              />
            ))}
        </Dica>
      )}
    </div>
  )
}

/**
 * Ranking em barras horizontais. Cada barra é um botão: clicar filtra o painel inteiro por
 * aquele item (como num painel de BI); clicar de novo tira o filtro.
 */
export function GraficoRanking({
  linhas,
  selecionado,
  aoSelecionar,
  unidade = 'un.',
}: {
  /** rotulo em destaque e detalhe embaixo; cor da barra quando o item tem cor própria */
  linhas: {
    chave: string
    rotulo: string
    detalhe?: string
    total: number
    filtravel: boolean
    cor?: string
  }[]
  selecionado: string | null
  aoSelecionar: (chave: string | null) => void
  unidade?: string
}) {
  const maximo = Math.max(1, ...linhas.map((l) => l.total))
  const total = linhas.reduce((s, l) => s + l.total, 0)
  return (
    <ul className="flex flex-col gap-1">
      {linhas.map((l) => {
        const ativo = selecionado === l.chave
        const apagado = selecionado !== null && !ativo
        const pct = total ? (l.total / total) * 100 : 0
        const conteudo = (
          <>
            <span className="min-w-0 text-left">
              <span className="block truncate text-[13px] font-medium text-ink">{l.rotulo}</span>
              {l.detalhe && (
                <span className="block truncate text-xs text-ink-3" title={l.detalhe}>
                  {l.detalhe}
                </span>
              )}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-4 flex-1">
                <span
                  className="block h-full rounded-r-[4px] transition-[width,background] duration-300"
                  style={{
                    width: `${(l.total / maximo) * 100}%`,
                    minWidth: 2,
                    background: l.filtravel && !apagado ? (l.cor ?? 'var(--serie-1)') : COR_CINZA,
                  }}
                />
              </span>
            </span>
            <span className="text-right text-[13px] whitespace-nowrap tabular-nums">
              <strong className="font-semibold text-ink">{formatarNumero(l.total)}</strong>{' '}
              <span className="text-ink-3">
                {unidade} · {num(pct)}%
              </span>
            </span>
          </>
        )
        const classe = `grid w-full grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-1.5 ${ativo ? 'bg-accent-soft' : ''}`
        return (
          <li key={l.chave}>
            {l.filtravel ? (
              <button
                type="button"
                aria-pressed={ativo}
                onClick={() => aoSelecionar(ativo ? null : l.chave)}
                title={ativo ? 'Tirar o filtro' : `Filtrar o painel por ${l.rotulo}`}
                className={`${classe} cursor-pointer hover:bg-surface-2`}
              >
                {conteudo}
              </button>
            ) : (
              <div className={classe}>{conteudo}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Colunas empilhadas: composição ao longo do tempo, com no máximo 4 cores e "Outros" em cinza.
 * Espaço de 2 px na cor do fundo entre as partes; ponta de cima arredondada.
 */
export function GraficoEmpilhado({
  rotulos,
  series,
  unidade = 'un.',
  altura = 220,
}: {
  rotulos: string[]
  series: { nome: string; cor: string; valores: number[] }[]
  unidade?: string
  altura?: number
}) {
  const { ref, largura } = useLargura()
  const { ativo, setAtivo, aoTeclar } = useFoco(rotulos.length)
  const totais = rotulos.map((_, i) => series.reduce((s, se) => s + (se.valores[i] ?? 0), 0))
  const escala = escalaDoEixo(Math.max(1, ...totais))
  const util = largura - MARGEM.esquerda - MARGEM.direita
  const alturaPlot = altura - MARGEM.topo - ALTURA_EIXO_X
  const banda = util / Math.max(1, rotulos.length)
  const larguraBarra = Math.max(3, Math.min(24, banda * 0.62))
  const y = (v: number) => MARGEM.topo + alturaPlot - (v / escala.topo) * alturaPlot
  const visiveis = rotulosVisiveis(rotulos.length, util)
  const xCentro = (i: number) => MARGEM.esquerda + banda * (i + 0.5)

  return (
    <div ref={ref} className="relative">
      <svg
        width={largura}
        height={altura}
        role="img"
        aria-label={`Composição do consumo em ${rotulos.length} períodos. Use as setas para percorrer.`}
        tabIndex={0}
        onKeyDown={aoTeclar}
        onBlur={() => setAtivo(null)}
        onPointerLeave={() => setAtivo(null)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const i = Math.floor((e.clientX - r.left - MARGEM.esquerda) / banda)
          setAtivo(i >= 0 && i < rotulos.length ? i : null)
        }}
        className="block touch-none outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {escala.passos.map((p) => (
          <g key={p}>
            <line
              x1={MARGEM.esquerda}
              x2={largura - MARGEM.direita}
              y1={y(p)}
              y2={y(p)}
              stroke="var(--line)"
              strokeWidth={1}
            />
            <text
              x={MARGEM.esquerda - 8}
              y={y(p)}
              dy="0.32em"
              textAnchor="end"
              className="fill-ink-3 text-[11px] tabular-nums"
            >
              {formatarNumero(p)}
            </text>
          </g>
        ))}
        {ativo !== null && (
          <rect
            x={MARGEM.esquerda + banda * ativo}
            y={MARGEM.topo}
            width={banda}
            height={alturaPlot}
            fill="var(--surface-2)"
          />
        )}
        {rotulos.map((rot, i) => {
          let base = 0
          const partes = series
            .map((s) => ({ cor: s.cor, v: s.valores[i] ?? 0 }))
            .filter((p) => p.v > 0)
          return (
            <g key={rot + i}>
              {partes.map((p, k) => {
                const y0 = y(base)
                base += p.v
                const y1 = y(base)
                const topo = k === partes.length - 1
                // 2 px de fundo entre as partes; a de cima tem a ponta arredondada
                const h = Math.max(0, y0 - y1 - (k > 0 ? 2 : 0))
                const yy = y1
                return topo ? (
                  <path
                    key={k}
                    d={`M${xCentro(i) - larguraBarra / 2},${yy + h}V${yy + 4}q0,-4 4,-4h${larguraBarra - 8}q4,0 4,4V${yy + h}Z`}
                    fill={p.cor}
                  />
                ) : (
                  <rect
                    key={k}
                    x={xCentro(i) - larguraBarra / 2}
                    y={yy}
                    width={larguraBarra}
                    height={h}
                    fill={p.cor}
                  />
                )
              })}
              {visiveis.has(i) && (
                <text
                  x={xCentro(i)}
                  y={altura - 6}
                  textAnchor={ancora(i, rotulos.length)}
                  className="fill-ink-3 text-[11px]"
                >
                  {rot}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {ativo !== null && (
        <Dica x={xCentro(ativo)} y={y(totais[ativo])} largura={largura}>
          <p className="mb-1 text-ink-3">
            {rotulos[ativo]} ·{' '}
            <strong className="text-ink">
              {num(totais[ativo])} {unidade}
            </strong>
          </p>
          {series
            .filter((s) => (s.valores[ativo] ?? 0) > 0)
            .map((s) => (
              <LinhaDaDica
                key={s.nome}
                cor={s.cor}
                valor={`${num(s.valores[ativo])} ${unidade}`}
                nome={s.nome}
              />
            ))}
        </Dica>
      )}
    </div>
  )
}

/**
 * Entradas e saídas do estoque no mesmo eixo: entradas para cima, saídas para baixo, a partir
 * de uma linha de base. Um eixo só, simétrico.
 */
export function GraficoFluxo({
  rotulos,
  entradas,
  saidas,
  altura = 220,
}: {
  rotulos: string[]
  entradas: number[]
  saidas: number[]
  altura?: number
}) {
  const { ref, largura } = useLargura()
  const { ativo, setAtivo, aoTeclar } = useFoco(rotulos.length)
  const escala = escalaDoEixo(Math.max(1, ...entradas, ...saidas), 3)
  const util = largura - MARGEM.esquerda - MARGEM.direita
  const alturaPlot = altura - MARGEM.topo - ALTURA_EIXO_X
  const meio = MARGEM.topo + alturaPlot / 2
  const meiaAltura = alturaPlot / 2
  const banda = util / Math.max(1, rotulos.length)
  const larguraBarra = Math.max(3, Math.min(24, banda * 0.62))
  const h = (v: number) => (v / escala.topo) * meiaAltura
  const visiveis = rotulosVisiveis(rotulos.length, util)
  const xCentro = (i: number) => MARGEM.esquerda + banda * (i + 0.5)
  const arredondada = (x0: number, y0: number, alt: number, paraCima: boolean) => {
    const r = Math.min(4, alt, larguraBarra / 2)
    if (alt <= 0) return ''
    return paraCima
      ? `M${x0},${y0}V${y0 - alt + r}q0,-${r} ${r},-${r}h${larguraBarra - 2 * r}q${r},0 ${r},${r}V${y0}Z`
      : `M${x0},${y0}V${y0 + alt - r}q0,${r} ${r},${r}h${larguraBarra - 2 * r}q${r},0 ${r},-${r}V${y0}Z`
  }

  return (
    <div ref={ref} className="relative">
      <svg
        width={largura}
        height={altura}
        role="img"
        aria-label={`Entradas e saídas do estoque em ${rotulos.length} períodos. Use as setas para percorrer.`}
        tabIndex={0}
        onKeyDown={aoTeclar}
        onBlur={() => setAtivo(null)}
        onPointerLeave={() => setAtivo(null)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const i = Math.floor((e.clientX - r.left - MARGEM.esquerda) / banda)
          setAtivo(i >= 0 && i < rotulos.length ? i : null)
        }}
        className="block touch-none outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {escala.passos
          .flatMap((p) => (p === 0 ? [0] : [p, -p]))
          .map((p) => (
            <g key={p}>
              <line
                x1={MARGEM.esquerda}
                x2={largura - MARGEM.direita}
                y1={meio - h(p)}
                y2={meio - h(p)}
                stroke={p === 0 ? 'var(--line-2)' : 'var(--line)'}
                strokeWidth={1}
              />
              <text
                x={MARGEM.esquerda - 8}
                y={meio - h(p)}
                dy="0.32em"
                textAnchor="end"
                className="fill-ink-3 text-[11px] tabular-nums"
              >
                {formatarNumero(Math.abs(p))}
              </text>
            </g>
          ))}
        {ativo !== null && (
          <rect
            x={MARGEM.esquerda + banda * ativo}
            y={MARGEM.topo}
            width={banda}
            height={alturaPlot}
            fill="var(--surface-2)"
          />
        )}
        {rotulos.map((rot, i) => (
          <g key={rot + i}>
            <path
              d={arredondada(xCentro(i) - larguraBarra / 2, meio - 1, h(entradas[i]), true)}
              fill="var(--serie-1)"
            />
            <path
              d={arredondada(xCentro(i) - larguraBarra / 2, meio + 1, h(saidas[i]), false)}
              fill="var(--serie-2)"
            />
            {visiveis.has(i) && (
              <text
                x={xCentro(i)}
                y={altura - 6}
                textAnchor={ancora(i, rotulos.length)}
                className="fill-ink-3 text-[11px]"
              >
                {rot}
              </text>
            )}
          </g>
        ))}
      </svg>
      {ativo !== null && (
        <Dica x={xCentro(ativo)} y={meio - h(entradas[ativo])} largura={largura}>
          <p className="mb-1 text-ink-3">{rotulos[ativo]}</p>
          <LinhaDaDica
            cor="var(--serie-1)"
            valor={`+${num(entradas[ativo])} un.`}
            nome="entradas"
          />
          <LinhaDaDica cor="var(--serie-2)" valor={`−${num(saidas[ativo])} un.`} nome="saídas" />
          <p className="mt-1 text-ink-3">
            Saldo do período:{' '}
            <strong className="text-ink">
              {entradas[ativo] - saidas[ativo] >= 0 ? '+' : '−'}
              {num(Math.abs(entradas[ativo] - saidas[ativo]))} un.
            </strong>
          </p>
        </Dica>
      )}
    </div>
  )
}

const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']

/**
 * Mapa de calor dia da semana × hora: um tom de azul, mais escuro quanto mais consumo
 * (no tema escuro, mais claro). Célula vazia fica na cor da superfície.
 */
export function MapaDeCalor({ matriz, unidade = 'un.' }: { matriz: number[][]; unidade?: string }) {
  const maximo = Math.max(0, ...matriz.flat())
  // só as horas com algum consumo, mais uma de folga de cada lado, no mínimo 6h às 18h
  const comDado = matriz[0].map((_, h) => matriz.some((l) => l[h] > 0))
  const primeira = Math.max(
    0,
    Math.min(6, comDado.indexOf(true) - 1 < 0 ? 6 : comDado.indexOf(true) - 1),
  )
  const ultimaComDado = comDado.lastIndexOf(true)
  const ultima = Math.min(23, Math.max(18, ultimaComDado + 1))
  const horas = Array.from({ length: ultima - primeira + 1 }, (_, i) => primeira + i)
  const nivel = (v: number) =>
    v <= 0 || maximo === 0 ? 0 : Math.max(1, Math.ceil((v / maximo) * 7))
  const [dica, setDica] = useState<{ d: number; h: number } | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <div
          role="grid"
          aria-label="Consumo por dia da semana e hora"
          className="grid min-w-[300px] gap-[2px]"
          style={{ gridTemplateColumns: `2.25rem repeat(${horas.length}, minmax(0, 1fr))` }}
        >
          <span />
          {horas.map((h) => (
            <span
              key={h}
              className={`${h === ultima ? 'flex justify-end' : 'flex justify-center'} text-[10px] whitespace-nowrap text-ink-3 tabular-nums`}
            >
              {h % 2 === 0 ? `${h}h` : ''}
            </span>
          ))}
          {DIAS.map((dia, d) => (
            <div key={dia} role="row" className="contents">
              <span className="self-center text-[11px] text-ink-3">{dia}</span>
              {horas.map((h) => {
                const v = matriz[d][h]
                const n = nivel(v)
                const texto = `${dia} ${h}h: ${formatarNumero(v)} ${unidade}`
                return (
                  <span
                    key={h}
                    role="gridcell"
                    tabIndex={v > 0 ? 0 : -1}
                    aria-label={texto}
                    onPointerEnter={() => setDica({ d, h })}
                    onPointerLeave={() => setDica(null)}
                    onFocus={() => setDica({ d, h })}
                    onBlur={() => setDica(null)}
                    className={`h-6 rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-accent ${dica?.d === d && dica.h === h ? 'ring-2 ring-ink/40' : ''}`}
                    style={{ background: n === 0 ? 'var(--surface-2)' : `var(--calor-${n})` }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-3">
        <p aria-live="polite" className="min-h-4">
          {dica ? (
            <>
              {DIAS[dica.d]} às {dica.h}h:{' '}
              <strong className="text-ink">
                {formatarNumero(matriz[dica.d][dica.h])} {unidade}
              </strong>
            </>
          ) : (
            'Passe o mouse ou use Tab para ver cada hora.'
          )}
        </p>
        <span className="flex items-center gap-1.5">
          menos
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <span
              key={n}
              aria-hidden
              className="size-3 rounded-[3px]"
              style={{ background: `var(--calor-${n})` }}
            />
          ))}
          mais
        </span>
      </div>
    </div>
  )
}

/** Mini linha do tempo para os cartões de número. */
export function Minilinha({ valores }: { valores: number[] }) {
  if (valores.length < 2) return null
  const max = Math.max(1, ...valores)
  const w = 88
  const h = 32
  const pontos = valores.map(
    (v, i) => `${(i / (valores.length - 1)) * w},${h - 2 - (v / max) * (h - 4)}`,
  )
  const [ux, uy] = pontos[pontos.length - 1].split(',').map(Number)
  return (
    <svg width={w} height={h} aria-hidden className="overflow-visible">
      <polyline
        points={pontos.join(' ')}
        fill="none"
        stroke={COR_CINZA}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <circle cx={ux} cy={uy} r={3} fill="var(--serie-1)" />
    </svg>
  )
}
