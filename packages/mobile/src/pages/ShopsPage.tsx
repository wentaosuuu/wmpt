import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CatIcon } from '../components/CatIcon'
import { StoreCover } from '../components/StoreCover'
import { Tag } from '../components/ui'
import { useCuisineCategories } from '../hooks/useCuisineCategories'
import { sortOptions, stores, type StoreSortKey } from '../mock'
import { sortStores } from '../lib/storeFilter'
import { money } from '../lib/utils'
import { useApp } from '../store/AppStore'

export function ShopsPage() {
  const { storeConfigRev } = useApp()
  const { chips } = useCuisineCategories()
  const [keyword, setKeyword] = useState('')
  const [cuisine, setCuisine] = useState('全部')
  const [sort, setSort] = useState<StoreSortKey>('distance')

  useEffect(() => {
    if (chips.length && !chips.some((c) => c.id === cuisine)) {
      setCuisine(chips[0]?.id ?? '全部')
    }
  }, [chips, cuisine])

  const list = useMemo(() => {
    const filtered = stores.filter((s) => {
      if (!s.takeoutEnabled || !s.frontListed) return false
      if (cuisine !== '全部' && s.cuisine !== cuisine) return false
      if (keyword && !s.name.includes(keyword) && !s.cuisine.includes(keyword)) return false
      return true
    })
    return sortStores(filtered, sort)
  }, [keyword, cuisine, sort, storeConfigRev])

  return (
    <section className="page shops-page">
      <header className="page-title-bar">
        <h1>店铺</h1>
      </header>
      <div className="shops-search-row">
        <div className="shops-search">
          <span>⌕</span>
          <input
            placeholder="请输入店铺 / 品类"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className="cat-quick compact">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`cat-quick-item ${cuisine === c.id ? 'on' : ''}`}
            onClick={() => setCuisine(c.id)}
          >
            <span className="cat-quick-icon">
              <CatIcon icon={c.icon} />
            </span>
            <em>{c.label}</em>
          </button>
        ))}
      </div>

      <div className="shops-filters">
        <span className="shops-filter-hint">共 {list.length} 家</span>
      </div>

      <div className="sort-bar shops-sort">
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

      <div className="shop-list">
        {list.map((s) => (
          <Link key={s.id} to={`/store/${s.id}`} className="shop-card">
            <StoreCover className="shop-logo" doorPhoto={s.doorPhoto} cover={s.cover} alt={s.name} />
            <div className="shop-info">
              <div className="shop-top">
                <div>
                  <h3>{s.name}</h3>
                  <p className="shop-branch">
                    {s.cuisine} · {s.hours}
                  </p>
                </div>
                <span className="shop-dist">{Math.round(s.distanceKm * 1000)}m</span>
              </div>
              <div className="shop-meta">
                <Tag tone={s.status === 'open' ? 'green' : 'gray'}>
                  {s.status === 'open' ? '营业中' : '歇业中'}
                </Tag>
                <span>月售 {s.monthlySales}</span>
              </div>
              <div className="shop-fees">
                <span>起送 {money(s.minOrder)}</span>
                <span>预估配送费 {money(s.deliveryFee)}</span>
              </div>
            </div>
          </Link>
        ))}
        {!list.length ? <div className="empty">暂无符合条件的店铺</div> : null}
      </div>
    </section>
  )
}
