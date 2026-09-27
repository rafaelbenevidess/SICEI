/*
 * Símbolo do SICEI em vetor: o almoxarifado com gavetas, redesenhado a partir do ícone
 * original (512 px). Por ser SVG, fica nítido em qualquer tamanho e densidade de tela.
 */

/** Formas brancas do símbolo, no espaço de 512 × 512 do ícone. */
export const CAMINHO_DO_SIMBOLO =
  'M82 157 132 136V403L82 382ZM154 127 256 83 429 154V425H398V190L257 137 154 175ZM232 184H298V241H232ZM154 251H429V274H154ZM232 294H298V353H232ZM314 294H380V353H314ZM154 364H429V388H154ZM154 333H207V434L154 412Z'

/** Azul do ícone. */
export const AZUL_DO_ICONE = '#1E52DD'

/** Ícone do app: quadrado azul de cantos arredondados com o símbolo branco. */
export function IconeSicei({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden className={className}>
      <rect width="512" height="512" rx="106" fill={AZUL_DO_ICONE} />
      <path d={CAMINHO_DO_SIMBOLO} fill="#fff" />
    </svg>
  )
}

/** Só o símbolo, sem o fundo, na cor do texto (`currentColor`). */
export function SimboloSicei({ className }: { className?: string }) {
  return (
    <svg viewBox="82 83 347 351" aria-hidden className={className} fill="currentColor">
      <path d={CAMINHO_DO_SIMBOLO} />
    </svg>
  )
}
