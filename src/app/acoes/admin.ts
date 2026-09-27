'use server'

import { revalidatePath } from 'next/cache'
import { ErroDeNegocio } from '@/server/erros'
import { conferirIntegridade, type ResultadoConferencia } from '@/server/services/auditoria'
import { importarPlanilha, previaImportacao } from '@/server/services/importacao'
import { atualizarParametros } from '@/server/services/parametros'
import {
  alterarPerfil,
  alterarSituacaoUsuario,
  criarUsuario,
  desbloquearUsuario,
  redefinirSenha,
} from '@/server/services/usuarios'
import { dadosDoFormulario, executarAcao, type EstadoAcao } from '@/server/web/acao'
import { atorDaAcao } from '@/server/web/sessao-atual'

export async function acaoCriarUsuario(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const r = await criarUsuario(await atorDaAcao(), dadosDoFormulario(form))
    revalidatePath('/admin/usuarios')
    return { mensagem: 'Usuário criado.', dados: { login: r.login, senha: r.senhaProvisoria } }
  })
}

export async function acaoRedefinirSenha(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const r = await redefinirSenha(await atorDaAcao(), String(form.get('id')))
    revalidatePath('/admin/usuarios')
    return { mensagem: 'Senha redefinida.', dados: { login: r.login, senha: r.senhaProvisoria } }
  })
}

export async function acaoDesbloquear(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await desbloquearUsuario(await atorDaAcao(), String(form.get('id')))
    revalidatePath('/admin/usuarios')
    return { mensagem: 'Usuário desbloqueado.' }
  })
}

export async function acaoSituacaoUsuario(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const ativo = form.get('ativo') === 'true'
    await alterarSituacaoUsuario(await atorDaAcao(), String(form.get('id')), ativo)
    revalidatePath('/admin/usuarios')
    return {
      mensagem: ativo
        ? 'Usuário reativado.'
        : 'Usuário inativado. As sessões dele foram encerradas.',
    }
  })
}

export async function acaoPerfil(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await alterarPerfil(await atorDaAcao(), String(form.get('id')), String(form.get('perfil')))
    revalidatePath('/admin/usuarios')
    return { mensagem: 'Perfil alterado. O usuário precisa entrar de novo.' }
  })
}

export async function acaoParametros(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await atualizarParametros(await atorDaAcao(), dadosDoFormulario(form))
    revalidatePath('/admin/parametros')
    return { mensagem: 'Parâmetros salvos. Mudança registrada no log.' }
  })
}

const LIMITE_ARQUIVO = 2 * 1024 * 1024

export async function acaoPreviaImportacao(conteudo: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    if (conteudo.length > LIMITE_ARQUIVO) throw new ErroDeNegocio('O arquivo passa de 2 MB.')
    return { lista: await previaImportacao(await atorDaAcao(), conteudo) }
  })
}

export async function acaoImportar(conteudo: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    if (conteudo.length > LIMITE_ARQUIVO) throw new ErroDeNegocio('O arquivo passa de 2 MB.')
    const r = await importarPlanilha(await atorDaAcao(), conteudo)
    revalidatePath('/itens')
    return { mensagem: `${r.itens} itens importados, com o saldo inicial lançado como ajuste.` }
  })
}

export interface EstadoConferencia {
  resultado?: ResultadoConferencia
  login?: string
  erro?: string
}

/** RF-21: verificação de integridade pedida pelo Admin; a execução fica no log (RN-23). */
export async function acaoConferirIntegridade(): Promise<EstadoConferencia> {
  let resultado: ResultadoConferencia | undefined
  let login: string | undefined
  const estado = await executarAcao(async () => {
    const ator = await atorDaAcao()
    login = ator.login
    resultado = await conferirIntegridade(ator)
    revalidatePath('/admin/auditoria')
  })
  return estado.ok && resultado ? { resultado, login } : { erro: estado.erro }
}
