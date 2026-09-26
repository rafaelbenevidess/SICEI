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
  filtros: Record<string, string | undefined>
}) {
  if (paginas <= 1) return null
  const link = (p: number) => {
    const q = new URLSearchParams(
      Object.entries({ ...filtros, pagina: String(p) }).filter(([, v]) => v) as [string, string][],
    )
    return `${caminho}?${q.toString()}`
  }
  return (
    <nav
      aria-label="Paginação"
      className="nao-imprimir flex items-center justify-center gap-3 text-sm"
    >
      {pagina > 1 && (
        <Link href={link(pagina - 1)} className="underline">
          ← anterior
        </Link>
      )}
      <span>
        página {pagina} de {paginas}
      </span>
      {pagina < paginas && (
        <Link href={link(pagina + 1)} className="underline">
          próxima →
        </Link>
      )}
    </nav>
  )
}
