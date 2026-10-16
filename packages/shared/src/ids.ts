function pad(n: number, len: number) {
  return String(n).padStart(len, '0')
}

export function formatDateCompact(d = new Date()) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`
}

export function formatDateTimeCompact(d = new Date()) {
  return `${formatDateCompact(d)}${pad(d.getHours(), 2)}${pad(d.getMinutes(), 2)}${pad(d.getSeconds(), 2)}`
}

/** 订单号说明：WMPT + yyyyMMdd + 6 位当日序号 */
export const ORDER_ID_TIP =
  '订单号规则：WMPT + 日期（yyyyMMdd）+ 6 位当日序号，例 WMPT20260915000001。'

/** 流水号说明：TF + yyyyMMddHHmmss + 4 位序号 */
export const TRADE_NO_TIP =
  '流水号规则：TF + 交易时间（yyyyMMddHHmmss）+ 4 位序号，例 TF202609151120180001。'

/**
 * 订单号：WMPT + yyyyMMdd + 6 位当日序号
 * 传入已有订单号时，按当日最大序号 + 1 生成，避免冲突。
 */
export function nextOrderId(existingIds: string[] = [], d = new Date()) {
  const prefix = `WMPT${formatDateCompact(d)}`
  let max = 0
  for (const id of existingIds) {
    if (!id.startsWith(prefix)) continue
    const n = Number.parseInt(id.slice(prefix.length), 10)
    if (Number.isInteger(n) && n > max) max = n
  }
  const next = max >= 999999 ? 1 : max + 1
  return `${prefix}${pad(next, 6)}`
}

/**
 * 流水号：TF + yyyyMMddHHmmss + 4 位序号
 * 传入已有流水号时，按同一秒内最大序号 + 1 生成。
 */
export function nextTradeNo(existingNos: string[] = [], d = new Date()) {
  const prefix = `TF${formatDateTimeCompact(d)}`
  let max = 0
  for (const no of existingNos) {
    if (!no.startsWith(prefix)) continue
    const n = Number.parseInt(no.slice(prefix.length), 10)
    if (Number.isInteger(n) && n > max) max = n
  }
  const next = max >= 9999 ? 1 : max + 1
  return `${prefix}${pad(next, 4)}`
}

/** 将旧版短订单号（日期后 3 位）规范为 6 位序号格式，已是新格式则原样返回 */
export function normalizeOrderId(id: string) {
  const m = /^WMPT(\d{8})(\d{1,6})$/.exec(id)
  if (!m) return id
  return `WMPT${m[1]}${pad(Number.parseInt(m[2], 10), 6)}`
}
