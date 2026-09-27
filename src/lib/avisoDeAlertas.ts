/**
 * Pop-up de alertas sem ciente (RF-13): aparece depois do login para quem pode dar ciente e
 * some só quando a pessoa passa pela tela de alertas.
 */
export const COOKIE_AVISO_ALERTAS = 'sicei_aviso_alertas'

/** A pessoa já passou pela tela de alertas nesta sessão? Depois disso o aviso não volta. */
export function avisoJaVisto(jaVisto: boolean, caminho: string): boolean {
  return jaVisto || caminho === '/alertas' || caminho.startsWith('/alertas/')
}

export function mostrarAvisoDeAlertas(entrada: {
  /** o login marcou o aviso e a pessoa ainda não foi à tela de alertas */
  marcado: boolean
  podeDarCiente: boolean
  semCiente: number
  caminho: string
}): boolean {
  const naTelaDeAlertas = entrada.caminho === '/alertas' || entrada.caminho.startsWith('/alertas/')
  return entrada.marcado && entrada.podeDarCiente && entrada.semCiente > 0 && !naTelaDeAlertas
}

/** "Existe 1 alerta sem ciente" / "Existem 3 alertas sem ciente". */
export function tituloDoAvisoDeAlertas(semCiente: number): string {
  return semCiente === 1 ? 'Existe 1 alerta sem ciente' : `Existem ${semCiente} alertas sem ciente`
}
