export type StoreStatus = 'open' | 'closed'

export type Store = {
  id: string
  name: string
  cuisine: string
  distanceKm: number
  rating: number
  monthlySales: number
  status: StoreStatus
  minOrder: number
  deliveryFee: number
  /** 每笔订单统一包装费（元） */
  orderPackingFee: number
  /** 预计配送时长（分钟） */
  etaMin: number
  tags: string[]
  extraFees: { name: string; amount: number }[]
  address: string
  phone: string
  hours: string
  notice: string
  takeoutEnabled: boolean
  deliverable: boolean
  cover: string
}

export type DishSpec = {
  name: string
  extra: number
}

export type Dish = {
  id: string
  storeId: string
  name: string
  category: string
  price: number
  packingFee: number
  soldOut: boolean
  stock: number
  description: string
  specs: DishSpec[]
  utensils: string
  remarks: string[]
  cover?: string
}

export type CartItem = {
  key: string
  storeId: string
  dishId: string
  name: string
  spec: string
  remark: string
  price: number
  packingFee: number
  qty: number
}

export type Address = {
  id: string
  name: string
  phone: string
  city: string
  district: string
  street: string
  detail: string
  inRange: boolean
  isDefault: boolean
}

export type PayChannel = 'wechat' | 'alipay'

export type OrderStatus =
  | 'pending_pay'
  | 'pending_accept'
  | 'rejected'
  | 'preparing'
  | 'ready'
  | 'picked'
  | 'delivering'
  | 'delivered'
  | 'cancelled'
  | 'refunding'
  | 'refunded'

export type OrderItem = {
  dishId: string
  name: string
  spec: string
  remark: string
  price: number
  packingFee: number
  qty: number
}

export type TimelineEvent = {
  time: string
  title: string
  desc: string
}

export type Refund = {
  id: string
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'returned'
  expected: number
  createdAt: string
}

export type Ticket = {
  id: string
  orderId?: string
  content: string
  status: 'open' | 'processing' | 'done'
  reply: string
  createdAt: string
}

export type Order = {
  id: string
  storeId: string
  storeName: string
  items: OrderItem[]
  address: Address
  payChannel?: PayChannel
  status: OrderStatus
  createdAt: string
  payDeadline: string
  remark: string
  packingFee: number
  deliveryFee: number
  extraFee: number
  dishAmount: number
  payable: number
  timeline: TimelineEvent[]
  /** 商家出餐后生成的三位取餐号，供骑手到店快速取餐 */
  pickupNo?: string
  rider?: { name: string; phone: string; location: string }
  /** 预计送达时刻（兼容旧字段） */
  eta?: string
  /** 预计送达时间区间，如 12:00-12:15 */
  etaRange?: string
  /** 骑手确认送达时上传的照片证据（data URL 或图片地址） */
  deliveryProof?: string
  refund?: Refund
  cancelReason?: string
}

export type AppRole = 'consumer' | 'merchant' | 'rider'

export type User = {
  name: string
  phone: string
  campus: string
}
