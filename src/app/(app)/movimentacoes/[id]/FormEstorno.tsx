'use client'

import { Undo2 } from 'lucide-react'
import { acaoEstornar } from '@/app/acoes/estoque'
import { AreaTexto, BotaoEnviar, FormAcao, Oculto } from '@/components/formulario'

export function FormEstorno({ movimentacaoId }: { movimentacaoId: string }) {
  return (
    <FormAcao
      acao={acaoEstornar}
      confirmar="Confirmar o estorno? A movimentação original continua no histórico, marcada como estornada."
    >
      <Oculto nome="movimentacaoId" valor={movimentacaoId} />
      <AreaTexto nome="justificativa" rotulo="Justificativa do estorno" obrigatorio />
      <div className="[&>button]:w-full">
        <BotaoEnviar variante="perigo">
          <Undo2 aria-hidden />
          Estornar movimentação
        </BotaoEnviar>
      </div>
    </FormAcao>
  )
}
