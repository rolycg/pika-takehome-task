import { expect, test } from '@playwright/test'

const EMPTY_TABS = ['Projects', 'Library', 'Jobs', 'Discover'] as const

test.describe('Side navigation', () => {
  for (const tab of EMPTY_TABS) {
    test(`${tab} tab shows nothing`, async ({ page }) => {
      await page.goto('/apps')
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: tab }).click()
      await expect(page).toHaveURL(new RegExp(`/${tab.toLowerCase()}$`))

      const main = page.getByRole('main')
      await expect(main).toHaveText('')
      await expect(main.locator('img, button, a, input, textarea')).toHaveCount(0)
    })
  }

  test('Apps tab returns to the Apps page', async ({ page }) => {
    await page.goto('/library')
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Apps' }).click()
    await expect(page).toHaveURL(/\/apps$/)
    await expect(page.getByRole('link', { name: 'Create Image' })).toBeVisible()
  })
})
