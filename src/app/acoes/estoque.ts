'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { enviarNotificacoesPendentes } from '@/server/notificacao/email'
import { marcarCiente } from '@/server/services/alertas'
import {
  alterarItem,
  alterarLimites,
  alterarSituacaoItem,
  atribuirPosicao,
  cadastrarFornecedorParaItem,
  criarItem,
  desvincularFornecedor,
  vincularFornecedor,
} from '@/server/services/cadastros'
import {
  estornarMovimentacao,
  registrarInventario,
  registrarMovimentacao,
} from '@/server/services/movimentacoes'
import { dadosDoFormulario, executarAcao, type EstadoAcao } from '@/server/web/acao'
import { atorDaAcao } from '@/server/web/sessao-atual'
import { NOME_TIPO } from '@/lib/formatar'

/** Envia os avisos por e-mail depois da resposta (a falha de e-mail nunca desfaz a movimentação). */
function enviarAvisosDepois(notificacoes: string[]) {
  if (notificacoes.length) after(() => enviarNotificacoesPendentes())
}

export async function acaoMovimentar(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const dados = dadosDoFormulario(form)
    const r = await registrarMovimentacao(await atorDaAcao(), dados)
    enviarAvisosDepois(r.notificacoes)
    revalidatePath(`/itens/${r.movimentacao.itemId}`)
    return {
      mensagem: `${NOME_TIPO[r.movimentacao.tipo]} de ${r.movimentacao.quantidade} registrada. Novo saldo: ${r.saldo}.`,
      dados: {
        quantidade: r.movimentacao.quantidade,
        saldoAnterior: r.movimentacao.saldoAnterior,
        saldoPosterior: r.saldo,
        status: r.status,
      },
    }
  })
}

export async function acaoEstornar(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const r = await estornarMovimentacao(await atorDaAcao(), dadosDoFormulario(form))
    enviarAvisosDepois(r.notificacoes)
    revalidatePath('/movimentacoes')
    return { mensagem: `Estorno registrado. Novo saldo do item: ${r.saldo}.` }
  })
}

export async function acaoInventario(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const r = await registrarInventario(await atorDaAcao(), dadosDoFormulario(form))
    enviarAvisosDepois(r.notificacoes)
    revalidatePath(`/itens/${form.get('itemId')}`)
    return {
      mensagem: r.ajuste
        ? `${NOME_TIPO[r.ajuste.tipo]} de ${r.ajuste.quantidade} lançado. Saldo: ${r.saldo}.`
        : 'A contagem bate com o saldo. A conferência foi registrada no log.',
    }
  })
}

export async function acaoLimites(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const r = await alterarLimites(await atorDaAcao(), dadosDoFormulario(form))
    revalidatePath(`/itens/${form.get('itemId')}`)
    return {
      mensagem: `Limites salvos. Ponto de reposição: ${r.pontoReposicao}; status: ${r.status}.`,
    }
  })
}

export async function acaoCiente(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await marcarCiente(await atorDaAcao(), String(form.get('alertaId')))
    revalidatePath('/alertas')
    return { mensagem: 'Alerta marcado como ciente.' }
  })
}

export async function acaoAtribuirPosicao(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const posicaoId = String(form.get('posicaoId') ?? '')
    const r = await atribuirPosicao(
      await atorDaAcao(),
      String(form.get('itemId')),
      posicaoId || null,
    )
    revalidatePath(`/itens/${form.get('itemId')}`)
    return {
      mensagem: r.codigo
        ? `Item guardado em ${r.codigo}.${r.reimprimirEtiqueta ? ' Reimprima a etiqueta QR da posição (RN-26).' : ''}`
        : 'Item retirado da posição.',
    }
  })
}

export async function acaoVincularFornecedor(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await vincularFornecedor(await atorDaAcao(), dadosDoFormulario(form))
    revalidatePath(`/itens/${form.get('itemId')}`)
    return { mensagem: 'Fornecedor salvo no item.' }
  })
}

/** Cadastro rápido na tela de entrada: o fornecedor novo volta selecionado. */
export async function acaoFornecedorRapido(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const f = await cadastrarFornecedorParaItem(await atorDaAcao(), dadosDoFormulario(form))
    revalidatePath(`/itens/${form.get('itemId')}`)
    return {
      mensagem: 'Fornecedor cadastrado e vinculado ao item.',
      dados: { fornecedorId: f.id, nome: f.razaoSocial },
    }
  })
}

export async function acaoDesvincularFornecedor(
  _: EstadoAcao,
  form: FormData,
): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await desvincularFornecedor(
      await atorDaAcao(),
      String(form.get('itemId')),
      String(form.get('fornecedorId')),
    )
    revalidatePath(`/itens/${form.get('itemId')}`)
    return { mensagem: 'Fornecedor desvinculado.' }
  })
}

export async function acaoCriarItem(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  let id = ''
  const estado = await executarAcao(async () => {
    const d = dadosDoFormulario(form)
    const lead = d.leadTimeDias?.trim()
    const item = await criarItem(await atorDaAcao(), d, {
      fornecedorId: d.fornecedorId ?? '',
      leadTimeDias: lead ? Number(lead) : null,
      codigoNoFornecedor: d.codigoNoFornecedor || null,
    })
    id = item.id
  })
  if (!estado.ok) return estado
  redirect(`/itens/${id}`)
}

export async function acaoAlterarItem(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const id = String(form.get('id'))
  const estado = await executarAcao(async () => {
    await alterarItem(await atorDaAcao(), id, dadosDoFormulario(form))
  })
  if (!estado.ok) return estado
  redirect(`/itens/${id}`)
}

export async function acaoSituacaoItem(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const ativo = form.get('ativo') === 'true'
    await alterarSituacaoItem(await atorDaAcao(), String(form.get('id')), ativo)
    revalidatePath(`/itens/${form.get('id')}`)
    return { mensagem: ativo ? 'Item reativado.' : 'Item inativado.' }
  })
}
