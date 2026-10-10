import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { NavBar } from '../components/ui'
import { useApp } from '../store/AppStore'

export function ServicePage() {
  const { id } = useParams()
  const { addTicket, orders } = useApp()
  const order = orders.find((o) => o.id === id)
  const navigate = useNavigate()
  const [content, setContent] = useState('')

  return (
    <section className="page pad">
      <NavBar title="联系客服" />
      <div className="card">
        <p>服务时间 09:00-21:00</p>
        <p className="muted">提交后可在订单详情查看售后进度与处理结果。</p>
        {order ? (
          <p>
            关联订单编号 {order.id}
          </p>
        ) : (
          <p>未关联订单的咨询也会进入客服工单。</p>
        )}
      </div>
      <div className="field">
        <label>问题描述</label>
        <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="请描述配送、餐品或退款问题" />
      </div>
      <button
        className="btn block"
        type="button"
        onClick={() => {
          addTicket(id, content || '用户发起客服咨询')
          navigate(id ? `/order/${id}` : '/mine')
        }}
      >
        提交
      </button>
    </section>
  )
}
