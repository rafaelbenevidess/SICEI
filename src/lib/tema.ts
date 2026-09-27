/** Tema da interface (claro ou escuro), guardado num cookie para o servidor já mandar o HTML certo. */
export type Tema = 'claro' | 'escuro'

export const COOKIE_TEMA = 'sicei_tema'

/** Qualquer valor diferente de "escuro" vale como claro. */
export function temaDoCookie(valor: string | undefined): Tema {
  return valor === 'escuro' ? 'escuro' : 'claro'
}

export function outroTema(tema: Tema): Tema {
  return tema === 'escuro' ? 'claro' : 'escuro'
}
