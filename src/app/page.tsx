import { FlaskConical, LogIn } from 'lucide-react'
import { redirect } from 'next/navigation'
import { TelaDeAcesso } from '@/components/TelaDeAcesso'
import { LinkBotao } from '@/components/ui'
import { licenciada } from '@/lib/produto'
import { usuarioAtual } from '@/server/web/sessao-atual'

/** Página inicial pública: entrar no sistema ou abrir o Laboratório de testes (RNF-13). */
export default async function Inicio() {
  if (await usuarioAtual()) redirect('/painel')
  const empresa = licenciada()
  return (
    <TelaDeAcesso>
      <h1 className="text-[30px] font-semibold tracking-tight">SICEI</h1>
      <p className="mt-1 text-lg text-ink-2">
        Sistema Inteligente de Controle de Estoques Industriais
      </p>
      <p className="mt-4 text-ink-2">
        Controle de estoque de pastilhas industriais.
        {empresa && ` Licenciado para ${empresa}.`} Trabalho acadêmico.
      </p>
      <nav className="mt-8 flex flex-col gap-3 [&>a]:h-12">
        <LinkBotao href="/login" icone={LogIn}>
          Entrar
        </LinkBotao>
        <LinkBotao href="/testes" variante="secundario" icone={FlaskConical}>
          Laboratório de testes
        </LinkBotao>
      </nav>
    </TelaDeAcesso>
  )
}
