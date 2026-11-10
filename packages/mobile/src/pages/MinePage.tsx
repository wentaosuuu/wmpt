import { Link } from 'react-router-dom'
import { useApp } from '../store/AppStore'

export function MinePage() {
  const { user, orders, addresses, tickets } = useApp()
  const openTickets = tickets.filter(
    (t) => t.status === 'open' && (!user?.phone || t.phone === user.phone),
  ).length

  return (
    <section className="page mine-page">
      <div className="mine-hero">
        <div className="mine-avatar">{user?.name?.slice(0, 1) ?? '用'}</div>
        <div>
          <h2>{user?.name}</h2>
          <p>{user?.phone}</p>
        </div>
      </div>

      <div className="mine-stats">
        <Link to="/orders">
          <b>{orders.length}</b>
          <span>全部订单</span>
        </Link>
        <Link to="/tickets">
          <b>{openTickets}</b>
          <span>售后处理中</span>
        </Link>
        <Link to="/address">
          <b>{addresses.length}</b>
          <span>收货地址</span>
        </Link>
      </div>

      <div className="card mine-menu">
        <Link className="entry" to="/bills">
          <span>我的账单</span>
          <span className="muted">餐饮消费 ›</span>
        </Link>
        <Link className="entry" to="/tickets">
          <span>我的工单</span>
          <span className="muted">{openTickets ? `${openTickets} 待处理 ›` : '›'}</span>
        </Link>
        <Link className="entry" to="/service">
          <span>联系客服</span>
          <span className="muted">›</span>
        </Link>
      </div>
    </section>
  )
}
