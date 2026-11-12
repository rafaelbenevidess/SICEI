import { CircleCheck, Info, MapPin, TriangleAlert, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { escalaDoNivel } from '@/domain/estoque'
import { NOME_STATUS } from '@/lib/formatar'

/**
 * Componentes-base do design do SICEI (design_handoff_sicei/README.md, "Componentes-base").
 * As cores vêm dos tokens de globals.css, então funcionam nos temas claro e escuro.
 */

export function Pagina({
  titulo,
  descricao,
  acoes,
  antes,
  children,
}: {
  titulo: ReactNode
  descricao?: ReactNode
  acoes?: ReactNode
  /** linha acima do título: "← Itens", data do painel etc. */
  antes?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          {antes && <div className="mb-2 text-[13px] text-ink-3">{antes}</div>}
          <h1 className="text-[30px] leading-[1.12] font-normal tracking-[-0.035em]">{titulo}</h1>
          {descricao && <p className="mt-1.5 max-w-3xl text-ink-2">{descricao}</p>}
        </div>
        {acoes && <div className="nao-imprimir flex flex-wrap items-center gap-2">{acoes}</div>}
      </header>
      {children}
    </div>
  )
}

export function Cartao({
  titulo,
  subtitulo,
  acao,
  children,
  className = '',
  semPadding = false,
}: {
  titulo?: ReactNode
  subtitulo?: ReactNode
  acao?: ReactNode
  children: ReactNode
  className?: string
  /** conteúdo encosta na borda (tabelas e listas) */
  semPadding?: boolean
}) {
  return (
    <section className={`cartao min-w-0 overflow-hidden ${className}`}>
      {titulo && (
        <header className="flex items-start justify-between gap-3 px-6 pt-5 pb-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-medium">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-[13px] text-ink-3">{subtitulo}</p>}
          </div>
          {acao && <div className="nao-imprimir shrink-0 text-[13px] font-medium">{acao}</div>}
        </header>
      )}
      <div className={semPadding ? '' : titulo ? 'px-6 pb-6' : 'p-6'}>{children}</div>
    </section>
  )
}

const ESTILO_TABELA =
  'w-full border-collapse text-left text-sm ' +
  '[&_th]:px-4 [&_th]:pt-3.5 [&_th]:pb-2.5 [&_th]:text-xs [&_th]:font-medium [&_th]:whitespace-nowrap [&_th]:text-ink-3 ' +
  '[&_td]:border-t [&_td]:border-line [&_td]:px-4 [&_td]:py-3.5 [&_td]:align-middle ' +
  '[&_th:first-child]:pl-6 [&_td:first-child]:pl-6 [&_th:last-child]:pr-6 [&_td:last-child]:pr-6 ' +
  '[&_tbody_tr:hover]:bg-surface-2'

/** Tabela "arejada". Dentro de um Cartao semPadding use emCartao; sozinha, ela já vem num cartão. */
export function Tabela({
  children,
  rotulo,
  emCartao = false,
  larguraMinima = 680,
}: {
  children: ReactNode
  rotulo: string
  emCartao?: boolean
  larguraMinima?: number
}) {
  // A largura mínima só vale no celular, onde a tabela rola de lado para não espremer as
  // colunas. No computador a tabela usa a largura que o conteúdo pede: só rola se não couber.
  const tabela = (
    <div className="overflow-x-auto">
      <table
        aria-label={rotulo}
        className={`${ESTILO_TABELA} max-md:min-w-(--largura-minima)`}
        style={{ '--largura-minima': `${larguraMinima}px` } as CSSProperties}
      >
        {children}
      </table>
    </div>
  )
  if (emCartao) return tabela
  return <div className="cartao min-w-0 overflow-hidden">{tabela}</div>
}

/** Cores de cada status: selo (fundo e texto) e cor sólida (barras, bolinhas). */
export const CORES_STATUS: Record<
  string,
  { selo: string; solido: string; suave: string; variavel: string }
> = {
  OK: { selo: 'bg-ok-soft text-ok-ink', solido: 'bg-ok', suave: 'bg-ok-soft', variavel: '--ok' },
  ATENCAO: {
    selo: 'bg-warn-soft text-warn-ink',
    solido: 'bg-warn',
    suave: 'bg-warn-soft',
    variavel: '--warn',
  },
  CRITICO: {
    selo: 'bg-crit-soft text-crit-ink',
    solido: 'bg-crit',
    suave: 'bg-crit-soft',
    variavel: '--crit',
  },
  ZERADO: {
    selo: 'bg-zero-bg text-zero-ink',
    solido: 'bg-zero-bg',
    suave: 'bg-surface-3',
    variavel: '--zero-bg',
  },
}

/** RNF-10: o status nunca depende só da cor; o selo sempre tem bolinha e texto. */
export function BadgeStatus({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-md px-[9px] text-xs font-semibold whitespace-nowrap ${CORES_STATUS[status]?.selo ?? 'bg-surface-3 text-ink-2'}`}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {NOME_STATUS[status] ?? status}
    </span>
  )
}

const TONS = {
  ok: 'bg-ok-soft text-ok-ink',
  warn: 'bg-warn-soft text-warn-ink',
  crit: 'bg-crit-soft text-crit-ink',
  accent: 'bg-accent-soft text-accent-ink',
  neutro: 'bg-surface-3 text-ink-2',
}

/** Selo genérico (situação de cadastro, usuário, "Preferencial", "estornada"). */
export function Selo({
  tom = 'neutro',
  ponto = false,
  children,
}: {
  tom?: keyof typeof TONS
  ponto?: boolean
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-semibold whitespace-nowrap ${TONS[tom]}`}
    >
      {ponto && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

const AVISOS: Record<string, { classe: string; Icone: LucideIcon }> = {
  erro: { classe: 'bg-crit-soft text-crit-ink', Icone: TriangleAlert },
  ok: { classe: 'bg-ok-soft text-ok-ink', Icone: CircleCheck },
  info: { classe: 'bg-accent-soft text-accent-ink', Icone: Info },
  alerta: { classe: 'bg-warn-soft text-warn-ink', Icone: TriangleAlert },
}

export function Aviso({
  tipo = 'info',
  titulo,
  acoes,
  children,
}: {
  tipo?: 'erro' | 'ok' | 'info' | 'alerta'
  titulo?: ReactNode
  acoes?: ReactNode
  children: ReactNode
}) {
  const { classe, Icone } = AVISOS[tipo]
  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={`flex flex-wrap items-start gap-3 rounded-xl px-4 py-3.5 text-sm ${classe}`}
    >
      <Icone aria-hidden className="mt-px size-[18px] shrink-0" />
      <div className="min-w-0 flex-1 basis-56">
        {titulo && <p className="font-semibold">{titulo}</p>}
        <div>{children}</div>
      </div>
      {acoes && <div className="nao-imprimir flex flex-wrap gap-2">{acoes}</div>}
    </div>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-cartao border border-dashed border-line-2 p-8 text-center text-sm text-ink-3">
      {children}
    </p>
  )
}

const BOTOES = {
  primario: 'bg-accent text-on-accent shadow-pilula hover:bg-accent-hover',
  secundario: 'bg-surface text-ink shadow-pilula hover:bg-surface-2',
  perigo: 'border border-crit bg-surface text-crit-ink hover:bg-crit-soft',
  escuro: 'bg-ink text-bg hover:opacity-90',
  fantasma: 'text-ink-2 hover:bg-surface-2',
  textoPerigo: 'text-crit-ink hover:bg-crit-soft',
  textoAcento: 'text-accent-ink hover:bg-accent-soft',
}

export type VarianteBotao = keyof typeof BOTOES

/** Classes de botão, para usar em <button>, <Link> ou <a>. */
export function classeBotao(variante: VarianteBotao = 'primario', pequeno = false): string {
  const tamanho = pequeno ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm'
  return `inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-controle font-medium no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:size-4 ${tamanho} ${BOTOES[variante]}`
}

export function LinkBotao({
  href,
  children,
  variante = 'primario',
  pequeno = false,
  icone: Icone,
}: {
  href: string
  children: ReactNode
  variante?: VarianteBotao
  pequeno?: boolean
  icone?: LucideIcon
}) {
  return (
    <Link href={href} className={classeBotao(variante, pequeno)}>
      {Icone && <Icone aria-hidden />}
      {children}
    </Link>
  )
}

/** Controle segmentado com links (filtros em searchParams). */
export function Segmentado({
  rotulo,
  opcoes,
}: {
  rotulo: string
  opcoes: { href: string; rotulo: ReactNode; contagem?: number; ativo: boolean }[]
}) {
  return (
    <nav
      aria-label={rotulo}
      className="inline-flex max-w-full flex-wrap gap-0.5 rounded-[12px] bg-surface p-[3px] shadow-pilula"
    >
      {opcoes.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          aria-current={o.ativo ? 'page' : undefined}
          className={`inline-flex h-[34px] items-center gap-1.5 rounded-[9px] px-3.5 text-[13px] font-medium whitespace-nowrap no-underline ${o.ativo ? 'bg-ink text-bg' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'}`}
        >
          {o.rotulo}
          {o.contagem !== undefined && (
            <span className={o.ativo ? 'opacity-60' : 'text-ink-3'}>{o.contagem}</span>
          )}
        </Link>
      ))}
    </nav>
  )
}

