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

/** Logo de uma empresa licenciada: arquivo em `public/licenciadas/` e o tamanho original. */
export interface LogoDaLicenciada {
  src: string
  largura: number
  altura: number
}

/**
 * Logos das licenciadas, pela chave do nome ("DDA Metalúrgica" → "dda-metalurgica"). A logo
 * aparece só na tela de login da instalação daquela empresa; sem logo aqui, o login fica só com
 * a marca do SICEI. Os arquivos precisam ter fundo transparente.
 */
export const LOGOS_DAS_LICENCIADAS: Record<string, LogoDaLicenciada> = {
  'dda-metalurgica': { src: '/licenciadas/dda-metalurgica.png', largura: 339, altura: 161 },
}

/** "DDA Metalúrgica" → "dda-metalurgica": minúsculas, sem acentos, palavras ligadas por hífen. */
export function chaveDaLicenciada(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Logo da licenciada desta instalação, ou null se ela não tiver logo cadastrada. */
export function logoDaLicenciada(nome: string | null = licenciada()): LogoDaLicenciada | null {
  return nome ? (LOGOS_DAS_LICENCIADAS[chaveDaLicenciada(nome)] ?? null) : null
}
