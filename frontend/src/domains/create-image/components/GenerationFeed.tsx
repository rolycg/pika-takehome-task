import { useNow } from '../state/useNow'
import type { ConnectionState } from '../state/useGenerations'
import type { Generation } from '../types'
import { EmptyHero } from './EmptyHero'
import { GenerationCard } from './GenerationCard'

interface Props {
  generations: Generation[]
  loaded: boolean
  connection: ConnectionState
  loadError: string | null
}

const CONNECTION_LABEL: Record<ConnectionState, { text: string; dot: string }> = {
  connecting: { text: 'Connecting…', dot: 'bg-white/40' },
  live: { text: 'Live', dot: 'bg-emerald-400' },
  reconnecting: { text: 'Reconnecting…', dot: 'bg-amber-400 animate-pulse' },
}

export function GenerationFeed({ generations, loaded, connection, loadError }: Props) {
  const now = useNow()
  const status = CONNECTION_LABEL[connection]

  return (
    <section aria-label="Generations" className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between px-8 pt-6 pb-4">
        <h1 className="text-base font-semibold text-white">
          Generations
          {generations.length > 0 && <span className="ml-2 text-sm font-normal text-white/40">{generations.length}</span>}
        </h1>
        <span className="flex items-center gap-2 text-xs text-white/50" aria-live="polite">
          <span className={`size-1.5 rounded-full ${status.dot}`} aria-hidden />
          {status.text}
        </span>
      </header>
      {loadError && <p className="px-8 text-sm text-red-300">{loadError}</p>}
      <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-8">
        {loaded && generations.length === 0 ? (
          <EmptyHero />
        ) : (
          <ol className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {generations.map((generation) => (
              <li key={generation.id}>
                <GenerationCard generation={generation} now={now} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
