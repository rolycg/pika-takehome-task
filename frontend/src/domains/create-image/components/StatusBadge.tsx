import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Spinner } from '../../../shared/ui/Spinner'
import type { GenerationStatus } from '../types'

const STYLES: Record<GenerationStatus, { label: string; className: string }> = {
  queued: { label: 'Queued', className: 'bg-white/10 text-white/80' },
  processing: { label: 'Processing', className: 'bg-[#8b5cf6]/20 text-[#c4b5fd]' },
  succeeded: { label: 'Succeeded', className: 'bg-emerald-400/15 text-emerald-300' },
  failed: { label: 'Failed', className: 'bg-red-500/15 text-red-300' },
}

export function StatusBadge({ status }: { status: GenerationStatus }) {
  const { label, className } = STYLES[status]
  return (
    <span
      data-status={status}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide ${className}`}
    >
      {status === 'queued' && <Clock className="size-3" aria-hidden />}
      {status === 'processing' && <Spinner className="size-3" />}
      {status === 'succeeded' && <CheckCircle2 className="size-3" aria-hidden />}
      {status === 'failed' && <AlertTriangle className="size-3" aria-hidden />}
      {label}
    </span>
  )
}
