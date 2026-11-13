'use client'

import { CornerDownLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { BadgeStatus, ChipCodigo, ChipPosicao, Vazio } from '@/components/ui'
import { GlifoDaPastilha } from '@/components/Pastilha'
import { buscarItens, pontuarBusca } from '@/domain/busca'

export interface ItemParaEscolha {
  id: string
  codigo: string
  nome: string
  descricao: string
  iso: string | null
  classe: string | null
  fabricante: string
  saldo: number
  posicao: string | null
  status: string
}

const LIMITE = 50

/**
 * RF-07 / RF-08: escolha do item com autocompletar. A lista filtra enquanto a pessoa digita,
 * aceitando o código escrito de qualquer jeito ("Pst001", "pst 1", "PST-1" → PST-001) e a
 * posição sem traços; setas e Enter escolhem sem tirar a mão do teclado.
 */
export function EscolhaDeItem({
  modo,
  itens,
  inicial = '',
}: {
  modo: 'entrada' | 'saida'
  itens: ItemParaEscolha[]
  inicial?: string
}) {
  const router = useRouter()
  const id = useId()
  const [termo, setTermo] = useState(inicial)
  const [ativo, setAtivo] = useState(0)
  const resultados = buscarItens(termo, itens)
  const mostrados = resultados.slice(0, LIMITE)
  const indice = Math.min(ativo, Math.max(mostrados.length - 1, 0))
  const reconhecido =
    termo.trim() && mostrados[0] && pontuarBusca(termo, mostrados[0]) >= 90 ? mostrados[0] : null
  const href = (item: ItemParaEscolha) => `/movimentacoes/nova?modo=${modo}&item=${item.id}`
  const idOpcao = (i: number) => `${id}-opcao-${i}`

  return (
    <div>
      <div className="px-6 pb-4">
        <div className="relative max-w-[520px]">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3"
          />
          <label htmlFor={`${id}-busca`} className="sr-only">
            Buscar item
          </label>
          <input
            id={`${id}-busca`}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={mostrados.length > 0}
            aria-controls={`${id}-lista`}
            aria-activedescendant={mostrados.length ? idOpcao(indice) : undefined}
            aria-describedby={`${id}-contagem`}
            value={termo}
            onChange={(e) => {
              setTermo(e.target.value)
              setAtivo(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setAtivo(Math.min(indice + 1, mostrados.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setAtivo(Math.max(indice - 1, 0))
              } else if (e.key === 'Enter' && mostrados[indice]) {
                e.preventDefault()
                router.push(href(mostrados[indice]))
              } else if (e.key === 'Escape') {
                setTermo('')
                setAtivo(0)
              }
            }}
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="Código, posição, ISO ou classe (ex.: PST-001)"
            className="h-11 w-full rounded-lg border border-line-2 bg-surface pr-3 pl-9 text-base text-ink uppercase placeholder:text-ink-3 placeholder:normal-case sm:text-sm"
          />
        </div>
        <p id={`${id}-contagem`} aria-live="polite" className="mt-2 text-[13px] text-ink-3">
          {reconhecido ? (
            <span className="inline-flex flex-wrap items-center gap-1.5 text-ok-ink">
              Código reconhecido: <ChipCodigo forte>{reconhecido.codigo}</ChipCodigo>
              <span className="inline-flex items-center gap-1 text-ink-3">
                <CornerDownLeft aria-hidden className="size-3.5" /> Enter para abrir
              </span>
            </span>
          ) : termo.trim() ? (
            `${resultados.length} ${resultados.length === 1 ? 'item encontrado' : 'itens encontrados'}`
          ) : (
            'Digite o código como quiser: PST001, pst 1 e PST-001 acham o mesmo item.'
          )}
        </p>
      </div>
      {mostrados.length === 0 ? (
        <div className="px-6 pb-6">
          <Vazio>
            Nenhum item com “{termo.trim()}”. Confira o código ou busque pela ISO, classe ou
            posição.
          </Vazio>
        </div>
      ) : (
        <ul id={`${id}-lista`} role="listbox" aria-label="Itens encontrados">
          {mostrados.map((i, n) => (
            <li
              key={i.id}
              id={idOpcao(n)}
              role="option"
              aria-selected={n === indice}
              onMouseEnter={() => setAtivo(n)}
            >
              <Link
                href={href(i)}
                tabIndex={-1}
                className={`grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-line px-6 py-3 text-ink no-underline ${n === indice && termo.trim() ? 'bg-accent-soft' : 'hover:bg-surface-2'}`}
              >
                <GlifoDaPastilha iso={i.iso} className="size-7 text-ink-3" />
                <ChipCodigo forte>{i.codigo}</ChipCodigo>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{i.nome}</span>
                  <span className="block truncate text-[13px] text-ink-3">
                    {i.fabricante} · saldo {i.saldo}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="max-sm:hidden">
                    <ChipPosicao>{i.posicao}</ChipPosicao>
                  </span>
                  <BadgeStatus status={i.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
