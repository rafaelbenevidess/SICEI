import type { Metadata } from 'next'
import Link from 'next/link'
import { BotaoImprimir } from '@/components/BotaoImprimir'
import { Pagina, Tabela, Vazio } from '@/components/ui'
import { pode } from '@/domain/permissoes'
import { formatarData } from '@/lib/formatar'
import { montarRelatorio, type ParametrosRelatorio } from '@/server/consultas/dadosRelatorio'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'

export const metadata: Metadata = { title: 'Relatórios' }

const ABAS = [
  { tipo: 'consumo', rotulo: 'Consumo (RF-17)' },
  { tipo: 'movimentacao', rotulo: 'Movimentação (RF-18)' },
  { tipo: 'reposicao', rotulo: 'Reposição (RF-19)' },
]

export default async function PaginaRelatorios({
  searchParams,
}: {
  searchParams: Promise<ParametrosRelatorio>
}) {
  const u = await exigirPermissaoDaPagina('relatorios:ver')
  const p = await searchParams
  const r = await montarRelatorio(p, pode(u.perfil, 'precos:ver'))
  const query = new URLSearchParams({
    tipo: r.tipo,
    de: r.deIso,
    ate: r.ateIso,
    agrupar: r.agrupar,
  })
  return (
    <Pagina
      titulo={r.titulo}
      descricao={
        r.tipo === 'reposicao'
          ? 'Itens ativos em atenção, críticos ou zerados (RN-20).'
          : `De ${formatarData(r.de)} até ${formatarData(r.ate)}.`
      }
      acoes={
        <>
          <a
            href={`/relatorios/csv?${query}`}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            Exportar CSV
          </a>
          <BotaoImprimir />
        </>
      }
    >
      <nav aria-label="Tipo de relatório" className="nao-imprimir flex flex-wrap gap-2">
        {ABAS.map((a) => (
          <Link
            key={a.tipo}
            href={`/relatorios?tipo=${a.tipo}&de=${r.deIso}&ate=${r.ateIso}`}
            aria-current={r.tipo === a.tipo ? 'page' : undefined}
            className={`rounded-md border px-3 py-1.5 text-sm ${r.tipo === a.tipo ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white'}`}
          >
            {a.rotulo}
          </Link>
        ))}
      </nav>
      {r.tipo !== 'reposicao' && (
        <form className="nao-imprimir flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
          <input type="hidden" name="tipo" value={r.tipo} />
          <label className="flex flex-col text-xs font-medium">
            De
            <input
              type="date"
              name="de"
              defaultValue={r.deIso}
              className="rounded-md border border-slate-300 px-2 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs font-medium">
            Até
            <input
              type="date"
              name="ate"
              defaultValue={r.ateIso}
              className="rounded-md border border-slate-300 px-2 py-2 text-sm"
            />
          </label>
          {r.tipo === 'consumo' && (
            <label className="flex flex-col text-xs font-medium">
              Agrupar por
              <select
                name="agrupar"
                defaultValue={r.agrupar}
                className="rounded-md border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="item">Item</option>
                <option value="destino">Destino</option>
                <option value="colaborador">Colaborador</option>
              </select>
            </label>
          )}
          <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
            Gerar
          </button>
        </form>
      )}
      {r.linhas.length === 0 ? (
        <Vazio>Nada a mostrar neste período.</Vazio>
      ) : (
        <Tabela rotulo={r.titulo}>
          <thead>
            <tr>
              {r.cabecalho.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.linhas.map((l, i) => (
              <tr key={i}>
                {l.map((v, j) => (
                  <td key={j} className={typeof v === 'number' ? 'text-right' : ''}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
      <p className="text-xs text-slate-500">
        Quantidades em unidades. O SIMI não calcula valor de estoque em reais.
      </p>
    </Pagina>
  )
}
