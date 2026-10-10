import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MoneyRow, NavBar } from '../components/ui'
import { cartTotals, money } from '../lib/utils'
import { useApp } from '../store/AppStore'

export function CheckoutPage() {
  const { cart, addresses, createOrder, toast } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const pickedId = (location.state as { addressId?: string } | null)?.addressId
  const address = addresses.find((a) => a.id === pickedId) ?? addresses.find((a) => a.isDefault) ?? addresses[0]
  const [remark, setRemark] = useState('')
  const totals = useMemo(() => cartTotals(cart), [cart])

  if (!cart.length) {
    return (
      <section className="page">
        <NavBar title="提交订单" />
        <div className="empty">购物车已空</div>
      </section>
    )
  }

  return (
    <section className="page checkout-page">
      <NavBar title="提交订单" />

      <button className="card address-card" type="button" onClick={() => navigate('/address?pick=1')}>
        {address ? (
          <>
            <div className="address-card-hd">
              <strong>
                {address.name} {address.phone}
              </strong>
              <span>更换 ›</span>
            </div>
            <p>
              {address.city} {address.district} {address.street} {address.detail}
            </p>
            {!address.inRange ? (
              <em className="warn-inline">该地址超出配送范围</em>
            ) : (
              <em>外卖配送 · 预计 {totals.store?.etaMin ?? 35} 分钟送达</em>
            )}
          </>
        ) : (
          <p>请先新增收货地址 ›</p>
        )}
      </button>

      <div className="card store-mini">
        <div className="store-mini-logo">{totals.store?.cover}</div>
        <div>
          <strong>{totals.store?.name}</strong>
          <p>{totals.store?.address}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-label">订单列表</div>
        {cart.map((i) => (
          <div key={i.key} className="checkout-item">
            <div className="checkout-thumb">🍽</div>
            <div className="checkout-item-main">
              <strong>{i.name}</strong>
              <span>
                {i.spec} · {i.qty} 份
              </span>
            </div>
            <b>{money(i.price * i.qty)}</b>
          </div>
        ))}
        <div className="checkout-sum">合计 {money(totals.dishAmount)}</div>
      </div>

      <div className="card">
        <div className="field">
          <label>订单备注</label>
          <input
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="如：送到西门岗亭电话联系"
          />
        </div>
        <MoneyRow label="餐品" value={money(totals.dishAmount)} />
        <MoneyRow label="包装费" value={money(totals.packingFee)} />
        <MoneyRow label="配送费" value={money(totals.deliveryFee)} />
        {totals.extraFee > 0 ? (
          <MoneyRow label="附加费" value={money(totals.extraFee)} />
        ) : null}
        <MoneyRow label="应付金额" value={money(totals.payable)} strong />
      </div>

      <div className="bottom-submit">
        <button
          className="btn block"
          type="button"
          disabled={totals.shortfall > 0}
          onClick={() => {
            if (!address) {
              toast('请选择收货地址')
              return
            }
            const order = createOrder(address, remark)
            if (order) navigate(`/pay/${order.id}`)
          }}
        >
          {totals.shortfall > 0 ? `还差${money(totals.shortfall)}起送` : '提交订单'}
        </button>
      </div>
    </section>
  )
}
