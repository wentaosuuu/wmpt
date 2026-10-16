import type { Order } from '../types'
import { RIDER_NAME } from './riderStage'

/** 演示「今天」：与 mock 订单时间对齐 */
export const RIDER_DEMO_TODAY = '2026-10-13'

export type RiderIncomeDim = 'today' | 'week' | 'month' | 'all'

export const riderIncomeDims: { id: RiderIncomeDim; label: string }[] = [
  { id: 'today', label: '今日' },
  { id: 'week', label: '近7天' },
  { id: 'month', label: '本月' },
  { id: 'all', label: '全部' },
]

/** datetime-local 用：YYYY-MM-DDTHH:mm */
export function toInputDateTime(day: string, time: string) {
  return `${day}T${time}`
}

export function rangeForDim(dim: RiderIncomeDim, today = RIDER_DEMO_TODAY) {
  if (dim === 'today') {
    return {
      start: toInputDateTime(today, '00:00'),
      end: toInputDateTime(today, '23:59'),
    }
  }
  if (dim === 'month') {
    const [y, m] = today.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    const mm = String(m).padStart(2, '0')
    return {
      start: toInputDateTime(`${y}-${mm}-01`, '00:00'),
      end: toInputDateTime(`${y}-${mm}-${String(lastDay).padStart(2, '0')}`, '23:59'),
    }
  }
  if (dim === 'week') {
    const t = new Date(`${today}T12:00:00`)
    const start = new Date(t)
    start.setDate(t.getDate() - 6)
    const y = start.getFullYear()
    const m = String(start.getMonth() + 1).padStart(2, '0')
    const d = String(start.getDate()).padStart(2, '0')
    return {
      start: toInputDateTime(`${y}-${m}-${d}`, '00:00'),
      end: toInputDateTime(today, '23:59'),
    }
  }
  return {
    start: toInputDateTime('2026-01-01', '00:00'),
    end: toInputDateTime(today, '23:59'),
  }
}

/** 订单 createdAt「YYYY-MM-DD HH:mm」→ 可比较的 datetime-local 值 */
export function orderAtToInput(createdAt: string) {
  return createdAt.replace(' ', 'T').slice(0, 16)
}

export function inRiderIncomeRange(createdAt: string, start: string, end: string) {
  if (!start || !end) return true
  const at = orderAtToInput(createdAt)
  return at >= start && at <= end
}

/** 骑手已完成且可计入配送费收入的订单 */
export function riderDeliveredOrders(orders: Order[]) {
  return orders.filter((o) => o.rider?.name === RIDER_NAME && o.status === 'delivered')
}

export function filterRiderIncomeByRange(orders: Order[], start: string, end: string) {
  return riderDeliveredOrders(orders)
    .filter((o) => inRiderIncomeRange(o.createdAt, start, end))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function filterRiderIncome(orders: Order[], dim: RiderIncomeDim) {
  const { start, end } = rangeForDim(dim)
  return filterRiderIncomeByRange(orders, start, end)
}

export function sumDeliveryFee(orders: Order[]) {
  return orders.reduce((s, o) => s + o.deliveryFee, 0)
}
