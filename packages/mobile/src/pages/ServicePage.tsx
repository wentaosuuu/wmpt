import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { NavBar } from '../components/ui'
import { useApp } from '../store/AppStore'
import type { TicketType } from '../types'

const TICKET_TYPES: { id: TicketType; label: string; hint: string }[] = [
  { id: 'consult', label: '咨询', hint: '配送进度、下单支付等一般问题' },
  { id: 'complaint', label: '投诉', hint: '餐品质量、服务态度、超时等' },
]

export function ServicePage() {
  const { id } = useParams()
  const { addTicket, orders, toast } = useApp()
  const order = orders.find((o) => o.id === id)
  const navigate = useNavigate()
  const [type, setType] = useState<TicketType>('consult')
  const [content, setContent] = useState('')

  return (
    <section className="page pad">
      <NavBar title="联系客服" />
      <div className="card">
        <p>服务时间 09:00-21:00</p>
        <p className="muted">提交后可在订单详情查看售后进度与处理结果。</p>
        {order ? (
          <p>关联订单编号 {order.id}</p>
        ) : (
          <p>未关联订单的咨询也会进入客服工单。</p>
        )}
      </div>
      <div className="field">
        <label>工单类型</label>
        <div className="ticket-type-grid">
          {TICKET_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`ticket-type-card ${type === t.id ? 'on' : ''}`}
              onClick={() => setType(t.id)}
            >
              <strong>{t.label}</strong>
              <span>{t.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>问题描述</label>
        <textarea
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请描述配送、餐品或退款问题"
        />
      </div>
      <button
        className="btn block"
        type="button"
        onClick={() => {
          const text = content.trim()
          if (!text) {
            toast('请填写问题描述')
            return
          }
          void addTicket(id, text, type)
          navigate(id ? `/order/${id}` : '/mine')
        }}
      >
        提交
      </button>
    </section>
  )
}
