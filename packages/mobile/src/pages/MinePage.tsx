import { Link } from 'react-router-dom'
import { useApp } from '../store/AppStore'

export function MinePage() {
  const { user, orders, addresses } = useApp()
  const refunding = orders.filter((o) => o.status === 'refunding').length
  const addr = addresses.find((a) => a.isDefault) ?? addresses[0]

  return (
    <section className="page mine-page">
      <div className="mine-hero">
        <div className="mine-avatar">{user?.name?.slice(0, 1) ?? '用'}</div>
        <div>
          <h2>{user?.name}</h2>
          <p>{user?.phone}</p>
          <p>{addr ? `${addr.district} · ${addr.street}` : user?.campus}</p>
        </div>
      </div>

      <div className="mine-stats">
        <Link to="/orders">
          <b>{orders.length}</b>
          <span>全部订单</span>
        </Link>
        <Link to="/service">
          <b>{refunding}</b>
          <span>售后处理中</span>
        </Link>
        <Link to="/address">
          <b>{addresses.length}</b>
          <span>收货地址</span>
        </Link>
      </div>

      <div className="card mine-menu">
        <Link className="entry" to="/orders">
          <span>我的订单</span>
          <span className="muted">{orders.length} 笔 ›</span>
        </Link>
        <Link className="entry" to="/bills">
          <span>我的账单</span>
          <span className="muted">餐饮消费 ›</span>
        </Link>
        <Link className="entry" to="/address">
          <span>收货地址</span>
          <span className="muted">行政区划校验 ›</span>
        </Link>
        <Link className="entry" to="/service">
          <span>联系客服</span>
          <span className="muted">{refunding ? `${refunding} 笔售后中 ›` : '09:00-21:00 ›'}</span>
        </Link>
        <Link className="entry" to="/privacy">
          <span>隐私说明</span>
          <span className="muted">查看 ›</span>
        </Link>
      </div>
    </section>
  )
}
