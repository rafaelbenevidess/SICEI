'use client'

import { Printer } from 'lucide-react'
import { useState } from 'react'
import { classeBotao } from '@/components/ui'

interface Etiqueta {
  codigo: string
  itemCodigo: string
  nome: string
  svg: string
}

/** Escolha das posições e prévia da folha A4; na impressão sai só a folha. */
export function FolhaDeEtiquetas({
  etiquetas,
  inicial,
}: {
  etiquetas: Etiqueta[]
  inicial: string[]
}) {
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set(inicial))
  const todas = marcadas.size === etiquetas.length
  const escolhidas = etiquetas.filter((e) => marcadas.has(e.codigo))
  const alternar = (codigo: string) =>
    setMarcadas((m) => {
      const n = new Set(m)
      if (n.has(codigo)) n.delete(codigo)
      else n.add(codigo)
      return n
    })

  return (
    <div className="grid items-start gap-6 min-[65rem]:grid-cols-[340px_minmax(0,1fr)]">
      <section className="nao-imprimir overflow-hidden rounded-[14px] border border-line bg-surface shadow-cartao">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <h2 className="font-semibold">Posições ocupadas</h2>
          <button
            type="button"
            onClick={() => setMarcadas(todas ? new Set() : new Set(etiquetas.map((e) => e.codigo)))}
            className="text-[13px] font-medium text-accent-ink hover:underline"
          >
            {todas ? 'Limpar seleção' : 'Selecionar todas'}
          </button>
        </div>
        <ul className="max-h-[70vh] overflow-y-auto">
          {etiquetas.map((e) => (
            <li key={e.codigo} className="border-t border-line">
              <label className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-surface-2">
                <input
                  type="checkbox"
                  checked={marcadas.has(e.codigo)}
                  onChange={() => alternar(e.codigo)}
                  className="size-4 accent-[var(--accent)]"
                />
                <span className="font-mono text-[13px] font-medium">{e.codigo}</span>
                <span className="font-mono text-xs text-ink-3">{e.itemCodigo}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="border-t border-line p-4">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={escolhidas.length === 0}
            className={`${classeBotao('primario')} w-full`}
          >
            <Printer aria-hidden />
            Imprimir {escolhidas.length} {escolhidas.length === 1 ? 'etiqueta' : 'etiquetas'}
          </button>
        </div>
      </section>

      <section
        aria-label="Prévia da folha A4"
        className="rounded-[14px] bg-surface-3 p-4 sm:p-8 print:bg-white print:p-0"
      >
        <div className="mx-auto aspect-[210/297] w-full max-w-[620px] bg-white p-[5%] text-[#14191f] shadow-pop print:aspect-auto print:max-w-none print:p-0 print:shadow-none">
          {escolhidas.length === 0 ? (
            <p className="pt-10 text-center text-sm text-[#6d7279]">
              Marque as posições que vão para a folha.
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2">
              {escolhidas.map((e) => (
                <div
                  key={e.codigo}
                  className="flex min-w-0 items-center gap-2.5 rounded border border-dashed border-[#cdd1d6] p-2.5 break-inside-avoid"
                >
                  <div
                    role="img"
                    aria-label={`QR da posição ${e.codigo}`}
                    className="w-14 shrink-0 [&_svg]:h-auto [&_svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: e.svg }}
                  />
                  <div className="min-w-0 leading-tight">
                    <p className="font-mono text-xs font-semibold">{e.codigo}</p>
                    <p className="font-mono text-[10px]">{e.itemCodigo}</p>
                    <p className="truncate text-[10px] text-[#484e55]">{e.nome}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
