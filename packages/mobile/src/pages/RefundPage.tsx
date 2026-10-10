import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MoneyRow, NavBar } from '../components/ui'
import { money } from '../lib/utils'
import { useApp } from '../store/AppStore'

const reasons = ['菜品质量问题', '少餐漏餐', '送达超时', '不想要了']

export function RefundPage() {
  const { id = '' } = useParams()
  const { orders, applyRefund, toast } = useApp()
  const order = orders.find((o) => o.id === id)
  const navigate = useNavigate()
  const [reason, setReason] = useState(reasons[0])

  if (!order) {
    return (
      <section className="page">
        <NavBar title="申请退款" />
        <div className="empty">订单不存在</div>
      </section>
    )
  }

  return (
    <section className="page pad">
      <NavBar title="申请退款" />
      <div className="card">
        <p>全额退款明细</p>
        {order.items.map((i) => (
          <div key={i.dishId} className="row">
            <span>
              {i.name} x{i.qty}
            </span>
            <span>{money(i.price * i.qty)}</span>
          </div>
        ))}
        <MoneyRow label="包装费" value={money(order.packingFee)} />
        <MoneyRow label="配送费" value={money(order.deliveryFee)} />
        {order.extraFee > 0 ? <MoneyRow label="附加费" value={money(order.extraFee)} /> : null}
        <MoneyRow label="全额退款金额" value={money(order.payable)} strong />
        <p className="muted">仅支持全额退款，审核通过后按实付金额原路退回，包含餐品、包装费、配送费及已付附加费。</p>
      </div>
      <div className="field">
        <label>退款原因</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          {reasons.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <button
        className="btn block"
        type="button"
        disabled={order.status !== 'delivered' || !!order.refund}
        onClick={() => {
          applyRefund(order.id, reason)
          toast('已提交，预计 1 个工作日内审核')
          navigate(`/order/${order.id}`)
        }}
      >
        {order.refund ? '已提交退款申请' : order.status !== 'delivered' ? '当前订单不可申请退款' : '申请全额退款'}
      </button>
    </section>
  )
}
