import { useMemo, useState } from 'react'
import { DescList, Field, Modal, PageHeader, Panel, StatusTag, Toolbar } from '../../components/ui'
import { useOptionalStoreFilter } from '../../hooks/useStoreFilter'
import { statusLabel, useAdmin } from '../../store/AdminStore'
import type { AdminOrder, AdminOrderLine } from '../../types'

type TabKey =
  | 'all'
  | 'pending_accept'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'cancel_review'
  | 'refund_review'
  | 'done'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending_accept', label: '待接单' },
  { key: 'preparing', label: '备餐中' },
  { key: 'ready', label: '待取餐' },
  { key: 'delivering', label: '配送中' },
  { key: 'cancel_review', label: '取消待审' },
  { key: 'refund_review', label: '退款待审' },
  { key: 'done', label: '已完成' },
]

function matchTab(o: AdminOrder, tab: TabKey) {
  if (tab === 'all') return true
  if (tab === 'ready') return ['ready', 'dispatching', 'picked'].includes(o.status)
  if (tab === 'delivering') return o.status === 'delivering'
  if (tab === 'done') return ['delivered', 'cancelled', 'rejected', 'refunded'].includes(o.status)
  return o.status === tab
}

function statusTone(status: string) {
  if (['delivered', 'refunded'].includes(status)) return 'success' as const
  if (['rejected', 'cancelled'].includes(status)) return 'danger' as const
  if (['pending_accept', 'cancel_review', 'refund_review'].includes(status)) return 'warning' as const
  return 'info' as const
}

