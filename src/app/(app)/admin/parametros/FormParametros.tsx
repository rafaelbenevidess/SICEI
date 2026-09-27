'use client'

import { CalendarRange, Mail, Timer, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { acaoParametros } from '@/app/acoes/admin'
import { BotaoEnviar, Campo, FormAcao } from '@/components/formulario'
import { problemaDosParametros, type ValoresParametros } from '@/domain/parametros'
import { formatarDataHora } from '@/lib/formatar'

interface Linha {
  nome: keyof ValoresParametros
  titulo: string
  descricao: string
  Icone: LucideIcon
  sufixo?: string
  tipo: 'number' | 'email'
}

const LINHAS: Linha[] = [
  {
    nome: 'janelaConsumoDias',
    titulo: 'Janela do consumo médio',
    descricao:
      'Quantos dias entram no cálculo do consumo médio diário, do ponto de reposição e da sugestão de compra. Padrão: 90.',
    Icone: CalendarRange,
    sufixo: 'dias',
    tipo: 'number',
  },
  {
    nome: 'sessaoInatividadeMinutos',
    titulo: 'Sessão expira após',
    descricao:
      'Minutos parado até a sessão encerrar sozinha. A duração máxima é 12 horas. Padrão: 30.',
    Icone: Timer,
    sufixo: 'minutos',
    tipo: 'number',
  },
  {
    nome: 'emailAvisos',
    titulo: 'E-mail corporativo para avisos',
    descricao:
      'Recebe o aviso quando um item fica crítico ou zerado. Em branco desliga o aviso. Nunca é usado para login.',
    Icone: Mail,
    tipo: 'email',
  },
]

type Texto = Record<keyof ValoresParametros, string>

function comoTexto(v: ValoresParametros): Texto {
  return {
    janelaConsumoDias: String(v.janelaConsumoDias),
    sessaoInatividadeMinutos: String(v.sessaoInatividadeMinutos),
    emailAvisos: v.emailAvisos,
  }
}

/** RF-26: parâmetros com aviso na hora (limites, alteração não salva). O servidor valida de novo. */
export function FormParametros({
  valores,
  salvo,
  loginAtual,
}: {
  valores: ValoresParametros
  salvo: { login: string; quando: Date } | null
  loginAtual: string
}) {
  const [salvos, setSalvos] = useState<Texto>(() => comoTexto(valores))
  const [atuais, setAtuais] = useState<Texto>(salvos)
  const [ultimoSalvo, setUltimoSalvo] = useState(salvo)

  const problema = problemaDosParametros({
    janelaConsumoDias: Number(atuais.janelaConsumoDias || NaN),
    sessaoInatividadeMinutos: Number(atuais.sessaoInatividadeMinutos || NaN),
  })
  const alterado = LINHAS.some((l) => atuais[l.nome].trim() !== salvos[l.nome].trim())

  return (
    <FormAcao
      acao={acaoParametros}
      rotulo="Parâmetros"
      className="overflow-hidden rounded-[14px] border border-line bg-surface shadow-cartao"
      aoConcluir={() => {
        setSalvos(atuais)
        setUltimoSalvo({ login: loginAtual, quando: new Date() })
      }}
    >
      {LINHAS.map(({ nome, titulo, descricao, Icone, sufixo, tipo }) => (
        <div
          key={nome}
          className="grid items-center gap-4 border-b border-line p-5 sm:grid-cols-[minmax(0,1fr)_minmax(180px,260px)] sm:p-6"
        >
          <div className="flex gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-surface-2 text-ink-2">
              <Icone aria-hidden className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold">{titulo}</p>
              <p className="mt-0.5 text-[13px] text-ink-2">{descricao}</p>
            </div>
          </div>
          <Campo
            nome={nome}
            rotulo={titulo}
            rotuloOculto
            type={tipo}
            inputMode={tipo === 'number' ? 'numeric' : undefined}
            sufixo={sufixo}
            value={atuais[nome]}
            onChange={(e) => setAtuais((a) => ({ ...a, [nome]: e.target.value }))}
            className={`h-11 ${tipo === 'email' ? 'font-mono' : '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none'}`}
            obrigatorio={tipo === 'number'}
          />
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-5 sm:px-6">
        <p
          aria-live="polite"
          className={`text-[13px] ${problema ? 'text-crit-ink' : alterado ? 'text-warn-ink' : 'text-ink-3'}`}
        >
          {problema
            ? problema
            : alterado
              ? 'Alterações não salvas. Pontos de reposição e sugestões serão recalculados.'
              : ultimoSalvo
                ? `Salvo em ${formatarDataHora(ultimoSalvo.quando)} por ${ultimoSalvo.login}.`
                : 'Valores padrão, nunca alterados.'}
        </p>
        <BotaoEnviar desabilitado={Boolean(problema) || !alterado}>Salvar parâmetros</BotaoEnviar>
      </div>
    </FormAcao>
  )
}
