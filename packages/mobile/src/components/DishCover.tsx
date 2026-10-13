export function DishCover({
  photo,
  cover,
  alt,
  className,
}: {
  photo?: string
  cover?: string
  alt?: string
  className?: string
}) {
  const src = photo?.trim()
  if (src) {
    return <img className={className} src={src} alt={alt ?? ''} />
  }
  return (
    <div className={className} aria-hidden>
      {cover || '🍽'}
    </div>
  )
}
