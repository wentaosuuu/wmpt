import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui'
import { useAdmin } from '../store/AdminStore'

export function DashboardPage() {
  const { orders, merchants, tickets, applications } = useAdmin()
  const pending = orders.filter((o) => o.status === 'pending_accept').length
  const delivery = orders.filter((o) =>
    ['ready', 'dispatching', 'delivering', 'dispatch_fail'].includes(o.status),
  ).length
  const after =
    orders.filter((o) => o.status === 'cancel_review').length +
    tickets.filter((t) => t.status !== 'done').length
  const applyPending = applications.filter((a) => a.status === 'pending').length
  const stores = merchants.filter((m) => m.takeout).length

  return (
    <>
      <PageHeader title="工作台" desc="聚焦外卖主流程待办：入驻、接单、配送、售后。" />
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">入驻待审</div>
          <div className="value">{applyPending}</div>
          <div className="hint">
            <Link to="/merchants/audit">去审核</Link>
          </div>
        </div>
        <div className="stat-card">
          <div className="label">待接外卖单</div>
          <div className="value">{pending}</div>
          <div className="hint">
            <Link to="/orders">去处理</Link>
          </div>
        </div>
        <div className="stat-card">
          <div className="label">配送中 / 待发</div>
          <div className="value">{delivery}</div>
          <div className="hint">
            <Link to="/delivery/exception">去处理</Link>
          </div>
        </div>
        <div className="stat-card">
          <div className="label">售后待处理</div>
          <div className="value">{after}</div>
          <div className="hint">
            <Link to="/aftersale/tickets">去处理</Link>
          </div>
        </div>
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#86909c' }}>
        外卖开通 {stores} 家 · 移动端上架{' '}
        {merchants.filter((m) => m.frontListed).length} 家
      </p>
    </>
  )
}
