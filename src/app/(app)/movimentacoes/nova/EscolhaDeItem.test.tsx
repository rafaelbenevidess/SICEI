// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EscolhaDeItem, type ItemParaEscolha } from './EscolhaDeItem'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const item = (codigo: string, posicao: string, iso: string): ItemParaEscolha => ({
  id: `id-${codigo}`,
  codigo,
  nome: iso,
  descricao: `Pastilha ${iso}`,
  iso,
  classe: 'P25',
  fabricante: 'Sandvik',
  saldo: 10,
  posicao,
  status: 'OK',
})
const itens = [
  item('PST-001', 'A01-G01-C01', 'CNMG 120408'),
  item('PST-002', 'A01-G01-C02', 'WNMG 080408'),
  item('PST-010', 'A02-G01-C01', 'DNMG 150608'),
]

beforeEach(() => push.mockReset())
afterEach(cleanup)

const opcoes = () => screen.queryAllByRole('option').map((o) => o.textContent)

describe('RF-08 · Escolha do item com autocompletar', () => {
  it('print do celular: "Pst001" acha o PST-001 e o Enter abre a saída dele', async () => {
    const user = userEvent.setup()
    render(<EscolhaDeItem modo="saida" itens={itens} />)
    await user.type(screen.getByRole('combobox'), 'Pst001')
    expect(opcoes()).toHaveLength(1)
    expect(opcoes()[0]).toContain('PST-001')
    expect(screen.getByText(/Código reconhecido/)).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(push).toHaveBeenCalledWith('/movimentacoes/nova?modo=saida&item=id-PST-001')
  })

  it('filtra a cada letra: "pst" mostra os três; seta para baixo escolhe o segundo', async () => {
    const user = userEvent.setup()
    render(<EscolhaDeItem modo="entrada" itens={itens} />)
    const campo = screen.getByRole('combobox')
    await user.type(campo, 'pst')
    expect(opcoes()).toHaveLength(3)
    expect(screen.getByText('3 itens encontrados')).toBeInTheDocument()
    await user.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Enter}')
    expect(push).toHaveBeenCalledWith('/movimentacoes/nova?modo=entrada&item=id-PST-002')
  })

  it('posição sem traços "a01g01c02" acha o item guardado nela', async () => {
    const user = userEvent.setup()
    render(<EscolhaDeItem modo="saida" itens={itens} />)
    await user.type(screen.getByRole('combobox'), 'a01g01c02')
    expect(opcoes()).toHaveLength(1)
    expect(opcoes()[0]).toContain('PST-002')
  })

  it('nada parecido: explica e não abre nada com Enter', async () => {
    const user = userEvent.setup()
    render(<EscolhaDeItem modo="saida" itens={itens} />)
    await user.type(screen.getByRole('combobox'), 'xyz{Enter}')
    expect(screen.getByText(/Nenhum item com “xyz”/)).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })

  it('Esc limpa a busca e volta a lista inteira', async () => {
    const user = userEvent.setup()
    render(<EscolhaDeItem modo="saida" itens={itens} inicial="pst-010" />)
    expect(opcoes()).toHaveLength(1)
    await user.type(screen.getByRole('combobox'), '{Escape}')
    expect(opcoes()).toHaveLength(3)
  })
})
