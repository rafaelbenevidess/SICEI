import { expect, test, type Page } from '@playwright/test'
import { entrar, SENHA_ADMIN } from './apoio'
import { SENHA_INICIAL_ADMIN } from './preparar'

async function trocarSenha(page: Page, atual: string, nova: string) {
  await page.waitForURL('**/trocar-senha')
  await expect(page.getByText('Primeiro acesso')).toBeVisible()
  await page.locator('input[name=senhaAtual]').fill(atual)
  await page.locator('input[name=novaSenha]').fill(nova)
  await page.locator('input[name=confirmacao]').fill(nova)
  await page.getByRole('button', { name: 'Salvar e continuar' }).click()
}

test.describe.configure({ mode: 'serial' })

test('RF-01: primeiro acesso exige troca de senha; senha fraca é recusada', async ({ page }) => {
  await entrar(page, 'admin', 'errada-errada')
  await expect(page.locator('form [role=alert]')).toHaveText('Login ou senha inválidos.')
  await entrar(page, 'admin', SENHA_INICIAL_ADMIN)
  await page.waitForURL('**/trocar-senha')
  await page.goto('/painel') // não dá para fugir da troca
  await page.waitForURL('**/trocar-senha')
  // a checklist acompanha a digitação e só libera o botão com a senha aceitável (RN-22)
  await page.locator('input[name=senhaAtual]').fill(SENHA_INICIAL_ADMIN)
  await page.locator('input[name=novaSenha]').fill('curta')
  await page.locator('input[name=confirmacao]').fill('curta')
  const salvar = page.getByRole('button', { name: 'Salvar e continuar' })
  await expect(salvar).toBeDisabled()
  await expect(page.getByText(/Pelo menos 10 caracteres: pendente/)).toBeAttached()
  await page.locator('input[name=novaSenha]').fill(SENHA_ADMIN)
  await page.locator('input[name=confirmacao]').fill(SENHA_ADMIN)
  await expect(salvar).toBeEnabled()
  await salvar.click()
  await page.waitForURL('**/painel')
  await expect(page.getByRole('heading', { name: 'Painel' })).toBeVisible()
})

