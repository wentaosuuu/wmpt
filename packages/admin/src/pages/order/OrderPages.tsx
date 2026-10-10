import { useMemo, useState } from 'react'
import { DescList, Field, Modal, PageHeader, Panel, StatusTag, Toolbar } from '../../components/ui'
import { useOptionalStoreFilter } from '../../hooks/useStoreFilter'
import { statusLabel, useAdmin } from '../../store/AdminStore'
import type { AdminOrder, AdminOrderStatus } from '../../types'

function mealAmount(o: AdminOrder) {
  return Math.max(0, o.amount - o.packingFee - o.deliveryFee)
}

function stageOf(o: AdminOrder) {
  const key = (o.cancelFromStatus ?? o.status) as AdminOrderStatus
  return statusLabel[key] ?? key
}

export function CancelAuditPage() {
  const { orders, updateOrder, notify } = useAdmin()
  const { stores, storeId, setStoreId, matchStore } = useOptionalStoreFilter()
  const [kw, setKw] = useState('')
  const list = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === 'cancel_review' &&
          matchStore(o.storeId) &&
          (o.id.includes(kw) ||
            o.storeName.includes(kw) ||
            o.items.includes(kw) ||
            (o.cancelReason ?? '').includes(kw) ||
            (o.note ?? '').includes(kw) ||
            stageOf(o).includes(kw)),
      ),
    [orders, kw, storeId, matchStore],
  )
  const [current, setCurrent] = useState<AdminOrder | null>(null)
  const [mode, setMode] = useState<'view' | 'approve' | 'reject' | null>(null)
  const [remark, setRemark] = useState('')

  function open(o: AdminOrder, next: 'view' | 'approve' | 'reject') {
    setCurrent(o)
    setMode(next)
    if (next === 'approve') setRemark('同意取消，按实付全额退款')
    if (next === 'reject') setRemark('履约已开始，不同意取消')
  }

  function close() {
    setMode(null)
    setCurrent(null)
  }

  return (
    <>
      <PageHeader
        title="取消审核"
        desc="查看订单详情与取消前履约阶段，再决定同意或拒绝取消申请。"
      />
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
            placeholder="订单号 / 门店 / 商品 / 阶段 / 取消原因"
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
                <th>取消前阶段</th>
                <th>商品</th>
                <th>取消原因</th>
                <th>实付</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.storeName}</td>
                  <td>
                    <StatusTag tone="warning">{stageOf(o)}</StatusTag>
                  </td>
                  <td>{o.items}</td>
                  <td>{o.cancelReason}</td>
                  <td>¥{o.amount.toFixed(2)}</td>
                  <td className="ops">
                    <button className="link-btn" type="button" onClick={() => open(o, 'view')}>
                      详情
                    </button>
                    <button className="link-btn" type="button" onClick={() => open(o, 'approve')}>
                      同意
                    </button>
                    <button className="link-btn danger" type="button" onClick={() => open(o, 'reject')}>
                      拒绝
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-block">暂无取消待审</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={mode === 'view' && !!current}
        title="取消申请 · 订单详情"
        width={640}
        onClose={close}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={close}>
              关闭
            </button>
            <button
              className="btn danger"
              type="button"
              onClick={() => current && open(current, 'reject')}
            >
              拒绝
            </button>
            <button className="btn" type="button" onClick={() => current && open(current, 'approve')}>
              同意取消
            </button>
          </>
        }
      >
        {current ? <CancelOrderDetail order={current} /> : null}
      </Modal>

      <Modal
        open={(mode === 'approve' || mode === 'reject') && !!current}
        title={mode === 'approve' ? '同意取消申请' : '拒绝取消申请'}
        width={640}
        onClose={close}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={close}>
              取消
            </button>
            <button
              className={mode === 'approve' ? 'btn' : 'btn danger'}
              type="button"
              onClick={() => {
                if (!current || !mode) return
                if (mode === 'approve') {
                  updateOrder(current.id, {
                    status: 'cancelled',
                    note: `取消通过：${remark}`,
                  })
                  notify('已同意取消并按实付全额退款')
                } else {
                  const restore = current.cancelFromStatus ?? 'preparing'
                  updateOrder(current.id, {
                    status: restore,
                    note: `拒绝取消：${remark}`,
                  })
                  notify(`已拒绝取消，订单恢复为「${statusLabel[restore]}」`)
                }
                close()
              }}
            >
              确认提交
            </button>
          </>
        }
      >
        {current ? <CancelOrderDetail order={current} /> : null}
        <Field label="审核意见">
          <textarea value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Field>
      </Modal>
    </>
  )
}

function CancelOrderDetail({ order }: { order: AdminOrder }) {
  return (
    <DescList
      items={[
        { label: '订单号', value: order.id },
        { label: '门店', value: order.storeName },
        { label: '取消前阶段', value: stageOf(order) },
        { label: '审核状态', value: statusLabel[order.status] },
        { label: '用户', value: `${order.user} ${order.phone}` },
        { label: '收货地址', value: order.address },
        { label: '商品', value: order.items },
        { label: '餐品金额', value: `¥${mealAmount(order).toFixed(2)}` },
        { label: '包装费', value: `¥${order.packingFee.toFixed(2)}` },
        { label: '配送费', value: `¥${order.deliveryFee.toFixed(2)}` },
        { label: '实付金额', value: `¥${order.amount.toFixed(2)}` },
        { label: '下单时间', value: order.createdAt },
        {
          label: '备餐时长',
          value: order.prepMinutes ? `${order.prepMinutes} 分钟` : '-',
        },
        { label: '骑手', value: order.rider || '-' },
        { label: '取消原因', value: order.cancelReason || '-' },
        { label: '申请说明', value: order.note },
      ]}
    />
  )
}
