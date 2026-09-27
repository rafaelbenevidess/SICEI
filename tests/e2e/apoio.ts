import { expect, type Page } from '@playwright/test'

/** Senha definitiva do Admin, criada no primeiro teste da suíte do celular. */
export const SENHA_ADMIN = 'AdminE2E-2026!'

export async function entrar(page: Page, login: string, senha: string) {
  await page.goto('/login')
  await page.locator('input[name=login]').fill(login)
  await page.locator('input[name=senha]').fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

/** RF-13: depois do login, Gestor e Admin só seguem passando pela tela de alertas (VER). */
export async function passarPeloAvisoDeAlertas(page: Page) {
  if (await page.getByRole('alertdialog').count()) {
    await page.getByRole('button', { name: 'VER' }).click()
    await page.waitForURL('**/alertas')
  }
}

export async function entrarComoAdmin(page: Page) {
  await entrar(page, 'admin', SENHA_ADMIN)
  await page.waitForURL('**/painel')
  await expect(page.getByRole('heading', { name: 'Painel' })).toBeVisible()
  await passarPeloAvisoDeAlertas(page)
}

/** CNPJ numérico com dígitos verificadores corretos e raiz aleatória. */
export function cnpjAleatorio(): string {
  const base = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).concat([0, 0, 0, 1])
  const dv = (nums: number[]) => {
    const pesos =
      nums.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const resto = nums.reduce((s, n, i) => s + n * pesos[i], 0) % 11
    return resto < 2 ? 0 : 11 - resto
  }
  const d1 = dv(base)
  const d2 = dv([...base, d1])
  return [...base, d1, d2].join('')
}
