'use client'

import {
  acaoCriarUsuario,
  acaoDesbloquear,
  acaoPerfil,
  acaoRedefinirSenha,
  acaoSituacaoUsuario,
} from '@/app/acoes/admin'
import { BotaoEnviar, Campo, DadosDaAcao, FormAcao, Oculto, Selecao } from '@/components/formulario'
import { NOME_DO_PERFIL } from '@/domain/permissoes'
import { PERFIS } from '@/domain/tipos'

const OPCOES_PERFIL = PERFIS.map((p) => ({ valor: p, rotulo: NOME_DO_PERFIL[p] }))

function Credenciais({ dados }: { dados: Record<string, string | number | null> }) {
  return (
    <div
      role="status"
      className="rounded-md border-2 border-blue-400 bg-blue-50 p-3 text-sm sm:col-span-2"
    >
      <p className="font-semibold">
        Entregue ao funcionário. Esta senha não será mostrada de novo.
      </p>
      <p className="mt-1">
        Login: <code className="text-base font-bold">{dados.login}</code>
      </p>
      <p>
        Senha provisória: <code className="text-base font-bold">{dados.senha}</code>
      </p>
      <p className="mt-1 text-xs">
        No primeiro acesso, o sistema obriga a troca da senha (RN-21a).
      </p>
    </div>
  )
}

/** RF-02 / RN-21: o Admin informa nome e sobrenome; o sistema gera login e senha. */
export function FormNovoUsuario() {
  return (
    <FormAcao
      acao={acaoCriarUsuario}
      limparAoConcluir
      rotulo="Novo usuário"
      className="grid gap-3 sm:grid-cols-2"
    >
      <Campo nome="nome" rotulo="Nome" obrigatorio />
      <Campo nome="sobrenome" rotulo="Sobrenome" obrigatorio />
      <Campo nome="setor" rotulo="Setor" obrigatorio />
      <Selecao nome="perfil" rotulo="Perfil" opcoes={OPCOES_PERFIL} vazio="Escolha…" obrigatorio />
      <div className="sm:col-span-2">
        <BotaoEnviar>Criar usuário e gerar senha</BotaoEnviar>
      </div>
      <DadosDaAcao render={(d) => <Credenciais dados={d} />} />
    </FormAcao>
  )
}

export function AcoesUsuario({
  id,
  ativo,
  bloqueado,
  perfil,
}: {
  id: string
  ativo: boolean
  bloqueado: boolean
  perfil: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <FormAcao
        acao={acaoRedefinirSenha}
        confirmar="Gerar uma nova senha provisória? As sessões do usuário serão encerradas."
      >
        <Oculto nome="id" valor={id} />
        <BotaoEnviar variante="secundario">Redefinir senha</BotaoEnviar>
        <DadosDaAcao render={(d) => <Credenciais dados={d} />} />
      </FormAcao>
      {bloqueado && (
        <FormAcao acao={acaoDesbloquear}>
          <Oculto nome="id" valor={id} />
          <BotaoEnviar variante="secundario">Desbloquear</BotaoEnviar>
        </FormAcao>
      )}
      <FormAcao acao={acaoPerfil} className="flex items-end gap-2">
        <Oculto nome="id" valor={id} />
        <Selecao nome="perfil" rotulo="Perfil" opcoes={OPCOES_PERFIL} padrao={perfil} />
        <BotaoEnviar variante="secundario">Alterar</BotaoEnviar>
      </FormAcao>
      <FormAcao
        acao={acaoSituacaoUsuario}
        confirmar={ativo ? 'Inativar? As sessões abertas caem na hora.' : undefined}
      >
        <Oculto nome="id" valor={id} />
        <Oculto nome="ativo" valor={String(!ativo)} />
        <BotaoEnviar variante={ativo ? 'perigo' : 'secundario'}>
          {ativo ? 'Inativar' : 'Reativar'}
        </BotaoEnviar>
      </FormAcao>
    </div>
  )
}
