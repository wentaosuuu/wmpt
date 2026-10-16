import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DeliveryProofView } from '../../components/DeliveryProof'
import { Empty, OrderNo, Tag } from '../../components/ui'
import { sampleDeliveryProof } from '../../lib/proof'
import {
  normalizeRiderTab,
  riderStageLabel,
  riderTabOf,
  riderTabs,
  type RiderTabId,
} from '../../lib/riderStage'
import { money, storeById } from '../../lib/utils'
import { useApp } from '../../store/AppStore'

const tabs = riderTabs

type TabId = RiderTabId

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
  const { orders, riderOnline, riderClaim, riderArrive, riderDeliver, riderComplete, toast } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = normalizeRiderTab(searchParams.get('tab'))
  const [completeId, setCompleteId] = useState<string | null>(null)
  const [proofPreview, setProofPreview] = useState('')
  const [proofSrc, setProofSrc] = useState<string | null>(null)

  const counts = useMemo(() => {
    const base = { pool: 0, heading: 0, arrived: 0, delivering: 0, done: 0, cancelled: 0 }
    for (const order of orders) {
      const stage = riderTabOf(order)
      if (stage) base[stage] += 1
    }
    return base
  }, [orders])

  const list = useMemo(() => orders.filter((o) => riderTabOf(o) === tab), [orders, tab])

  function switchTab(id: TabId) {
    setSearchParams(id === 'pool' ? {} : { tab: id }, { replace: true })
  }

  return (
    <section className="page role-page">
      <header className="page-title-bar">
        <h1>订单处理</h1>
      </header>
      <div className="seg underline rider-tabs">
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
              <OrderNo id={o.id} />
              <Tag
                tone={
                  tab === 'cancelled'
                    ? 'gray'
                    : tab === 'pool' || tab === 'arrived'
                      ? 'orange'
                      : tab === 'done'
                        ? 'green'
                        : 'blue'
                }
              >
                {riderStageLabel(tab)}
              </Tag>
            </div>

            {tab === 'cancelled' ? (
              <div className="pickup-no-waiting">
                用户已取消{o.cancelReason ? `：${o.cancelReason}` : '，无需继续配送'}
              </div>
            ) : o.pickupNo ? (
              <div className={`pickup-no-banner rider${tab === 'arrived' ? ' highlight' : ''}`}>
                <span>取餐号</span>
                <strong>{o.pickupNo}</strong>
                <em>
                  {tab === 'arrived' ? '到店报号取餐' : tab === 'heading' ? '到店后报号' : '凭号核对'}
                </em>
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
                {tab !== 'cancelled' ? (
                  <button
                    className="rider-nav-btn"
                    type="button"
                    aria-label="导航到门店"
                    onClick={() => openMapNav(pickupPlace, toast)}
                  >
                    <NavIcon />
                  </button>
                ) : null}
              </div>
              <div className="rider-route-row">
                <span className="deliver">送</span>
                <div className="rider-route-body">
                  <b>{deliverPlace}</b>
                  <em>{formatDist(deliverKm)}</em>
                </div>
                {tab !== 'cancelled' ? (
                  <button
                    className="rider-nav-btn"
                    type="button"
                    aria-label="导航到收货地址"
                    onClick={() => openMapNav(deliverPlace, toast)}
                  >
                    <NavIcon />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rider-fee-row">
              <span>配送费收入</span>
              <b>{money(o.deliveryFee)}</b>
            </div>

            <p className="rider-dishes muted">{dishes}</p>
            {o.remark ? <p className="kitchen-order-remark">订单备注：{o.remark}</p> : null}

            <div className="merchant-order-meta">
              {tab === 'delivering' || tab === 'done' ? (
                <p>
                  {o.address.name} {o.address.phone}
                </p>
              ) : (
                <p className="muted">收货人信息在配送中后可见</p>
              )}
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
                riderOnline ? (
                  <button
                    className="btn"
                    type="button"
                    onClick={() => {
                      riderClaim(o.id)
                      switchTab('heading')
                    }}
                  >
                    接单去门店
                  </button>
                ) : (
                  <p className="merchant-wait-tip" style={{ flex: 1, margin: 0 }}>
                    已停止听单，切换回骑手端并开启听单后可抢单
                  </p>
                )
              ) : null}
              {tab === 'heading' ? (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    riderArrive(o.id)
                    switchTab('arrived')
                  }}
                >
                  我已到店
                </button>
              ) : null}
              {tab === 'arrived' && !o.pickupNo ? (
                <p className="merchant-wait-tip" style={{ flex: 1, margin: 0 }}>
                  已到店，等待商家出餐后凭取餐号确认取餐
                </p>
              ) : null}
              {tab === 'arrived' && o.pickupNo ? (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    riderDeliver(o.id)
                    switchTab('delivering')
                  }}
                >
                  确认取餐
                </button>
              ) : null}
              {tab === 'delivering' ? (
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
                  switchTab('done')
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
