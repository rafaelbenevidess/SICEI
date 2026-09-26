'use client'

import {
  acaoCriarPosicao,
  acaoSalvarColaborador,
  acaoSalvarDestino,
  acaoSalvarFabricante,
  acaoSalvarFornecedor,
  acaoSituacao,
} from '@/app/acoes/cadastros'
import { BotaoEnviar, Campo, FormAcao, Oculto, Selecao } from '@/components/formulario'
import { NOME_TIPO_DESTINO } from '@/lib/formatar'

const grade = 'grid gap-3 sm:grid-cols-2'

export function FormFabricante({ id, nome }: { id?: string; nome?: string }) {
  return (
    <FormAcao
      acao={acaoSalvarFabricante}
      limparAoConcluir={!id}
      className={grade}
      rotulo="Fabricante"
    >
      {id && <Oculto nome="id" valor={id} />}
      <Campo nome="nome" rotulo="Nome" defaultValue={nome} obrigatorio />
      <div className="flex items-end">
        <BotaoEnviar>{id ? 'Salvar' : 'Cadastrar fabricante'}</BotaoEnviar>
      </div>
    </FormAcao>
  )
}

export function FormFornecedor({
  id,
  valores = {},
}: {
  id?: string
  valores?: {
    razaoSocial?: string
    nomeFantasia?: string | null
    cnpj?: string
    telefone?: string | null
    contato?: string | null
  }
}) {
  return (
    <FormAcao
      acao={acaoSalvarFornecedor}
      limparAoConcluir={!id}
      className={grade}
      rotulo="Fornecedor"
    >
      {id && <Oculto nome="id" valor={id} />}
      <Campo
        nome="razaoSocial"
        rotulo="Razão social"
        defaultValue={valores.razaoSocial}
        obrigatorio
      />
      <Campo nome="nomeFantasia" rotulo="Nome fantasia" defaultValue={valores.nomeFantasia ?? ''} />
      <Campo
        nome="cnpj"
        rotulo="CNPJ"
        defaultValue={valores.cnpj}
        ajuda="Numérico ou alfanumérico"
        obrigatorio
      />
      <Campo nome="telefone" rotulo="Telefone" defaultValue={valores.telefone ?? ''} />
      <Campo nome="contato" rotulo="Contato" defaultValue={valores.contato ?? ''} />
      <div className="flex items-end">
        <BotaoEnviar>{id ? 'Salvar' : 'Cadastrar fornecedor'}</BotaoEnviar>
      </div>
    </FormAcao>
  )
}

export function FormDestino({
  id,
  valores = {},
}: {
  id?: string
  valores?: { tipo?: string; codigo?: string; nome?: string }
}) {
  return (
    <FormAcao acao={acaoSalvarDestino} limparAoConcluir={!id} className={grade} rotulo="Destino">
      {id && <Oculto nome="id" valor={id} />}
      <Selecao
        nome="tipo"
        rotulo="Tipo"
        opcoes={Object.entries(NOME_TIPO_DESTINO).map(([valor, rotulo]) => ({ valor, rotulo }))}
        padrao={valores.tipo}
        vazio="Escolha…"
        obrigatorio
      />
      <Campo nome="codigo" rotulo="Código" defaultValue={valores.codigo} obrigatorio />
      <Campo nome="nome" rotulo="Nome" defaultValue={valores.nome} obrigatorio />
      <div className="flex items-end">
        <BotaoEnviar>{id ? 'Salvar' : 'Cadastrar destino'}</BotaoEnviar>
      </div>
    </FormAcao>
  )
}

export function FormColaborador({
  id,
  valores = {},
}: {
  id?: string
  valores?: { nome?: string; matricula?: string | null; setor?: string }
}) {
  return (
    <FormAcao
      acao={acaoSalvarColaborador}
      limparAoConcluir={!id}
      className={grade}
      rotulo="Colaborador"
    >
      {id && <Oculto nome="id" valor={id} />}
      <Campo nome="nome" rotulo="Nome" defaultValue={valores.nome} obrigatorio />
      <Campo
        nome="matricula"
        rotulo="Matrícula"
        defaultValue={valores.matricula ?? ''}
        ajuda="Opcional, única"
      />
      <Campo nome="setor" rotulo="Setor" defaultValue={valores.setor} obrigatorio />
      <div className="flex items-end">
        <BotaoEnviar>{id ? 'Salvar' : 'Cadastrar colaborador'}</BotaoEnviar>
      </div>
    </FormAcao>
  )
}

export function FormPosicao() {
  return (
    <FormAcao
      acao={acaoCriarPosicao}
      limparAoConcluir
      className="grid gap-3 sm:grid-cols-4 sm:items-end"
      rotulo="Nova posição"
    >
      <Campo nome="armario" rotulo="Armário" type="number" min={1} max={99} obrigatorio />
      <Campo nome="gaveta" rotulo="Gaveta" type="number" min={1} max={99} obrigatorio />
      <Campo
        nome="compartimento"
        rotulo="Compartimento"
        type="number"
        min={1}
        max={99}
        obrigatorio
      />
      <BotaoEnviar>Criar posição</BotaoEnviar>
    </FormAcao>
  )
}

export function BotaoSituacao({
  entidade,
  id,
  ativo,
}: {
  entidade: string
  id: string
  ativo: boolean
}) {
  return (
    <FormAcao
      acao={acaoSituacao}
      className="inline"
      confirmar={ativo ? 'Inativar este cadastro?' : undefined}
    >
      <Oculto nome="entidade" valor={entidade} />
      <Oculto nome="id" valor={id} />
      <Oculto nome="ativo" valor={String(!ativo)} />
      <BotaoEnviar variante="secundario">{ativo ? 'Inativar' : 'Reativar'}</BotaoEnviar>
    </FormAcao>
  )
}
