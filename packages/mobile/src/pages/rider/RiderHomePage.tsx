import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { money } from '../../lib/utils'
import { useApp } from '../../store/AppStore'
import type { Order } from '../../types'

function isMine(o: Order) {
  return o.rider?.name === '李骑手'
}

export function RiderHomePage() {
  const { orders } = useApp()

  const pool = orders.filter((o) => ['preparing', 'ready'].includes(o.status) && !o.rider).length
  const mine = orders.filter(
    (o) => isMine(o) && ['preparing', 'ready', 'picked', 'delivering'].includes(o.status),
  )
  const waiting = mine.filter((o) => o.status !== 'delivering').length
  const delivering = mine.filter((o) => o.status === 'delivering').length

  const income = useMemo(() => {
    const mineAll = orders.filter(isMine)
    const done = mineAll.filter((o) => o.status === 'delivered')
    const doing = mineAll.filter((o) =>
      ['preparing', 'ready', 'picked', 'delivering'].includes(o.status),
    )
    const earned = done.reduce((s, o) => s + o.deliveryFee, 0)
    const pending = doing.reduce((s, o) => s + o.deliveryFee, 0)
    return {
      earned,
      pending,
      total: earned + pending,
      doneCount: done.length,
      doingCount: doing.length,
      avg: done.length ? earned / done.length : 0,
    }
  }, [orders])

  return (
    <section className="page role-page">
      <div className="role-hero rider">
        <p>骑手数据</p>
        <h2>李骑手</h2>
        <span>今日配送收入与单量概览</span>
      </div>

      <div className="revenue-card rider">
        <div className="revenue-main">
          <span>今日收入（配送费）</span>
          <strong>{money(income.earned)}</strong>
          <em>
            已完成 {income.doneCount} 单 · 单均 {money(income.avg)}
          </em>
        </div>
        <div className="revenue-grid">
          <div>
            <b>{money(income.pending)}</b>
            <span>进行中预估</span>
          </div>
          <div>
            <b>{money(income.total)}</b>
            <span>今日合计</span>
          </div>
          <div>
            <b>{income.doingCount}</b>
            <span>进行中单</span>
          </div>
        </div>
      </div>

      <div className="role-stats cols-3">
        <Link to="/r/tasks?tab=pool">
          <b>{pool}</b>
          <span>可接单</span>
        </Link>
        <Link to="/r/tasks?tab=doing">
          <b>{waiting}</b>
          <span>待取/待送</span>
        </Link>
        <Link to="/r/tasks?tab=doing">
          <b>{delivering}</b>
          <span>配送中</span>
        </Link>
      </div>

      <div className="card">
        <Link className="entry" to="/r/tasks">
          <span>订单处理</span>
          <span className="muted">接单 / 取餐 / 送达 ›</span>
        </Link>
      </div>
    </section>
  )
}
