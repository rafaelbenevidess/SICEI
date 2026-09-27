import { pode } from '@/domain/permissoes'
import { contextoDaMovimentacao } from '@/lib/contexto'
import { filtrosDaUrl } from '@/lib/filtros'
import { formatarDataHora, gerarCsv, hojeIso, NOME_TIPO } from '@/lib/formatar'
import { listarTodasAsMovimentacoes } from '@/server/consultas/movimentacoes'
import { registrarExportacaoDeMovimentacoes } from '@/server/services/relatorios'
import { origemDaRequisicao, usuarioAtual } from '@/server/web/sessao-atual'

/** RF-15: o histórico com os filtros da tela, em CSV. A exportação fica no log (RN-23). */
export async function GET(request: Request) {
  const u = await usuarioAtual()
  if (!u || u.deveTrocarSenha) return new Response('Não autenticado', { status: 401 })
  if (!pode(u.perfil, 'historico:ver')) return new Response('Sem permissão', { status: 403 })

  const f = filtrosDaUrl(new URL(request.url).searchParams)
  const linhas = await listarTodasAsMovimentacoes(f)
  await registrarExportacaoDeMovimentacoes(
    { usuarioId: u.id, login: u.login, perfil: u.perfil, ...(await origemDaRequisicao()) },
    { ...f, linhas: linhas.length },
  )
  const verPrecos = pode(u.perfil, 'precos:ver')
  const csv = gerarCsv(
    [
      'Data e hora',
      'Item',
      'Tipo',
      'Quantidade',
      'Saldo antes',
      'Saldo depois',
      'Contexto',
      'Usuário',
      'Estornada',
    ],
    linhas.map((m) => [
      formatarDataHora(m.criadoEm),
      m.item.codigo,
      NOME_TIPO[m.tipo],
      m.saldoPosterior - m.saldoAnterior,
      m.saldoAnterior,
      m.saldoPosterior,
      contextoDaMovimentacao(m, verPrecos),
      m.usuario.login,
      m.estornadaPor ? 'Sim' : 'Não',
    ]),
  )
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sicei-movimentacoes-${hojeIso()}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
