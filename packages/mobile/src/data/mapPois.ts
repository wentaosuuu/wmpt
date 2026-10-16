import { resolveCascadeFromAddress, type AddressCascadeValue } from './addressTree'

/** 演示用地图选点 POI（点击后回填市/区/街道，并可带出详细地址建议） */
export type MapPoi = {
  id: string
  name: string
  city: string
  district: string
  street: string
  detailHint?: string
  /** 地图上的相对坐标 0-100 */
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
    detailHint: '科研楼 A 座',
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
    name: '人才公寓',
    city: '南宁市',
    district: '西乡塘区',
    street: '安宁街道',
    detailHint: '人才公寓 3 号楼',
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
    name: '外部合作园区 C 区',
    city: '南宁市',
    district: '西乡塘区',
    street: '上尧街道',
    detailHint: 'C 区会客室',
    x: 78,
    y: 72,
  },
  {
    id: 'p6',
    name: '南湖公园东门',
    city: '南宁市',
    district: '青秀区',
    street: '南湖街道',
    detailHint: '南湖公园东门岗亭旁',
    x: 58,
    y: 22,
  },
]

export type MapPickResult = AddressCascadeValue & {
  poiName: string
  detailHint?: string
}

export function poiToPickResult(poi: MapPoi): MapPickResult {
  const cascade =
    resolveCascadeFromAddress(poi.city, poi.district, poi.street) ?? {
      city: poi.city,
      district: poi.district,
      street: poi.street,
      inRange: true,
    }
  return {
    ...cascade,
    poiName: poi.name,
    detailHint: poi.detailHint,
  }
}
