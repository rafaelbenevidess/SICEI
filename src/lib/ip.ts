/**
 * IP do cliente para o log (RN-09) e para o limite de tentativas por IP (RN-22).
 *
 * O primeiro valor de X-Forwarded-For pode ser inventado pelo próprio cliente. Por isso:
 * 1. vale o X-Real-IP, que o proxy de borda (Vercel, nginx) grava e o cliente não controla;
 * 2. sem ele, vale o ÚLTIMO endereço de X-Forwarded-For, que é o que o proxy mais próximo acrescentou.
 */
export function ipDoCliente(cabecalhos: { get(nome: string): string | null }): string | null {
  const real = cabecalhos.get('x-real-ip')?.trim()
  if (real) return real.slice(0, 64)
  const encaminhados = cabecalhos
    .get('x-forwarded-for')
    ?.split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  return encaminhados?.length ? encaminhados[encaminhados.length - 1].slice(0, 64) : null
}
