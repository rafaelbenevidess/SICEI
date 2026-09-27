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
import { ChevronDown, Eye, EyeOff } from 'lucide-react'
import { buscarOpcoes, pontuarTexto } from '@/domain/busca'
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
  sufixo,
  rotuloOculto,
  acessorio,
  className = '',
  ...resto
}: {
  nome: string
  rotulo: string
  ajuda?: ReactNode
  obrigatorio?: boolean
  /** texto fixo dentro do campo, à esquerda (ex.: "R$") */
  prefixo?: string
  /** unidade dentro do campo, à direita (ex.: "dias") */
  sufixo?: string
  /** rótulo só para leitores de tela, quando o título já aparece ao lado */
  rotuloOculto?: boolean
  /** controle dentro do campo, à direita (ex.: mostrar a senha) */
  acessorio?: ReactNode
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>) {
  const erro = useErro(nome)
  const id = `campo-${nome}-${useId()}`
  return (
    <div className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium">
      <label htmlFor={id} className={rotuloOculto ? 'sr-only' : undefined}>
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
          className={`${estiloEntrada} ${prefixo ? 'pl-10' : ''} ${sufixo ? 'pr-20' : ''} ${acessorio ? 'pr-12' : ''} ${erro ? 'border-crit' : 'border-line-2'} ${className}`}
          {...resto}
        />
        {sufixo && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[13px] font-normal text-ink-3"
          >
            {sufixo}
          </span>
        )}
        {acessorio && (
          <span className="absolute top-1/2 right-1.5 -translate-y-1/2">{acessorio}</span>
        )}
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

export interface OpcaoComBusca {
  valor: string
  rotulo: string
  /** linha de apoio embaixo do nome (CNPJ, matrícula…) */
  detalhe?: string
  /** outros textos que também acham a opção */
  busca?: string[]
}

/**
 * RF-11: lista de escolha com busca. A pessoa digita e as opções se filtram com a mesma
 * tolerância da busca de itens (maiúsculas, acentos, traços, zeros à esquerda, CNPJ só com
 * números). Só um valor da lista é enviado: ao sair do campo, o texto digitado vira a opção
 * reconhecida ou volta para a escolhida.
 */
export function SelecaoComBusca({
  nome,
  rotulo,
  opcoes,
  padrao = '',
  valor,
  aoMudar,
  obrigatorio,
  ajuda,
  placeholder = 'Digite para buscar…',
  opcaoVazia,
}: {
  nome: string
  rotulo: string
  opcoes: OpcaoComBusca[]
  padrao?: string
  /** com valor, a escolha fica controlada pela tela */
  valor?: string
  aoMudar?: (valor: string) => void
  obrigatorio?: boolean
  ajuda?: ReactNode
  placeholder?: string
  /** opção que deixa o campo vazio de propósito (ex.: "Retirar da posição") */
  opcaoVazia?: string
}) {
  const erro = useErro(nome)
  const id = `busca-${nome}-${useId()}`
  const [interno, setInterno] = useState(padrao)
  const atual = valor !== undefined ? valor : interno
  const escolhida = opcoes.find((o) => o.valor === atual)
  const [texto, setTexto] = useState<string | null>(null) // null = mostrando a escolhida
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const digitado = texto ?? ''
  const achadas = buscarOpcoes(texto === null ? '' : digitado, opcoes)
  const lista: OpcaoComBusca[] =
    opcaoVazia && texto === null ? [{ valor: '', rotulo: opcaoVazia }, ...achadas] : achadas
  const indice = Math.min(ativo, Math.max(lista.length - 1, 0))
  const idOpcao = (i: number) => `${id}-opcao-${i}`
  const campo = useRef<HTMLInputElement>(null)

  // form.reset() (limparAoConcluir) não mexe no estado do React: volta à escolha inicial aqui
  useEffect(() => {
    const form = campo.current?.form
    if (!form) return
    const limpar = () => {
      setInterno(padrao)
      setTexto(null)
    }
    form.addEventListener('reset', limpar)
    return () => form.removeEventListener('reset', limpar)
  }, [padrao])

  const escolher = (v: string) => {
    if (valor === undefined) setInterno(v)
    aoMudar?.(v)
    setTexto(null)
    setAberto(false)
  }
  const sair = () => {
    setAberto(false)
    if (texto === null) return
    if (texto.trim() === '') {
      if (!obrigatorio || opcaoVazia) escolher('')
      else setTexto(null)
      return
    }
    // texto que reconhece uma opção só (nome exato, CNPJ, matrícula, código) vira a escolha
    const exatas = opcoes.filter((o) => pontuarTexto(texto, [o.rotulo, ...(o.busca ?? [])]) >= 95)
    if (exatas.length === 1) escolher(exatas[0].valor)
    else if (achadas.length === 1) escolher(achadas[0].valor)
    else setTexto(null)
  }

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
      <input type="hidden" name={nome} value={atual} />
      <div className="relative">
        <input
          ref={campo}
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={aberto}
          aria-controls={`${id}-lista`}
          aria-activedescendant={aberto && lista.length ? idOpcao(indice) : undefined}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${id}-erro` : undefined}
          aria-required={obrigatorio}
          autoComplete="off"
          spellCheck={false}
          value={texto ?? escolhida?.rotulo ?? (atual === '' && opcaoVazia ? opcaoVazia : '')}
          placeholder={placeholder}
          onFocus={(e) => {
            e.currentTarget.select()
            setAberto(true)
          }}
          onClick={() => setAberto(true)}
          onChange={(e) => {
            setTexto(e.target.value)
            setAtivo(0)
            setAberto(true)
          }}
          onBlur={sair}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              if (!aberto) setAberto(true)
              else setAtivo(Math.min(indice + 1, lista.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setAtivo(Math.max(indice - 1, 0))
            } else if (e.key === 'Enter' && aberto) {
              e.preventDefault()
              if (lista[indice]) escolher(lista[indice].valor)
            } else if (e.key === 'Escape') {
              setTexto(null)
              setAberto(false)
            }
          }}
          className={`${estiloEntrada} pr-9 ${erro ? 'border-crit' : 'border-line-2'}`}
        />
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3"
        />
        {aberto && (
          <ul
            id={`${id}-lista`}
            role="listbox"
            aria-label={rotulo}
            className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-pop"
          >
            {lista.length === 0 ? (
              <li className="px-3 py-2.5 text-[13px] font-normal text-ink-3">
                Nada com “{digitado.trim()}”.
              </li>
            ) : (
              lista.map((o, i) => (
                <li
                  key={o.valor || 'vazia'}
                  id={idOpcao(i)}
                  role="option"
                  aria-selected={o.valor === atual}
                  // mousedown antes do blur: a escolha não se perde ao sair do campo
                  onMouseDown={(e) => {
                    e.preventDefault()
                    escolher(o.valor)
                  }}
                  onMouseEnter={() => setAtivo(i)}
                  className={`cursor-pointer px-3 py-2 font-normal ${i === indice ? 'bg-accent-soft' : ''} ${o.valor === atual ? 'font-semibold' : ''} ${o.valor === '' ? 'text-ink-2 italic' : ''}`}
                >
                  <span className="block truncate text-sm">{o.rotulo}</span>
                  {o.detalhe && (
                    <span className="block truncate text-xs text-ink-3">{o.detalhe}</span>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {ajuda && !erro && <span className="text-xs font-normal text-ink-3">{ajuda}</span>}
      {erro && (
        <span id={`${id}-erro`} className="text-[13px] font-normal text-crit-ink">
          {erro}
        </span>
      )}
    </div>
  )
}

/** Escolha única em botões grandes (44 px), bons para o dedo no celular. Envia como radio. */
export function GrupoDeChips({
  nome,
  rotulo,
  opcoes,
  obrigatorio,
}: {
  nome: string
  rotulo: string
  opcoes: { valor: string; rotulo: string }[]
  obrigatorio?: boolean
}) {
  const erro = useErro(nome)
  const id = `chips-${nome}-${useId()}`
  return (
    <fieldset
      className="flex min-w-0 flex-col gap-1.5"
      aria-invalid={erro ? true : undefined}
      aria-describedby={erro ? `${id}-erro` : undefined}
    >
      <legend className="mb-1.5 text-[13px] font-medium">
        {rotulo}
        {obrigatorio && (
          <span aria-hidden className="text-crit-ink">
            {' '}
            *
          </span>
        )}
      </legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <label key={o.valor} className="cursor-pointer">
            <input
              type="radio"
              name={nome}
              value={o.valor}
              required={obrigatorio}
              className="peer sr-only"
            />
            <span
              className={`inline-flex h-11 items-center rounded-full border bg-surface px-4 text-sm hover:bg-surface-2 peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:font-medium peer-checked:text-accent-ink peer-focus-visible:ring-3 peer-focus-visible:ring-accent-soft ${erro ? 'border-crit' : 'border-line-2'}`}
            >
              {o.rotulo}
            </span>
          </label>
        ))}
      </div>
      {erro && (
        <span id={`${id}-erro`} className="text-[13px] text-crit-ink">
          {erro}
        </span>
      )}
    </fieldset>
  )
}

/** Campo de senha com o botão de mostrar e esconder o que foi digitado. */
export function CampoSenha(props: Omit<Parameters<typeof Campo>[0], 'type' | 'acessorio'>) {
  const [visivel, setVisivel] = useState(false)
  return (
    <Campo
      {...props}
      type={visivel ? 'text' : 'password'}
      autoCapitalize="none"
      spellCheck={false}
      className={`${visivel ? 'font-mono' : ''} ${props.className ?? ''}`}
      acessorio={
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? 'Esconder a senha' : 'Mostrar a senha'}
          aria-pressed={visivel}
          className="grid size-9 place-items-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink"
        >
          {visivel ? (
            <EyeOff aria-hidden className="size-[18px]" />
          ) : (
            <Eye aria-hidden className="size-[18px]" />
          )}
        </button>
      }
    />
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
