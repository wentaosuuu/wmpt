import { useMemo, useState } from 'react'
import { formatCascadePath } from '../data/addressTree'
import { mapPois, poiToPickResult, type MapPickResult, type MapPoi } from '../data/mapPois'

type Props = {
  summary?: string
  onPick: (next: MapPickResult) => void
}

export function MapPickField({ summary, onPick }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="field">
        <label>地图选点</label>
        <button
          type="button"
          className={`cascade-trigger map-pick-trigger ${summary ? '' : 'placeholder'}`}
          onClick={() => setOpen(true)}
        >
          <span>{summary || '在地图上快速选择位置'}</span>
          <em>📍</em>
        </button>
      </div>
      {open ? (
        <MapPickSheet
          onCancel={() => setOpen(false)}
          onConfirm={(next) => {
            onPick(next)
            setOpen(false)
          }}
        />
      ) : null}
    </>
  )
}

function MapPickSheet({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: (next: MapPickResult) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')

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

  function confirmPoi(poi: MapPoi) {
    onConfirm(poiToPickResult(poi))
  }

  return (
    <div className="cascade-sheet" role="dialog" aria-modal="true" aria-label="地图选点">
      <button className="cascade-mask" type="button" aria-label="关闭" onClick={onCancel} />
      <div className="cascade-panel map-pick-panel">
        <div className="cascade-head">
          <button type="button" className="nav-btn" onClick={onCancel}>
            取消
          </button>
          <h3>地图选点</h3>
          <button
            type="button"
            className="nav-btn cascade-ok"
            disabled={!active}
            onClick={() => active && confirmPoi(active)}
          >
            确定
          </button>
        </div>

        <div className="map-pick-search">
          <input
            value={keyword}
            placeholder="搜索地点 / 街道"
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <div className="map-canvas" aria-hidden={false}>
          <div className="map-canvas-grid" />
          <div className="map-canvas-road h" style={{ top: '32%' }} />
          <div className="map-canvas-road h" style={{ top: '58%' }} />
          <div className="map-canvas-road v" style={{ left: '40%' }} />
          <div className="map-canvas-road v" style={{ left: '66%' }} />
          {list.map((poi) => (
            <button
              key={poi.id}
              type="button"
              className={`map-pin ${activeId === poi.id ? 'on' : ''}`}
              style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
              onClick={() => setActiveId(poi.id)}
              title={poi.name}
            >
              <i />
              <span>{poi.name}</span>
            </button>
          ))}
        </div>

        <ul className="map-poi-list">
          {list.length === 0 ? (
            <li className="cascade-empty">未找到相关地点</li>
          ) : (
            list.map((poi) => {
              const result = poiToPickResult(poi)
              return (
                <li key={poi.id}>
                  <button
                    type="button"
                    className={activeId === poi.id ? 'active' : ''}
                    onClick={() => setActiveId(poi.id)}
                    onDoubleClick={() => confirmPoi(poi)}
                  >
                    <strong>{poi.name}</strong>
                    <em>
                      {formatCascadePath(result)}
                      {poi.detailHint ? ` · ${poi.detailHint}` : ''}
                    </em>
                    {!result.inRange ? <b className="out">超范围</b> : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>

        {active ? (
          <p className={`cascade-hint ${poiToPickResult(active).inRange ? 'ok' : 'warn'}`}>
            已选：{active.name}
            <span>{formatCascadePath(poiToPickResult(active))}</span>
          </p>
        ) : (
          <p className="cascade-hint">点击地图标注或下方列表选择位置，再微调行政区划</p>
        )}
      </div>
    </div>
  )
}
