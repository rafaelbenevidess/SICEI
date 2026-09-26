import { describe, expect, it, vi } from 'vitest'
import { ErroDePermissao } from '@/domain/permissoes'
import { ErroDeNegocio } from '../erros'
import { dadosDoFormulario, executarAcao } from './acao'

describe('Server Actions · tradução de erros para a tela', () => {
  it('sucesso devolve ok e a mensagem', async () => {
    const r = await executarAcao(async () => ({ mensagem: 'Salvo.' }))
    expect(r).toMatchObject({ ok: true, mensagem: 'Salvo.' })
    expect(r.instante).toBeTypeOf('number')
  })
  it('ErroDeNegocio vira mensagem e erros por campo', async () => {
    const r = await executarAcao(async () => {
      throw new ErroDeNegocio('Confira os campos destacados.', {
        quantidade: 'Saldo disponível: 3',
      })
    })
    expect(r).toMatchObject({
      ok: false,
      erro: 'Confira os campos destacados.',
      erros: { quantidade: 'Saldo disponível: 3' },
    })
  })
  it('ErroDePermissao vira a mensagem de permissão', async () => {
    const r = await executarAcao(async () => {
      throw new ErroDePermissao('movimentacao:estornar')
    })
    expect(r).toMatchObject({ ok: false, erro: 'Você não tem permissão para esta ação.' })
  })
  it('erro inesperado não vaza detalhes para a tela', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const r = await executarAcao(async () => {
      throw new Error('senha do banco: xyz; stack interna')
    })
    expect(r.erro).toBe('Não foi possível concluir a operação. Tente de novo.')
    expect(JSON.stringify(r)).not.toContain('xyz')
    expect(log).toHaveBeenCalled()
    log.mockRestore()
  })
  it('redirect do Next continua subindo (não é engolido)', async () => {
    const redirecionamento = Object.assign(new Error('NEXT_REDIRECT'), {
      digest: 'NEXT_REDIRECT;replace;/painel;307;',
    })
    await expect(
      executarAcao(async () => {
        throw redirecionamento
      }),
    ).rejects.toBe(redirecionamento)
  })
})

describe('Server Actions · leitura do formulário', () => {
  it('FormData vira objeto com textos; arquivos são ignorados', () => {
    const f = new FormData()
    f.set('quantidade', '4')
    f.set('tipo', 'CONSUMO_PRODUCAO')
    f.set('arquivo', new Blob(['x']), 'a.csv')
    expect(dadosDoFormulario(f)).toEqual({ quantidade: '4', tipo: 'CONSUMO_PRODUCAO' })
  })
})
