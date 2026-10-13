import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { RIDER_NAME } from '../../lib/riderStage'
import { money } from '../../lib/utils'
import { useApp } from '../../store/AppStore'

export function RiderMinePage() {
  const { orders, riderOnline, setRiderOnline, toast } = useApp()
  const stats = useMemo(() => {
    const mine = orders.filter((o) => o.rider?.name === RIDER_NAME)
    const done = mine.filter((o) => o.status === 'delivered')
    const earned = done.reduce((s, o) => s + o.deliveryFee, 0)
    return { done: done.length, earned }
  }, [orders])

  return (
    <section className="page role-page">
      <div className="role-hero rider compact">
        <div className="mine-avatar">骑</div>
        <div>
          <h2>李骑手</h2>
          <p>13900001111</p>
          <p>
            已入账 {money(stats.earned)} · 完成 {stats.done} 单
          </p>
        </div>
      </div>
      <div className="card revenue-mini">
        <div>
          <span>完成单量</span>
          <b>{stats.done}</b>
        </div>
        <div>
          <span>配送费收入</span>
          <b className="price">{money(stats.earned)}</b>
        </div>
      </div>
      <div className="card mine-menu">
        <Link className="entry" to="/r">
          <span>配送数据</span>
          <span className="muted">查看今日收入 ›</span>
        </Link>
        <Link className="entry" to="/r/tasks">
          <span>订单处理</span>
          <span className="muted">接单 / 到店 / 取餐 / 送达 ›</span>
        </Link>
        <button
          className="entry"
          type="button"
          onClick={() => {
            const next = !riderOnline
            setRiderOnline(next)
            toast(next ? '已开始听单' : '已停止听单，无法抢新单')
          }}
        >
          <span>在线状态</span>
          <span className="muted">{riderOnline ? '听单中 · 点按暂停' : '已停止听单 · 点按恢复'}</span>
        </button>
        <div className="entry">
          <span>所属站点</span>
          <span className="muted">园区配送站</span>
        </div>
      </div>
    </section>
  )
}
