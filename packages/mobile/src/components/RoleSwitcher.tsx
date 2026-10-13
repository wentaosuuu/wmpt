import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import type { AppRole } from '../types'

const ROLE_OPTIONS: { id: AppRole; label: string; home: string; tip: string; lockedTip: string }[] = [
  { id: 'consumer', label: '消费者', home: '/', tip: '点餐下单', lockedTip: '' },
  {
    id: 'merchant',
    label: '商家',
    home: '/m',
    tip: '数据与接单',
    lockedTip: '需后台入驻审核通过',
  },
  {
    id: 'rider',
    label: '骑手',
    home: '/r',
    tip: '数据与配送',
    lockedTip: '需后台骑手注册启用',
  },
]

export function roleHome(role: AppRole) {
  return ROLE_OPTIONS.find((r) => r.id === role)?.home ?? '/'
}

export function roleLabel(role: AppRole) {
  return ROLE_OPTIONS.find((r) => r.id === role)?.label ?? '消费者'
}

export function RoleSwitcher() {
  const { role, setRole, canUseRole, toast } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirmConsumer, setConfirmConsumer] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = ROLE_OPTIONS.find((r) => r.id === role)!

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function applyRole(next: AppRole) {
    if (!setRole(next)) return
    setOpen(false)
    setConfirmConsumer(false)
    navigate(roleHome(next), { replace: true })
  }

  function requestRole(next: AppRole) {
    if (next === role) {
      setOpen(false)
      return
    }
    if (!canUseRole(next)) {
      const tip = ROLE_OPTIONS.find((r) => r.id === next)?.lockedTip
      toast(tip || '当前账号暂未开通该角色')
      return
    }
    if (role === 'rider' && next === 'consumer') {
      setOpen(false)
      setConfirmConsumer(true)
      return
    }
    applyRole(next)
  }

  return (
    <div className="role-switcher" ref={ref}>
      <button className="role-switcher-btn" type="button" onClick={() => setOpen((v) => !v)}>
        <span className="role-dot" data-role={role} />
        {current.label}
        <i>▾</i>
      </button>
      {open ? (
        <div className="role-menu">
          <p className="role-menu-title">切换角色</p>
          {ROLE_OPTIONS.map((r) => {
            const locked = !canUseRole(r.id)
            return (
              <button
                key={r.id}
                type="button"
                className={`${role === r.id ? 'on' : ''}${locked ? ' locked' : ''}`}
                disabled={locked && r.id !== role}
                onClick={() => requestRole(r.id)}
              >
                <span>
                  <b>{r.label}</b>
                  <em>{locked ? r.lockedTip : r.tip}</em>
                </span>
                {role === r.id ? <i>✓</i> : locked ? <i className="lock">未开通</i> : null}
              </button>
            )
          })}
        </div>
      ) : null}

      {confirmConsumer ? (
        <div className="role-sheet" onClick={() => setConfirmConsumer(false)}>
          <div className="role-sheet-card" onClick={(e) => e.stopPropagation()}>
            <h3>确认切换为消费者？</h3>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.5 }}>
              切换后将停止听单，无法继续抢新的配送单。如需再次接单，请重新切换回骑手端并保持听单。
            </p>
            <div className="role-actions">
              <button type="button" className="btn ghost" onClick={() => setConfirmConsumer(false)}>
                继续当骑手
              </button>
              <button type="button" className="btn" onClick={() => applyRole('consumer')}>
                确认切换
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
