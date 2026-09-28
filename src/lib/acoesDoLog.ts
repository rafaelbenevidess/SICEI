/**
 * Catálogo das ações gravadas no log de auditoria (RF-21), com o nome que aparece no filtro.
 * Ação que ainda não está aqui (de uma versão futura) continua aparecendo, com o nome técnico.
 */
export interface AcaoDoLog {
  acao: string
  rotulo: string
  grupo: string
}

const G = {
  mov: 'Movimentações',
  item: 'Itens, posições e etiquetas',
  cad: 'Cadastros',
  acesso: 'Usuários e acesso',
  sistema: 'Sistema',
} as const

const situacao = (entidade: string, nome: string): AcaoDoLog[] => [
  { acao: `${entidade}_INATIVADO`, rotulo: `${nome} inativado`, grupo: G.cad },
  { acao: `${entidade}_REATIVADO`, rotulo: `${nome} reativado`, grupo: G.cad },
]

export const ACOES_DO_LOG: AcaoDoLog[] = [
  { acao: 'MOVIMENTACAO_COMPRA', rotulo: 'Entrada por compra', grupo: G.mov },
  { acao: 'MOVIMENTACAO_DEVOLUCAO_PRODUCAO', rotulo: 'Devolução da produção', grupo: G.mov },
  { acao: 'MOVIMENTACAO_CONSUMO_PRODUCAO', rotulo: 'Saída para a produção', grupo: G.mov },
  { acao: 'MOVIMENTACAO_PERDA_QUEBRA', rotulo: 'Perda ou quebra', grupo: G.mov },
  { acao: 'MOVIMENTACAO_AJUSTE_POSITIVO', rotulo: 'Ajuste positivo', grupo: G.mov },
  { acao: 'MOVIMENTACAO_AJUSTE_NEGATIVO', rotulo: 'Ajuste negativo', grupo: G.mov },
  { acao: 'MOVIMENTACAO_ESTORNO', rotulo: 'Estorno', grupo: G.mov },
  { acao: 'INVENTARIO_CONFERIDO', rotulo: 'Inventário conferido', grupo: G.mov },
  { acao: 'ALERTA_CIENTE', rotulo: 'Alerta marcado como ciente', grupo: G.mov },

  { acao: 'ITEM_CRIADO', rotulo: 'Item criado', grupo: G.item },
  { acao: 'ITEM_ALTERADO', rotulo: 'Item alterado', grupo: G.item },
  { acao: 'ITEM_LIMITES_ALTERADOS', rotulo: 'Estoque mínimo ou máximo alterado', grupo: G.item },
  { acao: 'ITEM_INATIVADO', rotulo: 'Item inativado', grupo: G.item },
  { acao: 'ITEM_REATIVADO', rotulo: 'Item reativado', grupo: G.item },
  { acao: 'ITEM_POSICAO_ALTERADA', rotulo: 'Item mudou de posição', grupo: G.item },
  { acao: 'POSICAO_CRIADA', rotulo: 'Posição criada', grupo: G.item },
  ...situacao('POSICAO', 'Posição').map((a) => ({ ...a, grupo: G.item })),
  { acao: 'ETIQUETA_IMPRESSA', rotulo: 'Etiqueta QR impressa', grupo: G.item },
  { acao: 'IMPORTACAO_PLANILHA', rotulo: 'Importação da planilha', grupo: G.item },

  { acao: 'FABRICANTE_CRIADO', rotulo: 'Fabricante criado', grupo: G.cad },
  { acao: 'FABRICANTE_ALTERADO', rotulo: 'Fabricante alterado', grupo: G.cad },
  ...situacao('FABRICANTE', 'Fabricante'),
  { acao: 'FORNECEDOR_CRIADO', rotulo: 'Fornecedor criado', grupo: G.cad },
  { acao: 'FORNECEDOR_ALTERADO', rotulo: 'Fornecedor alterado', grupo: G.cad },
  ...situacao('FORNECEDOR', 'Fornecedor'),
  { acao: 'FORNECEDOR_VINCULADO', rotulo: 'Fornecedor vinculado a item', grupo: G.cad },
  { acao: 'FORNECEDOR_VINCULO_ALTERADO', rotulo: 'Vínculo de fornecedor alterado', grupo: G.cad },
  { acao: 'FORNECEDOR_DESVINCULADO', rotulo: 'Fornecedor desvinculado de item', grupo: G.cad },
  { acao: 'DESTINO_CRIADO', rotulo: 'Destino criado', grupo: G.cad },
  { acao: 'DESTINO_ALTERADO', rotulo: 'Destino alterado', grupo: G.cad },
  ...situacao('DESTINO', 'Destino'),
  { acao: 'COLABORADOR_CRIADO', rotulo: 'Colaborador criado', grupo: G.cad },
  { acao: 'COLABORADOR_ALTERADO', rotulo: 'Colaborador alterado', grupo: G.cad },
  ...situacao('COLABORADOR', 'Colaborador'),

  { acao: 'LOGIN', rotulo: 'Entrada no sistema', grupo: G.acesso },
  { acao: 'LOGIN_FALHOU', rotulo: 'Tentativa de entrada que falhou', grupo: G.acesso },
  { acao: 'LOGOUT', rotulo: 'Saída do sistema', grupo: G.acesso },
  { acao: 'SENHA_ALTERADA', rotulo: 'Senha alterada', grupo: G.acesso },
  { acao: 'SENHA_REDEFINIDA', rotulo: 'Senha redefinida pelo Administrador', grupo: G.acesso },
  { acao: 'USUARIO_CRIADO', rotulo: 'Usuário criado', grupo: G.acesso },
  { acao: 'USUARIO_PERFIL_ALTERADO', rotulo: 'Perfil de usuário alterado', grupo: G.acesso },
  { acao: 'USUARIO_BLOQUEADO', rotulo: 'Usuário bloqueado', grupo: G.acesso },
  { acao: 'USUARIO_DESBLOQUEADO', rotulo: 'Usuário desbloqueado', grupo: G.acesso },
  { acao: 'USUARIO_INATIVADO', rotulo: 'Usuário inativado', grupo: G.acesso },
  { acao: 'USUARIO_REATIVADO', rotulo: 'Usuário reativado', grupo: G.acesso },
  { acao: 'ACAO_NEGADA', rotulo: 'Ação negada sobre Administrador', grupo: G.acesso },

  { acao: 'PARAMETROS_ALTERADOS', rotulo: 'Parâmetros alterados', grupo: G.sistema },
  { acao: 'CONFERENCIA_INTEGRIDADE', rotulo: 'Verificação de integridade', grupo: G.sistema },
  { acao: 'RELATORIO_EXPORTADO', rotulo: 'Relatório exportado', grupo: G.sistema },
]

export const GRUPOS_DO_LOG = Object.values(G)

/**
 * Opções do filtro: o catálogo inteiro, mais qualquer ação gravada que o catálogo não conheça
 * (no grupo "Outras"), agrupadas na ordem do catálogo.
 */
export function opcoesDoFiltroDeAcao(gravadas: string[]): { grupo: string; acoes: AcaoDoLog[] }[] {
  const conhecidas = new Set(ACOES_DO_LOG.map((a) => a.acao))
  const outras = [...new Set(gravadas)]
    .filter((a) => a && !conhecidas.has(a))
    .sort()
    .map((acao) => ({ acao, rotulo: acao, grupo: 'Outras' }))
  return [...GRUPOS_DO_LOG, 'Outras']
    .map((grupo) => ({
      grupo,
      acoes: [...ACOES_DO_LOG, ...outras].filter((a) => a.grupo === grupo),
    }))
    .filter((g) => g.acoes.length > 0)
}

/** Nome legível de uma ação (para a tabela); a desconhecida volta como veio. */
export function nomeDaAcao(acao: string): string {
  return ACOES_DO_LOG.find((a) => a.acao === acao)?.rotulo ?? acao
}
