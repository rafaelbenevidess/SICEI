/**
 * Contas de apresentação do painel geral (RF-16). O painel só mostra o que as consultas
 * devolvem; aqui ficam as escalas e os resumos que a tela desenha, para serem testáveis.
 */

/** Parte dos itens ativos que está acima do ponto de reposição (status OK). */
export function saudeDoEstoque(contagem: {
  OK: number
  ATENCAO: number
  CRITICO: number
  ZERADO: number
}): { total: number; emDia: number; emAlerta: number; percentual: number | null } {
  const total = contagem.OK + contagem.ATENCAO + contagem.CRITICO + contagem.ZERADO
  return {
    total,
    emDia: contagem.OK,
    emAlerta: total - contagem.OK,
    // sem itens não há percentual: a tela mostra um traço, não 0% nem 100%
    percentual: total > 0 ? Math.round((contagem.OK / total) * 100) : null,
  }
}

/** Quantos traços do medidor ficam acesos para um percentual (0 a 100). */
export function tracosAcesos(percentual: number | null, tracos: number): number {
  if (percentual === null) return 0
  const p = Math.min(100, Math.max(0, percentual))
  const acesos = Math.round((p / 100) * tracos)
  // qualquer valor acima de zero acende pelo menos um traço; só 100% acende todos
  if (p > 0 && acesos === 0) return 1
  if (p < 100 && acesos === tracos) return tracos - 1
  return acesos
}

const PASSOS = [1, 2, 5]

/**
 * Consumo por dia em pontos empilhados. Cada ponto vale 1, 2, 5, 10, 20, 50… unidades: o
 * menor valor "redondo" que faz o dia de maior consumo caber em `linhas` pontos.
 * Dia com consumo sempre tem pelo menos um ponto.
 */
export function matrizDePontos(
  totais: number[],
  linhas: number,
): { unidadesPorPonto: number; pontos: number[] } {
  const maior = Math.max(0, ...totais)
  let unidadesPorPonto = 1
  for (let potencia = 1; Math.ceil(maior / unidadesPorPonto) > linhas; potencia *= 10) {
    const passo = PASSOS.find((p) => Math.ceil(maior / (p * potencia)) <= linhas)
    unidadesPorPonto = passo ? passo * potencia : 10 * potencia
  }
  return {
    unidadesPorPonto,
    pontos: totais.map((t) => (t > 0 ? Math.max(1, Math.round(t / unidadesPorPonto)) : 0)),
  }
}

/**
 * Posições, em % da largura, de uma barra que compara um valor com uma referência
 * (consumo do mês × mês anterior). A escala é o maior dos dois, com 8% de folga.
 */
export function escalaDaComparacao(
  valor: number,
  referencia: number,
): { valor: number; referencia: number } {
  const escala = Math.max(valor, referencia, 1) * 1.08
  const pct = (v: number) => Math.round(Math.min(100, Math.max(0, (v / escala) * 100)) * 10) / 10
  return { valor: pct(valor), referencia: pct(referencia) }
}

/** Variação percentual inteira entre dois períodos; null quando o anterior é zero. */
export function variacaoDoMes(atual: number, anterior: number): number | null {
  if (!(anterior > 0)) return null
  return Math.round(((atual - anterior) / anterior) * 100)
}

/** Média por dia decorrido do mês, com uma casa decimal. */
export function mediaDiaria(total: number, dias: number): number {
  if (!(dias > 0)) return 0
  return Math.round((total / dias) * 10) / 10
}

/** Há quanto tempo o alerta está aberto: "hoje", "há 1 dia", "há 12 dias". */
export function tempoAberto(abertoEm: Date, agora: Date): string {
  const dias = Math.floor((agora.getTime() - abertoEm.getTime()) / 86_400_000)
  if (dias <= 0) return 'hoje'
  return dias === 1 ? 'há 1 dia' : `há ${dias} dias`
}

/** Quantos dias tem o mês de uma data "2026-11-12" (fevereiro de ano bissexto tem 29). */
export function diasDoMes(dataIso: string): number {
  const [ano, mes] = dataIso.split('-').map(Number)
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate()
}
