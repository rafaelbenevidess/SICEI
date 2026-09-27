'use client'

import { CircleCheck, Copy, KeyRound, LockOpen, UserPlus } from 'lucide-react'
import { useState } from 'react'
import {
  acaoCriarUsuario,
  acaoDesbloquear,
  acaoPerfil,
  acaoRedefinirSenha,
  acaoSituacaoUsuario,
} from '@/app/acoes/admin'
import {
  BotaoEnviar,
  Campo,
  FormAcao,
  Oculto,
  Selecao,
  useEstadoAcao,
} from '@/components/formulario'
import { classeBotao } from '@/components/ui'
import { previaDoLogin } from '@/domain/login'
import { NOME_DO_PERFIL } from '@/domain/permissoes'
import { PERFIS } from '@/domain/tipos'

const OPCOES_PERFIL = PERFIS.map((p) => ({ valor: p, rotulo: NOME_DO_PERFIL[p] }))

/**
 * Login e senha provisória mostrados uma única vez (RN-21). Some com "Já repassei";
 * a senha não volta a aparecer em lugar nenhum.
 */
function Credenciais({ flutuante = false }: { flutuante?: boolean }) {
  const { estado } = useEstadoAcao()
  const [concluido, setConcluido] = useState<number | undefined>(undefined)
  const [copiado, setCopiado] = useState(false)
  if (!estado.ok || !estado.dados?.senha || concluido === estado.instante) return null
  const { login, senha } = estado.dados
  return (
    <div
      role="status"
      className={`rounded-xl bg-accent-soft p-5 text-accent-ink ${flutuante ? 'fixed right-6 bottom-6 z-50 w-[min(380px,calc(100vw-32px))] text-left shadow-pop' : ''}`}
    >
      <p className="flex items-center gap-2 font-semibold">
        <CircleCheck aria-hidden className="size-5" />
        {flutuante ? 'Senha redefinida' : 'Usuário criado'}
      </p>
      <dl className="mt-3 flex flex-col gap-2 text-ink">
        <div>
          <dt className="text-[13px] text-ink-2">Login:</dt>
          <dd className="font-mono text-base font-semibold">{login}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-ink-2">Senha provisória</dt>
          <dd className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xl font-semibold tracking-[0.08em]">{senha}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(String(senha)).then(() => setCopiado(true))
              }}
              className={classeBotao('secundario', true)}
            >
              <Copy aria-hidden />
              {copiado ? 'Copiada' : 'Copiar'}
            </button>
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-[13px] text-ink-2">
        A senha aparece só agora. Entregue ao funcionário: no primeiro acesso o sistema obriga a
        troca (RN-21a).
      </p>
      <button
        type="button"
        onClick={() => setConcluido(estado.instante)}
        className={`${classeBotao('primario')} mt-4 w-full`}
      >
        Já repassei, concluir
      </button>
    </div>
  )
}

/** RF-02 / RN-21: o Admin informa nome e sobrenome; o sistema gera login e senha. */
export function FormNovoUsuario({ logins }: { logins: string[] }) {
  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [perfil, setPerfil] = useState('')
  const previa = previaDoLogin(nome, sobrenome, logins)
  return (
    <FormAcao
      acao={acaoCriarUsuario}
      rotulo="Novo usuário"
      className="@container flex flex-col gap-4"
      aoConcluir={() => {
        setNome('')
        setSobrenome('')
        setPerfil('')
      }}
    >
      <Credenciais />
      {/* estreito (ao lado da tabela): empilhado; largo (acima da tabela): em linha */}
      <div className="grid gap-4 sm:grid-cols-2 @3xl:grid-cols-3">
        <Campo
          nome="nome"
          rotulo="Nome"
          obrigatorio
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <Campo
          nome="sobrenome"
          rotulo="Sobrenome"
          obrigatorio
          value={sobrenome}
          onChange={(e) => setSobrenome(e.target.value)}
        />
        <div className="sm:col-span-2 @3xl:col-span-1">
          <Campo nome="setor" rotulo="Setor" obrigatorio />
        </div>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-[13px] font-medium">
          Perfil <span className="text-crit-ink">*</span>
        </legend>
        <input type="hidden" name="perfil" value={perfil} />
        <div
          role="radiogroup"
          aria-label="Perfil"
          className="grid grid-cols-2 gap-2 @3xl:grid-cols-4"
        >
          {OPCOES_PERFIL.map((o) => (
            <button
              key={o.valor}
              type="button"
              role="radio"
              aria-checked={perfil === o.valor}
              onClick={() => setPerfil(o.valor)}
              className={`h-10 rounded-lg border text-sm font-medium ${perfil === o.valor ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line-2 bg-surface text-ink hover:bg-surface-2'}`}
            >
              {o.rotulo}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid items-end gap-4 @3xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="rounded-[10px] bg-surface-2 px-4 py-3">
          <p className="text-[13px] text-ink-2">Login que será gerado</p>
          <p className="mt-1 font-mono text-[17px] font-semibold" aria-live="polite">
            {previa?.login ?? '—'}
          </p>
          <p className="mt-1 text-xs text-ink-3">{previa?.nota ?? 'Informe nome e sobrenome.'}</p>
        </div>
        <div className="[&>button]:w-full">
          <BotaoEnviar desabilitado={!previa || !perfil}>
            <UserPlus aria-hidden />
            Criar usuário
          </BotaoEnviar>
        </div>
      </div>
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
    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
      {ativo && (
        <FormAcao
          acao={acaoRedefinirSenha}
          className="contents"
          confirmar="Gerar uma nova senha provisória? As sessões do usuário serão encerradas."
        >
          <Oculto nome="id" valor={id} />
          <BotaoEnviar variante="secundario" pequeno>
            <KeyRound aria-hidden />
            Redefinir senha
          </BotaoEnviar>
          <Credenciais flutuante />
        </FormAcao>
      )}
      {bloqueado && (
        <FormAcao acao={acaoDesbloquear} className="contents">
          <Oculto nome="id" valor={id} />
          <BotaoEnviar variante="textoAcento" pequeno>
            <LockOpen aria-hidden />
            Desbloquear
          </BotaoEnviar>
        </FormAcao>
      )}
      <details className="relative">
        <summary className={`${classeBotao('fantasma', true)} cursor-pointer list-none`}>
          Perfil
        </summary>
        <div className="absolute right-0 z-10 mt-1 w-60 rounded-xl border border-line bg-surface p-3 shadow-pop">
          <FormAcao acao={acaoPerfil} className="flex flex-col gap-2">
            <Oculto nome="id" valor={id} />
            <Selecao nome="perfil" rotulo="Mudar perfil" opcoes={OPCOES_PERFIL} padrao={perfil} />
            <BotaoEnviar variante="secundario" pequeno>
              Salvar perfil
            </BotaoEnviar>
          </FormAcao>
        </div>
      </details>
      <FormAcao
        acao={acaoSituacaoUsuario}
        className="contents"
        confirmar={ativo ? 'Inativar? As sessões abertas caem na hora.' : undefined}
      >
        <Oculto nome="id" valor={id} />
        <Oculto nome="ativo" valor={String(!ativo)} />
        <BotaoEnviar variante={ativo ? 'textoPerigo' : 'textoAcento'} pequeno>
          {ativo ? 'Inativar' : 'Reativar'}
        </BotaoEnviar>
      </FormAcao>
    </div>
  )
}
