export type CuisineCategory = {
  id: string
  name: string
  icon: string
  sort: number
  enabled: boolean
  isAll?: boolean
}

const API = '/api/cuisine-categories'

const fallback: CuisineCategory[] = [
  { id: 'cc-all', name: '全部', icon: '🍽', sort: 0, enabled: true, isAll: true },
  { id: 'cc-fast', name: '快餐', icon: '🍱', sort: 1, enabled: true },
  { id: 'cc-noodle', name: '粉面', icon: '🍜', sort: 2, enabled: true },
  { id: 'cc-tea', name: '奶茶', icon: '🧋', sort: 3, enabled: true },
  { id: 'cc-dessert', name: '甜品', icon: '🍰', sort: 4, enabled: true },
  { id: 'cc-light', name: '轻食', icon: '🥗', sort: 5, enabled: true },
  { id: 'cc-bbq', name: '烧烤', icon: '🍢', sort: 6, enabled: true },
  { id: 'cc-drink', name: '饮品', icon: '🥤', sort: 7, enabled: true },
]

export async function fetchCuisineCategories(): Promise<CuisineCategory[]> {
  try {
    const res = await fetch(API)
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as CuisineCategory[]
    if (!Array.isArray(data) || !data.length) return fallback
    return data
  } catch {
    return fallback
  }
}

export function visibleCuisineChips(list: CuisineCategory[]) {
  return [...list]
    .filter((c) => c.enabled)
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'zh'))
    .map((c) => ({ id: c.name, label: c.name, icon: c.icon }))
}

export function isImageIcon(icon: string) {
  return /^(data:|https?:|\/)/.test(icon)
}
