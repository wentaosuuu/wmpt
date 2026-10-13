const API = '/api/store-min-orders'

export async function persistStoreMinOrders(map: Record<string, number>): Promise<boolean> {
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

export function minOrderMapFromMerchants(list: { id: string; minOrder: number }[]) {
  return Object.fromEntries(list.map((m) => [m.id, Number(m.minOrder) || 0]))
}
