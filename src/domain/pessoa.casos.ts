import type { CasoDeTeste } from './tipos'

/** Entrada: o nome como foi digitado. Esperado: o nome gravado. */
export const casosNomeProprio: CasoDeTeste<string, string>[] = [
  {
    descricao: 'tudo em maiúsculas "LUCIANA DA SILVA RAFAEL" → "Luciana da Silva Rafael"',
    entrada: 'LUCIANA DA SILVA RAFAEL',
    esperado: 'Luciana da Silva Rafael',
  },
  {
    descricao: 'tudo em minúsculas "joão dos santos" → "João dos Santos"',
    entrada: 'joão dos santos',
    esperado: 'João dos Santos',
  },
  {
    descricao: 'espaços sobrando "  MARIA   DE  SOUZA " → "Maria de Souza"',
    entrada: '  MARIA   DE  SOUZA ',
    esperado: 'Maria de Souza',
  },
  {
    descricao: 'nome composto com hífen "ANA-PAULA" → "Ana-Paula"',
    entrada: 'ANA-PAULA',
    esperado: 'Ana-Paula',
  },
  {
    descricao: 'partícula no começo fica maiúscula "DA SILVA" → "Da Silva"',
    entrada: 'DA SILVA',
    esperado: 'Da Silva',
  },
  {
    descricao: 'já misturado de propósito "McArthur" → fica como está',
    entrada: 'McArthur',
    esperado: 'McArthur',
  },
]

/** Entrada: a matrícula digitada. Esperado: normalizada e se é aceita. */
export const casosMatricula: CasoDeTeste<string, { matricula: string; valida: boolean }>[] = [
  {
    descricao: '" 1045 " → "1045", aceita',
    entrada: ' 1045 ',
    esperado: { matricula: '1045', valida: true },
  },
  {
    descricao: '"ab-12" → "AB-12", aceita',
    entrada: 'ab-12',
    esperado: { matricula: 'AB-12', valida: true },
  },
  {
    descricao: '"12 34" → "1234", aceita (espaço some)',
    entrada: '12 34',
    esperado: { matricula: '1234', valida: true },
  },
  { descricao: 'vazia → recusada', entrada: '   ', esperado: { matricula: '', valida: false } },
  {
    descricao: 'com símbolo "10#45" → recusada',
    entrada: '10#45',
    esperado: { matricula: '10#45', valida: false },
  },
  {
    descricao: 'com 21 caracteres → recusada',
    entrada: '123456789012345678901',
    esperado: { matricula: '123456789012345678901', valida: false },
  },
]

/** Entrada: o sobrenome digitado. Esperado: o sobrenome gravado (partícula inicial minúscula). */
export const casosSobrenome: CasoDeTeste<string, string>[] = [
  {
    descricao: 'sobrenome "DA SILVA RAFAEL" → "da Silva Rafael"',
    entrada: 'DA SILVA RAFAEL',
    esperado: 'da Silva Rafael',
  },
  { descricao: 'sobrenome "SOUZA" → "Souza"', entrada: 'SOUZA', esperado: 'Souza' },
]
