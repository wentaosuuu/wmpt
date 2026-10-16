import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function PageHeader({
  title,
  desc,
  extra,
}: {
  title: string
  desc?: string
  extra?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        {desc ? <p>{desc}</p> : null}
      </div>
      {extra ? <div className="page-header-extra">{extra}</div> : null}
    </div>
  )
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="toolbar">{children}</div>
}

export function StatusTag({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}) {
  return <span className={`status-tag ${tone}`}>{children}</span>
}

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  width = 520,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
  width?: number
}) {
  if (!open) return null
  return (
    <div className="modal-mask" onClick={onClose} role="presentation">
      <div
        className="modal"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-hd">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-bd">{children}</div>
        {footer ? <div className="modal-ft">{footer}</div> : null}
      </div>
    </div>
  )
}

export function Empty({ text = '暂无数据' }: { text?: string }) {
  return <div className="empty-block">{text}</div>
}

export function Field({
  label,
  required,
  children,
}: {
  label: ReactNode
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="form-field">
      <label>
        {label}
        {required ? <span className="req-mark" aria-hidden="true">*</span> : null}
      </label>
      {children}
    </div>
  )
}

/** 问号悬浮说明：挂到 body，不挤占表单布局，也不被弹窗 overflow 裁切 */
export function FloatTip({ text, label = '说明' }: { text: string; label?: string }) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, place: 'bottom' as 'top' | 'bottom' })

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    const gap = 8
    const tipWidth = 280
    const tipApproxH = 72
    const place = r.bottom + gap + tipApproxH > window.innerHeight - 12 ? 'top' : 'bottom'
    const top = place === 'bottom' ? r.bottom + gap : r.top - gap
    let left = r.left + r.width / 2
    left = Math.min(Math.max(left, tipWidth / 2 + 12), window.innerWidth - tipWidth / 2 - 12)
    setPos({ top, left, place })
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="tip-icon tip-icon-btn"
        aria-label={label}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open
        ? createPortal(
            <div
              className={`float-tip-bubble ${pos.place}`}
              style={{ top: pos.top, left: pos.left }}
              role="tooltip"
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

export function DescList({
  items,
}: {
  items: { label: ReactNode; value: ReactNode; key?: string }[]
}) {
  return (
    <dl className="desc-list">
      {items.map((item, index) => (
        <div
          key={item.key ?? (typeof item.label === 'string' ? item.label : String(index))}
          className="desc-item"
        >
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
