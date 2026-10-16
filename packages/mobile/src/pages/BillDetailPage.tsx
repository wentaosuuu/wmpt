import { Link, useParams } from 'react-router-dom'
import { MoneyRow, NavBar, OrderNo, Tag } from '../components/ui'
import { money, statusText } from '../lib/utils'
import { useApp } from '../store/AppStore'

function payChannelText(channel?: string) {
  if (channel === 'wechat') return '微信支付'
  if (channel === 'alipay') return '支付宝'
  return '未支付'
}

export function BillDetailPage() {
  const { id = '' } = useParams()
  const { orders } = useApp()
  const order = orders.find((o) => o.id === id)

  if (!order) {
    return (
      <section className="page pad">
        <NavBar title="账单详情" />
        <div className="empty">账单不存在</div>
      </section>
    )
  }

  const isRefunded = order.status === 'refunded' || order.status === 'refunding'
  const payLabel = order.payChannel ? payChannelText(order.payChannel) : '未支付'

  return (
    <section className="page bill-detail-page">
      <NavBar title="账单详情" />

      <div className="card bill-amount-card">
        <p className="muted">外卖消费</p>
        <strong className="bill-amount">-{money(order.payable)}</strong>
        <Tag tone={isRefunded ? 'orange' : order.payChannel ? 'green' : 'gray'}>
          {isRefunded ? statusText(order.status) : order.payChannel ? '支付成功' : statusText(order.status)}
        </Tag>
      </div>

      <div className="card">
        <h4>账单信息</h4>
        <div className="bill-meta">
          <div>
            <span>商户</span>
            <b>{order.storeName}</b>
          </div>
          <div>
            <span>交易时间</span>
            <b>{order.createdAt}</b>
          </div>
          <div>
            <span>支付方式</span>
            <b>{payLabel}</b>
          </div>
          <div>
            <span>订单编号</span>
            <OrderNo id={order.id} className="detail" />
          </div>
          {order.tradeNo ? (
            <div>
              <span>支付流水号</span>
              <b>{order.tradeNo}</b>
            </div>
          ) : null}
          {order.refundTradeNo ? (
            <div>
              <span>退款流水号</span>
              <b>{order.refundTradeNo}</b>
            </div>
          ) : null}
        </div>
      </div>

      <div className="card">
        <h4>消费明细</h4>
        {order.items.map((i) => (
          <div key={`${i.dishId}-${i.spec}`} className="row" style={{ padding: '6px 0' }}>
            <span>
              {i.name}
              {i.spec ? ` ${i.spec}` : ''} ×{i.qty}
            </span>
            <span>{money(i.price * i.qty)}</span>
          </div>
        ))}
        <MoneyRow label="包装费" value={money(order.packingFee)} />
        <MoneyRow label="配送费" value={money(order.deliveryFee)} />
        <MoneyRow label="实付金额" value={money(order.payable)} strong />
      </div>

      {order.refund ? (
        <div className="card">
          <h4>退款信息</h4>
          <p>
            {order.refund.reason} · 退款 {money(order.refund.expected)}
          </p>
          {order.refund.remark ? <p className="muted">备注：{order.refund.remark}</p> : null}
          <Tag tone="orange">
            {order.refund.status === 'pending'
              ? '审核中'
              : order.refund.status === 'returned'
                ? '已退回'
                : order.refund.status}
          </Tag>
        </div>
      ) : null}

      <div className="pad">
        <Link className="btn ghost block" to={`/order/${order.id}`}>
          查看关联订单
        </Link>
      </div>
    </section>
  )
}
