/**
 * Política de senha, senha provisória e bloqueio (doc 01, RN-21, RN-21a e RN-22).
 * A comparação com as últimas senhas é feita no servidor (hash); aqui entra só o resultado.
 */

export const TAMANHO_MINIMO_SENHA = 10
export const TAMANHO_MAXIMO_SENHA = 128
export const TAMANHO_SENHA_PROVISORIA = 12
export const LIMITE_FALHAS_LOGIN = 5
export const LIMITE_TENTATIVAS_POR_IP = 20
export const JANELA_TENTATIVAS_IP_MINUTOS = 15

/** Sem caracteres que se confundem: 0/O/o, 1/l/I. */
export const ALFABETO_SENHA_PROVISORIA = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

/** RN-22: devolve a lista de problemas; lista vazia significa senha aceita. */
export function problemasDaSenha(entrada: {
  senha: string
  login: string
  repeteUmaDasUltimas: boolean
}): string[] {
  const { senha, login, repeteUmaDasUltimas } = entrada
  const problemas: string[] = []
  if (senha.length < TAMANHO_MINIMO_SENHA)
    problemas.push(`A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`)
  if (senha.length > TAMANHO_MAXIMO_SENHA)
    problemas.push(`A senha pode ter no máximo ${TAMANHO_MAXIMO_SENHA} caracteres.`)
  if (senha.trim().toLowerCase() === login.trim().toLowerCase())
    problemas.push('A senha não pode ser igual ao login.')
  if (repeteUmaDasUltimas) problemas.push('A senha não pode repetir nenhuma das 3 últimas.')
  return problemas
}

/** Número aleatório uniforme em [0, limite) usando a Web Crypto, sem viés de módulo. */
export function inteiroAleatorio(limite: number): number {
  const maximoAceito = Math.floor(0x1_0000_0000 / limite) * limite
  const buffer = new Uint32Array(1)
  for (;;) {
    globalThis.crypto.getRandomValues(buffer)
    if (buffer[0] < maximoAceito) return buffer[0] % limite
  }
}

/**
 * RN-21: senha provisória de 12 caracteres sem caracteres ambíguos,
 * com pelo menos uma maiúscula, uma minúscula e um dígito.
 */
export function gerarSenhaProvisoria(
  aleatorio: (limite: number) => number = inteiroAleatorio,
): string {
  for (;;) {
    let senha = ''
    for (let i = 0; i < TAMANHO_SENHA_PROVISORIA; i++) {
      senha += ALFABETO_SENHA_PROVISORIA[aleatorio(ALFABETO_SENHA_PROVISORIA.length)]
    }
    if (/[A-Z]/.test(senha) && /[a-z]/.test(senha) && /[2-9]/.test(senha)) return senha
  }
}

/** RN-22: a conta é bloqueada na quinta falha seguida. */
export function deveBloquear(falhasConsecutivas: number): boolean {
  return falhasConsecutivas >= LIMITE_FALHAS_LOGIN
}

/** Rate limit por IP: no máximo 20 tentativas a cada 15 minutos. */
export function excedeuLimiteDoIp(tentativasNaJanela: number): boolean {
  return tentativasNaJanela >= LIMITE_TENTATIVAS_POR_IP
}

export interface RegraDaSenha {
  regra: string
  /** true = atendida; false = ainda não; null = só o servidor confere (histórico de senhas) */
  ok: boolean | null
}

/** RN-22: checklist mostrada enquanto a pessoa digita a nova senha. */
export function checklistDaSenha(entrada: {
  nova: string
  confirmacao: string
  login: string
}): RegraDaSenha[] {
  const { nova, confirmacao, login } = entrada
  return [
    {
      regra: `Pelo menos ${TAMANHO_MINIMO_SENHA} caracteres`,
      ok: nova.length >= TAMANHO_MINIMO_SENHA && nova.length <= TAMANHO_MAXIMO_SENHA,
    },
    {
      regra: 'Diferente do login',
      ok: nova.length > 0 && nova.trim().toLowerCase() !== login.trim().toLowerCase(),
    },
    { regra: 'Não repete nenhuma das 3 últimas senhas (conferido ao salvar)', ok: null },
    { regra: 'As duas senhas coincidem', ok: nova.length > 0 && nova === confirmacao },
  ]
}

/** A senha pode ser enviada quando todas as regras conferíveis na tela foram atendidas. */
export function senhaProntaParaEnviar(regras: RegraDaSenha[]): boolean {
  return regras.every((r) => r.ok !== false)
}
