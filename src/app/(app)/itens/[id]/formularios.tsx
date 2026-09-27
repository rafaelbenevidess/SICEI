'use client'

import {
  acaoAtribuirPosicao,
  acaoDesvincularFornecedor,
  acaoInventario,
  acaoLimites,
  acaoSituacaoItem,
  acaoVincularFornecedor,
} from '@/app/acoes/estoque'
import {
  AreaTexto,
  BotaoEnviar,
  Caixa,
  Campo,
  FormAcao,
  Oculto,
  Selecao,
} from '@/components/formulario'

type Opcao = { valor: string; rotulo: string }

export function FormLimites({
  itemId,
  minimo,
  maximo,
}: {
  itemId: string
  minimo: number
  maximo: number | null
}) {
  return (
    <FormAcao
      acao={acaoLimites}
      rotulo="Limites de estoque"
      className="grid gap-3 sm:grid-cols-3 sm:items-end"
    >
      <Oculto nome="itemId" valor={itemId} />
      <Campo
        nome="estoqueMinimo"
        rotulo="Estoque mínimo"
        type="number"
        min={0}
        defaultValue={minimo}
        obrigatorio
      />
      <Campo
        nome="estoqueMaximo"
        rotulo="Estoque máximo"
        type="number"
        min={1}
        defaultValue={maximo ?? ''}
        ajuda="Opcional"
      />
      <BotaoEnviar variante="secundario">Salvar limites</BotaoEnviar>
    </FormAcao>
  )
}

export function FormPosicao({
  itemId,
  atual,
  livres,
}: {
  itemId: string
  atual: string | null
  livres: Opcao[]
}) {
  return (
    <FormAcao
      acao={acaoAtribuirPosicao}
      rotulo="Posição do item"
      className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
    >
      <Oculto nome="itemId" valor={itemId} />
      <Selecao
        nome="posicaoId"
        rotulo={`Posição${atual ? ` (atual: ${atual})` : ''}`}
        opcoes={livres}
        vazio={atual ? 'Retirar da posição' : 'Sem posição'}
      />
      <BotaoEnviar variante="secundario">Salvar posição</BotaoEnviar>
    </FormAcao>
  )
}

export function FormVinculo({ itemId, fornecedores }: { itemId: string; fornecedores: Opcao[] }) {
  return (
    <FormAcao
      acao={acaoVincularFornecedor}
      limparAoConcluir
      rotulo="Vincular fornecedor"
      className="grid gap-3 sm:grid-cols-2"
    >
      <Oculto nome="itemId" valor={itemId} />
      <Selecao
        nome="fornecedorId"
        rotulo="Fornecedor"
        opcoes={fornecedores}
        vazio="Escolha…"
        obrigatorio
      />
      <Campo nome="codigoNoFornecedor" rotulo="Código do item no fornecedor" />
      <Campo nome="leadTimeDias" rotulo="Lead time (dias)" type="number" min={0} />
      <div className="flex items-end">
        <Caixa nome="preferencial" rotulo="Fornecedor preferencial" />
      </div>
      <div className="sm:col-span-2">
        <BotaoEnviar variante="secundario">Salvar fornecedor no item</BotaoEnviar>
      </div>
    </FormAcao>
  )
}

export function BotaoDesvincular({
  itemId,
  fornecedorId,
}: {
  itemId: string
  fornecedorId: string
}) {
  return (
    <FormAcao
      acao={acaoDesvincularFornecedor}
      confirmar="Desvincular este fornecedor do item?"
      className="inline"
    >
      <Oculto nome="itemId" valor={itemId} />
      <Oculto nome="fornecedorId" valor={fornecedorId} />
      <BotaoEnviar variante="secundario">Desvincular</BotaoEnviar>
    </FormAcao>
  )
}

export function FormInventario({ itemId, saldo }: { itemId: string; saldo: number }) {
  return (
    <FormAcao
      acao={acaoInventario}
      limparAoConcluir
      rotulo="Inventário"
      className="grid gap-3 sm:grid-cols-2"
    >
      <Oculto nome="itemId" valor={itemId} />
      <Campo
        nome="contado"
        rotulo={`Quantidade contada (sistema: ${saldo})`}
        type="number"
        min={0}
        obrigatorio
      />
      <AreaTexto nome="justificativa" rotulo="Justificativa" obrigatorio />
      <div className="sm:col-span-2">
        <BotaoEnviar variante="secundario">Registrar contagem</BotaoEnviar>
      </div>
    </FormAcao>
  )
}

export function FormSituacaoItem({ id, ativo }: { id: string; ativo: boolean }) {
  return (
    <FormAcao
      acao={acaoSituacaoItem}
      confirmar={
        ativo ? 'Inativar este item? Ele precisa estar com saldo zero.' : 'Reativar este item?'
      }
    >
      <Oculto nome="id" valor={id} />
      <Oculto nome="ativo" valor={String(!ativo)} />
      <BotaoEnviar variante={ativo ? 'perigo' : 'secundario'}>
        {ativo ? 'Inativar item' : 'Reativar item'}
      </BotaoEnviar>
    </FormAcao>
  )
}
