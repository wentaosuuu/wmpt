import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DishCover } from '../components/DishCover'
import { StoreCover } from '../components/StoreCover'
import { NavBar, QtyStepper, Tag } from '../components/ui'
import { dishes } from '../mock'
import { minimumOrderShortfall, money, storeById } from '../lib/utils'
import { useApp } from '../store/AppStore'

export function StorePage() {
  const { id = '' } = useParams()
  const store = storeById(id)
  const navigate = useNavigate()
  const { cart, changeQty, storeConfigRev } = useApp()
  const list = useMemo(() => dishes.filter((d) => d.storeId === id), [id])
  void storeConfigRev
  const cats = useMemo(() => Array.from(new Set(list.map((d) => d.category))), [list])
  const [cat, setCat] = useState(cats[0] ?? '')
  const [cartOpen, setCartOpen] = useState(false)
  const activeCat = cats.includes(cat) ? cat : cats[0]
  const shown = list.filter((d) => d.category === activeCat)
  const storeCart = cart.filter((i) => i.storeId === id)
  const qty = storeCart.reduce((s, i) => s + i.qty, 0)
  const amount = storeCart.reduce((s, i) => s + i.price * i.qty, 0)
  const catCount = (name: string) =>
    storeCart
      .filter((i) => list.find((d) => d.id === i.dishId)?.category === name)
      .reduce((s, i) => s + i.qty, 0)

  if (!store) {
    return (
      <section className="page">
        <NavBar title="店铺详情" />
        <div className="empty">门店不存在</div>
      </section>
    )
  }

  const closed = store.status === 'closed'
  const shortfall = minimumOrderShortfall(store.id, amount)

  function toggleCart() {
    if (!qty) return
    setCartOpen((v) => !v)
  }

  function clearStoreCart() {
    storeCart.forEach((i) => changeQty(i.key, -i.qty))
    setCartOpen(false)
  }

  return (
    <section className="page store-page">
      <NavBar title="店铺详情" />
      <div className="store-hero">
        <div className="store-hero-text">
          <h2>{store.name}</h2>
          <div className="store-hero-tags">
            <Tag tone={closed ? 'gray' : 'green'}>{closed ? '歇业中' : '营业中'}</Tag>
            {store.tags.slice(0, 2).map((t) => (
              <Tag key={t} tone="gray">
                {t}
              </Tag>
            ))}
          </div>
          <p>月售 {store.monthlySales}</p>
          <p>
            起送 {money(store.minOrder)} · 配送 {money(store.deliveryFee)} · 包装{' '}
            {money(store.orderPackingFee)}/单
            {store.extraFees.map((f) => ` · ${f.name}${money(f.amount)}`).join('')}
          </p>
          <p className="muted">地址：{store.address}</p>
          <p className="muted">电话：{store.phone}</p>
        </div>
        <StoreCover
          className="store-hero-logo"
          doorPhoto={store.doorPhoto}
          cover={store.cover}
          alt={store.name}
        />
      </div>

      <div className="menu-split">
        <aside className="menu-cats">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              className={activeCat === c ? 'on' : ''}
              onClick={() => setCat(c)}
            >
              {c}
              {catCount(c) ? <i>{catCount(c)}</i> : null}
            </button>
          ))}
        </aside>
        <div className="menu-dishes">
          <h3>{activeCat}</h3>
          {shown.map((d) => (
            <div key={d.id} className="menu-dish">
              <DishCover
                className="menu-dish-cover"
                photo={d.photo}
                cover={d.cover}
                alt={d.name}
              />
              <div className="menu-dish-body">
                <Link to={`/dish/${d.id}`}>
                  <h4>{d.name}</h4>
                </Link>
                <p>{d.description}</p>
                <div className="menu-dish-foot">
                  <b>{money(d.price)}</b>
                  {d.soldOut ? (
                    <Tag tone="gray">售罄</Tag>
                  ) : (
                    <Link
                      to={`/dish/${d.id}`}
                      className={`menu-spec-btn ${closed ? 'disabled' : ''}`}
                      onClick={(e) => {
                        if (closed) e.preventDefault()
                      }}
                    >
                      选规格
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {cartOpen && qty ? (
        <button
          className="cart-sheet-mask"
          type="button"
          aria-label="关闭已选商品"
          onClick={() => setCartOpen(false)}
        />
      ) : null}

      <div className="cart-dock">
        {cartOpen && qty ? (
          <div className="cart-sheet">
            <div className="cart-sheet-head">
              <h3>已选商品</h3>
              <button className="nav-btn" type="button" onClick={clearStoreCart}>
                清空
              </button>
            </div>
            <div className="cart-sheet-list">
              {storeCart.map((i) => (
                <div key={i.key} className="cart-sheet-item">
                  <div className="cart-sheet-item-info">
                    <h4>{i.name}</h4>
                    <p>
                      {i.spec}
                      {i.remark ? ` · ${i.remark}` : ''}
                    </p>
                    <b className="price">{money(i.price)}</b>
                  </div>
                  <QtyStepper
                    value={i.qty}
                    disabled={closed}
                    onMinus={() => changeQty(i.key, -1)}
                    onPlus={() => changeQty(i.key, 1)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="cart-bar">
          <div className="cart-bar-left">
            <button
              className={`cart-bubble ${qty ? 'on' : ''}`}
              type="button"
              aria-label="查看已选商品"
              onClick={toggleCart}
            >
              🛒{qty ? <i>{qty}</i> : null}
            </button>
            <div>
              {qty ? (
                <>
                  <b className="price">{money(amount)}</b>
                  <p>含订单包装费 {money(store.orderPackingFee)}</p>
                </>
              ) : (
                <p>未选购商品</p>
              )}
            </div>
          </div>
          <button
            className="btn cart-bar-btn"
            type="button"
            disabled={!qty || closed || shortfall > 0}
            onClick={() => navigate('/checkout')}
          >
            {closed
              ? '歇业中'
              : !qty
                ? `${money(store.minOrder)}起送`
                : shortfall > 0
                  ? `还差${money(shortfall)}起送`
                  : '去结算'}
          </button>
        </div>
      </div>
    </section>
  )
}
