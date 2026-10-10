import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import type { AppRole } from '../types'

const ROLE_OPTIONS: { id: AppRole; label: string; home: string; tip: string }[] = [
  { id: 'consumer', label: '消费者', home: '/', tip: '点餐下单' },
  { id: 'merchant', label: '商家', home: '/m', tip: '数据与接单' },
  { id: 'rider', label: '骑手', home: '/r', tip: '数据与配送' },
]

export function roleHome(role: AppRole) {
  return ROLE_OPTIONS.find((r) => r.id === role)?.home ?? '/'
}

export function roleLabel(role: AppRole) {
  return ROLE_OPTIONS.find((r) => r.id === role)?.label ?? '消费者'
}

export function RoleSwitcher() {
  const { role, setRole } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = ROLE_OPTIONS.find((r) => r.id === role)!

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="role-switcher" ref={ref}>
      <button className="role-switcher-btn" type="button" onClick={() => setOpen((v) => !v)}>
        <span className="role-dot" data-role={role} />
        {current.label}
        <i>▾</i>
      </button>
      {open ? (
        <div className="role-menu">
          <p className="role-menu-title">切换角色视角</p>
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={role === r.id ? 'on' : ''}
              onClick={() => {
                setRole(r.id)
                setOpen(false)
                navigate(r.home, { replace: true })
              }}
            >
              <span>
                <b>{r.label}</b>
                <em>{r.tip}</em>
              </span>
              {role === r.id ? <i>✓</i> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
