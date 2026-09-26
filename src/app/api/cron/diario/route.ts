import { timingSafeEqual } from 'node:crypto'
import { enviarNotificacoesPendentes } from '@/server/notificacao/email'
import { recalcularTodos } from '@/server/services/parametros'

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.CRON_SECRET
  if (!esperado || !recebido) return false
  const a = Buffer.from(recebido)
  const b = Buffer.from(`Bearer ${esperado}`)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Rotina diária (doc 03, seção 5.4): recalcula consumo médio, ponto de reposição, status
 * e alertas de todos os itens, e reenvia os avisos que falharam. Só aceita o segredo CRON_SECRET.
 */
export async function GET(request: Request) {
  if (!segredoConfere(request.headers.get('authorization')))
    return new Response('Não autorizado', { status: 401 })
  const recalculo = await recalcularTodos()
  const email = await enviarNotificacoesPendentes()
  console.log(
    JSON.stringify({ nivel: 'info', evento: 'rotina_diaria', itens: recalculo.itens, ...email }),
  )
  return Response.json({
    itens: recalculo.itens,
    notificacoesNovas: recalculo.notificacoes.length,
    ...email,
  })
}
