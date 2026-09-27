'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { acaoAlterarItem, acaoCriarItem } from '@/app/acoes/estoque'
import {
  BotaoEnviar,
  Campo,
  FormAcao,
  Oculto,
  Selecao,
  SelecaoComBusca,
  type OpcaoComBusca,
} from '@/components/formulario'
import { codigoEquivalente, padronizarCodigo, proximoCodigo } from '@/domain/codigo'
import { NOME_APLICACAO } from '@/lib/formatar'
import { FabricanteRapido, FornecedorRapidoDoItem } from './CadastroRapido'

type Opcao = OpcaoComBusca

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

function BotaoNovo({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 self-start text-[13px] font-medium text-accent-ink hover:underline"
    >
      <Plus aria-hidden className="size-3.5" />
      {children}
    </button>
  )
}

export function FormItem({
  valores = {},
  fabricantes: fabricantesIniciais,
  fornecedores: fornecedoresIniciais,
  codigoTravado = false,
  codigosExistentes = [],
  cnpjsExistentes = {},
}: {
  valores?: ValoresItem
  fabricantes: Opcao[]
  fornecedores?: Opcao[]
  codigoTravado?: boolean
  /** todos os códigos já usados, inclusive de itens inativos (RN-01) */
  codigosExistentes?: string[]
  cnpjsExistentes?: Record<string, string>
}) {
  const novo = !valores.id
  const sugestao = novo ? proximoCodigo(codigosExistentes) : ''
  const [codigo, setCodigo] = useState(valores.codigo ?? sugestao)
  const [fabricantes, setFabricantes] = useState(fabricantesIniciais)
  const [fabricanteId, setFabricanteId] = useState(valores.fabricanteId ?? '')
  const [novoFabricante, setNovoFabricante] = useState(false)
  const [fornecedores, setFornecedores] = useState(fornecedoresIniciais ?? [])
  const [fornecedorId, setFornecedorId] = useState('')
  const [novoFornecedor, setNovoFornecedor] = useState(false)
  // RN-01: "pst1" é o mesmo código que PST-001, então também conta como repetido
  const emUso = novo ? codigoEquivalente(codigo, codigosExistentes) : null
  const repetido = emUso !== null
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
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        // ao sair do campo, "pst8" vira PST-008, no padrão da sequência cadastrada
        onBlur={() => !codigoTravado && setCodigo(padronizarCodigo(codigo, codigosExistentes))}
        readOnly={codigoTravado}
        autoCapitalize="characters"
        spellCheck={false}
        className="font-mono"
        aria-invalid={repetido || undefined}
        ajuda={
          codigoTravado ? (
            'Travado: o item já tem movimentações (RN-01).'
          ) : repetido ? (
            <span role="alert" className="text-crit-ink">
              {emUso === codigo.trim().toUpperCase()
                ? `${emUso} já está em uso.`
                : `${codigo.trim()} é o mesmo código que ${emUso}, já em uso.`}{' '}
              Próximo livre:{' '}
              <button
                type="button"
                onClick={() => setCodigo(sugestao)}
                className="font-mono font-medium text-accent-ink underline"
              >
                {sugestao}
              </button>
            </span>
          ) : novo && codigo.trim().toUpperCase() === sugestao ? (
            'Próximo código da sequência. Único; trava depois da primeira movimentação.'
          ) : novo ? (
            <>
              Único. Sugestão da sequência:{' '}
              <button
                type="button"
                onClick={() => setCodigo(sugestao)}
                className="font-mono font-medium text-accent-ink underline"
              >
                {sugestao}
              </button>
            </>
          ) : (
            'Único. Trava depois da primeira movimentação.'
          )
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
      <div className="flex min-w-0 flex-col gap-2">
        <SelecaoComBusca
          nome="fabricanteId"
          rotulo="Fabricante"
          opcoes={fabricantes}
          valor={fabricanteId}
          aoMudar={setFabricanteId}
          placeholder="Digite o nome"
          obrigatorio
        />
        {!novoFabricante && (
          <BotaoNovo onClick={() => setNovoFabricante(true)}>
            Fabricante não está na lista?
          </BotaoNovo>
        )}
      </div>
      {novoFabricante && (
        <div className="sm:col-span-2">
          <FabricanteRapido
            aoFechar={() => setNovoFabricante(false)}
            aoCriar={(f) => {
              setFabricantes((l) =>
                [...l, f].sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR')),
              )
              setFabricanteId(f.valor)
              setNovoFabricante(false)
            }}
          />
        </div>
      )}
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
      {novo && fornecedoresIniciais && (
        <fieldset className="grid gap-3 rounded-lg border border-line p-3 sm:col-span-2 sm:grid-cols-3">
          <legend className="px-1 text-sm font-semibold">
            Fornecedor de onde a peça é comprada (RN-05)
          </legend>
          <div className="flex min-w-0 flex-col gap-2">
            <SelecaoComBusca
              nome="fornecedorId"
              rotulo="Fornecedor"
              opcoes={fornecedores}
              valor={fornecedorId}
              aoMudar={setFornecedorId}
              placeholder="Nome ou CNPJ"
              obrigatorio
            />
            {!novoFornecedor && (
              <BotaoNovo onClick={() => setNovoFornecedor(true)}>
                Fornecedor não está na lista?
              </BotaoNovo>
            )}
          </div>
          <Campo nome="leadTimeDias" rotulo="Lead time (dias)" type="number" min={0} />
          <Campo nome="codigoNoFornecedor" rotulo="Código no fornecedor" />
          {novoFornecedor && (
            <div className="sm:col-span-3">
              <FornecedorRapidoDoItem
                cnpjsExistentes={cnpjsExistentes}
                aoFechar={() => setNovoFornecedor(false)}
                aoCriar={(f) => {
                  setFornecedores((l) =>
                    [...l, f].sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR')),
                  )
                  setFornecedorId(f.valor)
                  setNovoFornecedor(false)
                }}
              />
            </div>
          )}
        </fieldset>
      )}
      <div className="sm:col-span-2">
        <BotaoEnviar desabilitado={repetido}>
          {novo ? 'Cadastrar item' : 'Salvar alterações'}
        </BotaoEnviar>
      </div>
    </FormAcao>
  )
}
