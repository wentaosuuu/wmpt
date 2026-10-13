export const PILOT_BUILDINGS = [
  '科研楼 A/B 座',
  '人才公寓 1-3 号楼',
  '南门食堂及周边',
  '商业街 B 区',
  '北区生活街',
]

export function splitHours(hours: string): { start: string; end: string } {
  const [start = '10:00', end = '20:00'] = hours.split('-').map((s) => s.trim())
  return { start: start.slice(0, 5), end: end.slice(0, 5) }
}

export function joinHours(start: string, end: string) {
  return `${start}-${end}`
}

export function channelLabel(channel: string) {
  return channel === 'wechat' ? '微信支付' : channel === 'alipay' ? '支付宝' : channel
}

export function tradeTypeLabel(type: string) {
  return type === 'pay' ? '支付' : type === 'refund' ? '退款' : type
}

export function tradeStatusLabel(status: string) {
  return status === 'success' ? '成功' : status === 'failed' ? '失败' : '处理中'
}
