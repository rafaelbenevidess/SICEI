'use client'

import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { COOKIE_TEMA, outroTema, type Tema } from '@/lib/tema'

/** Alterna claro/escuro na hora e guarda no cookie, que o servidor lê na próxima página. */
export function BotaoTema({ inicial }: { inicial: Tema }) {
  const [tema, setTema] = useState<Tema>(inicial)
  const proximo = outroTema(tema)
  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.theme = proximo
        document.cookie = `${COOKIE_TEMA}=${proximo}; path=/; max-age=31536000; samesite=lax`
        setTema(proximo)
      }}
      aria-label={proximo === 'escuro' ? 'Usar tema escuro' : 'Usar tema claro'}
      title={proximo === 'escuro' ? 'Tema escuro' : 'Tema claro'}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-2 shadow-pilula hover:bg-surface-2"
    >
      {tema === 'escuro' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
