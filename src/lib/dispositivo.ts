/**
 * Resumo legível do navegador que registrou uma operação (RN-09): "Celular · Chrome Android",
 * "Computador · Edge". O texto completo continua gravado no banco.
 */
export function descreverDispositivo(ua: string | null | undefined): string {
  if (!ua) return '—'
  if (ua === 'seed') return 'Carga inicial'
  const celular = /Android|iPhone|iPad|Mobile/i.test(ua)
  const navegador = /Edg\//.test(ua)
    ? 'Edge'
    : /Firefox\//.test(ua)
      ? 'Firefox'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : null
  const sistema = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : null
  if (!navegador) return celular ? 'Celular' : 'Computador'
  return `${celular ? 'Celular' : 'Computador'} · ${navegador}${sistema ? ` ${sistema}` : ''}`
}
