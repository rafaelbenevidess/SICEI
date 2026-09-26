import 'server-only'
import { unstable_rethrow } from 'next/navigation'
import { ErroDePermissao } from '@/domain/permissoes'
import type { ErrosDeCampo } from '@/domain/schemas/comum'
import { ErroDeNegocio } from '../erros'

export interface EstadoAcao {
  ok?: boolean
  mensagem?: string
  erro?: string
  erros?: ErrosDeCampo
  /** Dados devolvidos à tela (ex.: senha provisória mostrada uma única vez). */
  dados?: Record<string, string | number | null>
  /** Listas devolvidas à tela (ex.: prévia da importação). */
  lista?: unknown[]
  /** Muda a cada envio, para o formulário saber que houve uma nova resposta. */
  instante?: number
}

/**
 * Executa o service e traduz os erros para a tela. Erros inesperados não vazam detalhes:
 * vão para o log técnico e o usuário vê uma mensagem genérica.
 */
export async function executarAcao(fn: () => Promise<EstadoAcao | void>): Promise<EstadoAcao> {
  try {
    return { ok: true, ...(await fn()), instante: Date.now() }
  } catch (e) {
    if (e instanceof ErroDeNegocio)
      return { ok: false, erro: e.message, erros: e.erros, instante: Date.now() }
    if (e instanceof ErroDePermissao) return { ok: false, erro: e.message, instante: Date.now() }
    // redirect() e notFound() do Next usam exceções: precisam seguir adiante
    unstable_rethrow(e)
    console.error(
      JSON.stringify({
        nivel: 'erro',
        evento: 'acao_falhou',
        mensagem: (e as Error)?.message,
        pilha: (e as Error)?.stack,
      }),
    )
    return {
      ok: false,
      erro: 'Não foi possível concluir a operação. Tente de novo.',
      instante: Date.now(),
    }
  }
}

/** FormData → objeto simples (campos repetidos viram o último valor). */
export function dadosDoFormulario(form: FormData): Record<string, string> {
  const obj: Record<string, string> = {}
  for (const [k, v] of form.entries()) if (typeof v === 'string') obj[k] = v
  return obj
}
