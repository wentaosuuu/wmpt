function isPhotoSrc(src: string) {
  return (
    src.startsWith('data:image') ||
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('/')
  )
}

/** 门牌照片优先；无照片时回退 emoji / 文字封面 */
export function StoreCover({
  doorPhoto,
  cover,
  className = '',
  alt = '门店',
}: {
  doorPhoto?: string
  cover: string
  className?: string
  alt?: string
}) {
  const src = doorPhoto?.trim() || cover
  if (isPhotoSrc(src)) {
    return <img className={className} src={src} alt={alt} />
  }
  return (
    <div className={className} aria-hidden>
      {src || '🏪'}
    </div>
  )
}
