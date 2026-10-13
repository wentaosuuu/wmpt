import { dishes, stores } from '../mock'
import type { CartItem, Dish, OrderItem, Store } from '../types'

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
    ready: '商家已出餐',
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

export type UnavailableLine = {
  key: string
  dishId: string
  name: string
  reason: 'sold_out' | 'removed'
  reasonText: string
}

/** 对照最新菜品库，找出购物车中已下架/售罄/不存在的行 */
export function findUnavailableCartItems(items: CartItem[]): UnavailableLine[] {
  const result: UnavailableLine[] = []
  for (const item of items) {
    const dish = dishById(item.dishId)
    if (!dish) {
      result.push({
        key: item.key,
        dishId: item.dishId,
        name: item.name,
        reason: 'removed',
        reasonText: '菜品已下架，无法继续购买',
      })
      continue
    }
    if (dish.soldOut) {
      result.push({
        key: item.key,
        dishId: item.dishId,
        name: item.name,
        reason: 'sold_out',
        reasonText: '菜品已售罄或暂时下架',
      })
    }
  }
  return result
}

/** 待支付订单：支付前再次校验菜品是否仍可售 */
export function findUnavailableOrderItems(items: OrderItem[]): UnavailableLine[] {
  return findUnavailableCartItems(
    items.map((i) => ({
      key: `${i.dishId}|${i.spec}|${i.remark}`,
      storeId: '',
      dishId: i.dishId,
      name: i.name,
      spec: i.spec,
      remark: i.remark,
      price: i.price,
      packingFee: i.packingFee,
      qty: i.qty,
    })),
  )
}

/** 出餐前可直接取消：待支付 / 待商家接单 / 商家备餐中 */
export function canCancel(status: string) {
  return ['pending_pay', 'pending_accept', 'preparing'].includes(status)
}

/** 出餐后～送达前：申请取消（含退款，需审核）；已送达：申请售后退款 */
export function canApplyRefund(status: string) {
  return ['ready', 'picked', 'delivering', 'delivered'].includes(status)
}

/** 履约进行中的取消申请（同意后停履约并退款） */
export function canApplyCancel(status: string) {
  return ['ready', 'picked', 'delivering'].includes(status)
}

export function cancelPreview(status: string, payable: number) {
  if (status === 'pending_pay') return { expected: 0, tip: '未支付订单将直接关闭，不产生退款。' }
  if (status === 'pending_accept') {
    return { expected: payable, tip: '商家尚未接单，取消后全额退回餐品、包装费和配送费。' }
  }
  if (status === 'preparing') {
    return {
      expected: payable,
      tip: '商家备餐中、尚未出餐，取消后按实付金额全额原路退回。',
    }
  }
  if (canApplyCancel(status)) {
    return {
      expected: payable,
      tip: '可申请取消订单（含退款），需商家审核；同意后停止履约并全额退回，不同意可联系客服。',
    }
  }
  if (status === 'delivered') {
    return {
      expected: payable,
      tip: '订单已送达，不可取消；可申请售后退款，需商家审核，不同意可联系客服。',
    }
  }
  return { expected: 0, tip: '当前状态不可操作，如有问题请联系客服。' }
}

/**
 * 取消 vs 退款（产品口径）：
 * - 取消：结束履约；已支付时退款是取消的结果，不再单独「申请退款」
 * - 退款：履约已完成（已送达）后的售后赔付，不再叫取消
 */
export const cancelRuleRows = [
  {
    status: '待支付',
    cancel: '可直接取消',
    refund: '—',
    review: '否',
    note: '直接关闭，未支付无退款',
  },
  {
    status: '待商家接单',
    cancel: '可直接取消',
    refund: '—',
    review: '否',
    note: '取消后全额原路退回',
  },
  {
    status: '商家备餐中',
    cancel: '可直接取消',
    refund: '—',
    review: '否',
    note: '尚未出餐，取消后全额退回',
  },
  {
    status: '商家已出餐',
    cancel: '可申请',
    refund: '—',
    review: '是',
    note: '取消含退款，待骑手取餐',
  },
  {
    status: '骑手已取餐',
    cancel: '可申请',
    refund: '—',
    review: '是',
    note: '取消含退款，停配送',
  },
  {
    status: '配送中',
    cancel: '可申请',
    refund: '—',
    review: '是',
    note: '取消含退款，停配送',
  },
  {
    status: '已送达',
    cancel: '—',
    refund: '可申请',
    review: '是',
    note: '履约完成，仅售后赔付',
  },
  {
    status: '商家拒单',
    cancel: '—',
    refund: '自动退款',
    review: '否',
    note: '订单关闭，已支付全额退回',
  },
  {
    status: '退款审核中',
    cancel: '—',
    refund: '审核中',
    review: '是',
    note: '等待商家处理，可联系客服',
  },
  {
    status: '已退款',
    cancel: '—',
    refund: '已完成',
    review: '—',
    note: '款项按原路退回',
  },
  {
    status: '已取消',
    cancel: '—',
    refund: '—',
    review: '—',
    note: '订单已结束',
  },
] as const

export function nextOrderId() {
  const n = Math.floor(Math.random() * 900 + 100)
  const d = new Date()
  const pad = (x: number) => String(x).padStart(2, '0')
  return `WMPT${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${n}`
}
