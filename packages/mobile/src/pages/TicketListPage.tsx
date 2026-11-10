import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Empty, NavBar, Tag } from '../components/ui'
import { ticketStatusLabel, ticketStatusTone, ticketTypeLabel } from '../lib/ticketLabels'
import { useApp } from '../store/AppStore'

const tabs = [
  { id: 'processing', label: '待处理' },
  { id: 'all', label: '全部' },
] as const

export function TicketListPage() {
  const { tickets, user } = useApp()
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('processing')

  const list = useMemo(() => {
    const phone = user?.phone || ''
    return tickets
      .filter((t) => !phone || t.phone === phone)
      .filter((t) => (tab === 'processing' ? t.status === 'open' : true))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [tickets, user, tab])

  return (
    <section className="page aftersale-page">
      <NavBar title="我的工单" />
      <div className="seg underline aftersale-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'on' : ''}
            type="button"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {list.map((t) => (
        <Link key={t.id} className="aftersale-card" to={`/tickets/${t.id}`}>
          <div className="aftersale-card-hd">
            <strong>{ticketTypeLabel(t.type)}</strong>
            <Tag tone={ticketStatusTone(t.status)}>{ticketStatusLabel(t.status)}</Tag>
          </div>
          <p className="aftersale-store">{t.content}</p>
          <div className="aftersale-card-ft">
            <span>{t.orderId ? `订单 ${t.orderId}` : '未关联订单'}</span>
            <span>{t.createdAt}</span>
          </div>
        </Link>
      ))}
      {!list.length ? (
        <Empty text={tab === 'processing' ? '暂无待处理工单' : '暂无客服工单'} />
      ) : null}
    </section>
  )
}
