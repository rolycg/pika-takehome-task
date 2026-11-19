import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AppCard } from './AppCard'
import { fetchApps, type AppEntry } from './api'

export function AppsPage() {
  const [apps, setApps] = useState<AppEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchApps()
      .then((items) => !cancelled && setApps(items))
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="h-full overflow-y-auto bg-app">
      <div className="mx-auto max-w-6xl px-10 py-8">
        <label className="flex h-11 items-center gap-2 rounded-full border border-black/5 bg-white px-4 text-sm text-muted">
          <Search className="size-4" aria-hidden />
          <input
            type="search"
            placeholder="Search for apps, models and more..."
            aria-label="Search apps"
            className="w-full bg-transparent text-ink outline-none placeholder:text-muted"
          />
        </label>

        <h1 className="sr-only">Apps</h1>
        {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
        <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-5 gap-y-8">
          {apps?.map((app) => <AppCard key={app.id} app={app} />)}
        </div>
      </div>
    </div>
  )
}