/** Abas sublinhadas (Relatórios, Cadastros). Quebram linha em vez de rolar. */
export function Abas({
  rotulo,
  opcoes,
}: {
  rotulo: string
  opcoes: { href: string; rotulo: ReactNode; contagem?: number; ativo: boolean }[]
}) {
  return (
    <nav aria-label={rotulo} className="flex flex-wrap gap-x-6 border-b border-line">
      {opcoes.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          aria-current={o.ativo ? 'page' : undefined}
          className={`-mb-px inline-flex h-[42px] items-center gap-1.5 border-b-2 text-sm font-medium no-underline ${o.ativo ? 'border-accent text-ink' : 'border-transparent text-ink-3 hover:text-ink'}`}
        >
          {o.rotulo}
          {o.contagem !== undefined && (
            <span className="rounded-md bg-surface-3 px-1.5 text-xs text-ink-2">{o.contagem}</span>
          )}
        </Link>
      ))}
    </nav>
  )
}

/**
 * Barra de nível do estoque: preenchimento na cor do status, hachura no que falta até o
 * alvo e marcadores de mínimo, ponto de reposição e alvo. Na lista tem 120×6 px; no detalhe
 * (larga), largura total × 14 px.
 */
export function Gauge({
  saldo,
  minimo,
  pontoReposicao,
  alvo,
  status,
  larga = false,
}: {
  saldo: number
  minimo: number
  pontoReposicao: number
  alvo: number
  status: string
  larga?: boolean
}) {
  const e = escalaDoNivel({ saldo, minimo, pontoReposicao, alvo })
  const marcador = (pos: number, cor: string, rotulo: string, valor: number) => (
    <span
      className={`absolute -top-[3px] -bottom-[3px] w-0.5 rounded-full ${cor}`}
      style={{ left: `${pos}%` }}
      title={`${rotulo}: ${valor}`}
    />
  )
  return (
    <div className={larga ? 'w-full' : 'w-[120px]'}>
      <div
        role="img"
        aria-label={`Saldo ${saldo}; mínimo ${minimo}; reposição ${pontoReposicao}; alvo ${alvo}`}
        className={`relative rounded-full bg-surface-3 ${larga ? 'h-3.5' : 'h-1.5'}`}
        style={{ '--cor': `var(${CORES_STATUS[status]?.variavel ?? '--accent'})` } as CSSProperties}
      >
        {e.alvo > e.saldo && (
          <span
            className="hachura absolute inset-y-0 rounded-r-full text-ink-3"
            style={{ left: `${e.saldo}%`, right: `${Math.round((100 - e.alvo) * 10) / 10}%` }}
          />
        )}
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-[color-mix(in_oklch,var(--cor)_45%,var(--surface-3))] to-(--cor)"
          style={{ width: `${e.saldo}%` }}
        />
        {marcador(e.minimo, 'bg-ink-2', 'Mínimo', minimo)}
        {marcador(e.reposicao, 'bg-ink-3', 'Ponto de reposição', pontoReposicao)}
        {larga && marcador(e.alvo, 'bg-line-2', 'Alvo', alvo)}
      </div>
      {larga && (
        <RotulosDoNivel
          marcas={rotulosDoNivel([
            { pos: e.minimo, nome: 'mínimo', valor: minimo },
            { pos: e.reposicao, nome: 'reposição', valor: pontoReposicao },
            { pos: e.alvo, nome: 'alvo', valor: alvo },
          ])}
        />
      )}
    </div>
  )
}

