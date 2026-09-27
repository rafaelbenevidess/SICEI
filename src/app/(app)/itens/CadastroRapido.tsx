'use client'

import { X } from 'lucide-react'
import { useState, useTransition, type ReactNode } from 'react'
import { acaoFabricanteRapido, acaoFornecedorNovo } from '@/app/acoes/cadastros'
import { classeBotao } from '@/components/ui'
import { mascararCnpj, situacaoDoCnpj } from '@/domain/cnpj'
import type { EstadoAcao } from '@/server/web/acao'

type Opcao = { valor: string; rotulo: string }

const estiloCampo =
  'h-10 w-full min-w-0 rounded-lg border border-line-2 bg-surface px-3 text-base text-ink sm:text-sm'

/**
 * Painel dentro do formulário do item. Os campos não têm "name": não vão junto com o item,
 * vão pela Server Action do cadastro, e o novo registro já fica escolhido.
 */
function Painel({
  titulo,
  children,
  pronto,
  pendente,
  erro,
  aoSalvar,
  aoFechar,
}: {
  titulo: string
  children: ReactNode
  pronto: boolean
  pendente: boolean
  erro: string | null
  aoSalvar: () => void
  aoFechar: () => void
}) {
  return (
    <section
      aria-label={titulo}
      className="rounded-xl border border-accent bg-[color-mix(in_oklch,var(--accent-soft)_55%,var(--surface))] p-4"
      onKeyDown={(e) => {
        // Enter aqui salva o cadastro rápido, não o item inteiro
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
          e.preventDefault()
          if (pronto && !pendente) aoSalvar()
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold">{titulo}</h3>
        <button
          type="button"
          onClick={aoFechar}
          aria-label={`Fechar: ${titulo}`}
          className="inline-flex size-8 items-center justify-center rounded-lg text-ink-2 hover:bg-surface"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        {children}
      </div>
      {erro && (
        <p role="alert" className="mt-3 text-[13px] text-crit-ink">
          {erro}
        </p>
      )}
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={aoFechar} className={classeBotao('secundario', true)}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={aoSalvar}
          disabled={!pronto || pendente}
          className={classeBotao('primario', true)}
        >
          {pendente ? 'Salvando…' : 'Salvar e usar'}
        </button>
      </div>
    </section>
  )
}

function mensagemDeErro(r: EstadoAcao): string {
  return r.erros ? Object.values(r.erros).join(' ') : (r.erro ?? 'Não foi possível salvar.')
}

/** RF-04: fabricante novo sem sair do cadastro do item. */
export function FabricanteRapido({
  aoCriar,
  aoFechar,
}: {
  aoCriar: (f: Opcao) => void
  aoFechar: () => void
}) {
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()
  const salvar = () =>
    iniciar(async () => {
      const dados = new FormData()
      dados.set('nome', nome)
      const r = await acaoFabricanteRapido({}, dados)
      if (r.ok && r.dados?.id) aoCriar({ valor: String(r.dados.id), rotulo: String(r.dados.nome) })
      else setErro(mensagemDeErro(r))
    })
  return (
    <Painel
      titulo="Cadastrar fabricante"
      pronto={nome.trim() !== ''}
      pendente={pendente}
      erro={erro}
      aoSalvar={salvar}
      aoFechar={aoFechar}
    >
      <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium">
        <span>
          Nome do fabricante <span className="text-crit-ink">*</span>
        </span>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Sandvik, Iscar…"
          className={estiloCampo}
          autoFocus
        />
      </label>
    </Painel>
  )
}

/** RF-05: fornecedor novo sem sair do cadastro do item; o CNPJ é conferido enquanto digita. */
export function FornecedorRapidoDoItem({
  cnpjsExistentes,
  aoCriar,
  aoFechar,
}: {
  cnpjsExistentes: Record<string, string>
  aoCriar: (f: Opcao) => void
  aoFechar: () => void
}) {
  const [razao, setRazao] = useState('')
  const [fantasia, setFantasia] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()
  const situacao = situacaoDoCnpj(cnpj, cnpjsExistentes)
  const cor =
    situacao.estado === 'valido'
      ? 'text-ok-ink'
      : situacao.estado === 'invalido' || situacao.estado === 'duplicado'
        ? 'text-crit-ink'
        : 'text-ink-3'
  const salvar = () =>
    iniciar(async () => {
      const dados = new FormData()
      dados.set('razaoSocial', razao)
      dados.set('nomeFantasia', fantasia)
      dados.set('cnpj', cnpj)
      const r = await acaoFornecedorNovo({}, dados)
      if (r.ok && r.dados?.id) aoCriar({ valor: String(r.dados.id), rotulo: String(r.dados.nome) })
      else setErro(mensagemDeErro(r))
    })
  return (
    <Painel
      titulo="Cadastrar fornecedor"
      pronto={razao.trim() !== '' && situacao.estado === 'valido'}
      pendente={pendente}
      erro={erro}
      aoSalvar={salvar}
      aoFechar={aoFechar}
    >
      <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium">
        <span>
          Razão social <span className="text-crit-ink">*</span>
        </span>
        <input
          value={razao}
          onChange={(e) => setRazao(e.target.value)}
          className={estiloCampo}
          autoFocus
        />
      </label>
      <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium">
        Nome fantasia
        <input
          value={fantasia}
          onChange={(e) => setFantasia(e.target.value)}
          className={estiloCampo}
        />
      </label>
      <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium">
        <span>
          CNPJ <span className="text-crit-ink">*</span>
        </span>
        <input
          value={cnpj}
          onChange={(e) => setCnpj(mascararCnpj(e.target.value))}
          placeholder="00.000.000/0000-00"
          aria-invalid={situacao.estado === 'invalido' || situacao.estado === 'duplicado'}
          className={`${estiloCampo} font-mono`}
        />
        {situacao.mensagem && (
          <span role="status" className={`text-[13px] font-normal ${cor}`}>
            {situacao.mensagem}
          </span>
        )}
      </label>
    </Painel>
  )
}
