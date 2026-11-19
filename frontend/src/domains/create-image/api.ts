import { requestJson } from '../../shared/api/http'
import type { CreateGenerationInput, Generation, GenerationOptions } from './types'

export const EVENTS_URL = '/api/events'
export const GENERATION_UPDATED = 'generation.updated'

export const fetchOptions = () => requestJson<GenerationOptions>('/api/generations/options')

export async function fetchGenerations(): Promise<Generation[]> {
  return (await requestJson<{ items: Generation[] }>('/api/generations')).items
}

/** One idempotency key per user action: retries/double-submits of the same action can't duplicate. */
export function createGeneration(input: CreateGenerationInput, idempotencyKey: string): Promise<Generation> {
  return requestJson<Generation>('/api/generations', {
    method: 'POST',
    body: JSON.stringify(input),
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}