function RotulosDoNivel({
  marcas,
}: {
  marcas: ReturnType<typeof rotulosDoNivel<{ pos: number; nome: string; valor: number }>>
}) {
  const duas = marcas.some((m) => m.linha === 1)
  return (
    <div className={`relative mt-2 text-xs text-ink-3 ${duas ? 'h-16 md:h-8' : 'h-8'}`}>
      {marcas.map((m) => (
        <span
          key={m.nome}
          className={`absolute flex flex-col leading-tight whitespace-nowrap ${ANCORAS[m.ancora]} ${m.linha === 1 ? 'top-8 md:top-0' : 'top-0'}`}
          style={{ left: `${m.pos}%` }}
        >
          <strong className="font-semibold text-ink-2">{m.valor}</strong>
          {m.nome}
        </span>
      ))}
    </div>
  )
}

const ANCORAS = {
  meio: '-translate-x-1/2 items-center',
  inicio: 'items-start',
  fim: '-translate-x-full items-end',
}

/**
 * Onde pôr cada rótulo da barra larga: centralizado no marcador, mas encostado para
 * o lado oposto quando dois marcadores ficam perto (menos de 10%) ou na ponta da barra.
 * Marcadores a uma distância média (10% a 25%) não cabem lado a lado no celular: o
 * segundo desce para a linha de baixo.
 */
