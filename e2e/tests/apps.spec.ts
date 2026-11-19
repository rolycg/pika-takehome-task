import { expect, test } from '@playwright/test'

test.describe('Apps page', () => {
  test('root redirects to Apps, which shows exactly one card: Create Image', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/apps$/)

    const cards = page.getByRole('main').getByRole('link')
    await expect(cards).toHaveCount(1)
    await expect(cards.first()).toHaveAccessibleName('Create Image')
    await expect(page.getByRole('heading', { name: 'Create Image' })).toBeVisible()
    await expect(page.getByText('Generate an image from a prompt, Pick any image model.')).toBeVisible()
  })

  test('clicking the Create Image card opens the app', async ({ page }) => {
    await page.goto('/apps')
    await page.getByRole('link', { name: 'Create Image' }).click()
    await expect(page).toHaveURL(/\/apps\/create-image$/)
    await expect(page.getByRole('form', { name: 'Create image' })).toBeVisible()
  })
})
