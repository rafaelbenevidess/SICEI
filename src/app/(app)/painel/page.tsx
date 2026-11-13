import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDownToLine } from 'lucide-react'
import type { ReactNode } from 'react'
import { formaDaPastilha } from '@/domain/pastilha'
import {
  diasDoMes,
  escalaDaComparacao,
  mediaDiaria,
  saudeDoEstoque,
  tempoAberto,
  variacaoDoMes,
} from '@/domain/painel'
import { pode } from '@/domain/permissoes'
import { BarraDeComparacao, MedidorDeTracos, PontosPorDia } from '@/components/medidores'
import { QtdMovimentacao, TipoMovimentacao } from '@/components/movimentacao'
import { GlifoDaPastilha, Pastilha } from '@/components/Pastilha'
import {
  BadgeStatus,
  Cartao,
  ChipCodigo,
  CORES_STATUS,
  LinkBotao,
  Pagina,
  Tabela,
  Vazio,
} from '@/components/ui'
import {
  dataPorExtenso,
  formatarDiaHora,
  formatarHora,
  formatarNumero,
  hojeIso,
  NOME_STATUS,
  nomeDaPastilha,
} from '@/lib/formatar'
import { resumoDoPainel } from '@/server/consultas/painel'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'

export const metadata: Metadata = { title: 'Painel' }

const DICAS: Record<string, string> = {
  ZERADO: 'Sem saldo na prateleira',
  CRITICO: 'No mínimo ou abaixo',
  ATENCAO: 'Já é hora de comprar',
  OK: 'Acima do ponto de reposição',
}

const mes = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', month: 'long' })
const umaCasa = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

