'use client'

import { useState } from 'react'
import { AbaCadeia } from './AbaCadeia'
import { AbaCriar } from './AbaCriar'
import { AbaExecutar } from './AbaExecutar'

const ABAS = [
  { id: 'executar', rotulo: '1. Executar os testes' },
  { id: 'criar', rotulo: '2. Criar o seu teste' },
  { id: 'cadeia', rotulo: '3. Log inalterável' },
] as const

type Aba = (typeof ABAS)[number]['id']

export function Laboratorio() {
  const [aba, setAba] = useState<Aba>('executar')
  return (
    <div>
      <div
        role="tablist"
        aria-label="Seções do laboratório"
        className="flex flex-wrap gap-2 border-b border-line"
      >
        {ABAS.map((a) => (
          <button
            key={a.id}
            role="tab"
            id={`aba-${a.id}`}
            aria-selected={aba === a.id}
            aria-controls={`painel-${a.id}`}
            onClick={() => setAba(a.id)}
            className={`-mb-px rounded-t-lg border px-3 py-2 text-sm font-medium ${
              aba === a.id
                ? 'border-line border-b-surface bg-surface text-ink'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        id={`painel-${aba}`}
        aria-labelledby={`aba-${aba}`}
        className="rounded-b-[14px] border border-t-0 border-line bg-surface p-4 shadow-cartao sm:p-6"
      >
        {aba === 'executar' && <AbaExecutar />}
        {aba === 'criar' && <AbaCriar />}
        {aba === 'cadeia' && <AbaCadeia />}
      </section>
    </div>
  )
}
