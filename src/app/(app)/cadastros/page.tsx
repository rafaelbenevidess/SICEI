import type { Metadata } from 'next'
import Link from 'next/link'
import { Pagina } from '@/components/ui'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'

export const metadata: Metadata = { title: 'Cadastros' }

const CADASTROS = [
  { href: '/itens', titulo: 'Pastilhas', texto: 'Itens, limites, fornecedores e posição (RF-03).' },
  {
    href: '/cadastros/fabricantes',
    titulo: 'Fabricantes',
    texto: 'Quem produz as pastilhas (RF-04).',
  },
  {
    href: '/cadastros/fornecedores',
    titulo: 'Fornecedores',
    texto: 'Quem vende para a DDA, com CNPJ (RF-05).',
  },
  {
    href: '/cadastros/destinos',
    titulo: 'Destinos',
    texto: 'Máquinas, setores e centros de custo (RF-06).',
  },
  {
    href: '/cadastros/colaboradores',
    titulo: 'Colaboradores',
    texto: 'Quem retira e devolve pastilhas (RF-27).',
  },
  {
    href: '/cadastros/posicoes',
    titulo: 'Posições e etiquetas QR',
    texto: 'Armário, gaveta e compartimento (RF-22, RF-28).',
  },
]

export default async function Cadastros() {
  await exigirPermissaoDaPagina('cadastros:ver')
  return (
    <Pagina titulo="Cadastros">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CADASTROS.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="block h-full rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400"
            >
              <p className="font-semibold">{c.titulo}</p>
              <p className="text-sm text-slate-600">{c.texto}</p>
            </Link>
          </li>
        ))}
      </ul>
    </Pagina>
  )
}
