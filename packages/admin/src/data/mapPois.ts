/** 管理端门店地址地图选点 POI（演示） */
export type MapPoi = {
  id: string
  name: string
  city: string
  district: string
  street: string
  detailHint?: string
  x: number
  y: number
}

export const mapPois: MapPoi[] = [
  {
    id: 'p1',
    name: '云宝宝园区 · 科研楼',
    city: '南宁市',
    district: '西乡塘区',
    street: '高新街道',
    detailHint: '科研楼 A 座门口',
    x: 38,
    y: 42,
  },
  {
    id: 'p2',
    name: '南门食堂',
    city: '南宁市',
    district: '西乡塘区',
    street: '高新街道',
    detailHint: '南门食堂 1 层外卖档口',
    x: 52,
    y: 58,
  },
  {
    id: 'p3',
    name: '新安商业街',
    city: '南宁市',
    district: '西乡塘区',
    street: '安宁街道',
    detailHint: '新安商业街 12 号',
    x: 68,
    y: 36,
  },
  {
    id: 'p4',
    name: '北区生活街',
    city: '南宁市',
    district: '西乡塘区',
    street: '北湖街道',
    detailHint: '北区生活街 8 号',
    x: 28,
    y: 70,
  },
  {
    id: 'p5',
    name: '南湖公园东门',
    city: '南宁市',
    district: '青秀区',
    street: '南湖街道',
    detailHint: '南湖公园东门商铺',
    x: 58,
    y: 22,
  },
  {
    id: 'p6',
    name: '朝阳步行街',
    city: '南宁市',
    district: '兴宁区',
    street: '朝阳街道',
    detailHint: '朝阳步行街 B1 档口',
    x: 78,
    y: 48,
  },
]
