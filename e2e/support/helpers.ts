import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test'
import { API_URL } from './env.ts'

export type Status = 'queued' | 'processing' | 'succeeded' | 'failed'

export interface Generation {
  id: string
  prompt: string
  aspect_ratio: string
  style: string
  status: Status
  attempts: number
  error: string | null
  image_url: string | null
}

export async function listGenerations(request: APIRequestContext, baseUrl = API_URL): Promise<Generation[]> {
  const response = await request.get(`${baseUrl}/api/generations`)
  expect(response.ok()).toBeTruthy()
  return (await response.json()).items
}

/** Tests share one backend and the product allows one active generation, so start each test idle. */
export async function waitUntilIdle(request: APIRequestContext, baseUrl = API_URL): Promise<void> {
  await expect
    .poll(async () => (await listGenerations(request, baseUrl)).filter((g) => g.status === 'queued' || g.status === 'processing').length, {
      timeout: 15_000,
    })
    .toBe(0)
}

export const uniquePrompt = (text: string) => `${text} #${Date.now().toString(36)}`

export const composer = (page: Page) => ({
  prompt: page.getByRole('textbox', { name: 'Prompt' }),
  aspectRatio: page.getByRole('button', { name: 'Aspect ratio' }),
  style: page.getByRole('button', { name: 'Style' }),
  generate: page.getByRole('button', { name: /^(Generate|Generating…|Submitting…)/ }),
})

export async function choose(page: Page, select: Locator, option: string): Promise<void> {
  await select.click()
  await page.getByRole('option', { name: option, exact: true }).click()
  await expect(select).toContainText(option)
}

export const cardFor = (page: Page, prompt: string) => page.getByRole('article', { name: `Generation: ${prompt}` })

export async function openCreateImage(page: Page): Promise<void> {
  await page.goto('/apps/create-image')
  await expect(page.getByText('Live', { exact: true })).toBeVisible()
}
