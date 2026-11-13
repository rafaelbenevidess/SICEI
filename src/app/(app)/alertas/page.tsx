import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDownToLine, CircleCheck, Download } from 'lucide-react'
import { tempoAberto } from '@/domain/painel'
import { pode } from '@/domain/permissoes'
import { GlifoDaPastilha } from '@/components/Pastilha'
import {
  BadgeStatus,
  ChipCodigo,
  ChipPosicao,
  CORES_STATUS,
  LinkBotao,
  Pagina,
  Segmentado,
  Tabela,
  Vazio,
} from '@/components/ui'
import {
  formatarDiaHora,
  formatarMoeda,
  formatarNumero,
  NOME_TIPO,
  nomeDaPastilha,
} from '@/lib/formatar'
import { listarAlertas } from '@/server/consultas/estoque'
import { relatorioReposicao } from '@/server/consultas/relatorios'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { AvisoVisto } from './AvisoVisto'
import { BotaoCiente } from './BotaoCiente'

export const metadata: Metadata = { title: 'Alertas' }

/**
 * RF-13 e RF-19: alertas abertos (um por item, RN-18) com a sugestão de compra de cada um na
 * mesma linha, para quem pode ver relatórios, e os fechados recentemente. Dar ciente e
 * registrar a entrada saem daqui, sem trocar de tela.
 */
