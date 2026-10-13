import type { CuisineCategory } from '../types'
import { cuisineCategories as seed } from '../mock'

const API = '/api/cuisine-categories'

export async function fetchCuisineCategories(): Promise<CuisineCategory[]> {
  try {
    const res = await fetch(API)
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as CuisineCategory[]
    if (!Array.isArray(data) || !data.length) return seed
    return data
  } catch {
    return seed
  }
}

export async function persistCuisineCategories(list: CuisineCategory[]): Promise<boolean> {
  try {
    const res = await fetch(API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    })
    return res.ok
  } catch {
    return false
  }
}

export function sortCuisineCategories(list: CuisineCategory[]) {
  return [...list].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'zh'))
}
