import { pode } from '@/domain/permissoes'
import { gerarCsv, hojeIso } from '@/lib/formatar'
import { montarCsvDaAnalise } from '@/server/consultas/analise'
import { registrarExportacao } from '@/server/services/relatorios'
import { origemDaRequisicao, usuarioAtual } from '@/server/web/sessao-atual'

/** RF-17a / RF-20: CSV da análise com os filtros da tela. A exportação fica no log (RN-23). */
export async function GET(request: Request) {
  const u = await usuarioAtual()
  if (!u || u.deveTrocarSenha) return new Response('Não autenticado', { status: 401 })
  if (!pode(u.perfil, 'relatorios:ver')) return new Response('Sem permissão', { status: 403 })

  const p = Object.fromEntries(new URL(request.url).searchParams.entries())
  const r = await montarCsvDaAnalise(p)
  const { de, ate, por, medida, itens, destinos, colaboradores, aplicacoes, fabricantes } =
    r.filtros
  await registrarExportacao(
    { usuarioId: u.id, login: u.login, perfil: u.perfil, ...(await origemDaRequisicao()) },
    {
      tipo: 'analise',
      de,
      ate,
      por,
      medida,
      filtros: { itens, destinos, colaboradores, aplicacoes, fabricantes },
      linhas: r.linhas.length,
    },
  )
  return new Response(gerarCsv(r.cabecalho, r.linhas), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sicei-analise-${hojeIso()}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
