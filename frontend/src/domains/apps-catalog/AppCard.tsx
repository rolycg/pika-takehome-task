import { ImagePlus } from 'lucide-react'
import { Link } from 'react-router'
import type { AppEntry } from './api'

/** Card art is owned by the frontend; the catalog API supplies id, copy and route. */
const COVERS: Record<string, string> = {
  'create-image': '/create-image-cover.svg',
}

export function AppCard({ app }: { app: AppEntry }) {
  return (
    <Link to={app.path} className="group block focus-visible:outline-none" aria-label={app.name}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-canvas ring-offset-2 ring-offset-app group-focus-visible:ring-2 group-focus-visible:ring-ink">
        <img
          src={COVERS[app.id]}
          alt=""
          className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute bottom-3 left-3 flex size-9 items-center justify-center rounded-lg bg-[#b9a6ff] text-ink shadow">
          <ImagePlus className="size-5" aria-hidden />
        </span>
      </div>
      <h2 className="mt-3 text-[15px] font-semibold text-ink">{app.name}</h2>
      <p className="mt-0.5 text-sm leading-snug text-muted">{app.description}</p>
    </Link>
  )
}
