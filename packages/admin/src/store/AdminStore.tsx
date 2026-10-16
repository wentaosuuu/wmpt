import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  accounts,
  cancelRules as seedCancelRules,
  categories as seedCategories,
  coverages as seedCover,
  cuisineCategories as seedCuisines,
  depts as seedDepts,
  merchantChangeLogs as seedChangeLogs,
  merchants as seedMerchants,
  pilots as seedPilots,
  products as seedProducts,
  riders as seedRiders,
  roles as seedRoles,
  seedOrders,
  specs as seedSpecs,
  storeApplications as seedApps,
  storeStaff as seedStaff,
  sysUsers as seedUsers,
  tickets as seedTickets,
  tradeRecords as seedTrades,
} from '../mock'
import { fetchCuisineCategories, persistCuisineCategories } from '../lib/cuisineApi'
import { dishDescMapFromProducts, persistDishDescriptions } from '../lib/dishDescApi'
import { dishPhotoMapFromProducts, persistDishPhotos } from '../lib/dishPhotoApi'
import { minOrderMapFromMerchants, persistStoreMinOrders } from '../lib/minOrderApi'
import { fetchTickets, persistTickets } from '../lib/ticketApi'
import type {
  AdminOrder,
  AdminUser,
  CancelRule,
  Coverage,
  CuisineCategory,
  DishCategory,
  DishSpec,
  Merchant,
  MerchantChangeLog,
  Pilot,
  Product,
  Rider,
  StoreApplication,
  StoreStaff,
  SysDept,
  SysRole,
  SysUser,
  Ticket,
  TradeRecord,
} from '../types'

type Ctx = {
  user: AdminUser | null
  toast: string
  merchants: Merchant[]
  merchantChangeLogs: MerchantChangeLog[]
  applications: StoreApplication[]
  storeStaff: StoreStaff[]
  riders: Rider[]
  products: Product[]
  categories: DishCategory[]
  specs: DishSpec[]
  orders: AdminOrder[]
  trades: TradeRecord[]
  tickets: Ticket[]
  coverages: Coverage[]
  pilots: Pilot[]
  cancelRules: CancelRule[]
  depts: SysDept[]
  roles: SysRole[]
  sysUsers: SysUser[]
  cuisineCategories: CuisineCategory[]
  notify: (text: string) => void
  login: (username: string, password: string) => boolean
  logout: () => void
  changePassword: (oldPwd: string, nextPwd: string) => boolean
  /** 重置为 12 位随机密码并返回明文，便于复制发给用户 */
  resetSysPassword: (phone: string) => string
  updateMerchant: (id: string, patch: Partial<Merchant>) => void
  saveMerchant: (m: Merchant) => void
  submitApplication: (app: Omit<StoreApplication, 'id' | 'status' | 'createdAt'>) => void
  auditApplication: (id: string, pass: boolean, remark: string) => void
  createStaff: (staff: Omit<StoreStaff, 'id' | 'status' | 'createdAt'>) => void
  updateStaff: (id: string, patch: Partial<StoreStaff>) => void
  createRider: (rider: Omit<Rider, 'id' | 'status' | 'createdAt'>) => void
  updateRider: (id: string, patch: Partial<Rider>) => void
  updateProduct: (id: string, patch: Partial<Product>) => void
  saveProduct: (p: Product) => void
  saveCategory: (c: DishCategory) => void
  updateCategory: (id: string, patch: Partial<DishCategory>) => void
  removeCategory: (id: string) => void
  saveSpec: (s: DishSpec) => void
  updateSpec: (id: string, patch: Partial<DishSpec>) => void
  removeSpec: (id: string) => void
  updateOrder: (id: string, patch: Partial<AdminOrder>) => void
  updateTicket: (id: string, patch: Partial<Ticket>) => void
  updateCoverage: (storeId: string, patch: Partial<Coverage>) => void
  saveCoverage: (c: Coverage) => void
  savePilot: (p: Pilot) => void
  updateCancelRule: (stageKey: string, patch: Partial<CancelRule>) => void
  updateDept: (id: string, patch: Partial<SysDept>) => void
  saveDept: (d: SysDept) => void
  updateRole: (id: string, patch: Partial<SysRole>) => void
  saveRole: (r: SysRole) => void
  updateSysUser: (id: string, patch: Partial<SysUser>) => void
  saveSysUser: (u: SysUser) => void
  saveCuisineCategory: (c: CuisineCategory) => void
  updateCuisineCategory: (id: string, patch: Partial<CuisineCategory>) => void
  removeCuisineCategory: (id: string) => void
}

