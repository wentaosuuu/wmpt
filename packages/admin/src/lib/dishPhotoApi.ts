const API = '/api/dish-photos'

export async function persistDishPhotos(map: Record<string, string>): Promise<boolean> {
  try {
    const res = await fetch(API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(map),
    })
    return res.ok
  } catch {
    return false
  }
}

export function dishPhotoMapFromProducts(list: { id: string; photo?: string }[]) {
  const map: Record<string, string> = {}
  for (const p of list) {
    if (p.photo?.trim()) map[p.id] = p.photo
  }
  return map
}
