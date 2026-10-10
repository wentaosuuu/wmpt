import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DeliveryProofView } from '../components/DeliveryProof'
import { MoneyRow, NavBar, OrderNo, Tag } from '../components/ui'
import { canCancel, cancelPreview, money, statusText } from '../lib/utils'
import { useApp } from '../store/AppStore'

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const { orders, cancelOrder, toast } = useApp()
  const order = orders.find((o) => o.id === id)
  const navigate = useNavigate()
  const [reason, setReason] = useState('计划有变')

  if (!order) {
    return (
      <section className="page">
        <NavBar title="订单详情" />
        <div className="empty">订单不存在</div>
      </section>
    )
  }

  const preview = cancelPreview(order.status, order.payable)
  const showEta = !!order.etaRange && !['delivered', 'cancelled', 'rejected', 'refunded'].includes(order.status)

  return (
    <section className="page">
      <NavBar title="订单详情" />
      <div className="card">
        <h3 style={{ margin: '0 0 8px' }}>{statusText(order.status)}</h3>
        {showEta ? (
          <p className="eta-range-line">
            预计 <strong>{order.etaRange}</strong> 送达
          </p>
        ) : null}
        {order.status === 'delivered' && order.eta ? (
          <p className="muted">实际送达 {order.eta}</p>
        ) : null}
        <OrderNo id={order.id} className="detail" />
        <p className="muted">
          {order.storeName} · {order.createdAt}
        </p>
        {order.rider ? (
          <p>
            骑手 {order.rider.name} {order.rider.phone}
          </p>
        ) : null}
      </div>
      <div className="card">
        {order.items.map((i) => (
          <div key={`${i.dishId}-${i.spec}`} className="row" style={{ padding: '6px 0' }}>
            <span>
              {i.name} {i.spec} x{i.qty}
            </span>
            <span>{money(i.price * i.qty)}</span>
          </div>
        ))}
        <MoneyRow label="包装费" value={money(order.packingFee)} />
        <MoneyRow label="配送费" value={money(order.deliveryFee)} />
        <MoneyRow label="附加费用" value={money(order.extraFee)} />
        <MoneyRow label="实付" value={money(order.payable)} strong />
      </div>
      <div className="card">
        <h4>收货信息</h4>
        <p>
          {order.address.name} {order.address.phone}
        </p>
        <p className="muted">
          {order.address.city} {order.address.district} {order.address.street}{' '}
          {order.address.detail}
        </p>
        <p>备注：{order.remark || '无'}</p>
      </div>
      {order.deliveryProof ? (
        <div className="card">
          <DeliveryProofView src={order.deliveryProof} caption="骑手送达凭证" />
        </div>
      ) : null}
      <div className="card">
        <h4>进度</h4>
        <ul className="timeline">
          {order.timeline.map((t) => (
            <li key={`${t.time}-${t.title}`}>
              <b>
                {t.time} {t.title}
              </b>
              <span className="muted">{t.desc}</span>
            </li>
          ))}
        </ul>
        {['ready', 'picked', 'delivering'].includes(order.status) ? (
          <Link className="btn ghost" to={`/track/${order.id}`} style={{ display: 'inline-block', marginTop: 8 }}>
            查看送达
          </Link>
        ) : null}
      </div>
      {order.refund ? (
        <div className="card">
          <h4>退款进度</h4>
          <p>
            {order.refund.reason} · 预计退回 {money(order.refund.expected)}
          </p>
          <Tag tone="orange">{order.refund.status === 'pending' ? '审核中' : order.refund.status}</Tag>
        </div>
      ) : null}
      <div className="pad" style={{ display: 'grid', gap: 8 }}>
        {order.status === 'pending_pay' ? (
          <button className="btn block" type="button" onClick={() => navigate(`/pay/${order.id}`)}>
            去支付
          </button>
        ) : null}
        {canCancel(order.status) ? (
          <>
            <p className="muted">{preview.tip}</p>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option>计划有变</option>
              <option>点错了</option>
              <option>等待过久</option>
              <option>不想要了</option>
            </select>
            <button
              className="btn danger block"
              type="button"
              onClick={() => {
                cancelOrder(order.id, reason)
                toast(`已取消，预计退回 ${money(preview.expected)}`)
              }}
            >
              申请取消订单
            </button>
          </>
        ) : null}
        {order.status === 'delivered' && !order.refund ? (
          <button className="btn block" type="button" onClick={() => navigate(`/refund/${order.id}`)}>
            申请退款
          </button>
        ) : null}
        <button className="btn ghost block" type="button" onClick={() => navigate(`/service/${order.id}`)}>
          联系客服
        </button>
      </div>
    </section>
  )
}
