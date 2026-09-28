/**
 * Nome e matrícula de quem usa o sistema (RF-02, RN-21d). Funções puras: a mesma regra roda na
 * prévia da tela e no servidor.
 */

/** Partículas que ficam em minúsculas no meio do nome ("Luciana da Silva"). */
const PARTICULAS_DO_NOME = ['de', 'da', 'do', 'dos', 'das', 'e', 'di', 'du', 'del', 'van', 'von']

const maiuscula = (p: string) => p.charAt(0).toLocaleUpperCase('pt-BR') + p.slice(1)

/**
 * Deixa o nome com cara de nome: "LUCIANA DA SILVA RAFAEL" e "luciana da silva rafael" viram
 * "Luciana da Silva Rafael". Nome já escrito com maiúsculas e minúsculas misturadas fica como
 * está, porque a pessoa pode ter escrito assim de propósito ("McArthur", "D'Ávila").
 */
export function formatarNomeProprio(
  texto: string,
  /** sobrenome continua o nome: "da Silva" começa com a partícula em minúsculas */
  opcoes: { sobrenome?: boolean } = {},
): string {
  const limpo = texto.trim().replace(/\s+/g, ' ')
  const temMaiuscula = limpo !== limpo.toLocaleLowerCase('pt-BR')
  const temMinuscula = limpo !== limpo.toLocaleUpperCase('pt-BR')
  if (temMaiuscula && temMinuscula) return limpo
  return limpo
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .map((palavra, i) =>
      (i > 0 || opcoes.sobrenome) && PARTICULAS_DO_NOME.includes(palavra)
        ? palavra
        : palavra.split('-').map(maiuscula).join('-'),
    )
    .join(' ')
}

/** Matrícula sem espaços e em maiúsculas: " 1045 " → "1045", "ab-12" → "AB-12". */
export function normalizarMatricula(texto: string): string {
  return texto.replace(/\s+/g, '').toLocaleUpperCase('pt-BR')
}

/** Matrícula aceita: de 1 a 20 letras, números, ponto, hífen ou barra. */
export function matriculaValida(texto: string): boolean {
  return /^[A-Z0-9][A-Z0-9./-]{0,19}$/.test(normalizarMatricula(texto))
}
