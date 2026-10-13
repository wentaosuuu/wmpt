import { dishes } from '../mock'

const API = '/api/dish-descriptions'

/** 将后台维护的商品描述合并到本地菜品；有变更返回 true */
export async function applyDishDescriptions(): Promise<boolean> {
  try {
    const res = await fetch(API)
    if (!res.ok) return false
    const map = (await res.json()) as Record<string, string>
    if (!map || typeof map !== 'object') return false
    let changed = false
    for (const d of dishes) {
      if (map[d.id] === undefined) continue
      const next = String(map[d.id] ?? '').trim()
      if (d.description !== next) {
        d.description = next
        changed = true
      }
    }
    return changed
  } catch {
    return false
  }
}
