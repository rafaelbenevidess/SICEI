'use client'

/** RF-20: PDF pelo "Imprimir → Salvar como PDF" do navegador. */
export function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
    >
      Imprimir / PDF
    </button>
  )
}
