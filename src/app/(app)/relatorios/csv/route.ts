import { pode } from '@/domain/permissoes'
import { gerarCsv, hojeIso } from '@/lib/formatar'
import { montarRelatorio } from '@/server/consultas/dadosRelatorio'
import { registrarExportacao } from '@/server/services/relatorios'
import { origemDaRequisicao, usuarioAtual } from '@/server/web/sessao-atual'

/** RF-20: exportação CSV. A exportação fica no log (RN-23). */
export async function GET(request: Request) {
  const u = await usuarioAtual()
  if (!u || u.deveTrocarSenha) return new Response('Não autenticado', { status: 401 })
  if (!pode(u.perfil, 'relatorios:ver')) return new Response('Sem permissão', { status: 403 })

  const p = Object.fromEntries(new URL(request.url).searchParams.entries())
  const r = await montarRelatorio(p, pode(u.perfil, 'precos:ver'))
  await registrarExportacao(
    { usuarioId: u.id, login: u.login, perfil: u.perfil, ...(await origemDaRequisicao()) },
    { tipo: r.tipo, de: r.deIso, ate: r.ateIso, agrupar: r.agrupar, linhas: r.linhas.length },
  )
  return new Response(gerarCsv(r.cabecalho, r.linhas), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="simi-${r.tipo}-${hojeIso()}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
