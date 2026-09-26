import type { Metadata } from 'next'
import Link from 'next/link'
import { pode } from '@/domain/permissoes'
import { BadgeStatus, Cartao, Pagina, Tabela, Vazio } from '@/components/ui'
import { formatarDataHora } from '@/lib/formatar'
import { listarAlertas } from '@/server/consultas/estoque'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { BotaoCiente } from './BotaoCiente'

export const metadata: Metadata = { title: 'Alertas' }

export default async function PaginaAlertas() {
  const u = await exigirPermissaoDaPagina('alertas:ver')
  const { abertos, fechados } = await listarAlertas()
  return (
    <Pagina
      titulo="Alertas"
      descricao="Um alerta por item; sobe de nível se piorar e fecha sozinho quando o saldo volta a OK (RN-18)."
    >
      <Cartao titulo={`Abertos (${abertos.length})`}>
        {abertos.length === 0 ? (
          <Vazio>Nenhum alerta aberto.</Vazio>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {abertos.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <BadgeStatus status={a.nivel} />
                <Link href={`/itens/${a.item.id}`} className="font-medium underline">
                  {a.item.codigo}
                </Link>
                <span className="min-w-0 flex-1">{a.item.descricao}</span>
                <span>
                  saldo {a.item.saldo} · mín. {a.item.estoqueMinimo} ·{' '}
                  {a.item.posicao?.codigo ?? 'sem posição'}
                </span>
                <span className="text-slate-500">desde {formatarDataHora(a.abertoEm)}</span>
                {a.cientePor ? (
                  <span className="text-slate-500">
                    ciente: {a.cientePor.login} em {formatarDataHora(a.cienteEm)}
                  </span>
                ) : (
                  pode(u.perfil, 'alertas:ciente') && <BotaoCiente alertaId={a.id} />
                )}
              </li>
            ))}
          </ul>
        )}
      </Cartao>
      <Cartao titulo="Fechados recentemente">
        {fechados.length === 0 ? (
          <Vazio>Nenhum alerta fechado.</Vazio>
        ) : (
          <Tabela rotulo="Alertas fechados">
            <thead>
              <tr>
                <th>Item</th>
                <th>Último nível</th>
                <th>Aberto em</th>
                <th>Fechado em</th>
              </tr>
            </thead>
            <tbody>
              {fechados.map((a) => (
                <tr key={a.id}>
                  <td>{a.item.codigo}</td>
                  <td>
                    <BadgeStatus status={a.nivel} />
                  </td>
                  <td>{formatarDataHora(a.abertoEm)}</td>
                  <td>{formatarDataHora(a.fechadoEm)}</td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </Cartao>
    </Pagina>
  )
}