export function OrderLines({ items }: { items: AdminOrderLine[] }) {
  return (
    <div className="order-lines">
      {items.map((item, index) => (
        <div key={`${item.name}-${item.spec}-${index}`} className="order-line">
          <span className="order-line-name">
            {item.name}
            <em>×{item.qty}</em>
          </span>
          {item.spec || item.remark ? (
            <span className="order-line-meta">
              {item.spec ? <em>规格：{item.spec}</em> : null}
              {item.remark ? <span>备注：{item.remark}</span> : null}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

type ActionMode = 'view' | 'accept' | 'reject' | 'prep' | null

/** 按门店出餐先后生成 001–999 的三位取餐号，满号后从 001 循环 */
function nextPickupNo(list: AdminOrder[], storeId: string) {
  const nums = list
    .filter((o) => o.storeId === storeId)
    .map((o) => Number.parseInt(o.pickupNo || '', 10))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 999)
  const max = nums.length ? Math.max(...nums) : 0
  const next = max >= 999 ? 1 : max + 1
  return String(next).padStart(3, '0')
}

export function OrderManagePage() {
  const { orders, updateOrder, notify } = useAdmin()
  const { stores, storeId, setStoreId, matchStore } = useOptionalStoreFilter()
  const [tab, setTab] = useState<TabKey>('pending_accept')
  const [kw, setKw] = useState('')
  const [current, setCurrent] = useState<AdminOrder | null>(null)
  const [mode, setMode] = useState<ActionMode>(null)
  const [reason, setReason] = useState('已售罄')
  const [rejectOther, setRejectOther] = useState('')

  const scopedOrders = useMemo(
    () => orders.filter((o) => matchStore(o.storeId)),
    [orders, storeId],
  )

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of tabs) {
      map[t.key] = scopedOrders.filter((o) => matchTab(o, t.key)).length
    }
    return map
  }, [scopedOrders])

  const list = useMemo(
    () =>
      scopedOrders.filter((o) => {
        if (!matchTab(o, tab)) return false
        if (!kw) return true
        return o.id.includes(kw) || o.phone.includes(kw) || o.storeName.includes(kw)
      }),
    [scopedOrders, tab, kw],
  )

  function open(o: AdminOrder, m: ActionMode) {
    setCurrent(o)
    setMode(m)
    setReason('已售罄')
    setRejectOther('')
  }

  function close() {
    setMode(null)
    setCurrent(null)
  }

  return (
    <>
      <PageHeader
        title="订单管理"
        desc="同一订单按状态推进：待接单 → 备餐中 → 待取餐 → 配送中。商家完成接单与出餐后，待取餐由骑手到店凭取餐号取餐。"
      />
      <Panel>
        <div className="order-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={tab === t.key ? 'on' : ''}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <em>{counts[t.key] ?? 0}</em>
            </button>
          ))}
        </div>
        <Toolbar>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            <option value="all">全部门店</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input placeholder="订单号 / 手机号 / 门店" value={kw} onChange={(e) => setKw(e.target.value)} />
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>门店</th>
                <th>用户</th>
                <th>商品</th>
                <th>金额</th>
                <th>状态</th>
                <th>时间</th>
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
                  <td>
                    <OrderLines items={o.items} />
                  </td>
                  <td>
                    ¥{o.amount.toFixed(2)}
                    <span className="sub">
                      包装 ¥{o.packingFee.toFixed(2)} · 配送 ¥{o.deliveryFee.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <StatusTag tone={statusTone(o.status)}>{statusLabel[o.status]}</StatusTag>
                  </td>
                  <td>{o.createdAt}</td>
                  <td className="ops">
                    <button className="link-btn" type="button" onClick={() => open(o, 'view')}>
                      详情
                    </button>
                    {o.status === 'pending_accept' ? (
                      <>
                        <button className="link-btn" type="button" onClick={() => open(o, 'accept')}>
                          接单
                        </button>
                        <button className="link-btn danger" type="button" onClick={() => open(o, 'reject')}>
                          拒单
                        </button>
                      </>
                    ) : null}
                    {o.status === 'preparing' ? (
                      <button className="link-btn" type="button" onClick={() => open(o, 'prep')}>
                        出餐完成
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-block">暂无订单</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="pagination">共 {list.length} 条</div>
      </Panel>

      <Modal
        open={mode === 'view' && !!current}
        title="订单详情"
        width={640}
        onClose={close}
        footer={
          <button className="btn ghost" type="button" onClick={close}>
            关闭
          </button>
        }
      >
        {current ? (
          <DescList
            items={[
              { label: '订单号', value: current.id },
              { label: '门店', value: current.storeName },
              { label: '用户', value: `${current.user} ${current.phone}` },
              { label: '地址', value: current.address },
              { label: '商品', value: <OrderLines items={current.items} /> },
              { label: '金额', value: `¥${current.amount.toFixed(2)}` },
              { label: '包装费', value: `¥${current.packingFee.toFixed(2)}` },
              { label: '配送费', value: `¥${current.deliveryFee.toFixed(2)}` },
              { label: '状态', value: statusLabel[current.status] },
              { label: '取餐号', value: current.pickupNo || '-' },
              { label: '骑手', value: current.rider || '-' },
              { label: '备注', value: current.remark.trim() || '无' },
            ]}
          />
        ) : null}
      </Modal>

      <Modal
        open={mode === 'accept' && !!current}
        title="确认接单"
        onClose={close}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={close}>
              取消
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!current) return
                updateOrder(current.id, {
                  status: 'preparing',
                  note: '已接单，开始备餐',
                })
                notify('接单成功，订单进入备餐中')
                setTab('preparing')
                close()
              }}
            >
              确认接单
            </button>
          </>
        }
      >
        <DescList
          items={[
            { label: '订单号', value: current?.id },
            { label: '商品', value: current ? <OrderLines items={current.items} /> : '-' },
          ]}
        />
        <p style={{ margin: '8px 0 0', fontSize: 14, color: '#4e5969' }}>确认接单后订单进入备餐中。</p>
      </Modal>

      <Modal
        open={mode === 'reject' && !!current}
        title="确认拒单"
        onClose={close}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={close}>
              取消
            </button>
            <button
              className="btn danger"
              type="button"
              onClick={() => {
                if (!current) return
                const extra = rejectOther.trim()
                if (reason === '其他' && !extra) {
                  notify('请填写其他拒单原因')
                  return
                }
                const text = reason === '其他' ? extra : reason
                updateOrder(current.id, { status: 'rejected', note: `拒单：${text}` })
                notify('已拒单，用户将收到退款')
                close()
              }}
            >
              确认拒单
            </button>
          </>
        }
      >
        <Field label="拒单原因">
          <select
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (e.target.value !== '其他') setRejectOther('')
            }}
          >
            <option>已售罄</option>
            <option>其他</option>
          </select>
        </Field>
        {reason === '其他' ? (
          <Field label="补充说明" required>
            <textarea
              rows={3}
              maxLength={80}
              placeholder="请填写拒单原因"
              value={rejectOther}
              onChange={(e) => setRejectOther(e.target.value)}
            />
          </Field>
        ) : null}
      </Modal>

      <Modal
        open={mode === 'prep' && !!current}
        title="确认出餐完成"
        onClose={close}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={close}>
              取消
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!current) return
                const pickupNo = current.pickupNo || nextPickupNo(orders, current.storeId)
                updateOrder(current.id, {
                  status: 'ready',
                  pickupNo,
                  note: `出餐完成，取餐号 ${pickupNo}，等待骑手取餐`,
                })
                notify(`出餐完成，取餐号 ${pickupNo}`)
                setTab('ready')
                close()
              }}
            >
              确认
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#4e5969', lineHeight: 1.7 }}>
          确认订单 {current?.id} 已出餐？确认后系统按本店出餐先后自动生成 3 位取餐号，进入「待取餐」。
        </p>
      </Modal>
    </>
  )
}

/** @deprecated 使用 OrderManagePage */
export function OrderListPage() {
  return <OrderManagePage />
}
