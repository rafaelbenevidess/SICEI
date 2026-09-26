import type { ErrosDeCampo } from '@/domain/schemas/comum'

/** Erro de regra de negócio: a mensagem é mostrada ao usuário como está. */
export class ErroDeNegocio extends Error {
  constructor(
    mensagem: string,
    public readonly erros: ErrosDeCampo = {},
  ) {
    super(mensagem)
    this.name = 'ErroDeNegocio'
  }
}

export function naoEncontrado(oQue: string): ErroDeNegocio {
  return new ErroDeNegocio(`${oQue} não encontrado.`)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Confere o formato do id antes de ir ao banco (evita erro de conversão para uuid). */
export function exigirUuid(id: string, oQue: string): string {
  if (!UUID.test(id)) throw naoEncontrado(oQue)
  return id
}

export function ehUuid(id: string): boolean {
  return UUID.test(id)
}

/** Código do PostgreSQL/Prisma para violação de unicidade. */
export function ehViolacaoDeUnicidade(e: unknown): boolean {
  const erro = e as { code?: string; cause?: { code?: string } } | null
  return erro?.code === 'P2002' || erro?.code === '23505' || erro?.cause?.code === '23505'
}
