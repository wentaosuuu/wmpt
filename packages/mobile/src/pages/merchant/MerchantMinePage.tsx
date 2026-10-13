import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { money } from '../../lib/utils'
import { useApp } from '../../store/AppStore'

export function MerchantMinePage() {
  const { user, orders } = useApp()
  const stats = useMemo(() => {
    const valid = orders.filter(
      (o) => !['pending_pay', 'cancelled', 'rejected'].includes(o.status),
    )
    const settled = orders.filter((o) => o.status === 'delivered')
    const sales = settled.reduce(
      (s, o) => s + o.dishAmount + o.packingFee + o.extraFee,
      0,
    )
    return { count: valid.length, sales, settled: settled.length }
  }, [orders])

  return (
    <section className="page role-page">
      <div className="role-hero merchant compact">
        <div className="mine-avatar">商</div>
        <div>
          <h2>{user?.name} · 商家</h2>
          <p>南门食堂 · 外卖档口</p>
          <p>
            已送达可结 {money(stats.sales)} · {stats.settled} 单
          </p>
        </div>
      </div>
      <div className="card revenue-mini">
        <div>
          <span>有效订单</span>
          <b>{stats.count}</b>
        </div>
        <div>
          <span>已送达营收</span>
          <b className="price">{money(stats.sales)}</b>
        </div>
      </div>
      <div className="card mine-menu">
        <Link className="entry" to="/m">
          <span>经营数据</span>
          <span className="muted">查看今日营收 ›</span>
        </Link>
        <Link className="entry" to="/m/orders">
          <span>订单处理</span>
          <span className="muted">接单 / 出餐 / 待取餐 ›</span>
        </Link>
        <div className="entry">
          <span>营业状态</span>
          <span className="muted">营业中</span>
        </div>
      </div>
    </section>
  )
}
