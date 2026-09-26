'use client'

import { acaoCiente } from '@/app/acoes/estoque'
import { BotaoEnviar, FormAcao, Oculto } from '@/components/formulario'

export function BotaoCiente({ alertaId }: { alertaId: string }) {
  return (
    <FormAcao acao={acaoCiente} className="inline-flex flex-col gap-1">
      <Oculto nome="alertaId" valor={alertaId} />
      <BotaoEnviar variante="secundario">Marcar ciente</BotaoEnviar>
    </FormAcao>
  )
}
