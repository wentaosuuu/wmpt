import type { Order } from '../types'
import { MERCHANT_STORE_ID, merchantStoreOrders } from './merchantStore'
import {
  inRiderIncomeRange,
  rangeForDim,
  riderIncomeDims,
  type RiderIncomeDim,
} from './riderIncome'

/** 与骑手端同一套时间维度：今日 / 近7天 / 本月 / 全部 */
export type MerchantRevenueDim = RiderIncomeDim
export const merchantRevenueDims = riderIncomeDims
export { rangeForDim }

/** 商家侧有效营收：餐品+包装+附加（不含配送费） */
export function merchantAmount(o: {
  dishAmount: number
  packingFee: number
  extraFee: number
}) {
  return o.dishAmount + o.packingFee + o.extraFee
}

/** 本店且计入营收的已完成订单 */
export function merchantSettledOrders(orders: Order[], storeId = MERCHANT_STORE_ID) {
  return merchantStoreOrders(orders).filter(
    (o) => o.storeId === storeId && o.status === 'delivered',
  )
}

export function filterMerchantRevenueByRange(
  orders: Order[],
  start: string,
  end: string,
  storeId = MERCHANT_STORE_ID,
) {
  return merchantSettledOrders(orders, storeId)
    .filter((o) => inRiderIncomeRange(o.createdAt, start, end))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function sumMerchantRevenue(orders: Order[]) {
  return orders.reduce((s, o) => s + merchantAmount(o), 0)
}

/** 本店今日营收概览（含进行中有效单） */
export function todayMerchantOverview(orders: Order[], storeId = MERCHANT_STORE_ID) {
  const { start, end } = rangeForDim('today')
  const mine = merchantStoreOrders(orders).filter((o) => o.storeId === storeId)
  const inToday = (o: Order) => inRiderIncomeRange(o.createdAt, start, end)
  const valid = mine.filter(
    (o) => !['pending_pay', 'cancelled', 'rejected'].includes(o.status) && inToday(o),
  )
  const settled = mine.filter((o) => o.status === 'delivered' && inToday(o))
  return {
    sales: sumMerchantRevenue(valid),
    settledCount: settled.length,
  }
}
