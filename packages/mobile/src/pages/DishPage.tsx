import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DishCover } from '../components/DishCover'
import { NavBar, Tag } from '../components/ui'
import { dishById, money, storeById } from '../lib/utils'
import { useApp } from '../store/AppStore'

export function DishPage() {
  const { id = '' } = useParams()
  const dish = dishById(id)
  const store = dish ? storeById(dish.storeId) : undefined
  const { addToCart, storeConfigRev } = useApp()
  void storeConfigRev
  const navigate = useNavigate()
  const [spec, setSpec] = useState(dish?.specs[0]?.name ?? '')
  const [remark, setRemark] = useState('')
  const extra = dish?.specs.find((s) => s.name === spec)?.extra ?? 0

  if (!dish || !store) {
    return (
      <section className="page">
        <NavBar title="菜品" />
        <div className="empty">菜品不存在</div>
      </section>
    )
  }

  return (
    <section className="page dish-page">
      <NavBar title="菜品详情" />
      <div className="dish-page-body">
        <div className="card dish-detail-card">
          <DishCover
            className="dish-detail-cover"
            photo={dish.photo}
            cover={dish.cover}
            alt={dish.name}
          />
          <div className="dish-detail-meta">
            <h3>{dish.name}</h3>
            <p className="muted">{dish.description}</p>
            <div className="dish-detail-price-row">
              <span className="price">{money(dish.price + extra)}</span>
              <Tag tone="gray">订单包装费 {money(store.orderPackingFee)}</Tag>
            </div>
          </div>
        </div>
        <div className="card dish-option-card">
          <h4>规格</h4>
          <div className="specs">
            {dish.specs.map((s) => (
              <button
                key={s.name}
                className={`spec ${spec === s.name ? 'on' : ''}`}
                type="button"
                onClick={() => setSpec(s.name)}
              >
                {s.name}
                {s.extra ? ` +${money(s.extra)}` : ''}
              </button>
            ))}
          </div>
          {!dish.specs.length ? <p className="muted">暂无可选规格</p> : null}
        </div>
        <div className="card dish-option-card">
          <h4>备注</h4>
          <textarea
            className="remark-input"
            rows={2}
            maxLength={80}
            placeholder="选填，如少油、不要香菜、去冰等"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>
      </div>
      <div className="dish-page-footer">
        <button
          className="btn block"
          type="button"
          disabled={dish.soldOut || store.status === 'closed' || !spec}
          onClick={() => {
            addToCart({
              storeId: dish.storeId,
              dishId: dish.id,
              name: dish.name,
              spec,
              remark: remark.trim(),
              price: dish.price + extra,
              packingFee: 0,
            })
            navigate(`/store/${dish.storeId}`)
          }}
        >
          {dish.soldOut ? '已售罄' : store.status === 'closed' ? '门店歇业中' : '加入购物车'}
        </button>
      </div>
    </section>
  )
}
