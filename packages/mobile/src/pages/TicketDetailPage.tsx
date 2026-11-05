import { Link, useParams } from 'react-router-dom'
import { NavBar, Tag } from '../components/ui'
import { ticketStatusLabel, ticketStatusTone, ticketTypeLabel } from '../lib/ticketLabels'
import { useApp } from '../store/AppStore'

export function TicketDetailPage() {
  const { id = '' } = useParams()
  const { tickets, orders, user } = useApp()
  const ticket = tickets.find((t) => t.id === id && (!user?.phone || t.phone === user.phone))
  const order = ticket?.orderId ? orders.find((o) => o.id === ticket.orderId) : undefined

  if (!ticket) {
    return (
      <section className="page pad">
        <NavBar title="工单详情" />
        <div className="empty">工单不存在</div>
      </section>
    )
  }

  return (
    <section className="page pad">
      <NavBar title="工单详情" />

      <div className="card ticket-detail-card">
        <div className="ticket-detail-hd">
          <div className="ticket-detail-tags">
            <Tag tone="blue">{ticketTypeLabel(ticket.type)}</Tag>
            <Tag tone={ticketStatusTone(ticket.status)}>{ticketStatusLabel(ticket.status)}</Tag>
          </div>
          <span className="muted">{ticket.createdAt}</span>
        </div>

        <p className="ticket-detail-content">{ticket.content}</p>

        {ticket.orderId ? (
          <Link className="ticket-detail-order" to={`/order/${ticket.orderId}`}>
            <span>
              订单 {ticket.orderId}
              {order ? (
                <em>
                  {order.storeName} · {order.items.map((i) => `${i.name} x${i.qty}`).join('、')}
                </em>
              ) : null}
            </span>
            <span>›</span>
          </Link>
        ) : null}

        <div className="ticket-detail-reply">
          <strong>客服回复</strong>
          {ticket.status === 'done' && ticket.result ? (
            <p>
              {ticket.result}
              {ticket.handler && ticket.handler !== '-' ? (
                <span className="muted"> · {ticket.handler}</span>
              ) : null}
              {ticket.repliedAt ? <span className="muted"> · {ticket.repliedAt}</span> : null}
            </p>
          ) : (
            <p className="muted">暂无回复</p>
          )}
        </div>
      </div>
    </section>
  )
}
