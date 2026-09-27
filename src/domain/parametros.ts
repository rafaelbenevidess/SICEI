/**
 * RF-26: limites dos parâmetros do sistema e o histórico de alterações.
 * Funções puras: a tela usa para avisar na hora; o servidor valida de novo pelo schema Zod.
 */

export const LIMITES_PARAMETROS = {
  janelaConsumoDias: { min: 1, max: 365 },
  sessaoInatividadeMinutos: { min: 5, max: 480 },
} as const

export interface ValoresParametros {
  janelaConsumoDias: number
  sessaoInatividadeMinutos: number
  emailAvisos: string
}

function dentro(v: number, { min, max }: { min: number; max: number }): boolean {
  return Number.isInteger(v) && v >= min && v <= max
}

/** Primeiro problema encontrado nos valores digitados, ou null se estiver tudo certo. */
export function problemaDosParametros(v: {
  janelaConsumoDias: number
  sessaoInatividadeMinutos: number
}): string | null {
  if (!dentro(v.janelaConsumoDias, LIMITES_PARAMETROS.janelaConsumoDias))
    return 'A janela precisa ficar entre 1 e 365 dias.'
  if (!dentro(v.sessaoInatividadeMinutos, LIMITES_PARAMETROS.sessaoInatividadeMinutos))
    return 'A sessão precisa ficar entre 5 e 480 minutos.'
  return null
}

export const TITULO_DO_PARAMETRO: Record<keyof ValoresParametros, string> = {
  janelaConsumoDias: 'Janela do consumo médio',
  sessaoInatividadeMinutos: 'Sessão expira após',
  emailAvisos: 'E-mail para avisos',
}

export interface AlteracaoDeParametro {
  titulo: string
  antes: string
  depois: string
  login: string
  quando: Date
}

function texto(v: unknown): string {
  if (v === null || v === undefined || v === '') return '(vazio)'
  return String(v)
}

/**
 * Transforma os registros PARAMETROS_ALTERADOS do log (mais recentes primeiro) numa lista de
 * alterações, uma por parâmetro que mudou de fato.
 */
export function alteracoesDeParametros(
  registros: { antes: unknown; depois: unknown; login: string; quando: Date }[],
  limite = 5,
): AlteracaoDeParametro[] {
  const saida: AlteracaoDeParametro[] = []
  for (const r of registros) {
    const antes = (r.antes ?? {}) as Record<string, unknown>
    const depois = (r.depois ?? {}) as Record<string, unknown>
    for (const chave of Object.keys(TITULO_DO_PARAMETRO) as (keyof ValoresParametros)[]) {
      if (!(chave in depois)) continue
      const a = texto(antes[chave])
      const d = texto(depois[chave])
      if (a === d) continue
      saida.push({
        titulo: TITULO_DO_PARAMETRO[chave],
        antes: a,
        depois: d,
        login: r.login,
        quando: r.quando,
      })
      if (saida.length >= limite) return saida
    }
  }
  return saida
}
