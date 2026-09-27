import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftRight, CircleCheck, Download, FileChartColumn, ShoppingCart } from 'lucide-react'
import { BotaoImprimir } from '@/components/BotaoImprimir'
import {
  Abas,
  BadgeStatus,
  Cartao,
  ChipCodigo,
  LinkBotao,
  Pagina,
  Segmentado,
  Tabela,
  Vazio,
} from '@/components/ui'
import { pode } from '@/domain/permissoes'
import {
  formatarData,
  formatarMoeda,
  formatarNumero,
  hojeIso,
  nomeDaPastilha,
} from '@/lib/formatar'
import { normalizarParametros, type ParametrosRelatorio } from '@/server/consultas/dadosRelatorio'
import {
  relatorioConsumo,
  relatorioMovimentacao,
  relatorioReposicao,
} from '@/server/consultas/relatorios'
import { lerParametros } from '@/server/parametros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'

export const metadata: Metadata = { title: 'Relatórios' }

const campo = 'h-10 rounded-lg border border-line-2 bg-surface px-3 text-base text-ink sm:text-sm'
const NOTA = 'Quantidades em unidades. O SICEI não calcula valor de estoque em reais.'

/** RF-17 a RF-20: consumo, movimentação e sugestão de compra, com CSV e impressão. */
export default async function PaginaRelatorios({
  searchParams,
}: {
  searchParams: Promise<ParametrosRelatorio>
}) {
  const u = await exigirPermissaoDaPagina('relatorios:ver')
  const n = normalizarParametros(await searchParams)
  const verPrecos = pode(u.perfil, 'precos:ver')
  const csv = `/relatorios/csv?${new URLSearchParams({ tipo: n.tipo, de: n.deIso, ate: n.ateIso, agrupar: n.agrupar })}`

  if (n.tipo === 'reposicao') {
    const [linhas, parametros] = await Promise.all([relatorioReposicao(), lerParametros()])
    const unidades = linhas.reduce((s, l) => s + l.sugestao.quantidade, 0)
    const caixas = linhas.reduce((s, l) => s + l.sugestao.caixas, 0)
    return (
      <Pagina
        titulo="Sugestão de compra"
        descricao="Itens ativos em atenção, críticos ou zerados. O SICEI não emite pedidos: a decisão de comprar é do Gestor."
        acoes={
          <>
            <BotaoImprimir rotulo="Imprimir" />
            <LinkBotao href={csv} icone={Download}>
              Exportar CSV
            </LinkBotao>
          </>
        }
      >
        <div className="grid gap-6 min-[65rem]:grid-cols-3">
          <Cartao>
            <p className="text-[13px] text-ink-2">Itens a repor</p>
            <p className="mt-2 text-[40px] leading-none font-semibold tracking-[-0.03em]">
              {linhas.length}
            </p>
          </Cartao>
          <Cartao>
            <p className="text-[13px] text-ink-2">Unidades sugeridas</p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-[40px] leading-none font-semibold tracking-[-0.03em]">
                {formatarNumero(unidades)}
              </span>
              <span className="text-ink-3">{caixas} caixas</span>
            </p>
          </Cartao>
          <Cartao>
            <p className="text-[13px] text-ink-2">Parâmetros</p>
            <p className="mt-2 text-ink-2">
              Consumo médio dos últimos{' '}
              <strong className="text-ink">{parametros.janelaConsumoDias} dias</strong>. Sem máximo:
              alvo = reposição + 30 dias de consumo.
            </p>
          </Cartao>
        </div>
        {linhas.length === 0 ? (
          <Vazio>Nenhum item precisa de compra agora.</Vazio>
        ) : (
          <Tabela rotulo="Sugestão de compra" larguraMinima={980}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Status</th>
                <th className="text-right">Saldo / reposição</th>
                <th className="text-right">Consumo / dia</th>
                <th className="text-right">Sugestão</th>
                <th>Preferencial</th>
                <th>Menor último preço</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.item.id}>
                  <td>
                    <Link href={`/itens/${l.item.id}`} className="text-ink no-underline">
                      <span className="block font-medium">{nomeDaPastilha(l.item)}</span>
                      <ChipCodigo>{l.item.codigo}</ChipCodigo>
                    </Link>
                  </td>
                  <td>
                    <BadgeStatus status={l.item.status} />
                  </td>
                  <td className="text-right whitespace-nowrap text-ink-2">
                    <strong className="text-ink">{l.item.saldo}</strong> / {l.item.pontoReposicao}
                  </td>
                  <td className="text-right">
                    {formatarNumero(Math.round(l.consumoDiario * 10) / 10)}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <span className="block text-lg font-semibold">{l.sugestao.quantidade} un.</span>
                    <span className="text-[13px] text-ink-3">
                      {l.sugestao.caixas} {l.sugestao.caixas === 1 ? 'caixa' : 'caixas'} de{' '}
                      {l.item.embalagem}
                    </span>
                  </td>
                  <td>
                    {l.preferencial ? (
                      <>
                        <span className="block">{l.preferencial.nome}</span>
                        <span className="text-[13px] text-ink-3">
                          {[
                            verPrecos && l.preferencial.ultimoPreco !== null
                              ? formatarMoeda(l.preferencial.ultimoPreco)
                              : null,
                            l.preferencial.leadTimeDias !== null
                              ? `${l.preferencial.leadTimeDias} dias`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </td>
                  <td>
                    {l.maisBarato ? (
                      <>
                        <span className="block">{l.maisBarato.nome}</span>
                        <span className="text-[13px]">
                          {verPrecos && l.maisBarato.ultimoPreco !== null && (
                            <span className="text-ok-ink">
                              {formatarMoeda(l.maisBarato.ultimoPreco)}
                            </span>
                          )}
                          {l.maisBarato.leadTimeDias !== null && (
                            <span className="text-ink-3">
                              {verPrecos ? ' · ' : ''}
                              {l.maisBarato.leadTimeDias} dias
                            </span>
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="text-ink-3">sem compras</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
        <p className="text-[13px] text-ink-3">
          Quantidades em unidades, arredondadas para cima em caixas fechadas. O SICEI não calcula
          valor de estoque em reais.
        </p>
      </Pagina>
    )
  }

  const periodo = `de ${formatarData(n.de)} até ${formatarData(n.ate)}`
  const abas = (
    <Abas
      rotulo="Tipo de relatório"
      opcoes={[
        {
          href: `/relatorios?tipo=consumo&de=${n.deIso}&ate=${n.ateIso}`,
          rotulo: (
            <>
              <FileChartColumn aria-hidden className="size-4" /> Consumo
            </>
          ),
          ativo: n.tipo === 'consumo',
        },
        {
          href: `/relatorios?tipo=movimentacao&de=${n.deIso}&ate=${n.ateIso}`,
          rotulo: (
            <>
              <ArrowLeftRight aria-hidden className="size-4" /> Movimentação
            </>
          ),
          ativo: n.tipo === 'movimentacao',
        },
        {
          href: '/relatorios?tipo=reposicao',
          rotulo: (
            <>
              <ShoppingCart aria-hidden className="size-4" /> Reposição
            </>
          ),
          ativo: false,
        },
      ]}
    />
  )
  const filtros = (
    <form className="nao-imprimir flex flex-wrap items-end gap-3">
      <input type="hidden" name="tipo" value={n.tipo} />
      {n.tipo === 'consumo' && <input type="hidden" name="agrupar" value={n.agrupar} />}
      <label className="flex flex-col gap-1.5 text-[13px] font-medium">
        De
        <input type="date" name="de" defaultValue={n.deIso} className={campo} />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-medium">
        Até
        <input type="date" name="ate" defaultValue={n.ateIso} className={campo} />
      </label>
      {n.tipo === 'consumo' && (
        <div className="flex flex-col gap-1.5 text-[13px] font-medium">
          <span>Agrupar por</span>
          <Segmentado
            rotulo="Agrupar por"
            opcoes={(['item', 'destino', 'colaborador'] as const).map((a) => ({
              href: `/relatorios?tipo=consumo&de=${n.deIso}&ate=${n.ateIso}&agrupar=${a}`,
              rotulo: { item: 'Item', destino: 'Destino', colaborador: 'Colaborador' }[a],
              ativo: n.agrupar === a,
            }))}
          />
        </div>
      )}
      <button type="submit" className="h-10 rounded-lg bg-ink px-5 text-sm font-medium text-bg">
        Gerar
      </button>
    </form>
  )
  const acoes = (
    <>
      <BotaoImprimir />
      <LinkBotao href={csv} icone={Download}>
        Exportar CSV
      </LinkBotao>
    </>
  )

  if (n.tipo === 'movimentacao') {
    const linhas = await relatorioMovimentacao(n.de, n.ate)
    // a conferência com o saldo atual só faz sentido se o período vai até hoje
    const incluiHoje = n.ateIso >= hojeIso()
    return (
      <Pagina
        titulo="Relatórios"
        descricao={`Saldo inicial, entradas, saídas e saldo final de cada item, ${periodo}.`}
        acoes={acoes}
      >
        {abas}
        {filtros}
        {linhas.length === 0 ? (
          <Vazio>Nada a mostrar neste período.</Vazio>
        ) : (
          <Tabela rotulo="Relatório de movimentação" larguraMinima={760}>
            <thead>
              <tr>
                <th>Item</th>
                <th className="text-right">Saldo inicial</th>
                <th className="text-right">Entradas</th>
                <th className="text-right">Saídas</th>
                <th className="text-right">Saldo final</th>
                <th>Conferência</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id}>
                  <td>
                    <span className="block font-medium">{l.descricao}</span>
                    <ChipCodigo>{l.codigo}</ChipCodigo>
                  </td>
                  <td className="text-right">{l.inicial}</td>
                  <td className="text-right font-semibold text-ok-ink">
                    {l.entradas > 0 ? `+${l.entradas}` : 0}
                  </td>
                  <td className="text-right font-semibold">{l.saidas > 0 ? `−${l.saidas}` : 0}</td>
                  <td className="text-right text-base font-semibold">{l.final}</td>
                  <td className="text-[13px]">
                    {!incluiHoje ? (
                      <span className="text-ink-3">—</span>
                    ) : l.final === l.saldoAtual ? (
                      <span className="inline-flex items-center gap-1.5 text-ok-ink">
                        <CircleCheck aria-hidden className="size-4" />
                        Confere com o saldo atual
                      </span>
                    ) : (
                      <span className="text-crit-ink">Diverge do saldo atual ({l.saldoAtual})</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
        <p className="text-[13px] text-ink-3">{NOTA}</p>
      </Pagina>
    )
  }

  const linhas = await relatorioConsumo(n.de, n.ate, n.agrupar)
  const total = linhas.reduce((s, l) => s + l.total, 0)
  const nomeColuna = { item: 'Item', destino: 'Destino', colaborador: 'Colaborador' }[n.agrupar]
  const dias = Math.max(1, Math.ceil((n.ate.getTime() - n.de.getTime()) / 86_400_000))
  return (
    <Pagina
      titulo="Relatórios"
      descricao={`Consumo da produção por item, destino ou colaborador, ${periodo}.`}
      acoes={acoes}
    >
      {abas}
      {filtros}
      {linhas.length === 0 ? (
        <Vazio>Nenhum consumo neste período.</Vazio>
      ) : (
        <div className="min-w-0 overflow-hidden rounded-[14px] border border-line bg-surface shadow-cartao">
          <Tabela rotulo="Relatório de consumo" emCartao larguraMinima={720}>
            <thead>
              <tr>
                <th>{nomeColuna}</th>
                <th className="w-[40%]">Participação</th>
                <th className="text-right">Consumido</th>
                <th className="text-right">Média diária</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => {
                const pct = total > 0 ? (l.total / total) * 100 : 0
                return (
                  <tr key={l.chave}>
                    <td>
                      <span className="block font-medium">{l.chave}</span>
                      <span className="text-[13px] text-ink-3">{l.nome}</span>
                    </td>
                    <td>
                      <span className="flex items-center gap-3">
                        <span className="h-2 flex-1 rounded-full bg-surface-3">
                          <span
                            className="block h-full rounded-full bg-accent"
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <span className="w-12 text-right text-[13px] text-ink-2">
                          {formatarNumero(Math.round(pct * 10) / 10)}%
                        </span>
                      </span>
                    </td>
                    <td className="text-right font-semibold whitespace-nowrap">{l.total} un.</td>
                    <td className="text-right whitespace-nowrap text-ink-2">
                      {formatarNumero(Math.round(l.mediaDiaria * 10) / 10)} / dia
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Tabela>
          <div className="flex flex-wrap justify-between gap-3 border-t border-line px-6 py-3.5 text-[13px] text-ink-2">
            <span>
              Saídas do tipo consumo da produção, sem estornos. {dias} {dias === 1 ? 'dia' : 'dias'}{' '}
              no período.
            </span>
            <strong className="text-ink">Total: {formatarNumero(total)} un.</strong>
          </div>
        </div>
      )}
      <p className="text-[13px] text-ink-3">{NOTA}</p>
    </Pagina>
  )
}