export function rotulosDoNivel<T extends { pos: number }>(
  marcas: T[],
): (T & { ancora: keyof typeof ANCORAS; linha: 0 | 1 })[] {
  const ordem = [...marcas].sort((a, b) => a.pos - b.pos)
  const linhas = new Map<T, 0 | 1>()
  ordem.forEach((m, i) => {
    const antes = ordem[i - 1]
    const distancia = antes ? m.pos - antes.pos : Infinity
    linhas.set(m, distancia >= 10 && distancia < 25 && linhas.get(antes) === 0 ? 1 : 0)
  })
  return marcas.map((m) => {
    const i = ordem.indexOf(m)
    const antes = ordem[i - 1]
    const depois = ordem[i + 1]
    let ancora: keyof typeof ANCORAS = 'meio'
    if (m.pos < 5 || (antes && m.pos - antes.pos < 10)) ancora = 'inicio'
    if (m.pos > 95 || (depois && depois.pos - m.pos < 10)) ancora = 'fim'
    return { ...m, ancora, linha: linhas.get(m) ?? 0 }
  })
}

/** Código interno do item (PT-0012) em mono. */
export function ChipCodigo({ children, forte = false }: { children: ReactNode; forte?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md font-mono text-[13px] font-medium whitespace-nowrap ${forte ? 'bg-accent-soft px-2 py-0.5 text-accent-ink' : 'text-accent-ink'}`}
    >
      {children}
    </span>
  )
}

/** Posição no almoxarifado (A01-G03-C04). */
export function ChipPosicao({ children, pino = false }: { children: ReactNode; pino?: boolean }) {
  if (!children) return <span className="text-ink-3">—</span>
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-md border border-line bg-surface-2 px-1.5 font-mono text-xs whitespace-nowrap text-ink-2">
      {pino && <MapPin aria-hidden className="size-3.5" />}
      {children}
    </span>
  )
}

/** Avatar com as iniciais do nome. */
export function Avatar({ nome, tamanho = 34 }: { nome: string; tamanho?: number }) {
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .filter((_, i, l) => i === 0 || i === l.length - 1)
    .join('')
    .toUpperCase()
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-[12px] font-semibold tracking-wide text-accent-ink"
      style={{ width: tamanho, height: tamanho }}
    >
      {iniciais}
    </span>
  )
}

export function Rotulo({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line py-2.5 first:border-t-0">
      <dt className="text-[13px] text-ink-3">{nome}</dt>
      <dd className="text-right text-sm">{children}</dd>
    </div>
  )
}
