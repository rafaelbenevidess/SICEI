'use client'

import { TriangleAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { acaoVerAlertas } from '@/app/acoes/autenticacao'
import { tituloDoAvisoDeAlertas } from '@/lib/avisoDeAlertas'

/**
 * RF-13: pop-up no centro da tela depois do login, para Gestor e Administrador, enquanto houver
 * alerta sem ciente. Não tem "fechar": o único caminho é VER, que leva à tela de alertas.
 */
export function AvisoDeAlertas({ semCiente }: { semCiente: number }) {
  const botao = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    botao.current?.focus()
    const rolagem = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = rolagem
    }
  }, [])
  return (
    <div className="nao-imprimir fixed inset-0 z-[60] grid place-items-center bg-[rgb(10_14_20/0.62)] p-4 backdrop-blur-[2px]">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="aviso-alertas-titulo"
        aria-describedby="aviso-alertas-texto"
        className="w-full max-w-[420px] rounded-2xl border border-line bg-surface p-7 text-center shadow-pop"
        onKeyDown={(e) => {
          // o foco fica no VER: Tab não sai do aviso
          if (e.key === 'Tab') {
            e.preventDefault()
            botao.current?.focus()
          }
        }}
      >
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-crit-soft text-crit-ink">
          <TriangleAlert aria-hidden className="size-8 animate-pulse" />
        </span>
        <h2 id="aviso-alertas-titulo" className="mt-4 text-xl font-semibold tracking-tight">
          {tituloDoAvisoDeAlertas(semCiente)}
        </h2>
        <p id="aviso-alertas-texto" className="mt-2 text-sm text-ink-2">
          Há itens abaixo do ponto de reposição esperando a sua ciência. Veja os alertas antes de
          continuar.
        </p>
        <form action={acaoVerAlertas} className="mt-6">
          <button
            ref={botao}
            className="h-12 w-full rounded-[10px] bg-crit text-[15px] font-semibold tracking-wide text-white hover:opacity-90"
          >
            VER
          </button>
        </form>
      </div>
    </div>
  )
}
