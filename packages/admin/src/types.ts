export type RoleCode = 'admin' | 'merchant' | 'cs' | 'finance'

export type AdminUser = {
  name: string
  username: string
  role: RoleCode
}

export type Merchant = {
  id: string
  name: string
  /** 总店 / 分店 */
  type: 'hq' | 'branch'
  /** 分店所属总店 id；总店为空 */
  parentId?: string
  /** 分店所属总店名称（冗余展示） */
  parentName?: string
  /** 是否开通外卖履约能力 */
  takeout: boolean
  /** 是否上架到移动端供用户下单（试点上架） */
  frontListed: boolean
  address: string
  pickup: string
  contact: string
  phone: string
  hours: string
  qualStatus: 'valid' | 'expiring' | 'pending' | 'rejected'
  license: string
  expireAt: string
  /** 门牌照片（data URL 或图片地址），移动端列表/详情展示 */
  doorPhoto?: string
  /** 起送费（元）：消费者餐品金额未达此值不可下单 */
  minOrder: number
  /** 配送费（元），与移动端展示一致 */
  deliveryFee: number
  /** 经营品类（与移动端品类筛选一致） */
  cuisine: string
  /** 保证金（元） */
  deposit: number
  /** 每笔订单统一包装费（元），非按菜品计 */
  orderPackingFee: number
  status: 'approved' | 'disabled'
}

/** 门店信息变更记录 */
export type MerchantChangeLog = {
  id: string
  merchantId: string
  /** 变更项 */
  field: string
  /** 变更时间 */
  changedAt: string
  /** 变更前 */
  before: string
  /** 变更后 */
  after: string
  /** 操作人 */
  operator: string
}

export type StoreAttachment = {
  id: string
  name: string
  /** 附件类型 */
  kind: 'license' | 'food_permit' | 'id_card' | 'other'
  sizeLabel: string
  uploadedAt: string
}

export type StoreApplication = {
  id: string
  /** 入驻类型：总店 / 分店（分店须挂所属总店） */
  applyType: 'hq' | 'branch'
  name: string
  /** 分店所属总店名称 */
  parentMerchant: string
  /** 市 / 区 / 街道 */
  city: string
  district: string
  street: string
  /** 详细地址（楼栋门牌等） */
  addressDetail: string
  /** 完整地址展示：市区街道 + 详细地址 */
  address: string
  contact: string
  phone: string
  license: string
  hours: string
  cuisine: string
  attachments: StoreAttachment[]
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  auditRemark?: string
  auditedAt?: string
}

export type DishCategory = {
  id: string
  storeId: string
  storeName: string
  name: string
  sort: number
  enabled: boolean
}

/** 移动端首页品类快捷入口（系统级配置） */
export type CuisineCategory = {
  id: string
  name: string
  /** 图标：emoji 或上传后的 data URL / 图片地址 */
  icon: string
  sort: number
  enabled: boolean
  /** 「全部」入口，不可删除 / 改名 */
  isAll?: boolean
}

export type DishSpec = {
  id: string
  storeId: string
  storeName: string
  name: string
  extraPrice: number
  enabled: boolean
}

export type Product = {
  id: string
  storeId: string
  storeName: string
  name: string
  /** 商品描述，移动端菜品详情展示 */
  description: string
  categoryId: string
  category: string
  price: number
  packingFee: number
  utensils: string
  stock: number
  soldOut: boolean
  onShelf: boolean
  specIds: string[]
  spec: string
  /** 菜品图片（data URL），移动端菜单/详情展示 */
  photo?: string
}

export type AdminOrderStatus =
  | 'pending_accept'
  | 'rejected'
  | 'preparing'
  | 'ready'
  | 'dispatching'
  | 'picked'
  | 'delivering'
  | 'delivered'
  | 'cancel_review'
  | 'cancelled'
  | 'refund_review'
  | 'refunded'
  | 'dispatch_fail'

export type AdminOrder = {
  id: string
  storeId: string
  storeName: string
  user: string
  phone: string
  address: string
  items: string
  amount: number
  packingFee: number
  deliveryFee: number
  status: AdminOrderStatus
  createdAt: string
  prepMinutes?: number
  rider?: string
  cancelReason?: string
  /** 用户申请取消前订单所处履约阶段 */
  cancelFromStatus?: AdminOrderStatus
  refundReason?: string
  refundAmount?: number
  note: string
}

export type TradeRecord = {
  id: string
  tradeNo: string
  orderId: string
  storeId: string
  storeName: string
  user: string
  phone: string
  channel: 'wechat' | 'alipay'
  type: 'pay' | 'refund'
  amount: number
  mealAmount: number
  packingFee: number
  deliveryFee: number
  status: 'success' | 'failed' | 'processing'
  createdAt: string
  thirdPartyNo: string
  remark: string
}

export type Ticket = {
  id: string
  type: 'consult' | 'complaint'
  user: string
  content: string
  /** open=待处理，done=已完结 */
  status: 'open' | 'done'
  handler: string
  result: string
  createdAt: string
}

export type Coverage = {
  storeId: string
  storeName: string
  /** 以门店为圆心的配送半径（公里） */
  radiusKm: number
  enabled: boolean
}

export type Pilot = {
  id: string
  unit: string
  building: string
  pickup: string
  hours: string
  enabled: boolean
}

export type CancelRule = {
  stage: string
  stageKey: string
  allowCancel: boolean
  needAudit: boolean
  refundPolicy: string
}

/** 商家门店员工（岗位固定为员工） */
export type StoreStaff = {
  id: string
  name: string
  phone: string
  storeId: string
  storeName: string
  /** 是否有审核权限（如接单相关审核） */
  canAudit: boolean
  status: 'enabled' | 'disabled'
  createdAt: string
}

export type RiderAttachment = {
  id: string
  name: string
  kind: 'id_card' | 'other'
  sizeLabel: string
  uploadedAt: string
}

export type Rider = {
  id: string
  name: string
  phone: string
  idNo: string
  emergencyName: string
  emergencyPhone: string
  attachments: RiderAttachment[]
  /** 启用后账号生效，可接单 */
  status: 'enabled' | 'disabled'
  createdAt: string
}

export type SysDept = {
  id: string
  name: string
  parentId: string | null
  leader: string
  phone: string
  status: 'enabled' | 'disabled'
  sort: number
}

export type SysRole = {
  id: string
  name: string
  code: string
  remark: string
  status: 'enabled' | 'disabled'
  permissions: string[]
}

export type SysUser = {
  id: string
  username: string
  name: string
  phone: string
  deptId: string
  deptName: string
  roleIds: string[]
  roleNames: string
  status: 'enabled' | 'disabled'
  createdAt: string
}
