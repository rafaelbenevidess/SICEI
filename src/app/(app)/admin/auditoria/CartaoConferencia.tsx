'use client'

import { CircleCheck, CircleX, RefreshCw, ShieldCheck } from 'lucide-react'
import { useActionState, type ReactNode } from 'react'
import { acaoConferirIntegridade, type EstadoConferencia } from '@/app/acoes/admin'
import { classeBotao } from '@/components/ui'
import { formatarDataHora, formatarNumero } from '@/lib/formatar'

function Bloco({ ok, children }: { ok: boolean; children: ReactNode }) {
  const Icone = ok ? CircleCheck : CircleX
  return (
    <div
      role={ok ? 'status' : 'alert'}
      className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${
        ok ? 'bg-ok-soft text-ok-ink' : 'bg-crit-soft text-crit-ink'
      }`}
    >
      <Icone aria-hidden className="mt-px size-[18px] shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** RF-21 / RN-09a / RN-09b: verificação de integridade do log e conferência de saldo. */
export function CartaoConferencia() {
  const [estado, executar, pendente] = useActionState<EstadoConferencia>(
    () => acaoConferirIntegridade(),
    {},
  )
  const r = estado.resultado
  return (
    <section className="rounded-[14px] border border-line bg-surface p-5 shadow-cartao">
      <form action={executar} className="flex flex-wrap items-center gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-ink">
          <ShieldCheck aria-hidden className="size-[22px]" />
        </span>
        <div className="min-w-0 flex-1 basis-64">
          <h2 className="text-[15px] font-semibold">
            Verificação de integridade e conferência de saldo
          </h2>
          <p className="text-[13px] text-ink-2">
            Recalcula todos os hashes, confere cada movimentação com o log e cada saldo com a soma
            das movimentações.
          </p>
        </div>
        <button className={classeBotao('primario')} disabled={pendente} aria-busy={pendente}>
          <RefreshCw aria-hidden className={pendente ? 'animate-spin' : undefined} />
          {pendente ? 'Verificando…' : 'Verificar agora'}
        </button>
      </form>

      {estado.erro && (
        <p role="alert" className="mt-4 rounded-xl bg-crit-soft px-4 py-3 text-sm text-crit-ink">
          {estado.erro}
        </p>
      )}

      {r && (
        <div className="mt-4 flex flex-col gap-2">
          <div className="grid gap-2 min-[65rem]:grid-cols-3">
            <Bloco ok={r.cadeiaIntegra}>
              {r.adulteracao ? (
                <>
                  <b>Adulteração detectada no registro {r.adulteracao.seq}.</b>{' '}
                  {r.adulteracao.motivo}
                </>
              ) : (
                <>
                  <b>Cadeia íntegra.</b> {formatarNumero(r.registrosConferidos)} registros
                  conferidos.
                </>
              )}
            </Bloco>
            <Bloco ok={r.movimentacoesDivergentes.length === 0}>
              {r.movimentacoesDivergentes.length === 0 ? (
                'Todas as movimentações batem com o log.'
              ) : (
                <>
                  <b>{r.movimentacoesDivergentes.length} movimentação(ões) não batem com o log:</b>{' '}
                  <span className="font-mono text-xs break-all">
                    {r.movimentacoesDivergentes.join(', ')}
                  </span>
                </>
              )}
            </Bloco>
            <Bloco ok={r.saldosDivergentes.length === 0}>
              {r.saldosDivergentes.length === 0 ? (
                `Nenhuma divergência de saldo nos ${formatarNumero(r.itensConferidos)} itens.`
              ) : (
                <>
                  <b>Saldos divergentes:</b>
                  <ul className="mt-1">
                    {r.saldosDivergentes.map((d) => (
                      <li key={d.itemId}>
                        <span className="font-mono">{d.codigo}</span>: guardado {d.saldoGuardado},
                        pelas movimentações {d.saldoPelasMovimentacoes}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Bloco>
          </div>
          <p className="text-xs text-ink-3">
            Conferência registrada no log às {formatarDataHora(r.instante)} por{' '}
            <span className="font-mono">{estado.login}</span>.
          </p>
        </div>
      )}
    </section>
  )
}
