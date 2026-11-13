// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Gaveta, useGaveta } from './Gaveta'

const router = { push: vi.fn(), back: vi.fn() }
vi.mock('next/navigation', () => ({ useRouter: () => router }))

beforeEach(() => {
  router.push.mockClear()
  router.back.mockClear()
})
afterEach(cleanup)

function BotaoDeDentro() {
  const gaveta = useGaveta()
  return (
    <button type="button" onClick={gaveta?.fechar}>
      {gaveta ? 'Concluir' : 'Fora da gaveta'}
    </button>
  )
}

describe('RNF-14 · Gaveta', () => {
  it('é um diálogo modal com o título dado, e o conteúdo fica dentro dele', () => {
    render(
      <Gaveta titulo="Novo fabricante" descricao="Quem produz as pastilhas.">
        <p>formulário</p>
      </Gaveta>,
    )
    const dialogo = screen.getByRole('dialog', { name: 'Novo fabricante' })
    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(dialogo).toHaveTextContent('Quem produz as pastilhas.')
    expect(dialogo).toHaveTextContent('formulário')
  })

  it.each([
    { descricao: 'Esc', fechar: () => fireEvent.keyDown(window, { key: 'Escape' }) },
    {
      descricao: 'o X',
      fechar: () => fireEvent.click(screen.getByRole('button', { name: 'Fechar painel' })),
    },
    {
      descricao: 'clique fora',
      fechar: () => fireEvent.click(screen.getByRole('button', { name: 'Fechar' })),
    },
    {
      descricao: 'o conteúdo, pelo useGaveta',
      fechar: () => fireEvent.click(screen.getByRole('button', { name: 'Concluir' })),
    },
  ])('sem endereço de volta, fechar com $descricao volta uma página', ({ fechar }) => {
    render(
      <Gaveta titulo="Registrar saída">
        <BotaoDeDentro />
      </Gaveta>,
    )
    fechar()
    expect(router.back).toHaveBeenCalledTimes(1)
    expect(router.push).not.toHaveBeenCalled()
  })

  it('com endereço de volta, fechar vai para ele sem rolar a tela de baixo', () => {
    render(
      <Gaveta titulo="Editar fabricante" voltarPara="/cadastros?aba=fabricantes">
        <p>formulário</p>
      </Gaveta>,
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(router.push).toHaveBeenCalledWith('/cadastros?aba=fabricantes', { scroll: false })
    expect(router.back).not.toHaveBeenCalled()
  })

  it('outra tecla não fecha', () => {
    render(
      <Gaveta titulo="Registrar saída">
        <p>formulário</p>
      </Gaveta>,
    )
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(router.back).not.toHaveBeenCalled()
  })

  it('trava a rolagem da página enquanto está aberta e devolve ao fechar', () => {
    const { unmount } = render(
      <Gaveta titulo="Registrar saída">
        <p>formulário</p>
      </Gaveta>,
    )
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('formulário curto usa a largura estreita (480 px); o padrão é 760 px', () => {
    render(
      <Gaveta titulo="Novo destino" estreita>
        <p>formulário</p>
      </Gaveta>,
    )
    expect(screen.getByRole('dialog')).toHaveClass('max-w-[480px]')
    cleanup()
    render(
      <Gaveta titulo="Novo item">
        <p>formulário</p>
      </Gaveta>,
    )
    expect(screen.getByRole('dialog')).toHaveClass('max-w-[760px]')
  })

  it('fora de uma gaveta, useGaveta devolve null', () => {
    render(<BotaoDeDentro />)
    expect(screen.getByRole('button', { name: 'Fora da gaveta' })).toBeInTheDocument()
  })
})
