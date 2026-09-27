import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDownToLine } from 'lucide-react'
import { pode } from '@/domain/permissoes'
import { QtdMovimentacao, TipoMovimentacao } from '@/components/movimentacao'
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

export default async function Painel() {
  const u = await exigirPermissaoDaPagina('painel:ver')
  const r = await resumoDoPainel()
  // o histórico de movimentações é negado ao perfil Consulta (doc 02, seção 5)
  const verHistorico = pode(u.perfil, 'historico:ver')
  const variacao =
    r.consumoMesAnterior > 0
      ? Math.round(((r.consumoMes - r.consumoMesAnterior) / r.consumoMesAnterior) * 100)
      : null
  const mesAtual = mes.format(r.agora)
  const mesAnterior = mes.format(new Date(r.agora.getTime() - 31 * 86_400_000))
  const maiorDia = Math.max(1, ...r.serie.map((d) => d.total))
  const maiorTop = Math.max(1, ...r.top.map((t) => t.total))

  return (
    <Pagina
      titulo="Painel"
      antes={`${dataPorExtenso(r.agora)} · atualizado às ${formatarHora(r.agora)}`}
      acoes={
        pode(u.perfil, 'movimentacao:entrada') && (
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
      <section
        aria-label="Saúde do estoque"
        className="grid gap-px overflow-hidden rounded-[14px] border border-line bg-line shadow-cartao sm:grid-cols-2 min-[65rem]:grid-cols-4"
      >
        {(['ZERADO', 'CRITICO', 'ATENCAO', 'OK'] as const).map((s) => (
          <Link
            key={s}
            href={`/itens?status=${s}`}
            className="relative bg-surface px-6 pt-[22px] pb-7 text-ink no-underline hover:bg-surface-2"
          >
            <span className="flex items-center gap-2 text-[13px] text-ink-2">
              <span aria-hidden className={`size-2 rounded-[2px] ${CORES_STATUS[s].solido}`} />
              {NOME_STATUS[s]}
            </span>
            <span className="mt-2 flex items-baseline gap-2">
              <span className="text-[40px] leading-none font-semibold tracking-[-0.03em]">
                {r.contagem[s]}
              </span>
              <span className="text-ink-3">{r.contagem[s] === 1 ? 'item' : 'itens'}</span>
            </span>
            <span className="mt-3 block text-[13px] text-ink-2">{DICAS[s]}</span>
            <span
              aria-hidden
              className={`absolute inset-x-0 bottom-0 h-[5px] ${CORES_STATUS[s].solido}`}
            />
          </Link>
        ))}
      </section>

      <div className="grid gap-6 min-[75rem]:grid-cols-[1.35fr_1fr]">
        <Cartao
          titulo={`Consumo da produção em ${mesAtual}`}
          subtitulo="Saídas do tipo consumo, sem estornos"
          acao={
            <span className="block text-right">
              <span className="text-[30px] leading-none font-semibold tracking-[-0.03em] text-ink">
                {formatarNumero(r.consumoMes)}
              </span>{' '}
              <span className="text-ink-3">un.</span>
              <span className="mt-1 block font-normal text-ink-2">
                {variacao !== null ? (
                  <>
                    <strong className="font-semibold text-ink">
                      {variacao > 0 ? '+' : variacao < 0 ? '−' : ''}
                      {Math.abs(variacao)}%
                    </strong>{' '}
                    vs. {mesAnterior} ({formatarNumero(r.consumoMesAnterior)})
                  </>
                ) : (
                  `Sem consumo em ${mesAnterior}`
                )}
              </span>
            </span>
          }
        >
          <div
            role="img"
            aria-label={`Consumo por dia em ${mesAtual}: total ${r.consumoMes} unidades`}
            className="flex h-[180px] items-end gap-[3px] pt-4"
          >
            {r.serie.map((d) => (
              <span
                key={d.dia}
                title={`${d.rotulo}: ${d.total} un.`}
                className={`min-w-0 flex-1 rounded-t-[3px] ${d.hoje ? 'bg-accent' : 'bg-[color-mix(in_oklch,var(--accent)_38%,var(--surface-3))]'}`}
                style={{ height: d.total > 0 ? `${Math.max(2, (d.total / maiorDia) * 100)}%` : 2 }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[11px] text-ink-3">
            {r.serie
              .filter((d, i) => i % 7 === 0 || d.hoje)
              .map((d) => (
                <span key={d.dia}>{d.rotulo}</span>
              ))}
          </div>
        </Cartao>

        <Cartao titulo="Alertas abertos" semPadding acao={<Link href="/alertas">Ver todos</Link>}>
          {r.alertas.length === 0 ? (
            <p className="px-6 pb-6 text-ink-3">Nenhum item em alerta.</p>
          ) : (
            <ul>
              {r.alertas.slice(0, 6).map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/itens/${a.item.id}`}
                    className="grid grid-cols-[78px_minmax(0,1fr)_auto] items-center gap-3 border-t border-line px-6 py-3 text-ink no-underline hover:bg-surface-2"
                  >
                    <span className="justify-self-start">
                      <BadgeStatus status={a.nivel} />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{nomeDaPastilha(a.item)}</span>
                      <span className="truncate font-mono text-xs text-ink-3">
                        {a.item.codigo} · {a.item.posicao?.codigo ?? 'sem posição'}
                      </span>
                    </span>
                    <span className="text-right text-[13px] whitespace-nowrap text-ink-2">
                      <strong className="text-[15px] text-ink">{a.item.saldo}</strong> / mín.{' '}
                      {a.item.estoqueMinimo}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>

      <div
        className={`grid gap-6 ${verHistorico ? 'min-[75rem]:grid-cols-[1fr_1.35fr]' : 'min-[75rem]:grid-cols-2'}`}
      >
        <Cartao titulo="Mais consumidos no mês">
          {r.top.length === 0 ? (
            <Vazio>Sem consumo neste mês.</Vazio>
          ) : (
            <ul className="flex flex-col gap-2.5" aria-label="Itens mais consumidos no mês">
              {r.top.map((t, i) => (
                <li
                  key={t.id}
                  className="grid grid-cols-[72px_minmax(0,1fr)_40px] items-center gap-3"
                >
                  <Link
                    href={`/itens/${t.id}`}
                    className="font-mono text-xs text-ink-2 no-underline"
                  >
                    {t.codigo}
                  </Link>
                  <span className="h-[18px] rounded bg-surface-2">
                    <span
                      className="block h-full rounded bg-accent"
                      style={{
                        width: `${(t.total / maiorTop) * 100}%`,
                        opacity: 1 - i * 0.065,
                      }}
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
