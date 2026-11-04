/** 按资质到期日推算展示状态：已过期 / 即将到期（0~30 天）/ 有效 */
export type QualDisplayStatus = 'valid' | 'expiring' | 'expired'

export function resolveQualStatus(expireAt: string, now = new Date()): QualDisplayStatus {
  if (!expireAt || expireAt === '-') return 'expired'
  const parts = expireAt.split('-').map(Number)
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return 'expired'
  const [y, m, d] = parts
  const expireDay = new Date(y, m - 1, d)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round((expireDay.getTime() - today.getTime()) / 86400000)
  if (diffDays < 0) return 'expired'
  if (diffDays <= 30) return 'expiring'
  return 'valid'
}

export const QUAL_STATUS_LABEL: Record<QualDisplayStatus, string> = {
  valid: '有效',
  expiring: '即将到期',
  expired: '已过期',
}

export function qualStatusTone(status: QualDisplayStatus): 'success' | 'warning' | 'danger' {
  if (status === 'valid') return 'success'
  if (status === 'expiring') return 'warning'
  return 'danger'
}
