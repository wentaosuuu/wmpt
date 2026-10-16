import type { Order } from '../types'

/** 演示商家账号绑定的门店（与门店管理 s1 一致） */
export const MERCHANT_STORE_ID = 's1'
export const MERCHANT_STORE_NAME = '南门食堂 · 外卖档口'

/** 仅本店订单 */
export function merchantStoreOrders(orders: Order[]) {
  return orders.filter((o) => o.storeId === MERCHANT_STORE_ID)
}
