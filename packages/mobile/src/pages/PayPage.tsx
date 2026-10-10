import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { NavBar, OrderNo } from '../components/ui'
import { minimumOrderShortfall, money } from '../lib/utils'
import { useApp } from '../store/AppStore'
import type { PayChannel } from '../types'

export function PayPage() {
  const { id = '' } = useParams()
  const { orders, payOrder, toast } = useApp()
  const order = orders.find((o) => o.id === id)
  const navigate = useNavigate()
  const [channel, setChannel] = useState<PayChannel>('wechat')
  const [left, setLeft] = useState(15 * 60)

  useEffect(() => {
    const t = window.setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000)
    return () => window.clearInterval(t)
  }, [])

  if (!order) {
    return (
      <section className="page">
        <NavBar title="支付订单" />
        <div className="empty">订单不存在</div>
      </section>
    )
  }

  const shortfall = minimumOrderShortfall(order.storeId, order.dishAmount)
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')

  return (
    <section className="page pay-page">
      <NavBar title="支付订单" />
      <p className="pay-timer">订单剩余支付时间：{mm}:{ss}</p>

      <div className="card pay-amount-card">
        <OrderNo id={order.id} />
        <span>订单金额</span>
        <strong>{money(order.payable)}</strong>
        <Link to={`/order/${order.id}`}>查看订单详情 ›</Link>
      </div>

      <div className="card pay-methods">
        <button
          type="button"
          className={`pay-method clickable ${channel === 'wechat' ? 'on' : ''}`}
          onClick={() => {
            setChannel('wechat')
          }}
        >
          <div className="pay-method-left">
            <span className="pay-badge wechat">微</span>
            <div>
              <strong>微信支付</strong>
              <p>推荐</p>
            </div>
          </div>
          <span className="radio" />
        </button>
        <button
          type="button"
          className={`pay-method clickable ${channel === 'alipay' ? 'on' : ''}`}
          onClick={() => {
            setChannel('alipay')
          }}
        >
          <div className="pay-method-left">
            <span className="pay-badge alipay">支</span>
            <div>
              <strong>支付宝</strong>
              <p>企业收款通道</p>
            </div>
          </div>
          <span className="radio" />
        </button>
      </div>

      <div className="bottom-submit">
        <button
          className="btn block"
          type="button"
          disabled={order.status !== 'pending_pay' || shortfall > 0}
          onClick={() => {
            payOrder(order.id, channel)
            toast('支付成功，等待商家接单')
            navigate(`/order/${order.id}`)
          }}
        >
          {shortfall > 0 ? `未达起送价，还差${money(shortfall)}` : '确认支付'}
        </button>
      </div>
    </section>
  )
}
