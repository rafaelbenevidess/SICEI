'use client'

import { acaoTrocarSenha } from '@/app/acoes/autenticacao'
import { BotaoEnviar, Campo, FormAcao } from '@/components/formulario'

export function FormularioTrocaSenha({ login }: { login: string }) {
  return (
    <FormAcao acao={acaoTrocarSenha} rotulo="Trocar senha">
      <input
        type="text"
        name="usuario"
        autoComplete="username"
        defaultValue={login}
        hidden
        readOnly
      />
      <Campo
        nome="senhaAtual"
        rotulo="Senha atual (ou provisória)"
        type="password"
        autoComplete="current-password"
        obrigatorio
      />
      <Campo
        nome="novaSenha"
        rotulo="Nova senha"
        type="password"
        autoComplete="new-password"
        obrigatorio
      />
      <Campo
        nome="confirmacao"
        rotulo="Repita a nova senha"
        type="password"
        autoComplete="new-password"
        obrigatorio
      />
      <BotaoEnviar>Salvar nova senha</BotaoEnviar>
    </FormAcao>
  )
}
