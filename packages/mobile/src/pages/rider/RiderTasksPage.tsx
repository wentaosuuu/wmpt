import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DeliveryProofView } from '../../components/DeliveryProof'
import { Empty, OrderNo, Tag } from '../../components/ui'
import { sampleDeliveryProof } from '../../lib/proof'
import { money, statusText, storeById } from '../../lib/utils'
import { useApp } from '../../store/AppStore'

const tabs = [
  { id: 'pool', label: '待接单' },
  { id: 'doing', label: '进行中' },
  { id: 'done', label: '已完成' },
] as const

type TabId = (typeof tabs)[number]['id']

function isTabId(v: string | null): v is TabId {
  return tabs.some((t) => t.id === v)
}

function formatDist(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

/** 打开地图导航（优先高德，便于骑手端调起） */
function openMapNav(place: string, toast: (text: string) => void) {
  const q = encodeURIComponent(place)
  toast(`正在打开导航：${place}`)
  window.open(
    `https://uri.amap.com/navigation?to=${q}&mode=ride&src=wmpt&callnative=1`,
    '_blank',
    'noopener,noreferrer',
  )
}

function NavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.5 4.5 19.5l7.5-3.2 7.5 3.2L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function RiderTasksPage() {
  const { orders, riderClaim, riderDeliver, riderComplete, toast } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<TabId>(() => {
    const q = searchParams.get('tab')
    return isTabId(q) ? q : 'pool'
  })
  const [completeId, setCompleteId] = useState<string | null>(null)
  const [proofPreview, setProofPreview] = useState('')
  const [proofSrc, setProofSrc] = useState<string | null>(null)

  useEffect(() => {
    const q = searchParams.get('tab')
    if (isTabId(q) && q !== tab) setTab(q)
  }, [searchParams, tab])

  const counts = useMemo(() => {
    const pool = orders.filter((o) => ['preparing', 'ready'].includes(o.status) && !o.rider).length
    const doing = orders.filter(
      (o) =>
        o.rider?.name === '李骑手' &&
        ['preparing', 'ready', 'picked', 'delivering'].includes(o.status),
    ).length
    const done = orders.filter((o) => o.rider?.name === '李骑手' && o.status === 'delivered').length
    return { pool, doing, done }
  }, [orders])

  const list = useMemo(() => {
    if (tab === 'pool') {
      return orders.filter((o) => ['preparing', 'ready'].includes(o.status) && !o.rider)
    }
    if (tab === 'doing') {
      return orders.filter(
        (o) =>
          o.rider?.name === '李骑手' &&
          ['preparing', 'ready', 'picked', 'delivering'].includes(o.status),
      )
    }
    return orders.filter((o) => o.rider?.name === '李骑手' && o.status === 'delivered')
  }, [orders, tab])

  function switchTab(id: TabId) {
    setTab(id)
    setSearchParams(id === 'pool' ? {} : { tab: id }, { replace: true })
  }

  return (
    <section className="page role-page">
      <header className="page-title-bar">
        <h1>订单处理</h1>
      </header>
      <div className="seg underline">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'on' : ''}
            type="button"
            onClick={() => switchTab(t.id)}
          >
            {t.label}
            {counts[t.id] ? <em>{counts[t.id]}</em> : null}
          </button>
        ))}
      </div>

      {list.map((o) => {
        const store = storeById(o.storeId)
        const canPickup =
          tab === 'doing' &&
          ['preparing', 'ready', 'picked'].includes(o.status) &&
          !!o.pickupNo
        const pickupKm = store?.distanceKm ?? 1
        const deliverKm = Math.round((pickupKm + 0.6) * 10) / 10
        const pickupPlace = store?.address || o.storeName
        const deliverPlace = `${o.address.district}${o.address.street}${
          o.address.detail ? ` ${o.address.detail}` : ''
        }`
        const dishes = o.items.map((i) => `${i.name}×${i.qty}`).join('、')

        return (
          <div key={o.id} className="card role-order">
            <div className="row">
              <OrderNo id={o.id} short />
              <Tag tone={tab === 'pool' ? 'orange' : 'blue'}>{statusText(o.status)}</Tag>
            </div>

            {o.pickupNo ? (
              <div className={`pickup-no-banner rider${o.status === 'ready' ? ' highlight' : ''}`}>
                <span>取餐号</span>
                <strong>{o.pickupNo}</strong>
                <em>{o.status === 'ready' ? '到店报号取餐' : '凭号核对'}</em>
              </div>
            ) : o.status === 'preparing' ? (
              <div className="pickup-no-waiting">商家备餐中，出餐后生成取餐号</div>
            ) : null}

            <div className="rider-route">
              <div className="rider-route-row">
                <span>取</span>
                <div className="rider-route-body">
                  <b>{o.storeName}</b>
                  <em>{formatDist(pickupKm)}</em>
                </div>
                <button
                  className="rider-nav-btn"
                  type="button"
                  aria-label="导航到门店"
                  onClick={() => openMapNav(pickupPlace, toast)}
                >
                  <NavIcon />
                </button>
              </div>
              <div className="rider-route-row">
                <span className="deliver">送</span>
                <div className="rider-route-body">
                  <b>{deliverPlace}</b>
                  <em>{formatDist(deliverKm)}</em>
                </div>
                <button
                  className="rider-nav-btn"
                  type="button"
                  aria-label="导航到收货地址"
                  onClick={() => openMapNav(deliverPlace, toast)}
                >
                  <NavIcon />
                </button>
              </div>
            </div>

            <div className="rider-fee-row">
              <span>配送费收入</span>
              <b>{money(o.deliveryFee)}</b>
            </div>

            <p className="rider-dishes muted">{dishes}</p>
            {o.remark ? <p className="kitchen-order-remark">订单备注：{o.remark}</p> : null}

            <div className="merchant-order-meta">
              <p>
                {o.address.name} {o.address.phone}
              </p>
              {o.rider?.location ? <p>{o.rider.location}</p> : null}
            </div>

            {o.deliveryProof ? (
              <button
                className="link-btn proof-link"
                type="button"
                onClick={() => setProofSrc(o.deliveryProof!)}
              >
                查看送达凭证 ›
              </button>
            ) : null}

            <div className="role-actions">
              {tab === 'pool' ? (
                <button className="btn" type="button" onClick={() => riderClaim(o.id)}>
                  接单去门店
                </button>
              ) : null}
              {tab === 'doing' && o.status === 'preparing' && !o.pickupNo ? (
                <p className="merchant-wait-tip" style={{ flex: 1, margin: 0 }}>
                  等待商家出餐后，凭取餐号确认取餐
                </p>
              ) : null}
              {canPickup ? (
                <button className="btn" type="button" onClick={() => riderDeliver(o.id)}>
                  确认取餐
                </button>
              ) : null}
              {tab === 'doing' && o.status === 'delivering' ? (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setCompleteId(o.id)
                    setProofPreview('')
                  }}
                >
                  确认送达
                </button>
              ) : null}
            </div>
          </div>
        )
      })}
      {!list.length ? <Empty text="暂无任务" /> : null}

      {completeId ? (
        <div className="role-sheet">
          <div className="role-sheet-card">
            <h3>确认送达</h3>
            <p className="muted">请拍摄放置位置照片作为送达凭证，提交后商家与用户均可查看</p>
            {proofPreview ? (
              <img className="delivery-proof-preview" src={proofPreview} alt="送达照片预览" />
            ) : (
              <div className="delivery-proof-empty">尚未选择照片</div>
            )}
            <div className="role-actions" style={{ marginTop: 12, justifyContent: 'stretch' }}>
              <label className="btn ghost" style={{ textAlign: 'center' }}>
                拍照 / 相册
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () => setProofPreview(String(reader.result || ''))
                    reader.readAsDataURL(file)
                  }}
                />
              </label>
              <button
                className="btn ghost"
                type="button"
                onClick={() => setProofPreview(sampleDeliveryProof(`送达 · ${completeId.slice(-6)}`))}
              >
                使用示例照片
              </button>
            </div>
            <div className="role-actions" style={{ marginTop: 12 }}>
              <button
                className="btn ghost"
                type="button"
                onClick={() => {
                  setCompleteId(null)
                  setProofPreview('')
                }}
              >
                取消
              </button>
              <button
                className="btn"
                type="button"
                disabled={!proofPreview}
                onClick={() => {
                  if (!completeId || !proofPreview) return
                  riderComplete(completeId, proofPreview)
                  setCompleteId(null)
                  setProofPreview('')
                  setSearchParams({ tab: 'done' }, { replace: true })
                  setTab('done')
                }}
              >
                提交并确认送达
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {proofSrc ? (
        <div className="role-sheet" onClick={() => setProofSrc(null)}>
          <div className="role-sheet-card proof-sheet" onClick={(e) => e.stopPropagation()}>
            <h3>送达凭证</h3>
            <DeliveryProofView src={proofSrc} caption="门口放置 · 已拍照存证" />
            <div className="role-actions" style={{ marginTop: 12 }}>
              <button className="btn" type="button" onClick={() => setProofSrc(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
