// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { BotaoEnviar, Campo, DadosDaAcao, FormAcao, Selecao } from './formulario'
import { Paginacao } from './Paginacao'
import { Rodape } from './Rodape'
import { Aviso, BadgeStatus, rotulosDoNivel, Vazio } from './ui'

afterEach(cleanup)

describe('RNF-10 · Status não depende só da cor', () => {
  it.each([
    ['OK', 'OK'],
    ['ATENCAO', 'Atenção'],
    ['CRITICO', 'Crítico'],
    ['ZERADO', 'Zerado'],
  ])('%s aparece escrito como "%s"', (status, texto) => {
    render(<BadgeStatus status={status} />)
    expect(screen.getByText(texto)).toBeInTheDocument()
  })
})

describe('Componentes de apoio', () => {
  it('Aviso de erro usa role=alert e os demais role=status', () => {
    render(
      <>
        <Aviso tipo="erro">falhou</Aviso>
        <Aviso tipo="ok">deu certo</Aviso>
      </>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('falhou')
    expect(screen.getByRole('status')).toHaveTextContent('deu certo')
  })
  it('Vazio mostra a mensagem', () => {
    render(<Vazio>Nenhum item.</Vazio>)
    expect(screen.getByText('Nenhum item.')).toBeInTheDocument()
  })
  it('Paginação mantém os filtros e some quando há uma página só', () => {
    const { rerender } = render(
      <Paginacao
        pagina={2}
        paginas={3}
        caminho="/movimentacoes"
        filtros={{ item: 'PST-001', tipo: undefined }}
      />,
    )
    expect(screen.getByRole('link', { name: '← anterior' })).toHaveAttribute(
      'href',
      '/movimentacoes?item=PST-001&pagina=1',
    )
    expect(screen.getByRole('link', { name: 'próxima →' })).toHaveAttribute(
      'href',
      '/movimentacoes?item=PST-001&pagina=3',
    )
    rerender(<Paginacao pagina={1} paginas={1} caminho="/x" filtros={{}} />)
    expect(screen.queryByRole('navigation')).toBeNull()
  })
})

describe('Formulários ligados a Server Actions', () => {
  it('mostra o erro geral e o erro do campo, com aria-invalid, e mantém o que foi digitado', async () => {
    const user = userEvent.setup()
    const acao = async () => ({
      ok: false,
      erro: 'Confira os campos destacados.',
      erros: { quantidade: 'Saldo disponível: 3' },
      instante: 1,
    })
    render(
      <FormAcao acao={acao} rotulo="Saída">
        <Campo nome="quantidade" rotulo="Quantidade" obrigatorio />
        <Selecao
          nome="destinoId"
          rotulo="Destino"
          opcoes={[{ valor: 'd1', rotulo: 'CNC 03' }]}
          vazio="Escolha…"
        />
        <BotaoEnviar>Registrar</BotaoEnviar>
      </FormAcao>,
    )
    const campo = screen.getByLabelText(/Quantidade/)
    await user.type(campo, '5')
    await user.click(screen.getByRole('button', { name: 'Registrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Confira os campos destacados.')
    expect(screen.getByText('Saldo disponível: 3')).toBeInTheDocument()
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveValue('5')
  })

  it('mostra a mensagem de sucesso, os dados devolvidos e limpa o formulário', async () => {
    const user = userEvent.setup()
    const acao = async () => ({
      ok: true,
      mensagem: 'Usuário criado.',
      dados: { login: 'ana.santos', senha: 'Ab3xYz9Kq2Mn' },
      instante: 2,
    })
    render(
      <FormAcao acao={acao} limparAoConcluir rotulo="Novo usuário">
        <Campo nome="nome" rotulo="Nome" />
        <BotaoEnviar>Criar</BotaoEnviar>
        <DadosDaAcao render={(d) => <p>login gerado: {d.login}</p>} />
      </FormAcao>,
    )
    await user.type(screen.getByLabelText('Nome'), 'Ana')
    await user.click(screen.getByRole('button', { name: 'Criar' }))
    expect(await screen.findByText('Usuário criado.')).toBeInTheDocument()
    expect(screen.getByText('login gerado: ana.santos')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('')
  })

  it('dois formulários com o mesmo campo não repetem o id (acessibilidade)', () => {
    const acao = async () => ({})
    render(
      <>
        <FormAcao acao={acao}>
          <Campo nome="quantidade" rotulo="Quantidade A" />
        </FormAcao>
        <FormAcao acao={acao}>
          <Campo nome="quantidade" rotulo="Quantidade B" />
        </FormAcao>
      </>,
    )
    expect(screen.getByLabelText('Quantidade A').id).not.toBe(
      screen.getByLabelText('Quantidade B').id,
    )
  })
})

describe('Rodapé · Titular do SICEI e cliente licenciada', () => {
  it('mostra o titular, a licenciada e o contato comercial com link de e-mail', () => {
    render(<Rodape anoAtual={2026} licenciada="DDA Metalúrgica" />)
    expect(screen.getByText(/SICEI © 2026 Benevides Soluções Industriais/)).toBeInTheDocument()
    expect(screen.getByText(/Licenciado para DDA Metalúrgica/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'comercial@sicei.exemplo.com.br' })).toHaveAttribute(
      'href',
      'mailto:comercial@sicei.exemplo.com.br',
    )
  })

  it('sem licenciada configurada, não mostra "Licenciado para"', () => {
    render(<Rodape anoAtual={2026} licenciada={null} />)
    expect(screen.queryByText(/Licenciado para/)).not.toBeInTheDocument()
    expect(screen.getByText(/Contato comercial/)).toBeInTheDocument()
  })
})

describe('Barra de nível · Rótulos sem sobreposição', () => {
  it('marcadores longe ficam centralizados; perto, cada um vai para um lado', () => {
    const r = rotulosDoNivel([
      { pos: 15, nome: 'mínimo' },
      { pos: 17, nome: 'reposição' },
      { pos: 80, nome: 'alvo' },
    ])
    expect(r.map((m) => m.ancora)).toEqual(['fim', 'inicio', 'meio'])
  })

  it('nas pontas o rótulo encosta para dentro da barra', () => {
    const r = rotulosDoNivel([
      { pos: 2, nome: 'mínimo' },
      { pos: 50, nome: 'reposição' },
      { pos: 98, nome: 'alvo' },
    ])
    expect(r.map((m) => m.ancora)).toEqual(['inicio', 'meio', 'fim'])
  })
})
