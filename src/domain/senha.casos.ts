import type { CasoDeTeste } from './tipos'

export const casosSenha: CasoDeTeste<
  { senha: string; login: string; repeteUmaDasUltimas: boolean },
  string[]
>[] = [
  {
    descricao: 'senha com 12 caracteres, diferente do login e nova → aceita',
    entrada: { senha: 'Pastilha2026!', login: 'joao.silva', repeteUmaDasUltimas: false },
    esperado: [],
  },
  {
    descricao: 'critério do RF-01: menos de 10 caracteres → recusada',
    entrada: { senha: 'curta123', login: 'joao.silva', repeteUmaDasUltimas: false },
    esperado: ['A senha precisa ter pelo menos 10 caracteres.'],
  },
  {
    descricao: 'critério do RF-01: igual ao login → recusada',
    entrada: { senha: 'joao.silva', login: 'joao.silva', repeteUmaDasUltimas: false },
    esperado: ['A senha não pode ser igual ao login.'],
  },
  {
    descricao: 'critério do RF-01: repete uma das 3 últimas → recusada',
    entrada: { senha: 'SenhaAntiga2025', login: 'joao.silva', repeteUmaDasUltimas: true },
    esperado: ['A senha não pode repetir nenhuma das 3 últimas.'],
  },
  {
    descricao: 'vários problemas ao mesmo tempo são todos listados',
    entrada: { senha: 'ana.lima', login: 'ana.lima', repeteUmaDasUltimas: true },
    esperado: [
      'A senha precisa ter pelo menos 10 caracteres.',
      'A senha não pode ser igual ao login.',
      'A senha não pode repetir nenhuma das 3 últimas.',
    ],
  },
]

export const casosBloqueio: CasoDeTeste<number, boolean>[] = [
  { descricao: '4 falhas seguidas → ainda não bloqueia', entrada: 4, esperado: false },
  { descricao: 'critério do RF-01: 5ª falha seguida → bloqueia', entrada: 5, esperado: true },
]
