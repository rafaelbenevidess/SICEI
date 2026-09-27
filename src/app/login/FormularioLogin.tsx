'use client'

import { acaoEntrar } from '@/app/acoes/autenticacao'
import { BotaoEnviar, Campo, FormAcao, Oculto } from '@/components/formulario'

export function FormularioLogin({ volta }: { volta: string }) {
  return (
    <FormAcao acao={acaoEntrar} rotulo="Entrar no SICEI">
      <Oculto nome="volta" valor={volta} />
      <Campo
        nome="login"
        rotulo="Login"
        autoComplete="username"
        autoCapitalize="none"
        obrigatorio
      />
      <Campo
        nome="senha"
        rotulo="Senha"
        type="password"
        autoComplete="current-password"
        obrigatorio
      />
      <BotaoEnviar>Entrar</BotaoEnviar>
    </FormAcao>
  )
}
