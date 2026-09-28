import type { Metadata } from 'next'
import Link from 'next/link'
import { FormFiltro } from '@/components/FormFiltro'
import { Paginacao } from '@/components/Paginacao'
import { Pagina, Tabela, Vazio } from '@/components/ui'
import { descreverDispositivo } from '@/lib/dispositivo'
import { formatarDataHora, formatarNumero } from '@/lib/formatar'
import { nomeDaAcao, opcoesDoFiltroDeAcao } from '@/lib/acoesDoLog'
import { hashCurto, resumoDaMudanca } from '@/lib/mudanca'
import { acoesGravadas, listarAuditoria, loginsDoFiltro } from '@/server/consultas/auditoria'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { CartaoConferencia } from './CartaoConferencia'

export const metadata: Metadata = { title: 'Auditoria' }

const campo =
  'h-10 w-full min-w-0 rounded-lg border border-line-2 bg-surface px-3 text-base text-ink placeholder:text-ink-3 sm:text-sm'

/** Cor da ação: falhas em vermelho, movimentações em azul. */
function corDaAcao(acao: string): string {
  if (/FALHOU|BLOQUE|ADULTER|NEGADA/.test(acao)) return 'text-crit-ink'
  if (acao.startsWith('MOVIMENTACAO')) return 'text-accent-ink'
  return 'text-ink'
}

/** RF-21: log de auditoria somente inclusão, com verificação de integridade. */
export default async function Auditoria({
  searchParams,
}: {
  searchParams: Promise<{
    de?: string
    ate?: string
    acao?: string
    usuario?: string
    pagina?: string
  }>
}) {
  await exigirPermissaoDaPagina('auditoria:ver')
  const f = await searchParams
  const pagina = Math.max(1, Number(f.pagina) || 1)
  const [{ linhas, total, paginas }, gravadas, logins] = await Promise.all([
    listarAuditoria(f, pagina),
    acoesGravadas(),
    loginsDoFiltro(),
  ])
  const gruposDeAcao = opcoesDoFiltroDeAcao(gravadas)
  const filtrado = Boolean(f.de || f.ate || f.acao || f.usuario)

  return (
    <Pagina
      titulo="Log de auditoria"
      descricao={`Somente inclusão, encadeado por hash. Nenhum perfil pode alterar ou apagar registros. ${formatarNumero(total)} ${total === 1 ? 'registro' : 'registros'}${filtrado ? ' com estes filtros' : ''}.`}
    >
      <CartaoConferencia />

      <div className="min-w-0 overflow-hidden rounded-[14px] border border-line bg-surface shadow-cartao">
        <FormFiltro
          rotulo="Filtros do log"
          className="flex flex-wrap items-end gap-3 border-b border-line p-4"
        >
          <fieldset className="flex min-w-0 items-center gap-2">
            <legend className="sr-only">Período</legend>
            <label className="sr-only" htmlFor="log-de">
              De
            </label>
            <input
              id="log-de"
              type="date"
              name="de"
              defaultValue={f.de}
              className={`${campo} w-auto`}
            />
            <span className="text-ink-3">–</span>
            <label className="sr-only" htmlFor="log-ate">
              Até
            </label>
            <input
              id="log-ate"
              type="date"
              name="ate"
              defaultValue={f.ate}
              className={`${campo} w-auto`}
            />
          </fieldset>
          <label className="min-w-40 flex-1 basis-56">
            <span className="sr-only">Ação</span>
            <select name="acao" aria-label="Ação" defaultValue={f.acao ?? ''} className={campo}>
              <option value="">Todas as ações</option>
              {gruposDeAcao.map((g) => (
                <optgroup key={g.grupo} label={g.grupo}>
                  {g.acoes.map((a) => (
                    <option key={a.acao} value={a.acao}>
                      {a.rotulo}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="min-w-32 flex-1 basis-40">
            <span className="sr-only">Usuário</span>
            <input
              name="usuario"
              defaultValue={f.usuario}
              placeholder="Login ou nome"
              list="logins-do-log"
              autoComplete="off"
              className={campo}
            />
            <datalist id="logins-do-log">
              {logins.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </label>
          <button type="submit" className="h-10 rounded-lg bg-ink px-4 text-sm font-medium text-bg">
            Filtrar
          </button>
          {filtrado && (
            <Link href="/admin/auditoria" className="h-10 content-center px-2 text-sm text-ink-2">
              Limpar
            </Link>
          )}
        </FormFiltro>

        {linhas.length === 0 ? (
          <div className="p-4">
            <Vazio>Nenhum registro com esses filtros.</Vazio>
          </div>
        ) : (
          <Tabela rotulo="Registros de auditoria" emCartao larguraMinima={1080}>
            <thead>
              <tr>
                <th>#</th>
                <th>Quando</th>
                <th>Ação</th>
                <th>Usuário</th>
                <th>Antes → depois</th>
                <th title="IP público da rede de onde veio o acesso (o mesmo para todos os computadores atrás do mesmo roteador) e o navegador usado">
                  Origem
                </th>
                <th>Hash</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => {
                const m = resumoDaMudanca(l.antes, l.depois)
                return (
                  <tr key={l.seq} className="align-top">
                    <td className="font-mono text-xs text-ink-3">{l.seq}</td>
                    <td className="whitespace-nowrap">{formatarDataHora(l.criadoEm)}</td>
                    <td>
                      <span
                        title={nomeDaAcao(l.acao)}
                        // códigos longos sem espaço (MOVIMENTACAO_CONSUMO_PRODUCAO) podem quebrar:
                        // assim a tabela cabe na tela em vez de rolar de lado
                        className={`block font-mono text-xs font-semibold [overflow-wrap:anywhere] ${corDaAcao(l.acao)}`}
                      >
                        {l.acao}
                      </span>
                      <span className="block text-xs text-ink-3">
                        {l.entidade}
                        {l.entidadeId ? ` ${l.entidadeId.slice(0, 8)}…` : ''}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{l.login}</td>
                    <td className="max-w-sm font-mono text-xs [overflow-wrap:anywhere]">
                      {m.antes || m.depois ? (
                        <>
                          {m.antes ? (
                            <del className="text-crit-ink">{m.antes}</del>
                          ) : (
                            <span className="text-ink-3">—</span>
                          )}{' '}
                          <span className="text-ink-3">→</span>{' '}
                          {m.depois ? (
                            <ins className="text-ok-ink no-underline">{m.depois}</ins>
                          ) : (
                            <span className="text-ink-3">—</span>
                          )}
                        </>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </td>
                    <td className="text-xs text-ink-2">
                      <span className="block font-mono whitespace-nowrap">{l.ip ?? '—'}</span>
                      <span className="block whitespace-nowrap text-ink-3">
                        {descreverDispositivo(l.userAgent)}
                      </span>
                    </td>
                    <td className="font-mono text-xs whitespace-nowrap text-ink-3" title={l.hash}>
                      {hashCurto(l.hash)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Tabela>
        )}
      </div>
      <Paginacao
        pagina={pagina}
        paginas={paginas}
        caminho="/admin/auditoria"
        filtros={{ de: f.de, ate: f.ate, acao: f.acao, usuario: f.usuario }}
      />
    </Pagina>
  )
}
