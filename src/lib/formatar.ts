/** Formatação para a tela, sempre no fuso de Santa Catarina (RN-09). */

const FUSO = 'America/Sao_Paulo'

const dataHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const soData = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function formatarDataHora(d: Date | string | null | undefined): string {
  return d ? dataHora.format(new Date(d)).replace(',', '') : '—'
}

export function formatarData(d: Date | string | null | undefined): string {
  return d ? soData.format(new Date(d)) : '—'
}

export function formatarMoeda(
  v: number | string | { toString(): string } | null | undefined,
): string {
  if (v === null || v === undefined) return '—'
  return moeda.format(Number(v.toString()))
}

export function formatarNumero(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : numero.format(v)
}

export function formatarVariacao(v: number | null): string {
  if (v === null) return '—'
  const sinal = v > 0 ? '+' : v < 0 ? '−' : ''
  return `${sinal}${numero.format(Math.abs(v))}%`
}

const diaHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})
const soHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  hour: '2-digit',
  minute: '2-digit',
})
const porExtenso = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** "27/09 15:42": tabelas em que o ano é óbvio. */
export function formatarDiaHora(d: Date | string | null | undefined): string {
  return d ? diaHora.format(new Date(d)).replace(',', '') : '—'
}

/** "15:42" */
export function formatarHora(d: Date | string): string {
  return soHora.format(new Date(d))
}

/** "Sábado, 27 de setembro de 2026" */
export function dataPorExtenso(d: Date | string): string {
  const t = porExtenso.format(new Date(d))
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/** Nome curto da pastilha na tela: "CNMG 120408 · P25"; sem ISO e classe, a descrição. */
export function nomeDaPastilha(i: {
  iso?: string | null
  classe?: string | null
  descricao: string
}): string {
  if (i.iso && i.classe) return `${i.iso} · ${i.classe}`
  return i.iso || i.descricao
}

/**
 * Série diária do mês até hoje, para o gráfico de colunas do painel.
 * totais: soma por dia no formato "2026-09-05" (fuso de São Paulo).
 */
export function serieDoMes(
  hoje: string,
  totais: Record<string, number>,
): { dia: string; rotulo: string; total: number; hoje: boolean }[] {
  const [ano, mes, diaHoje] = hoje.split('-')
  const n = Number(diaHoje)
  return Array.from({ length: n }, (_, i) => {
    const d = String(i + 1).padStart(2, '0')
    const dia = `${ano}-${mes}-${d}`
    return { dia, rotulo: `${d}/${mes}`, total: totais[dia] ?? 0, hoje: i + 1 === n }
  })
}

/** "2026-09-26" (data do formulário) → início do dia em São Paulo, em UTC. */
export function inicioDoDia(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  return new Date(`${iso}T00:00:00-03:00`)
}

/** "2026-09-26" → fim do dia em São Paulo. */
export function fimDoDia(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  return new Date(`${iso}T23:59:59.999-03:00`)
}

/** Data de hoje em São Paulo no formato do input date. */
export function hojeIso(agora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO }).format(agora)
}

export function diasAtrasIso(dias: number, agora = new Date()): string {
  return hojeIso(new Date(agora.getTime() - dias * 86_400_000))
}

export const NOME_TIPO: Record<string, string> = {
  COMPRA: 'Compra',
  DEVOLUCAO_PRODUCAO: 'Devolução da produção',
  AJUSTE_POSITIVO: 'Ajuste positivo',
  CONSUMO_PRODUCAO: 'Consumo da produção',
  PERDA_QUEBRA: 'Perda ou quebra',
  AJUSTE_NEGATIVO: 'Ajuste negativo',
  ESTORNO: 'Estorno',
}

export const NOME_STATUS: Record<string, string> = {
  OK: 'OK',
  ATENCAO: 'Atenção',
  CRITICO: 'Crítico',
  ZERADO: 'Zerado',
}

export const NOME_APLICACAO: Record<string, string> = {
  TORNEAMENTO: 'Torneamento',
  FRESAMENTO: 'Fresamento',
  FURACAO: 'Furação',
  ROSQUEAMENTO: 'Rosqueamento',
  OUTRA: 'Outra',
}

export const NOME_TIPO_DESTINO: Record<string, string> = {
  SETOR: 'Setor',
  MAQUINA: 'Máquina',
  CENTRO_CUSTO: 'Centro de custo',
}

/** Escapa um valor para CSV com ponto e vírgula (padrão do Excel em português). */
export function celulaCsv(v: unknown): string {
  let t = v === null || v === undefined ? '' : String(v)
  // texto que começa com = + - @ (ou tab/CR) viraria fórmula no Excel: prefixa com apóstrofo
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(t)) t = `'${t}`
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

export function gerarCsv(cabecalho: string[], linhas: unknown[][]): string {
  // BOM para o Excel abrir com acentos
  return '﻿' + [cabecalho, ...linhas].map((l) => l.map(celulaCsv).join(';')).join('\r\n')
}
