import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar } from '../components/ui'
import { findUnavailableCartItems } from '../lib/utils'
import { useApp } from '../store/AppStore'

export function CartUnavailablePage() {
  const { cart, removeCartKeys, storeConfigRev, toast } = useApp()
  const navigate = useNavigate()
  const unavailable = useMemo(() => findUnavailableCartItems(cart), [cart, storeConfigRev])
  const storeId = cart[0]?.storeId

  function backToMenu() {
    const keys = unavailable.map((i) => i.key)
    if (keys.length) removeCartKeys(keys)
    toast(keys.length ? '已清除下架菜品，请重新选购' : '请继续选购')
    navigate(storeId ? `/store/${storeId}` : '/shops', { replace: true })
  }

  if (!unavailable.length) {
    return (
      <section className="page cart-unavailable-page">
        <NavBar title="菜品异常" />
        <div className="card cart-unavailable-hero">
          <div className="cart-unavailable-icon ok" aria-hidden>
            ✓
          </div>
          <h3>菜品均可下单</h3>
          <p className="muted">当前购物车没有下架或售罄的菜品。</p>
        </div>
        <div className="pad">
          <button className="btn block" type="button" onClick={() => navigate('/checkout', { replace: true })}>
            返回确认订单
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="page cart-unavailable-page">
      <NavBar title="无法继续下单" />

      <div className="card cart-unavailable-hero">
        <div className="cart-unavailable-icon" aria-hidden>
          !
        </div>
        <h3>有菜品已下架或售罄</h3>
        <p className="muted">以下菜品已无法购买，需返回门店重新选餐。</p>
      </div>

      <div className="card">
        <div className="card-label">已下架菜品（{unavailable.length}）</div>
        <ul className="cart-unavailable-names">
          {unavailable.map((item) => (
            <li key={item.key}>{item.name}</li>
          ))}
        </ul>
      </div>

      <div className="pad">
        <button className="btn block" type="button" onClick={backToMenu}>
          返回选餐
        </button>
        <p className="muted cart-unavailable-tip">点击后将自动清除已下架菜品</p>
      </div>
    </section>
  )
}
