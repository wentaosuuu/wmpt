import { useMemo, useState } from 'react'
import { formatRegionPath } from '../data/regionTree'
import { mapPois, type MapPoi } from '../data/mapPois'

export type MapLocationValue = {
  city: string
  district: string
  street: string
  addressDetail?: string
  poiName?: string
}

type Props = {
  value: MapLocationValue
  onChange: (next: MapLocationValue) => void
}

export function MapLocationPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [poiName, setPoiName] = useState(value.poiName ?? '')

  const summary = poiName
    ? `${poiName} · ${formatRegionPath(value.city, value.district, value.street)}`
    : value.street
      ? formatRegionPath(value.city, value.district, value.street)
      : ''

  const list = useMemo(() => {
    const q = keyword.trim()
    if (!q) return mapPois
    return mapPois.filter(
      (p) =>
        p.name.includes(q) ||
        p.street.includes(q) ||
        p.district.includes(q) ||
        (p.detailHint ?? '').includes(q),
    )
  }, [keyword])

  const active = list.find((p) => p.id === activeId) ?? null

  function applyPoi(poi: MapPoi) {
    setPoiName(poi.name)
    onChange({
      city: poi.city,
      district: poi.district,
      street: poi.street,
      addressDetail: value.addressDetail || poi.detailHint || '',
      poiName: poi.name,
    })
    setOpen(false)
    setKeyword('')
    setActiveId(null)
  }

  return (
    <div className="map-loc">
      <div className="map-loc-bar">
        <div>
          <div className="map-loc-label">地图选点</div>
          <div className={`map-loc-summary ${summary ? '' : 'placeholder'}`}>
            {summary || '在地图上快速选择门店位置，再微调区划并填写详细地址'}
          </div>
        </div>
        <button className="btn ghost" type="button" onClick={() => setOpen(true)}>
          打开地图
        </button>
      </div>

      {open ? (
        <div className="map-loc-modal" role="dialog" aria-modal="true" aria-label="地图选点">
          <button className="map-loc-mask" type="button" aria-label="关闭" onClick={() => setOpen(false)} />
          <div className="map-loc-panel">
            <div className="map-loc-head">
              <h3>地图选点</h3>
              <div className="map-loc-actions">
                <button className="btn ghost" type="button" onClick={() => setOpen(false)}>
                  取消
                </button>
                <button
                  className="btn"
                  type="button"
                  disabled={!active}
                  onClick={() => active && applyPoi(active)}
                >
                  使用该位置
                </button>
              </div>
            </div>
            <input
              className="map-loc-search"
              value={keyword}
              placeholder="搜索地点 / 街道"
              onChange={(e) => setKeyword(e.target.value)}
            />
            <div className="map-loc-body">
              <div className="map-loc-canvas">
                <div className="map-loc-grid" />
                <div className="map-loc-road h" style={{ top: '32%' }} />
                <div className="map-loc-road h" style={{ top: '58%' }} />
                <div className="map-loc-road v" style={{ left: '40%' }} />
                <div className="map-loc-road v" style={{ left: '66%' }} />
                {list.map((poi) => (
                  <button
                    key={poi.id}
                    type="button"
                    className={`map-loc-pin ${activeId === poi.id ? 'on' : ''}`}
                    style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
                    onClick={() => setActiveId(poi.id)}
                    title={poi.name}
                  >
                    <i />
                    <span>{poi.name}</span>
                  </button>
                ))}
              </div>
              <ul className="map-loc-list">
                {list.map((poi) => (
                  <li key={poi.id}>
                    <button
                      type="button"
                      className={activeId === poi.id ? 'active' : ''}
                      onClick={() => setActiveId(poi.id)}
                      onDoubleClick={() => applyPoi(poi)}
                    >
                      <strong>{poi.name}</strong>
                      <em>
                        {formatRegionPath(poi.city, poi.district, poi.street)}
                        {poi.detailHint ? ` · ${poi.detailHint}` : ''}
                      </em>
                    </button>
                  </li>
                ))}
                {!list.length ? <li className="map-loc-empty">未找到相关地点</li> : null}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
