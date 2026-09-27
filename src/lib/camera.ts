/**
 * Mensagem para quem está no almoxarifado quando a câmera não abre. O nome vem do
 * DOMException de getUserMedia (NotAllowedError, NotFoundError...).
 */
export function mensagemDoErroDeCamera(nome: string | undefined): string {
  switch (nome) {
    case 'SemSuporte':
      return 'Este navegador não deixa o SICEI usar a câmera. Atualize o navegador ou digite o código da etiqueta abaixo.'
    case 'ConexaoInsegura':
      return 'A câmera só abre em conexão segura (https). Use o endereço oficial do SICEI.'
    case 'NotAllowedError':
    case 'SecurityError':
      return 'O acesso à câmera foi negado. Libere a câmera para este site nas configurações do navegador e toque em "Tentar de novo".'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'Nenhuma câmera encontrada neste aparelho. Digite o código da etiqueta abaixo.'
    case 'NotReadableError':
    case 'AbortError':
      return 'A câmera está sendo usada por outro aplicativo. Feche-o e toque em "Tentar de novo".'
    default:
      return 'Não foi possível abrir a câmera. Toque em "Tentar de novo" ou digite o código da etiqueta abaixo.'
  }
}

/** Tamanho da imagem analisada: o lado maior fica em até `maximo` pixels, sem esticar. */
export function tamanhoDeAnalise(
  largura: number,
  altura: number,
  maximo = 640,
): { largura: number; altura: number } {
  if (largura <= 0 || altura <= 0) return { largura: 0, altura: 0 }
  const escala = Math.min(1, maximo / Math.max(largura, altura))
  return { largura: Math.round(largura * escala), altura: Math.round(altura * escala) }
}
