import { stores } from '../mock'

const API = '/api/store-min-orders'

/** 将后台配置的起送费合并到门店数据；有变更时返回 true */
export async function applyStoreMinOrders(): Promise<boolean> {
  try {
    const res = await fetch(API)
    if (!res.ok) return false
    const map = (await res.json()) as Record<string, number>
    if (!map || typeof map !== 'object') return false
    let changed = false
    for (const s of stores) {
      if (map[s.id] === undefined) continue
      const next = Math.round((Number(map[s.id]) || 0) * 100) / 100
      if (s.minOrder !== next) {
        s.minOrder = next
        changed = true
      }
    }
    return changed
  } catch {
    return false
  }
}
