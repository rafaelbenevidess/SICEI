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