test('RF-16 / RNF-02: painel no celular de 360 px sem rolagem horizontal', async ({ page }) => {
  await entrar(page, 'admin', SENHA_ADMIN)
  await page.waitForURL('**/painel')
  await expect(page.getByRole('heading', { name: 'Alertas abertos' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
})

test('RF-08 / RF-09 / RN-26: pela etiqueta QR, saída acima do saldo é barrada, saída válida confirma e o estorno devolve', async ({
  page,
}) => {
  await entrar(page, 'admin', SENHA_ADMIN)
  await page.waitForURL('**/painel')
  // o QR da gaveta leva direto ao item (RN-26)
  await page.goto('/p/A01-G01-C02')
  await expect(page.getByRole('heading', { name: /PST-002/ })).toBeVisible()
  await expect(page.getByText(/lida pela câmera/)).toBeVisible()
  await page
    .getByRole('navigation', { name: 'Registrar movimentação' })
    .getByRole('link', { name: 'Registrar saída' })
    .click()
  const form = page.locator('form[aria-label="Registrar saída"]')
  await form.locator('input[name=quantidade]').fill('9999')
  await expect(form.getByText('Saída recusada.')).toBeVisible()
  await expect(form.getByRole('button', { name: /Confirmar saída/ })).toBeDisabled()

  await form.locator('input[name=quantidade]').fill('1')
  await form.getByRole('button', { name: 'Aumentar a quantidade' }).click()
  await form
    .getByRole('group', { name: /Destino/ })
    .locator('label')
    .first()
    .click()
  await form.locator('select[name=colaboradorId]').selectOption({ index: 1 })
  await form.locator('input[name=ordemProducao]').fill('OP-E2E-1')
  await form.getByRole('button', { name: 'Confirmar saída de 2 un.' }).click()
  const ok = page.getByRole('status', { name: 'Saída registrada' })
  await expect(ok).toBeVisible()
  await expect(ok).toContainText('2 unidades de PST-002')
  await expect(ok.getByRole('link', { name: 'Ler outra etiqueta' })).toBeVisible()

  await page.goto('/movimentacoes?busca=OP-E2E-1')
  await page.locator('tbody a').first().click()
  await page.locator('textarea[name=justificativa]').fill('Lançamento de teste ponta a ponta')
  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'Estornar movimentação' }).click()
  await expect(page.getByText(/Estornada em/)).toBeVisible()
})

test('RN-26: Ler QR abre a câmera dentro do SICEI e a etiqueta leva ao item', async ({ page }) => {
  await entrar(page, 'admin', SENHA_ADMIN)
  await page.waitForURL('**/painel')
  await page
    .getByRole('navigation', { name: 'Atalhos' })
    .getByRole('link', { name: 'Ler QR' })
    .click()
  // a câmera falsa mostra o QR da posição A01-G01-C02 (tests/e2e/camera.ts)
  await page.waitForURL(/\/itens\/.+\?qr=A01-G01-C02/)
  await expect(page.getByRole('heading', { name: /PST-002/ })).toBeVisible()
  await expect(page.getByText(/lida pela câmera/)).toBeVisible()
})

test('RF-02 / RN-21: Admin cria usuário; login gerado; perfil Consulta não vê preços nem registra saída', async ({
  page,
  browser,
}) => {
  await entrar(page, 'admin', SENHA_ADMIN)
  await page.waitForURL('**/painel')
  await page.goto('/admin/usuarios')
  const form = page.locator('form[aria-label="Novo usuário"]')
  await form.locator('input[name=nome]').fill('Pedro')
  await form.locator('input[name=sobrenome]').fill('da Consulta')
  await form.locator('input[name=setor]').fill('Usinagem')
  // o login aparece enquanto o Admin digita, antes de criar
  await expect(form.getByText('pedro.consulta')).toBeVisible()
  await form.getByRole('radio', { name: 'Consulta' }).click()
  await form.getByRole('button', { name: 'Criar usuário' }).click()
  const credenciais = form.getByRole('status').filter({ hasText: 'Usuário criado' })
  await expect(credenciais.locator('dd').first()).toHaveText('pedro.consulta')
  const senha = (await credenciais.locator('dd span').first().innerText()).trim()
  expect(senha).toHaveLength(12)
  await credenciais.getByRole('button', { name: 'Já repassei, concluir' }).click()
  await expect(credenciais).toHaveCount(0)

  const outra = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await entrar(outra, 'pedro.consulta', senha)
  await trocarSenha(outra, senha, 'PedroConsulta2026')
  await outra.waitForURL('**/painel')
  await outra.goto('/p/A01-G01-C02')
  await expect(outra.getByText('O seu perfil não vê preços.')).toBeVisible()
  await expect(outra.getByText(/R\$/)).toHaveCount(0)
  await expect(outra.getByRole('link', { name: 'Registrar saída' })).toHaveCount(0)
  await outra.goto('/admin/usuarios')
  await outra.waitForURL('**/sem-permissao')
  await outra.close()
})

test('RF-21: verificação de integridade confere o log, as movimentações e os saldos', async ({
  page,
}) => {
  await entrar(page, 'admin', SENHA_ADMIN)
  await page.waitForURL('**/painel')
  await page.goto('/admin/auditoria')
  await page.getByRole('button', { name: 'Verificar agora' }).click()
  const resultado = (texto: RegExp) => page.getByRole('status').filter({ hasText: texto })
  await expect(resultado(/Cadeia íntegra\. [\d.]+ registros conferidos/)).toBeVisible()
  await expect(resultado(/Todas as movimentações batem com o log\./)).toBeVisible()
  await expect(resultado(/Nenhuma divergência de saldo nos \d+ itens\./)).toBeVisible()
  await expect(page.getByText(/Conferência registrada no log às/)).toBeVisible()
})

test('RF-20: relatório de reposição exporta CSV', async ({ page }) => {
  await entrar(page, 'admin', SENHA_ADMIN)
  await page.waitForURL('**/painel')
  await page.goto('/relatorios?tipo=reposicao')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Exportar CSV' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^sicei-reposicao-\d{4}-\d{2}-\d{2}\.csv$/)
})

test('RNF-13: laboratório público roda todos os casos no navegador', async ({ page }) => {
  await page.goto('/testes')
  await page.getByRole('button', { name: 'Executar todos' }).click()
  await expect(page.getByText(/(\d+) de \1 passaram/)).toBeVisible()
})

test('Rotina diária recusa chamada sem o segredo e aceita com ele', async ({ request }) => {
  expect((await request.get('/api/cron/diario')).status()).toBe(401)
  const ok = await request.get('/api/cron/diario', {
    headers: { Authorization: 'Bearer e2e-segredo' },
  })
  expect(ok.status()).toBe(200)
  expect(await ok.json()).toMatchObject({ itens: 6 })
})

test('Cabeçalhos de segurança presentes', async ({ request }) => {
  const r = await request.get('/login')
  expect(r.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(r.headers()['x-frame-options']).toBe('DENY')
  expect(r.headers()['x-content-type-options']).toBe('nosniff')
  expect(r.headers()['x-powered-by']).toBeUndefined()
  expect(r.headers()['permissions-policy']).toContain('camera=(self)')
})
