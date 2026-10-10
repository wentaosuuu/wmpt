import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NavBar } from '../components/ui'
import { money } from '../lib/utils'
import { useApp } from '../store/AppStore'

export function BillsPage() {
  const { orders } = useApp()
  const [tab, setTab] = useState<'delivery' | 'canteen'>('delivery')
  const [month, setMonth] = useState('2026-09')

  const rows = useMemo(() => {
    if (tab !== 'delivery') return []
    return orders.filter((o) => o.createdAt.startsWith(month))
  }, [orders, tab, month])

  return (
    <section className="page bills-page">
      <NavBar title="我的账单" />
      <div className="seg underline">
        <button className={tab === 'delivery' ? 'on' : ''} type="button" onClick={() => setTab('delivery')}>
          外卖消费账单
        </button>
        <button className={tab === 'canteen' ? 'on' : ''} type="button" onClick={() => setTab('canteen')}>
          食堂消费账单
        </button>
      </div>
      <div className="bills-toolbar">
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="2026-09">2026-09</option>
          <option value="2026-08">2026-08</option>
        </select>
      </div>
      {tab === 'canteen' || !rows.length ? (
        <div className="empty">暂无数据</div>
      ) : (
        <div className="bill-list">
          {rows.map((o) => (
            <Link key={o.id} className="bill-row" to={`/bills/${o.id}`}>
              <div>
                <strong>{o.storeName}</strong>
                <p>{o.createdAt}</p>
              </div>
              <span className="bill-row-right">
                <b className="price">-{money(o.payable)}</b>
                <em>›</em>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
