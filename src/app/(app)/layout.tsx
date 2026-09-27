import { cookies } from 'next/headers'
import { acaoSair } from '@/app/acoes/autenticacao'
import { Rodape } from '@/components/Rodape'
import { menuDoPerfil } from '@/components/shell/menu'
import { Shell } from '@/components/shell/Shell'
import { NOME_DO_PERFIL, pode } from '@/domain/permissoes'
import { licenciada } from '@/lib/produto'
import { COOKIE_TEMA, temaDoCookie } from '@/lib/tema'
import { contarAlertasAbertos } from '@/server/consultas/estoque'
import { exigirUsuario } from '@/server/web/sessao-atual'

export default async function LayoutDoSistema({ children }: { children: React.ReactNode }) {
  const u = await exigirUsuario()
  const alertas = await contarAlertasAbertos()
  const tema = temaDoCookie((await cookies()).get(COOKIE_TEMA)?.value)
  return (
    <Shell
      grupos={menuDoPerfil(u.perfil)}
      usuario={{
        nome: `${u.nome} ${u.sobrenome}`,
        detalhe: [NOME_DO_PERFIL[u.perfil], u.setor].filter(Boolean).join(' · '),
      }}
      alertas={alertas}
      licenciada={licenciada()}
      tema={tema}
      podeRegistrarSaida={pode(u.perfil, 'movimentacao:saida')}
      acaoSair={acaoSair}
      rodape={<Rodape anoAtual={new Date().getFullYear()} licenciada={licenciada()} />}
    >
      {children}
    </Shell>
  )
}
