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
import { registrarImpressaoDeEtiquetas } from '@/server/services/etiquetas'
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

/** Fabricante criado de dentro do cadastro de item: devolve o id para já ficar escolhido. */
export async function acaoFabricanteRapido(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const f = await salvarFabricante(await atorDaAcao(), dadosDoFormulario(form))
    revalidatePath('/cadastros')
    return { mensagem: `Fabricante ${f.nome} cadastrado.`, dados: { id: f.id, nome: f.nome } }
  })
}

/** Fornecedor criado de dentro do cadastro de item; o vínculo nasce junto com o item (RN-05). */
export async function acaoFornecedorNovo(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const f = await salvarFornecedor(await atorDaAcao(), dadosDoFormulario(form))
    revalidatePath('/cadastros')
    return {
      mensagem: `Fornecedor ${f.razaoSocial} cadastrado.`,
      dados: { id: f.id, nome: f.nomeFantasia ?? f.razaoSocial },
    }
  })
}

/** RN-26: chamada ao mandar imprimir; limpa a pendência das etiquetas e grava no log. */
export async function acaoEtiquetasImpressas(codigos: string[]): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const r = await registrarImpressaoDeEtiquetas(await atorDaAcao(), { codigos })
    revalidatePath('/cadastros', 'layout')
    revalidatePath('/itens', 'layout')
    return {
      mensagem:
        r.impressas.length === 1
          ? `Etiqueta de ${r.impressas[0]} registrada como impressa.`
          : `${r.impressas.length} etiquetas registradas como impressas.`,
    }
  })
}
