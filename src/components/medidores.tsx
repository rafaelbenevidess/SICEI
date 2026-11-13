import type { CSSProperties, ReactNode } from 'react'
import { matrizDePontos, tracosAcesos } from '@/domain/painel'

/**
 * Medidores do painel (RF-16), em HTML e SVG próprios, sem biblioteca de gráficos (ADR-14).
 * Todo medidor tem o número escrito ao lado: a cor e o desenho nunca são a única informação.
 */

const TRACOS = 41
const ABERTURA = 152 // graus do arco

/** Arco de traços: acende a parte que corresponde ao percentual. */
export function MedidorDeTracos({
  percentual,
  rotulo,
  children,
}: {
  percentual: number | null
  /** frase para leitor de tela: "50% dos itens acima do ponto de reposição" */
  rotulo: string
  /** número e legenda, no centro do arco */
  children: ReactNode
}) {
  const acesos = tracosAcesos(percentual, TRACOS)
  const inicio = -90 - ABERTURA / 2
  return (
    <div role="img" aria-label={rotulo} className="relative mx-auto w-full max-w-[300px]">
      <svg viewBox="0 0 240 132" aria-hidden className="block w-full">
        {Array.from({ length: TRACOS }, (_, i) => {
          const a = ((inicio + (ABERTURA * i) / (TRACOS - 1)) * Math.PI) / 180
          const [cos, sen] = [Math.cos(a), Math.sin(a)]
          const aceso = i < acesos
          const p = (r: number) => Math.round(r * 100) / 100
          return (
            <line
              key={i}
              x1={p(120 + cos * 84)}
              y1={p(124 + sen * 84)}
              x2={p(120 + cos * 112)}
              y2={p(124 + sen * 112)}
              strokeWidth={4.4}
              strokeLinecap="round"
              className={aceso ? 'acende' : undefined}
              style={
                {
                  stroke: aceso ? 'var(--accent)' : 'var(--line-2)',
                  opacity: aceso ? 1 : 0.55,
                  animationDelay: aceso ? `${i * 14}ms` : undefined,
                } as CSSProperties
              }
            />
          )
        })}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center">
        {children}
      </div>
    </div>
  )
}

/**
 * Barra que compara um valor com uma referência: preenchimento até o valor, ponta marcada e
 * hachura no trecho que falta até a referência. As posições vêm prontas, em % da largura.
 */
export function BarraDeComparacao({
  valor,
  referencia,
  rotulo,
}: {
  valor: number
  referencia: number
  rotulo: string
}) {
  return (
    <div role="img" aria-label={rotulo} className="relative h-2.5 rounded-full bg-surface-3">
      {referencia > valor && (
        <span
          className="hachura absolute inset-y-0 rounded-r-full text-ink-3"
          style={{ left: `${valor}%`, right: `${Math.round((100 - referencia) * 10) / 10}%` }}
        />
      )}
      <span
        className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-[color-mix(in_oklch,var(--accent)_22%,var(--surface-3))] to-accent"
        style={{ width: `${valor}%` }}
      />
      {valor > 0 && (
        <span
          className="absolute -top-1 -bottom-1 w-1 -translate-x-1/2 rounded-full bg-accent"
          style={{ left: `${valor}%` }}
        />
      )}
    </div>
  )
}

const LINHAS = 10

/**
 * Consumo por dia em pontos empilhados: uma coluna por dia do mês, o dia de hoje em
 * destaque e os dias que ainda não chegaram vazios. Quanto vale cada ponto sai na legenda.
 */
export function PontosPorDia({
  dias,
  diasNoMes,
  unidade = 'un.',
}: {
  dias: { dia: string; rotulo: string; total: number; hoje: boolean }[]
  diasNoMes: number
  unidade?: string
}) {
  const { unidadesPorPonto, pontos } = matrizDePontos(
    dias.map((d) => d.total),
    LINHAS,
  )
  const total = dias.reduce((s, d) => s + d.total, 0)
  const colunas = Array.from(
    { length: Math.max(diasNoMes, dias.length) },
    (_, i) => dias[i] ?? null,
  )
  const iHoje = dias.findIndex((d) => d.hoje)
  // a etiqueta de hoje não pode sair do cartão: encosta na borda quando o dia fica na ponta
  const ancora =
    iHoje < 3 ? 'left-0' : iHoje > colunas.length - 4 ? 'right-0' : 'left-1/2 -translate-x-1/2'
  return (
    <div>
      <div
        role="img"
        aria-label={`Consumo por dia: ${total} ${unidade} no mês até agora`}
        className="flex items-end gap-[3px] pt-8 sm:gap-1"
      >
        {colunas.map((d, i) => (
          <div
            key={i}
            title={d ? `${d.rotulo}: ${d.total} ${unidade}` : undefined}
            className="relative flex min-w-0 flex-1 flex-col-reverse items-center gap-[3px] sm:gap-1"
          >
            {Array.from({ length: LINHAS }, (_, linha) => {
              const cheio = d !== null && linha < pontos[i]
              return (
                <span
                  key={linha}
                  className={`aspect-square w-full max-w-3 rounded-full ${
                    cheio
                      ? d.hoje
                        ? 'bg-accent'
                        : 'bg-[color-mix(in_oklch,var(--accent)_42%,var(--surface-3))]'
                      : d
                        ? 'bg-surface-3'
                        : 'border border-line'
                  }`}
                />
              )
            })}
            {d?.hoje && (
              <>
                <span
                  aria-hidden
                  className="absolute -top-2 bottom-0 left-1/2 w-px -translate-x-1/2 bg-ink/25"
                />
                <span
                  className={`absolute -top-8 rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-bg ${ancora}`}
                >
                  hoje · {d.total} {unidade}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-2 flex gap-[3px] font-mono text-[11px] text-ink-3 sm:gap-1">
        {colunas.map((_, i) => (
          <span key={i} className="min-w-0 flex-1 text-center">
            {i % 7 === 0 && <span className="inline-block">{String(i + 1).padStart(2, '0')}</span>}
          </span>
        ))}
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full bg-accent" />
          Cada ponto vale {unidadesPorPonto} {unidadesPorPonto === 1 ? 'unidade' : 'unidades'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full border border-line-2" />
          Dia que ainda não chegou
        </span>
      </p>
    </div>
  )
}
