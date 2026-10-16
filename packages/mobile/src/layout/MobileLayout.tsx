import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { RoleSwitcher, roleHome } from '../components/RoleSwitcher'
import { ToastStack } from '../components/ui'
import { useApp } from '../store/AppStore'
import type { AppRole } from '../types'
import './MobileLayout.css'

function brandTitle(role: AppRole) {
  if (role === 'merchant') return '商家端'
  if (role === 'rider') return '骑手端'
  return '消费者'
}

function TabIcon({
  name,
  active,
}: {
  name: 'home' | 'shop' | 'order' | 'mine' | 'task'
  active: boolean
}) {
  const color = active ? '#1677ff' : '#8c8c8c'
  if (name === 'home') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
          stroke={color}
          strokeWidth="1.8"
          fill={active ? 'rgba(22,119,255,.12)' : 'none'}
        />
      </svg>
    )
  }
  if (name === 'shop' || name === 'task') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 8h16l-1.2 11.2A2 2 0 0 1 16.81 21H7.19a2 2 0 0 1-1.99-1.8L4 8Z"
          stroke={color}
          strokeWidth="1.8"
          fill={active ? 'rgba(22,119,255,.12)' : 'none'}
        />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" stroke={color} strokeWidth="1.8" />
      </svg>
    )
  }
  if (name === 'order') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="5"
          y="3"
          width="14"
          height="18"
          rx="2"
          stroke={color}
          strokeWidth="1.8"
          fill={active ? 'rgba(22,119,255,.12)' : 'none'}
        />
        <path d="M9 8h6M9 12h6M9 16h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke={color}
        strokeWidth="1.8"
        fill={active ? 'rgba(22,119,255,.12)' : 'none'}
      />
      <path
        d="M5 19.5c1.8-3.2 4.2-4.8 7-4.8s5.2 1.6 7 4.8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function tabsFor(role: AppRole) {
  if (role === 'merchant') {
    return [
      { to: '/m', end: true, label: '数据', icon: 'home' as const },
      { to: '/m/orders', label: '订单处理', icon: 'order' as const },
    ]
  }
  if (role === 'rider') {
    return [
      { to: '/r', end: true, label: '数据', icon: 'home' as const },
      { to: '/r/tasks', label: '订单处理', icon: 'task' as const },
    ]
  }
  return [
    { to: '/', end: true, label: '首页', icon: 'home' as const },
    { to: '/orders', label: '订单', icon: 'order' as const },
    { to: '/mine', label: '我的', icon: 'mine' as const },
  ]
}

function Shell({ withTab }: { withTab: boolean }) {
  const { toasts, role, setRole, canUseRole, toast } = useApp()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    let next: AppRole | null = null
    if (pathname === '/m' || pathname.startsWith('/m/')) next = 'merchant'
    else if (pathname === '/r' || pathname.startsWith('/r/')) next = 'rider'
    else if (
      pathname === '/' ||
      pathname === '/shops' ||
      pathname === '/orders' ||
      pathname === '/mine' ||
      pathname === '/cart'
    ) {
      next = 'consumer'
    }
    if (!next || next === role) return
    if (!canUseRole(next)) {
      toast(
        next === 'merchant'
          ? '需后台商家入驻审核通过后才能进入商家端'
          : '需后台完成骑手注册并启用后才能进入骑手端',
      )
      navigate('/', { replace: true })
      return
    }
    setRole(next, true)
  }, [pathname, role, setRole, canUseRole, toast, navigate])

  const tabs = tabsFor(role)

  return (
    <div className="mobile-stage">
      <div className="mobile-device">
        <div className="mobile-status">
          <span>9:41</span>
          <span className="mobile-notch" />
          <span>●●● ▮</span>
        </div>
        <div className="role-bar">
          <button
            type="button"
            className="role-brand"
            onClick={() => navigate(roleHome(role))}
          >
            {brandTitle(role)}
          </button>
          <RoleSwitcher />
        </div>
        <div className="mobile-body">
          <Outlet />
        </div>
        {withTab ? (
          <nav
            className="mobile-tabbar"
            style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
          >
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) => (isActive ? 'mobile-tab active' : 'mobile-tab')}
              >
                {({ isActive }) => (
                  <>
                    <TabIcon name={t.icon} active={isActive} />
                    <span>{t.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        ) : null}
        <ToastStack items={toasts} />
      </div>
    </div>
  )
}

export function MobileLayout() {
  return <Shell withTab />
}

export function SubpageLayout() {
  return <Shell withTab={false} />
}
