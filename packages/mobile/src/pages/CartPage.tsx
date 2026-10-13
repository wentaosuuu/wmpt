import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty, MoneyRow, Tag } from '../components/ui'
import { cartTotals, findUnavailableCartItems, money } from '../lib/utils'
import { useApp } from '../store/AppStore'

export function CartPage() {
  const { cart, changeQty, clearCart, storeConfigRev } = useApp()
  const navigate = useNavigate()
  const totals = cartTotals(cart)
  const unavailable = useMemo(() => findUnavailableCartItems(cart), [cart, storeConfigRev])
  const blockedKeys = new Set(unavailable.map((i) => i.key))

  if (!cart.length) {
    return (
      <section className="page">
        <Empty text="购物车是空的" to="/shops" action="去逛逛附近门店" />
      </section>
    )
  }

  function goCheckout() {
    if (findUnavailableCartItems(cart).length) {
      navigate('/cart/unavailable')
      return
    }
    navigate('/checkout')
  }

  return (
    <section className="page">
      {unavailable.length ? (
        <button className="card cart-block-banner" type="button" onClick={() => navigate('/cart/unavailable')}>
          <strong>{unavailable.length} 件菜品已下架或售罄</strong>
          <span>点击查看处理方式 ›</span>
        </button>
      ) : null}
      <div className="card">
        <div className="row">
          <h3 style={{ margin: 0 }}>{totals.store?.name}</h3>
          <button className="nav-btn" type="button" onClick={clearCart}>
            清空
          </button>
        </div>
        {cart.map((i) => (
          <div key={i.key} className={`dish ${blockedKeys.has(i.key) ? 'dish-unavailable' : ''}`}>
            <div>
              <h4>
                {i.name}{' '}
                {blockedKeys.has(i.key) ? (
                  <Tag tone="red">{unavailable.find((u) => u.key === i.key)?.reason === 'removed' ? '已下架' : '售罄'}</Tag>
                ) : null}
              </h4>
              <p className="muted">
                {i.spec}
                {i.remark ? ` · ${i.remark}` : ''}
              </p>
              <div className="price">{money(i.price)}</div>
            </div>
            <div className="qty">
              <button type="button" onClick={() => changeQty(i.key, -1)}>
                -
              </button>
              <span>{i.qty}</span>
              <button type="button" onClick={() => changeQty(i.key, 1)} disabled={blockedKeys.has(i.key)}>
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <MoneyRow label="餐品金额" value={money(totals.dishAmount)} />
        <MoneyRow label="包装费" value={money(totals.packingFee)} />
        <MoneyRow label="配送费" value={money(totals.deliveryFee)} />
        {totals.extraFee ? <MoneyRow label="附加费" value={money(totals.extraFee)} /> : null}
        <MoneyRow label="应付金额" value={money(totals.payable)} strong />
      </div>
      <div className="pad">
        <button
          className="btn block"
          type="button"
          disabled={totals.shortfall > 0 && !unavailable.length}
          onClick={goCheckout}
        >
          {unavailable.length
            ? '处理异常菜品'
            : totals.shortfall > 0
              ? `还差${money(totals.shortfall)}起送`
              : '去确认订单'}
        </button>
      </div>
    </section>
  )
}
