import type { Metadata } from 'next'
import Link from 'next/link'
import { Paginacao } from '@/components/Paginacao'
import { Pagina, Tabela, Vazio } from '@/components/ui'
import { TIPOS_MOVIMENTACAO } from '@/domain/tipos'
import { formatarDataHora, NOME_TIPO } from '@/lib/formatar'
import {
  listarMovimentacoes,
  opcoesDeFiltro,
  type FiltroMovimentacoes,
} from '@/server/consultas/movimentacoes'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'

export const metadata: Metadata = { title: 'Movimentações' }

const campo = 'rounded-md border border-slate-300 px-2 py-2 text-base sm:text-sm'

export default async function PaginaMovimentacoes({
  searchParams,
}: {
  searchParams: Promise<FiltroMovimentacoes & { pagina?: string }>
}) {
  await exigirPermissaoDaPagina('historico:ver')
  const f = await searchParams
  const pagina = Math.max(1, Number(f.pagina) || 1)
  const [{ linhas, total, paginas }, opcoes] = await Promise.all([
    listarMovimentacoes(f, pagina),
    opcoesDeFiltro(),
  ])
  return (
    <Pagina
      titulo="Movimentações"
      descricao={`Histórico completo e inalterável (RF-15). ${total} registro(s).`}
    >
      <form
        className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-4"
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
          Item (código)
          <input name="item" defaultValue={f.item} className={campo} />
        </label>
        <label className="flex flex-col text-xs font-medium">
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
        <label className="flex flex-col text-xs font-medium">
          Usuário (login)
          <input name="usuario" defaultValue={f.usuario} className={campo} />
        </label>
        <label className="flex flex-col text-xs font-medium">
          Destino
          <select name="destino" defaultValue={f.destino ?? ''} className={campo}>
            <option value="">Todos</option>
            {opcoes.destinos.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-medium">
          Colaborador
          <select name="colaborador" defaultValue={f.colaborador ?? ''} className={campo}>
            <option value="">Todos</option>
            {opcoes.colaboradores.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-medium">
          Ordem de produção
          <input name="op" defaultValue={f.op} className={campo} />
        </label>
        <div className="flex gap-2 sm:col-span-4">
          <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
            Filtrar
          </button>
          <Link
            href="/movimentacoes"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            Limpar
          </Link>
        </div>
      </form>

      {linhas.length === 0 ? (
        <Vazio>Nenhuma movimentação encontrada.</Vazio>
      ) : (
        <Tabela rotulo="Histórico de movimentações">
          <thead>
            <tr>
              <th>Data</th>
              <th>Item</th>
              <th>Tipo</th>
              <th className="text-right">Qtd.</th>
              <th className="text-right">Saldo</th>
              <th className="hidden md:table-cell">Destino · OP · colaborador</th>
              <th className="hidden sm:table-cell">Usuário</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((m) => (
              <tr key={m.id} className={m.estornadaPor ? 'text-slate-400' : ''}>
                <td className="whitespace-nowrap">
                  <Link href={`/movimentacoes/${m.id}`} className="underline">
                    {formatarDataHora(m.criadoEm)}
                  </Link>
                </td>
                <td className="whitespace-nowrap">
                  <Link href={`/itens/${m.item.id}`} className="underline">
                    {m.item.codigo}
                  </Link>
                </td>
                <td>
                  {NOME_TIPO[m.tipo]}
                  {m.estornadaPor && ' (estornada)'}
                </td>
                <td className="text-right">{m.quantidade}</td>
                <td className="whitespace-nowrap text-right">
                  {m.saldoAnterior} → {m.saldoPosterior}
                </td>
                <td className="hidden md:table-cell">
                  {[
                    m.destino?.nome,
                    m.ordemProducao,
                    m.colaborador?.nome,
                    m.fornecedor && (m.fornecedor.nomeFantasia ?? m.fornecedor.razaoSocial),
                  ]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </td>
                <td className="hidden sm:table-cell">{m.usuario.login}</td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
      <Paginacao
        pagina={pagina}
        paginas={paginas}
        caminho="/movimentacoes"
        filtros={{ ...f, pagina: undefined }}
      />
    </Pagina>
  )
}
