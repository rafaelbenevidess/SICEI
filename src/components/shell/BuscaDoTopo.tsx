'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { acaoSugerirItens, type SugestaoDeItem } from '@/app/acoes/estoque'
import { BadgeStatus, ChipCodigo } from '../ui'

const ESPERA_MS = 150

/**
 * RF-11: busca do topo. Enquanto a pessoa digita, sugere até 8 itens com a regra tolerante
 * ("pst1" acha PST-001, "a1g1c2" acha pela posição); setas e Enter abrem o item. Enter sem
 * escolher vai para a lista de itens com o termo. A tecla "/" põe o foco aqui.
 */
export function BuscaDoTopo({
  sugerir = acaoSugerirItens,
}: {
  sugerir?: (termo: string) => Promise<SugestaoDeItem[]>
}) {
  const ref = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const id = useId()
  const [termo, setTermo] = useState('')
  const [sugestoes, setSugestoes] = useState<SugestaoDeItem[]>([])
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(-1)
  const rodada = useRef(0)

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement
      if (e.key !== '/' || alvo.closest('input, textarea, select, [contenteditable=true]')) return
      e.preventDefault()
      ref.current?.focus()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  useEffect(() => {
    const q = termo.trim()
    const minha = ++rodada.current
    if (!q) return
    const espera = setTimeout(() => {
      sugerir(q)
        .then((r) => {
          // resposta atrasada de um termo antigo não sobrescreve a do termo atual
          if (minha === rodada.current) setSugestoes(r)
        })
        .catch(() => {
          if (minha === rodada.current) setSugestoes([])
        })
    }, ESPERA_MS)
    return () => clearTimeout(espera)
  }, [termo, sugerir])

  const lista = termo.trim() ? sugestoes : []
  const mostrar = aberto && lista.length > 0
  const idOpcao = (i: number) => `${id}-sugestao-${i}`
  const abrirItem = (s: SugestaoDeItem) => {
    setAberto(false)
    setTermo('')
    router.push(`/itens/${s.id}`)
  }

  return (
    <form
      role="search"
      className="relative flex max-w-[400px] min-w-0 flex-1"
      onSubmit={(e) => {
        e.preventDefault()
        if (mostrar && lista[ativo]) return abrirItem(lista[ativo])
        const q = termo.trim()
        setAberto(false)
        router.push(q ? `/itens?q=${encodeURIComponent(q)}` : '/itens')
      }}
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3"
      />
      <label htmlFor="busca-topo" className="sr-only">
        Buscar itens
      </label>
      <input
        ref={ref}
        id="busca-topo"
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={mostrar}
        aria-controls={`${id}-sugestoes`}
        aria-activedescendant={mostrar && ativo >= 0 ? idOpcao(ativo) : undefined}
        autoComplete="off"
        spellCheck={false}
        value={termo}
        onChange={(e) => {
          setTermo(e.target.value)
          setAtivo(-1)
          setAberto(true)
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && lista.length) {
            e.preventDefault()
            setAberto(true)
            setAtivo(Math.min(ativo + 1, lista.length - 1))
          } else if (e.key === 'ArrowUp' && lista.length) {
            e.preventDefault()
            setAtivo(Math.max(ativo - 1, -1))
          } else if (e.key === 'Escape') {
            setAberto(false)
          }
        }}
        placeholder="Buscar código, ISO, classe ou posição"
        className="h-[38px] w-full min-w-0 rounded-lg border border-line-2 bg-surface pr-9 pl-9 text-base text-ink placeholder:text-ink-3 sm:text-sm"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-line-2 px-1.5 font-mono text-[11px] text-ink-3 sm:block">
        /
      </kbd>
      {mostrar && (
        <ul
          id={`${id}-sugestoes`}
          role="listbox"
          aria-label="Itens sugeridos"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-[70vh] overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-pop"
        >
          {lista.map((s, i) => (
            <li
              key={s.id}
              id={idOpcao(i)}
              role="option"
              aria-selected={i === ativo}
              // mousedown antes do blur, para a escolha não se perder
              onMouseDown={(e) => {
                e.preventDefault()
                abrirItem(s)
              }}
              onMouseEnter={() => setAtivo(i)}
              className={`grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 ${i === ativo ? 'bg-accent-soft' : ''}`}
            >
              <ChipCodigo forte>{s.codigo}</ChipCodigo>
              <span className="min-w-0">
                <span className="block truncate text-sm">{s.descricao}</span>
                {s.posicao && (
                  <span className="block font-mono text-xs text-ink-3">{s.posicao}</span>
                )}
              </span>
              <BadgeStatus status={s.status} />
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
