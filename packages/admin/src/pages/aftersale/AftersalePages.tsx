import { useMemo, useState } from 'react'
import { DescList, Field, Modal, PageHeader, Panel, StatusTag, Toolbar } from '../../components/ui'
import { useAdmin } from '../../store/AdminStore'
import type { Ticket } from '../../types'

function nowLabel() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
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
          t.phone.includes(kw) ||
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
            placeholder="工单号 / 用户 / 手机号 / 内容 / 受理人"
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
                <th>手机号</th>
                <th>内容</th>
                <th>受理人</th>
                <th>状态</th>
                <th>回复时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.type === 'consult' ? '咨询' : '投诉'}</td>
                  <td>{t.user}</td>
                  <td className="nowrap">{t.phone || '-'}</td>
                  <td>{t.content}</td>
                  <td>{t.handler}</td>
                  <td>
                    <StatusTag tone={t.status === 'done' ? 'success' : 'info'}>
                      {t.status === 'done' ? '已完结' : '待处理'}
                    </StatusTag>
                  </td>
                  <td className="nowrap">{t.repliedAt || '-'}</td>
                  <td className="ops">
                    {t.status === 'done' ? (
                      <button
                        className="link-btn"
                        type="button"
                        onClick={() => {
                          setCurrent(t)
                          setReply(t.result || '')
                        }}
                      >
                        查看结果
                      </button>
                    ) : (
                      <button
                        className="link-btn"
                        type="button"
                        onClick={() => {
                          setCurrent(t)
                          setReply(t.result || '已协调处理，请留意订单状态')
                        }}
                      >
                        回复完结
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Modal
        open={!!current}
        title={current?.status === 'done' ? '工单结果' : '回复并完结'}
        onClose={() => setCurrent(null)}
        footer={
          current?.status === 'done' ? (
            <button className="btn" type="button" onClick={() => setCurrent(null)}>
              关闭
            </button>
          ) : (
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
                    repliedAt: nowLabel(),
                  })
                  notify('工单已回复并完结')
                  setCurrent(null)
                }}
              >
                确认完结
              </button>
            </>
          )
        }
      >
        <DescList
          items={[
            { label: '工单', value: current?.id },
            { label: '类型', value: current?.type === 'complaint' ? '投诉' : '咨询' },
            { label: '用户', value: current?.user },
            { label: '手机号', value: current?.phone || '-' },
            { label: '内容', value: current?.content },
            ...(current?.status === 'done'
              ? [
                  { label: '受理人', value: current.handler },
                  { label: '回复时间', value: current.repliedAt || '-' },
                  { label: '处理结果', value: current.result || '-' },
                ]
              : []),
          ]}
        />
        {current?.status === 'done' ? null : (
          <Field label="回复内容">
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} />
          </Field>
        )}
      </Modal>
    </>
  )
}
