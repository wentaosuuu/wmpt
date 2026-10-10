import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { filterMenusByPermissions, menus as allMenus, type MenuNode } from '../config/menus'
import { useAdmin } from '../store/AdminStore'
import './AdminLayout.css'

function buildTitleMap(source: MenuNode[]) {
  const map: Record<string, string> = { '/profile': '个人中心' }
  for (const m of source) {
    if ('to' in m) map[m.to] = m.label
    else for (const c of m.children) map[c.to] = c.label
  }
  return map
}

const fullTitleMap = buildTitleMap(allMenus)

function findOpenKeys(pathname: string, source: MenuNode[]) {
  const keys: string[] = []
  for (const m of source) {
    if ('children' in m && m.children.some((c) => pathname === c.to || pathname.startsWith(`${c.to}/`))) {
      keys.push(m.key)
    }
  }
  return keys
}

export function AdminLayout() {
  const { user, logout, roles } = useAdmin()
  const navigate = useNavigate()
  const location = useLocation()

  const visibleMenus = useMemo(() => {
    const role = roles.find((r) => r.code === user?.role)
    const perms = role?.permissions?.length ? role.permissions : ['*']
    return filterMenusByPermissions(perms)
  }, [roles, user?.role])

  const title = fullTitleMap[location.pathname] ?? '外卖运营后台'
  const autoOpen = useMemo(
    () => findOpenKeys(location.pathname, visibleMenus),
    [location.pathname, visibleMenus],
  )
  const [openKeys, setOpenKeys] = useState<string[]>(() => findOpenKeys(location.pathname, allMenus))

  useEffect(() => {
    setOpenKeys((prev) => Array.from(new Set([...prev, ...autoOpen])))
  }, [autoOpen])

  function toggle(key: string) {
    setOpenKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sider">
        <div className="admin-brand">
          <span className="admin-brand-mark">云</span>
          <div>
            <strong>云宝宝外卖</strong>
            <span>管理后台</span>
          </div>
        </div>
        <nav className="admin-menu">
          {visibleMenus.map((m) => {
            if ('to' in m) {
              return (
                <NavLink
                  key={m.key}
                  to={m.to}
                  end={m.end}
                  className={({ isActive }) => (isActive ? 'admin-menu-item active' : 'admin-menu-item')}
                >
                  {m.label}
                </NavLink>
              )
            }
            const opened = openKeys.includes(m.key)
            return (
              <div key={m.key} className={`admin-submenu ${opened ? 'open' : ''}`}>
                <button type="button" className="admin-submenu-title" onClick={() => toggle(m.key)}>
                  <span>{m.label}</span>
                  <i className="admin-arrow">{opened ? '▾' : '▸'}</i>
                </button>
                {opened ? (
                  <div className="admin-submenu-list">
                    {m.children.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          isActive ? 'admin-menu-item child active' : 'admin-menu-item child'
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <h1>{title}</h1>
            <span className="admin-breadcrumb">云宝宝外卖 / {title}</span>
          </div>
          <div className="admin-header-right">
            <NavLink to="/profile" className="admin-user-chip">
              <span className="admin-avatar">{user?.name?.slice(0, 1) ?? '管'}</span>
              {user?.name}
            </NavLink>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              退出登录
            </button>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
