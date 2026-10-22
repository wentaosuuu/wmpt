import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DeliveryProofView } from '../components/DeliveryProof'
import { OrderStatusGuide } from '../components/OrderStatusGuide'
import { MoneyRow, NavBar, OrderNo, Tag } from '../components/ui'
import {
  canApplyCancel,
  canApplyRefund,
  canCancel,
  cancelPreview,
  cancelRuleRows,
  fulfillmentStatusOrder,
  money,
  statusHint,
  statusText,
} from '../lib/utils'
import { useApp } from '../store/AppStore'

function ruleCellClass(value: string) {
  if (value === '可直接取消' || value === '可申请' || value === '自动退款' || value === '已完成') {
    return 'ok'
  }
  if (value === '不可取消' || value === '不可申请') return 'no'
  if (value === '审核中') return 'pending'
  return undefined
}

function reviewCellClass(value: string) {
  if (value === '是') return 'review-yes'
  if (value === '否') return 'review-no'
  return undefined
}

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const { orders, cancelOrder, toast, role } = useApp()
  const order = orders.find((o) => o.id === id)
  const navigate = useNavigate()
  const [reason, setReason] = useState('计划有变')
  const [showCancelRules, setShowCancelRules] = useState(false)
  const [showStatusGuide, setShowStatusGuide] = useState(false)
  /** 取消/退款/客服仅消费者端展示 */
  const isConsumer = role === 'consumer'

  if (!order) {
    return (
      <section className="page">
        <NavBar title="订单详情" />
        <div className="empty">订单不存在</div>
      </section>
    )
  }

  const preview = cancelPreview(order.status, order.payable)

  return (
    <section className="page">
      <NavBar title="订单详情" />
      <div className="card">
        <div className="order-status-head">
          <h3 style={{ margin: 0 }}>{statusText(order.status)}</h3>
          <button className="orders-guide-btn" type="button" onClick={() => setShowStatusGuide(true)}>
            状态说明
          </button>
        </div>
        {statusHint(order.status) ? <p className="order-status-hint">{statusHint(order.status)}</p> : null}
        {(fulfillmentStatusOrder as readonly string[]).includes(order.status) ? (
          <ol className="status-rail" aria-label="履约进度">
            {fulfillmentStatusOrder.map((id) => {
              const current = (fulfillmentStatusOrder as readonly string[]).indexOf(order.status)
              const index = (fulfillmentStatusOrder as readonly string[]).indexOf(id)
              const cls = index < current ? 'done' : index === current ? 'on' : ''
              return (
                <li key={id} className={cls}>
                  {statusText(id)}
                </li>
              )
            })}
          </ol>
        ) : null}
        {order.status === 'delivered' && order.eta ? (
          <p className="muted">实际送达 {order.eta}</p>
        ) : null}
        <OrderNo id={order.id} className="detail" />
        {order.tradeNo ? <p className="muted">流水号 {order.tradeNo}</p> : null}
        {order.refundTradeNo ? <p className="muted">退款流水号 {order.refundTradeNo}</p> : null}
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
      {isConsumer && order.refund ? (
        <div className="card">
          <h4>退款进度</h4>
          <p>
            {order.refund.reason} · 预计退回 {money(order.refund.expected)}
          </p>
          {order.refund.remark ? <p className="muted">备注：{order.refund.remark}</p> : null}
          <Tag
            tone={
              order.refund.status === 'pending'
                ? 'orange'
                : order.refund.status === 'rejected'
                  ? 'red'
                  : 'green'
            }
          >
            {order.refund.status === 'pending'
              ? '商家审核中'
              : order.refund.status === 'rejected'
                ? '已驳回'
                : order.refund.status === 'returned'
                  ? '已退款'
                  : order.refund.status}
          </Tag>
        </div>
      ) : null}
      {isConsumer ? (
      <div className="pad" style={{ display: 'grid', gap: 8 }}>
        <button className="cancel-rule-entry" type="button" onClick={() => setShowCancelRules(true)}>
          取消与退款规则
          <span>了解各阶段如何处理 ›</span>
        </button>
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
              取消订单
            </button>
          </>
        ) : null}
        {canApplyRefund(order.status) && (!order.refund || order.refund.status === 'rejected') ? (
          <>
            <p className="muted">{preview.tip}</p>
            <button
              className="btn danger block"
              type="button"
              onClick={() => navigate(`/refund/${order.id}`)}
            >
              {canApplyCancel(order.status) ? '申请取消' : '申请退款'}
            </button>
          </>
        ) : null}
        {order.status === 'refunding' ? (
          <p className="muted">申请审核中，商家处理中；如有异议可联系客服。</p>
        ) : null}
        {order.refund?.status === 'rejected' ? (
          <p className="muted">商家已驳回申请，可再次申请或联系客服处理。</p>
        ) : null}
        <button className="btn ghost block" type="button" onClick={() => navigate(`/service/${order.id}`)}>
          联系客服
        </button>
      </div>
      ) : null}

      {showStatusGuide ? <OrderStatusGuide onClose={() => setShowStatusGuide(false)} /> : null}

      {isConsumer && showCancelRules ? (
        <div className="role-sheet" onClick={() => setShowCancelRules(false)}>
          <div className="role-sheet-card cancel-rule-sheet" onClick={(e) => e.stopPropagation()}>
            <h3>取消与退款规则</h3>
            <p className="muted cancel-rule-lead">
              出餐前可直接取消（已付则自动退款）；出餐后至送达前申请取消即含退款；送达后仅可申请售后退款。需审核的由商家处理，有异议可联系客服。
            </p>
            <div className="cancel-rule-table-wrap">
              <table className="cancel-rule-table">
                <thead>
                  <tr>
                    <th>订单状态</th>
                    <th>取消订单</th>
                    <th>申请退款</th>
                    <th>
                      是否需
                      <br />
                      商家审核
                    </th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  {cancelRuleRows.map((row) => (
                    <tr key={row.status}>
                      <td>{row.status}</td>
                      <td className={ruleCellClass(row.cancel)}>{row.cancel}</td>
                      <td className={ruleCellClass(row.refund)}>{row.refund}</td>
                      <td className={reviewCellClass(row.review)}>{row.review}</td>
                      <td>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="role-actions" style={{ marginTop: 16 }}>
              <button className="btn block" type="button" onClick={() => setShowCancelRules(false)}>
                我知道了
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
