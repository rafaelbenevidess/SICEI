import Link from 'next/link'

/** Links de página que preservam os filtros da busca. */
export function Paginacao({
  pagina,
  paginas,
  caminho,
  filtros,
}: {
  pagina: number
  paginas: number
  caminho: string
  filtros: object
}) {
  if (paginas <= 1) return null
  const link = (p: number) => {
    const q = new URLSearchParams(
      Object.entries({ ...(filtros as Record<string, unknown>), pagina: String(p) }).filter(
        ([, v]) => v,
      ) as [string, string][],
    )
    return `${caminho}?${q.toString()}`
  }
  return (
    <nav
      aria-label="Paginação"
      className="nao-imprimir flex items-center justify-center gap-3 text-sm text-ink-2"
    >
      {pagina > 1 && (
        <Link
          href={link(pagina - 1)}
          className="inline-flex h-8 items-center rounded-lg border border-line-2 bg-surface px-3 text-[13px] font-medium text-ink no-underline hover:bg-surface-2"
        >
          ← Anterior
        </Link>
      )}
      <span>
        Página {pagina} de {paginas}
      </span>
      {pagina < paginas && (
        <Link
          href={link(pagina + 1)}
          className="inline-flex h-8 items-center rounded-lg border border-line-2 bg-surface px-3 text-[13px] font-medium text-ink no-underline hover:bg-surface-2"
        >
          Próxima →
        </Link>
      )}
    </nav>
  )
}
