// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { totalDeCasos } from '@/lab/suites'
import { Laboratorio } from './Laboratorio'
import { gravarMeusTestes, lerMeusTestes } from './meusTestes'

beforeEach(() => localStorage.clear())
afterEach(cleanup)

describe('RNF-13 · Laboratório de testes (interface)', () => {
  it('aba 1: "Executar todos" roda todos os casos oficiais e todos passam', async () => {
    const user = userEvent.setup()
    render(<Laboratorio />)
    await user.click(screen.getByRole('button', { name: 'Executar todos' }))
    const total = totalDeCasos()
    expect(await screen.findByText(`${total} de ${total} passaram`)).toBeInTheDocument()
  })

  it('aba 2: o avaliador cria um teste de RN-15 que passa', async () => {
    const user = userEvent.setup()
    render(<Laboratorio />)
    await user.click(screen.getByRole('tab', { name: '2. Criar o seu teste' }))
    await user.type(screen.getByLabelText('Ponto de reposição esperado'), '41')
    await user.click(screen.getByRole('button', { name: 'Testar' }))
    const status = screen.getByRole('status')
    expect(within(status).getByText('✅ Seu teste passou')).toBeInTheDocument()
    expect(
      within(status).getByText('20 + 3 × 7 = 41 → arredondado para cima: 41'),
    ).toBeInTheDocument()
  })

  it('aba 2: esperado errado mostra que o teste falhou', async () => {
    const user = userEvent.setup()
    render(<Laboratorio />)
    await user.click(screen.getByRole('tab', { name: '2. Criar o seu teste' }))
    await user.type(screen.getByLabelText('Ponto de reposição esperado'), '40')
    await user.click(screen.getByRole('button', { name: 'Testar' }))
    expect(screen.getByText('❌ Seu teste falhou')).toBeInTheDocument()
  })

  it('aba 2: o teste salvo vai para o navegador e roda junto em "Executar todos"', async () => {
    const user = userEvent.setup()
    render(<Laboratorio />)
    await user.click(screen.getByRole('tab', { name: '2. Criar o seu teste' }))
    await user.type(screen.getByLabelText('Ponto de reposição esperado'), '41')
    await user.click(screen.getByRole('button', { name: 'Salvar este teste' }))
    expect(lerMeusTestes()).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'remover' }))
    expect(lerMeusTestes()).toHaveLength(0)
  })

  it('aba 1: testes salvos aparecem em "Seus testes"', async () => {
    gravarMeusTestes([
      {
        id: '1',
        suite: 'RN-17 · Status do item',
        valores: { saldo: '0', minimo: '5', pontoReposicao: '9' },
        esperado: 'ZERADO',
      },
    ])
    const user = userEvent.setup()
    render(<Laboratorio />)
    await user.click(screen.getByRole('button', { name: 'Executar todos' }))
    expect(await screen.findByText('Seus testes')).toBeInTheDocument()
    const total = totalDeCasos() + 1
    expect(screen.getByText(`${total} de ${total} passaram`)).toBeInTheDocument()
  })

  it('aba 3: alterar a quantidade do registro 2 é detectado', async () => {
    const user = userEvent.setup()
    render(<Laboratorio />)
    await user.click(screen.getByRole('tab', { name: '3. Log inalterável' }))
    const campo = await screen.findByLabelText('registro 2, quantidade')
    await user.click(screen.getByRole('button', { name: 'Verificar integridade' }))
    expect(
      await screen.findByText('✅ Cadeia íntegra: 5 registros conferidos.'),
    ).toBeInTheDocument()
    await user.clear(campo)
    await user.type(campo, '40')
    await user.click(screen.getByRole('button', { name: 'Verificar integridade' }))
    await waitFor(() =>
      expect(
        screen.getByText(
          '❌ Adulteração detectada no registro 2: O conteúdo do registro foi alterado depois de gravado.',
        ),
      ).toBeInTheDocument(),
    )
  })
})

describe('Armazenamento dos testes do avaliador', () => {
  it('conteúdo inválido no localStorage vira lista vazia', () => {
    localStorage.setItem('sicei.laboratorio.meusTestes', '{quebrado')
    expect(lerMeusTestes()).toEqual([])
    localStorage.setItem('sicei.laboratorio.meusTestes', '{"a":1}')
    expect(lerMeusTestes()).toEqual([])
  })
})
