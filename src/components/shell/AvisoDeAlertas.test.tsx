// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AvisoDeAlertas } from './AvisoDeAlertas'

vi.mock('@/app/acoes/autenticacao', () => ({ acaoVerAlertas: vi.fn() }))

afterEach(cleanup)

describe('RF-13 · Pop-up de alertas sem ciente', () => {
  it('anuncia a quantidade num diálogo de alerta, com o foco no VER', () => {
    render(<AvisoDeAlertas semCiente={3} />)
    const dialogo = screen.getByRole('alertdialog', { name: 'Existem 3 alertas sem ciente' })
    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'VER' })).toHaveFocus()
  })

  it('não tem botão de fechar e o Tab não tira o foco do VER', async () => {
    const user = userEvent.setup()
    render(<AvisoDeAlertas semCiente={1} />)
    expect(screen.getByRole('heading')).toHaveTextContent('Existe 1 alerta sem ciente')
    expect(screen.getAllByRole('button')).toHaveLength(1)
    await user.tab()
    expect(screen.getByRole('button', { name: 'VER' })).toHaveFocus()
  })

  it('trava a rolagem da página enquanto está aberto e devolve ao sair', () => {
    const { unmount } = render(<AvisoDeAlertas semCiente={2} />)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})
