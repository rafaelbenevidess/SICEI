/**
 * Dados do produto e da licença, num lugar só. O SICEI pertence ao titular abaixo;
 * cada empresa cliente usa o sistema sob licença, numa instalação própria
 * (sicei-<empresa>.vercel.app), e o nome dela vem da variável SICEI_LICENCIADA.
 *
 * Titular e contato são fictícios até a marca definitiva ser escolhida:
 * para trocar, basta editar este arquivo.
 */
export const PRODUTO = {
  sigla: 'SICEI',
  nome: 'Sistema Inteligente de Controle de Estoques Industriais',
  titular: 'Benevides Soluções Industriais',
  contatoComercial: 'comercial@sicei.exemplo.com.br',
  anoInicial: 2026,
} as const

/** "2026" no primeiro ano; "2026–2028" depois. */
export function anosDeDireitos(anoAtual: number, anoInicial: number = PRODUTO.anoInicial): string {
  return anoAtual > anoInicial ? `${anoInicial}–${anoAtual}` : String(anoInicial)
}

/** Empresa licenciada desta instalação, ou null se a variável não foi configurada. */
export function licenciada(
  valor: string | undefined = process.env.SICEI_LICENCIADA,
): string | null {
  const nome = valor?.trim()
  return nome ? nome : null
}
