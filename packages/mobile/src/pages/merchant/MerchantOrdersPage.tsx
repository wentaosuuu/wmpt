import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DeliveryProofView } from '../../components/DeliveryProof'
import { Empty, MoneyRow, OrderNo, Tag } from '../../components/ui'
import { merchantStoreOrders } from '../../lib/merchantStore'
import { money, statusText } from '../../lib/utils'
import { useApp } from '../../store/AppStore'
import type { Order } from '../../types'

/** 商家到手：餐品+包装+附加（不含配送费） */
function merchantIncome(o: Order) {
  return o.dishAmount + o.packingFee + o.extraFee
}

const tabs = [
  { id: 'pending_accept', label: '待接单' },
  { id: 'preparing', label: '备餐中' },
  { id: 'ready', label: '待取餐' },
  { id: 'refunding', label: '退款' },
  { id: 'done', label: '已完成' },
] as const

type TabId = (typeof tabs)[number]['id']

function isTabId(v: string | null): v is TabId {
  return tabs.some((t) => t.id === v)
}

export function MerchantOrdersPage() {
  const {
    orders,
    merchantAccept,
    merchantReject,
    merchantReady,
    merchantRefundApprove,
    merchantRefundReject,
    toast,
  } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<TabId>(() => {
    const q = searchParams.get('tab')
    return isTabId(q) ? q : 'pending_accept'
  })
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('已售罄')
  const [rejectOther, setRejectOther] = useState('')
  const [refundRejectId, setRefundRejectId] = useState<string | null>(null)
  const [proofSrc, setProofSrc] = useState<string | null>(null)

  useEffect(() => {
    const q = searchParams.get('tab')
    if (isTabId(q) && q !== tab) setTab(q)
  }, [searchParams, tab])

  const mine = useMemo(() => merchantStoreOrders(orders), [orders])

  const counts = useMemo(() => {
    const map: Record<TabId, number> = {
      pending_accept: 0,
      preparing: 0,
      ready: 0,
      refunding: 0,
      done: 0,
    }
    for (const o of mine) {
      if (o.status === 'pending_accept') map.pending_accept += 1
      else if (o.status === 'preparing') map.preparing += 1
      else if (o.status === 'ready') map.ready += 1
      else if (o.status === 'refunding') map.refunding += 1
      else if (
        ['picked', 'delivering', 'delivered', 'rejected', 'cancelled', 'refunded'].includes(o.status)
      ) {
        map.done += 1
      }
    }
    return map
  }, [mine])

  const list = useMemo(() => {
    if (tab === 'done') {
      return mine.filter((o) =>
        ['picked', 'delivering', 'delivered', 'rejected', 'cancelled', 'refunded'].includes(o.status),
      )
    }
    return mine.filter((o) => o.status === tab)
  }, [mine, tab])

  function switchTab(id: TabId) {
    setTab(id)
    setSearchParams(id === 'pending_accept' ? {} : { tab: id }, { replace: true })
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

      {list.map((o) => (
        <div key={o.id} className="card role-order">
          <div className="row">
            <OrderNo id={o.id} />
            <Tag
              tone={
                o.status === 'pending_accept' || o.status === 'refunding'
                  ? 'orange'
                  : o.status === 'refunded'
                    ? 'gray'
                    : 'blue'
              }
            >
              {statusText(o.status)}
            </Tag>
          </div>

          {o.pickupNo ? (
            <div className="pickup-no-banner merchant">
              <span>取餐号</span>
              <strong>{o.pickupNo}</strong>
            </div>
          ) : null}

          <ul className="kitchen-items">
            {o.items.map((i, idx) => (
              <li key={`${o.id}-${i.dishId}-${idx}`}>
                <div className="kitchen-item-main">
                  <span className="kitchen-item-name">{i.name}</span>
                  <span className="kitchen-item-qty">×{i.qty}</span>
                </div>
                {i.spec || i.remark ? (
                  <div className="kitchen-item-meta">
                    {i.spec ? <em>规格：{i.spec}</em> : null}
                    {i.remark ? <span>备注：{i.remark}</span> : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          {o.remark ? <div className="kitchen-order-remark">订单备注：{o.remark}</div> : null}

          {o.refund ? (
            <div className="merchant-refund-box">
              <p>
                <b>退款原因</b> {o.refund.reason}
              </p>
              {o.refund.remark ? (
                <p>
                  <b>备注</b> {o.refund.remark}
                </p>
              ) : null}
              <p>
                <b>申请金额</b> {money(o.refund.amount)} · {o.refund.createdAt}
              </p>
              {o.refund.status === 'rejected' ? (
                <p className="muted">已驳回，订单保持已送达</p>
              ) : null}
              {o.refund.status === 'returned' ? (
                <p className="muted">已退款，款项原路退回用户</p>
              ) : null}
            </div>
          ) : null}

          <div className="merchant-order-meta">
            <p>
              {o.address.district} {o.address.street}
            </p>
            <p>
              {o.address.name} {o.address.phone} · {o.createdAt}
            </p>
          </div>

          <div className="merchant-fee-box">
            <MoneyRow label="餐品金额" value={money(o.dishAmount)} />
            <MoneyRow label="包装费" value={money(o.packingFee)} />
            <MoneyRow label="配送费" value={money(o.deliveryFee)} />
            {o.extraFee > 0 ? <MoneyRow label="附加费" value={money(o.extraFee)} /> : null}
            <MoneyRow label="用户实付" value={money(o.payable)} />
            <MoneyRow label="商家到手" value={money(merchantIncome(o))} strong />
          </div>
          <p className="muted merchant-fee-tip">商家到手 = 餐品 + 包装费，不含配送费</p>
          {o.deliveryProof ? (
            <button
              className="link-btn proof-link"
              type="button"
              onClick={() => setProofSrc(o.deliveryProof!)}
            >
              查看送达凭证 ›
            </button>
          ) : null}
          {o.status === 'pending_accept' ? (
            <div className="role-actions">
              <button
                className="btn ghost"
                type="button"
                onClick={() => {
                  setRejectReason('已售罄')
                  setRejectOther('')
                  setRejectId(o.id)
                }}
              >
                拒单
              </button>
              <button className="btn" type="button" onClick={() => merchantAccept(o.id)}>
                接单备餐
              </button>
            </div>
          ) : null}
          {o.status === 'preparing' ? (
            <div className="role-actions">
              <button className="btn" type="button" onClick={() => merchantReady(o.id)}>
                出餐完成
              </button>
            </div>
          ) : null}
          {o.status === 'ready' ? (
            <p className="merchant-wait-tip">
              {o.rider
                ? `${o.rider.name} · ${o.rider.location}（骑手到店取餐后自动进入配送）`
                : '已出餐，等待骑手到店凭取餐号取餐'}
            </p>
          ) : null}
          {o.status === 'refunding' ? (
            <div className="role-actions">
              <button className="btn ghost" type="button" onClick={() => setRefundRejectId(o.id)}>
                驳回
              </button>
              <button className="btn" type="button" onClick={() => merchantRefundApprove(o.id)}>
                同意退款
              </button>
            </div>
          ) : null}
        </div>
      ))}
      {!list.length ? <Empty text="该状态下暂无订单" /> : null}

      {rejectId ? (
        <div className="role-sheet">
          <div className="role-sheet-card">
            <h3>确认拒单？</h3>
            <p className="muted">拒单后将通知用户并退款，请选择原因</p>
            <div className="field" style={{ marginTop: 12 }}>
              <label>拒单原因</label>
              <select
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value)
                  if (e.target.value !== '其他') setRejectOther('')
                }}
              >
                <option>已售罄</option>
                <option>其他</option>
              </select>
            </div>
            {rejectReason === '其他' ? (
              <div className="field">
                <label>补充说明</label>
                <textarea
                  className="remark-input"
                  rows={3}
                  maxLength={80}
                  placeholder="请填写拒单原因"
                  value={rejectOther}
                  onChange={(e) => setRejectOther(e.target.value)}
                />
              </div>
            ) : null}
            <div className="role-actions" style={{ marginTop: 12 }}>
              <button className="btn ghost" type="button" onClick={() => setRejectId(null)}>
                取消
              </button>
              <button
                className="btn danger"
                type="button"
                onClick={() => {
                  const extra = rejectOther.trim()
                  if (rejectReason === '其他' && !extra) {
                    toast('请填写其他拒单原因')
                    return
                  }
                  merchantReject(rejectId, rejectReason === '其他' ? extra : rejectReason)
                  setRejectId(null)
                }}
              >
                确认拒单
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {refundRejectId ? (
        <div className="role-sheet">
          <div className="role-sheet-card">
            <h3>驳回退款申请？</h3>
            <p className="muted">驳回后订单恢复原履约状态，用户可再次申请或联系客服</p>
            <div className="role-actions" style={{ marginTop: 12 }}>
              <button className="btn ghost" type="button" onClick={() => setRefundRejectId(null)}>
                取消
              </button>
              <button
                className="btn danger"
                type="button"
                onClick={() => {
                  merchantRefundReject(refundRejectId, '证据不足，驳回退款')
                  setRefundRejectId(null)
                }}
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {proofSrc ? (
        <div className="role-sheet" onClick={() => setProofSrc(null)}>
          <div className="role-sheet-card proof-sheet" onClick={(e) => e.stopPropagation()}>
            <h3>骑手送达凭证</h3>
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
