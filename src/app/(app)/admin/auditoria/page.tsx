import type { Metadata } from 'next'
import Link from 'next/link'
import { jsonCanonico } from '@/domain/auditoria'
import { Paginacao } from '@/components/Paginacao'
import { Aviso, Cartao, Pagina, Tabela } from '@/components/ui'
import { formatarDataHora } from '@/lib/formatar'
import { conferirSaldos, verificarIntegridade } from '@/server/audit/verificar'
import { listarAuditoria } from '@/server/consultas/auditoria'
import { registrarConferencia } from '@/server/services/auditoria'
import { exigirPermissaoDaPagina, origemDaRequisicao } from '@/server/web/sessao-atual'

export const metadata: Metadata = { title: 'Auditoria' }

const campo = 'rounded-md border border-slate-300 px-2 py-2 text-sm'

export default async function Auditoria({
  searchParams,
}: {
  searchParams: Promise<{
    de?: string
    ate?: string
    acao?: string
    usuario?: string
    pagina?: string
    verificar?: string
  }>
}) {
  const u = await exigirPermissaoDaPagina('auditoria:ver')
  const f = await searchParams
  const pagina = Math.max(1, Number(f.pagina) || 1)

  let verificacao: Awaited<ReturnType<typeof verificarIntegridade>> | null = null
  let divergencias: Awaited<ReturnType<typeof conferirSaldos>> | null = null
  if (f.verificar === '1') {
    ;[verificacao, divergencias] = await Promise.all([verificarIntegridade(), conferirSaldos()])
    await registrarConferencia(
      { usuarioId: u.id, login: u.login, perfil: u.perfil, ...(await origemDaRequisicao()) },
      {
        cadeiaIntegra: verificacao.cadeia.integra,
        movimentacoesDivergentes: verificacao.movimentacoesDivergentes.length,
        saldosDivergentes: divergencias.length,
      },
    )
  }
  const { linhas, total, paginas } = await listarAuditoria(f, pagina)

  return (
    <Pagina
      titulo="Log de auditoria"
      descricao={`Registro somente inclusão, encadeado por hash (RN-09a). ${total} registro(s).`}
    >
      <Cartao titulo="Verificação de integridade e conferência de saldo (RF-21, RN-09b)">
        <form className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="verificar" value="1" />
          <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
            Verificar agora
          </button>
          <span className="text-sm text-slate-600">
            Recalcula todos os hashes, confere cada movimentação com o log e cada saldo com a soma
            das movimentações.
          </span>
        </form>
        {verificacao && divergencias && (
          <div className="mt-3 flex flex-col gap-2">
            <Aviso tipo={verificacao.cadeia.integra ? 'ok' : 'erro'}>
              {verificacao.cadeia.integra
                ? `Cadeia íntegra: ${verificacao.cadeia.verificados} registros conferidos.`
                : `Adulteração detectada no registro ${verificacao.cadeia.seq}: ${verificacao.cadeia.motivo}`}
            </Aviso>
            <Aviso tipo={verificacao.movimentacoesDivergentes.length === 0 ? 'ok' : 'erro'}>
              {verificacao.movimentacoesDivergentes.length === 0
                ? 'Todas as movimentações batem com o log.'
                : `Movimentações que não batem com o log: ${verificacao.movimentacoesDivergentes.join(', ')}`}
            </Aviso>
            <Aviso tipo={divergencias.length === 0 ? 'ok' : 'erro'}>
              {divergencias.length === 0 ? (
                'Nenhuma divergência de saldo.'
              ) : (
                <ul>
                  {divergencias.map((d) => (
                    <li key={d.itemId}>
                      {d.codigo}: saldo guardado {d.saldoGuardado}, pelas movimentações{' '}
                      {d.saldoPelasMovimentacoes}
                    </li>
                  ))}
                </ul>
              )}
            </Aviso>
          </div>
        )}
      </Cartao>

      <form
        className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-5"
        role="search"
      >
        <label className="flex flex-col text-xs font-medium">
          De
          <input type="date" name="de" defaultValue={f.de} className={campo} />
        </label>
        <label className="flex flex-col text-xs font-medium">
          Até
          <input type="date" name="ate" defaultValue={f.ate} className={campo} />
        </label>
        <label className="flex flex-col text-xs font-medium">
          Ação
          <input
            name="acao"
            defaultValue={f.acao}
            placeholder="ESTORNO, LOGIN…"
            className={campo}
          />
        </label>
        <label className="flex flex-col text-xs font-medium">
          Usuário
          <input name="usuario" defaultValue={f.usuario} className={campo} />
        </label>
        <div className="flex items-end gap-2">
          <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
            Filtrar
          </button>
          <Link
            href="/admin/auditoria"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            Limpar
          </Link>
        </div>
      </form>

      <Tabela rotulo="Registros de auditoria">
        <thead>
          <tr>
            <th>#</th>
            <th>Data</th>
            <th>Ação</th>
            <th>Usuário</th>
            <th className="hidden lg:table-cell">Antes → depois</th>
            <th className="hidden md:table-cell">Origem</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.seq} className="align-top">
              <td className="font-mono text-xs">{l.seq}</td>
              <td className="whitespace-nowrap">{formatarDataHora(l.criadoEm)}</td>
              <td className="font-mono text-xs">
                {l.acao}
                <span className="block text-slate-500">
                  {l.entidade}
                  {l.entidadeId ? ` ${l.entidadeId.slice(0, 8)}…` : ''}
                </span>
              </td>
              <td>{l.login}</td>
              <td className="hidden max-w-md lg:table-cell">
                <code className="block break-all text-[11px] text-slate-600">
                  {l.antes ? jsonCanonico(l.antes).slice(0, 200) : '—'} →{' '}
                  {l.depois ? jsonCanonico(l.depois).slice(0, 200) : '—'}
                </code>
              </td>
              <td className="hidden text-xs md:table-cell">{l.ip ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </Tabela>
      <Paginacao
        pagina={pagina}
        paginas={paginas}
        caminho="/admin/auditoria"
        filtros={{ de: f.de, ate: f.ate, acao: f.acao, usuario: f.usuario }}
      />
    </Pagina>
  )
}
