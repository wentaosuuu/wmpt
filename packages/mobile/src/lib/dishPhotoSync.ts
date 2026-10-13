import { dishes } from '../mock'

const API = '/api/dish-photos'

/** 将后台上传的菜品图合并到本地菜品；有变更返回 true */
export async function applyDishPhotos(): Promise<boolean> {
  try {
    const res = await fetch(API)
    if (!res.ok) return false
    const map = (await res.json()) as Record<string, string>
    if (!map || typeof map !== 'object') return false
    let changed = false
    for (const d of dishes) {
      const next = map[d.id]?.trim() || ''
      const prev = d.photo?.trim() || ''
      if (next !== prev) {
        d.photo = next || undefined
        changed = true
      }
    }
    return changed
  } catch {
    return false
  }
}
