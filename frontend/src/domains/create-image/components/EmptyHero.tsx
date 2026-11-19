/** Empty-canvas hero from the Figma "Default" frame. */
export function EmptyHero() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <h2 className="font-display text-4xl font-black tracking-[0.06em] text-white uppercase xl:text-5xl">Create Image</h2>
      <img
        src="/create-image-cover.svg"
        alt=""
        className="mt-8 aspect-[3/2] w-full max-w-xl rounded-2xl object-cover"
      />
      <p className="mt-6 text-sm text-white/80">Generate an image from a prompt, Pick any image model.</p>
    </div>
  )
}
