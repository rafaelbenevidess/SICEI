import type { Metadata } from 'next'
import Link from 'next/link'
import { pode } from '@/domain/permissoes'
import { BadgeStatus, LinkBotao, Pagina, Tabela, Vazio } from '@/components/ui'
import { NOME_APLICACAO } from '@/lib/formatar'
import { listarItens } from '@/server/consultas/estoque'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'

export const metadata: Metadata = { title: 'Itens' }

const FILTROS = [
  { valor: '', rotulo: 'Todos os ativos' },
  { valor: 'ALERTA', rotulo: 'Em alerta' },
  { valor: 'CRITICOS', rotulo: 'Só críticos e zerados' },
  { valor: 'ZERADO', rotulo: 'Zerados' },
  { valor: 'OK', rotulo: 'OK' },
]

export default async function PaginaItens({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; aplicacao?: string; inativos?: string }>
}) {
  const u = await exigirPermissaoDaPagina('saldo:ver')
  const f = await searchParams
  const itens = await listarItens({ ...f, inativos: f.inativos === '1' })
  return (
    <Pagina
      titulo="Itens"
      descricao="Saldo em tempo real de cada pastilha (RF-11)."
      acoes={
        pode(u.perfil, 'cadastros:editar') && <LinkBotao href="/itens/novo">Novo item</LinkBotao>
      }
    >
      <form
        className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_auto_auto_auto_auto]"
        role="search"
      >
        <label className="sr-only" htmlFor="busca">
          Buscar
        </label>
        <input
          id="busca"
          name="q"
          defaultValue={f.q}
          placeholder="Código, descrição, ISO, classe ou posição"
          className="rounded-md border border-slate-300 px-2 py-2 text-base sm:text-sm"
        />
        <label className="sr-only" htmlFor="status">
          Situação
        </label>
        <select
          id="status"
          name="status"
          defaultValue={f.status ?? ''}
          className="rounded-md border border-slate-300 px-2 py-2 text-sm"
        >
          {FILTROS.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="aplicacao">
          Aplicação
        </label>
        <select
          id="aplicacao"
          name="aplicacao"
          defaultValue={f.aplicacao ?? ''}
          className="rounded-md border border-slate-300 px-2 py-2 text-sm"
        >
          <option value="">Todas as aplicações</option>
          {Object.entries(NOME_APLICACAO).map(([v, r]) => (
            <option key={v} value={v}>
              {r}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" name="inativos" value="1" defaultChecked={f.inativos === '1'} />{' '}
          Inativos
        </label>
        <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
          Filtrar
        </button>
      </form>

      {itens.length === 0 ? (
        <Vazio>Nenhum item encontrado.</Vazio>
      ) : (
        <Tabela rotulo="Itens em estoque">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th className="text-right">Saldo</th>
              <th className="hidden text-right sm:table-cell">Mínimo</th>
              <th className="hidden text-right sm:table-cell">Reposição</th>
              <th>Status</th>
              <th className="hidden md:table-cell">Posição</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id} className={i.ativo ? '' : 'opacity-60'}>
                <td className="whitespace-nowrap font-medium">
                  <Link href={`/itens/${i.id}`} className="underline">
                    {i.codigo}
                  </Link>
                </td>
                <td>
                  {i.descricao}
                  {!i.ativo && <span className="ml-1 text-xs text-slate-500">(inativo)</span>}
                </td>
                <td className="text-right font-semibold">{i.saldo}</td>
                <td className="hidden text-right sm:table-cell">{i.estoqueMinimo}</td>
                <td className="hidden text-right sm:table-cell">{i.pontoReposicao}</td>
                <td>
                  <BadgeStatus status={i.status} />
                </td>
                <td className="hidden whitespace-nowrap font-mono text-xs md:table-cell">
                  {i.posicao?.codigo ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </Pagina>
  )
}
