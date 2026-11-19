/** Projects, Library, Jobs and Discover intentionally show nothing (out of scope for the take-home). */
export function BlankPage({ title }: { title: string }) {
  return <section aria-label={title} className="h-full bg-app" />
}
