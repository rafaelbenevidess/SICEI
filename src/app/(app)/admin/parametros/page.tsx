import type { Metadata } from 'next'
import { Pagina } from '@/components/ui'
import { alteracoesDeParametros } from '@/domain/parametros'
import { formatarDataHora } from '@/lib/formatar'
import { historicoDeParametros } from '@/server/consultas/auditoria'
import { lerParametros } from '@/server/parametros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { FormParametros } from './FormParametros'

export const metadata: Metadata = { title: 'Parâmetros' }

/** RF-26: parâmetros do sistema e as últimas alterações, lidas do log. */
export default async function Parametros() {
  const u = await exigirPermissaoDaPagina('parametros:gerenciar')
  const [valores, historico] = await Promise.all([lerParametros(), historicoDeParametros()])
  const alteracoes = alteracoesDeParametros(historico)
  const salvo = historico[0] ? { login: historico[0].login, quando: historico[0].quando } : null

  return (
    <Pagina
      titulo="Parâmetros do sistema"
      descricao="Valem para todos os itens e usuários. Toda mudança vai para o log de auditoria."
    >
      <div className="grid items-start gap-5 min-[65rem]:grid-cols-[minmax(0,1fr)_360px]">
        <FormParametros valores={valores} salvo={salvo} loginAtual={u.login} />
        <section aria-labelledby="ultimas-alteracoes" className="cartao p-5">
          <h2 id="ultimas-alteracoes" className="mb-3 text-[15px] font-semibold">
            Últimas alterações
          </h2>
          {alteracoes.length === 0 ? (
            <p className="text-[13px] text-ink-3">Nenhuma alteração desde a instalação.</p>
          ) : (
            <ul>
              {alteracoes.map((a, i) => (
                <li key={i} className="border-b border-line py-3 first:pt-0">
                  <p className="text-[13px]">{a.titulo}</p>
                  <p className="mt-1 font-mono text-xs break-all">
                    <del className="text-crit-ink">{a.antes}</del>{' '}
                    <span className="text-ink-3">→</span>{' '}
                    <ins className="text-ok-ink no-underline">{a.depois}</ins>
                  </p>
                  <p className="mt-1 text-xs text-ink-3">
                    {a.login} · {formatarDataHora(a.quando)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Pagina>
  )
}
