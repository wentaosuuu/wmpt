/** 门店地址三级联动：市 → 区 → 街道 */

export type RegionNode = {
  label: string
  children?: RegionNode[]
}

export const regionTree: RegionNode[] = [
  {
    label: '南宁市',
    children: [
      {
        label: '西乡塘区',
        children: [
          { label: '高新街道' },
          { label: '安宁街道' },
          { label: '北湖街道' },
          { label: '衡阳街道' },
          { label: '上尧街道' },
        ],
      },
      {
        label: '青秀区',
        children: [
          { label: '新竹街道' },
          { label: '建政街道' },
          { label: '南湖街道' },
          { label: '津头街道' },
        ],
      },
      {
        label: '兴宁区',
        children: [
          { label: '民生街道' },
          { label: '朝阳街道' },
          { label: '三塘街道' },
        ],
      },
      {
        label: '江南区',
        children: [
          { label: '福建园街道' },
          { label: '江南街道' },
          { label: '沙井街道' },
        ],
      },
    ],
  },
  {
    label: '柳州市',
    children: [
      {
        label: '城中区',
        children: [{ label: '城中街道' }, { label: '公园街道' }],
      },
      {
        label: '鱼峰区',
        children: [{ label: '天马街道' }, { label: '荣军街道' }],
      },
    ],
  },
  {
    label: '桂林市',
    children: [
      {
        label: '秀峰区',
        children: [{ label: '秀峰街道' }, { label: '甲山街道' }],
      },
      {
        label: '七星区',
        children: [{ label: '七星街道' }, { label: '东江街道' }],
      },
    ],
  },
]

export function formatRegionPath(city: string, district: string, street: string) {
  return [city, district, street].filter(Boolean).join('')
}

export function districtsOf(city: string) {
  return regionTree.find((c) => c.label === city)?.children ?? []
}

export function streetsOf(city: string, district: string) {
  return districtsOf(city).find((d) => d.label === district)?.children ?? []
}
