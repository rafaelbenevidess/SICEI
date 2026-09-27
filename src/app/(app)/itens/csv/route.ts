import { pode } from '@/domain/permissoes'
import { gerarCsv, hojeIso, NOME_APLICACAO, NOME_STATUS } from '@/lib/formatar'
import { listarItens } from '@/server/consultas/estoque'
import { registrarExportacaoDeItens } from '@/server/services/relatorios'
import { origemDaRequisicao, usuarioAtual } from '@/server/web/sessao-atual'

/** Lista de itens com os filtros da tela, em CSV (RF-11). Só quantidades, sem preços. */
export async function GET(request: Request) {
  const u = await usuarioAtual()
  if (!u || u.deveTrocarSenha) return new Response('Não autenticado', { status: 401 })
  if (!pode(u.perfil, 'saldo:ver')) return new Response('Sem permissão', { status: 403 })

  const p = new URL(request.url).searchParams
  const filtros = {
    q: p.get('q') ?? undefined,
    status: p.get('status') ?? undefined,
    aplicacao: p.get('aplicacao') ?? undefined,
  }
  const itens = await listarItens({ ...filtros, inativos: p.get('inativos') === '1' })
  await registrarExportacaoDeItens(
    { usuarioId: u.id, login: u.login, perfil: u.perfil, ...(await origemDaRequisicao()) },
    { ...filtros, linhas: itens.length },
  )
  const csv = gerarCsv(
    [
      'Código',
      'Descrição',
      'ISO',
      'Classe',
      'Fabricante',
      'Aplicação',
      'Saldo',
      'Mínimo',
      'Ponto de reposição',
      'Status',
      'Posição',
      'Ativo',
    ],
    itens.map((i) => [
      i.codigo,
      i.descricao,
      i.iso,
      i.classe,
      i.fabricante.nome,
      NOME_APLICACAO[i.aplicacao],
      i.saldo,
      i.estoqueMinimo,
      i.pontoReposicao,
      NOME_STATUS[i.status],
      i.posicao?.codigo,
      i.ativo ? 'Sim' : 'Não',
    ]),
  )
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sicei-itens-${hojeIso()}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
