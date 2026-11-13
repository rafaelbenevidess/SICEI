'use client'

import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react'

const Contexto = createContext<{ fechar: () => void } | null>(null)

/** Dentro de uma gaveta, devolve como fechá-la; fora dela, null. */
export function useGaveta() {
  return useContext(Contexto)
}

/**
 * Painel que desliza da direita por cima da tela atual: a pessoa faz a tarefa (registrar uma
 * saída, ver uma movimentação) sem sair de onde está. No celular ocupa a tela toda.
 * Fecha com Esc, com o X ou clicando fora. Sem `voltarPara`, fechar volta uma página no
 * histórico (é o caso das rotas interceptadas); com ele, vai para o endereço dado.
 */
export function Gaveta({
  titulo,
  descricao,
  voltarPara,
  estreita = false,
  children,
}: {
  titulo: string
  descricao?: ReactNode
  voltarPara?: string
  /** formulário curto (um cadastro de poucos campos): painel de 480 px no lugar de 760 px */
  estreita?: boolean
  children: ReactNode
}) {
  const router = useRouter()
  const painel = useRef<HTMLDivElement>(null)
  const fechar = useCallback(() => {
    if (voltarPara) router.push(voltarPara, { scroll: false })
    else router.back()
  }, [router, voltarPara])

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar()
    }
    window.addEventListener('keydown', aoTeclar)
    const rolagem = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    painel.current?.focus()
    return () => {
      window.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = rolagem
    }
  }, [fechar])

  return (
    <Contexto.Provider value={{ fechar }}>
      <div className="nao-imprimir fixed inset-0 z-50">
        <button
          type="button"
          aria-label="Fechar"
          tabIndex={-1}
          onClick={fechar}
          className="absolute inset-0 cursor-default bg-[rgb(10_14_20/0.42)] backdrop-blur-[2px]"
        />
        <div
          ref={painel}
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
          tabIndex={-1}
          className={`gaveta absolute inset-y-0 right-0 flex w-full flex-col ${estreita ? 'max-w-[480px]' : 'max-w-[760px]'} overflow-y-auto bg-bg shadow-pop outline-none [--pe-fixo:0px]`}
        >
          <header className="sticky top-0 z-20 flex items-start justify-between gap-4 bg-[color-mix(in_oklch,var(--bg)_88%,transparent)] px-5 pt-5 pb-4 backdrop-blur-md sm:px-7">
            <div className="min-w-0">
              <h2 className="text-[22px] leading-tight tracking-[-0.02em]">{titulo}</h2>
              {descricao && <p className="mt-1 text-[13px] text-ink-2">{descricao}</p>}
            </div>
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar painel"
              className="grid size-9 shrink-0 place-items-center rounded-controle bg-surface text-ink-2 shadow-pilula hover:bg-surface-2"
            >
              <X aria-hidden className="size-4" />
            </button>
          </header>
          <div className="flex-1 px-5 pb-8 sm:px-7">{children}</div>
        </div>
      </div>
    </Contexto.Provider>
  )
}
