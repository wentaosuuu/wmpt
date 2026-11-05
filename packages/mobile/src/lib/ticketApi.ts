import type { Ticket } from '../types'

const API = '/api/tickets'

export async function fetchTickets(): Promise<Ticket[]> {
  try {
    const res = await fetch(API)
    if (!res.ok) return []
    const data = (await res.json()) as Ticket[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function submitTicket(ticket: Ticket): Promise<boolean> {
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
