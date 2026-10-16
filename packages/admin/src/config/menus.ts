/** 侧栏与角色菜单权限共用的菜单树 */

export type MenuLeaf = { key: string; to: string; label: string; end?: boolean }
export type MenuGroup = { key: string; label: string; children: MenuLeaf[] }
export type MenuNode =
  | { key: string; label: string; to: string; end?: true }
  | MenuGroup

export const menus: MenuNode[] = [
  { key: 'dashboard', label: '工作台', to: '/', end: true },
  {
    key: 'merchant',
    label: '商家管理',
    children: [
      { key: '/merchants/apply', to: '/merchants/apply', label: '门店入驻' },
      { key: '/merchants/audit', to: '/merchants/audit', label: '入驻审核' },
      { key: '/merchants/stores', to: '/merchants/stores', label: '门店管理' },
      { key: '/merchants/staff', to: '/merchants/staff', label: '员工管理' },
    ],
  },
  {
    key: 'product',
    label: '商品管理',
    children: [
      { key: '/products/dishes', to: '/products/dishes', label: '菜品管理' },
      { key: '/products/categories', to: '/products/categories', label: '菜品分类' },
      { key: '/products/specs', to: '/products/specs', label: '规格管理' },
      { key: '/products/stock', to: '/products/stock', label: '售罄管理' },
      { key: '/products/packing', to: '/products/packing', label: '包装费设置' },
    ],
  },
  {
    key: 'order',
    label: '订单',
    children: [
      { key: '/orders', to: '/orders', label: '订单管理', end: true },
      { key: '/orders/cancel', to: '/orders/cancel', label: '取消审核' },
    ],
  },
  { key: '/riders', label: '骑手管理', to: '/riders' },
  { key: '/aftersale/tickets', label: '客服工单', to: '/aftersale/tickets' },
  { key: '/finance/trades', label: '交易流水', to: '/finance/trades' },
  {
    key: 'system',
    label: '系统管理',
    children: [
      { key: '/system/users', to: '/system/users', label: '用户管理' },
      { key: '/system/depts', to: '/system/depts', label: '部门管理' },
      { key: '/system/roles', to: '/system/roles', label: '角色管理' },
      { key: '/system/cuisines', to: '/system/cuisines', label: '品类管理' },
    ],
  },
]

/** 全部可勾选的菜单权限 key（含分组与叶子） */
export function allMenuKeys(): string[] {
  const keys: string[] = []
  for (const m of menus) {
    keys.push(m.key)
    if ('children' in m) {
      for (const c of m.children) keys.push(c.key)
    }
  }
  return keys
}

export function menuLabelMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const m of menus) {
    map[m.key] = m.label
    if ('children' in m) {
      for (const c of m.children) map[c.key] = c.label
    }
  }
  return map
}

/** 按角色权限过滤侧栏；含 * 表示全部可见；勾选分组 key 则整组可见 */
export function filterMenusByPermissions(permissions: string[]): MenuNode[] {
  if (!permissions.length) return menus
  if (permissions.includes('*')) return menus
  const set = new Set(permissions)
  const result: MenuNode[] = []
  for (const m of menus) {
    if ('to' in m) {
      if (set.has(m.key) || set.has(m.to)) result.push(m)
      continue
    }
    if (set.has(m.key)) {
      result.push(m)
      continue
    }
    const children = m.children.filter((c) => set.has(c.key) || set.has(c.to))
    if (children.length) result.push({ ...m, children })
  }
  return result
}
