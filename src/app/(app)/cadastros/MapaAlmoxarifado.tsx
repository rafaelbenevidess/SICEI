import Link from 'next/link'

interface PosicaoDoMapa {
  codigo: string
  armario: number
  gaveta: number
  compartimento: number
  ativo: boolean
  item: { id: string; codigo: string } | null
}

/**
 * Mapa do almoxarifado (RN-25): um cartão por armário, gavetas nas linhas e compartimentos
 * nas colunas. Ocupado mostra o fim do código do item e abre o item; livre fica tracejado.
 */
export function MapaAlmoxarifado({ posicoes }: { posicoes: PosicaoDoMapa[] }) {
  if (posicoes.length === 0) return null
  const armarios = [...new Set(posicoes.map((p) => p.armario))].sort((a, b) => a - b)
  return (
    <section
      aria-label="Mapa do almoxarifado"
      className="grid gap-4 sm:grid-cols-2 min-[90rem]:grid-cols-3"
    >
      {armarios.map((a) => {
        const doArmario = posicoes.filter((p) => p.armario === a)
        const gavetas = Math.max(5, ...doArmario.map((p) => p.gaveta))
        const compartimentos = Math.max(6, ...doArmario.map((p) => p.compartimento))
        const ocupadas = doArmario.filter((p) => p.item).length
        const nome = `A${String(a).padStart(2, '0')}`
        return (
          <div key={a} className="cartao p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="font-mono font-semibold">{nome}</h3>
              <span className="text-xs text-ink-3">
                {ocupadas} de {doArmario.length} ocupadas
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: gavetas }, (_, g) => (
                <div key={g} className="flex items-center gap-1.5">
                  <span className="w-7 font-mono text-[10px] text-ink-3">
                    G{String(g + 1).padStart(2, '0')}
                  </span>
                  <div
                    className="grid flex-1 gap-1"
                    style={{ gridTemplateColumns: `repeat(${compartimentos}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: compartimentos }, (_, c) => {
                      const p = doArmario.find(
                        (x) => x.gaveta === g + 1 && x.compartimento === c + 1,
                      )
                      if (!p) return <span key={c} className="h-6 rounded bg-surface-2" />
                      if (p.item) {
                        return (
                          <Link
                            key={c}
                            href={`/itens/${p.item.id}`}
                            title={`${p.codigo}: ${p.item.codigo}`}
                            className="flex h-6 items-center justify-center rounded border border-accent bg-accent-soft font-mono text-[9px] text-accent-ink no-underline hover:bg-accent hover:text-on-accent"
                          >
                            {p.item.codigo.replace(/\D/g, '').slice(-4) || p.item.codigo.slice(-4)}
                          </Link>
                        )
                      }
                      return (
                        <span
                          key={c}
                          title={`${p.codigo}: livre${p.ativo ? '' : ' (inativa)'}`}
                          className={`h-6 rounded border border-dashed border-line-2 ${p.ativo ? '' : 'opacity-50'}`}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}
