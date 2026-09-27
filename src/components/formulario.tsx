'use client'

import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import type { EstadoAcao } from '@/server/web/acao'
import { classeBotao, type VarianteBotao } from './ui'

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
  aoConcluir,
  id,
}: {
  acao: Acao
  children: ReactNode
  className?: string
  limparAoConcluir?: boolean
  confirmar?: string
  rotulo?: string
  /** chamado uma vez a cada envio que deu certo */
  aoConcluir?: (estado: EstadoAcao) => void
  id?: string
}) {
  const [estado, executar] = useActionState(acao, {})
  const [pendente, iniciar] = useTransition()
  const ref = useRef<HTMLFormElement>(null)

  const aoConcluirRef = useRef(aoConcluir)
  useEffect(() => {
    aoConcluirRef.current = aoConcluir
  })
  useEffect(() => {
    if (!estado.ok) return
    if (limparAoConcluir) ref.current?.reset()
    aoConcluirRef.current?.(estado)
  }, [estado, limparAoConcluir])

  return (
    <Contexto.Provider value={{ estado, pendente }}>
      <form
        ref={ref}
        id={id}
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
      <p role="alert" className="rounded-xl bg-crit-soft px-4 py-3 text-sm text-crit-ink">
        {estado.erro}
      </p>
    )
  }
  // com senha provisória na resposta, o bloco de credenciais já avisa: sem toast duplicado
  if (estado.ok && estado.mensagem && !estado.dados?.senha)
    return <Toast chave={estado.instante}>{estado.mensagem}</Toast>
  return null
}

/** Aviso de sucesso fixo embaixo da tela, que some sozinho depois de 2,2 s. */
export function Toast({ chave, children }: { chave?: number; children: ReactNode }) {
  const [fechado, setFechado] = useState<number | undefined>(undefined)
  useEffect(() => {
    const t = setTimeout(() => setFechado(chave), 2200)
    return () => clearTimeout(t)
  }, [chave])
  if (fechado === chave) return null
  return (
    <p
      role="status"
      className="fixed bottom-6 left-1/2 z-50 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-[10px] bg-ink px-4 py-3 text-sm font-medium text-bg shadow-pop"
    >
      {children}
    </p>
  )
}

const estiloEntrada =
  'h-10 w-full min-w-0 rounded-lg border bg-surface px-3 text-base font-normal text-ink placeholder:text-ink-3 focus:border-accent sm:text-sm'

function useErro(nome: string) {
  return useEstadoAcao().estado.erros?.[nome]
}

export function Campo({
  nome,
  rotulo,
  ajuda,
  obrigatorio,
  prefixo,
  className = '',
  ...resto
}: {
  nome: string
  rotulo: string
  ajuda?: ReactNode
  obrigatorio?: boolean
  /** texto fixo dentro do campo, à esquerda (ex.: "R$") */
  prefixo?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>) {
  const erro = useErro(nome)
  const id = `campo-${nome}-${useId()}`
  return (
    <div className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium">
      <label htmlFor={id}>
        {rotulo}
        {obrigatorio && (
          <span aria-hidden className="text-crit-ink">
            {' '}
            *
          </span>
        )}
      </label>
      <span className="relative flex">
        {prefixo && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-normal text-ink-3"
          >
            {prefixo}
          </span>
        )}
        <input
          id={id}
          name={nome}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined}
          required={obrigatorio}
          className={`${estiloEntrada} ${prefixo ? 'pl-10' : ''} ${erro ? 'border-crit' : 'border-line-2'} ${className}`}
          {...resto}
        />
      </span>
      {ajuda && !erro && (
        <span id={`${id}-ajuda`} className="text-xs font-normal text-ink-3">
          {ajuda}
        </span>
      )}
      {erro && (
        <span id={`${id}-erro`} className="text-[13px] font-normal text-crit-ink">
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
  valor,
  aoMudar,
}: {
  nome: string
  rotulo: string
  opcoes: { valor: string; rotulo: string }[]
  padrao?: string
  vazio?: string
  obrigatorio?: boolean
  ajuda?: ReactNode
  /** com valor, o select fica controlado pela tela */
  valor?: string
  aoMudar?: (valor: string) => void
}) {
  const erro = useErro(nome)
  const id = `campo-${nome}-${useId()}`
  return (
    <div className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium">
      <label htmlFor={id}>
        {rotulo}
        {obrigatorio && (
          <span aria-hidden className="text-crit-ink">
            {' '}
            *
          </span>
        )}
      </label>
      <select
        id={id}
        name={nome}
        {...(valor !== undefined
          ? { value: valor, onChange: (e) => aoMudar?.(e.target.value) }
          : { defaultValue: padrao ?? '' })}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={`${estiloEntrada} ${erro ? 'border-crit' : 'border-line-2'}`}
      >
        {vazio !== undefined && <option value="">{vazio}</option>}
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      {ajuda && !erro && <span className="text-xs font-normal text-ink-3">{ajuda}</span>}
      {erro && (
        <span id={`${id}-erro`} className="text-[13px] font-normal text-crit-ink">
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
    <div className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium">
      <label htmlFor={id}>
        {rotulo}
        {obrigatorio && (
          <span aria-hidden className="text-crit-ink">
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
        className={`${estiloEntrada} h-auto py-2 ${erro ? 'border-crit' : 'border-line-2'}`}
      />
      {erro && <span className="text-[13px] font-normal text-crit-ink">{erro}</span>}
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
      <input
        type="checkbox"
        name={nome}
        defaultChecked={padrao}
        className="size-4 accent-[var(--accent)]"
      />
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
  pequeno = false,
  desabilitado = false,
}: {
  children: ReactNode
  variante?: VarianteBotao
  pequeno?: boolean
  desabilitado?: boolean
}) {
  const { pendente } = useEstadoAcao()
  return (
    <button
      type="submit"
      disabled={pendente || desabilitado}
      aria-busy={pendente}
      className={classeBotao(variante, pequeno)}
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
