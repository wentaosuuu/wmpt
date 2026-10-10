import { useMemo, useState } from 'react'
import { DescList, Field, Modal, PageHeader, Panel, StatusTag, Toolbar } from '../../components/ui'
import { useOptionalStoreFilter } from '../../hooks/useStoreFilter'
import { statusLabel, useAdmin } from '../../store/AdminStore'
import type { AdminOrder, Coverage } from '../../types'

export function CoveragePage() {
  const { coverages, merchants, updateCoverage, notify } = useAdmin()
  const { stores, storeId, setStoreId, matchStore } = useOptionalStoreFilter()
  const [kw, setKw] = useState('')
  const list = useMemo(
    () =>
      coverages.filter(
        (c) =>
          matchStore(c.storeId) &&
          (c.storeName.includes(kw) || String(c.radiusKm).includes(kw)),
      ),
    [coverages, kw, storeId, matchStore],
  )
  const [current, setCurrent] = useState<Coverage | null>(null)
  const [radiusKm, setRadiusKm] = useState('3')
  const [mode, setMode] = useState<'edit' | 'toggle' | null>(null)

  function storeAddress(id: string) {
    return merchants.find((m) => m.id === id)?.address ?? '—'
  }

  return (
    <>
      <PageHeader
        title="覆盖区域"
        desc="以门店地址为圆心配置配送半径，半径范围内均可配送。"
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
          <input placeholder="门店 / 半径" value={kw} onChange={(e) => setKw(e.target.value)} />
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>门店</th>
                <th>配送中心</th>
                <th>配送半径</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.storeId}>
                  <td>{c.storeName}</td>
                  <td>{storeAddress(c.storeId)}</td>
                  <td>{c.radiusKm} 公里</td>
                  <td>
                    <StatusTag tone={c.enabled ? 'success' : 'default'}>
                      {c.enabled ? '已开通' : '已停用'}
                    </StatusTag>
                  </td>
                  <td className="ops">
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => {
                        setCurrent(c)
                        setRadiusKm(String(c.radiusKm))
                        setMode('edit')
                      }}
                    >
                      编辑半径
                    </button>
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => {
                        setCurrent(c)
                        setMode('toggle')
                      }}
                    >
                      {c.enabled ? '停用' : '开通'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={mode === 'edit' && !!current}
        title="编辑配送半径"
        onClose={() => setMode(null)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setMode(null)}>
              取消
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!current) return
                const n = Number(radiusKm)
                if (!Number.isFinite(n) || n <= 0) {
                  notify('请输入大于 0 的配送半径')
                  return
                }
                updateCoverage(current.storeId, { radiusKm: Math.round(n * 10) / 10 })
                notify('配送半径已保存')
                setMode(null)
              }}
            >
              保存
            </button>
          </>
        }
      >
        <Field label="门店">
          <input value={current?.storeName ?? ''} disabled />
        </Field>
        <Field label="配送中心（门店地址）">
          <input value={current ? storeAddress(current.storeId) : ''} disabled />
        </Field>
        <Field label="配送半径（公里）">
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
            placeholder="例如 3"
          />
        </Field>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#86909c' }}>
          以门店地址为圆心，该半径内的收货地址均可配送。
        </p>
      </Modal>

      <Modal
        open={mode === 'toggle' && !!current}
        title={current?.enabled ? '停用配送服务' : '开通配送服务'}
        onClose={() => setMode(null)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setMode(null)}>
              取消
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!current) return
                updateCoverage(current.storeId, { enabled: !current.enabled })
                notify(current.enabled ? '已关闭该店配送服务' : '已开通配送服务')
                setMode(null)
              }}
            >
              确认
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#4e5969' }}>
          确认对「{current?.storeName}」{current?.enabled ? '停用' : '开通'}配送服务？
        </p>
      </Modal>
    </>
  )
}

export function ExceptionPage() {
  const { orders, updateOrder, notify } = useAdmin()
  const { stores, storeId, setStoreId, matchStore } = useOptionalStoreFilter()
  const [kw, setKw] = useState('')
  const list = useMemo(
    () =>
      orders.filter(
        (o) =>
          ['dispatching', 'picked', 'delivering'].includes(o.status) &&
          matchStore(o.storeId) &&
          (o.id.includes(kw) || o.storeName.includes(kw) || (o.rider ?? '').includes(kw)),
      ),
    [orders, kw, storeId],
  )
  const [current, setCurrent] = useState<AdminOrder | null>(null)
  const [mode, setMode] = useState<'reassign' | 'cancel' | 'address' | null>(null)
  const [remark, setRemark] = useState('')

  return (
    <>
      <PageHeader title="异常处理" desc="处理无人接单、超时、失联；支持改派、改址、取消配送。" />
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
          <input placeholder="订单号 / 门店 / 骑手" value={kw} onChange={(e) => setKw(e.target.value)} />
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>门店</th>
                <th>骑手</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.storeName}</td>
                  <td>{o.rider ?? '-'}</td>
                  <td>
                    <StatusTag tone="warning">{statusLabel[o.status]}</StatusTag>
                  </td>
                  <td className="ops">
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => {
                        setCurrent(o)
                        setRemark('')
                        setMode('reassign')
                      }}
                    >
                      改派
                    </button>
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => {
                        setCurrent(o)
                        setRemark('')
                        setMode('address')
                      }}
                    >
                      改址
                    </button>
                    <button
                      className="link-btn danger"
                      type="button"
                      onClick={() => {
                        setCurrent(o)
                        setRemark('')
                        setMode('cancel')
                      }}
                    >
                      取消配送
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-block">暂无可处理订单</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={!!mode && !!current}
        title={mode === 'reassign' ? '申请改派' : mode === 'address' ? '提交改址' : '取消配送'}
        onClose={() => setMode(null)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setMode(null)}>
              取消
            </button>
            <button
              className={mode === 'cancel' ? 'btn danger' : 'btn'}
              type="button"
              onClick={() => {
                if (!current || !mode) return
                if (mode === 'reassign') {
                  updateOrder(current.id, {
                    rider: '改派-赵骑手',
                    note: `已申请改派：${remark || '无人接单/超时'}`,
                  })
                  notify('改派申请已提交')
                } else if (mode === 'address') {
                  updateOrder(current.id, {
                    note: `改址已提交：${remark || '用户要求改址'}，可能产生追加配送费`,
                  })
                  notify('改址申请已提交')
                } else {
                  updateOrder(current.id, {
                    status: 'cancelled',
                    note: `取消配送：${remark || '用户/平台取消'}`,
                  })
                  notify('取消配送已提交')
                }
                setMode(null)
              }}
            >
              确认提交
            </button>
          </>
        }
      >
        <DescList items={[{ label: '订单号', value: current?.id }]} />
        <Field label="处理说明">
          <textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="请填写原因说明" />
        </Field>
      </Modal>
    </>
  )
}
