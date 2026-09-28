import type { AcaoSobreUsuario, Decisao, PessoaNaHierarquia } from './hierarquia'
import { MOTIVO_CRIAR_ADMIN, MOTIVO_PRINCIPAL, MOTIVO_SO_PRINCIPAL } from './hierarquia'
import type { CasoDeTeste, Perfil } from './tipos'

export const PRINCIPAL: PessoaNaHierarquia = { id: 'root', perfil: 'ADMIN', principal: true }
export const OUTRO_ADMIN: PessoaNaHierarquia = { id: 'adm2', perfil: 'ADMIN', principal: false }
export const TERCEIRO_ADMIN: PessoaNaHierarquia = { id: 'adm3', perfil: 'ADMIN', principal: false }
export const ALMOXARIFE: PessoaNaHierarquia = { id: 'joao', perfil: 'ALMOXARIFE', principal: false }

export interface EntradaHierarquia {
  ator: PessoaNaHierarquia
  alvo: PessoaNaHierarquia
  acao: AcaoSobreUsuario
  novoPerfil?: Perfil
}

const ok: Decisao = { ok: true }
const nega = (motivo: string): Decisao => ({ ok: false, motivo })

/** RN-21c. Entrada: quem age, sobre quem e o quê. Esperado: permitido ou o motivo da recusa. */
export const casosHierarquia: CasoDeTeste<EntradaHierarquia, Decisao>[] = [
  {
    descricao: 'outro Admin tenta redefinir a senha do principal → recusado (tomaria a conta)',
    entrada: { ator: OUTRO_ADMIN, alvo: PRINCIPAL, acao: 'redefinir-senha' },
    esperado: nega(MOTIVO_PRINCIPAL),
  },
  {
    descricao: 'outro Admin tenta inativar o principal → recusado',
    entrada: { ator: OUTRO_ADMIN, alvo: PRINCIPAL, acao: 'inativar' },
    esperado: nega(MOTIVO_PRINCIPAL),
  },
  {
    descricao: 'outro Admin tenta rebaixar o principal para Consulta → recusado',
    entrada: { ator: OUTRO_ADMIN, alvo: PRINCIPAL, acao: 'mudar-perfil', novoPerfil: 'CONSULTA' },
    esperado: nega(MOTIVO_PRINCIPAL),
  },
  {
    descricao:
      'o próprio principal também não redefine a própria senha por aqui (usa a opção Senha)',
    entrada: { ator: PRINCIPAL, alvo: PRINCIPAL, acao: 'redefinir-senha' },
    esperado: nega(MOTIVO_PRINCIPAL),
  },
  {
    descricao: 'outro Admin desbloqueia o principal → permitido (só devolve o acesso ao dono)',
    entrada: { ator: OUTRO_ADMIN, alvo: PRINCIPAL, acao: 'desbloquear' },
    esperado: ok,
  },
  {
    descricao: 'Admin comum redefine a senha de outro Admin → recusado',
    entrada: { ator: OUTRO_ADMIN, alvo: TERCEIRO_ADMIN, acao: 'redefinir-senha' },
    esperado: nega(MOTIVO_SO_PRINCIPAL),
  },
  {
    descricao: 'Admin comum inativa outro Admin → recusado',
    entrada: { ator: OUTRO_ADMIN, alvo: TERCEIRO_ADMIN, acao: 'inativar' },
    esperado: nega(MOTIVO_SO_PRINCIPAL),
  },
  {
    descricao: 'Admin comum promove um Almoxarife a Admin → recusado',
    entrada: { ator: OUTRO_ADMIN, alvo: ALMOXARIFE, acao: 'mudar-perfil', novoPerfil: 'ADMIN' },
    esperado: nega(MOTIVO_CRIAR_ADMIN),
  },
  {
    descricao: 'Admin comum redefine a senha de um Almoxarife → permitido',
    entrada: { ator: OUTRO_ADMIN, alvo: ALMOXARIFE, acao: 'redefinir-senha' },
    esperado: ok,
  },
  {
    descricao: 'Admin comum muda um Almoxarife para Gestor → permitido',
    entrada: { ator: OUTRO_ADMIN, alvo: ALMOXARIFE, acao: 'mudar-perfil', novoPerfil: 'GESTOR' },
    esperado: ok,
  },
  {
    descricao: 'principal inativa outro Admin → permitido',
    entrada: { ator: PRINCIPAL, alvo: OUTRO_ADMIN, acao: 'inativar' },
    esperado: ok,
  },
  {
    descricao: 'principal promove um Almoxarife a Admin → permitido',
    entrada: { ator: PRINCIPAL, alvo: ALMOXARIFE, acao: 'mudar-perfil', novoPerfil: 'ADMIN' },
    esperado: ok,
  },
  {
    descricao: 'principal redefine a senha de outro Admin → permitido',
    entrada: { ator: PRINCIPAL, alvo: OUTRO_ADMIN, acao: 'redefinir-senha' },
    esperado: ok,
  },
  {
    descricao: 'outro Admin tenta editar o nome do principal → recusado',
    entrada: { ator: OUTRO_ADMIN, alvo: PRINCIPAL, acao: 'editar-dados' },
    esperado: nega(MOTIVO_PRINCIPAL),
  },
  {
    descricao: 'o principal edita o próprio nome → permitido',
    entrada: { ator: PRINCIPAL, alvo: PRINCIPAL, acao: 'editar-dados' },
    esperado: ok,
  },
  {
    descricao: 'Admin comum edita o nome de um Almoxarife → permitido',
    entrada: { ator: OUTRO_ADMIN, alvo: ALMOXARIFE, acao: 'editar-dados' },
    esperado: ok,
  },
  {
    descricao: 'Admin comum edita o nome de outro Admin → recusado',
    entrada: { ator: OUTRO_ADMIN, alvo: TERCEIRO_ADMIN, acao: 'editar-dados' },
    esperado: nega(MOTIVO_SO_PRINCIPAL),
  },
  {
    descricao: 'Admin comum inativa a própria conta → recusado',
    entrada: { ator: OUTRO_ADMIN, alvo: OUTRO_ADMIN, acao: 'inativar' },
    esperado: nega('Você não pode inativar a sua própria conta.'),
  },
  {
    descricao: 'Admin comum muda o próprio perfil → recusado',
    entrada: { ator: OUTRO_ADMIN, alvo: OUTRO_ADMIN, acao: 'mudar-perfil', novoPerfil: 'GESTOR' },
    esperado: nega('Você não pode alterar o seu próprio perfil.'),
  },
]

/** Criação de usuário. Entrada: quem cria e o perfil. Esperado: permitido ou o motivo. */
export const casosCriarComPerfil: CasoDeTeste<
  { ator: PessoaNaHierarquia; perfil: Perfil },
  Decisao
>[] = [
  {
    descricao: 'Admin comum cria um Administrador → recusado (Admin "reserva" escondido)',
    entrada: { ator: OUTRO_ADMIN, perfil: 'ADMIN' },
    esperado: nega(MOTIVO_CRIAR_ADMIN),
  },
  {
    descricao: 'Admin comum cria um Almoxarife → permitido',
    entrada: { ator: OUTRO_ADMIN, perfil: 'ALMOXARIFE' },
    esperado: ok,
  },
  {
    descricao: 'principal cria um Administrador → permitido',
    entrada: { ator: PRINCIPAL, perfil: 'ADMIN' },
    esperado: ok,
  },
]
