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

export const casosLeituraQr: CasoDeTeste<string, string | null>[] = [
  {
    descricao: 'URL impressa na etiqueta → A01-G03-C04',
    entrada: 'https://sicei-ddausinagem.vercel.app/p/A01-G03-C04',
    esperado: 'A01-G03-C04',
  },
  {
    descricao: 'etiqueta já impressa com o endereço antigo (sicei-ddametalurgica) → A01-G03-C04',
    entrada: 'https://sicei-ddametalurgica.vercel.app/p/A01-G03-C04',
    esperado: 'A01-G03-C04',
  },
  {
    descricao: 'URL de teste local, com barra no fim → A02-G01-C07',
    entrada: 'http://localhost:3000/p/A02-G01-C07/',
    esperado: 'A02-G01-C07',
  },
  {
    descricao: 'só o código, em minúsculas e com espaços → A01-G03-C04',
    entrada: '  a01-g03-c04 ',
    esperado: 'A01-G03-C04',
  },
  {
    descricao: 'código sem zeros na URL "A1-G3-C4" → A01-G03-C04 (mesma tolerância da digitação)',
    entrada: 'https://sicei-ddausinagem.vercel.app/p/A1-G3-C4',
    esperado: 'A01-G03-C04',
  },
  {
    descricao: 'código incompleto na URL "A1-G3" → não é etiqueta do SICEI',
    entrada: 'https://sicei-ddausinagem.vercel.app/p/A1-G3',
    esperado: null,
  },
  {
    descricao: 'outra página do sistema → não é etiqueta',
    entrada: 'https://sicei-ddausinagem.vercel.app/itens/123',
    esperado: null,
  },
  {
    descricao: 'QR de outro site com caminho /p/<código> → usa só o código, sem sair do SICEI',
    entrada: 'https://outro-site.com/p/A05-G02-C01',
    esperado: 'A05-G02-C01',
  },
  {
    descricao: 'texto qualquer (ex.: QR de nota fiscal) → não é etiqueta',
    entrada: 'NF-e 35260912345678000190550010000123451000123456',
    esperado: null,
  },
  {
    descricao: 'nível 00 é inválido → não é etiqueta',
    entrada: 'A00-G01-C01',
    esperado: null,
  },
]

export const casosPosicaoDigitada: CasoDeTeste<string, string | null>[] = [
  {
    descricao: 'sem traços e sem zeros "a4g2c1" → A04-G02-C01',
    entrada: 'a4g2c1',
    esperado: 'A04-G02-C01',
  },
  {
    descricao: 'com espaços "A4 G2 C1" → A04-G02-C01',
    entrada: 'A4 G2 C1',
    esperado: 'A04-G02-C01',
  },
  {
    descricao: 'já no padrão, em minúsculas "a01-g03-c04" → A01-G03-C04',
    entrada: 'a01-g03-c04',
    esperado: 'A01-G03-C04',
  },
  { descricao: 'nível 0 "a0g1c1" → não é posição', entrada: 'a0g1c1', esperado: null },
  { descricao: 'faltando o compartimento "a1g1" → não é posição', entrada: 'a1g1', esperado: null },
  { descricao: 'código de item "PST-001" → não é posição', entrada: 'PST-001', esperado: null },
]
