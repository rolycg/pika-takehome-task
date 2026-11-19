import { expect, test } from '@playwright/test'
import { cardFor, choose, composer, listGenerations, openCreateImage, uniquePrompt, waitUntilIdle } from '../support/helpers.ts'

test.beforeEach(async ({ request }) => {
  await waitUntilIdle(request)
})

test.describe('Create Image composer', () => {
  test('offers exactly the supported aspect ratios and styles, with the example prompt', async ({ page }) => {
    await openCreateImage(page)
    const c = composer(page)

    await expect(c.prompt).toHaveAttribute('placeholder', 'A tiny astronaut exploring a bioluminescent forest.')

    await c.aspectRatio.click()
    await expect(page.getByRole('option')).toHaveText(['1:1', '16:9', '9:16'])
    await page.keyboard.press('Escape')

    await c.style.click()
    await expect(page.getByRole('option')).toHaveText(['Photorealistic', 'Illustration', 'Cinematic'])
    await page.keyboard.press('Escape')
  })

  test('Generate is disabled for an empty or whitespace-only prompt', async ({ page }) => {
    await openCreateImage(page)
    const c = composer(page)

    await expect(c.generate).toBeDisabled()
    await c.prompt.fill('   \n  ')
    await expect(c.generate).toBeDisabled()
    await c.prompt.fill('A real prompt')
    await expect(c.generate).toBeEnabled()
  })
})

test.describe('Generating', () => {
  test('a generation goes queued → processing → succeeded live, showing its inputs and the image', async ({ page, request }) => {
    let loads = 0
    page.on('load', () => loads++)
    await openCreateImage(page)
    const before = (await listGenerations(request)).length

    const prompt = uniquePrompt('A tiny astronaut exploring a bioluminescent forest.')
    const c = composer(page)
    await c.prompt.fill(prompt)
    await choose(page, c.aspectRatio, '16:9')
    await choose(page, c.style, 'Cinematic')
    await c.generate.click()

    const card = cardFor(page, prompt)
    await expect(card).toHaveAttribute('data-status', 'queued')
    await expect(card.getByText('Queued')).toBeVisible()
    // Only one generation may be active: Generate is disabled until it finishes.
    await expect(c.generate).toBeDisabled()

    await expect(card).toHaveAttribute('data-status', 'processing')
    await expect(card.getByText('Processing')).toBeVisible()
    await expect(c.generate).toBeDisabled()

    await expect(card).toHaveAttribute('data-status', 'succeeded')
    await expect(card.getByText('Succeeded')).toBeVisible()
    const image = card.getByRole('img', { name: prompt })
    await expect(image).toBeVisible()
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)

    // Original inputs are shown on the card.
    await expect(card).toContainText(prompt)
    await expect(card).toContainText('16:9')
    await expect(card).toContainText('Cinematic')

    await expect(c.generate).toBeEnabled()
    expect(loads, 'UI must update without a page reload').toBe(1)

    // One user action created exactly one record, and the backend agrees with the UI.
    const after = await listGenerations(request)
    expect(after.length).toBe(before + 1)
    expect(after[0]).toMatchObject({ prompt, aspect_ratio: '16:9', style: 'Cinematic', status: 'succeeded' })
  })

  test('a "fail" prompt (trimmed, any case) ends failed with an error', async ({ page }) => {
    await openCreateImage(page)
    const c = composer(page)
    await c.prompt.fill('   FaIL  ')
    await choose(page, c.aspectRatio, '9:16')
    await c.generate.click()

    const card = cardFor(page, 'FaIL')
    await expect(card).toHaveAttribute('data-status', 'queued')
    await expect(card).toHaveAttribute('data-status', 'processing')
    await expect(card).toHaveAttribute('data-status', 'failed')
    await expect(card.getByText('Failed', { exact: true })).toBeVisible()
    await expect(card).toContainText('The mock model rejected this prompt.')
    await expect(card.getByRole('img')).toHaveCount(0)
    await expect(c.generate).toBeEnabled()
  })

  test('the assets panel lists every generation newest first', async ({ page, request }) => {
    await openCreateImage(page)
    const c = composer(page)
    const first = uniquePrompt('First: a red balloon')
    const second = uniquePrompt('Second: a blue kite')

    for (const prompt of [first, second]) {
      await c.prompt.fill(prompt)
      await c.generate.click()
      await expect(cardFor(page, prompt)).toHaveAttribute('data-status', 'succeeded')
    }

    const labels = await page.getByTestId('generation-card').evaluateAll((cards) => cards.map((c) => c.getAttribute('aria-label')))
    expect(labels.indexOf(`Generation: ${second}`)).toBeLessThan(labels.indexOf(`Generation: ${first}`))
    expect(labels.length).toBe((await listGenerations(request)).length)
  })

  test('rapid repeated clicks on Generate create a single generation', async ({ page, request }) => {
    await openCreateImage(page)
    const before = (await listGenerations(request)).length
    const prompt = uniquePrompt('Double click: a paper crane')
    const c = composer(page)
    await c.prompt.fill(prompt)
    await c.generate.click({ clickCount: 3, delay: 20 })

    await expect(cardFor(page, prompt)).toHaveAttribute('data-status', 'succeeded')
    await expect(page.getByRole('article', { name: `Generation: ${prompt}` })).toHaveCount(1)
    const matching = (await listGenerations(request)).filter((g) => g.prompt === prompt)
    expect(matching).toHaveLength(1)
    expect((await listGenerations(request)).length).toBe(before + 1)
  })

  test('history is still there after reloading the page', async ({ page }) => {
    await openCreateImage(page)
    const prompt = uniquePrompt('Persisted: a lighthouse made of glass')
    const c = composer(page)
    await c.prompt.fill(prompt)
    await c.generate.click()
    await expect(cardFor(page, prompt)).toHaveAttribute('data-status', 'succeeded')

    await page.reload()
    await expect(cardFor(page, prompt)).toHaveAttribute('data-status', 'succeeded')
    await expect(cardFor(page, prompt).getByRole('img')).toBeVisible()
  })
})
