import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MoneyRow, NavBar } from '../components/ui'
import { canApplyCancel, canApplyRefund, money } from '../lib/utils'
import { useApp } from '../store/AppStore'

const cancelReasons = ['计划有变', '点错了', '等待过久', '不想要了']
const refundReasons = ['菜品质量问题', '少餐漏餐', '送达超时', '不想要了', '其他']

export function RefundPage() {
  const { id = '' } = useParams()
  const { orders, applyRefund, toast } = useApp()
  const order = orders.find((o) => o.id === id)
  const navigate = useNavigate()
  const isCancel = order ? canApplyCancel(order.status) : false
  const reasons = isCancel ? cancelReasons : refundReasons
  const [reason, setReason] = useState(reasons[0])
  const [note, setNote] = useState('')

  if (!order) {
    return (
      <section className="page">
        <NavBar title="申请取消" />
        <div className="empty">订单不存在</div>
      </section>
    )
  }

  const canSubmit = canApplyRefund(order.status) && (!order.refund || order.refund.status === 'rejected')
  const title = isCancel ? '申请取消' : '申请退款'

  return (
    <section className="page pad">
      <NavBar title={title} />
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
      </div>
      <div className="field">
        <label>{isCancel ? '取消原因' : '退款原因'}</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          {reasons.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>备注</label>
        <textarea
          className="remark-input"
          rows={3}
          maxLength={80}
          placeholder="选填，补充说明方便商家处理"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <button
        className="btn block"
        type="button"
        disabled={!canSubmit}
        onClick={() => {
          applyRefund(order.id, reason, note)
          toast('已提交，等待商家审核')
          navigate(`/order/${order.id}`)
        }}
      >
        {!canSubmit
          ? order.refund?.status === 'pending'
            ? '审核中'
            : '当前不可申请'
          : isCancel
            ? '提交取消申请'
            : '申请全额退款'}
      </button>
    </section>
  )
}
