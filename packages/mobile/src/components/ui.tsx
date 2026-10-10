import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppStore'

export function NavBar({
  title,
  back = true,
  extra,
}: {
  title: string
  back?: boolean
  extra?: ReactNode
}) {
  const navigate = useNavigate()
  const { role } = useApp()
  return (
    <header className="nav">
      <div className="nav-left">
        {back ? (
          <>
            <button className="nav-btn" type="button" onClick={() => navigate(-1)}>
              ‹ 返回
            </button>
            <button
              className="nav-btn"
              type="button"
              onClick={() => navigate(role === 'merchant' ? '/m' : role === 'rider' ? '/r' : '/')}
            >
              关闭
            </button>
          </>
        ) : (
          <span className="nav-btn ghost" />
        )}
      </div>
      <h1>{title}</h1>
      <div className="nav-extra">{extra}</div>
    </header>
  )
}

export function Tag({
  children,
  tone = 'blue',
}: {
  children: ReactNode
  tone?: 'blue' | 'green' | 'orange' | 'gray' | 'red'
}) {
  return <span className={`tag ${tone}`}>{children}</span>
}

export function Empty({ text, to, action }: { text: string; to?: string; action?: string }) {
  return (
    <div className="empty">
      <div className="empty-illust" aria-hidden>
        📦
      </div>
      <p>{text}</p>
      {to && action ? <Link to={to}>{action}</Link> : null}
    </div>
  )
}

export function ToastStack({ items }: { items: { id: number; text: string }[] }) {
  if (!items.length) return null
  return (
    <div className="toast-stack">
      {items.map((t) => (
        <div key={t.id} className="toast">
          {t.text}
        </div>
      ))}
    </div>
  )
}

export function MoneyRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`money-row ${strong ? 'strong' : ''}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  )
}

/** 三端统一：订单编号展示 */
export function OrderNo({
  id,
  short = false,
  className = '',
}: {
  id: string
  /** 卡片场景可只展示后 6 位 */
  short?: boolean
  className?: string
}) {
  return (
    <div className={`order-no${className ? ` ${className}` : ''}`}>
      <span>订单编号</span>
      <strong>{short ? id.slice(-6) : id}</strong>
    </div>
  )
}

export function QtyStepper({
  value,
  onMinus,
  onPlus,
  disabled,
}: {
  value: number
  onMinus: () => void
  onPlus: () => void
  disabled?: boolean
}) {
  if (!value) {
    return (
      <button className="stepper-plus" type="button" disabled={disabled} onClick={onPlus}>
        +
      </button>
    )
  }
  return (
    <div className="qty">
      <button type="button" disabled={disabled} onClick={onMinus}>
        −
      </button>
      <span>{value}</span>
      <button className="plus" type="button" disabled={disabled} onClick={onPlus}>
        +
      </button>
    </div>
  )
}
