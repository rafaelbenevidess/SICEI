import type { CasoDeTeste } from './tipos'

export const casosCnpj: CasoDeTeste<string, boolean>[] = [
  { descricao: '11.222.333/0001-81 é válido', entrada: '11.222.333/0001-81', esperado: true },
  { descricao: 'o mesmo CNPJ sem pontuação é válido', entrada: '11222333000181', esperado: true },
  {
    descricao: 'dígito verificador errado → inválido',
    entrada: '11.222.333/0001-82',
    esperado: false,
  },
  {
    descricao: 'todos os dígitos iguais → inválido',
    entrada: '11.111.111/1111-11',
    esperado: false,
  },
  { descricao: 'tamanho errado → inválido', entrada: '1122233300018', esperado: false },
  {
    descricao: 'CNPJ alfanumérico (novo formato) 12.ABC.345/01DE-35 é válido',
    entrada: '12.ABC.345/01DE-35',
    esperado: true,
  },
  {
    descricao: 'CNPJ alfanumérico com dígito errado → inválido',
    entrada: '12.ABC.345/01DE-36',
    esperado: false,
  },
  {
    descricao: 'letra no lugar do dígito verificador → inválido',
    entrada: '12ABC34501DE3A',
    esperado: false,
  },
]
