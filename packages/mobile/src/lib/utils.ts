import { dishes, stores } from '../mock'
import type { CartItem, Dish, Store } from '../types'

export function nowLabel() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function money(n: number) {
  return `¥${n.toFixed(2)}`
}

export function statusText(status: string) {
  const map: Record<string, string> = {
    pending_pay: '待支付',
    pending_accept: '待商家接单',
    rejected: '商家拒单',
    preparing: '商家备餐中',
    ready: '待骑手取餐',
    picked: '骑手已取餐',
    delivering: '配送中',
    delivered: '已送达',
    cancelled: '已取消',
    refunding: '退款审核中',
    refunded: '已退款',
  }
  return map[status] ?? status
}

export function storeById(id: string): Store | undefined {
  return stores.find((s) => s.id === id)
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatHm(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** 根据下单时间与门店预计分钟，生成送达时间区间 */
export function buildEtaRange(createdAt: string, etaMin: number) {
  const raw = createdAt.includes('T') ? createdAt : createdAt.replace(' ', 'T')
  const base = new Date(raw)
  if (Number.isNaN(base.getTime())) {
    const from = Math.max(20, etaMin - 5)
    const to = etaMin + 10
    return `${from}-${to} 分钟`
  }
  const start = new Date(base.getTime() + Math.max(15, etaMin - 5) * 60_000)
  const end = new Date(base.getTime() + (etaMin + 10) * 60_000)
  return `${formatHm(start)}-${formatHm(end)}`
}

export function dishById(id: string): Dish | undefined {
  return dishes.find((d) => d.id === id)
}

/** 起送门槛仅按餐品金额计算，差额不作为收费项目。 */
export function minimumOrderShortfall(storeId: string, dishAmount: number) {
  const minimum = storeById(storeId)?.minOrder ?? 0
  return Math.max(0, Math.round(minimum * 100) - Math.round(dishAmount * 100)) / 100
}

export function cartTotals(items: CartItem[]) {
  const dishAmount = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const store = items[0] ? storeById(items[0].storeId) : undefined
  /** 包装费按订单固定收取，不按菜品累计 */
  const packingFee = items.length && store ? store.orderPackingFee : 0
  const deliveryFee = store?.deliveryFee ?? 0
  const extraFee = store?.extraFees.reduce((s, f) => s + f.amount, 0) ?? 0
  const shortfall = store ? minimumOrderShortfall(store.id, dishAmount) : 0
  return {
    dishAmount,
    packingFee,
    deliveryFee,
    extraFee,
    shortfall,
    payable: dishAmount + packingFee + deliveryFee + extraFee,
    store,
  }
}

export function cartKey(dishId: string, spec: string, remark: string) {
  return `${dishId}|${spec}|${remark}`
}

export function canCancel(status: string) {
  return ['pending_pay', 'pending_accept', 'preparing'].includes(status)
}

export function cancelPreview(status: string, payable: number) {
  if (status === 'pending_pay') return { expected: 0, tip: '未支付订单将直接关闭，不产生退款。' }
  if (status === 'pending_accept') {
    return { expected: payable, tip: '商家尚未接单，预计全额退回餐品、包装费和配送费。' }
  }
  if (status === 'preparing') {
    return {
      expected: payable,
      tip: '商家已开始备餐，取消申请审核通过后将按实付金额全额原路退回。',
    }
  }
  return { expected: 0, tip: '当前阶段不可取消，请走售后退款。' }
}

export function nextOrderId() {
  const n = Math.floor(Math.random() * 900 + 100)
  const d = new Date()
  const pad = (x: number) => String(x).padStart(2, '0')
  return `WMPT${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${n}`
}
