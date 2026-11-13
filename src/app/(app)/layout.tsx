import { cookies } from 'next/headers'
import { acaoSair } from '@/app/acoes/autenticacao'
import { Rodape } from '@/components/Rodape'
import { menuDoPerfil } from '@/components/shell/menu'
import { Shell } from '@/components/shell/Shell'
import { NOME_DO_PERFIL, pode } from '@/domain/permissoes'
import { licenciada } from '@/lib/produto'
import { COOKIE_TEMA, temaDoCookie } from '@/lib/tema'
import { COOKIE_AVISO_ALERTAS } from '@/lib/avisoDeAlertas'
import { contarAlertasAbertos, contarAlertasSemCiente } from '@/server/consultas/estoque'
import { exigirUsuario } from '@/server/web/sessao-atual'

export default async function LayoutDoSistema({
  children,
  gaveta,
}: {
  children: React.ReactNode
  /** painel aberto por cima da tela (rotas interceptadas em @gaveta) */
  gaveta: React.ReactNode
}) {
  const u = await exigirUsuario()
  const jar = await cookies()
  const tema = temaDoCookie(jar.get(COOKIE_TEMA)?.value)
  // RF-13: só conta os alertas sem ciente se o login marcou o aviso e o perfil dá ciente
  const avisar = jar.has(COOKIE_AVISO_ALERTAS) && pode(u.perfil, 'alertas:ciente')
  const [alertas, semCiente] = await Promise.all([
    contarAlertasAbertos(),
    avisar ? contarAlertasSemCiente() : Promise.resolve(0),
  ])
  return (
    <Shell
      grupos={menuDoPerfil(u.perfil)}
      usuario={{
        nome: `${u.nome} ${u.sobrenome}`,
        detalhe: [NOME_DO_PERFIL[u.perfil], u.setor].filter(Boolean).join(' · '),
      }}
      alertas={alertas}
      alertasSemCiente={avisar ? semCiente : 0}
      licenciada={licenciada()}
      tema={tema}
      podeRegistrarSaida={pode(u.perfil, 'movimentacao:saida')}
      acaoSair={acaoSair}
      rodape={<Rodape anoAtual={new Date().getFullYear()} licenciada={licenciada()} />}
    >
      {children}
      {gaveta}
    </Shell>
  )
}
