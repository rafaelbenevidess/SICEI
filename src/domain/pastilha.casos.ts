import type { CasoDeTeste } from './tipos'
import type { FormaDaPastilha } from './pastilha'

type Esperado = Pick<FormaDaPastilha, 'nome' | 'temFuro' | 'positiva' | 'reconhecida'>

/** Designações ISO 1832; as seis primeiras são os itens dos dados de demonstração. */
export const casosFormaDaPastilha: CasoDeTeste<string | null, Esperado>[] = [
  {
    descricao: 'CNMG 120408 → losango 80°, com furo, negativa',
    entrada: 'CNMG 120408',
    esperado: { nome: 'Losango 80°', temFuro: true, positiva: false, reconhecida: true },
  },
  {
    descricao: 'WNMG 080408 → trigonal',
    entrada: 'WNMG 080408',
    esperado: { nome: 'Trigonal', temFuro: true, positiva: false, reconhecida: true },
  },
  {
    descricao: 'DNMG 150608 → losango 55°',
    entrada: 'DNMG 150608',
    esperado: { nome: 'Losango 55°', temFuro: true, positiva: false, reconhecida: true },
  },
  {
    descricao: 'APMT 1604PDER → paralelogramo 85°, positiva (folga P)',
    entrada: 'APMT 1604PDER',
    esperado: { nome: 'Paralelogramo 85°', temFuro: true, positiva: true, reconhecida: true },
  },
  {
    descricao: 'SPMG 07T308 → quadrada, positiva',
    entrada: 'SPMG 07T308',
    esperado: { nome: 'Quadrada', temFuro: true, positiva: true, reconhecida: true },
  },
  {
    descricao: '16ER 1.5 ISO (rosca externa) → triangular de rosca',
    entrada: '16ER 1.5 ISO',
    esperado: { nome: 'Triangular (rosca)', temFuro: true, positiva: true, reconhecida: true },
  },
  {
    descricao: 'cnmg120408, minúsculo e sem espaço → o mesmo losango 80°',
    entrada: 'cnmg120408',
    esperado: { nome: 'Losango 80°', temFuro: true, positiva: false, reconhecida: true },
  },
  {
    descricao: 'TNMG 160404 → triangular',
    entrada: 'TNMG 160404',
    esperado: { nome: 'Triangular', temFuro: true, positiva: false, reconhecida: true },
  },
  {
    descricao: 'VBMT 160404 → losango 35°, positiva',
    entrada: 'VBMT 160404',
    esperado: { nome: 'Losango 35°', temFuro: true, positiva: true, reconhecida: true },
  },
  {
    descricao: 'RCMT 1204M0 → redonda',
    entrada: 'RCMT 1204M0',
    esperado: { nome: 'Redonda', temFuro: true, positiva: true, reconhecida: true },
  },
  {
    descricao: 'SNMN 120408 → quadrada sem furo (4ª letra N)',
    entrada: 'SNMN 120408',
    esperado: { nome: 'Quadrada', temFuro: false, positiva: false, reconhecida: true },
  },
  {
    descricao: 'item sem ISO → desenho genérico, não reconhecida',
    entrada: null,
    esperado: {
      nome: 'Formato não identificado',
      temFuro: true,
      positiva: false,
      reconhecida: false,
    },
  },
  {
    descricao: 'XYZ-123 (não é ISO 1832) → desenho genérico',
    entrada: 'XYZ-123',
    esperado: {
      nome: 'Formato não identificado',
      temFuro: true,
      positiva: false,
      reconhecida: false,
    },
  },
]
