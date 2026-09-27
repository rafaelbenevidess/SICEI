'use client'

import { acaoEntrar } from '@/app/acoes/autenticacao'
import { BotaoEnviar, Campo, CampoSenha, FormAcao, Oculto } from '@/components/formulario'

export function FormularioLogin({ volta }: { volta: string }) {
  return (
    <FormAcao
      acao={acaoEntrar}
      rotulo="Entrar no SICEI"
      className="flex flex-col gap-5 [&_button[type=submit]]:h-12 [&_button[type=submit]]:w-full [&_button[type=submit]]:text-[15px] [&_input]:h-12"
    >
      <Oculto nome="volta" valor={volta} />
      <Campo
        nome="login"
        rotulo="Login"
        placeholder="nome.sobrenome"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        className="font-mono"
        obrigatorio
      />
      <CampoSenha nome="senha" rotulo="Senha" autoComplete="current-password" obrigatorio />
      <BotaoEnviar>Entrar</BotaoEnviar>
    </FormAcao>
  )
}
