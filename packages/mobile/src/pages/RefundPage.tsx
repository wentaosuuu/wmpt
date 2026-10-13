import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MoneyRow, NavBar } from '../components/ui'
import { canApplyCancel, canApplyRefund, money, statusText } from '../lib/utils'
import { useApp } from '../store/AppStore'

const cancelReasons = ['计划有变', '点错了', '等待过久', '不想要了']
const refundReasons = ['菜品质量问题', '少餐漏餐', '送达超时', '不想要了']

export function RefundPage() {
  const { id = '' } = useParams()
  const { orders, applyRefund, toast } = useApp()
  const order = orders.find((o) => o.id === id)
  const navigate = useNavigate()
  const isCancel = order ? canApplyCancel(order.status) : false
  const reasons = isCancel ? cancelReasons : refundReasons
  const [reason, setReason] = useState(reasons[0])

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
        <p>
          当前状态：{statusText(order.status)}
          {isCancel
            ? ' · 取消含退款：商家同意后停止履约并全额退回'
            : ' · 售后赔付：履约已完成，仅退款不取消'}
        </p>
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
        <p className="muted">
          {isCancel
            ? '出餐后取消需商家审核。同意后停止配送/取餐并原路退款；驳回后可再申请或联系客服。'
            : '仅支持全额退款。商家同意后按实付原路退回；驳回后可再申请或联系客服。'}
        </p>
      </div>
      <div className="field">
        <label>{isCancel ? '取消原因' : '退款原因'}</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          {reasons.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <button
        className="btn block"
        type="button"
        disabled={!canSubmit}
        onClick={() => {
          applyRefund(order.id, reason)
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
