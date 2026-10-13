import { useMemo, useState } from 'react'
import { DescList, Modal, PageHeader, Panel, StatusTag, Toolbar } from '../../components/ui'
import { channelLabel, tradeStatusLabel, tradeTypeLabel } from '../../lib/options'
import { useAdmin } from '../../store/AdminStore'
import type { TradeRecord } from '../../types'

type TradeFilters = {
  kw: string
  storeId: string
  channel: string
  type: string
  status: string
  dateFrom: string
  dateTo: string
}

const emptyFilters: TradeFilters = {
  kw: '',
  storeId: 'all',
  channel: 'all',
  type: 'all',
  status: 'all',
  dateFrom: '',
  dateTo: '',
}

function matchTrades(trades: TradeRecord[], f: TradeFilters) {
  return trades.filter((t) => {
    if (f.storeId !== 'all' && t.storeId !== f.storeId) return false
    if (f.channel !== 'all' && t.channel !== f.channel) return false
    if (f.type !== 'all' && t.type !== f.type) return false
    if (f.status !== 'all' && t.status !== f.status) return false
    if (f.dateFrom && t.createdAt.slice(0, 10) < f.dateFrom) return false
    if (f.dateTo && t.createdAt.slice(0, 10) > f.dateTo) return false
    if (
      f.kw &&
      !t.tradeNo.includes(f.kw) &&
      !t.orderId.includes(f.kw) &&
      !t.phone.includes(f.kw) &&
      !t.storeName.includes(f.kw) &&
      !t.thirdPartyNo.includes(f.kw)
    ) {
      return false
    }
    return true
  })
}

function money(n: number) {
  return `¥${n.toFixed(2)}`
}

function sumField(rows: TradeRecord[], key: 'amount' | 'mealAmount' | 'packingFee' | 'deliveryFee') {
  return rows.reduce((s, t) => s + t[key], 0)
}

