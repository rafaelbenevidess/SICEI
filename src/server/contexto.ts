import type { Perfil } from '@/domain/tipos'

/** Quem está executando a ação, e de onde (RN-09, RN-23). */
export interface Ator {
  usuarioId: string
  login: string
  perfil: Perfil
  ip: string | null
  userAgent: string | null
}

/** Ator usado pelas rotinas automáticas (seed, rotina diária). */
export const SISTEMA = { usuarioId: null, ip: null, userAgent: 'rotina do sistema' } as const
