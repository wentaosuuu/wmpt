import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  filterMerchantRevenueByRange,
  merchantAmount,
  merchantRevenueDims,
  rangeForDim,
  sumMerchantRevenue,
  todayMerchantOverview,
  type MerchantRevenueDim,
} from '../../lib/merchantRevenue'
import { MERCHANT_STORE_NAME, merchantStoreOrders } from '../../lib/merchantStore'
import { money } from '../../lib/utils'
import { useApp } from '../../store/AppStore'

const defaultRange = rangeForDim('today')

export function MerchantHomePage() {
  const { orders, user } = useApp()
  const [dim, setDim] = useState<MerchantRevenueDim | 'custom'>('today')
  const [start, setStart] = useState(defaultRange.start)
  const [end, setEnd] = useState(defaultRange.end)

  const mine = useMemo(() => merchantStoreOrders(orders), [orders])

  const pending = mine.filter((o) => o.status === 'pending_accept').length
  const preparing = mine.filter((o) => o.status === 'preparing').length
  const ready = mine.filter((o) => o.status === 'ready').length
  const delivering = mine.filter((o) => ['picked', 'delivering'].includes(o.status)).length
  const refundPending = mine.filter((o) => o.status === 'refunding').length

  const today = useMemo(() => todayMerchantOverview(orders), [orders])

  const rangeError = Boolean(start && end && start > end)

  const rows = useMemo(() => {
    if (rangeError) return []
    return filterMerchantRevenueByRange(orders, start, end)
  }, [orders, start, end, rangeError])

  const total = useMemo(() => sumMerchantRevenue(rows), [rows])

  function applyDim(next: MerchantRevenueDim) {
    const range = rangeForDim(next)
    setDim(next)
    setStart(range.start)
    setEnd(range.end)
  }

  return (
    <section className="page role-page">
      <div className="role-hero merchant compact">
        <div className="mine-avatar">商</div>
        <div>
          <h2>{user?.name ?? '商家'}</h2>
          <p>{MERCHANT_STORE_NAME}</p>
        </div>
      </div>

      <div className="revenue-card merchant">
        <div className="revenue-grid revenue-grid-2">
          <div>
            <b className="price">{money(today.sales)}</b>
            <span>今日营收</span>
          </div>
          <div>
            <b>{today.settledCount}</b>
            <span>今日已完成单</span>
          </div>
        </div>
      </div>

      <div className="role-stats cols-5">
        <Link to="/m/orders?tab=pending_accept">
          <b>{pending}</b>
          <span>待接单</span>
        </Link>
        <Link to="/m/orders?tab=preparing">
          <b>{preparing}</b>
          <span>备餐中</span>
        </Link>
        <Link to="/m/orders?tab=ready">
          <b>{ready}</b>
          <span>待取餐</span>
        </Link>
        <Link to="/m/orders?tab=delivering">
          <b>{delivering}</b>
          <span>配送中</span>
        </Link>
        <Link to="/m/orders?tab=refunding">
          <b>{refundPending}</b>
          <span>退款待审</span>
        </Link>
      </div>

      <div className="role-head rider-income-section-hd">
        <h3>营收明细</h3>
      </div>

      <div className="rider-income-filter">
        <div className="rider-income-tabs">
          {merchantRevenueDims.map((d) => (
            <button
              key={d.id}
              type="button"
              className={dim === d.id ? 'on' : ''}
              onClick={() => applyDim(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="rider-income-range compact">
          <input
            type="datetime-local"
            aria-label="开始时间"
            value={start}
            max={end || undefined}
            onChange={(e) => {
              setStart(e.target.value)
              setDim('custom')
            }}
          />
          <em>至</em>
          <input
            type="datetime-local"
            aria-label="结束时间"
            value={end}
            min={start || undefined}
            onChange={(e) => {
              setEnd(e.target.value)
              setDim('custom')
            }}
          />
        </div>
        {rangeError ? <p className="rider-income-range-error">开始时间不能晚于结束时间</p> : null}
      </div>

      <div className="card rider-income-summary">
        <div>
          <span>营收合计</span>
          <b className="price">{money(total)}</b>
        </div>
        <div>
          <span>完成单量</span>
          <b>{rows.length}</b>
        </div>
      </div>

      {rangeError ? (
        <div className="empty">请调整时间范围后再查询</div>
      ) : !rows.length ? (
        <div className="empty">该时间范围暂无已完成订单</div>
      ) : (
        <div className="bill-list rider-income-list">
          {rows.map((o) => (
            <Link key={o.id} className="bill-row" to={`/order/${o.id}`}>
              <div>
                <strong>{o.id}</strong>
                <p>{o.createdAt}</p>
              </div>
              <span className="bill-row-right">
                <b className="price">+{money(merchantAmount(o))}</b>
                <em>›</em>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
