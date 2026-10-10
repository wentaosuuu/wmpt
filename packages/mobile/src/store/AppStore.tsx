import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { currentUser, defaultAddresses, seedOrders } from '../mock'
import {
  buildEtaRange,
  cartKey,
  cartTotals,
  minimumOrderShortfall,
  nextOrderId,
  nowLabel,
  storeById,
} from '../lib/utils'
import type { Address, AppRole, CartItem, Order, OrderStatus, PayChannel, User } from '../types'

type Toast = { id: number; text: string }

const RIDER_PROFILE = { name: '李骑手', phone: '13900001111', location: '园区配送站' }

type AppContextValue = {
  user: User | null
  role: AppRole
  cart: CartItem[]
  addresses: Address[]
  orders: Order[]
  toasts: Toast[]
  setRole: (role: AppRole, silent?: boolean) => void
  toast: (text: string) => void
  addToCart: (item: Omit<CartItem, 'key' | 'qty'>, qty?: number, quiet?: boolean) => void
  changeQty: (key: string, delta: number) => void
  clearCart: () => void
  saveAddress: (address: Address) => void
  removeAddress: (id: string) => void
  setDefaultAddress: (id: string) => void
  createOrder: (address: Address, remark: string) => Order | null
  payOrder: (id: string, channel: PayChannel) => void
  cancelOrder: (id: string, reason: string) => void
  applyRefund: (id: string, reason: string) => void
  addTicket: (orderId: string | undefined, content: string) => void
  /** 商家：接单 */
  merchantAccept: (id: string) => void
  /** 商家：拒单 */
  merchantReject: (id: string, reason: string) => void
  /** 商家：出餐完成 */
  merchantReady: (id: string) => void
  /** 商家：核对交餐给骑手 */
  merchantHandover: (id: string) => void
  /** 商家：同意退款 */
  merchantRefundApprove: (id: string) => void
  /** 商家：驳回退款 */
  merchantRefundReject: (id: string, reason: string) => void
  /** 骑手：接配送单 */
  riderClaim: (id: string) => void
  /** 骑手：到店 */
  riderArrive: (id: string) => void
  /** 骑手：开始配送 */
  riderDeliver: (id: string) => void
  /** 骑手：确认送达（需上传送达照片） */
  riderComplete: (id: string, deliveryProof: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function patchOrder(
  o: Order,
  status: OrderStatus,
  event: { title: string; desc: string },
  extra?: Partial<Order>,
): Order {
  return {
    ...o,
    ...extra,
    status,
    timeline: [...o.timeline, { time: nowLabel().slice(11), title: event.title, desc: event.desc }],
  }
}

/** 生成三位取餐号（100-999），避免与现有订单重复 */
function nextPickupNo(orders: Order[]) {
  const used = new Set(orders.map((o) => o.pickupNo).filter(Boolean))
  for (let i = 0; i < 80; i++) {
    const no = String(100 + Math.floor(Math.random() * 900))
    if (!used.has(no)) return no
  }
  return String(100 + (Date.now() % 900))
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User | null>(currentUser)
  const [role, setRoleState] = useState<AppRole>('consumer')
  const [cart, setCart] = useState<CartItem[]>([])
  const [addresses, setAddresses] = useState<Address[]>(defaultAddresses)
  const [orders, setOrders] = useState<Order[]>(seedOrders)
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((text: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, text }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2200)
  }, [])

  const setRole = useCallback(
    (next: AppRole, silent = false) => {
      setRoleState(next)
      if (!silent) {
        toast(`已切换为${next === 'consumer' ? '消费者' : next === 'merchant' ? '商家' : '骑手'}视角`)
      }
    },
    [toast],
  )

  const addToCart = useCallback(
    (item: Omit<CartItem, 'key' | 'qty'>, qty = 1, quiet = false) => {
      const key = cartKey(item.dishId, item.spec, item.remark)
      setCart((prev) => {
        if (prev.length && prev[0].storeId !== item.storeId) {
          return [{ ...item, key, qty }]
        }
        const found = prev.find((i) => i.key === key)
        if (found) {
          return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i))
        }
        return [...prev, { ...item, key, qty }]
      })
      if (!quiet) toast('已加入购物车')
    },
    [toast],
  )

  const changeQty = useCallback((key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    )
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const saveAddress = useCallback((address: Address) => {
    setAddresses((prev) => {
      const exists = prev.some((a) => a.id === address.id)
      const next = exists ? prev.map((a) => (a.id === address.id ? address : a)) : [...prev, address]
      if (address.isDefault) {
        return next.map((a) => ({ ...a, isDefault: a.id === address.id }))
      }
      return next
    })
  }, [])

  const removeAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const setDefaultAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
  }, [])

  const createOrder = useCallback(
    (address: Address, remark: string) => {
      if (!cart.length) return null
      const totals = cartTotals(cart)
      if (!totals.store) return null
      if (totals.shortfall > 0) {
        toast(`还差 ¥${totals.shortfall.toFixed(2)} 起送，请继续选餐`)
        return null
      }
      if (totals.store.status === 'closed') {
        toast('门店歇业中，无法下单')
        return null
      }
      if (!address.inRange) {
        toast('该地址不在配送范围内')
        return null
      }
      const createdAt = nowLabel()
      const etaRange = buildEtaRange(createdAt, totals.store.etaMin)
      const order: Order = {
        id: nextOrderId(),
        storeId: totals.store.id,
        storeName: totals.store.name,
        items: cart.map((i) => ({
          dishId: i.dishId,
          name: i.name,
          spec: i.spec,
          remark: i.remark,
          price: i.price,
          packingFee: i.packingFee,
          qty: i.qty,
        })),
        address,
        status: 'pending_pay',
        createdAt,
        payDeadline: createdAt,
        remark,
        packingFee: totals.packingFee,
        deliveryFee: totals.deliveryFee,
        extraFee: totals.extraFee,
        dishAmount: totals.dishAmount,
        payable: totals.payable,
        etaRange,
        timeline: [{ time: createdAt.slice(11), title: '订单已提交', desc: '请在 15 分钟内完成支付' }],
      }
      setOrders((prev) => [order, ...prev])
      setCart([])
      return order
    },
    [cart, toast],
  )

  const payOrder = useCallback((id: string, channel: PayChannel) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id || o.status !== 'pending_pay' || minimumOrderShortfall(o.storeId, o.dishAmount) !== 0) {
          return o
        }
        const etaMin = storeById(o.storeId)?.etaMin ?? 35
        const etaRange = o.etaRange || buildEtaRange(o.createdAt, etaMin)
        return patchOrder(
          o,
          'pending_accept',
          {
            title: '支付成功',
            desc: `${channel === 'wechat' ? '微信' : '支付宝'}支付 ${o.payable.toFixed(2)} 元，预计 ${etaRange} 送达`,
          },
          { payChannel: channel, etaRange },
        )
      }),
    )
  }, [])

  const cancelOrder = useCallback((id: string, reason: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? patchOrder(o, 'cancelled', { title: '用户申请取消', desc: reason }, { cancelReason: reason })
          : o,
      ),
    )
  }, [])

  const applyRefund = useCallback((id: string, reason: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id && o.status === 'delivered' && !o.refund
          ? patchOrder(
              o,
              'refunding',
              { title: '已申请退款', desc: `${reason}，全额退款 ¥${o.payable.toFixed(2)}` },
              {
                refund: {
                  id: `R${Date.now()}`,
                  amount: o.payable,
                  reason,
                  status: 'pending',
                  expected: o.payable,
                  createdAt: nowLabel(),
                },
              },
            )
          : o,
      ),
    )
  }, [])

  const addTicket = useCallback(
    (orderId: string | undefined, content: string) => {
      if (orderId) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  timeline: [
                    ...o.timeline,
                    { time: nowLabel().slice(11), title: '已联系客服', desc: content },
                  ],
                }
              : o,
          ),
        )
      }
      toast('已提交客服工单，工作时间 2 小时内回复')
    },
    [toast],
  )

  const merchantAccept = useCallback(
    (id: string) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? patchOrder(o, 'preparing', {
                title: '商家已接单',
                desc: '开始备餐，平台已自动发送配送单给骑手',
              })
            : o,
        ),
      )
      toast('已接单，请尽快备餐')
    },
    [toast],
  )

  const merchantReject = useCallback(
    (id: string, reason: string) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? patchOrder(o, 'rejected', { title: '商家拒单', desc: reason }, { cancelReason: reason })
            : o,
        ),
      )
      toast('已拒单')
    },
    [toast],
  )

  const merchantReady = useCallback(
    (id: string) => {
      let pickupNo = ''
      setOrders((prev) => {
        pickupNo = nextPickupNo(prev)
        return prev.map((o) =>
          o.id === id
            ? patchOrder(
                o,
                'ready',
                { title: '出餐完成', desc: `取餐号 ${pickupNo}，待骑手到店核对取餐` },
                { pickupNo },
              )
            : o,
        )
      })
      toast(`出餐完成，取餐号 ${pickupNo}`)
    },
    [toast],
  )

  const merchantRefundApprove = useCallback(
    (id: string) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id || o.status !== 'refunding' || !o.refund) return o
          return patchOrder(
            o,
            'refunded',
            {
              title: '商家同意退款',
              desc: `全额退款 ¥${o.payable.toFixed(2)}，原路退回`,
            },
            {
              refund: { ...o.refund, status: 'returned' },
            },
          )
        }),
      )
      toast('已同意退款，款项将原路退回用户')
    },
    [toast],
  )

  const merchantRefundReject = useCallback(
    (id: string, reason: string) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id || o.status !== 'refunding' || !o.refund) return o
          return patchOrder(
            o,
            'delivered',
            { title: '商家驳回退款', desc: reason },
            {
              refund: { ...o.refund, status: 'rejected' },
            },
          )
        }),
      )
      toast('已驳回退款申请')
    },
    [toast],
  )

  const merchantHandover = useCallback(
    (id: string) => {
      setOrders((prev) => {
        const target = prev.find((o) => o.id === id)
        if (!target?.rider) {
          toast('请等待骑手接单到店后再交餐')
          return prev
        }
        toast('交餐完成')
        return prev.map((o) =>
          o.id === id
            ? patchOrder(o, 'picked', {
                title: '商家已交餐',
                desc: `已核对订单并交给骑手 ${o.rider?.name}`,
              })
            : o,
        )
      })
    },
    [toast],
  )

  const riderClaim = useCallback(
    (id: string) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                rider: { ...RIDER_PROFILE, location: '前往门店途中' },
                timeline: [
                  ...o.timeline,
                  {
                    time: nowLabel().slice(11),
                    title: '骑手已接单',
                    desc: `${RIDER_PROFILE.name} 正在赶往门店`,
                  },
                ],
              }
            : o,
        ),
      )
      toast('已接配送单，请尽快到店')
    },
    [toast],
  )

  const riderArrive = useCallback(
    (id: string) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                rider: { ...(o.rider ?? RIDER_PROFILE), location: '已到店，等待交餐' },
                timeline: [
                  ...o.timeline,
                  { time: nowLabel().slice(11), title: '骑手已到店', desc: '请凭取餐号取餐' },
                ],
              }
            : o,
        ),
      )
      toast('已标记到店')
    },
    [toast],
  )

  const riderDeliver = useCallback(
    (id: string) => {
      const target = orders.find((o) => o.id === id)
      if (!target?.pickupNo) {
        toast('商家尚未出餐，暂无取餐号')
        return
      }
      const no = `取餐号 ${target.pickupNo}，`
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o
          return patchOrder(
            o,
            'delivering',
            { title: '骑手已取餐', desc: `${no}开始送往 ${o.address.street}` },
            { rider: { ...(o.rider ?? RIDER_PROFILE), location: '配送途中' } },
          )
        }),
      )
      toast('确认取餐成功，开始配送')
    },
    [orders, toast],
  )

  const riderComplete = useCallback(
    (id: string, deliveryProof: string) => {
      if (!deliveryProof) {
        toast('请先拍摄或上传送达照片')
        return
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? patchOrder(
                o,
                'delivered',
                { title: '确认送达', desc: '已上传送达照片，订单完成' },
                {
                  rider: { ...(o.rider ?? RIDER_PROFILE), location: '已送达' },
                  eta: nowLabel().slice(11),
                  deliveryProof,
                },
              )
            : o,
        ),
      )
      toast('已确认送达，照片已存证')
    },
    [toast],
  )

  const value = useMemo(
    () => ({
      user,
      role,
      cart,
      addresses,
      orders,
      toasts,
      setRole,
      toast,
      addToCart,
      changeQty,
      clearCart,
      saveAddress,
      removeAddress,
      setDefaultAddress,
      createOrder,
      payOrder,
      cancelOrder,
      applyRefund,
      addTicket,
      merchantAccept,
      merchantReject,
      merchantReady,
      merchantHandover,
      merchantRefundApprove,
      merchantRefundReject,
      riderClaim,
      riderArrive,
      riderDeliver,
      riderComplete,
    }),
    [
      user,
      role,
      cart,
      addresses,
      orders,
      toasts,
      setRole,
      toast,
      addToCart,
      changeQty,
      clearCart,
      saveAddress,
      removeAddress,
      setDefaultAddress,
      createOrder,
      payOrder,
      cancelOrder,
      applyRefund,
      addTicket,
      merchantAccept,
      merchantReject,
      merchantReady,
      merchantHandover,
      merchantRefundApprove,
      merchantRefundReject,
      riderClaim,
      riderArrive,
      riderDeliver,
      riderComplete,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
