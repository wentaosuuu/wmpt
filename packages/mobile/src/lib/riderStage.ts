import type { Order } from '../types'

export const RIDER_NAME = '李骑手'

/** 与接单、到店按钮写入的位置文案保持一致，用来判断骑手阶段 */
export const RIDER_TO_STORE = '前往门店途中'
export const RIDER_AT_STORE = '已到店，等待交餐'

export const riderTabs = [
  { id: 'pool', label: '待接单' },
  { id: 'heading', label: '前往门店' },
  { id: 'arrived', label: '到店待取' },
  { id: 'delivering', label: '配送中' },
  { id: 'done', label: '已完成' },
  { id: 'cancelled', label: '已取消' },
] as const

export type RiderTabId = (typeof riderTabs)[number]['id']

export function isRiderTabId(v: string | null): v is RiderTabId {
  return riderTabs.some((t) => t.id === v)
}

/** 旧链接里的「进行中」落到前往门店 */
export function normalizeRiderTab(v: string | null): RiderTabId {
  if (v === 'doing') return 'heading'
  return isRiderTabId(v) ? v : 'pool'
}

/**
 * 骑手侧阶段只随骑手按钮推进：
 * 接单去门店 → 前往门店，我已到店 → 到店待取，确认取餐 → 配送中，确认送达 → 已完成。
 * 用户取消（备餐阶段可取消）→ 已取消。
 */
export function riderTabOf(order: Order): RiderTabId | null {
  const mine = order.rider?.name === RIDER_NAME
  if (mine && order.status === 'cancelled') return 'cancelled'
  if (mine && order.status === 'delivered') return 'done'
  if (mine && order.status === 'delivering') return 'delivering'
  if (
    mine &&
    order.rider?.location === RIDER_AT_STORE &&
    ['preparing', 'ready', 'picked'].includes(order.status)
  ) {
    return 'arrived'
  }
  if (mine && ['preparing', 'ready', 'picked'].includes(order.status)) return 'heading'
  if (!order.rider && ['preparing', 'ready'].includes(order.status)) return 'pool'
  return null
}

export function riderStageLabel(tab: RiderTabId) {
  return riderTabs.find((t) => t.id === tab)?.label ?? tab
}
