import { describe, expect, it } from 'vitest'
import type { Generation } from '../types'
import { generationsReducer, initialGenerationsState, selectGenerations, type GenerationsState } from './generationsReducer'

const gen = (id: string, version: number, status: Generation['status'], created_at = `2026-01-01T00:00:0${id}Z`): Generation => ({
  id,
  prompt: `prompt ${id}`,
  aspect_ratio: '1:1',
  style: 'Cinematic',
  provider: 'mock',
  status,
  version,
  attempts: 0,
  error: null,
  image_url: null,
  created_at,
  updated_at: created_at,
  started_at: null,
  completed_at: null,
})

const apply = (state: GenerationsState, ...gens: Generation[]) =>
  gens.reduce((s, generation) => generationsReducer(s, { type: 'upsert', generation }), state)

describe('generationsReducer', () => {
  it('applies newer versions and ignores stale or duplicate events', () => {
    let state = apply(initialGenerationsState, gen('1', 1, 'queued'), gen('1', 3, 'succeeded'))
    state = apply(state, gen('1', 2, 'processing'), gen('1', 3, 'succeeded'))
    expect(selectGenerations(state)[0].status).toBe('succeeded')
  })

  it('snapshot replaces state but keeps events received after the snapshot started', () => {
    let state = apply(initialGenerationsState, gen('1', 1, 'queued'))
    const startedAtSeq = state.seq
    // While the snapshot request is in flight, a new generation and an update arrive.
    state = apply(state, gen('2', 1, 'queued'), gen('1', 2, 'processing'))
    state = generationsReducer(state, { type: 'snapshot', items: [gen('1', 1, 'queued')], startedAtSeq, requestId: 1 })
    const items = selectGenerations(state)
    expect(items.map((g) => g.id)).toEqual(['2', '1'])
    expect(items[1].status).toBe('processing')
    expect(state.loaded).toBe(true)
  })

  it('snapshot drops records the server no longer has (e.g. after reset-data)', () => {
    let state = apply(initialGenerationsState, gen('1', 3, 'succeeded'))
    state = generationsReducer(state, { type: 'snapshot', items: [], startedAtSeq: state.seq, requestId: 1 })
    expect(selectGenerations(state)).toEqual([])
  })

  it('ignores an older snapshot that resolves after a newer snapshot', () => {
    let state = generationsReducer(initialGenerationsState, {
      type: 'snapshot',
      items: [gen('1', 1, 'queued')],
      startedAtSeq: 0,
      requestId: 2,
    })
    state = generationsReducer(state, { type: 'snapshot', items: [], startedAtSeq: 0, requestId: 1 })
    expect(selectGenerations(state).map((g) => g.id)).toEqual(['1'])
  })

  it('sorts newest first', () => {
    const state = apply(initialGenerationsState, gen('1', 1, 'succeeded'), gen('3', 1, 'succeeded'), gen('2', 1, 'failed'))
    expect(selectGenerations(state).map((g) => g.id)).toEqual(['3', '2', '1'])
  })
})
