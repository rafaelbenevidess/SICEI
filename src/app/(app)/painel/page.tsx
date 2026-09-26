import type { Metadata } from 'next'
import Link from 'next/link'
import { pode } from '@/domain/permissoes'
import { BadgeStatus, Cartao, Pagina, Tabela, Vazio } from '@/components/ui'
import { formatarDataHora, NOME_STATUS, NOME_TIPO } from '@/lib/formatar'
import { resumoDoPainel } from '@/server/consultas/painel'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'

export const metadata: Metadata = { title: 'Painel' }

export default async function Painel() {
  const u = await exigirPermissaoDaPagina('painel:ver')
  const r = await resumoDoPainel()
  // o histórico de movimentações é negado ao perfil Consulta (doc 02, seção 5)
  const verHistorico = pode(u.perfil, 'historico:ver')
  const variacao =
    r.consumoMesAnterior > 0
      ? Math.round(((r.consumoMes - r.consumoMesAnterior) / r.consumoMesAnterior) * 100)
      : null
  const maior = Math.max(1, ...r.top.map((t) => t.total))

  return (
    <Pagina titulo="Painel" descricao="Situação do estoque de pastilhas agora (RF-16).">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['ZERADO', 'CRITICO', 'ATENCAO', 'OK'] as const).map((s) => (
          <Link
            key={s}
            href={`/itens?status=${s}`}
            className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400"
          >
            <p className="text-3xl font-bold">{r.contagem[s]}</p>
            <p className="mt-1">
              <BadgeStatus status={s} />
            </p>
            <span className="sr-only">itens com status {NOME_STATUS[s]}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao titulo="Alertas abertos">
          {r.alertas.length === 0 ? (
            <Vazio>Nenhum item em alerta.</Vazio>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {r.alertas.map((a) => (
                <li key={a.id} className="flex min-w-0 items-center gap-2 py-2 text-sm">
                  <BadgeStatus status={a.nivel} />
                  <Link href={`/itens/${a.item.id}`} className="font-medium underline">
                    {a.item.codigo}
                  </Link>
                  <span className="min-w-0 flex-1 truncate text-slate-600">{a.item.descricao}</span>
                  <span className="whitespace-nowrap text-slate-500">saldo {a.item.saldo}</span>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <Cartao titulo="Consumo da produção no mês">
          <p className="text-3xl font-bold">
            {r.consumoMes} <span className="text-base font-normal text-slate-500">unidades</span>
          </p>
          <p className="text-sm text-slate-600">
            Mês anterior: {r.consumoMesAnterior}
            {variacao !== null && ` (${variacao > 0 ? '+' : ''}${variacao}%)`}
          </p>
          <h3 className="mb-2 mt-4 text-sm font-semibold">Itens mais consumidos no mês</h3>
          {r.top.length === 0 ? (
            <Vazio>Sem consumo neste mês.</Vazio>
          ) : (
            <svg
              role="img"
              aria-label="Itens mais consumidos no mês"
              viewBox={`0 0 300 ${r.top.length * 22}`}
              className="w-full"
            >
              {r.top.map((t, i) => (
                <g key={t.id} transform={`translate(0, ${i * 22})`}>
                  <text x="0" y="14" fontSize="10" fill="currentColor">
                    {t.codigo}
                  </text>
                  <rect
                    x="70"
                    y="4"
                    height="14"
                    width={(t.total / maior) * 190}
                    rx="2"
                    fill="#334155"
                  />
                  <text x={74 + (t.total / maior) * 190} y="15" fontSize="10" fill="currentColor">
                    {t.total}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </Cartao>
      </div>

      {verHistorico && (
        <Cartao titulo="Últimas movimentações">
          {r.ultimas.length === 0 ? (
            <Vazio>Nenhuma movimentação ainda.</Vazio>
          ) : (
            <Tabela rotulo="Últimas movimentações">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Item</th>
                  <th>Tipo</th>
                  <th className="text-right">Qtd.</th>
                  <th>Usuário</th>
                </tr>
              </thead>
              <tbody>
                {r.ultimas.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap">{formatarDataHora(m.criadoEm)}</td>
                    <td>
                      <Link href={`/itens/${m.item.id}`} className="underline">
                        {m.item.codigo}
                      </Link>
                    </td>
                    <td>{NOME_TIPO[m.tipo]}</td>
                    <td className="text-right">{m.quantidade}</td>
                    <td>{m.usuario.login}</td>
                  </tr>
                ))}
              </tbody>
            </Tabela>
          )}
        </Cartao>
      )}
    </Pagina>
  )
}
