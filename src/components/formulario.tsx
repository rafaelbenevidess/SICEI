'use client'

import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useId,
  useRef,
  useTransition,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import type { EstadoAcao } from '@/server/web/acao'

type Acao = (estado: EstadoAcao, dados: FormData) => Promise<EstadoAcao>

const Contexto = createContext<{ estado: EstadoAcao; pendente: boolean }>({
  estado: {},
  pendente: false,
})

export function useEstadoAcao() {
  return useContext(Contexto)
}

/**
 * Formulário ligado a uma Server Action. Mostra a mensagem geral e os erros por campo.
 * Não usa o reset automático do React 19: em caso de erro, o que foi digitado continua lá.
 */
export function FormAcao({
  acao,
  children,
  className = 'flex flex-col gap-3',
  limparAoConcluir = false,
  confirmar,
  rotulo,
}: {
  acao: Acao
  children: ReactNode
  className?: string
  limparAoConcluir?: boolean
  confirmar?: string
  rotulo?: string
}) {
  const [estado, executar] = useActionState(acao, {})
  const [pendente, iniciar] = useTransition()
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (estado.ok && limparAoConcluir) ref.current?.reset()
  }, [estado.instante, estado.ok, limparAoConcluir])

  return (
    <Contexto.Provider value={{ estado, pendente }}>
      <form
        ref={ref}
        aria-label={rotulo}
        className={className}
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          if (confirmar && !window.confirm(confirmar)) return
          const dados = new FormData(e.currentTarget)
          iniciar(() => executar(dados))
        }}
      >
        <Mensagem />
        {children}
      </form>
    </Contexto.Provider>
  )
}

function Mensagem() {
  const { estado } = useEstadoAcao()
  if (estado.erro) {
    return (
      <p
        role="alert"
        className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-900"
      >
        {estado.erro}
      </p>
    )
  }
  if (estado.ok && estado.mensagem) {
    return (
      <p
        role="status"
        className="rounded-md border border-green-300 bg-green-50 p-2 text-sm text-green-900"
      >
        {estado.mensagem}
      </p>
    )
  }
  return null
}

const estiloEntrada =
  'rounded-md border px-2 py-2 text-base sm:text-sm font-normal text-slate-900 bg-white'

function useErro(nome: string) {
  return useEstadoAcao().estado.erros?.[nome]
}

export function Campo({
  nome,
  rotulo,
  ajuda,
  obrigatorio,
  ...resto
}: {
  nome: string
  rotulo: string
  ajuda?: string
  obrigatorio?: boolean
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>) {
  const erro = useErro(nome)
  const id = `campo-${nome}-${useId()}`
  return (
    <div className="flex flex-col gap-1 text-sm font-medium">
      <label htmlFor={id}>
        {rotulo}
        {obrigatorio && (
          <span aria-hidden className="text-red-700">
            {' '}
            *
          </span>
        )}
      </label>
      <input
        id={id}
        name={nome}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined}
        required={obrigatorio}
        className={`${estiloEntrada} ${erro ? 'border-red-500' : 'border-slate-300'}`}
        {...resto}
      />
      {ajuda && !erro && (
        <span id={`${id}-ajuda`} className="text-xs font-normal text-slate-500">
          {ajuda}
        </span>
      )}
      {erro && (
        <span id={`${id}-erro`} className="text-xs font-normal text-red-700">
          {erro}
        </span>
      )}
    </div>
  )
}

export function Selecao({
  nome,
  rotulo,
  opcoes,
  padrao,
  vazio,
  obrigatorio,
  ajuda,
}: {
  nome: string
  rotulo: string
  opcoes: { valor: string; rotulo: string }[]
  padrao?: string
  vazio?: string
  obrigatorio?: boolean
  ajuda?: string
}) {
  const erro = useErro(nome)
  const id = `campo-${nome}-${useId()}`
  return (
    <div className="flex flex-col gap-1 text-sm font-medium">
      <label htmlFor={id}>
        {rotulo}
        {obrigatorio && (
          <span aria-hidden className="text-red-700">
            {' '}
            *
          </span>
        )}
      </label>
      <select
        id={id}
        name={nome}
        defaultValue={padrao ?? ''}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={`${estiloEntrada} ${erro ? 'border-red-500' : 'border-slate-300'}`}
      >
        {vazio !== undefined && <option value="">{vazio}</option>}
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      {ajuda && !erro && <span className="text-xs font-normal text-slate-500">{ajuda}</span>}
      {erro && (
        <span id={`${id}-erro`} className="text-xs font-normal text-red-700">
          {erro}
        </span>
      )}
    </div>
  )
}

export function AreaTexto({
  nome,
  rotulo,
  obrigatorio,
  padrao,
}: {
  nome: string
  rotulo: string
  obrigatorio?: boolean
  padrao?: string
}) {
  const erro = useErro(nome)
  const id = `campo-${nome}-${useId()}`
  return (
    <div className="flex flex-col gap-1 text-sm font-medium">
      <label htmlFor={id}>
        {rotulo}
        {obrigatorio && (
          <span aria-hidden className="text-red-700">
            {' '}
            *
          </span>
        )}
      </label>
      <textarea
        id={id}
        name={nome}
        rows={2}
        defaultValue={padrao}
        aria-invalid={erro ? true : undefined}
        className={`${estiloEntrada} ${erro ? 'border-red-500' : 'border-slate-300'}`}
      />
      {erro && <span className="text-xs font-normal text-red-700">{erro}</span>}
    </div>
  )
}

export function Caixa({
  nome,
  rotulo,
  padrao,
}: {
  nome: string
  rotulo: string
  padrao?: boolean
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input type="checkbox" name={nome} defaultChecked={padrao} className="h-4 w-4" />
      {rotulo}
    </label>
  )
}

export function Oculto({ nome, valor }: { nome: string; valor: string }) {
  return <input type="hidden" name={nome} value={valor} />
}

export function BotaoEnviar({
  children,
  variante = 'primario',
}: {
  children: ReactNode
  variante?: 'primario' | 'secundario' | 'perigo'
}) {
  const { pendente } = useEstadoAcao()
  const estilos = {
    primario: 'bg-slate-900 text-white hover:bg-slate-700',
    secundario: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
    perigo: 'bg-red-700 text-white hover:bg-red-600',
  }
  return (
    <button
      type="submit"
      disabled={pendente}
      aria-busy={pendente}
      className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 ${estilos[variante]}`}
    >
      {pendente ? 'Enviando…' : children}
    </button>
  )
}

/** Mostra dados devolvidos pela ação (ex.: login e senha provisória), uma única vez. */
export function DadosDaAcao({
  render,
}: {
  render: (dados: Record<string, string | number | null>) => ReactNode
}) {
  const { estado } = useEstadoAcao()
  return estado.ok && estado.dados ? <>{render(estado.dados)}</> : null
}