export default async function PaginaAlertas({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>
}) {
  const u = await exigirPermissaoDaPagina('alertas:ver')
  const { aba } = await searchParams
  const fechadosAba = aba === 'fechados'
  const podeCiente = pode(u.perfil, 'alertas:ciente')
  const podeEntrada = pode(u.perfil, 'movimentacao:entrada')
  // a sugestão de compra é um relatório (RF-19): só entra para quem pode ver relatórios
  const verSugestao = pode(u.perfil, 'relatorios:ver')
  const verPrecos = pode(u.perfil, 'precos:ver')
  const [{ abertos, fechados }, reposicao] = await Promise.all([
    listarAlertas(),
    verSugestao && !fechadosAba ? relatorioReposicao() : Promise.resolve([]),
  ])
  const sugestoes = new Map(reposicao.map((l) => [l.item.id, l]))
  const agora = new Date()
  const semCiente = abertos.filter((a) => !a.cientePor).length
  const unidades = reposicao.reduce((s, l) => s + l.sugestao.quantidade, 0)
  const caixas = reposicao.reduce((s, l) => s + l.sugestao.caixas, 0)
  const porNivel = (nivel: string) => abertos.filter((a) => a.nivel === nivel).length

  return (
    <Pagina
      titulo="Alertas"
      descricao="Um alerta por item. Sobe de nível se piorar e fecha sozinho quando o saldo volta a OK."
      acoes={
        <>
          {verSugestao && !fechadosAba && abertos.length > 0 && (
            <LinkBotao href="/relatorios/csv?tipo=reposicao" variante="secundario" icone={Download}>
              Exportar sugestão de compra
            </LinkBotao>
          )}
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
        </>
      }
    >
      <AvisoVisto />
      {!fechadosAba &&
        (abertos.length === 0 ? (
          <Vazio>Nenhum alerta aberto. Todos os itens estão acima do ponto de reposição.</Vazio>
        ) : (
          <>
            <div
              className={`grid grid-cols-2 gap-3 sm:gap-4 ${verSugestao ? 'min-[65rem]:grid-cols-3 [&>*:last-child]:max-[65rem]:col-span-2' : ''}`}
            >
              <Resumo titulo="Alertas abertos" valor={abertos.length}>
                {(['ZERADO', 'CRITICO', 'ATENCAO'] as const)
                  .filter((n) => porNivel(n) > 0)
                  .map((n) => (
                    <span key={n} className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className={`size-2 rounded-[2px] ${CORES_STATUS[n].solido}`}
                      />
                      {porNivel(n)}{' '}
                      {{ ZERADO: 'zerado', CRITICO: 'crítico', ATENCAO: 'em atenção' }[n]}
                    </span>
                  ))}
              </Resumo>
              <Resumo titulo="Sem ciente" valor={semCiente}>
                {semCiente === 0
                  ? 'Todos já têm ciente do responsável.'
                  : 'Aguardando o ciente de um Gestor ou Administrador.'}
              </Resumo>
              {verSugestao && (
                <Resumo titulo="Sugestão de compra" valor={formatarNumero(unidades)} unidade="un.">
                  {caixas} {caixas === 1 ? 'caixa fechada' : 'caixas fechadas'}, somando os{' '}
                  {reposicao.length} itens.{' '}
                  <Link href="/relatorios?tipo=reposicao">Abrir como relatório</Link>
                </Resumo>
              )}
            </div>

            <ul aria-label="Alertas abertos" className="flex flex-col gap-3">
              {abertos.map((a) => {
                const s = sugestoes.get(a.item.id)
                const fornecedor = s?.preferencial ?? s?.maisBarato ?? null
                return (
                  <li
                    key={a.id}
                    className={`cartao grid items-center gap-x-6 gap-y-4 px-5 py-4 ${verSugestao ? 'min-[80rem]:grid-cols-[minmax(0,1.35fr)_96px_minmax(0,1.25fr)_auto]' : 'min-[65rem]:grid-cols-[minmax(0,1fr)_96px_auto]'}`}
                  >
                    <Link
                      href={`/itens/${a.item.id}`}
                      className="flex min-w-0 items-center gap-3.5 text-ink no-underline"
                    >
                      <span
                        className={`grid size-11 shrink-0 place-items-center rounded-xl text-ink-2 ${CORES_STATUS[a.nivel]?.suave ?? 'bg-surface-3'}`}
                      >
                        <GlifoDaPastilha iso={a.item.iso} className="size-6" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <span className="truncate font-medium">{nomeDaPastilha(a.item)}</span>
                          <BadgeStatus status={a.nivel} />
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-ink-3">
                          <ChipCodigo>{a.item.codigo}</ChipCodigo>
                          <ChipPosicao>{a.item.posicao?.codigo}</ChipPosicao>
                          <span title={formatarDiaHora(a.abertoEm)}>
                            aberto {tempoAberto(a.abertoEm, agora)}
                          </span>
                        </span>
                      </span>
                    </Link>

                    <p className="whitespace-nowrap">
                      <span className="text-[30px] leading-none font-light tracking-[-0.04em]">
                        {a.item.saldo}
                      </span>{' '}
                      <span className="text-[13px] text-ink-3">/ mín. {a.item.estoqueMinimo}</span>
                    </p>

                    {verSugestao && (
                      <div className="min-w-0 text-[13px]">
                        {s && s.sugestao.quantidade > 0 ? (
                          <>
                            <p className="text-sm">
                              Comprar{' '}
                              <strong className="font-semibold">{s.sugestao.quantidade} un.</strong>{' '}
                              <span className="text-ink-3">
                                ({s.sugestao.caixas} {s.sugestao.caixas === 1 ? 'caixa' : 'caixas'}{' '}
                                de {a.item.embalagem})
                              </span>
                            </p>
                            <p className="mt-0.5 truncate text-ink-3">
                              {fornecedor
                                ? [
                                    fornecedor.nome,
                                    verPrecos && fornecedor.ultimoPreco !== null
                                      ? formatarMoeda(fornecedor.ultimoPreco)
                                      : null,
                                    fornecedor.leadTimeDias !== null
                                      ? `${fornecedor.leadTimeDias} dias`
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(' · ')
                                : 'Sem fornecedor com compra registrada'}
                            </p>
                          </>
                        ) : (
                          <p className="text-ink-3">Sem sugestão de compra.</p>
                        )}
                      </div>
                    )}

                    <div className="nao-imprimir flex flex-wrap items-center justify-end gap-2">
                      {a.cientePor ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap text-ok-ink">
                          <CircleCheck aria-hidden className="size-4 text-ok" />
                          <span className="font-mono">{a.cientePor.login}</span> ·{' '}
                          {formatarDiaHora(a.cienteEm)}
                        </span>
                      ) : (
                        podeCiente && <BotaoCiente alertaId={a.id} pequeno />
                      )}
                      {podeEntrada && (
                        <LinkBotao
                          href={`/movimentacoes/nova?modo=entrada&item=${a.item.id}`}
                          pequeno
                          icone={ArrowDownToLine}
                        >
                          Entrada
                        </LinkBotao>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
            {verSugestao && (
              <p className="text-[13px] text-ink-3">
                Quantidades em unidades, arredondadas para cima em caixas fechadas. O fornecedor
                mostrado é o preferencial do item. O SICEI não calcula valor de estoque em reais.
              </p>
            )}
          </>
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
                    <Link
                      href={`/itens/${a.item.id}`}
                      className="flex items-center gap-3 text-ink no-underline"
                    >
                      <GlifoDaPastilha iso={a.item.iso} className="size-7 text-ink-3" />
                      <span>
                        <span className="block font-medium">{nomeDaPastilha(a.item)}</span>
                        <ChipCodigo>{a.item.codigo}</ChipCodigo>
                      </span>
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

/** Cartão de resumo no topo da lista: número leve, unidade e uma linha de contexto. */
function Resumo({
  titulo,
  valor,
  unidade,
  children,
}: {
  titulo: string
  valor: number | string
  unidade?: string
  children: React.ReactNode
}) {
  return (
    <section className="cartao min-w-0 p-5">
      <h2 className="text-[13px] font-medium">{titulo}</h2>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[36px] leading-none font-light tracking-[-0.04em]">{valor}</span>
        {unidade && <span className="text-[13px] text-ink-3">{unidade}</span>}
      </p>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-2">{children}</p>
    </section>
  )
}
