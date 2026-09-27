import { formatarMoeda } from './formatar'

/** Campos de uma movimentação usados para descrever o contexto numa linha. */
export interface DadosDoContexto {
  tipo: string
  fornecedor?: { razaoSocial: string; nomeFantasia: string | null } | null
  notaFiscal?: string | null
  precoUnitario?: number | string | { toString(): string } | null
  destino?: { nome: string } | null
  ordemProducao?: string | null
  colaborador?: { nome: string } | null
  motivo?: string | null
}

/**
 * "Ferramentas Sul · NF 12345 · R$ 52,40", "Torno CNC 03 · OP 2026-0457 · Carlos Pereira",
 * ou o motivo. O preço só aparece para quem pode ver preços (RN-05b).
 */
export function contextoDaMovimentacao(m: DadosDoContexto, verPrecos: boolean): string {
  const partes: (string | null | undefined)[] =
    m.tipo === 'COMPRA'
      ? [
          m.fornecedor ? (m.fornecedor.nomeFantasia ?? m.fornecedor.razaoSocial) : null,
          m.notaFiscal ? `NF ${m.notaFiscal}` : null,
          verPrecos && m.precoUnitario != null ? formatarMoeda(m.precoUnitario) : null,
        ]
      : [
          m.destino?.nome,
          m.ordemProducao ? `OP ${m.ordemProducao}` : null,
          m.colaborador?.nome,
          m.motivo,
        ]
  return partes.filter(Boolean).join(' · ') || '—'
}