const MERCHANT_FIELD_LABELS: Partial<Record<keyof Merchant, string>> = {
  name: '门店名称',
  contact: '联系人',
  phone: '电话',
  pickup: '取餐地址',
  address: '门店地址',
  license: '营业执照号',
  expireAt: '资质到期日',
  hours: '营业时间',
  deposit: '保证金',
  minOrder: '起送费',
  deliveryFee: '预估配送费',
  cuisine: '经营品类',
  orderPackingFee: '订单包装费',
  takeout: '外卖能力',
  frontListed: '移动端上架',
  qualStatus: '资质状态',
  doorPhoto: '门牌照片',
}

function formatMerchantField(key: keyof Merchant, value: Merchant[keyof Merchant]): string {
  if (key === 'deposit' || key === 'minOrder' || key === 'deliveryFee' || key === 'orderPackingFee') {
    const n = Number(value) || 0
    return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (key === 'takeout') return value ? '已开通' : '未开通'
  if (key === 'frontListed') return value ? '已上架' : '未上架'
  if (key === 'doorPhoto') return value ? '已上传' : '未上传'
  if (key === 'qualStatus') {
    const map: Record<string, string> = {
      valid: '有效',
      expiring: '即将到期',
      pending: '待审',
      rejected: '已驳回',
    }
    return map[String(value)] || String(value)
  }
  if (value === undefined || value === null || value === '') return '-'
  return String(value)
}

let changeLogSeq = 0

function buildMerchantChangeLogs(
  prev: Merchant,
  next: Merchant,
  operator: string,
): MerchantChangeLog[] {
  const keys = Object.keys(MERCHANT_FIELD_LABELS) as (keyof Merchant)[]
  const at = nowLabel()
  const logs: MerchantChangeLog[] = []
  for (const key of keys) {
    const beforeVal = prev[key]
    const afterVal = next[key]
    if (beforeVal === afterVal) continue
    const before = formatMerchantField(key, beforeVal)
    const after = formatMerchantField(key, afterVal)
    if (before === after) continue
    changeLogSeq += 1
    logs.push({
      id: `cl${Date.now()}_${changeLogSeq}_${String(key)}`,
      merchantId: next.id,
      field: MERCHANT_FIELD_LABELS[key] || String(key),
      changedAt: at,
      before,
      after,
      operator,
    })
  }
  return logs
}

const AdminContext = createContext<Ctx | null>(null)

function nowLabel() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function upsert<T extends { id: string }>(list: T[], item: T) {
  const exists = list.some((x) => x.id === item.id)
  return exists ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [passwordMap, setPasswordMap] = useState<Record<string, string>>(
    Object.fromEntries(accounts.map((a) => [a.username, a.password])),
  )
  const [toast, setToast] = useState('')
  const [merchants, setMerchants] = useState(seedMerchants)
  const [merchantChangeLogs, setMerchantChangeLogs] = useState(seedChangeLogs)
  const [applications, setApplications] = useState(seedApps)
  const [storeStaff, setStoreStaff] = useState(seedStaff)
  const [riders, setRiders] = useState(seedRiders)
  const [products, setProducts] = useState(seedProducts)
  const [categories, setCategories] = useState(seedCategories)
  const [specs, setSpecs] = useState(seedSpecs)
  const [orders, setOrders] = useState(seedOrders)
  const [trades] = useState(seedTrades)
  const [tickets, setTickets] = useState(seedTickets)
  const [coverages, setCoverages] = useState(seedCover)
  const [pilots, setPilots] = useState(seedPilots)
  const [cancelRules, setCancelRules] = useState(seedCancelRules)
  const [depts, setDepts] = useState(seedDepts)
  const [roles, setRoles] = useState(seedRoles)
  const [sysUsers, setSysUsers] = useState(seedUsers)
  const [cuisineCategories, setCuisineCategories] = useState(seedCuisines)

  useEffect(() => {
    let alive = true
    fetchCuisineCategories().then((list) => {
      if (alive) setCuisineCategories(list)
    })
    return () => {
      alive = false
    }
  }, [])

  const syncCuisines = useCallback((next: CuisineCategory[]) => {
    setCuisineCategories(next)
    void persistCuisineCategories(next)
  }, [])

  const syncDishPhotos = useCallback((list: Product[]) => {
    void persistDishPhotos(dishPhotoMapFromProducts(list))
  }, [])

  const syncDishDescriptions = useCallback((list: Product[]) => {
    void persistDishDescriptions(dishDescMapFromProducts(list))
  }, [])

  useEffect(() => {
    syncDishPhotos(seedProducts)
    syncDishDescriptions(seedProducts)
  }, [syncDishPhotos, syncDishDescriptions])

  useEffect(() => {
    let alive = true
    const pull = () => {
      fetchTickets().then((list) => {
        if (alive && list.length) setTickets(list)
      })
    }
    pull()
    const timer = window.setInterval(pull, 5000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [])

  const notify = useCallback((text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(''), 2200)
  }, [])

  const login = useCallback(
    (username: string, password: string) => {
      const found = accounts.find((a) => a.username === username)
      if (!found || passwordMap[username] !== password) return false
      setUser({ name: found.name, username: found.username, role: found.role })
      return true
    },
    [passwordMap],
  )

  const logout = useCallback(() => setUser(null), [])

  const changePassword = useCallback(
    (oldPwd: string, nextPwd: string) => {
      if (!user) return false
      if (passwordMap[user.username] !== oldPwd) return false
      setPasswordMap((prev) => ({ ...prev, [user.username]: nextPwd }))
      return true
    },
    [passwordMap, user],
  )

  const resetSysPassword = useCallback((phone: string) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    const bytes = new Uint8Array(12)
    crypto.getRandomValues(bytes)
    const nextPwd = Array.from(bytes, (n) => chars[n % chars.length]).join('')
    setPasswordMap((prev) => ({ ...prev, [phone]: nextPwd }))
    return nextPwd
  }, [])

  const syncMinOrders = useCallback((list: Merchant[]) => {
    void persistStoreMinOrders(minOrderMapFromMerchants(list))
  }, [])

  const updateMerchant = useCallback(
    (id: string, patch: Partial<Merchant>) => {
      const target = merchants.find((m) => m.id === id)
      if (!target) return
      const next = { ...target, ...patch }
      const logs = buildMerchantChangeLogs(target, next, user?.name || '系统')
      setMerchants((prev) => {
        const list = prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
        if (patch.minOrder !== undefined) syncMinOrders(list)
        return list
      })
      if (logs.length) setMerchantChangeLogs((cls) => [...logs, ...cls])
    },
    [merchants, syncMinOrders, user],
  )

  const saveMerchant = useCallback(
    (m: Merchant) => {
      const target = merchants.find((x) => x.id === m.id)
      const logs = target ? buildMerchantChangeLogs(target, m, user?.name || '系统') : []
      setMerchants((prev) => {
        const list = upsert(prev, m)
        syncMinOrders(list)
        return list
      })
      if (logs.length) setMerchantChangeLogs((cls) => [...logs, ...cls])
    },
    [merchants, syncMinOrders, user],
  )

  const submitApplication = useCallback((app: Omit<StoreApplication, 'id' | 'status' | 'createdAt'>) => {
    setApplications((prev) => [
      { ...app, id: `app${Date.now()}`, status: 'pending', createdAt: nowLabel() },
      ...prev,
    ])
  }, [])

  const createStaff = useCallback((staff: Omit<StoreStaff, 'id' | 'status' | 'createdAt'>) => {
    setStoreStaff((prev) => [
      { ...staff, id: `st${Date.now()}`, status: 'enabled', createdAt: nowLabel() },
      ...prev,
    ])
  }, [])

  const updateStaff = useCallback((id: string, patch: Partial<StoreStaff>) => {
    setStoreStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const createRider = useCallback((rider: Omit<Rider, 'id' | 'status' | 'createdAt'>) => {
    setRiders((prev) => [
      { ...rider, id: `rd${Date.now()}`, status: 'enabled', createdAt: nowLabel() },
      ...prev,
    ])
  }, [])

  const updateRider = useCallback((id: string, patch: Partial<Rider>) => {
    setRiders((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const auditApplication = useCallback((id: string, pass: boolean, remark: string) => {
    setApplications((prev) => {
      const target = prev.find((a) => a.id === id)
      if (!target || target.status !== 'pending') return prev
      if (pass) {
        const isHq = target.applyType === 'hq'
        const storeId = `${isHq ? 'm' : 's'}${Date.now()}`
        const hq = !isHq
          ? merchants.find(
              (m) =>
                m.type === 'hq' &&
                (m.name === target.parentMerchant || m.id === target.parentMerchant),
            )
          : undefined
        setMerchants((ms) => {
          const list = [
            ...ms,
            {
              id: storeId,
              name: target.name,
              type: isHq ? ('hq' as const) : ('branch' as const),
              parentId: isHq ? undefined : hq?.id,
              parentName: isHq ? undefined : hq?.name ?? target.parentMerchant,
              takeout: false,
              frontListed: false,
              address: target.address,
              pickup: target.addressDetail || target.address,
              contact: target.contact,
              phone: target.phone,
              hours: target.hours,
              qualStatus: 'valid' as const,
              license: target.license,
              expireAt: '2027-09-15',
              minOrder: isHq ? 0 : 15,
              deliveryFee: isHq ? 0 : 3,
              cuisine: target.cuisine || '快餐',
              deposit: isHq ? 20000 : 0,
              orderPackingFee: isHq ? 0 : 1,
              status: 'approved' as const,
            },
          ]
          syncMinOrders(list)
          return list
        })
        setCoverages((cs) => [
          ...cs,
          { storeId, storeName: target.name, radiusKm: 3, enabled: false },
        ])
      }
      return prev.map((a) =>
        a.id === id
          ? { ...a, status: pass ? 'approved' : 'rejected', auditRemark: remark, auditedAt: nowLabel() }
          : a,
      )
    })
  }, [merchants, syncMinOrders])

  const updateProduct = useCallback(
    (id: string, patch: Partial<Product>) => {
      setProducts((prev) => {
        const list = prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
        if (patch.photo !== undefined) syncDishPhotos(list)
        if (patch.description !== undefined) syncDishDescriptions(list)
        return list
      })
    },
    [syncDishPhotos, syncDishDescriptions],
  )
  const saveProduct = useCallback(
    (p: Product) => {
      setProducts((prev) => {
        const list = upsert(prev, { ...p, description: p.description.trim() })
        syncDishPhotos(list)
        syncDishDescriptions(list)
        return list
      })
    },
    [syncDishPhotos, syncDishDescriptions],
  )

  const saveCategory = useCallback((c: DishCategory) => {
    setCategories((prev) => upsert(prev, c))
  }, [])
  const updateCategory = useCallback((id: string, patch: Partial<DishCategory>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    if (patch.name) {
      setProducts((prev) =>
        prev.map((p) => (p.categoryId === id ? { ...p, category: patch.name as string } : p)),
      )
    }
  }, [])
  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const saveSpec = useCallback((s: DishSpec) => {
    setSpecs((prev) => upsert(prev, s))
  }, [])
  const updateSpec = useCallback((id: string, patch: Partial<DishSpec>) => {
    setSpecs((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      setProducts((ps) =>
        ps.map((p) => {
          if (!p.specIds.includes(id)) return p
          const names = next.filter((s) => p.specIds.includes(s.id) && s.enabled).map((s) => s.name)
          return { ...p, spec: names.join(' / ') }
        }),
      )
      return next
    })
  }, [])
  const removeSpec = useCallback((id: string) => {
    setSpecs((prev) => prev.filter((s) => s.id !== id))
    setProducts((prev) =>
      prev.map((p) => {
        if (!p.specIds.includes(id)) return p
        const specIds = p.specIds.filter((x) => x !== id)
        return { ...p, specIds, spec: p.spec }
      }),
    )
  }, [])

  const updateOrder = useCallback((id: string, patch: Partial<AdminOrder>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }, [])
  const updateTicket = useCallback((id: string, patch: Partial<Ticket>) => {
    setTickets((prev) => {
      const list = prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      void persistTickets(list)
      return list
    })
  }, [])
  const updateCoverage = useCallback((storeId: string, patch: Partial<Coverage>) => {
    setCoverages((prev) => prev.map((c) => (c.storeId === storeId ? { ...c, ...patch } : c)))
  }, [])
  const saveCoverage = useCallback((c: Coverage) => {
    setCoverages((prev) => {
      const exists = prev.some((x) => x.storeId === c.storeId)
      return exists ? prev.map((x) => (x.storeId === c.storeId ? c : x)) : [...prev, c]
    })
  }, [])
  const savePilot = useCallback((p: Pilot) => {
    setPilots((prev) => upsert(prev, p))
  }, [])
  const updateCancelRule = useCallback((stageKey: string, patch: Partial<CancelRule>) => {
    setCancelRules((prev) => prev.map((r) => (r.stageKey === stageKey ? { ...r, ...patch } : r)))
  }, [])
  const updateDept = useCallback((id: string, patch: Partial<SysDept>) => {
    setDepts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }, [])
  const saveDept = useCallback((d: SysDept) => setDepts((prev) => upsert(prev, d)), [])
  const updateRole = useCallback((id: string, patch: Partial<SysRole>) => {
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])
  const saveRole = useCallback((r: SysRole) => setRoles((prev) => upsert(prev, r)), [])
  const updateSysUser = useCallback((id: string, patch: Partial<SysUser>) => {
    setSysUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])
  const saveSysUser = useCallback((u: SysUser) => setSysUsers((prev) => upsert(prev, u)), [])

  const saveCuisineCategory = useCallback(
    (c: CuisineCategory) => {
      syncCuisines(upsert(cuisineCategories, c))
    },
    [cuisineCategories, syncCuisines],
  )

  const updateCuisineCategory = useCallback(
    (id: string, patch: Partial<CuisineCategory>) => {
      const target = cuisineCategories.find((x) => x.id === id)
      if (!target) return
      if (target.isAll && patch.name !== undefined && patch.name !== target.name) return
      syncCuisines(cuisineCategories.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    },
    [cuisineCategories, syncCuisines],
  )

  const removeCuisineCategory = useCallback(
    (id: string) => {
      const target = cuisineCategories.find((x) => x.id === id)
      if (!target || target.isAll) return
      syncCuisines(cuisineCategories.filter((x) => x.id !== id))
    },
    [cuisineCategories, syncCuisines],
  )

  const value = useMemo(
    () => ({
      user,
      toast,
      merchants,
      merchantChangeLogs,
      applications,
      storeStaff,
      riders,
      products,
      categories,
      specs,
      orders,
      trades,
      tickets,
      coverages,
      pilots,
      cancelRules,
      depts,
      roles,
      sysUsers,
      cuisineCategories,
      notify,
      login,
      logout,
      changePassword,
      resetSysPassword,
      updateMerchant,
      saveMerchant,
      submitApplication,
      auditApplication,
      createStaff,
      updateStaff,
      createRider,
      updateRider,
      updateProduct,
      saveProduct,
      saveCategory,
      updateCategory,
      removeCategory,
      saveSpec,
      updateSpec,
      removeSpec,
      updateOrder,
      updateTicket,
      updateCoverage,
      saveCoverage,
      savePilot,
      updateCancelRule,
      updateDept,
      saveDept,
      updateRole,
      saveRole,
      updateSysUser,
      saveSysUser,
      saveCuisineCategory,
      updateCuisineCategory,
      removeCuisineCategory,
    }),
    [
      user,
      toast,
      merchants,
      merchantChangeLogs,
      applications,
      storeStaff,
      riders,
      products,
      categories,
      specs,
      orders,
      trades,
      tickets,
      coverages,
      pilots,
      cancelRules,
      depts,
      roles,
      sysUsers,
      cuisineCategories,
      notify,
      login,
      logout,
      changePassword,
      resetSysPassword,
      updateMerchant,
      saveMerchant,
      submitApplication,
      auditApplication,
      createStaff,
      updateStaff,
      createRider,
      updateRider,
      updateProduct,
      saveProduct,
      saveCategory,
      updateCategory,
      removeCategory,
      saveSpec,
      updateSpec,
      removeSpec,
      updateOrder,
      updateTicket,
      updateCoverage,
      saveCoverage,
      savePilot,
      updateCancelRule,
      updateDept,
      saveDept,
      updateRole,
      saveRole,
      updateSysUser,
      saveSysUser,
      saveCuisineCategory,
      updateCuisineCategory,
      removeCuisineCategory,
    ],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}

export const statusLabel: Record<string, string> = {
  pending_accept: '待接单',
  rejected: '已拒单',
  preparing: '备餐中',
  ready: '待配送',
  dispatching: '配送发送中',
  picked: '骑手已取餐',
  delivering: '配送中',
  delivered: '已送达',
  cancel_review: '取消待审',
  cancelled: '已取消',
  refund_review: '退款待审',
  refunded: '已退款',
}
