import type { Metadata } from 'next'
import { Cartao, Pagina } from '@/components/ui'
import { lerParametros } from '@/server/parametros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { FormParametros } from './FormParametros'

export const metadata: Metadata = { title: 'Parâmetros' }

export default async function Parametros() {
  await exigirPermissaoDaPagina('parametros:gerenciar')
  const valores = await lerParametros()
  return (
    <Pagina
      titulo="Parâmetros do sistema"
      descricao="Mudanças ficam no log. Mudar a janela recalcula todos os itens (RF-26)."
    >
      <Cartao>
        <FormParametros valores={valores} />
      </Cartao>
    </Pagina>
  )
}
