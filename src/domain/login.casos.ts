import type { CasoDeTeste } from './tipos'

export const casosLogin: CasoDeTeste<
  { nome: string; sobrenome: string; existentes: string[] },
  string
>[] = [
  {
    descricao: 'exemplo do doc 01: João + da Silva → joao.silva',
    entrada: { nome: 'João', sobrenome: 'da Silva', existentes: [] },
    esperado: 'joao.silva',
  },
  {
    descricao: 'exemplo do doc 01: Maria Aparecida + de Souza → maria.souza',
    entrada: { nome: 'Maria Aparecida', sobrenome: 'de Souza', existentes: [] },
    esperado: 'maria.souza',
  },
  {
    descricao: 'critério do RF-02: joao.silva já existe → joao.silva2',
    entrada: { nome: 'João', sobrenome: 'Silva', existentes: ['joao.silva'] },
    esperado: 'joao.silva2',
  },
  {
    descricao: 'joao.silva e joao.silva2 existem → joao.silva3',
    entrada: { nome: 'Joao', sobrenome: 'Silva', existentes: ['joao.silva', 'joao.silva2'] },
    esperado: 'joao.silva3',
  },
  {
    descricao: 'usa o último sobrenome: Carlos + Pereira dos Santos → carlos.santos',
    entrada: { nome: 'Carlos', sobrenome: 'Pereira dos Santos', existentes: [] },
    esperado: 'carlos.santos',
  },
  {
    descricao: "acentos, cedilha e apóstrofo: Conceição + D'Ávila → conceicao.davila",
    entrada: { nome: 'Conceição', sobrenome: "D'Ávila", existentes: [] },
    esperado: 'conceicao.davila',
  },
  {
    descricao: 'maiúsculas e espaços extras: "  ANA  " + " LIMA " → ana.lima',
    entrada: { nome: '  ANA  ', sobrenome: ' LIMA ', existentes: [] },
    esperado: 'ana.lima',
  },
]
