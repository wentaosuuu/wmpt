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
  /** 对应后台 takeout：是否开通外卖 */
  takeoutEnabled: boolean
  /** 对应后台 frontListed：是否上架到移动端 */
  frontListed: boolean
  /** 当前地址是否可配送 */
  deliverable: boolean
  /** emoji 或文字占位封面 */
  cover: string
  /** 门牌照片（优先于 cover 展示） */
  doorPhoto?: string
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
  /** 来自后台「规格管理」关联到该菜品的规格 */
  specs: DishSpec[]
  utensils: string
  /** emoji 占位封面 */
  cover?: string
  /** 后台上传的菜品图片（优先于 cover） */
  photo?: string
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
  /** 用户补充说明，选填 */
  remark?: string
  status: 'pending' | 'approved' | 'rejected' | 'returned'
  expected: number
  createdAt: string
}

export type TicketType = 'consult' | 'complaint'

export type Ticket = {
  id: string
  type: TicketType
  orderId?: string
  content: string
  /** open=待处理，done=已完结 */
  status: 'open' | 'done'
  reply: string
  createdAt: string
}

export type Order = {
  /** 订单号：WMPT + yyyyMMdd + 6 位当日序号 */
  id: string
  storeId: string
  storeName: string
  items: OrderItem[]
  address: Address
  payChannel?: PayChannel
  /** 支付流水号：TF + yyyyMMddHHmmss + 4 位序号 */
  tradeNo?: string
  /** 退款流水号，原路退回成功后写入 */
  refundTradeNo?: string
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
  /** 实际送达时刻（骑手确认送达后写入） */
  eta?: string
  /** 骑手确认送达时上传的照片证据（data URL 或图片地址） */
  deliveryProof?: string
  refund?: Refund
  /** 申请退款/取消前的订单状态，商家驳回时用于恢复 */
  statusBeforeRefund?: OrderStatus
  cancelReason?: string
}

export type AppRole = 'consumer' | 'merchant' | 'rider'

export type User = {
  name: string
  phone: string
  campus: string
  /** 后台商家入驻审核通过后开通商家端 */
  merchantEnabled: boolean
  /** 后台骑手注册并启用后开通骑手端 */
  riderEnabled: boolean
}
