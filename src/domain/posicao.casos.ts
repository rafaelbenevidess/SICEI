import type { CasoDeTeste, Decisao } from './tipos'
import type { EnderecoPosicao } from './posicao'

export const casosCodigoPosicao: CasoDeTeste<EnderecoPosicao, Decisao<string>>[] = [
  {
    descricao: 'critério do RF-28: armário 1, gaveta 3, compartimento 4 → A01-G03-C04',
    entrada: { armario: 1, gaveta: 3, compartimento: 4 },
    esperado: { ok: true, valor: 'A01-G03-C04' },
  },
  {
    descricao: 'armário 12, gaveta 10, compartimento 25 → A12-G10-C25',
    entrada: { armario: 12, gaveta: 10, compartimento: 25 },
    esperado: { ok: true, valor: 'A12-G10-C25' },
  },
  {
    descricao: 'gaveta 0 é recusada',
    entrada: { armario: 1, gaveta: 0, compartimento: 4 },
    esperado: {
      ok: false,
      motivo: 'Armário, gaveta e compartimento precisam ser inteiros de 1 a 99.',
    },
  },
  {
    descricao: 'compartimento 100 é recusado',
    entrada: { armario: 1, gaveta: 1, compartimento: 100 },
    esperado: {
      ok: false,
      motivo: 'Armário, gaveta e compartimento precisam ser inteiros de 1 a 99.',
    },
  },
]

export const casosAtribuicao: CasoDeTeste<
  { itemId: string; posicaoAtiva: boolean; ocupadaPorItemId: string | null },
  Decisao<true>
>[] = [
  {
    descricao: 'posição livre e ativa → aceita',
    entrada: { itemId: 'item-1', posicaoAtiva: true, ocupadaPorItemId: null },
    esperado: { ok: true, valor: true },
  },
  {
    descricao: 'critério do RF-28: posição ocupada por outro item → recusada',
    entrada: { itemId: 'item-1', posicaoAtiva: true, ocupadaPorItemId: 'item-2' },
    esperado: { ok: false, motivo: 'Esta posição já está ocupada por outro item.' },
  },
  {
    descricao: 'posição já ocupada pelo próprio item → aceita',
    entrada: { itemId: 'item-1', posicaoAtiva: true, ocupadaPorItemId: 'item-1' },
    esperado: { ok: true, valor: true },
  },
  {
    descricao: 'posição inativa → recusada',
    entrada: { itemId: 'item-1', posicaoAtiva: false, ocupadaPorItemId: null },
    esperado: { ok: false, motivo: 'Esta posição está inativa.' },
  },
]
