/** 行政区划三级联动：市 → 区 → 街道 */

export type AddressTreeNode = {
  label: string
  /** 仅街道节点携带配送范围 */
  inRange?: boolean
  children?: AddressTreeNode[]
}

export type AddressCascadeValue = {
  city: string
  district: string
  street: string
  inRange: boolean
}

export const addressTree: AddressTreeNode[] = [
  {
    label: '南宁市',
    children: [
      {
        label: '西乡塘区',
        children: [
          { label: '高新街道', inRange: true },
          { label: '安宁街道', inRange: true },
          { label: '北湖街道', inRange: true },
          { label: '衡阳街道', inRange: true },
          { label: '上尧街道', inRange: false },
        ],
      },
      {
        label: '青秀区',
        children: [
          { label: '新竹街道', inRange: true },
          { label: '建政街道', inRange: true },
          { label: '南湖街道', inRange: true },
          { label: '津头街道', inRange: false },
        ],
      },
      {
        label: '兴宁区',
        children: [
          { label: '民生街道', inRange: true },
          { label: '朝阳街道', inRange: true },
          { label: '三塘街道', inRange: false },
        ],
      },
      {
        label: '江南区',
        children: [
          { label: '福建园街道', inRange: true },
          { label: '江南街道', inRange: true },
          { label: '沙井街道', inRange: false },
        ],
      },
    ],
  },
  {
    label: '柳州市',
    children: [
      {
        label: '城中区',
        children: [
          { label: '城中街道', inRange: false },
          { label: '公园街道', inRange: false },
        ],
      },
      {
        label: '鱼峰区',
        children: [
          { label: '天马街道', inRange: false },
          { label: '荣军街道', inRange: false },
        ],
      },
    ],
  },
  {
    label: '桂林市',
    children: [
      {
        label: '秀峰区',
        children: [
          { label: '秀峰街道', inRange: false },
          { label: '甲山街道', inRange: false },
        ],
      },
      {
        label: '七星区',
        children: [
          { label: '七星街道', inRange: false },
          { label: '东江街道', inRange: false },
        ],
      },
    ],
  },
]

/** 根据已有市/区/街道反查联动路径 */
export function resolveCascadeFromAddress(
  city: string,
  district: string,
  street: string,
): AddressCascadeValue | null {
  if (!city) return null
  for (const c of addressTree) {
    if (c.label !== city) continue
    const districts = c.children ?? []
    const d = districts.find((n) => n.label === district) ?? districts[0]
    if (!d) return null
    const streets = d.children ?? []
    const s = streets.find((n) => n.label === street) ?? streets[0]
    return {
      city: c.label,
      district: d.label,
      street: s?.label ?? '',
      inRange: s?.inRange !== false,
    }
  }
  return null
}

export function formatCascadePath(v: Pick<AddressCascadeValue, 'city' | 'district' | 'street'>) {
  return [v.city, v.district, v.street].filter(Boolean).join(' ')
}

export function formatAddressLine(a: {
  city: string
  district: string
  street: string
  detail?: string
}) {
  const base = formatCascadePath(a)
  return a.detail ? `${base} ${a.detail}` : base
}
