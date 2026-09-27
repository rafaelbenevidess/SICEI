import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CircleX,
  CornerDownLeft,
  Scale,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import { NOME_TIPO } from '@/lib/formatar'

const ICONE_TIPO: Record<string, LucideIcon> = {
  COMPRA: ArrowDownToLine,
  DEVOLUCAO_PRODUCAO: CornerDownLeft,
  AJUSTE_POSITIVO: Scale,
  CONSUMO_PRODUCAO: ArrowUpFromLine,
  PERDA_QUEBRA: CircleX,
  AJUSTE_NEGATIVO: Scale,
  ESTORNO: Undo2,
}

/** Tipo da movimentação com ícone: verde nas entradas, cinza nas saídas. */
export function TipoMovimentacao({ tipo, delta }: { tipo: string; delta: number }) {
  const Icone = ICONE_TIPO[tipo] ?? ArrowDownToLine
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <Icone aria-hidden className={`size-4 ${delta > 0 ? 'text-ok' : 'text-ink-3'}`} />
      {NOME_TIPO[tipo] ?? tipo}
    </span>
  )
}

/** Quantidade com sinal: +30 em verde, −4 em tinta. */
export function QtdMovimentacao({ delta }: { delta: number }) {
  return (
    <span className={`font-semibold ${delta > 0 ? 'text-ok-ink' : 'text-ink'}`}>
      {delta > 0 ? '+' : '−'}
      {Math.abs(delta)}
    </span>
  )
}
