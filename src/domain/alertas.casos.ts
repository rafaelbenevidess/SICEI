import type { StatusItem, CasoDeTeste } from './tipos'
import type { AcaoAlerta, NivelAlerta } from './alertas'

export const casosAlerta: CasoDeTeste<
  { nivelAberto: NivelAlerta | null; novoStatus: StatusItem },
  AcaoAlerta
>[] = [
  {
    descricao: 'critério do RF-13: sem alerta, item vai para ATENCAO → abre alerta sem e-mail',
    entrada: { nivelAberto: null, novoStatus: 'ATENCAO' },
    esperado: { acao: 'ABRIR', nivel: 'ATENCAO', enviarEmail: false },
  },
  {
    descricao: 'sem alerta, item vai para CRITICO → abre alerta e envia e-mail',
    entrada: { nivelAberto: null, novoStatus: 'CRITICO' },
    esperado: { acao: 'ABRIR', nivel: 'CRITICO', enviarEmail: true },
  },
  {
    descricao: 'sem alerta e item OK → nada acontece',
    entrada: { nivelAberto: null, novoStatus: 'OK' },
    esperado: { acao: 'NENHUMA' },
  },
  {
    descricao:
      'critério do RF-13: alerta ATENCAO e item piora para CRITICO → o mesmo alerta sobe e envia e-mail',
    entrada: { nivelAberto: 'ATENCAO', novoStatus: 'CRITICO' },
    esperado: { acao: 'ESCALAR', nivel: 'CRITICO', enviarEmail: true },
  },
  {
    descricao: 'critério do RF-14: alerta CRITICO e item continua CRITICO → nenhum e-mail novo',
    entrada: { nivelAberto: 'CRITICO', novoStatus: 'CRITICO' },
    esperado: { acao: 'NENHUMA' },
  },
  {
    descricao: 'critério do RF-14: alerta CRITICO e item zera → sobe para ZERADO com novo e-mail',
    entrada: { nivelAberto: 'CRITICO', novoStatus: 'ZERADO' },
    esperado: { acao: 'ESCALAR', nivel: 'ZERADO', enviarEmail: true },
  },
  {
    descricao: 'critério do RF-13: alerta aberto e item volta a OK → fecha sozinho',
    entrada: { nivelAberto: 'ZERADO', novoStatus: 'OK' },
    esperado: { acao: 'FECHAR' },
  },
  {
    descricao: 'alerta CRITICO e item melhora para ATENCAO → continua aberto com nível atualizado',
    entrada: { nivelAberto: 'CRITICO', novoStatus: 'ATENCAO' },
    esperado: { acao: 'ATUALIZAR', nivel: 'ATENCAO' },
  },
]
