import Link from 'next/link'
import { Lock } from 'lucide-react'
import { pode } from '@/domain/permissoes'
import type { Perfil } from '@/domain/tipos'
import { TipoMovimentacao } from '@/components/movimentacao'
import { Rotulo } from '@/components/ui'
import { contextoDaMovimentacao } from '@/lib/contexto'
import { descreverDispositivo } from '@/lib/dispositivo'
import { formatarDataHora, NOME_TIPO } from '@/lib/formatar'
import type { detalheMovimentacao } from '@/server/consultas/movimentacoes'
import { FormEstorno } from './[id]/FormEstorno'

type Detalhe = NonNullable<Awaited<ReturnType<typeof detalheMovimentacao>>>

/** Detalhe de uma movimentação, com o estorno (RN-12) para quem pode estornar. */
export function PainelMovimentacao({ m, perfil }: { m: Detalhe; perfil: Perfil }) {
  const delta = m.saldoPosterior - m.saldoAnterior
  const podeEstornar =
    pode(perfil, 'movimentacao:estornar') && m.tipo !== 'ESTORNO' && !m.estornadaPor
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">Detalhe</h2>
        <span className="truncate font-mono text-xs text-ink-3" title={m.id}>
          {m.id.slice(0, 13)}
        </span>
      </div>
      <p className="flex items-center justify-between gap-3 text-lg font-semibold">
        <TipoMovimentacao tipo={m.tipo} delta={delta} />
        <span className={`text-2xl ${delta > 0 ? 'text-ok-ink' : ''}`}>
          {delta > 0 ? '+' : '−'}
          {Math.abs(delta)}
        </span>
      </p>
      <dl>
        <Rotulo nome="Item">
          <Link href={`/itens/${m.item.id}`} className="font-mono">
            {m.item.codigo}
          </Link>
        </Rotulo>
        <Rotulo nome="Saldo">
          {m.saldoAnterior} → {m.saldoPosterior}
        </Rotulo>
        <Rotulo nome="Contexto">{contextoDaMovimentacao(m, pode(perfil, 'precos:ver'))}</Rotulo>
        {m.observacao && <Rotulo nome="Observação">{m.observacao}</Rotulo>}
        <Rotulo nome="Registrado por">
          <span className="font-mono">{m.usuario.login}</span>
        </Rotulo>
        <Rotulo nome="Data e hora (servidor)">{formatarDataHora(m.criadoEm)}</Rotulo>
        <Rotulo nome="IP">
          <span className="font-mono">{m.ip ?? '—'}</span>
        </Rotulo>
        <Rotulo nome="Dispositivo">{descreverDispositivo(m.userAgent)}</Rotulo>
      </dl>

      {m.estornadaPor && (
        <div className="flex gap-2.5 rounded-[10px] bg-surface-2 px-4 py-3 text-[13px] text-ink-2">
          <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-3" />
          <p>
            Estornada em {formatarDataHora(m.estornadaPor.criadoEm)} por{' '}
            <span className="font-mono">{m.estornadaPor.usuario.login}</span>: “
            {m.estornadaPor.motivo}”.{' '}
            <Link href={`/movimentacoes/${m.estornadaPor.id}`}>Ver o estorno</Link>
          </p>
        </div>
      )}
      {m.estorna && (
        <div className="flex gap-2.5 rounded-[10px] bg-surface-2 px-4 py-3 text-[13px] text-ink-2">
          <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-3" />
          <p>
            Este lançamento é um estorno de{' '}
            <Link href={`/movimentacoes/${m.estorna.id}`}>
              {NOME_TIPO[m.estorna.tipo]} de {formatarDataHora(m.estorna.criadoEm)}
            </Link>
            . Estorno não pode ser estornado.
          </p>
        </div>
      )}
      {podeEstornar && (
        <div className="border-t border-line pt-4">
          <FormEstorno movimentacaoId={m.id} />
          <p className="mt-2 text-xs text-ink-3">
            Exige justificativa. Cada movimentação só pode ser estornada uma vez.
          </p>
        </div>
      )}
    </div>
  )
}
