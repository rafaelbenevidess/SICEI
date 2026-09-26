'use client'

import { useState } from 'react'
import {
  acaoAtribuirPosicao,
  acaoDesvincularFornecedor,
  acaoInventario,
  acaoLimites,
  acaoMovimentar,
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

const TIPOS = {
  CONSUMO_PRODUCAO: 'Saída para a produção',
  COMPRA: 'Entrada por compra',
  DEVOLUCAO_PRODUCAO: 'Devolução da produção',
  PERDA_QUEBRA: 'Perda ou quebra',
} as const
type Tipo = keyof typeof TIPOS

/** RF-07 / RF-08: um formulário, com os campos obrigatórios de cada tipo (RN-10, RN-11). */
export function FormMovimentacao({
  itemId,
  embalagem,
  podeEntrada,
  podeSaida,
  fornecedores,
  destinos,
  colaboradores,
}: {
  itemId: string
  embalagem: number
  podeEntrada: boolean
  podeSaida: boolean
  fornecedores: Opcao[]
  destinos: Opcao[]
  colaboradores: Opcao[]
}) {
  const permitidos = (Object.keys(TIPOS) as Tipo[]).filter((t) =>
    t === 'COMPRA' || t === 'DEVOLUCAO_PRODUCAO' ? podeEntrada : podeSaida,
  )
  const [tipo, setTipo] = useState<Tipo>(permitidos[0])
  return (
    <div className="flex flex-col gap-3">
      <div
        role="radiogroup"
        aria-label="Tipo de movimentação"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {permitidos.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tipo === t}
            onClick={() => setTipo(t)}
            className={`rounded-md border px-2 py-2 text-sm font-medium ${tipo === t ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white'}`}
          >
            {TIPOS[t]}
          </button>
        ))}
      </div>
      <FormAcao
        key={tipo}
        acao={acaoMovimentar}
        limparAoConcluir
        rotulo={TIPOS[tipo]}
        className="grid gap-3 sm:grid-cols-2"
      >
        <Oculto nome="itemId" valor={itemId} />
        <Oculto nome="tipo" valor={tipo} />
        <Campo
          nome="quantidade"
          rotulo="Quantidade"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          obrigatorio
        />
        {tipo === 'COMPRA' ? (
          <Selecao
            nome="unidade"
            rotulo="Informada em"
            opcoes={[
              { valor: 'CAIXA', rotulo: `caixas (${embalagem} un.)` },
              { valor: 'UNIDADE', rotulo: 'unidades' },
            ]}
            padrao="CAIXA"
          />
        ) : (
          <Oculto nome="unidade" valor="UNIDADE" />
        )}
        {tipo === 'COMPRA' && (
          <>
            <Selecao
              nome="fornecedorId"
              rotulo="Fornecedor"
              opcoes={fornecedores}
              vazio="Escolha…"
              obrigatorio
            />
            <Campo
              nome="precoUnitario"
              rotulo="Preço unitário (R$)"
              inputMode="decimal"
              placeholder="38,90"
              obrigatorio
            />
            <Campo nome="notaFiscal" rotulo="Nota fiscal" obrigatorio />
          </>
        )}
        {(tipo === 'CONSUMO_PRODUCAO' || tipo === 'DEVOLUCAO_PRODUCAO') && (
          <>
            <Selecao
              nome="destinoId"
              rotulo="Destino (máquina, setor ou centro de custo)"
              opcoes={destinos}
              vazio="Escolha…"
              obrigatorio
            />
            <Selecao
              nome="colaboradorId"
              rotulo={tipo === 'CONSUMO_PRODUCAO' ? 'Quem retirou' : 'Quem devolveu'}
              opcoes={colaboradores}
              vazio="Escolha…"
              obrigatorio
            />
          </>
        )}
        {tipo === 'CONSUMO_PRODUCAO' && (
          <Campo nome="ordemProducao" rotulo="Ordem de produção" obrigatorio />
        )}
        {(tipo === 'PERDA_QUEBRA' || tipo === 'DEVOLUCAO_PRODUCAO') && (
          <Campo nome="motivo" rotulo="Motivo" obrigatorio />
        )}
        <Campo nome="observacao" rotulo="Observação" />
        <div className="sm:col-span-2">
          <BotaoEnviar>Registrar {TIPOS[tipo].toLowerCase()}</BotaoEnviar>
        </div>
      </FormAcao>
    </div>
  )
}

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
