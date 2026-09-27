import { describe, expect, it } from 'vitest'
import { mensagemDoErroDeCamera, tamanhoDeAnalise } from './camera'

describe('RN-26 · Mensagens quando a câmera não abre', () => {
  it.each([
    ['NotAllowedError', /acesso à câmera foi negado/],
    ['SecurityError', /acesso à câmera foi negado/],
    ['NotFoundError', /Nenhuma câmera encontrada/],
    ['OverconstrainedError', /Nenhuma câmera encontrada/],
    ['NotReadableError', /usada por outro aplicativo/],
    ['SemSuporte', /navegador não deixa/],
    ['ConexaoInsegura', /conexão segura/],
    [undefined, /Não foi possível abrir a câmera/],
  ])('%s → mensagem certa', (nome, esperado) => {
    expect(mensagemDoErroDeCamera(nome)).toMatch(esperado)
  })
})

describe('RN-26 · Tamanho da imagem analisada', () => {
  it('1280×720 vira 640×360', () => {
    expect(tamanhoDeAnalise(1280, 720)).toEqual({ largura: 640, altura: 360 })
  })
  it('retrato 1080×1920 vira 360×640', () => {
    expect(tamanhoDeAnalise(1080, 1920)).toEqual({ largura: 360, altura: 640 })
  })
  it('imagem pequena não é ampliada', () => {
    expect(tamanhoDeAnalise(320, 240)).toEqual({ largura: 320, altura: 240 })
  })
  it('vídeo ainda sem tamanho → 0×0', () => {
    expect(tamanhoDeAnalise(0, 0)).toEqual({ largura: 0, altura: 0 })
  })
})
