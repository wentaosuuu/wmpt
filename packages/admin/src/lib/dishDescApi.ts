const API = '/api/dish-descriptions'

export async function persistDishDescriptions(map: Record<string, string>): Promise<boolean> {
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

export function dishDescMapFromProducts(list: { id: string; description: string }[]) {
  return Object.fromEntries(list.map((p) => [p.id, p.description || '']))
}
