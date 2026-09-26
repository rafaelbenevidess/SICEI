'use client'

import { acaoAlterarItem, acaoCriarItem } from '@/app/acoes/estoque'
import { BotaoEnviar, Campo, FormAcao, Oculto, Selecao } from '@/components/formulario'
import { NOME_APLICACAO } from '@/lib/formatar'

type Opcao = { valor: string; rotulo: string }

export interface ValoresItem {
  id?: string
  codigo?: string
  descricao?: string
  iso?: string | null
  classe?: string | null
  cobertura?: string | null
  aplicacao?: string
  fabricanteId?: string
  embalagem?: number
  estoqueMinimo?: number
  estoqueMaximo?: number | null
}

export function FormItem({
  valores = {},
  fabricantes,
  fornecedores,
  codigoTravado = false,
}: {
  valores?: ValoresItem
  fabricantes: Opcao[]
  fornecedores?: Opcao[]
  codigoTravado?: boolean
}) {
  const novo = !valores.id
  return (
    <FormAcao
      acao={novo ? acaoCriarItem : acaoAlterarItem}
      rotulo={novo ? 'Novo item' : 'Editar item'}
      className="grid gap-3 sm:grid-cols-2"
    >
      {valores.id && <Oculto nome="id" valor={valores.id} />}
      <Campo
        nome="codigo"
        rotulo="Código interno"
        defaultValue={valores.codigo}
        readOnly={codigoTravado}
        ajuda={
          codigoTravado
            ? 'Travado: o item já tem movimentações (RN-01).'
            : 'Único. Trava depois da primeira movimentação.'
        }
        obrigatorio
      />
      <Campo nome="descricao" rotulo="Descrição" defaultValue={valores.descricao} obrigatorio />
      <Campo
        nome="iso"
        rotulo="Especificação ISO"
        defaultValue={valores.iso ?? ''}
        placeholder="CNMG 120408"
      />
      <Campo
        nome="classe"
        rotulo="Classe (grade)"
        defaultValue={valores.classe ?? ''}
        placeholder="P25"
      />
      <Campo
        nome="cobertura"
        rotulo="Cobertura"
        defaultValue={valores.cobertura ?? ''}
        placeholder="CVD"
      />
      <Selecao
        nome="aplicacao"
        rotulo="Aplicação"
        opcoes={Object.entries(NOME_APLICACAO).map(([valor, rotulo]) => ({ valor, rotulo }))}
        padrao={valores.aplicacao}
        vazio="Escolha…"
        obrigatorio
      />
      <Selecao
        nome="fabricanteId"
        rotulo="Fabricante"
        opcoes={fabricantes}
        padrao={valores.fabricanteId}
        vazio="Escolha…"
        obrigatorio
      />
      <Campo
        nome="embalagem"
        rotulo="Unidades por caixa"
        type="number"
        min={1}
        defaultValue={valores.embalagem ?? 10}
        obrigatorio
      />
      <Campo
        nome="estoqueMinimo"
        rotulo="Estoque mínimo"
        type="number"
        min={0}
        defaultValue={valores.estoqueMinimo}
        obrigatorio
      />
      <Campo
        nome="estoqueMaximo"
        rotulo="Estoque máximo"
        type="number"
        min={1}
        defaultValue={valores.estoqueMaximo ?? ''}
        ajuda="Opcional"
      />
      {novo && fornecedores && (
        <fieldset className="grid gap-3 rounded-md border border-slate-200 p-3 sm:col-span-2 sm:grid-cols-3">
          <legend className="px-1 text-sm font-semibold">Primeiro fornecedor (RN-05)</legend>
          <Selecao
            nome="fornecedorId"
            rotulo="Fornecedor"
            opcoes={fornecedores}
            vazio="Escolha…"
            obrigatorio
          />
          <Campo nome="leadTimeDias" rotulo="Lead time (dias)" type="number" min={0} />
          <Campo nome="codigoNoFornecedor" rotulo="Código no fornecedor" />
        </fieldset>
      )}
      <div className="sm:col-span-2">
        <BotaoEnviar>{novo ? 'Cadastrar item' : 'Salvar alterações'}</BotaoEnviar>
      </div>
    </FormAcao>
  )
}
