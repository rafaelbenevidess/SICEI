import type { CasoDeTeste } from './tipos'

export const casosProximoCodigo: CasoDeTeste<string[], string>[] = [
  {
    descricao: 'PST-001 a PST-006 cadastrados → PST-007',
    entrada: ['PST-001', 'PST-002', 'PST-003', 'PST-004', 'PST-005', 'PST-006'],
    esperado: 'PST-007',
  },
  {
    descricao: 'buraco na sequência não é reaproveitado: PST-001 e PST-005 → PST-006',
    entrada: ['PST-001', 'PST-005'],
    esperado: 'PST-006',
  },
  {
    descricao: 'mantém os zeros à esquerda: PT-0012 → PT-0013',
    entrada: ['PT-0011', 'PT-0012'],
    esperado: 'PT-0013',
  },
  {
    descricao: 'passa de 999 sem perder a sequência: PST-999 → PST-1000',
    entrada: ['PST-998', 'PST-999'],
    esperado: 'PST-1000',
  },
  {
    descricao: 'segue a sequência mais usada: 3 PST e 1 IMP → PST-004',
    entrada: ['PST-001', 'PST-002', 'PST-003', 'IMP-050'],
    esperado: 'PST-004',
  },
  {
    descricao: 'minúsculas contam como o mesmo código: pst-001 → PST-002',
    entrada: ['pst-001'],
    esperado: 'PST-002',
  },
  {
    descricao: 'código sem número no fim é ignorado: ESPECIAL e PST-010 → PST-011',
    entrada: ['ESPECIAL', 'PST-010'],
    esperado: 'PST-011',
  },
  {
    descricao: 'nenhum item cadastrado → PST-001',
    entrada: [],
    esperado: 'PST-001',
  },
]

const CADASTRADOS = ['PST-001', 'PST-002', 'PST-006', 'IMP-050']

export const CODIGOS_CADASTRADOS = CADASTRADOS

/** Entrada: o que a pessoa digitou no código do item novo. Esperado: como fica gravado. */
export const casosPadronizarCodigo: CasoDeTeste<string, string>[] = [
  { descricao: '"pst8" vira PST-008 (padrão da sequência)', entrada: 'pst8', esperado: 'PST-008' },
  { descricao: '"PST-8" vira PST-008', entrada: 'PST-8', esperado: 'PST-008' },
  { descricao: '"pst 0012" vira PST-012', entrada: 'pst 0012', esperado: 'PST-012' },
  { descricao: '"imp51" segue a outra sequência: IMP-051', entrada: 'imp51', esperado: 'IMP-051' },
  { descricao: 'sequência nova "abc7" fica ABC7', entrada: 'abc7', esperado: 'ABC7' },
  {
    descricao: 'código livre "especial x" fica ESPECIAL X',
    entrada: ' especial x ',
    esperado: 'ESPECIAL X',
  },
]

/** Entrada: código digitado. Esperado: o código já cadastrado que é o mesmo, ou null. */
export const casosCodigoEquivalente: CasoDeTeste<string, string | null>[] = [
  { descricao: '"pst001" é o PST-001', entrada: 'pst001', esperado: 'PST-001' },
  { descricao: '"PST1" é o PST-001', entrada: 'PST1', esperado: 'PST-001' },
  { descricao: '"PST-006" é ele mesmo', entrada: 'PST-006', esperado: 'PST-006' },
  { descricao: '"PST-007" é livre', entrada: 'PST-007', esperado: null },
  { descricao: '"PST10" não é o PST-001', entrada: 'PST10', esperado: null },
]
