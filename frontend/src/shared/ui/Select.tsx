import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

interface SelectProps<T extends string> {
  label: string
  icon?: ReactNode
  value: T
  options: readonly SelectOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
}

/** Figma-style dropdown: a filled pill that opens a floating list above it. */
export function Select<T extends string>({ label, icon, value, options, onChange, disabled }: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const openList = () => {
    setHighlight(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }

  const choose = (next: T) => {
    onChange(next)
    setOpen(false)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (disabled) return
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      openList()
      return
    }
    if (!open) return
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((h) => (h + 1) % options.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((h) => (h - 1 + options.length) % options.length)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(options[highlight].value)
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className="flex h-11 w-full items-center gap-2 rounded-xl bg-field px-3 text-left text-sm font-medium text-ink transition hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {icon && <span className="text-muted">{icon}</span>}
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? label}</span>
        <ChevronDown className={`size-4 text-muted transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute bottom-full left-0 z-20 mb-2 w-full min-w-40 overflow-hidden rounded-xl border border-black/5 bg-white py-1 shadow-xl shadow-black/10"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onPointerEnter={() => setHighlight(index)}
              onClick={() => choose(option.value)}
              className={`mx-1 cursor-pointer rounded-lg px-3 py-2 text-sm ${index === highlight ? 'bg-field' : ''} ${
                option.value === value ? 'font-semibold' : ''
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
