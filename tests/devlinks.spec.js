import { expect, test } from '@playwright/test'
import { footer, links as profileLinks, profile, socials } from '../src/data/profile.js'

const STORAGE_KEY = 'devlinks:theme'

test.describe('DevLinks', () => {
  test('renderiza perfil, links, redes sociais e rodapé', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('img', { name: profile.avatarAlt })).toBeVisible()
    await expect(page.getByTestId('username')).toHaveText(profile.username)

    const links = page.getByRole('navigation', { name: 'Links principais' }).getByRole('link')
    await expect(links).toHaveCount(profileLinks.length)

    for (const [index, link] of profileLinks.entries()) {
      await expect(links.nth(index)).toHaveText(link.label)
      await expect(links.nth(index)).toHaveAttribute('href', link.href)
    }

    const socialGroup = page.getByRole('list', { name: 'Redes sociais' })
    for (const social of socials) {
      const socialLink = socialGroup.getByRole('link', { name: social.label })
      await expect(socialLink).toBeVisible()
      await expect(socialLink).toHaveAttribute('href', social.href)
    }

    await expect(page.locator('footer')).toContainText(footer.author)
  })

  test('links externos abrem em nova aba com segurança', async ({ page }) => {
    await page.goto('/')
    const link = page
      .getByRole('navigation', { name: 'Links principais' })
      .getByRole('link', { name: profileLinks[1].label })

    await expect(link).toHaveAttribute('href', profileLinks[1].href)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('usa o tema escuro quando o sistema prefere escuro', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByTestId('theme-toggle')).toHaveAttribute('aria-checked', 'false')
  })

  test('alterna entre claro e escuro ao clicar no switch', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    const html = page.locator('html')
    const toggle = page.getByTestId('theme-toggle')

    await toggle.click()
    await expect(html).not.toHaveClass(/dark/)
    await expect(toggle).toHaveAttribute('aria-checked', 'true')

    await toggle.click()
    await expect(html).toHaveClass(/dark/)
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  test('salva a preferência no localStorage e mantém após recarregar', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')

    await page.getByTestId('theme-toggle').click()
    const saved = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
    expect(saved).toBe('"light"')

    await page.reload()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await expect(page.getByTestId('theme-toggle')).toHaveAttribute('aria-checked', 'true')
  })

  test('ignora valor inválido salvo no localStorage', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.addInitScript((key) => localStorage.setItem(key, '"roxo"'), STORAGE_KEY)
    await page.goto('/')
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('não gera rolagem horizontal (layout responsivo)', async ({ page }) => {
    await page.goto('/')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(overflow).toBe(false)
  })
})
