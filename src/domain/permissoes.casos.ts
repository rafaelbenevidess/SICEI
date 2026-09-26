import type { CasoDeTeste, Perfil } from './tipos'
import type { Permissao } from './permissoes'

/** Linhas da matriz do doc 02 (seção 5), na ordem Admin, Gestor, Almoxarife, Consulta. */
const linhas: [string, Permissao, [boolean, boolean, boolean, boolean]][] = [
  ['gerir usuários', 'usuarios:gerenciar', [true, false, false, false]],
  ['mudar parâmetros', 'parametros:gerenciar', [true, false, false, false]],
  ['importar planilha', 'importacao:executar', [true, false, false, false]],
  ['editar cadastros', 'cadastros:editar', [true, true, false, false]],
  ['ver cadastros', 'cadastros:ver', [true, true, true, true]],
  ['ver preços', 'precos:ver', [true, true, true, false]],
  ['editar mínimo e máximo', 'limites:editar', [true, true, false, false]],
  ['registrar entrada', 'movimentacao:entrada', [true, true, true, false]],
  ['registrar saída', 'movimentacao:saida', [true, true, true, false]],
  ['fazer estorno', 'movimentacao:estornar', [true, true, false, false]],
  ['fazer inventário e ajuste', 'movimentacao:ajuste', [true, true, false, false]],
  ['ver saldo', 'saldo:ver', [true, true, true, true]],
  ['ver painel', 'painel:ver', [true, true, true, true]],
  ['marcar alerta como ciente', 'alertas:ciente', [true, true, false, false]],
  ['ver histórico', 'historico:ver', [true, true, true, false]],
  ['ver relatórios', 'relatorios:ver', [true, true, false, false]],
  ['ver log de auditoria', 'auditoria:ver', [true, true, false, false]],
  ['imprimir etiquetas', 'etiquetas:imprimir', [true, true, true, false]],
]

const perfis: Perfil[] = ['ADMIN', 'GESTOR', 'ALMOXARIFE', 'CONSULTA']
const nomes: Record<Perfil, string> = {
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  ALMOXARIFE: 'Almoxarife',
  CONSULTA: 'Consulta',
}

export const casosPermissao: CasoDeTeste<{ perfil: Perfil; permissao: Permissao }, boolean>[] =
  linhas.flatMap(([acao, permissao, valores]) =>
    perfis.map((perfil, i) => ({
      descricao: `${nomes[perfil]} ${valores[i] ? 'pode' : 'não pode'} ${acao}`,
      entrada: { perfil, permissao },
      esperado: valores[i],
    })),
  )
