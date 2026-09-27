import type { CasoDeTeste } from './tipos'

const itens = [
  {
    codigo: 'PST-001',
    descricao: 'Pastilha CNMG 120408 PM 4325',
    iso: 'CNMG 120408',
    classe: 'P25',
    posicao: 'A01-G01-C01',
  },
  {
    codigo: 'PST-002',
    descricao: 'Pastilha WNMG 080408 M15',
    iso: 'WNMG 080408',
    classe: 'M15',
    posicao: 'A01-G01-C02',
  },
  {
    codigo: 'PST-010',
    descricao: 'Pastilha de rosca externa',
    iso: '16ER 1.5 ISO',
    classe: 'M20',
    posicao: null,
  },
  {
    codigo: 'IMP-3013-1',
    descricao: 'Pastilha importada',
    iso: 'TNMG 160404',
    classe: 'P15',
    posicao: 'A04-G02-C01',
  },
]

export const ITENS_DE_EXEMPLO = itens

/** Entrada: o que a pessoa digitou. Esperado: códigos encontrados, na ordem mostrada. */
export const casosBusca: CasoDeTeste<string, string[]>[] = [
  { descricao: 'print do celular: "Pst001" → PST-001', entrada: 'Pst001', esperado: ['PST-001'] },
  {
    descricao: '"pst 1" (sem zeros e com espaço) → PST-001',
    entrada: 'pst 1',
    esperado: ['PST-001'],
  },
  { descricao: '"PST-1" → PST-001 (e não PST-010)', entrada: 'PST-1', esperado: ['PST-001'] },
  {
    descricao: '"pst" → todos os PST, em ordem de código',
    entrada: 'pst',
    esperado: ['PST-001', 'PST-002', 'PST-010'],
  },
  {
    descricao: 'posição sem traços "a01g01c02" → PST-002',
    entrada: 'a01g01c02',
    esperado: ['PST-002'],
  },
  {
    descricao: 'posição sem zeros "A1-G1-C1" → PST-001',
    entrada: 'A1-G1-C1',
    esperado: ['PST-001'],
  },
  {
    descricao: 'ISO sem espaço "cnmg120408" → PST-001',
    entrada: 'cnmg120408',
    esperado: ['PST-001'],
  },
  { descricao: 'classe "m15" → PST-002', entrada: 'm15', esperado: ['PST-002'] },
  {
    descricao: 'palavra da descrição sem acento "importada" → IMP-3013-1',
    entrada: 'importada',
    esperado: ['IMP-3013-1'],
  },
  {
    descricao: 'duas palavras "wnmg m15" → PST-002',
    entrada: 'wnmg m15',
    esperado: ['PST-002'],
  },
  {
    descricao: 'código exato vem antes do que só contém: "imp30131" → IMP-3013-1',
    entrada: 'imp30131',
    esperado: ['IMP-3013-1'],
  },
  { descricao: 'nada parecido "xyz" → nenhum', entrada: 'xyz', esperado: [] },
]

export const OPCOES_DE_EXEMPLO = [
  { valor: 'f1', rotulo: 'Ferramentas Sul', busca: ['11.222.333/0001-81', 'Ferramentas Sul Ltda'] },
  { valor: 'f2', rotulo: 'Metal Duro', busca: ['04.252.011/0001-10'] },
  { valor: 'c1', rotulo: 'Carlos Pereira', busca: ['1102', 'Usinagem'] },
  { valor: 'c2', rotulo: 'Juliana Martins', busca: ['1107', 'Almoxarifado'] },
  { valor: 'd1', rotulo: 'Torno CNC 03 (CNC-03)', busca: ['CNC-03'] },
  { valor: 'p1', rotulo: 'A04-G02-C01' },
]

/** Entrada: o que a pessoa digitou numa lista de opções. Esperado: valores achados, em ordem. */
export const casosOpcoes: CasoDeTeste<string, string[]>[] = [
  { descricao: 'nome sem maiúscula "metal" → Metal Duro', entrada: 'metal', esperado: ['f2'] },
  {
    descricao: 'CNPJ só com números "11222333" → Ferramentas Sul',
    entrada: '11222333',
    esperado: ['f1'],
  },
  { descricao: 'sobrenome "pereira" → Carlos Pereira', entrada: 'pereira', esperado: ['c1'] },
  { descricao: 'matrícula "1107" → Juliana Martins', entrada: '1107', esperado: ['c2'] },
  { descricao: 'destino sem zero "cnc 3" → Torno CNC 03', entrada: 'cnc 3', esperado: ['d1'] },
  { descricao: 'posição "a4g2c1" → A04-G02-C01', entrada: 'a4g2c1', esperado: ['p1'] },
  {
    descricao: 'acento não importa: "julianá" → Juliana Martins',
    entrada: 'julianá',
    esperado: ['c2'],
  },
  { descricao: 'nada parecido "zzz" → nenhuma', entrada: 'zzz', esperado: [] },
]
