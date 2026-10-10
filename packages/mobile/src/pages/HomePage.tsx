import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoryChips, sortOptions, stores, type StoreSortKey } from '../mock'
import { sortStores } from '../lib/storeFilter'
import { money } from '../lib/utils'
import { useApp } from '../store/AppStore'

export function HomePage() {
  const { user, orders, addresses } = useApp()
  const [cuisine, setCuisine] = useState('全部')
  const [sort, setSort] = useState<StoreSortKey>('default')
  const addr = addresses.find((a) => a.isDefault) ?? addresses[0]
  const pending = orders.filter((o) =>
    ['pending_pay', 'pending_accept', 'preparing', 'ready', 'picked', 'delivering'].includes(o.status),
  ).length

  const list = useMemo(() => {
    const filtered = stores.filter((s) => {
      if (!s.takeoutEnabled || !s.deliverable) return false
      if (cuisine !== '全部' && s.cuisine !== cuisine) return false
      return true
    })
    return sortStores(filtered, sort)
  }, [cuisine, sort])

  return (
    <section className="page home-page">
      <div className="home-top">
        <header className="home-nav">
          <h1>云宝宝外卖</h1>
        </header>
        <div className="home-banner">
          <div>
            <p className="banner-kicker">园区外卖专场</p>
            <h2>乐享好食光</h2>
            <p>附近门店配送 · 微信 / 支付宝支付</p>
          </div>
          <div className="banner-visual" aria-hidden>
            🍱
          </div>
        </div>
      </div>

      <div className="user-card">
        <div className="user-card-main">
          <div className="user-avatar">{user?.name?.slice(0, 1) ?? '用'}</div>
          <div>
            <strong>{user?.name}</strong>
            <p>{addr ? `${addr.district} · ${addr.street}` : user?.campus}</p>
          </div>
        </div>
        <div className="user-balance">
          <b>{pending} 笔</b>
          <Link to="/orders">进行中订单 ›</Link>
        </div>
        <div className="user-actions">
          <Link to="/bills" className="user-action">
            <i>📑</i>
            <span>账单</span>
          </Link>
          <Link to="/address" className="user-action">
            <i>📍</i>
            <span>地址</span>
          </Link>
          <Link to="/orders" className="user-action">
            <i>🧾</i>
            <span>订单{pending ? `(${pending})` : ''}</span>
          </Link>
        </div>
      </div>

      <div className="cat-quick">
        {categoryChips.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`cat-quick-item ${cuisine === c.id ? 'on' : ''}`}
            onClick={() => setCuisine(c.id)}
          >
            <span className="cat-quick-icon">{c.icon}</span>
            <em>{c.label}</em>
          </button>
        ))}
      </div>

      <div className="section-hd home-feed-hd">
        <h3>{cuisine === '全部' ? '为你推荐' : `${cuisine}好店`}</h3>
        <span className="feed-count">{list.length} 家</span>
      </div>

      <div className="sort-bar">
        {sortOptions.map((s) => (
          <button
            key={s.id}
            type="button"
            className={sort === s.id ? 'on' : ''}
            onClick={() => setSort(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="home-feed">
        {list.map((s) => (
          <Link key={s.id} to={`/store/${s.id}`} className="feed-card">
            <div className="feed-cover">{s.cover}</div>
            <div className="feed-body">
              <div className="feed-title">
                <h4>{s.name}</h4>
                <em>{Math.round(s.distanceKm * 1000)}m</em>
              </div>
              <p>
                ★ {s.rating} · 月售 {s.monthlySales} · 约 {s.etaMin} 分钟
              </p>
              <div className="feed-tags">
                <span>{s.cuisine}</span>
                <span>起送 {money(s.minOrder)}</span>
                <span>配送 {money(s.deliveryFee)}</span>
                {s.tags.slice(0, 2).map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
        {!list.length ? <div className="empty">该品类暂无可配送门店</div> : null}
      </div>
    </section>
  )
}