function exportTradesCsv(rows: TradeRecord[]) {
  const headers = [
    '交易时间',
    '流水号',
    '订单号',
    '第三方单号',
    '门店',
    '用户',
    '手机号',
    '类型',
    '渠道',
    '交易金额',
    '餐品金额',
    '包装费',
    '骑手配送费',
    '状态',
    '备注',
  ]
  const lines = rows.map((t) =>
    [
      t.createdAt,
      t.tradeNo,
      t.orderId,
      t.thirdPartyNo,
      t.storeName,
      t.user,
      t.phone,
      tradeTypeLabel(t.type),
      channelLabel(t.channel),
      t.amount.toFixed(2),
      t.mealAmount.toFixed(2),
      t.packingFee.toFixed(2),
      t.deliveryFee.toFixed(2),
      tradeStatusLabel(t.status),
      t.remark,
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(','),
  )
  const csv = `\uFEFF${[headers.join(','), ...lines].join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `交易流水_${stamp}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function TradeFlowPage() {
  const { trades, merchants, notify } = useAdmin()
  const stores = merchants.filter((m) => m.status === 'approved')
  const [draft, setDraft] = useState<TradeFilters>(emptyFilters)
  const [applied, setApplied] = useState<TradeFilters>(emptyFilters)
  const [current, setCurrent] = useState<TradeRecord | null>(null)

  const list = useMemo(() => matchTrades(trades, applied), [trades, applied])

  const successPay = useMemo(
    () => list.filter((t) => t.type === 'pay' && t.status === 'success'),
    [list],
  )
  const successRefund = useMemo(
    () => list.filter((t) => t.type === 'refund' && t.status === 'success'),
    [list],
  )

  const paySum = sumField(successPay, 'amount')
  const refundSum = sumField(successRefund, 'amount')
  const mealPay = sumField(successPay, 'mealAmount')
  const mealRefund = sumField(successRefund, 'mealAmount')
  const packPay = sumField(successPay, 'packingFee')
  const packRefund = sumField(successRefund, 'packingFee')
  const deliveryPay = sumField(successPay, 'deliveryFee')
  const deliveryRefund = sumField(successRefund, 'deliveryFee')

  function setDraftField<K extends keyof TradeFilters>(key: K, value: TradeFilters[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function query() {
    setApplied({ ...draft })
  }

  function reset() {
    setDraft(emptyFilters)
    setApplied(emptyFilters)
  }

  function exportCsv() {
    if (!list.length) {
      notify('当前没有可导出的流水')
      return
    }
    exportTradesCsv(list)
    notify(`已导出 ${list.length} 条交易流水`)
  }

  return (
    <>
      <PageHeader
        title="交易流水"
        desc="按筛选结果汇总餐品、包装费、骑手配送费，便于周期性结算与对账导出。"
        extra={
          <button className="btn" type="button" onClick={exportCsv}>
            导出
          </button>
        }
      />
      <div className="stat-grid trade-stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="label">当前笔数</div>
          <div className="value">{list.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">成功支付</div>
          <div className="value" style={{ fontSize: 22 }}>
            {money(paySum)}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">成功退款</div>
          <div className="value" style={{ fontSize: 22 }}>
            {money(refundSum)}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">净流入</div>
          <div className="value" style={{ fontSize: 22 }}>
            {money(paySum - refundSum)}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">餐品净额</div>
          <div className="value" style={{ fontSize: 22 }}>
            {money(mealPay - mealRefund)}
          </div>
          <div className="hint">
            收 {money(mealPay)} · 退 {money(mealRefund)}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">包装费净额</div>
          <div className="value" style={{ fontSize: 22 }}>
            {money(packPay - packRefund)}
          </div>
          <div className="hint">
            收 {money(packPay)} · 退 {money(packRefund)}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">骑手配送费净额</div>
          <div className="value" style={{ fontSize: 22 }}>
            {money(deliveryPay - deliveryRefund)}
          </div>
          <div className="hint">
            收 {money(deliveryPay)} · 退 {money(deliveryRefund)}
          </div>
        </div>
      </div>
      <Panel>
        <Toolbar>
          <select value={draft.storeId} onChange={(e) => setDraftField('storeId', e.target.value)}>
            <option value="all">全部门店</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select value={draft.channel} onChange={(e) => setDraftField('channel', e.target.value)}>
            <option value="all">全部渠道</option>
            <option value="wechat">微信支付</option>
            <option value="alipay">支付宝</option>
          </select>
          <select value={draft.type} onChange={(e) => setDraftField('type', e.target.value)}>
            <option value="all">全部类型</option>
            <option value="pay">支付</option>
            <option value="refund">退款</option>
          </select>
          <select value={draft.status} onChange={(e) => setDraftField('status', e.target.value)}>
            <option value="all">全部状态</option>
            <option value="success">成功</option>
            <option value="processing">处理中</option>
            <option value="failed">失败</option>
          </select>
          <input
            type="date"
            value={draft.dateFrom}
            onChange={(e) => setDraftField('dateFrom', e.target.value)}
            title="开始日期"
          />
          <input
            type="date"
            value={draft.dateTo}
            onChange={(e) => setDraftField('dateTo', e.target.value)}
            title="结束日期"
          />
          <input
            placeholder="流水号 / 订单号 / 门店 / 手机号 / 三方单号"
            value={draft.kw}
            onChange={(e) => setDraftField('kw', e.target.value)}
            style={{ minWidth: 240 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') query()
            }}
          />
          <button className="btn" type="button" onClick={query}>
            查询
          </button>
          <button className="btn ghost" type="button" onClick={reset}>
            重置
          </button>
          <button className="btn ghost" type="button" onClick={exportCsv}>
            导出
          </button>
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>交易时间</th>
                <th>流水号</th>
                <th>订单号</th>
                <th>门店</th>
                <th>类型</th>
                <th>渠道</th>
                <th>餐品金额</th>
                <th>包装费</th>
                <th>骑手配送费</th>
                <th>交易金额</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <td>{t.createdAt}</td>
                  <td>{t.tradeNo}</td>
                  <td>{t.orderId}</td>
                  <td>
                    {t.storeName}
                    <span className="sub">
                      {t.user} {t.phone}
                    </span>
                  </td>
                  <td>
                    <StatusTag tone={t.type === 'pay' ? 'info' : 'warning'}>
                      {tradeTypeLabel(t.type)}
                    </StatusTag>
                  </td>
                  <td>{channelLabel(t.channel)}</td>
                  <td>{money(t.mealAmount)}</td>
                  <td>{money(t.packingFee)}</td>
                  <td>{money(t.deliveryFee)}</td>
                  <td>
                    <b>{money(t.amount)}</b>
                  </td>
                  <td>
                    <StatusTag
                      tone={
                        t.status === 'success' ? 'success' : t.status === 'failed' ? 'danger' : 'warning'
                      }
                    >
                      {tradeStatusLabel(t.status)}
                    </StatusTag>
                  </td>
                  <td className="ops">
                    <button className="link-btn" type="button" onClick={() => setCurrent(t)}>
                      详情
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={12}>
                    <div className="empty-block">暂无匹配的交易流水</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          共 {list.length} 条 · 按当前筛选汇总（仅统计成功状态的支付/退款）
        </div>
      </Panel>

      <Modal
        open={!!current}
        title="交易流水详情"
        width={640}
        onClose={() => setCurrent(null)}
        footer={
          <button className="btn ghost" type="button" onClick={() => setCurrent(null)}>
            关闭
          </button>
        }
      >
        {current ? (
          <DescList
            items={[
              { label: '流水号', value: current.tradeNo },
              { label: '订单号', value: current.orderId },
              { label: '第三方单号', value: current.thirdPartyNo },
              { label: '门店', value: current.storeName },
              { label: '用户', value: `${current.user} ${current.phone}` },
              { label: '类型', value: tradeTypeLabel(current.type) },
              { label: '渠道', value: channelLabel(current.channel) },
              { label: '交易金额', value: money(current.amount) },
              { label: '餐品金额', value: money(current.mealAmount) },
              { label: '包装费', value: money(current.packingFee) },
              { label: '骑手配送费', value: money(current.deliveryFee) },
              { label: '状态', value: tradeStatusLabel(current.status) },
              { label: '时间', value: current.createdAt },
              { label: '备注', value: current.remark },
            ]}
          />
        ) : null}
      </Modal>
    </>
  )
}
