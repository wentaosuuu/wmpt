import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { OrderStatusGuide } from '../components/OrderStatusGuide'
import { Empty, OrderNo, Tag } from '../components/ui'
import { money, statusText } from '../lib/utils'
import { useApp } from '../store/AppStore'

const tabs = [
  { id: 'all', label: '全部' },
  { id: 'pending_pay', label: '待付款' },
  { id: 'ing', label: '进行中' },
  { id: 'done', label: '已完成' },
]

export function OrdersPage() {
  const { orders } = useApp()
  const [tab, setTab] = useState('all')
  const [kw, setKw] = useState('')
  const [showGuide, setShowGuide] = useState(false)

  const list = useMemo(() => {
    return orders.filter((o) => {
      if (tab === 'pending_pay' && o.status !== 'pending_pay') return false
      if (
        tab === 'ing' &&
        !['pending_accept', 'preparing', 'ready', 'picked', 'delivering', 'refunding'].includes(o.status)
      ) {
        return false
      }
      if (tab === 'done' && !['delivered', 'cancelled', 'refunded', 'rejected'].includes(o.status)) {
        return false
      }
      if (kw && !o.storeName.includes(kw) && !o.id.includes(kw)) return false
      return true
    })
  }, [orders, tab, kw])

  return (
    <section className="page orders-page">
      <header className="page-title-bar orders-title-bar">
        <h1>订单记录</h1>
        <button className="orders-guide-btn" type="button" onClick={() => setShowGuide(true)}>
          状态说明
        </button>
      </header>
      <div className="seg underline">
        {tabs.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} type="button" onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="orders-search">
        <input placeholder="搜索门店 / 订单号" value={kw} onChange={(e) => setKw(e.target.value)} />
      </div>
      {list.map((o) => (
        <Link key={o.id} to={`/order/${o.id}`} className="order-card">
          <div className="order-card-hd">
            <strong>{o.storeName}</strong>
            <Tag
              tone={
                o.status === 'delivering' || o.status === 'picked'
                  ? 'blue'
                  : o.status === 'delivered'
                    ? 'green'
                    : o.status === 'pending_pay'
                      ? 'orange'
                      : 'gray'
              }
            >
              {statusText(o.status)}
            </Tag>
          </div>
          <OrderNo id={o.id} />
          <p className="order-items">{o.items.map((i) => `${i.name} x${i.qty}`).join('、')}</p>
          <div className="order-card-ft">
            <span>{o.createdAt}</span>
            <b>{money(o.payable)}</b>
          </div>
          <div className="order-actions">
            {o.status === 'pending_pay' ? <span className="ghost-btn">去支付</span> : null}
            {['picked', 'delivering'].includes(o.status) ? <span className="ghost-btn">查看配送</span> : null}
            {o.status === 'delivered' ? <span className="ghost-btn">再来一单</span> : null}
          </div>
        </Link>
      ))}
      {!list.length ? <Empty text="暂无消费订单记录~" to="/shops" action="去点外卖" /> : null}
      {showGuide ? <OrderStatusGuide onClose={() => setShowGuide(false)} /> : null}
    </section>
  )
}
