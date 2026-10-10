import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { money } from '../../lib/utils'
import { useApp } from '../../store/AppStore'

/** 商家侧有效营收：餐品+包装+附加（不含配送费） */
function merchantAmount(o: { dishAmount: number; packingFee: number; extraFee: number }) {
  return o.dishAmount + o.packingFee + o.extraFee
}

export function MerchantHomePage() {
  const { orders } = useApp()
  const pending = orders.filter((o) => o.status === 'pending_accept').length
  const preparing = orders.filter((o) => o.status === 'preparing').length
  const ready = orders.filter((o) => o.status === 'ready').length
  const refundPending = orders.filter((o) => o.status === 'refunding').length

  const revenue = useMemo(() => {
    const valid = orders.filter(
      (o) => !['pending_pay', 'cancelled', 'rejected'].includes(o.status),
    )
    const settled = orders.filter((o) => o.status === 'delivered')
    const todaySales = valid.reduce((s, o) => s + merchantAmount(o), 0)
    const settledAmt = settled.reduce((s, o) => s + merchantAmount(o), 0)
    const refunding = orders
      .filter((o) => o.status === 'refunding' || o.status === 'refunded')
      .reduce((s, o) => s + (o.refund?.amount ?? 0), 0)
    return {
      todaySales,
      orderCount: valid.length,
      settledAmt,
      settledCount: settled.length,
      refunding,
      avg: valid.length ? todaySales / valid.length : 0,
    }
  }, [orders])

  return (
    <section className="page role-page">
      <div className="role-hero merchant">
        <p>商家数据</p>
        <h2>南门食堂 · 外卖档口</h2>
        <span>今日经营概览 · 营收与订单量</span>
      </div>

      <div className="revenue-card merchant">
        <div className="revenue-main">
          <span>今日营收（餐品+包装）</span>
          <strong>{money(revenue.todaySales)}</strong>
          <em>
            有效 {revenue.orderCount} 单 · 客单均 {money(revenue.avg)}
          </em>
        </div>
        <div className="revenue-grid">
          <div>
            <b>{money(revenue.settledAmt)}</b>
            <span>已送达可结</span>
          </div>
          <div>
            <b>{revenue.settledCount}</b>
            <span>已完成单</span>
          </div>
          <div>
            <b>{money(revenue.refunding)}</b>
            <span>退款占用</span>
          </div>
        </div>
      </div>

      <div className="role-stats">
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
        <Link to="/m/orders?tab=refunding">
          <b>{refundPending}</b>
          <span>退款待审</span>
        </Link>
      </div>

      <div className="card">
        <Link className="entry" to="/m/orders">
          <span>订单处理</span>
          <span className="muted">接单 / 出餐 / 退款 ›</span>
        </Link>
        {refundPending ? (
          <Link className="entry" to="/m/orders?tab=refunding">
            <span>退款审核</span>
            <span className="muted">{refundPending} 笔待处理 ›</span>
          </Link>
        ) : null}
      </div>
    </section>
  )
}
