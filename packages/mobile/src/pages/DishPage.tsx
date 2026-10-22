import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DishCover } from '../components/DishCover'
import { NavBar } from '../components/ui'
import {
  defaultSelection,
  selectionExtra,
  selectionLabel,
  selectionValid,
  toggleOption,
  type SpecSelection,
} from '../lib/specGroups'
import { dishById, money, storeById } from '../lib/utils'
import { useApp } from '../store/AppStore'

export function DishPage() {
  const { id = '' } = useParams()
  const dish = dishById(id)
  const store = dish ? storeById(dish.storeId) : undefined
  const { addToCart, storeConfigRev } = useApp()
  void storeConfigRev
  const navigate = useNavigate()
  const groups = dish?.specGroups ?? []
  const [sel, setSel] = useState<SpecSelection>(() => defaultSelection(groups))

  useEffect(() => {
    setSel(defaultSelection(groups))
  }, [id])

  const extra = selectionExtra(groups, sel)
  const canAdd = selectionValid(groups, sel)

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
            </div>
          </div>
        </div>
        {groups.map((g) => {
          const picked = sel[g.id] ?? []
          return (
            <div key={g.id} className="card dish-option-card">
              <div className="spec-group-title">
                <h4>{g.name}</h4>
                <span className="spec-group-hint">
                  {g.mode === 'single' ? '单选' : '多选'}
                  {g.required ? ' · 必选' : ' · 可选'}
                </span>
              </div>
              <div className="specs">
                {g.options.map((o) => {
                  const on = picked.includes(o.id)
                  return (
                    <button
                      key={o.id}
                      className={`spec ${on ? 'on' : ''}`}
                      type="button"
                      onClick={() => setSel((prev) => toggleOption(groups, prev, g.id, o.id))}
                    >
                      {o.name}
                      {o.extra ? ` +${money(o.extra)}` : ''}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        {!groups.length ? (
          <div className="card dish-option-card">
            <p className="muted">暂无可选规格</p>
          </div>
        ) : null}
      </div>
      <div className="dish-page-footer">
        <button
          className="btn block"
          type="button"
          disabled={dish.soldOut || store.status === 'closed' || !canAdd}
          onClick={() => {
            addToCart({
              storeId: dish.storeId,
              dishId: dish.id,
              name: dish.name,
              spec: selectionLabel(groups, sel),
              remark: '',
              price: dish.price + extra,
              packingFee: 0,
            })
            navigate(`/store/${dish.storeId}`)
          }}
        >
          {dish.soldOut
            ? '已售罄'
            : store.status === 'closed'
              ? '门店歇业中'
              : !canAdd
                ? '请完成必选规格'
                : '加入购物车'}
        </button>
      </div>
    </section>
  )
}
