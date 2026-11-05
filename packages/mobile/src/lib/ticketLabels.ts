import type { TicketType } from '../types'

export function ticketTypeLabel(type: TicketType) {
  return type === 'complaint' ? '投诉' : '咨询'
}

export function ticketStatusLabel(status: 'open' | 'done') {
  return status === 'done' ? '已完结' : '处理中'
}

export function ticketStatusTone(status: 'open' | 'done'): 'orange' | 'green' {
  return status === 'done' ? 'green' : 'orange'
}

export function ticketHint(status: 'open' | 'done') {
  return status === 'open'
    ? '客服处理中，工作时间通常 2 小时内回复'
    : '客服已回复完结，可查看处理结果'
}
