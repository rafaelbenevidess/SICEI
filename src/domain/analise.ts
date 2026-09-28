/**
 * RF-17a: contas do painel analítico dos relatórios. Funções puras: o servidor só agrega os
 * números por dia, e a tela monta os gráficos com estas funções, inclusive quando o gestor
 * filtra clicando num gráfico.
 */

export type TamanhoDoBalde = 'dia' | 'semana' | 'mes'

export interface Balde {
  /** chave estável do balde: "2026-09-14" (dia ou segunda-feira da semana) ou "2026-09" */
  chave: string
  /** primeiro dia do balde, "AAAA-MM-DD" */
  inicio: string
  rotulo: string
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** "2026-09-14" → Date em UTC (as contas de calendário ficam livres de fuso). */
function utc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}
function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function somarDias(isoData: string, dias: number): string {
  const d = utc(isoData)
  d.setUTCDate(d.getUTCDate() + dias)
  return iso(d)
}

/** Dias corridos entre as duas datas, contando as duas. */
export function diasNoPeriodo(deIso: string, ateIso: string): number {
  return Math.max(1, Math.round((utc(ateIso).getTime() - utc(deIso).getTime()) / 86_400_000) + 1)
}

/** Até 45 dias, um ponto por dia; até 200, por semana; acima disso, por mês. */
export function tamanhoDoBalde(dias: number): TamanhoDoBalde {
  return dias <= 45 ? 'dia' : dias <= 200 ? 'semana' : 'mes'
}

/** Balde de uma data: o próprio dia, a segunda-feira da semana ou o mês. */
export function chaveDoBalde(dataIso: string, tamanho: TamanhoDoBalde): string {
  if (tamanho === 'dia') return dataIso
  if (tamanho === 'mes') return dataIso.slice(0, 7)
  const d = utc(dataIso)
  const desdeSegunda = (d.getUTCDay() + 6) % 7
  return somarDias(dataIso, -desdeSegunda)
}

function rotuloDoBalde(inicio: string, tamanho: TamanhoDoBalde): string {
  const [ano, mes, dia] = inicio.split('-')
  if (tamanho === 'mes') return `${MESES[Number(mes) - 1]}/${ano.slice(2)}`
  return `${dia}/${mes}`
}

/** Os baldes do período, em ordem, sem buracos (dias sem consumo aparecem como zero). */
export function baldesDoPeriodo(deIso: string, ateIso: string, tamanho: TamanhoDoBalde): Balde[] {
  const baldes: Balde[] = []
  const vistos = new Set<string>()
  for (let d = deIso; d <= ateIso; d = somarDias(d, 1)) {
    const chave = chaveDoBalde(d, tamanho)
    if (vistos.has(chave)) continue
    vistos.add(chave)
    baldes.push({
      chave,
      inicio: d,
      rotulo: rotuloDoBalde(
        tamanho === 'dia' ? d : chave.length === 7 ? `${chave}-01` : chave,
        tamanho,
      ),
    })
  }
  return baldes
}

/** Soma as quantidades de cada dia no balde certo. Datas fora do período são ignoradas. */
export function serieNoTempo(
  registros: { dia: string; quantidade: number }[],
  baldes: Balde[],
  tamanho: TamanhoDoBalde,
): number[] {
  const indice = new Map(baldes.map((b, i) => [b.chave, i]))
  const serie = baldes.map(() => 0)
  for (const r of registros) {
    const i = indice.get(chaveDoBalde(r.dia, tamanho))
    if (i !== undefined) serie[i] += r.quantidade
  }
  return serie
}

/** O período imediatamente anterior, com o mesmo número de dias (para comparar). */
export function periodoAnterior(deIso: string, ateIso: string): { deIso: string; ateIso: string } {
  const dias = diasNoPeriodo(deIso, ateIso)
  return { deIso: somarDias(deIso, -dias), ateIso: somarDias(deIso, -1) }
}

/** Variação percentual do anterior para o atual; sem base (anterior zero), não há percentual. */
export function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return Math.round(((atual - anterior) / anterior) * 1000) / 10
}

export interface Parcela {
  chave: string
  nome: string
  total: number
}

/**
 * Os maiores e o resto somado em "Outros". O gráfico mostra no máximo n cores: passar disso
 * confunde a leitura, e uma cor a mais não se distingue das outras para quem é daltônico.
 */
export function maioresEOutros(parcelas: Parcela[], n: number): Parcela[] {
  const ordenadas = [...parcelas].sort(
    (a, b) => b.total - a.total || a.chave.localeCompare(b.chave),
  )
  if (ordenadas.length <= n) return ordenadas
  const resto = ordenadas.slice(n).reduce((s, p) => s + p.total, 0)
  return [
    ...ordenadas.slice(0, n),
    { chave: 'Outros', nome: `${ordenadas.length - n} outros`, total: resto },
  ]
}

/**
 * Mapa de calor dia da semana × hora: 7 linhas (segunda a domingo) e 24 colunas.
 * diaSemana segue o JavaScript e o PostgreSQL (0 = domingo).
 */
export function mapaDeCalor(
  registros: { diaSemana: number; hora: number; quantidade: number }[],
): number[][] {
  const matriz = Array.from({ length: 7 }, () => Array<number>(24).fill(0))
  for (const r of registros) {
    if (r.hora < 0 || r.hora > 23 || r.diaSemana < 0 || r.diaSemana > 6) continue
    matriz[(r.diaSemana + 6) % 7][r.hora] += r.quantidade
  }
  return matriz
}

/**
 * Topo do eixo numa conta redonda: o menor passo 1, 2, 2,5 ou 5 vezes uma potência de 10 que
 * cobre o máximo em até 5 intervalos. Assim 48 vira um eixo de 0 a 50, e não de 0 a 60.
 */
export function escalaDoEixo(maximo: number, intervalos = 5): { topo: number; passos: number[] } {
  if (maximo <= 0) return { topo: 1, passos: [0, 1] }
  const base = 10 ** Math.floor(Math.log10(maximo / intervalos))
  const candidatos = [1, 2, 2.5, 5, 10, 20].map((m) => m * base)
  const passo = candidatos.find((p) => Math.ceil(maximo / p) <= intervalos)!
  const topo = Math.ceil(maximo / passo) * passo
  const passos: number[] = []
  for (let k = 0; k * passo <= topo + passo / 2; k++)
    passos.push(Math.round(k * passo * 1000) / 1000)
  return { topo, passos }
}
