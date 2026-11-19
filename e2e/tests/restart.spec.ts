/**
 * Restart behaviour against a dedicated backend process (not the shared suite server), so the
 * test can stop, crash and restart it. Policy under test: completed work survives; interrupted
 * work resumes (docs/decisions/0008-restart-resume-policy.md).
 */
import { expect, test } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { startApi, type ApiProcess } from '../support/api-process.ts'
import { listGenerations, type Generation } from '../support/helpers.ts'

const PORT = 8101
const body = { prompt: 'Restart: a paper boat in a storm', aspect_ratio: '9:16', style: 'Illustration' }

let dataDir: string
let api: ApiProcess | undefined

test.beforeEach(() => {
  dataDir = mkdtempSync(path.join(os.tmpdir(), 'create-image-e2e-'))
})

test.afterEach(async () => {
  await api?.stop('SIGKILL')
  api = undefined
  rmSync(dataDir, { recursive: true, force: true })
})

async function statusOf(request: import('@playwright/test').APIRequestContext, url: string, id: string): Promise<Generation> {
  return (await (await request.get(`${url}/api/generations/${id}`)).json()) as Generation
}

test('completed generations survive a backend restart', async ({ request }) => {
  api = await startApi(PORT, dataDir)
  const created = await (await request.post(`${api.url}/api/generations`, { data: body })).json()
  await expect.poll(async () => (await statusOf(request, api!.url, created.id)).status, { timeout: 15_000 }).toBe('succeeded')

  await api.stop('SIGTERM')
  api = await startApi(PORT, dataDir)

  const items = await listGenerations(request, api.url)
  expect(items).toHaveLength(1)
  expect(items[0]).toMatchObject({ id: created.id, prompt: body.prompt, aspect_ratio: '9:16', style: 'Illustration', status: 'succeeded' })
  expect((await request.get(`${api.url}${items[0].image_url}`)).ok()).toBeTruthy()
})

test('a generation interrupted while processing resumes after the backend restarts', async ({ request }) => {
  // Long processing window so the crash reliably lands mid-processing.
  api = await startApi(PORT, dataDir, { MOCK_PROCESSING_DELAY_S: '5' })
  const created = await (await request.post(`${api.url}/api/generations`, { data: body })).json()
  await expect.poll(async () => (await statusOf(request, api!.url, created.id)).status, { timeout: 10_000 }).toBe('processing')

  await api.stop('SIGKILL') // simulate a crash
  api = await startApi(PORT, dataDir)

  await expect.poll(async () => (await statusOf(request, api!.url, created.id)).status, { timeout: 15_000 }).toBe('succeeded')
  const finished = await statusOf(request, api.url, created.id)
  expect(finished.attempts).toBe(2)
  expect(await listGenerations(request, api.url)).toHaveLength(1)
})
