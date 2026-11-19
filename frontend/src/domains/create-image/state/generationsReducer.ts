import type { Generation } from '../types'

/**
 * Client-side view of generations. Merges a REST snapshot with SSE events.
 *
 * - Every incoming record is applied only if its `version` is newer than what we hold, so
 *   out-of-order or duplicate events can never move the UI backwards.
 * - Each event gets a sequence number. A snapshot started at sequence S replaces the state,
 *   except for records we received *after* S (they may be newer than the snapshot or missing from it).
 */

interface Entry {
  generation: Generation
  receivedSeq: number
}

export interface GenerationsState {
  byId: Record<string, Entry>
  seq: number
  loaded: boolean
  latestSnapshotRequestId: number
}

export type GenerationsAction =
  | { type: 'upsert'; generation: Generation }
  | { type: 'snapshot'; items: Generation[]; startedAtSeq: number; requestId: number }

export const initialGenerationsState: GenerationsState = {
  byId: {},
  seq: 0,
  loaded: false,
  latestSnapshotRequestId: 0,
}

export function generationsReducer(state: GenerationsState, action: GenerationsAction): GenerationsState {
  switch (action.type) {
    case 'upsert': {
      const current = state.byId[action.generation.id]
      if (current && current.generation.version >= action.generation.version) return state
      const seq = state.seq + 1
      return {
        ...state,
        seq,
        byId: { ...state.byId, [action.generation.id]: { generation: action.generation, receivedSeq: seq } },
      }
    }
    case 'snapshot': {
      if (action.requestId < state.latestSnapshotRequestId) return state
      const byId: Record<string, Entry> = {}
      for (const generation of action.items) {
        byId[generation.id] = { generation, receivedSeq: action.startedAtSeq }
      }
      for (const [id, entry] of Object.entries(state.byId)) {
        const fromSnapshot = byId[id]
        if (fromSnapshot) {
          // Never move a record backwards, even if this snapshot response is older than what we hold.
          if (fromSnapshot.generation.version < entry.generation.version) byId[id] = entry
        } else if (entry.receivedSeq > action.startedAtSeq) {
          // Arrived after the snapshot was requested, so its absence there proves nothing.
          byId[id] = entry
        }
      }
      return { ...state, byId, loaded: true, latestSnapshotRequestId: action.requestId }
    }
  }
}

/** Newest first, matching the backend's ordering. */
export function selectGenerations(state: GenerationsState): Generation[] {
  return Object.values(state.byId)
    .map((e) => e.generation)
    .sort((a, b) => (a.created_at === b.created_at ? b.id.localeCompare(a.id) : b.created_at.localeCompare(a.created_at)))
}
