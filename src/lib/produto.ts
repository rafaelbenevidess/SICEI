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

/** Limpa o nome da licenciada; vazio ou ausente vira null. */
export function nomeDaLicenciada(valor: string | undefined): string | null {
  const nome = valor?.trim()
  return nome ? nome : null
}

/** Empresa licenciada desta instalação (variável SICEI_LICENCIADA), ou null se não configurada. */
export function licenciada(): string | null {
  return nomeDaLicenciada(process.env.SICEI_LICENCIADA)
}
