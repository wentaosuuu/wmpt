import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui'
import { useAdmin } from '../store/AdminStore'
import type { AdminOrderStatus } from '../types'

function countBy(orders: { status: AdminOrderStatus }[], statuses: AdminOrderStatus[]) {
  const set = new Set(statuses)
  return orders.filter((o) => set.has(o.status)).length
}

export function DashboardPage() {
  const { orders, merchants, tickets, applications } = useAdmin()

  const cards = [
    {
      label: '入驻待审',
      value: applications.filter((a) => a.status === 'pending').length,
      hint: <Link to="/merchants/audit">去审核</Link>,
    },
    {
      label: '待接单',
      value: countBy(orders, ['pending_accept']),
      hint: <Link to="/orders">去处理</Link>,
    },
    {
      label: '备餐中',
      value: countBy(orders, ['preparing']),
      hint: <Link to="/orders">去查看</Link>,
    },
    {
      label: '待配送',
      value: countBy(orders, ['ready', 'dispatching', 'picked']),
      hint: <Link to="/orders">去查看</Link>,
    },
    {
      label: '配送中',
      value: countBy(orders, ['delivering']),
      hint: <Link to="/orders">去查看</Link>,
    },
    {
      label: '取消待审',
      value: countBy(orders, ['cancel_review']),
      hint: <Link to="/orders/cancel">去审核</Link>,
    },
    {
      label: '退款待审',
      value: countBy(orders, ['refund_review']),
      hint: <Link to="/orders">去处理</Link>,
    },
    {
      label: '客服工单',
      value: tickets.filter((t) => t.status !== 'done').length,
      hint: <Link to="/aftersale/tickets">去处理</Link>,
    },
  ]

  return (
    <>
      <PageHeader title="工作台" desc="按订单细粒度状态汇总待办：入驻、接单、备餐、配送、取消与退款。" />
      <div className="stat-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="label">{c.label}</div>
            <div className="value">{c.value}</div>
            <div className="hint">{c.hint}</div>
          </div>
        ))}
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#86909c' }}>
        移动端上架 {merchants.filter((m) => m.frontListed).length} 家
      </p>
    </>
  )
}
