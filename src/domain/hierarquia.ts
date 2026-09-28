import type { Perfil } from './tipos'

/**
 * RN-21c: hierarquia entre Administradores. O Administrador principal é a conta criada na
 * instalação, a do dono do sistema. Ninguém o inativa, rebaixa ou troca a senha dele pelo
 * sistema; e só ele cuida de outros Administradores. Assim um Administrador mal-intencionado
 * não consegue tomar a conta do principal nem criar um Administrador "reserva" escondido.
 */

export type AcaoSobreUsuario =
  'redefinir-senha' | 'desbloquear' | 'inativar' | 'reativar' | 'mudar-perfil'

export interface PessoaNaHierarquia {
  id: string
  perfil: Perfil
  principal: boolean
}

export type Decisao = { ok: true } | { ok: false; motivo: string }

export const MOTIVO_PRINCIPAL =
  'O Administrador principal não pode ser inativado, ter o perfil mudado nem a senha redefinida por outra conta. Ele troca a própria senha pela opção Senha; se perder o acesso, a recuperação é feita pelo script de recuperação, com acesso ao banco.'
export const MOTIVO_SO_PRINCIPAL = 'Só o Administrador principal gerencia outros Administradores.'
export const MOTIVO_CRIAR_ADMIN = 'Só o Administrador principal cria ou promove Administradores.'

/** O ator pode fazer esta ação sobre o alvo? Quem decide de verdade é o servidor. */
export function podeAgirSobreUsuario(
  ator: PessoaNaHierarquia,
  alvo: PessoaNaHierarquia,
  acao: AcaoSobreUsuario,
  novoPerfil?: Perfil,
): Decisao {
  const proprio = ator.id === alvo.id
  if (proprio && (acao === 'inativar' || acao === 'reativar'))
    return { ok: false, motivo: 'Você não pode inativar a sua própria conta.' }
  if (proprio && acao === 'mudar-perfil')
    return { ok: false, motivo: 'Você não pode alterar o seu próprio perfil.' }
  // desbloquear só devolve o acesso ao dono da conta: qualquer Administrador pode, inclusive
  // para o principal, que assim não depende do script depois de um bloqueio proposital
  if (acao === 'desbloquear') return { ok: true }
  if (alvo.principal) return { ok: false, motivo: MOTIVO_PRINCIPAL }
  if (alvo.perfil === 'ADMIN' && !ator.principal && !proprio)
    return { ok: false, motivo: MOTIVO_SO_PRINCIPAL }
  if (acao === 'mudar-perfil' && novoPerfil === 'ADMIN' && !ator.principal)
    return { ok: false, motivo: MOTIVO_CRIAR_ADMIN }
  return { ok: true }
}

/** Criar um usuário com este perfil: Administrador novo, só pelo principal. */
export function podeCriarComPerfil(ator: PessoaNaHierarquia, perfil: Perfil): Decisao {
  return perfil === 'ADMIN' && !ator.principal
    ? { ok: false, motivo: MOTIVO_CRIAR_ADMIN }
    : { ok: true }
}
