import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDownToLine, ArrowUpFromLine, Download } from 'lucide-react'
import { TIPOS_MOVIMENTACAO } from '@/domain/tipos'
import { pode } from '@/domain/permissoes'
import { Gaveta } from '@/components/Gaveta'
import { QtdMovimentacao, TipoMovimentacao } from '@/components/movimentacao'
import { Paginacao } from '@/components/Paginacao'
import { ChipCodigo, LinkBotao, Pagina, Selo, Tabela, Vazio } from '@/components/ui'
import { contextoDaMovimentacao } from '@/lib/contexto'
import { formatarDiaHora, formatarNumero, NOME_TIPO } from '@/lib/formatar'
import { urlCom } from '@/lib/url'
import {
  detalheMovimentacao,
  listarMovimentacoes,
  opcoesDeFiltro,
  type FiltroMovimentacoes,
} from '@/server/consultas/movimentacoes'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { PainelMovimentacao } from './PainelMovimentacao'

export const metadata: Metadata = { title: 'Movimentações' }

const campo =
  'h-10 w-full min-w-0 rounded-lg border border-line-2 bg-surface px-3 text-base text-ink placeholder:text-ink-3 sm:text-sm'
const rotulo = 'flex min-w-0 flex-col gap-1.5 text-[13px] font-medium'

type Filtros = FiltroMovimentacoes & { pagina?: string; sel?: string }

/** RF-15: histórico completo e inalterável, com filtros e o detalhe ao lado. */
export default async function PaginaMovimentacoes({
  searchParams,
}: {
  searchParams: Promise<Filtros>
}) {
  const u = await exigirPermissaoDaPagina('historico:ver')
  const f = await searchParams
  const pagina = Math.max(1, Number(f.pagina) || 1)
  const verPrecos = pode(u.perfil, 'precos:ver')
  const [{ linhas, total, paginas }, opcoes] = await Promise.all([
    listarMovimentacoes(f, pagina),
    opcoesDeFiltro(),
  ])
  // o detalhe abre numa gaveta por cima da lista, só quando a pessoa escolhe uma linha
  const sel = f.sel ? await detalheMovimentacao(f.sel) : null
  const filtros: Filtros = { ...f }
  delete filtros.sel
  delete filtros.pagina

  return (
    <Pagina
      titulo="Movimentações"
      descricao={`Histórico completo e inalterável. ${formatarNumero(total)} ${total === 1 ? 'registro' : 'registros'}${Object.values(filtros).some(Boolean) ? ' com estes filtros' : ''}.`}
      acoes={
        <>
          <LinkBotao
            href={urlCom('/movimentacoes/csv', filtros, {})}
            variante="secundario"
            icone={Download}
          >
            Exportar CSV
          </LinkBotao>
          {pode(u.perfil, 'movimentacao:entrada') && (
            <LinkBotao
              href="/movimentacoes/nova?modo=entrada"
              variante="secundario"
              icone={ArrowDownToLine}
            >
              Entrada
            </LinkBotao>
          )}
          {pode(u.perfil, 'movimentacao:saida') && (
            <LinkBotao href="/movimentacoes/nova?modo=saida" icone={ArrowUpFromLine}>
              Registrar saída
            </LinkBotao>
          )}
        </>
      }
    >
      <form
        role="search"
        className="grid items-end gap-4 cartao p-4 sm:grid-cols-2 min-[75rem]:grid-cols-[1.3fr_1fr_1fr_1.2fr_auto]"
      >
        <fieldset className={rotulo}>
          <legend className="mb-1.5">Período</legend>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="de">
              De
            </label>
            <input id="de" type="date" name="de" defaultValue={f.de} className={campo} />
            <span className="text-ink-3">–</span>
            <label className="sr-only" htmlFor="ate">
              Até
            </label>
            <input id="ate" type="date" name="ate" defaultValue={f.ate} className={campo} />
          </div>
        </fieldset>
        <label className={rotulo}>
          Tipo
          <select name="tipo" defaultValue={f.tipo ?? ''} className={campo}>
            <option value="">Todos</option>
            {TIPOS_MOVIMENTACAO.map((t) => (
              <option key={t} value={t}>
                {NOME_TIPO[t]}
              </option>
            ))}
          </select>
        </label>
        <label className={rotulo}>
          Destino
          <select name="destino" defaultValue={f.destino ?? ''} className={campo}>
            <option value="">Todos</option>
            {opcoes.destinos.map((d) => (
              <option key={d.valor} value={d.valor}>
                {d.rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className={rotulo}>
          Item, OP ou colaborador
          <input
            name="busca"
            type="search"
            defaultValue={f.busca ?? f.op ?? f.item}
            placeholder="PST-001, 2026-0457…"
            className={campo}
          />
        </label>
        <button type="submit" className="h-10 rounded-lg bg-ink px-5 text-sm font-medium text-bg">
          Filtrar
        </button>
      </form>

      {linhas.length === 0 ? (
        <Vazio>Nenhuma movimentação com esses filtros.</Vazio>
      ) : (
        <>
          <div className="flex min-w-0 flex-col gap-4">
            <Tabela rotulo="Movimentações" larguraMinima={700}>
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Item</th>
                  <th>Tipo</th>
                  <th className="text-right">Qtd.</th>
                  <th className="text-right">Saldo</th>
                  <th>Destino · OP · colaborador</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((m) => {
                  const delta = m.saldoPosterior - m.saldoAnterior
                  const ativa = m.id === sel?.id
                  return (
                    <tr
                      key={m.id}
                      className={`relative ${ativa ? 'bg-accent-soft hover:!bg-accent-soft' : ''} ${m.estornadaPor ? 'text-ink-3' : ''}`}
                    >
                      <td className="whitespace-nowrap">
                        <Link
                          href={urlCom('/movimentacoes', f, { sel: m.id })}
                          scroll={false}
                          aria-current={ativa ? 'true' : undefined}
                          className="text-inherit no-underline after:absolute after:inset-0 after:content-['']"
                        >
                          {formatarDiaHora(m.criadoEm)}
                        </Link>
                      </td>
                      <td>
                        <ChipCodigo>{m.item.codigo}</ChipCodigo>
                      </td>
                      <td>
                        <span className="flex flex-col items-start gap-1">
                          <TipoMovimentacao tipo={m.tipo} delta={delta} />
                          {m.estornadaPor && <Selo>estornada</Selo>}
                        </span>
                      </td>
                      <td className="text-right">
                        <QtdMovimentacao delta={delta} />
                      </td>
                      <td className="text-right whitespace-nowrap text-ink-2">
                        {m.saldoAnterior} → {m.saldoPosterior}
                      </td>
                      <td className="min-w-[180px] text-[13px] text-ink-2">
                        {contextoDaMovimentacao(m, verPrecos)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Tabela>
            <Paginacao
              pagina={pagina}
              paginas={paginas}
              caminho="/movimentacoes"
              filtros={filtros}
            />
          </div>
          {sel && (
            <Gaveta
              titulo="Movimentação"
              descricao="O registro não muda depois de gravado. Um erro se corrige com estorno."
              voltarPara={urlCom('/movimentacoes', filtros, {
                pagina: pagina > 1 ? String(pagina) : undefined,
              })}
            >
              <div className="cartao p-6">
                <PainelMovimentacao m={sel} perfil={u.perfil} />
              </div>
            </Gaveta>
          )}
        </>
      )}
    </Pagina>
  )
}
