import { useEffect, useMemo, useState } from 'react'
import {
  addressTree,
  formatCascadePath,
  type AddressCascadeValue,
  type AddressTreeNode,
} from '../data/addressTree'

const LEVELS = ['市', '区', '街道'] as const

type Props = {
  value: AddressCascadeValue | null
  onChange: (next: AddressCascadeValue) => void
}

export function AddressCascadeField({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const summary = value ? formatCascadePath(value) : ''

  return (
    <>
      <div className="field">
        <label>收货位置</label>
        <button
          type="button"
          className={`cascade-trigger ${summary ? '' : 'placeholder'}`}
          onClick={() => setOpen(true)}
        >
          <span>{summary || '请选择市 / 区 / 街道'}</span>
          <em>›</em>
        </button>
      </div>
      {open ? (
        <AddressCascadeSheet
          initial={value}
          onCancel={() => setOpen(false)}
          onConfirm={(next) => {
            onChange(next)
            setOpen(false)
          }}
        />
      ) : null}
    </>
  )
}

function AddressCascadeSheet({
  initial,
  onCancel,
  onConfirm,
}: {
  initial: AddressCascadeValue | null
  onCancel: () => void
  onConfirm: (next: AddressCascadeValue) => void
}) {
  const [cityIdx, setCityIdx] = useState<number | null>(null)
  const [districtIdx, setDistrictIdx] = useState<number | null>(null)
  const [streetIdx, setStreetIdx] = useState<number | null>(null)
  const [activeCol, setActiveCol] = useState(0)

  useEffect(() => {
    if (!initial) return
    const c = addressTree.findIndex((n) => n.label === initial.city)
    if (c < 0) return
    const districts = addressTree[c].children ?? []
    const d = districts.findIndex((n) => n.label === initial.district)
    if (d < 0) return
    const streets = districts[d].children ?? []
    const s = Math.max(0, streets.findIndex((n) => n.label === initial.street))
    setCityIdx(c)
    setDistrictIdx(d)
    setStreetIdx(s)
    setActiveCol(2)
  }, [initial])

  const cities = addressTree
  const districts = cityIdx == null ? [] : (cities[cityIdx]?.children ?? [])
  const streets = districtIdx == null ? [] : (districts[districtIdx]?.children ?? [])

  const draft = useMemo((): AddressCascadeValue | null => {
    if (cityIdx == null || districtIdx == null || streetIdx == null) return null
    const city = cities[cityIdx]
    const district = districts[districtIdx]
    const street = streets[streetIdx]
    if (!city || !district || !street) return null
    return {
      city: city.label,
      district: district.label,
      street: street.label,
      inRange: street.inRange !== false,
    }
  }, [cityIdx, districtIdx, streetIdx, cities, districts, streets])

  const pathLabels = [
    cityIdx == null ? undefined : cities[cityIdx]?.label,
    districtIdx == null ? undefined : districts[districtIdx]?.label,
    streetIdx == null ? undefined : streets[streetIdx]?.label,
  ]

  const columns: {
    items: AddressTreeNode[]
    selected: number | null
    onPick: (i: number) => void
  }[] = [
    {
      items: cities,
      selected: cityIdx,
      onPick: (i) => {
        setCityIdx(i)
        setDistrictIdx(null)
        setStreetIdx(null)
        setActiveCol(1)
      },
    },
    {
      items: districts,
      selected: districtIdx,
      onPick: (i) => {
        setDistrictIdx(i)
        setStreetIdx(null)
        setActiveCol(2)
      },
    },
    {
      items: streets,
      selected: streetIdx,
      onPick: (i) => {
        setStreetIdx(i)
        setActiveCol(2)
      },
    },
  ]

  const current = columns[activeCol]

  return (
    <div className="cascade-sheet" role="dialog" aria-modal="true" aria-label="选择收货位置">
      <button className="cascade-mask" type="button" aria-label="关闭" onClick={onCancel} />
      <div className="cascade-panel">
        <div className="cascade-head">
          <button type="button" className="nav-btn" onClick={onCancel}>
            取消
          </button>
          <h3>选择收货位置</h3>
          <button
            type="button"
            className="nav-btn cascade-ok"
            disabled={!draft}
            onClick={() => draft && onConfirm(draft)}
          >
            确定
          </button>
        </div>

        <div className="cascade-tabs cascade-tabs-3" role="tablist">
          {LEVELS.map((title, i) => {
            const filled = Boolean(pathLabels[i])
            const enabled = i === 0 || Boolean(pathLabels[i - 1])
            return (
              <button
                key={title}
                type="button"
                role="tab"
                aria-selected={activeCol === i}
                className={`cascade-tab ${activeCol === i ? 'active' : ''} ${filled ? 'filled' : ''}`}
                disabled={!enabled}
                onClick={() => enabled && setActiveCol(i)}
              >
                {pathLabels[i] || `请选择${title}`}
              </button>
            )
          })}
        </div>

        <ul className="cascade-list">
          {current.items.length === 0 ? (
            <li className="cascade-empty">请先完成上一级选择</li>
          ) : (
            current.items.map((item, i) => (
              <li key={item.label}>
                <button
                  type="button"
                  className={current.selected === i ? 'active' : ''}
                  onClick={() => current.onPick(i)}
                >
                  <span>{item.label}</span>
                  {item.inRange === false ? <em className="out">超范围</em> : null}
                  {current.selected === i ? <b>✓</b> : null}
                </button>
              </li>
            ))
          )}
        </ul>

        {draft ? (
          <p className={`cascade-hint ${draft.inRange ? 'ok' : 'warn'}`}>
            {draft.inRange ? '定位校验：在配送范围内' : '定位校验：超出配送范围'}
            <span>{formatCascadePath(draft)}</span>
          </p>
        ) : (
          <p className="cascade-hint">请依次选择市、区、街道</p>
        )}
      </div>
    </div>
  )
}
