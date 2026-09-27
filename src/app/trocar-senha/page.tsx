import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { TelaDeAcesso } from '@/components/TelaDeAcesso'
import { Selo } from '@/components/ui'
import { usuarioAtual } from '@/server/web/sessao-atual'
import { FormularioTrocaSenha } from './FormularioTrocaSenha'

export const metadata: Metadata = { title: 'Trocar senha' }

/** RN-21a / RN-22: troca obrigatória no primeiro acesso e troca voluntária pelo menu. */
export default async function PaginaTrocarSenha() {
  const u = await usuarioAtual()
  if (!u) redirect('/login')
  const primeiro = u.deveTrocarSenha
  return (
    <TelaDeAcesso>
      {primeiro && <Selo tom="warn">Primeiro acesso</Selo>}
      <h1 className="mt-3 text-[30px] font-semibold tracking-tight">
        {primeiro ? 'Crie a sua senha' : 'Trocar senha'}
      </h1>
      <p className="mt-1 mb-7 text-ink-2">
        {primeiro
          ? `Olá, ${u.nome}. Você só acessa o sistema depois de trocar a senha provisória. Nem o Administrador conhece a senha que você criar.`
          : 'Informe a senha atual e escolha a nova. Só você conhece a sua senha.'}
      </p>
      <FormularioTrocaSenha login={u.login} primeiroAcesso={primeiro} />
      {!primeiro && (
        <p className="mt-6 text-sm">
          <Link href="/painel">Voltar ao painel</Link>
        </p>
      )}
    </TelaDeAcesso>
  )
}
