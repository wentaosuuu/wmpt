import type { TicketType } from '../types'

export type SharedTicket = {
  id: string
  type: TicketType
  user: string
  phone: string
  content: string
  status: 'open' | 'done'
  handler: string
  result: string
  createdAt: string
  repliedAt: string
  orderId?: string
}

const API = '/api/tickets'

export async function fetchTickets(): Promise<SharedTicket[]> {
  try {
    const res = await fetch(API)
    if (!res.ok) return []
    const data = (await res.json()) as SharedTicket[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function submitTicket(ticket: SharedTicket): Promise<boolean> {
  try {
    const list = await fetchTickets()
    const next = [ticket, ...list.filter((t) => t.id !== ticket.id)]
    const res = await fetch(API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })
    return res.ok
  } catch {
    return false
  }
}
