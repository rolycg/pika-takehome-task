import { AlertTriangle, Clock } from 'lucide-react'
import { Spinner } from '../../../shared/ui/Spinner'
import { relativeTime } from '../state/useNow'
import type { AspectRatio, Generation } from '../types'
import { StatusBadge } from './StatusBadge'

/** Size the media frame to the requested ratio inside a fixed-height slot. */
const FRAME: Record<AspectRatio, string> = {
  '16:9': 'w-full aspect-video',
  '1:1': 'h-full aspect-square',
  '9:16': 'h-full aspect-[9/16]',
}

function Media({ generation }: { generation: Generation }) {
  switch (generation.status) {
    case 'queued':
      return (
        <div className="flex size-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-white/50">
          <Clock className="size-5" aria-hidden />
          <span className="text-xs">Waiting in queue…</span>
        </div>
      )
    case 'processing':
      return (
        <div className="shimmer flex size-full flex-col items-center justify-center gap-2 rounded-xl bg-[#8b5cf6]/10 text-[#c4b5fd]">
          <Spinner className="size-5" />
          <span className="text-xs">Generating…</span>
        </div>
      )
    case 'succeeded':
      return (
        <img
          src={generation.image_url ?? undefined}
          alt={generation.prompt}
          className="size-full rounded-xl object-cover"
          loading="lazy"
        />
      )
    case 'failed':
      return (
        <div className="flex size-full flex-col items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-red-300">
          <AlertTriangle className="size-5" aria-hidden />
          <span className="text-xs leading-snug">{generation.error ?? 'Generation failed.'}</span>
        </div>
      )
  }
}

export function GenerationCard({ generation, now }: { generation: Generation; now: number }) {
  return (
    <article
      aria-label={`Generation: ${generation.prompt}`}
      data-testid="generation-card"
      data-status={generation.status}
      className="flex flex-col rounded-2xl bg-canvas-raised p-3"
    >
      <div className="flex h-64 items-center justify-center overflow-hidden rounded-xl bg-black/30">
        <div className={`max-h-full max-w-full ${FRAME[generation.aspect_ratio]}`}>
          <Media generation={generation} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <StatusBadge status={generation.status} />
        <time dateTime={generation.created_at} title={new Date(generation.created_at).toLocaleString()} className="text-[11px] text-white/40">
          {relativeTime(generation.created_at, now)}
        </time>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-snug text-white/90" title={generation.prompt}>
        {generation.prompt}
      </p>
      <dl className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-white/60">
        <div className="rounded-md bg-white/5 px-1.5 py-0.5">
          <dt className="sr-only">Aspect ratio</dt>
          <dd>{generation.aspect_ratio}</dd>
        </div>
        <div className="rounded-md bg-white/5 px-1.5 py-0.5">
          <dt className="sr-only">Style</dt>
          <dd>{generation.style}</dd>
        </div>
        {generation.attempts > 1 && (
          <div className="rounded-md bg-white/5 px-1.5 py-0.5" title="Resumed after a restart">
            <dt className="sr-only">Attempts</dt>
            <dd>Attempt {generation.attempts}</dd>
          </div>
        )}
      </dl>
    </article>
  )
}
