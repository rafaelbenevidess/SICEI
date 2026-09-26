import { z } from 'zod'

export type ErrosDeCampo = Record<string, string>

export type ResultadoValidacao<T> = { ok: true; dados: T } | { ok: false; erros: ErrosDeCampo }

/** Primeira mensagem de erro de cada campo. */
export function errosPorCampo(erro: z.ZodError): ErrosDeCampo {
  const erros: ErrosDeCampo = {}
  for (const issue of erro.issues) {
    const campo = issue.path.join('.') || '_'
    if (!(campo in erros)) erros[campo] = issue.message
  }
  return erros
}

export function validar<S extends z.ZodType>(
  schema: S,
  dados: unknown,
): ResultadoValidacao<z.output<S>> {
  const r = schema.safeParse(dados)
  return r.success ? { ok: true, dados: r.data } : { ok: false, erros: errosPorCampo(r.error) }
}

/** Texto obrigatório, com espaços das pontas removidos. */
export const textoObrigatorio = (mensagem: string, max = 200) =>
  z
    .string({ error: mensagem })
    .trim()
    .min(1, { error: mensagem })
    .max(max, { error: `Use no máximo ${max} caracteres.` })

/** Texto opcional: string vazia vira undefined. */
export const textoOpcional = (max = 500) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z
      .string()
      .trim()
      .max(max, { error: `Use no máximo ${max} caracteres.` })
      .optional(),
  )

/** Identificador escolhido numa lista. */
export const idObrigatorio = (mensagem: string) =>
  z.string({ error: mensagem }).trim().min(1, { error: mensagem })

/** Aceita número ou texto de formulário ("12", "12,5"). */
export const numero = (mensagem: string) =>
  z.preprocess(
    (v) => {
      if (typeof v === 'string') {
        const t = v.trim().replace(',', '.')
        return t === '' ? undefined : Number(t)
      }
      return v
    },
    z.number({ error: mensagem }).refine(Number.isFinite, { error: mensagem }),
  )

export const inteiroPositivo = (mensagem: string) =>
  numero(mensagem).refine((n) => Number.isInteger(n) && n > 0, { error: mensagem })

export const inteiroNaoNegativo = (mensagem: string) =>
  numero(mensagem).refine((n) => Number.isInteger(n) && n >= 0, { error: mensagem })

export const inteiroOpcional = (mensagem: string) =>
  z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    inteiroNaoNegativo(mensagem).optional(),
  )
