'use client'

import { Circle, CircleCheck, CircleDashed, CircleX } from 'lucide-react'
import { useState } from 'react'
import { acaoTrocarSenha } from '@/app/acoes/autenticacao'
import { BotaoEnviar, CampoSenha, FormAcao } from '@/components/formulario'
import { checklistDaSenha, senhaProntaParaEnviar } from '@/domain/senha'

/** RN-22: a checklist acompanha a digitação; o servidor confere tudo de novo, inclusive o histórico. */
export function FormularioTrocaSenha({
  login,
  primeiroAcesso,
}: {
  login: string
  primeiroAcesso: boolean
}) {
  const [nova, setNova] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const regras = checklistDaSenha({ nova, confirmacao, login })
  const pronta = senhaProntaParaEnviar(regras)

  return (
    <FormAcao
      acao={acaoTrocarSenha}
      rotulo="Trocar senha"
      className="flex flex-col gap-5 [&_button[type=submit]]:h-12 [&_button[type=submit]]:w-full [&_button[type=submit]]:text-[15px] [&_input]:h-12"
    >
      <input
        type="text"
        name="usuario"
        autoComplete="username"
        defaultValue={login}
        hidden
        readOnly
      />
      <CampoSenha
        nome="senhaAtual"
        rotulo={primeiroAcesso ? 'Senha provisória' : 'Senha atual'}
        autoComplete="current-password"
        obrigatorio
      />
      <CampoSenha
        nome="novaSenha"
        rotulo="Nova senha"
        autoComplete="new-password"
        value={nova}
        onChange={(e) => setNova(e.target.value)}
        obrigatorio
      />
      <CampoSenha
        nome="confirmacao"
        rotulo="Repita a nova senha"
        autoComplete="new-password"
        value={confirmacao}
        onChange={(e) => setConfirmacao(e.target.value)}
        obrigatorio
      />
      <ul aria-label="Regras da senha" className="flex flex-col gap-2 text-[13px]">
        {regras.map((r) => {
          const Icone = r.ok === null ? CircleDashed : r.ok ? CircleCheck : nova ? CircleX : Circle
          return (
            <li
              key={r.regra}
              className={`flex items-center gap-2 ${
                r.ok ? 'text-ok-ink' : r.ok === false && nova ? 'text-crit-ink' : 'text-ink-3'
              }`}
            >
              <Icone aria-hidden className="size-[15px] shrink-0" />
              {r.regra}
              <span className="sr-only">
                {r.ok === null ? ': conferido ao salvar' : r.ok ? ': atendida' : ': pendente'}
              </span>
            </li>
          )
        })}
      </ul>
      <BotaoEnviar desabilitado={!pronta}>Salvar e continuar</BotaoEnviar>
    </FormAcao>
  )
}
