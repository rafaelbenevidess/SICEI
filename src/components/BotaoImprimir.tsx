'use client'

import { Printer } from 'lucide-react'
import { classeBotao } from './ui'

/** RF-20: PDF pelo "Imprimir → Salvar como PDF" do navegador. */
export function BotaoImprimir({ rotulo = 'Imprimir / PDF' }: { rotulo?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={classeBotao('secundario')}>
      <Printer aria-hidden />
      {rotulo}
    </button>
  )
}
