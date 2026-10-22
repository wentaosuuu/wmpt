import type { Ticket } from '../types'

const API = '/api/tickets'

function normalizeTicket(raw: Ticket & { status?: string; repliedAt?: string; phone?: string }): Ticket {
  return {
    ...raw,
    phone: raw.phone ?? '',
    orderId: raw.orderId || undefined,
    status: raw.status === 'done' ? 'done' : 'open',
    repliedAt: raw.repliedAt ?? '',
  }
}

export async function fetchTickets(): Promise<Ticket[]> {
  try {
    const res = await fetch(API)
    if (!res.ok) return []
    const data = (await res.json()) as Ticket[]
    return Array.isArray(data) ? data.map(normalizeTicket) : []
  } catch {
    return []
  }
}

export async function persistTickets(list: Ticket[]): Promise<boolean> {
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
