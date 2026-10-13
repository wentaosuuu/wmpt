import { useParams } from 'react-router-dom'
import { DeliveryProofView } from '../components/DeliveryProof'
import { NavBar, OrderNo } from '../components/ui'
import { useApp } from '../store/AppStore'

export function TrackPage() {
  const { id = '' } = useParams()
  const { orders } = useApp()
  const order = orders.find((o) => o.id === id)

  if (!order) {
    return (
      <section className="page">
        <NavBar title="查看送达" />
        <div className="empty">订单不存在</div>
      </section>
    )
  }

  return (
    <section className="page">
      <NavBar title="查看送达" />
      <div className="hero">
        <p>{order.status === 'delivered' ? '实际送达' : '配送进度'}</p>
        <h2>
          {order.status === 'delivered'
            ? order.eta ?? '已送达'
            : order.rider
              ? order.rider.location
              : '等待骑手接单'}
        </h2>
        <span>
          {order.status === 'delivered'
            ? '订单已完成'
            : order.rider
              ? `骑手 ${order.rider.name}`
              : '商家出餐后开始配送'}
        </span>
      </div>
      <div className="card">
        <OrderNo id={order.id} />
      </div>
      <div className="card">
        <h4>交付位置</h4>
        <p>
          {order.address.city} {order.address.district} {order.address.street}
        </p>
        <p className="muted">{order.address.detail}</p>
      </div>
      {order.deliveryProof ? (
        <div className="card">
          <DeliveryProofView src={order.deliveryProof} caption="骑手送达凭证" />
        </div>
      ) : null}
      <div className="card">
        <h4>配送轨迹</h4>
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
      </div>
    </section>
  )
}
