import Link from 'next/link'
import { acaoSair } from '@/app/acoes/autenticacao'
import { NOME_DO_PERFIL, pode, type Permissao } from '@/domain/permissoes'
import { contarAlertasAbertos } from '@/server/consultas/estoque'
import { exigirUsuario } from '@/server/web/sessao-atual'

const MENU: { href: string; rotulo: string; permissao: Permissao }[] = [
  { href: '/painel', rotulo: 'Painel', permissao: 'painel:ver' },
  { href: '/itens', rotulo: 'Itens', permissao: 'saldo:ver' },
  { href: '/movimentacoes', rotulo: 'Movimentações', permissao: 'historico:ver' },
  { href: '/alertas', rotulo: 'Alertas', permissao: 'alertas:ver' },
  { href: '/relatorios', rotulo: 'Relatórios', permissao: 'relatorios:ver' },
  { href: '/cadastros', rotulo: 'Cadastros', permissao: 'cadastros:ver' },
  { href: '/admin/usuarios', rotulo: 'Usuários', permissao: 'usuarios:gerenciar' },
  { href: '/admin/auditoria', rotulo: 'Auditoria', permissao: 'auditoria:ver' },
  { href: '/admin/parametros', rotulo: 'Parâmetros', permissao: 'parametros:gerenciar' },
  { href: '/admin/importacao', rotulo: 'Importação', permissao: 'importacao:executar' },
]

export default async function LayoutDoSistema({ children }: { children: React.ReactNode }) {
  const u = await exigirUsuario()
  const alertas = await contarAlertasAbertos()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="nao-imprimir border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/painel" className="text-lg font-bold">
            SICEI
          </Link>
          <Link
            href="/alertas"
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${alertas > 0 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'}`}
          >
            {alertas} {alertas === 1 ? 'alerta' : 'alertas'}
          </Link>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-slate-600">
              {u.nome} · <span className="font-medium">{NOME_DO_PERFIL[u.perfil]}</span>
            </span>
            <Link href="/trocar-senha" className="underline">
              Senha
            </Link>
            <form action={acaoSair}>
              <button
                type="submit"
                className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
        <nav aria-label="Menu principal" className="mx-auto max-w-6xl overflow-x-auto px-4">
          <ul className="flex gap-1 pb-2 text-sm">
            {MENU.filter((m) => pode(u.perfil, m.permissao)).map((m) => (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className="block whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-slate-100"
                >
                  {m.rotulo}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/testes"
                className="block whitespace-nowrap rounded-md px-3 py-1.5 text-slate-500 hover:bg-slate-100"
              >
                Testes
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  )
}
