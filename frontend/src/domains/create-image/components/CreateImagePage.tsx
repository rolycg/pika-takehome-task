import { useGenerations } from '../state/useGenerations'
import { Composer } from './Composer'
import { GenerationFeed } from './GenerationFeed'

export function CreateImagePage() {
  const { generations, active, loaded, connection, loadError, upsert } = useGenerations()

  return (
    <div className="flex h-full min-h-0 bg-canvas">
      <aside className="w-[380px] shrink-0 bg-white">
        <Composer active={active} historyLoaded={loaded} onCreated={upsert} />
      </aside>
      <div className="min-w-0 flex-1">
        <GenerationFeed generations={generations} loaded={loaded} connection={connection} loadError={loadError} />
      </div>
    </div>
  )
}
