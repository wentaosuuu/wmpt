import { useNavigate } from 'react-router-dom'
import { Empty, MoneyRow } from '../components/ui'
import { cartTotals, money } from '../lib/utils'
import { useApp } from '../store/AppStore'

export function CartPage() {
  const { cart, changeQty, clearCart } = useApp()
  const navigate = useNavigate()
  const totals = cartTotals(cart)

  if (!cart.length) {
    return (
      <section className="page">
        <Empty text="购物车是空的" to="/shops" action="去逛逛附近门店" />
      </section>
    )
  }

  return (
    <section className="page">
      <div className="card">
        <div className="row">
          <h3 style={{ margin: 0 }}>{totals.store?.name}</h3>
          <button className="nav-btn" type="button" onClick={clearCart}>
            清空
          </button>
        </div>
        {cart.map((i) => (
          <div key={i.key} className="dish">
            <div>
              <h4>{i.name}</h4>
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
              <button type="button" onClick={() => changeQty(i.key, 1)}>
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
        <button className="btn block" type="button" disabled={totals.shortfall > 0} onClick={() => navigate('/checkout')}>
          {totals.shortfall > 0 ? `还差${money(totals.shortfall)}起送` : '去确认订单'}
        </button>
      </div>
    </section>
  )
}
