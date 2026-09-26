'use client'

import { acaoParametros } from '@/app/acoes/admin'
import { BotaoEnviar, Campo, FormAcao } from '@/components/formulario'

export function FormParametros({
  valores,
}: {
  valores: { janelaConsumoDias: number; sessaoInatividadeMinutos: number; emailAvisos: string }
}) {
  return (
    <FormAcao acao={acaoParametros} rotulo="Parâmetros" className="grid gap-3 sm:grid-cols-3">
      <Campo
        nome="janelaConsumoDias"
        rotulo="Janela do consumo médio (dias)"
        type="number"
        min={1}
        max={365}
        defaultValue={valores.janelaConsumoDias}
        ajuda="RN-16. Padrão: 90."
        obrigatorio
      />
      <Campo
        nome="sessaoInatividadeMinutos"
        rotulo="Sessão expira após (minutos parados)"
        type="number"
        min={5}
        max={480}
        defaultValue={valores.sessaoInatividadeMinutos}
        ajuda="RN-22. Padrão: 30."
        obrigatorio
      />
      <Campo
        nome="emailAvisos"
        rotulo="E-mail corporativo para avisos"
        type="email"
        defaultValue={valores.emailAvisos}
        ajuda="RN-19. Em branco desliga o aviso. Nunca é usado para login."
      />
      <div className="sm:col-span-3">
        <BotaoEnviar>Salvar parâmetros</BotaoEnviar>
      </div>
    </FormAcao>
  )
}
