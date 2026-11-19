import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { EVENTS_URL, GENERATION_UPDATED, fetchGenerations } from '../api'
import { isActive, type Generation } from '../types'
import { generationsReducer, initialGenerationsState, selectGenerations } from './generationsReducer'

export type ConnectionState = 'connecting' | 'live' | 'reconnecting'

const RECONNECT_DELAY_MS = 2000

/**
 * Live list of generations: REST snapshot + Server-Sent Events, no polling.
 * Every time the stream (re)opens the server sends `ready`, and we refetch the snapshot so
 * anything missed while disconnected is recovered.
 */
export function useGenerations() {
  const [state, dispatch] = useReducer(generationsReducer, initialGenerationsState)
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const [loadError, setLoadError] = useState<string | null>(null)
  const seqRef = useRef(0)
  const snapshotRequestRef = useRef(0)
  useEffect(() => {
    seqRef.current = state.seq
  }, [state.seq])

  const upsert = useCallback((generation: Generation) => dispatch({ type: 'upsert', generation }), [])

  useEffect(() => {
    let source: EventSource | null = null
    let retry: ReturnType<typeof setTimeout> | undefined
    let disposed = false

    const resync = () => {
      const startedAtSeq = seqRef.current
      const requestId = ++snapshotRequestRef.current
      fetchGenerations()
        .then((items) => {
          if (disposed) return
          dispatch({ type: 'snapshot', items, startedAtSeq, requestId })
          setLoadError(null)
        })
        .catch((e: Error) => {
          if (!disposed && requestId === snapshotRequestRef.current) setLoadError(e.message)
        })
    }

    const connect = () => {
      source = new EventSource(EVENTS_URL)
      source.addEventListener('ready', () => {
        setConnection('live')
        resync()
      })
      source.addEventListener(GENERATION_UPDATED, (event) => {
        upsert(JSON.parse((event as MessageEvent<string>).data) as Generation)
      })
      source.onerror = () => {
        if (disposed) return
        setConnection('reconnecting')
        // The browser retries on its own unless the connection is fully closed (e.g. proxy error).
        if (source?.readyState === EventSource.CLOSED) {
          source.close()
          retry = setTimeout(connect, RECONNECT_DELAY_MS)
        }
      }
    }

    resync() // show history right away, even before the stream is up
    connect()
    return () => {
      disposed = true
      clearTimeout(retry)
      source?.close()
    }
  }, [upsert])

  const generations = useMemo(() => selectGenerations(state), [state])
  const active = useMemo(() => generations.find(isActive) ?? null, [generations])

  return { generations, active, loaded: state.loaded, connection, loadError, upsert }
}
