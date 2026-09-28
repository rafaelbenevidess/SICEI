import { chaveDaLicenciada } from '@/lib/produto'
import { LogoDdaMetalurgica } from './LogoDdaMetalurgica'

/**
 * Licenciadas que têm logo, pela chave do nome ("DDA Usinagem Industrial" →
 * "dda-usinagem-industrial"). A DDA tem as duas chaves: o nome antigo continua valendo.
 */
export const LICENCIADAS_COM_LOGO = ['dda-usinagem-industrial', 'dda-metalurgica'] as const

/** A licenciada tem logo cadastrada? */
export function temLogo(nome: string | null): boolean {
  return (
    nome !== null && (LICENCIADAS_COM_LOGO as readonly string[]).includes(chaveDaLicenciada(nome))
  )
}

/**
 * Logo da licenciada: SVG sem fundo, na cor do texto em volta. Aparece só na tela de login da
 * instalação daquela empresa; sem logo cadastrada, não desenha nada.
 */
export function LogoDaLicenciada({
  nome,
  className,
  titulo,
}: {
  nome: string
  className?: string
  /** nome lido pelo leitor de tela; sem ele, a logo é decorativa */
  titulo?: string
}) {
  switch (chaveDaLicenciada(nome)) {
    case 'dda-usinagem-industrial':
    case 'dda-metalurgica':
      return <LogoDdaMetalurgica className={className} titulo={titulo} />
    default:
      return null
  }
}
