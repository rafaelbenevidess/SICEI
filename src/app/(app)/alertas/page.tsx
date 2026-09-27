import type { Metadata } from 'next'
import Link from 'next/link'
import { CircleCheck } from 'lucide-react'
import { pode } from '@/domain/permissoes'
import {
  BadgeStatus,
  ChipCodigo,
  ChipPosicao,
  Pagina,
  Segmentado,
  Tabela,
  Vazio,
} from '@/components/ui'
import { formatarDiaHora, NOME_TIPO, nomeDaPastilha } from '@/lib/formatar'
import { listarAlertas } from '@/server/consultas/estoque'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { BotaoCiente } from './BotaoCiente'

export const metadata: Metadata = { title: 'Alertas' }

/** RF-13: alertas abertos (um por item, RN-18) e os fechados recentemente. */
export default async function PaginaAlertas({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>
}) {
  const u = await exigirPermissaoDaPagina('alertas:ver')
  const { aba } = await searchParams
  const fechadosAba = aba === 'fechados'
  const { abertos, fechados } = await listarAlertas()
  const podeCiente = pode(u.perfil, 'alertas:ciente')

  return (
    <Pagina
      titulo="Alertas"
      descricao="Um alerta por item. Sobe de nível se piorar e fecha sozinho quando o saldo volta a OK."
      acoes={
        <Segmentado
          rotulo="Alertas abertos ou fechados"
          opcoes={[
            { href: '/alertas', rotulo: `Abertos · ${abertos.length}`, ativo: !fechadosAba },
            {
              href: '/alertas?aba=fechados',
              rotulo: 'Fechados recentemente',
              ativo: fechadosAba,
            },
          ]}
        />
      }
    >
      {!fechadosAba &&
        (abertos.length === 0 ? (
          <Vazio>Nenhum alerta aberto. Todos os itens estão acima do ponto de reposição.</Vazio>
        ) : (
          <Tabela rotulo="Alertas abertos" larguraMinima={860}>
            <thead>
              <tr>
                <th className="w-[100px]">Nível</th>
                <th>Item</th>
                <th className="text-right">Saldo / mín.</th>
                <th>Posição</th>
                <th>Aberto em</th>
                <th className="text-right">Ciente</th>
              </tr>
            </thead>
            <tbody>
              {abertos.map((a) => (
                <tr key={a.id}>
                  <td>
                    <BadgeStatus status={a.nivel} />
                  </td>
                  <td>
                    <Link href={`/itens/${a.item.id}`} className="text-ink no-underline">
                      <span className="block font-medium">{nomeDaPastilha(a.item)}</span>
                      <ChipCodigo>{a.item.codigo}</ChipCodigo>
                    </Link>
                  </td>
                  <td className="text-right whitespace-nowrap text-ink-2">
                    <strong className="text-base text-ink">{a.item.saldo}</strong> /{' '}
                    {a.item.estoqueMinimo}
                  </td>
                  <td>
                    <ChipPosicao>{a.item.posicao?.codigo}</ChipPosicao>
                  </td>
                  <td className="whitespace-nowrap text-ink-2">{formatarDiaHora(a.abertoEm)}</td>
                  <td className="text-right">
                    {a.cientePor ? (
                      <span className="inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap text-ok-ink">
                        <CircleCheck aria-hidden className="size-4 text-ok" />
                        <span className="font-mono">{a.cientePor.login}</span> ·{' '}
                        {formatarDiaHora(a.cienteEm)}
                      </span>
                    ) : podeCiente ? (
                      <div className="flex justify-end">
                        <BotaoCiente alertaId={a.id} pequeno />
                      </div>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        ))}

      {fechadosAba &&
        (fechados.length === 0 ? (
          <Vazio>Nenhum alerta fechado ainda.</Vazio>
        ) : (
          <Tabela rotulo="Alertas fechados recentemente" larguraMinima={760}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Último nível</th>
                <th>Aberto em</th>
                <th>Fechado em</th>
                <th>Fechado por</th>
              </tr>
            </thead>
            <tbody>
              {fechados.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/itens/${a.item.id}`} className="text-ink no-underline">
                      <span className="block font-medium">{nomeDaPastilha(a.item)}</span>
                      <ChipCodigo>{a.item.codigo}</ChipCodigo>
                    </Link>
                  </td>
                  <td>
                    <BadgeStatus status={a.nivel} />
                  </td>
                  <td className="whitespace-nowrap text-ink-2">{formatarDiaHora(a.abertoEm)}</td>
                  <td className="whitespace-nowrap text-ink-2">{formatarDiaHora(a.fechadoEm)}</td>
                  <td className="text-ink-2">
                    {a.fechadoPor ? (
                      <>
                        {NOME_TIPO[a.fechadoPor.tipo]}
                        {a.fechadoPor.notaFiscal && (
                          <span className="font-mono"> · NF {a.fechadoPor.notaFiscal}</span>
                        )}
                        <span className="block font-mono text-xs text-ink-3">
                          {a.fechadoPor.usuario.login}
                        </span>
                      </>
                    ) : (
                      'Recálculo (rotina diária ou limites)'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        ))}
    </Pagina>
  )
}
