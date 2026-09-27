// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buscarItens } from '@/domain/busca'
import { BuscaDoTopo } from './BuscaDoTopo'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/app/acoes/estoque', () => ({ acaoSugerirItens: vi.fn(async () => []) }))

const ITENS = [
  {
    id: 'i1',
    codigo: 'PST-001',
    descricao: 'CNMG 120408 P25',
    iso: null,
    classe: 'P25',
    posicao: 'A01-G01-C01',
    status: 'OK',
  },
  {
    id: 'i2',
    codigo: 'PST-002',
    descricao: 'DNMG 150608 M15',
    iso: null,
    classe: 'M15',
    posicao: 'A01-G01-C02',
    status: 'ZERADO',
  },
  {
    id: 'i3',
    codigo: 'PST-010',
    descricao: 'WNMG 080408 K10',
    iso: null,
    classe: 'K10',
    posicao: null,
    status: 'OK',
  },
]

// o servidor usa a mesma regra do domínio; aqui ela roda direto
const sugerir = vi.fn(async (termo: string) => buscarItens(termo, ITENS).slice(0, 8))

beforeEach(() => {
  push.mockClear()
  sugerir.mockClear()
})
afterEach(cleanup)

describe('RF-11 · Busca do topo com sugestões', () => {
  it('sugere enquanto digita, com a regra tolerante ("pst1" acha PST-001)', async () => {
    render(<BuscaDoTopo sugerir={sugerir} />)
    await userEvent.type(screen.getByRole('combobox', { name: 'Buscar itens' }), 'pst1')
    const opcoes = await screen.findAllByRole('option')
    expect(opcoes).toHaveLength(1)
    expect(opcoes[0]).toHaveTextContent('PST-001')
    expect(sugerir).toHaveBeenLastCalledWith('pst1')
  })

  it('acha pela posição sem traços e mostra o status escrito', async () => {
    render(<BuscaDoTopo sugerir={sugerir} />)
    await userEvent.type(screen.getByRole('combobox', { name: 'Buscar itens' }), 'a1g1c2')
    const [opcao] = await screen.findAllByRole('option')
    expect(opcao).toHaveTextContent('PST-002')
    expect(opcao).toHaveTextContent('Zerado')
  })

  it('seta para baixo e Enter abrem o item sugerido', async () => {
    render(<BuscaDoTopo sugerir={sugerir} />)
    const campo = screen.getByRole('combobox', { name: 'Buscar itens' })
    await userEvent.type(campo, 'pst')
    await screen.findAllByRole('option')
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(push).toHaveBeenCalledWith('/itens/i2')
  })

  it('Enter sem escolher leva para a lista de itens com o termo', async () => {
    render(<BuscaDoTopo sugerir={sugerir} />)
    await userEvent.type(screen.getByRole('combobox', { name: 'Buscar itens' }), 'p25{Enter}')
    expect(push).toHaveBeenCalledWith('/itens?q=p25')
  })

  it('clicar na sugestão abre o item e limpa o campo', async () => {
    render(<BuscaDoTopo sugerir={sugerir} />)
    const campo = screen.getByRole('combobox', { name: 'Buscar itens' })
    await userEvent.type(campo, 'k10')
    await userEvent.click(await screen.findByRole('option', { name: /PST-010/ }))
    expect(push).toHaveBeenCalledWith('/itens/i3')
    expect(campo).toHaveValue('')
  })

  it('a tecla "/" põe o foco na busca', async () => {
    render(<BuscaDoTopo sugerir={sugerir} />)
    await userEvent.keyboard('/')
    expect(screen.getByRole('combobox', { name: 'Buscar itens' })).toHaveFocus()
  })
})
