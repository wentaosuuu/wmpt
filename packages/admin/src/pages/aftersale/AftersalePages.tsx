import { useMemo, useState } from 'react'
import { DescList, Field, Modal, PageHeader, Panel, StatusTag, Toolbar } from '../../components/ui'
import { useOptionalStoreFilter } from '../../hooks/useStoreFilter'
import { useAdmin } from '../../store/AdminStore'
import type { AdminOrder, Ticket } from '../../types'

export function RefundPage() {
  const { orders, updateOrder, notify } = useAdmin()
  const { stores, storeId, setStoreId, matchStore } = useOptionalStoreFilter()
  const [kw, setKw] = useState('')
  const list = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === 'refund_review' &&
          matchStore(o.storeId) &&
          (o.id.includes(kw) ||
            o.user.includes(kw) ||
            o.phone.includes(kw) ||
            o.storeName.includes(kw) ||
            (o.refundReason ?? '').includes(kw) ||
            (o.note ?? '').includes(kw)),
      ),
    [orders, kw, storeId, matchStore],
  )
  const [current, setCurrent] = useState<AdminOrder | null>(null)
  const [mode, setMode] = useState<'approve' | 'reject' | null>(null)
  const [remark, setRemark] = useState('')

  return (
    <>
      <PageHeader title="退款审核" desc="仅支持全额退款，审核通过后按订单实付金额原路退回。" />
      <Panel>
        <Toolbar>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            <option value="all">全部门店</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            placeholder="订单号 / 门店 / 用户 / 手机号 / 原因"
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>门店</th>
                <th>用户</th>
                <th>原因</th>
                <th>申请金额</th>
                <th>说明</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.storeName}</td>
                  <td>
                    {o.user}
                    <span className="sub">{o.phone}</span>
                  </td>
                  <td>{o.refundReason}</td>
                  <td>¥{o.amount.toFixed(2)}</td>
                  <td>{o.note}</td>
                  <td className="ops">
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => {
                        setCurrent(o)
                        setRemark('同意按实付金额全额退款')
                        setMode('approve')
                      }}
                    >
                      通过
                    </button>
                    <button
                      className="link-btn danger"
                      type="button"
                      onClick={() => {
                        setCurrent(o)
                        setRemark('证据不足，驳回退款')
                        setMode('reject')
                      }}
                    >
                      驳回
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-block">暂无退款待审</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={!!mode && !!current}
        title={mode === 'approve' ? '退款审核通过' : '驳回退款申请'}
        width={560}
        onClose={() => setMode(null)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setMode(null)}>
              取消
            </button>
            <button
              className={mode === 'approve' ? 'btn' : 'btn danger'}
              type="button"
              onClick={() => {
                if (!current || !mode) return
                if (mode === 'approve') {
                  updateOrder(current.id, {
                    status: 'refunded',
                    refundAmount: current.amount,
                    note: `全额退款 ¥${current.amount.toFixed(2)}，包含全部已付费用；${remark}`,
                  })
                  notify(`已全额退款 ¥${current.amount.toFixed(2)}`)
                } else {
                  updateOrder(current.id, { status: 'delivered', note: `退款驳回：${remark}` })
                  notify('已驳回退款')
                }
                setMode(null)
              }}
            >
              确认提交
            </button>
          </>
        }
      >
        <DescList
          items={[
            { label: '订单号', value: current?.id },
            { label: '门店', value: current?.storeName },
            { label: '原因', value: current?.refundReason },
            { label: '申请金额', value: current ? `¥${current.amount.toFixed(2)}` : '-' },
          ]}
        />
        {mode === 'approve' ? (
          <p>全额退回餐品、包装费、配送费及其他已付费用，不支持分项或部分退款。</p>
        ) : null}
        <Field label="审核意见">
          <textarea value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Field>
      </Modal>
    </>
  )
}

export function TicketsPage() {
  const { tickets, updateTicket, notify } = useAdmin()
  const [kw, setKw] = useState('')
  const list = useMemo(
    () =>
      tickets.filter(
        (t) =>
          t.id.includes(kw) ||
          t.user.includes(kw) ||
          t.content.includes(kw) ||
          t.handler.includes(kw),
      ),
    [tickets, kw],
  )
  const [current, setCurrent] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')

  return (
    <>
      <PageHeader title="客服工单" desc="受理咨询与投诉，记录受理人、过程与结果。" />
      <Panel>
        <Toolbar>
          <input
            placeholder="工单号 / 用户 / 内容 / 受理人"
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>工单号</th>
                <th>类型</th>
                <th>用户</th>
                <th>内容</th>
                <th>受理人</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.type === 'consult' ? '咨询' : '投诉'}</td>
                  <td>{t.user}</td>
                  <td>{t.content}</td>
                  <td>{t.handler}</td>
                  <td>
                    <StatusTag tone={t.status === 'done' ? 'success' : 'info'}>
                      {t.status === 'done' ? '已结单' : t.status === 'processing' ? '处理中' : '待受理'}
                    </StatusTag>
                  </td>
                  <td className="ops">
                    <button
                      className="link-btn"
                      type="button"
                      disabled={t.status === 'done'}
                      onClick={() => {
                        setCurrent(t)
                        setReply(t.result || '已协调处理，请留意订单状态')
                      }}
                    >
                      回复结单
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Modal
        open={!!current}
        title="回复并结单"
        onClose={() => setCurrent(null)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setCurrent(null)}>
              取消
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!current) return
                updateTicket(current.id, {
                  status: 'done',
                  handler: '客服-小梁',
                  result: reply,
                })
                notify('工单已回复并结单')
                setCurrent(null)
              }}
            >
              确认结单
            </button>
          </>
        }
      >
        <DescList
          items={[
            { label: '工单', value: current?.id },
            { label: '内容', value: current?.content },
          ]}
        />
        <Field label="回复内容">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} />
        </Field>
      </Modal>
    </>
  )
}
