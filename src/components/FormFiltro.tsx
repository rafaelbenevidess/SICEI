'use client'

import type { ReactNode } from 'react'

/** Formulário de filtros (GET) que se aplica sozinho ao mudar um select ou uma caixa de marcar. */
export function FormFiltro({
  acao,
  children,
  className,
  rotulo,
}: {
  acao?: string
  children: ReactNode
  className?: string
  rotulo?: string
}) {
  return (
    <form
      action={acao}
      role="search"
      aria-label={rotulo}
      className={className}
      onChange={(e) => {
        const alvo = e.target as HTMLElement
        if (alvo.tagName === 'SELECT' || (alvo as HTMLInputElement).type === 'checkbox') {
          e.currentTarget.requestSubmit()
        }
      }}
    >
      {children}
    </form>
  )
}
