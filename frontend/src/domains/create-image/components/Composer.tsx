import { ArrowLeft, Palette, RectangleHorizontal, Sparkles, Zap } from 'lucide-react'
import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../../../shared/api/http'
import { Select } from '../../../shared/ui/Select'
import { Spinner } from '../../../shared/ui/Spinner'
import { createGeneration, fetchOptions } from '../api'
import type { AspectRatio, Generation, GenerationOptions, Style } from '../types'

interface Props {
  active: Generation | null
  historyLoaded: boolean
  onCreated: (generation: Generation) => void
}

export function Composer({ active, historyLoaded, onCreated }: Props) {
  const [options, setOptions] = useState<GenerationOptions | null>(null)
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')
  const [style, setStyle] = useState<Style>('Photorealistic')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchOptions()
      .then((o) => {
        if (cancelled) return
        setOptions(o)
        setAspectRatio(o.default_aspect_ratio)
        setStyle(o.default_style)
      })
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [])

  const trimmed = prompt.trim()
  const busy = submitting || active !== null
  const canGenerate = historyLoaded && options !== null && trimmed.length > 0 && !busy

  const submit = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!canGenerate) return
    setSubmitting(true)
    setError(null)
    try {
      // One key per click: a network retry of this same action can't create a second record.
      const created = await createGeneration({ prompt: trimmed, aspect_ratio: aspectRatio, style }, crypto.randomUUID())
      onCreated(created)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const onPromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void submit()
  }

  const hint = active
    ? active.status === 'queued'
      ? 'Your generation is queued. You can start another when it finishes.'
      : 'Generating… You can start another when it finishes.'
    : null

  return (
    <form onSubmit={submit} className="flex h-full flex-col gap-3 p-4" aria-label="Create image">
      <div className="relative flex h-10 items-center justify-center">
        <Link to="/apps" aria-label="Back to Apps" className="absolute left-0 rounded-lg p-1.5 text-ink hover:bg-field">
          <ArrowLeft className="size-4" />
        </Link>
        <span className="rounded-full bg-white px-4 py-1.5 font-display text-xs font-black tracking-[0.08em] uppercase shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          Create Image
        </span>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-field px-3 py-2.5">
        <div>
          <div className="text-xs text-muted">Image Model</div>
          <div className="text-sm font-semibold">Mock Image Model</div>
        </div>
        <span className="flex size-8 items-center justify-center rounded-lg bg-white" title="Mocked provider — no real model is called">
          <Sparkles className="size-4" aria-hidden />
        </span>
      </div>

      <label className="flex min-h-40 flex-1 flex-col rounded-xl bg-field p-3">
        <span className="sr-only">Prompt</span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onPromptKeyDown}
          placeholder={options?.example_prompt ?? 'A tiny astronaut exploring a bioluminescent forest.'}
          maxLength={options?.prompt_max_length}
          className="size-full flex-1 resize-none bg-transparent text-sm leading-relaxed text-ink outline-none placeholder:text-[#9a9a9a]"
        />
        {options && (
          <span className="self-end text-[11px] text-muted">
            {trimmed.length}/{options.prompt_max_length}
          </span>
        )}
      </label>

      <div className="flex gap-2">
        <Select
          label="Aspect ratio"
          icon={<RectangleHorizontal className="size-4" />}
          value={aspectRatio}
          options={(options?.aspect_ratios ?? [aspectRatio]).map((value) => ({ value, label: value }))}
          onChange={setAspectRatio}
          disabled={!options}
        />
        <Select
          label="Style"
          icon={<Palette className="size-4" />}
          value={style}
          options={(options?.styles ?? [style]).map((value) => ({ value, label: value }))}
          onChange={setStyle}
          disabled={!options}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      {hint && !error && <p className="px-1 text-xs text-muted">{hint}</p>}

      <button
        type="submit"
        disabled={!canGenerate}
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/30"
      >
        {busy ? <Spinner /> : null}
        {submitting ? 'Submitting…' : active ? 'Generating…' : 'Generate'}
        {!busy && (
          <span className="flex items-center gap-0.5 rounded-full bg-white/15 px-1.5 py-0.5 text-[11px]" aria-hidden>
            <Zap className="size-3" />
            99
          </span>
        )}
      </button>
    </form>
  )
}
