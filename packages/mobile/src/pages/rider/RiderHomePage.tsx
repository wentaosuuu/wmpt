import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  filterRiderIncome,
  filterRiderIncomeByRange,
  rangeForDim,
  riderIncomeDims,
  sumDeliveryFee,
  type RiderIncomeDim,
} from '../../lib/riderIncome'
import { RIDER_NAME } from '../../lib/riderStage'
import { money } from '../../lib/utils'
import { useApp } from '../../store/AppStore'

const RIDER_PHONE = '13900001111'

const defaultRange = rangeForDim('today')

export function RiderHomePage() {
  const { orders } = useApp()
  const [dim, setDim] = useState<RiderIncomeDim | 'custom'>('today')
  const [start, setStart] = useState(defaultRange.start)
  const [end, setEnd] = useState(defaultRange.end)

  const todayIncome = useMemo(() => {
    const rows = filterRiderIncome(orders, 'today')
    return { count: rows.length, earned: sumDeliveryFee(rows) }
  }, [orders])

  const rangeError = Boolean(start && end && start > end)

  const rows = useMemo(() => {
    if (rangeError) return []
    return filterRiderIncomeByRange(orders, start, end)
  }, [orders, start, end, rangeError])

  const total = useMemo(() => sumDeliveryFee(rows), [rows])

  function applyDim(next: RiderIncomeDim) {
    const range = rangeForDim(next)
    setDim(next)
    setStart(range.start)
    setEnd(range.end)
  }

  return (
    <section className="page role-page">
      <div className="role-hero rider compact">
        <div className="mine-avatar">骑</div>
        <div>
          <h2>{RIDER_NAME}</h2>
          <p>{RIDER_PHONE}</p>
        </div>
      </div>

      <div className="revenue-card rider">
        <div className="revenue-grid revenue-grid-2">
          <div>
            <b>{todayIncome.count}</b>
            <span>今日完成单量</span>
          </div>
          <div>
            <b className="price">{money(todayIncome.earned)}</b>
            <span>今日配送费收入</span>
          </div>
        </div>
      </div>

      <div className="role-head rider-income-section-hd">
        <h3>配送费收入</h3>
      </div>

      <div className="rider-income-filter">
        <div className="rider-income-tabs">
          {riderIncomeDims.map((d) => (
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
          <span>配送费合计</span>
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
        <div className="empty">该时间范围暂无已完成配送</div>
      ) : (
        <div className="bill-list rider-income-list">
          {rows.map((o) => (
            <Link key={o.id} className="bill-row" to={`/order/${o.id}`}>
              <div>
                <strong>{o.storeName}</strong>
                <p>
                  {o.id} · {o.createdAt}
                </p>
              </div>
              <span className="bill-row-right">
                <b className="price">+{money(o.deliveryFee)}</b>
                <em>›</em>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
