/**
 * Alertas de estoque (doc 01, RN-17 a RN-19): um alerta aberto por item,
 * que sobe de nível quando piora e fecha sozinho quando o item volta a OK.
 */
import { GRAVIDADE } from './estoque'
import type { StatusItem } from './tipos'

export type NivelAlerta = Exclude<StatusItem, 'OK'>

export type AcaoAlerta =
  | { acao: 'NENHUMA' }
  | { acao: 'ABRIR'; nivel: NivelAlerta; enviarEmail: boolean }
  | { acao: 'ESCALAR'; nivel: NivelAlerta; enviarEmail: boolean }
  | { acao: 'ATUALIZAR'; nivel: NivelAlerta }
  | { acao: 'FECHAR' }

/** RN-19 / RF-14: e-mail sai quando o item entra em CRITICO ou ZERADO. */
function exigeEmail(nivel: NivelAlerta): boolean {
  return nivel === 'CRITICO' || nivel === 'ZERADO'
}

export function decidirAlerta(entrada: {
  nivelAberto: NivelAlerta | null
  novoStatus: StatusItem
}): AcaoAlerta {
  const { nivelAberto, novoStatus } = entrada
  if (nivelAberto === null) {
    if (novoStatus === 'OK') return { acao: 'NENHUMA' }
    return { acao: 'ABRIR', nivel: novoStatus, enviarEmail: exigeEmail(novoStatus) }
  }
  if (novoStatus === 'OK') return { acao: 'FECHAR' }
  if (novoStatus === nivelAberto) return { acao: 'NENHUMA' }
  if (GRAVIDADE[novoStatus] > GRAVIDADE[nivelAberto]) {
    return { acao: 'ESCALAR', nivel: novoStatus, enviarEmail: exigeEmail(novoStatus) }
  }
  return { acao: 'ATUALIZAR', nivel: novoStatus }
}
