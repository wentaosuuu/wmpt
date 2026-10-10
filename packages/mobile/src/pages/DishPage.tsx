import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { NavBar, Tag } from '../components/ui'
import { dishById, money, storeById } from '../lib/utils'
import { useApp } from '../store/AppStore'

export function DishPage() {
  const { id = '' } = useParams()
  const dish = dishById(id)
  const store = dish ? storeById(dish.storeId) : undefined
  const { addToCart } = useApp()
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
    <section className="page">
      <NavBar title="菜品详情" />
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{dish.name}</h3>
        <p className="muted">{dish.description}</p>
        <p className="price">{money(dish.price + extra)}</p>
        <Tag tone="gray">订单包装费 {money(store.orderPackingFee)}</Tag>
        <Tag tone="gray">{dish.utensils}</Tag>
      </div>
      <div className="card">
        <h4>规格</h4>
        <div className="specs">
          {dish.specs.map((s) => (
            <button key={s.name} className={`spec ${spec === s.name ? 'on' : ''}`} type="button" onClick={() => setSpec(s.name)}>
              {s.name}
              {s.extra ? ` +${money(s.extra)}` : ''}
            </button>
          ))}
        </div>
      </div>
      {dish.remarks.length ? (
        <div className="card">
          <h4>备注</h4>
          <div className="specs">
            {dish.remarks.map((r) => (
              <button key={r} className={`spec ${remark === r ? 'on' : ''}`} type="button" onClick={() => setRemark(r)}>
                {r}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="pad">
        <button
          className="btn block"
          type="button"
          disabled={dish.soldOut || store.status === 'closed'}
          onClick={() => {
            addToCart({
              storeId: dish.storeId,
              dishId: dish.id,
              name: dish.name,
              spec,
              remark,
              price: dish.price + extra,
              packingFee: 0,
            })
            navigate(`/store/${dish.storeId}`)
          }}
        >
          加入购物车
        </button>
      </div>
    </section>
  )
}
