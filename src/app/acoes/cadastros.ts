'use server'

import { revalidatePath } from 'next/cache'
import {
  alterarSituacao,
  criarPosicao,
  salvarColaborador,
  salvarDestino,
  salvarFabricante,
  salvarFornecedor,
} from '@/server/services/cadastros'
import { dadosDoFormulario, executarAcao, type EstadoAcao } from '@/server/web/acao'
import { atorDaAcao } from '@/server/web/sessao-atual'

function idOpcional(form: FormData): string | undefined {
  const id = String(form.get('id') ?? '')
  return id || undefined
}

export async function acaoSalvarFabricante(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await salvarFabricante(await atorDaAcao(), dadosDoFormulario(form), idOpcional(form))
    revalidatePath('/cadastros')
    return { mensagem: 'Fabricante salvo.' }
  })
}

export async function acaoSalvarFornecedor(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await salvarFornecedor(await atorDaAcao(), dadosDoFormulario(form), idOpcional(form))
    revalidatePath('/cadastros')
    return { mensagem: 'Fornecedor salvo.' }
  })
}

export async function acaoSalvarDestino(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await salvarDestino(await atorDaAcao(), dadosDoFormulario(form), idOpcional(form))
    revalidatePath('/cadastros')
    return { mensagem: 'Destino salvo.' }
  })
}

export async function acaoSalvarColaborador(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await salvarColaborador(await atorDaAcao(), dadosDoFormulario(form), idOpcional(form))
    revalidatePath('/cadastros')
    return { mensagem: 'Colaborador salvo.' }
  })
}

export async function acaoCriarPosicao(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const p = await criarPosicao(await atorDaAcao(), dadosDoFormulario(form))
    revalidatePath('/cadastros', 'layout')
    return { mensagem: `Posição ${p.codigo} criada.` }
  })
}

const ENTIDADES = ['fabricante', 'fornecedor', 'destino', 'colaborador', 'posicao'] as const

export async function acaoSituacao(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const entidade = String(form.get('entidade')) as (typeof ENTIDADES)[number]
    if (!ENTIDADES.includes(entidade)) throw new Error('Entidade inválida')
    const ativo = form.get('ativo') === 'true'
    await alterarSituacao(await atorDaAcao(), entidade, String(form.get('id')), ativo)
    revalidatePath('/cadastros', 'layout')
    return { mensagem: ativo ? 'Reativado.' : 'Inativado.' }
  })
}
