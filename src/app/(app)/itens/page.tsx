import type { Metadata } from 'next'
import Link from 'next/link'
import { Download, Plus, Search } from 'lucide-react'
import { pode } from '@/domain/permissoes'
import { FormFiltro } from '@/components/FormFiltro'
import {
  BadgeStatus,
  ChipCodigo,
  ChipPosicao,
  Gauge,
  LinkBotao,
  Pagina,
  Segmentado,
  Tabela,
  Vazio,
} from '@/components/ui'
import { GlifoDaPastilha } from '@/components/Pastilha'
import { NOME_APLICACAO, nomeDaPastilha } from '@/lib/formatar'
import { urlCom } from '@/lib/url'
import { contarItensPorStatus, listarItens } from '@/server/consultas/estoque'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'

export const metadata: Metadata = { title: 'Itens' }

type Filtros = { q?: string; status?: string; aplicacao?: string; inativos?: string }

export default async function PaginaItens({ searchParams }: { searchParams: Promise<Filtros> }) {
  const u = await exigirPermissaoDaPagina('saldo:ver')
  const f = await searchParams
  const [itens, contagem] = await Promise.all([
    listarItens({ ...f, inativos: f.inativos === '1' }),
    contarItensPorStatus(),
  ])
  const n = (s: string) => contagem[s] ?? 0
  const total = n('OK') + n('ATENCAO') + n('CRITICO') + n('ZERADO')
  const status = f.status ?? ''
  const segmentos = [
    { valor: '', rotulo: 'Todos', contagem: total },
    { valor: 'ALERTA', rotulo: 'Em alerta', contagem: total - n('OK') },
    { valor: 'CRITICOS', rotulo: 'Críticos e zerados', contagem: n('CRITICO') + n('ZERADO') },
    { valor: 'OK', rotulo: 'OK', contagem: n('OK') },
  ]
  if (['ZERADO', 'CRITICO', 'ATENCAO'].includes(status)) {
    segmentos.push({ valor: status, rotulo: `Só ${status.toLowerCase()}`, contagem: n(status) })
  }

  return (
    <Pagina
      titulo="Itens"
      descricao="Saldo em tempo real de cada pastilha, com status e posição no almoxarifado."
      acoes={
        <>
          <LinkBotao href={urlCom('/itens/csv', f, {})} variante="secundario" icone={Download}>
            Exportar CSV
          </LinkBotao>
          {pode(u.perfil, 'cadastros:editar') && (
            <LinkBotao href="/itens/novo" icone={Plus}>
              Novo item
            </LinkBotao>
          )}
        </>
      }
    >
      <FormFiltro className="flex flex-col gap-3">
        {f.status && <input type="hidden" name="status" value={f.status} />}
        <div className="relative max-w-[420px]">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3"
          />
          <label className="sr-only" htmlFor="busca">
            Buscar
          </label>
          <input
            id="busca"
            name="q"
            type="search"
            defaultValue={f.q}
            placeholder="Código, ISO, classe ou posição"
            className="h-10 w-full rounded-lg border border-line-2 bg-surface pr-3 pl-9 text-base text-ink placeholder:text-ink-3 sm:text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmentado
            rotulo="Filtrar por status"
            opcoes={segmentos.map((o) => ({
              href: urlCom('/itens', f, { status: o.valor }),
              rotulo: o.rotulo,
              contagem: o.contagem,
              ativo: status === o.valor,
            }))}
          />
          <label className="sr-only" htmlFor="aplicacao">
            Aplicação
          </label>
          <select
            id="aplicacao"
            name="aplicacao"
            defaultValue={f.aplicacao ?? ''}
            className="h-10 rounded-lg border border-line-2 bg-surface px-3 text-sm text-ink"
          >
            <option value="">Todas as aplicações</option>
            {Object.entries(NOME_APLICACAO).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input
              type="checkbox"
              name="inativos"
              value="1"
              defaultChecked={f.inativos === '1'}
              className="size-4 accent-[var(--accent)]"
            />
            Mostrar inativos
          </label>
        </div>
      </FormFiltro>

      {itens.length === 0 ? (
        <Vazio>Nenhum item encontrado com esses filtros.</Vazio>
      ) : (
        <div className="cartao min-w-0 overflow-hidden">
          <Tabela rotulo="Itens em estoque" emCartao larguraMinima={860}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Pastilha</th>
                <th>Saldo</th>
                <th className="text-right">Mínimo</th>
                <th className="text-right">Reposição</th>
                <th>Status</th>
                <th>Posição</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.id} className={`relative ${i.ativo ? '' : 'opacity-60'}`}>
                  <td className="whitespace-nowrap">
                    <Link
                      href={`/itens/${i.id}`}
                      className="no-underline after:absolute after:inset-0 after:content-['']"
                    >
                      <ChipCodigo>{i.codigo}</ChipCodigo>
                    </Link>
                  </td>
                  <td className="min-w-[230px]">
                    <span className="flex items-center gap-3">
                      <GlifoDaPastilha iso={i.iso} className="size-7 text-ink-3" />
                      <span className="min-w-0">
                        <span className="block font-medium">
                          {nomeDaPastilha(i)}
                          {!i.ativo && <span className="ml-2 text-xs text-ink-3">(inativo)</span>}
                        </span>
                        <span className="block text-[13px] text-ink-3">
                          {i.fabricante.nome} · {NOME_APLICACAO[i.aplicacao]}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className="flex items-center gap-3">
                      <span className="w-9 text-right text-base font-semibold">{i.saldo}</span>
                      <Gauge
                        saldo={i.saldo}
                        minimo={i.estoqueMinimo}
                        pontoReposicao={i.pontoReposicao}
                        alvo={i.alvo}
                        status={i.status}
                      />
                    </span>
                  </td>
                  <td className="text-right">{i.estoqueMinimo}</td>
                  <td className="text-right">{i.pontoReposicao}</td>
                  <td>
                    <BadgeStatus status={i.status} />
                  </td>
                  <td>
                    <ChipPosicao>{i.posicao?.codigo}</ChipPosicao>
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-3.5 text-[13px] text-ink-3">
            <span>
              {itens.length} de {total} itens ativos
            </span>
            <span className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="h-3 w-0.5 rounded-full bg-ink-2" /> mínimo
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="h-3 w-0.5 rounded-full bg-ink-3" /> ponto de reposição
              </span>
            </span>
          </div>
        </div>
      )}
    </Pagina>
  )
}
