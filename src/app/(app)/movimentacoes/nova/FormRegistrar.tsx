'use client'

import {
  ArrowRight,
  Check,
  CircleX,
  Clock,
  CornerDownLeft,
  Factory,
  MonitorSmartphone,
  Plus,
  Truck,
  Undo2,
  User,
  X,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { acaoFornecedorRapido, acaoMovimentar } from '@/app/acoes/estoque'
import { mascararCnpj, situacaoDoCnpj } from '@/domain/cnpj'
import { quantidadeEmUnidades, statusDoItem } from '@/domain/estoque'
import { avaliarMovimentacao, type TipoComum } from '@/domain/movimentacao'
import { BotaoEnviar, Campo, FormAcao, Oculto, Selecao } from '@/components/formulario'
import { Aviso, BadgeStatus, ChipCodigo, classeBotao } from '@/components/ui'
import { formatarMoeda } from '@/lib/formatar'

type Opcao = { valor: string; rotulo: string }

const TIPOS: Record<
  'entrada' | 'saida',
  { tipo: TipoComum; titulo: string; sub: string; Icone: LucideIcon }[]
> = {
  entrada: [
    { tipo: 'COMPRA', titulo: 'Compra', sub: 'Com fornecedor, preço e NF', Icone: Truck },
    {
      tipo: 'DEVOLUCAO_PRODUCAO',
      titulo: 'Devolução da produção',
      sub: 'Pastilha nova que voltou',
      Icone: CornerDownLeft,
    },
  ],
  saida: [
    {
      tipo: 'CONSUMO_PRODUCAO',
      titulo: 'Consumo da produção',
      sub: 'Destino, OP e quem retirou',
      Icone: Factory,
    },
    {
      tipo: 'PERDA_QUEBRA',
      titulo: 'Perda ou quebra',
      sub: 'Com motivo obrigatório',
      Icone: CircleX,
    },
  ],
}

const diaMes = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
})

interface Props {
  modo: 'entrada' | 'saida'
  login: string
  podeCadastrarFornecedor: boolean
  item: {
    id: string
    codigo: string
    nome: string
    fabricante: string
    posicao: string | null
    saldo: number
    minimo: number
    pontoReposicao: number
    embalagem: number
    status: string
  }
  fornecedores: Opcao[]
  destinos: Opcao[]
  colaboradores: Opcao[]
  ultimosPrecos: Record<string, { preco: number; data: string }>
  cnpjsExistentes: Record<string, string>
}

/**
 * RF-07 / RF-08: registro de entrada ou saída. A prévia do resultado usa as mesmas funções
 * puras do domínio; quem decide de verdade é o servidor (RN-08).
 */
