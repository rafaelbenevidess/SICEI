'use client'

import { CircleCheck, Copy, KeyRound, LockOpen, Pencil, Save, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import {
  acaoCriarUsuario,
  acaoDesbloquear,
  acaoEditarUsuario,
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
import { formatarNomeProprio } from '@/domain/pessoa'
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
export function FormNovoUsuario({
  logins,
  podeCriarAdmin = true,
}: {
  logins: string[]
  /** RN-21c: só o Administrador principal cria Administradores */
  podeCriarAdmin?: boolean
}) {
  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [perfil, setPerfil] = useState('')
  const previa = previaDoLogin(nome, sobrenome, logins)
  return (
    <FormAcao
      acao={acaoCriarUsuario}
      limparAoConcluir
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
      <div className="grid gap-4 sm:grid-cols-2 @3xl:grid-cols-4">
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
        <Campo nome="setor" rotulo="Setor" obrigatorio />
        <Campo
          nome="matricula"
          rotulo="Matrícula"
          obrigatorio
          autoComplete="off"
          className="font-mono uppercase"
          ajuda="Um login por funcionário."
        />
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
          {OPCOES_PERFIL.filter((o) => podeCriarAdmin || o.valor !== 'ADMIN').map((o) => (
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
        {!podeCriarAdmin && (
          <p className="mt-2 text-xs text-ink-3">
            Administradores novos só são criados pelo Administrador principal.
          </p>
        )}
      </fieldset>
      <div className="grid items-end gap-4 @3xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="rounded-[10px] bg-surface-2 px-4 py-3">
          <p className="text-[13px] text-ink-2">Login que será gerado</p>
          <p className="mt-1 font-mono text-[17px] font-semibold" aria-live="polite">
            {previa?.login ?? '—'}
          </p>
          <p className="mt-1 text-xs text-ink-3">{previa?.nota ?? 'Informe nome e sobrenome.'}</p>
          {previa && (
            <p className="mt-1 text-xs text-ink-3">
              Nome gravado como{' '}
              <strong className="font-medium text-ink-2">
                {formatarNomeProprio(nome)} {formatarNomeProprio(sobrenome, { sobrenome: true })}
              </strong>
            </p>
          )}
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

export interface PodeNoUsuario {
  redefinirSenha: boolean
  desbloquear: boolean
  editar: boolean
  situacao: boolean
}

/**
 * Ações da linha do usuário. O que aparece segue a hierarquia (RN-21c), mas é só conforto:
 * quem decide é o servidor, que também grava no log a tentativa recusada.
 */
export function AcoesUsuario({
  id,
  ativo,
  bloqueado,
  pode,
  aviso,
}: {
  id: string
  ativo: boolean
  bloqueado: boolean
  pode: PodeNoUsuario
  /** por que as ações estão escondidas (ex.: Administrador principal) */
  aviso?: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1 whitespace-nowrap min-[85rem]:flex-nowrap">
      {aviso && <span className="px-2 text-[13px] text-ink-3">{aviso}</span>}
      {ativo && pode.redefinirSenha && (
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
      {bloqueado && pode.desbloquear && (
        <FormAcao acao={acaoDesbloquear} className="contents">
          <Oculto nome="id" valor={id} />
          <BotaoEnviar variante="textoAcento" pequeno>
            <LockOpen aria-hidden />
            Desbloquear
          </BotaoEnviar>
        </FormAcao>
      )}
      {pode.editar && (
        <Link
          href={`/admin/usuarios?editar=${id}#formulario`}
          className={classeBotao('fantasma', true)}
        >
          <Pencil aria-hidden />
          Editar
        </Link>
      )}
      {pode.situacao && (
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
      )}
    </div>
  )
}

/**
 * RF-02: correção de nome, sobrenome, setor e matrícula, e do perfil quando a hierarquia deixa.
 * O login não muda (RN-21b).
 */
export function FormEditarUsuario({
  usuario,
  versao,
  podeMudarPerfil,
  podePromoverAdmin,
}: {
  usuario: {
    id: string
    nome: string
    sobrenome: string
    setor: string
    matricula: string | null
    login: string
    perfil: string
  }
  /** muda a cada gravação: os campos recarregam com o nome já formatado pelo servidor */
  versao: number
  podeMudarPerfil: boolean
  podePromoverAdmin: boolean
}) {
  const perfis = OPCOES_PERFIL.filter(
    (o) => podePromoverAdmin || o.valor !== 'ADMIN' || o.valor === usuario.perfil,
  )
  return (
    <div className="@container flex flex-col gap-6">
      <FormAcao acao={acaoEditarUsuario} rotulo="Dados do usuário" className="flex flex-col gap-4">
        <Oculto nome="id" valor={usuario.id} />
        <div key={versao} className="grid gap-4 sm:grid-cols-2 @3xl:grid-cols-4">
          <Campo nome="nome" rotulo="Nome" obrigatorio defaultValue={usuario.nome} />
          <Campo nome="sobrenome" rotulo="Sobrenome" obrigatorio defaultValue={usuario.sobrenome} />
          <Campo nome="setor" rotulo="Setor" obrigatorio defaultValue={usuario.setor} />
          <Campo
            nome="matricula"
            rotulo="Matrícula"
            obrigatorio
            autoComplete="off"
            defaultValue={usuario.matricula ?? ''}
            className="font-mono uppercase"
            ajuda={usuario.matricula ? undefined : 'Conta antiga, ainda sem matrícula.'}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-3">
            Login <span className="font-mono text-ink-2">{usuario.login}</span>: não muda, porque
            identifica a pessoa em todo o histórico.
          </p>
          <BotaoEnviar>
            <Save aria-hidden />
            Salvar dados
          </BotaoEnviar>
        </div>
      </FormAcao>
      {podeMudarPerfil && (
        <FormAcao
          acao={acaoPerfil}
          rotulo="Perfil do usuário"
          className="flex flex-wrap items-end gap-3 border-t border-line pt-5"
        >
          <Oculto nome="id" valor={usuario.id} />
          <div className="w-60">
            <Selecao nome="perfil" rotulo="Perfil" opcoes={perfis} padrao={usuario.perfil} />
          </div>
          <BotaoEnviar variante="secundario">Salvar perfil</BotaoEnviar>
          <p className="basis-full text-xs text-ink-3">
            Mudar o perfil encerra as sessões do usuário: ele precisa entrar de novo.
          </p>
        </FormAcao>
      )}
    </div>
  )
}
