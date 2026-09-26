/**
 * Arredonda para cima ignorando o ruído de ponto flutuante
 * (ex.: 0.1 * 30 = 3.0000000000000004 deve virar 3, não 4).
 */
export function arredondarParaCima(valor: number): number {
  return Math.ceil(Number(valor.toFixed(6)))
}

export function ehInteiroPositivo(valor: number): boolean {
  return Number.isInteger(valor) && valor > 0
}

export function ehInteiroNaoNegativo(valor: number): boolean {
  return Number.isInteger(valor) && valor >= 0
}