export function FormRegistrar({
  modo,
  login,
  podeCadastrarFornecedor,
  item,
  fornecedores: fornecedoresIniciais,
  destinos,
  colaboradores,
  ultimosPrecos,
  cnpjsExistentes,
}: Props) {
  const router = useRouter()
  const opcoes = TIPOS[modo]
  const [tipo, setTipo] = useState<TipoComum>(opcoes[0].tipo)
  const [qtd, setQtd] = useState('')
  const [unidade, setUnidade] = useState<'CAIXA' | 'UNIDADE'>('CAIXA')
  const [fornecedores, setFornecedores] = useState(fornecedoresIniciais)
  const [fornecedorId, setFornecedorId] = useState('')
  const [novoForn, setNovoForn] = useState(false)

  const compra = tipo === 'COMPRA'
  const unidadeReal = compra ? unidade : 'UNIDADE'
  const n = Number(qtd)
  const conversao = quantidadeEmUnidades({
    quantidade: n,
    unidade: unidadeReal,
    embalagem: item.embalagem,
  })
  const unidades = conversao.ok ? conversao.valor : null
  const decisao =
    unidades === null
      ? null
      : avaliarMovimentacao({ tipo, quantidade: unidades, saldoAtual: item.saldo, itemAtivo: true })
  const depois = decisao?.ok ? decisao.valor.saldoPosterior : null
  const statusDepois =
    depois === null
      ? null
      : statusDoItem({ saldo: depois, minimo: item.minimo, pontoReposicao: item.pontoReposicao })
  const saldoInsuficiente = decisao !== null && !decisao.ok && modo === 'saida'
  const ultimo = fornecedorId ? ultimosPrecos[fornecedorId] : undefined

  return (
    <div className="grid items-start gap-6 min-[75rem]:grid-cols-[minmax(0,1fr)_360px]">
      <FormAcao
        acao={acaoMovimentar}
        rotulo={modo === 'entrada' ? 'Registrar entrada' : 'Registrar saída'}
        className="flex min-w-0 flex-col gap-6 rounded-[14px] border border-line bg-surface p-6 shadow-cartao sm:p-7"
        aoConcluir={() => {
          setQtd('')
          router.refresh()
        }}
      >
        <Oculto nome="itemId" valor={item.id} />
        <Oculto nome="tipo" valor={tipo} />
        <Oculto nome="unidade" valor={unidadeReal} />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-medium">Tipo</legend>
          <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
            {opcoes.map(({ tipo: t, titulo, sub, Icone }) => {
              const eh = t === tipo
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={eh}
                  onClick={() => setTipo(t)}
                  className={`flex items-start gap-3 rounded-[10px] border px-4 py-3 text-left ${eh ? 'border-accent bg-accent-soft ring-3 ring-[color-mix(in_oklch,var(--accent)_18%,transparent)]' : 'border-line-2 bg-surface hover:bg-surface-2'}`}
                >
                  <Icone
                    aria-hidden
                    className={`mt-0.5 size-[18px] shrink-0 ${eh ? 'text-accent' : 'text-ink-3'}`}
                  />
                  <span>
                    <span className="block font-semibold">{titulo}</span>
                    <span className="block text-[13px] text-ink-2">{sub}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium">Item</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-line-2 px-4 py-3.5">
            <ChipCodigo forte>{item.codigo}</ChipCodigo>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{item.nome}</p>
              <p className="text-[13px] text-ink-2">
                {item.fabricante} · posição {item.posicao ?? '—'} · saldo {item.saldo}
              </p>
            </div>
            <Link href={`/movimentacoes/nova?modo=${modo}`} className="text-[13px] font-medium">
              Trocar
            </Link>
          </div>
        </div>

        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-end gap-2">
              <div className="w-0 min-w-0 flex-1">
                <Campo
                  nome="quantidade"
                  rotulo="Quantidade"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  obrigatorio
                  value={qtd}
                  onChange={(e) => setQtd(e.target.value)}
                  className={`h-11 text-base font-semibold ${saldoInsuficiente ? '!border-crit' : ''}`}
                />
              </div>
              {compra && (
                <div
                  role="radiogroup"
                  aria-label="Informar em caixas ou unidades"
                  className="flex h-11 shrink-0 rounded-[9px] bg-surface-3 p-[3px]"
                >
                  {(['CAIXA', 'UNIDADE'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      role="radio"
                      aria-checked={unidade === u}
                      onClick={() => setUnidade(u)}
                      className={`rounded-[7px] px-3 text-[13px] font-medium ${unidade === u ? 'bg-surface text-ink shadow-cartao' : 'text-ink-2'}`}
                    >
                      {u === 'CAIXA' ? 'Caixas' : 'Unidades'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-ink-3">
              {unidades === null
                ? compra && unidade === 'CAIXA'
                  ? `Caixa com ${item.embalagem} unidades`
                  : 'Em unidades'
                : compra && unidade === 'CAIXA'
                  ? `${n} ${n === 1 ? 'caixa' : 'caixas'} × ${item.embalagem} = ${unidades} unidades`
                  : `${unidades} ${unidades === 1 ? 'unidade' : 'unidades'}`}
            </p>
          </div>

          {tipo === 'CONSUMO_PRODUCAO' && (
            <Campo
              nome="ordemProducao"
              rotulo="Ordem de produção"
              obrigatorio
              className="h-11 font-mono"
              placeholder="2026-0457"
            />
          )}

          {compra && (
            <>
              <div className="flex min-w-0 flex-col gap-2">
                <Selecao
                  nome="fornecedorId"
                  rotulo="Fornecedor"
                  opcoes={fornecedores}
                  vazio="Escolha…"
                  obrigatorio
                  valor={fornecedorId}
                  aoMudar={setFornecedorId}
                />
                {podeCadastrarFornecedor && !novoForn && (
                  <button
                    type="button"
                    onClick={() => setNovoForn(true)}
                    className="inline-flex items-center gap-1 self-start text-[13px] font-medium text-accent-ink hover:underline"
                  >
                    <Plus aria-hidden className="size-3.5" />
                    Fornecedor não está na lista?
                  </button>
                )}
              </div>
              <Campo
                nome="precoUnitario"
                rotulo="Preço unitário"
                inputMode="decimal"
                placeholder="38,90"
                prefixo="R$"
                obrigatorio
                className="h-11"
                ajuda={
                  ultimo
                    ? `Último pago a este fornecedor: ${formatarMoeda(ultimo.preco)} em ${diaMes.format(new Date(ultimo.data))}`
                    : fornecedorId
                      ? 'Primeira compra deste fornecedor: o preço abre o histórico.'
                      : undefined
                }
              />
              <Campo
                nome="notaFiscal"
                rotulo="Nota fiscal"
                obrigatorio
                className="h-11 font-mono"
              />
            </>
          )}

          {(tipo === 'CONSUMO_PRODUCAO' || tipo === 'DEVOLUCAO_PRODUCAO') && (
            <>
              <Selecao
                nome="destinoId"
                rotulo="Destino"
                opcoes={destinos}
                vazio="Escolha…"
                obrigatorio
              />
              <Selecao
                nome="colaboradorId"
                rotulo={
                  tipo === 'CONSUMO_PRODUCAO'
                    ? 'Colaborador que retirou'
                    : 'Colaborador que devolveu'
                }
                opcoes={colaboradores}
                vazio="Escolha…"
                obrigatorio
              />
            </>
          )}
          {(tipo === 'PERDA_QUEBRA' || tipo === 'DEVOLUCAO_PRODUCAO') && (
            <Campo nome="motivo" rotulo="Motivo" obrigatorio className="h-11" />
          )}
        </div>

        {compra && novoForn && (
          <FornecedorRapido
            item={item}
            cnpjsExistentes={cnpjsExistentes}
            aoFechar={() => setNovoForn(false)}
            aoCriar={(f) => {
              setFornecedores((l) => [...l, f])
              setFornecedorId(f.valor)
              setNovoForn(false)
            }}
          />
        )}

        {saldoInsuficiente && (
          <Aviso tipo="erro" titulo="Saída recusada.">
            Saldo disponível: {item.saldo}
          </Aviso>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5">
          <Link href={`/itens/${item.id}`} className={classeBotao('secundario')}>
            Cancelar
          </Link>
          <BotaoEnviar desabilitado={saldoInsuficiente || unidades === null}>
            <Check aria-hidden />
            {modo === 'entrada' ? 'Confirmar entrada' : 'Confirmar saída'}
            {unidades !== null && ` de ${unidades} un.`}
          </BotaoEnviar>
        </div>
      </FormAcao>

      <aside className="rounded-[14px] border border-line bg-surface p-6 shadow-cartao min-[75rem]:sticky min-[75rem]:top-[88px]">
        <h2 className="text-base font-semibold">Resultado</h2>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="rounded-[10px] bg-surface-2 px-4 py-3">
            <p className="text-[13px] text-ink-2">Saldo atual</p>
            <p className="text-[28px] leading-tight font-semibold">{item.saldo}</p>
          </div>
          <ArrowRight aria-hidden className="size-4 text-ink-3" />
          <div className="rounded-[10px] bg-surface-2 px-4 py-3">
            <p className="text-[13px] text-ink-2">Depois</p>
            <p
              className={`text-[28px] leading-tight font-semibold ${saldoInsuficiente ? 'text-crit-ink' : ''}`}
              aria-live="polite"
            >
              {depois ?? '—'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-ink-2">Status</span>
          <span className="flex items-center gap-2">
            <BadgeStatus status={item.status} />
            <ArrowRight aria-hidden className="size-3.5 text-ink-3" />
            {statusDepois ? (
              <BadgeStatus status={statusDepois} />
            ) : (
              <span className="text-ink-3">—</span>
            )}
          </span>
        </div>
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-[13px] font-medium">Fica registrado</p>
          <ul className="mt-2 flex flex-col gap-2 text-[13px] text-ink-2">
            <li className="flex gap-2">
              <User aria-hidden className="mt-0.5 size-3.5 shrink-0 text-ink-3" />
              <span className="font-mono">{login}</span>
            </li>
            <li className="flex gap-2">
              <Clock aria-hidden className="mt-0.5 size-3.5 shrink-0 text-ink-3" />
              Data e hora do servidor (America/Sao_Paulo)
            </li>
            <li className="flex gap-2">
              <MonitorSmartphone aria-hidden className="mt-0.5 size-3.5 shrink-0 text-ink-3" />
              IP e dispositivo de origem
            </li>
            <li className="flex gap-2">
              <Undo2 aria-hidden className="mt-0.5 size-3.5 shrink-0 text-ink-3" />
              Depois de gravada, só pode ser estornada
            </li>
          </ul>
        </div>
      </aside>
    </div>
  )
}

/**
 * Cadastro rápido de fornecedor, dentro da entrada por compra. Os campos não têm "name",
 * então não vão junto com a movimentação: vão por uma Server Action própria.
 */
function FornecedorRapido({
  item,
  cnpjsExistentes,
  aoFechar,
  aoCriar,
}: {
  item: { id: string; codigo: string }
  cnpjsExistentes: Record<string, string>
  aoFechar: () => void
  aoCriar: (f: Opcao) => void
}) {
  const [razao, setRazao] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [codigo, setCodigo] = useState('')
  const [lead, setLead] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()
  const situacao = situacaoDoCnpj(cnpj, cnpjsExistentes)
  const pronto = razao.trim() !== '' && situacao.estado === 'valido'
  const corCnpj =
    situacao.estado === 'valido'
      ? 'text-ok-ink'
      : situacao.estado === 'invalido' || situacao.estado === 'duplicado'
        ? 'text-crit-ink'
        : 'text-ink-3'
  const estiloCampo =
    'h-10 w-full min-w-0 rounded-lg border border-line-2 bg-surface px-3 text-base text-ink sm:text-sm'

  const salvar = () =>
    iniciar(async () => {
      const dados = new FormData()
      dados.set('itemId', item.id)
      dados.set('razaoSocial', razao)
      dados.set('cnpj', cnpj)
      dados.set('codigoNoFornecedor', codigo)
      dados.set('leadTimeDias', lead)
      const r = await acaoFornecedorRapido({}, dados)
      if (r.ok && r.dados?.fornecedorId) {
        aoCriar({ valor: String(r.dados.fornecedorId), rotulo: String(r.dados.nome) })
      } else {
        setErro(r.erros ? Object.values(r.erros).join(' ') : (r.erro ?? 'Não foi possível salvar.'))
      }
    })

  return (
    <section
      aria-label="Cadastrar fornecedor"
      className="rounded-xl border border-accent bg-[color-mix(in_oklch,var(--accent-soft)_55%,var(--surface))] p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">
          Cadastrar fornecedor e vincular a <span className="font-mono">{item.codigo}</span>
        </h3>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar cadastro de fornecedor"
          className="inline-flex size-8 items-center justify-center rounded-lg text-ink-2 hover:bg-surface"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium">
          <span>
            Razão social <span className="text-crit-ink">*</span>
          </span>
          <input value={razao} onChange={(e) => setRazao(e.target.value)} className={estiloCampo} />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium">
          <span>
            CNPJ <span className="text-crit-ink">*</span>
          </span>
          <input
            value={cnpj}
            onChange={(e) => setCnpj(mascararCnpj(e.target.value))}
            inputMode="text"
            placeholder="00.000.000/0000-00"
            aria-invalid={situacao.estado === 'invalido' || situacao.estado === 'duplicado'}
            className={`${estiloCampo} font-mono`}
          />
          {situacao.mensagem && (
            <span role="status" className={`text-[13px] font-normal ${corCnpj}`}>
              {situacao.mensagem}
            </span>
          )}
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium">
          Código do item no fornecedor
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className={`${estiloCampo} font-mono`}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium">
          Lead time (dias)
          <input
            value={lead}
            onChange={(e) => setLead(e.target.value)}
            inputMode="numeric"
            className={estiloCampo}
          />
        </label>
      </div>
      {erro && (
        <p role="alert" className="mt-3 text-[13px] text-crit-ink">
          {erro}
        </p>
      )}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={aoFechar} className={classeBotao('secundario')}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={!pronto || pendente}
          className={classeBotao('primario')}
        >
          {pendente ? 'Salvando…' : 'Salvar e vincular'}
        </button>
      </div>
    </section>
  )
}