export default async function Painel({
  searchParams,
}: {
  searchParams: Promise<{ destaque?: string }>
}) {
  const u = await exigirPermissaoDaPagina('painel:ver')
  const [r, filtro] = await Promise.all([resumoDoPainel(), searchParams])
  // o histórico de movimentações é negado ao perfil Consulta (doc 02, seção 5)
  const verHistorico = pode(u.perfil, 'historico:ver')
  const podeEntrada = pode(u.perfil, 'movimentacao:entrada')
  const mesAtual = mes.format(r.agora)
  const mesAnterior = mes.format(new Date(r.agora.getTime() - 31 * 86_400_000))
  const variacao = variacaoDoMes(r.consumoMes, r.consumoMesAnterior)
  const saude = saudeDoEstoque(r.contagem)
  const consumoHoje = r.serie.at(-1)?.total ?? 0
  const media = mediaDiaria(r.consumoMes, r.serie.length)
  const barraDoMes = escalaDaComparacao(r.consumoMes, r.consumoMesAnterior)
  const barraDeHoje = escalaDaComparacao(consumoHoje, media)
  const maiorTop = Math.max(1, ...r.top.map((t) => t.total))
  // os três piores alertas disputam o destaque; ?destaque=CÓDIGO troca qual aparece
  const emFoco = r.alertas.slice(0, 3)
  const destaque = emFoco.find((a) => a.item.codigo === filtro.destaque) ?? emFoco[0] ?? null
  const maisConsumida = r.top[0] ?? null

  return (
    <Pagina
      titulo="Painel"
      antes={`${dataPorExtenso(r.agora)} · atualizado às ${formatarHora(r.agora)}`}
      acoes={
        podeEntrada && (
          <LinkBotao
            href="/movimentacoes/nova?modo=entrada"
            variante="secundario"
            icone={ArrowDownToLine}
          >
            Registrar entrada
          </LinkBotao>
        )
      }
    >
      <div className="grid gap-6 min-[75rem]:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
        <section aria-labelledby="titulo-destaque" className="flex min-w-0 flex-col gap-4">
          {destaque ? (
            <>
              <nav aria-label="Itens que mais pedem atenção" className="flex flex-wrap gap-1.5">
                {emFoco.map((a) => {
                  const ativo = a.id === destaque.id
                  return (
                    <Link
                      key={a.id}
                      href={`/painel?destaque=${encodeURIComponent(a.item.codigo)}`}
                      scroll={false}
                      aria-current={ativo ? 'true' : undefined}
                      className={`inline-flex h-9 items-center gap-2 rounded-controle pr-3 pl-1.5 font-mono text-[13px] no-underline ${ativo ? 'bg-surface font-medium text-ink shadow-pilula' : 'text-ink-3 hover:bg-(--fundo-cartao) hover:text-ink'}`}
                    >
                      <span
                        className={`grid size-6 place-items-center rounded-md ${ativo ? 'bg-ink text-bg' : 'bg-surface-3 text-ink-2'}`}
                      >
                        <GlifoDaPastilha iso={a.item.iso} className="size-4" />
                      </span>
                      {a.item.codigo}
                    </Link>
                  )
                })}
              </nav>

              <div className="relative md:h-[340px]">
                <Pastilha
                  iso={destaque.item.iso}
                  codigo={destaque.item.codigo}
                  gravacao={destaque.item.classe}
                  className="mx-auto block h-48 w-full md:absolute md:top-1/2 md:left-1/2 md:h-auto md:w-[min(48%,360px)] md:-translate-x-1/2 md:-translate-y-1/2"
                />
                {/* linhas que ligam cada cartão ao desenho, só onde há espaço para elas */}
                <svg
                  aria-hidden
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 hidden size-full text-line-2 md:block"
                >
                  <polyline
                    points="35,36 13,36 13,50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    vectorEffect="non-scaling-stroke"
                  />
                  <polyline
                    points="66,45 87,45 87,60"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <span
                  aria-hidden
                  className="absolute top-[36%] left-[35%] hidden size-3 -translate-1/2 rounded-full bg-accent ring-4 ring-surface md:block"
                />
                <span
                  aria-hidden
                  className="absolute top-[45%] left-[66%] hidden size-3 -translate-1/2 rounded-full bg-accent ring-4 ring-surface md:block"
                />
                <div className="mt-3 grid grid-cols-2 gap-3 md:mt-0 md:block">
                  <Chamada
                    titulo="Saldo"
                    sub={<BadgeStatus status={destaque.nivel} />}
                    className="md:absolute md:top-[50%] md:left-0 md:w-[176px]"
                  >
                    <Numero valor={formatarNumero(destaque.item.saldo)} unidade="un." />
                    <p className="mt-1 text-xs text-ink-3">
                      mínimo {destaque.item.estoqueMinimo} · reposição{' '}
                      {destaque.item.pontoReposicao}
                    </p>
                  </Chamada>
                  <Chamada
                    titulo="Posição"
                    className="md:absolute md:top-[60%] md:right-0 md:w-[188px]"
                  >
                    {destaque.item.posicao ? (
                      <p className="font-mono text-[19px] leading-none tracking-tight">
                        {destaque.item.posicao.codigo}
                      </p>
                    ) : (
                      <p className="text-ink-3">Sem posição</p>
                    )}
                    <p className="mt-2 text-xs text-ink-3">
                      Alerta aberto {tempoAberto(destaque.abertoEm, r.agora)}
                    </p>
                  </Chamada>
                </div>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div className="min-w-0">
                  <h2 id="titulo-destaque" className="text-[22px] leading-tight tracking-[-0.02em]">
                    {nomeDaPastilha(destaque.item)}
                  </h2>
                  <p className="mt-1 text-[13px] text-ink-3">
                    {destaque.item.codigo} · {formaDaPastilha(destaque.item.iso).nome} ·{' '}
                    {destaque.id === emFoco[0].id
                      ? 'é o alerta mais grave em aberto'
                      : 'tem alerta em aberto'}
                  </p>
                </div>
                <div className="nao-imprimir flex flex-wrap gap-2">
                  {podeEntrada && (
                    <LinkBotao
                      href={`/movimentacoes/nova?modo=entrada&item=${destaque.item.id}`}
                      icone={ArrowDownToLine}
                    >
                      Registrar entrada deste item
                    </LinkBotao>
                  )}
                  <LinkBotao href={`/itens/${destaque.item.id}`} variante="secundario">
                    Ver item
                  </LinkBotao>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
              <Pastilha
                iso={maisConsumida?.iso}
                codigo={maisConsumida?.codigo}
                gravacao={maisConsumida?.classe}
                className="h-48 w-full max-w-[320px]"
              />
              <h2 id="titulo-destaque" className="text-[22px] leading-tight tracking-[-0.02em]">
                Nenhum item em alerta
              </h2>
              <p className="max-w-md text-ink-2">
                {maisConsumida ? (
                  <>
                    Todo o estoque está acima do ponto de reposição. A pastilha mais consumida em{' '}
                    {mesAtual} é a{' '}
                    <Link href={`/itens/${maisConsumida.id}`}>{nomeDaPastilha(maisConsumida)}</Link>
                    , com {formatarNumero(maisConsumida.total)} unidades.
                  </>
                ) : (
                  'Todo o estoque está acima do ponto de reposição.'
                )}
              </p>
            </div>
          )}
        </section>

        <Cartao
          titulo="Saúde do estoque"
          subtitulo={`${formatarNumero(saude.total)} ${saude.total === 1 ? 'item ativo' : 'itens ativos'}`}
        >
          <MedidorDeTracos
            percentual={saude.percentual}
            rotulo={
              saude.percentual === null
                ? 'Nenhum item cadastrado'
                : `${saude.percentual}% dos itens acima do ponto de reposição`
            }
          >
            <span className="text-[46px] leading-none font-light tracking-[-0.04em]">
              {saude.percentual === null ? '—' : `${saude.percentual}%`}
            </span>
            <span className="mt-1.5 text-[13px] text-ink-3">acima do ponto de reposição</span>
          </MedidorDeTracos>
          <ul aria-label="Itens em cada status" className="mt-5">
            {(['ZERADO', 'CRITICO', 'ATENCAO', 'OK'] as const).map((s) => (
              <li key={s} className="border-t border-line">
                <Link
                  href={`/itens?status=${s}`}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 text-ink no-underline hover:bg-surface-2"
                >
                  <span
                    aria-hidden
                    className={`size-2.5 rounded-[3px] ${CORES_STATUS[s].solido}`}
                  />
                  <span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-baseline sm:gap-2">
                    <span className="font-medium">{NOME_STATUS[s]}</span>
                    <span className="truncate text-[13px] text-ink-3">{DICAS[s]}</span>
                  </span>
                  <span className="whitespace-nowrap">
                    <strong className="text-[17px] font-medium">{r.contagem[s]}</strong>{' '}
                    <span className="text-[13px] text-ink-3">
                      {r.contagem[s] === 1 ? 'item' : 'itens'}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Cartao>
      </div>

      <div className="grid gap-6 min-[60rem]:grid-cols-2 min-[85rem]:grid-cols-[minmax(0,0.75fr)_minmax(0,1.35fr)_minmax(0,1.25fr)]">
        <div className="grid gap-6 sm:grid-cols-2 min-[60rem]:col-span-2 min-[85rem]:col-span-1 min-[85rem]:grid-cols-1">
          <Indicador
            titulo={`Consumo em ${mesAtual}`}
            valor={formatarNumero(r.consumoMes)}
            nota={
              variacao !== null
                ? `${variacao > 0 ? '+' : variacao < 0 ? '−' : ''}${Math.abs(variacao)}% vs. ${mesAnterior}`
                : `Sem consumo em ${mesAnterior}`
            }
            barra={barraDoMes}
            rotulo={`${r.consumoMes} unidades em ${mesAtual}; ${r.consumoMesAnterior} em ${mesAnterior}`}
            esquerda="até hoje"
            direita={`${mesAnterior}: ${formatarNumero(r.consumoMesAnterior)}`}
          />
          <Indicador
            titulo="Consumo hoje"
            valor={formatarNumero(consumoHoje)}
            nota={`Média de ${umaCasa.format(media)} por dia`}
            barra={barraDeHoje}
            rotulo={`${consumoHoje} unidades hoje; média de ${umaCasa.format(media)} por dia em ${mesAtual}`}
            esquerda="hoje"
            direita={`média: ${umaCasa.format(media)}`}
          />
        </div>

        <Cartao
          titulo={`Consumo da produção em ${mesAtual}`}
          subtitulo="Saídas do tipo consumo, sem estornos"
        >
          <PontosPorDia dias={r.serie} diasNoMes={diasDoMes(hojeIso(r.agora))} />
        </Cartao>

        <Cartao titulo="Alertas abertos" acao={<Link href="/alertas">Ver todos</Link>}>
          {r.alertas.length === 0 ? (
            <p className="text-ink-3">Nenhum item em alerta.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {r.alertas.slice(0, 6).map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/itens/${a.item.id}`}
                    className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3.5 py-2.5 text-ink no-underline hover:brightness-[0.97] ${CORES_STATUS[a.nivel]?.suave ?? 'bg-surface-2'}`}
                  >
                    <span
                      aria-hidden
                      className={`size-2.5 rounded-[3px] ${CORES_STATUS[a.nivel]?.solido ?? 'bg-ink-3'}`}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{nomeDaPastilha(a.item)}</span>
                      <span className="truncate text-xs text-ink-2">
                        <strong className="font-semibold">{NOME_STATUS[a.nivel] ?? a.nivel}</strong>
                        <span className="font-mono">
                          {' · '}
                          {a.item.codigo} · {a.item.posicao?.codigo ?? 'sem posição'}
                        </span>
                      </span>
                    </span>
                    <span className="text-right text-[13px] whitespace-nowrap text-ink-2">
                      <strong className="text-[15px] font-semibold text-ink">{a.item.saldo}</strong>{' '}
                      / mín. {a.item.estoqueMinimo}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>

      <div
        className={`grid gap-6 ${verHistorico ? 'min-[85rem]:grid-cols-[1fr_1.35fr]' : 'min-[85rem]:grid-cols-2'}`}
      >
        <Cartao titulo="Mais consumidos no mês">
          {r.top.length === 0 ? (
            <Vazio>Sem consumo neste mês.</Vazio>
          ) : (
            <ul className="flex flex-col gap-3" aria-label="Itens mais consumidos no mês">
              {r.top.map((t) => (
                <li
                  key={t.id}
                  className="grid grid-cols-[auto_72px_minmax(0,1fr)_40px] items-center gap-3"
                >
                  <GlifoDaPastilha iso={t.iso} className="size-5 text-ink-3" />
                  <Link href={`/itens/${t.id}`} className="no-underline">
                    <ChipCodigo>{t.codigo}</ChipCodigo>
                  </Link>
                  <span className="h-2.5 rounded-full bg-surface-3">
                    <span
                      className="block h-full rounded-full bg-linear-to-r from-[color-mix(in_oklch,var(--accent)_22%,var(--surface-3))] to-accent"
                      style={{ width: `${(t.total / maiorTop) * 100}%` }}
                    />
                  </span>
                  <span className="text-right font-semibold">{t.total}</span>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        {verHistorico && (
          <Cartao
            titulo="Últimas movimentações"
            semPadding
            acao={<Link href="/movimentacoes">Histórico completo</Link>}
          >
            {r.ultimas.length === 0 ? (
              <p className="px-6 pb-6 text-ink-3">Nenhuma movimentação ainda.</p>
            ) : (
              <Tabela rotulo="Últimas movimentações" emCartao larguraMinima={560}>
                <thead>
                  <tr>
                    <th>Quando</th>
                    <th>Item</th>
                    <th>Tipo</th>
                    <th className="text-right">Qtd.</th>
                    <th>Usuário</th>
                  </tr>
                </thead>
                <tbody>
                  {r.ultimas.map((m) => {
                    const delta = m.saldoPosterior - m.saldoAnterior
                    return (
                      <tr key={m.id}>
                        <td className="whitespace-nowrap">{formatarDiaHora(m.criadoEm)}</td>
                        <td>
                          <Link href={`/itens/${m.item.id}`} className="no-underline">
                            <ChipCodigo>{m.item.codigo}</ChipCodigo>
                          </Link>
                        </td>
                        <td>
                          <TipoMovimentacao tipo={m.tipo} delta={delta} />
                        </td>
                        <td className="text-right">
                          <QtdMovimentacao delta={delta} />
                        </td>
                        <td className="font-mono text-xs text-ink-2">{m.usuario.login}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </Tabela>
            )}
          </Cartao>
        )}
      </div>
    </Pagina>
  )
}

/** Indicador do painel: número, nota de comparação e a barra contra a referência. */
function Indicador({
  titulo,
  valor,
  nota,
  barra,
  rotulo,
  esquerda,
  direita,
}: {
  titulo: string
  valor: string
  nota: string
  barra: { valor: number; referencia: number }
  rotulo: string
  esquerda: string
  direita: string
}) {
  return (
    <section className="cartao flex min-w-0 flex-col justify-between gap-4 p-5">
      <div>
        <h2 className="text-[13px] font-medium">{titulo}</h2>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <Numero valor={valor} unidade="un." />
          <p className="text-xs text-ink-2">{nota}</p>
        </div>
      </div>
      <div>
        <BarraDeComparacao valor={barra.valor} referencia={barra.referencia} rotulo={rotulo} />
        <p className="mt-2.5 flex justify-between gap-3 text-xs text-ink-3">
          <span>{esquerda}</span>
          <span>{direita}</span>
        </p>
      </div>
    </section>
  )
}

/** Número grande e leve, com a unidade pequena ao lado. */
function Numero({ valor, unidade }: { valor: string; unidade: string }) {
  return (
    <p className="flex items-baseline gap-1.5">
      <span className="text-[40px] leading-none font-light tracking-[-0.04em]">{valor}</span>
      <span className="text-[13px] text-ink-3">{unidade}</span>
    </p>
  )
}

/** Cartão pequeno que fica ao lado do desenho da pastilha, ligado a ela por uma linha. */
function Chamada({
  titulo,
  sub,
  className = '',
  children,
}: {
  titulo: string
  sub?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`cartao min-w-0 px-4 py-3 backdrop-blur-md ${className}`}>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <p className="text-[13px] font-medium">{titulo}</p>
        {sub && <div className="text-xs text-ink-3">{sub}</div>}
      </div>
      {children}
    </div>
  )
}
