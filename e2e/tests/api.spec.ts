import { expect, test } from '@playwright/test'
import { API_URL } from '../support/env.ts'
import { listGenerations, uniquePrompt, waitUntilIdle } from '../support/helpers.ts'

const valid = { prompt: 'A tiny astronaut exploring a bioluminescent forest.', aspect_ratio: '1:1', style: 'Illustration' }

test.beforeEach(async ({ request }) => {
  await waitUntilIdle(request)
})

test.describe('Backend contract (real server)', () => {
  test('rejects empty prompts and unsupported options without creating anything', async ({ request }) => {
    const before = (await listGenerations(request)).length
    const invalid = [
      { ...valid, prompt: '' },
      { ...valid, prompt: '    ' },
      { ...valid, aspect_ratio: '4:3' },
      { ...valid, style: 'Anime' },
    ]
    for (const body of invalid) {
      const response = await request.post(`${API_URL}/api/generations`, { data: body })
      expect(response.status(), JSON.stringify(body)).toBe(422)
      expect((await response.json()).error.code).toBe('validation_error')
    }
    expect((await listGenerations(request)).length).toBe(before)
  })

  test('creates a queued generation immediately and returns its id without waiting', async ({ request }) => {
    const started = Date.now()
    const response = await request.post(`${API_URL}/api/generations`, { data: { ...valid, prompt: uniquePrompt('Immediate') } })
    expect(Date.now() - started).toBeLessThan(1000) // mock takes ≥2.5 s, so we did not wait for it
    expect(response.status()).toBe(202)
    const body = await response.json()
    expect(body.id).toBeTruthy()
    expect(body.status).toBe('queued')
  })

  test('only one generation can be active at a time', async ({ request }) => {
    const first = await request.post(`${API_URL}/api/generations`, { data: { ...valid, prompt: uniquePrompt('Active one') } })
    expect(first.status()).toBe(202)
    const second = await request.post(`${API_URL}/api/generations`, { data: { ...valid, prompt: uniquePrompt('Second while active') } })
    expect(second.status()).toBe(409)
    expect((await second.json()).error.active_generation_id).toBe((await first.json()).id)
  })

  test('the same Idempotency-Key never creates a second record', async ({ request }) => {
    const headers = { 'Idempotency-Key': `e2e-${Date.now()}` }
    const data = { ...valid, prompt: uniquePrompt('Idempotent') }
    const a = await request.post(`${API_URL}/api/generations`, { data, headers })
    const b = await request.post(`${API_URL}/api/generations`, { data, headers })
    expect(a.status()).toBe(202)
    expect(b.status()).toBe(200)
    expect((await b.json()).id).toBe((await a.json()).id)
    expect((await listGenerations(request)).filter((g) => g.prompt === data.prompt)).toHaveLength(1)
  })
})
