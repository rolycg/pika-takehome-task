/** Placeholder product mark (original artwork, not the Pika logo). */
export function Logo({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#111" />
      <circle cx="16" cy="16" r="6.5" fill="#7cffd4" />
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="#7cffd4" strokeOpacity=".35" strokeWidth="1.5" />
    </svg>
  )
}
