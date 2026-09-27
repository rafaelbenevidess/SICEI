/**
 * Dados do produto e da licença, num lugar só. O SICEI pertence ao titular abaixo;
 * a DDA Metalúrgica usa o sistema sob licença (README, seção "Propriedade e licença").
 *
 * Titular e contato são fictícios até a marca definitiva ser escolhida:
 * para trocar, basta editar este arquivo.
 */
export const PRODUTO = {
  sigla: 'SICEI',
  nome: 'Sistema Inteligente de Controle de Estoques Industriais',
  titular: 'Benevides Soluções Industriais',
  contatoComercial: 'comercial@sicei.exemplo.com.br',
  licenciada: 'DDA Metalúrgica',
  anoInicial: 2026,
} as const

/** "2026" no primeiro ano; "2026–2028" depois. */
export function anosDeDireitos(anoAtual: number, anoInicial: number = PRODUTO.anoInicial): string {
  return anoAtual > anoInicial ? `${anoInicial}–${anoAtual}` : String(anoInicial)
}
