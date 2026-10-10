import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DescList, Field, Modal, PageHeader, Panel, StatusTag, Toolbar } from '../../components/ui'
import {
  districtsOf,
  formatRegionPath,
  regionTree,
  streetsOf,
} from '../../data/regionTree'
import { CUISINE_OPTIONS, joinHours, splitHours } from '../../lib/options'
import { useAdmin } from '../../store/AdminStore'
import type { Merchant, StoreApplication, StoreAttachment } from '../../types'

const emptyApply = {
  name: '',
  parentMerchant: '',
  city: '',
  district: '',
  street: '',
  addressDetail: '',
  address: '',
  contact: '',
  phone: '',
  license: '',
  hours: '10:00-20:00',
  cuisine: '快餐',
}

const ATTACH_KIND_LABEL: Record<StoreAttachment['kind'], string> = {
  license: '营业执照',
  food_permit: '食品经营许可证',
  id_card: '法人身份证',
  other: '其他材料',
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function nowStamp() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function StoreApplyPage() {
  const { applications, merchants, submitApplication, notify } = useAdmin()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyApply)
  const [openStart, setOpenStart] = useState('10:00')
  const [openEnd, setOpenEnd] = useState('20:00')
  const [attachments, setAttachments] = useState<StoreAttachment[]>([])
  const [kw, setKw] = useState('')
  const hqOptions = useMemo(
    () => merchants.filter((m) => m.type === 'hq' && m.status === 'approved'),
    [merchants],
  )

  const mine = useMemo(
    () =>
      applications.filter(
        (a) =>
          a.name.includes(kw) ||
          a.contact.includes(kw) ||
          a.phone.includes(kw) ||
          a.license.includes(kw) ||
          a.id.includes(kw),
      ),
    [applications, kw],
  )

  function addFiles(kind: StoreAttachment['kind'], files: FileList | null) {
    if (!files?.length) return
    const next: StoreAttachment[] = Array.from(files).map((f, i) => ({
      id: `att${Date.now()}_${i}`,
      name: f.name,
      kind,
      sizeLabel: formatSize(f.size),
      uploadedAt: nowStamp(),
    }))
    setAttachments((prev) => [...prev, ...next])
    notify(`已添加 ${next.length} 个附件（演示：仅本地记录，未实际上传）`)
  }

  return (
    <>
      <PageHeader
        title="门店入驻"
        desc="提交新门店入驻申请并上传资质附件，审核通过后进入门店管理。"
        extra={
          <button
            className="btn"
            type="button"
            onClick={() => {
              setForm(emptyApply)
              setOpenStart('10:00')
              setOpenEnd('20:00')
              setAttachments([])
              setOpen(true)
            }}
          >
            新建入驻申请
          </button>
        }
      />
      <Panel>
        <Toolbar>
          <input
            placeholder="申请单号 / 门店 / 联系人 / 执照号"
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>申请单号</th>
                <th>门店名称</th>
                <th>联系人</th>
                <th>附件</th>
                <th>提交时间</th>
                <th>状态</th>
                <th>审核意见</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>
                    {a.name}
                    <span className="sub">{a.address}</span>
                  </td>
                  <td>
                    {a.contact}
                    <span className="sub">{a.phone}</span>
                  </td>
                  <td>{a.attachments?.length ? `${a.attachments.length} 份` : '-'}</td>
                  <td>{a.createdAt}</td>
                  <td>
                    <StatusTag
                      tone={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}
                    >
                      {a.status === 'approved' ? '已通过' : a.status === 'rejected' ? '已驳回' : '待审核'}
                    </StatusTag>
                  </td>
                  <td>{a.auditRemark || '-'}</td>
                </tr>
              ))}
              {!mine.length ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-block">暂无申请</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={open}
        title="新建门店入驻申请"
        width={720}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setOpen(false)}>
              取消
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (
                  !form.name ||
                  !form.parentMerchant ||
                  !form.contact ||
                  !form.phone ||
                  !form.city ||
                  !form.district ||
                  !form.street ||
                  !form.addressDetail ||
                  !form.license
                ) {
                  notify('请完整填写门店、所属总店、联系人、电话、门店地址和执照号')
                  return
                }
                if (!attachments.some((a) => a.kind === 'license')) {
                  notify('请上传营业执照附件')
                  return
                }
                const region = formatRegionPath(form.city, form.district, form.street)
                submitApplication({
                  ...form,
                  address: `${region} ${form.addressDetail.trim()}`,
                  hours: joinHours(openStart, openEnd),
                  attachments,
                })
                notify('入驻申请已提交，等待审核')
                setOpen(false)
              }}
            >
              提交申请
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="分店名称">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="所属总店">
            <select
              value={form.parentMerchant}
              onChange={(e) => setForm({ ...form, parentMerchant: e.target.value })}
            >
              <option value="">请选择总店</option>
              {hqOptions.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="联系人">
            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          </Field>
          <Field label="联系电话">
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="经营品类">
            <select value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })}>
              {CUISINE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="营业执照号">
            <input value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} />
          </Field>
          <Field label="营业开始">
            <input type="time" value={openStart} onChange={(e) => setOpenStart(e.target.value)} />
          </Field>
          <Field label="营业结束">
            <input type="time" value={openEnd} onChange={(e) => setOpenEnd(e.target.value)} />
          </Field>
        </div>

        <div className="form-grid" style={{ marginTop: 12 }}>
          <Field label="门店地址 · 市">
            <select
              value={form.city}
              onChange={(e) =>
                setForm({
                  ...form,
                  city: e.target.value,
                  district: '',
                  street: '',
                })
              }
            >
              <option value="">请选择市</option>
              {regionTree.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="门店地址 · 区">
            <select
              value={form.district}
              disabled={!form.city}
              onChange={(e) =>
                setForm({
                  ...form,
                  district: e.target.value,
                  street: '',
                })
              }
            >
              <option value="">请选择区</option>
              {districtsOf(form.city).map((d) => (
                <option key={d.label} value={d.label}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="门店地址 · 街道">
            <select
              value={form.street}
              disabled={!form.district}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
            >
              <option value="">请选择街道</option>
              {streetsOf(form.city, form.district).map((s) => (
                <option key={s.label} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="详细地址">
            <input
              value={form.addressDetail}
              placeholder="如楼栋、门牌、档口号等"
              onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
            />
          </Field>
        </div>

        <div className="attach-section">
          <div className="attach-section-title">资质附件</div>
          <p className="attach-hint">请上传营业执照（必传），食品经营许可证、法人身份证等材料可选。</p>
          <div className="attach-upload-grid">
            {(
              [
                ['license', '营业执照'],
                ['food_permit', '食品经营许可证'],
                ['id_card', '法人身份证'],
                ['other', '其他材料'],
              ] as const
            ).map(([kind, label]) => (
              <label key={kind} className="attach-upload-card">
                <span>{label}</span>
                <em>点击选择文件</em>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={(e) => {
                    addFiles(kind, e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
            ))}
          </div>
          {attachments.length ? (
            <ul className="attach-list">
              {attachments.map((a) => (
                <li key={a.id}>
                  <div>
                    <strong>{a.name}</strong>
                    <span>
                      {ATTACH_KIND_LABEL[a.kind]} · {a.sizeLabel} · {a.uploadedAt}
                    </span>
                  </div>
                  <button
                    className="link-btn danger"
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                  >
                    删除
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-block" style={{ marginTop: 12 }}>
              尚未上传附件
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

export function StoreAuditPage() {
  const { applications, auditApplication, notify } = useAdmin()
  const [status, setStatus] = useState('pending')
  const [kw, setKw] = useState('')
  const [current, setCurrent] = useState<StoreApplication | null>(null)
  const [mode, setMode] = useState<'approve' | 'reject' | 'view' | null>(null)
  const [remark, setRemark] = useState('')

  const list = useMemo(
    () =>
      applications.filter((a) => {
        if (status !== 'all' && a.status !== status) return false
        if (!kw) return true
        return (
          a.name.includes(kw) ||
          a.contact.includes(kw) ||
          a.phone.includes(kw) ||
          a.license.includes(kw) ||
          a.id.includes(kw)
        )
      }),
    [applications, status, kw],
  )

  return (
    <>
      <PageHeader
        title="入驻审核"
        desc="统一审核门店入驻与经营资质（执照）。通过后生成门店档案，资质记为有效，再去开通外卖与上架。"
      />
      <Panel>
        <Toolbar>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
            <option value="all">全部</option>
          </select>
          <input
            placeholder="申请单号 / 门店 / 联系人 / 执照号"
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>申请单号</th>
                <th>门店</th>
                <th>执照</th>
                <th>联系人</th>
                <th>提交时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>
                    {a.name}
                    <span className="sub">{a.address}</span>
                  </td>
                  <td>{a.license}</td>
                  <td>
                    {a.contact}
                    <span className="sub">{a.phone}</span>
                  </td>
                  <td>{a.createdAt}</td>
                  <td>
                    <StatusTag
                      tone={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}
                    >
                      {a.status === 'approved' ? '已通过' : a.status === 'rejected' ? '已驳回' : '待审核'}
                    </StatusTag>
                  </td>
                  <td className="ops">
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => {
                        setCurrent(a)
                        setMode('view')
                      }}
                    >
                      详情
                    </button>
                    {a.status === 'pending' ? (
                      <>
                        <button
                          className="link-btn"
                          type="button"
                          onClick={() => {
                            setCurrent(a)
                            setRemark('材料齐全，同意入驻')
                            setMode('approve')
                          }}
                        >
                          通过
                        </button>
                        <button
                          className="link-btn danger"
                          type="button"
                          onClick={() => {
                            setCurrent(a)
                            setRemark('材料不齐，请补充后重提')
                            setMode('reject')
                          }}
                        >
                          驳回
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-block">暂无申请</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={mode === 'view' && !!current}
        title="入驻申请详情"
        onClose={() => setMode(null)}
        footer={
          <button className="btn ghost" type="button" onClick={() => setMode(null)}>
            关闭
          </button>
        }
      >
        {current ? (
          <>
            <DescList
              items={[
                { label: '门店', value: current.name },
                { label: '所属总店', value: current.parentMerchant },
                { label: '品类', value: current.cuisine },
                {
                  label: '门店地址',
                  value: current.address ||
                    [current.city, current.district, current.street, current.addressDetail]
                      .filter(Boolean)
                      .join(' '),
                },
                { label: '联系人', value: `${current.contact} ${current.phone}` },
                { label: '执照', value: current.license },
                { label: '营业时间', value: current.hours },
                { label: '审核意见', value: current.auditRemark || '-' },
              ]}
            />
            <div className="attach-section" style={{ marginTop: 16 }}>
              <div className="attach-section-title">资质附件</div>
              {current.attachments?.length ? (
                <ul className="attach-list">
                  {current.attachments.map((a) => (
                    <li key={a.id}>
                      <div>
                        <strong>{a.name}</strong>
                        <span>
                          {ATTACH_KIND_LABEL[a.kind]} · {a.sizeLabel} · {a.uploadedAt}
                        </span>
                      </div>
                      <button
                        className="link-btn"
                        type="button"
                        onClick={() => notify(`演示：已打开附件「${a.name}」`)}
                      >
                        预览
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-block">未上传附件</div>
              )}
            </div>
          </>
        ) : null}
      </Modal>

      <Modal
        open={(mode === 'approve' || mode === 'reject') && !!current}
        title={mode === 'approve' ? '通过入驻申请' : '驳回入驻申请'}
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
                auditApplication(current.id, mode === 'approve', remark)
                notify(mode === 'approve' ? '已通过：门店已创建，资质记为有效' : '已驳回申请')
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
            { label: '门店', value: current?.name },
            { label: '营业执照', value: current?.license },
          ]}
        />
        {mode === 'approve' ? (
          <p style={{ fontSize: 13, color: '#86909c' }}>
            通过即完成入驻与资质审核：创建门店档案、资质状态为有效、外卖默认关闭且未上架。后续在「门店管理」开通外卖，并用上架开关控制用户端可见。
          </p>
        ) : null}
        <Field label="审核意见">
          <textarea value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Field>
      </Modal>
    </>
  )
}

export function StoresPage() {
  const { merchants, merchantChangeLogs, updateMerchant, saveMerchant, notify } = useAdmin()
  const [kw, setKw] = useState('')
  const [levelFilter, setLevelFilter] = useState<'all' | 'hq' | 'branch'>('all')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [current, setCurrent] = useState<Merchant | null>(null)
  const [mode, setMode] = useState<
    'view' | 'toggle' | 'edit' | 'remind' | 'changelog' | 'createHq' | 'createBranch' | null
  >(null)
  const [form, setForm] = useState<Merchant | null>(null)
  const [editStart, setEditStart] = useState('10:00')
  const [editEnd, setEditEnd] = useState('20:00')
  const [createForm, setCreateForm] = useState({
    name: '',
    contact: '',
    phone: '',
    address: '',
    pickup: '',
    license: '',
    parentId: '',
    hours: '10:00-20:00',
  })
  const [createStart, setCreateStart] = useState('10:00')
  const [createEnd, setCreateEnd] = useState('20:00')

  const approved = useMemo(
    () => merchants.filter((m) => m.status === 'approved'),
    [merchants],
  )

  const hqList = useMemo(() => approved.filter((m) => m.type === 'hq'), [approved])

  const matchKw = (m: Merchant) =>
    !kw ||
    m.name.includes(kw) ||
    m.contact.includes(kw) ||
    m.phone.includes(kw) ||
    (m.parentName ?? '').includes(kw)

  /** 树形行：总店 → 其下分店 */
  const treeRows = useMemo(() => {
    const rows: { merchant: Merchant; depth: number }[] = []
    const orphanBranches = approved.filter(
      (m) => m.type === 'branch' && (!m.parentId || !hqList.some((h) => h.id === m.parentId)),
    )

    for (const hq of hqList) {
      const branches = approved.filter((m) => m.type === 'branch' && m.parentId === hq.id)
      const hqHit = matchKw(hq)
      const branchHits = branches.filter(matchKw)
      if (levelFilter === 'branch') {
        for (const b of branchHits) rows.push({ merchant: b, depth: 0 })
        continue
      }
      if (levelFilter === 'hq') {
        if (hqHit || branchHits.length) rows.push({ merchant: hq, depth: 0 })
        continue
      }
      if (!hqHit && !branchHits.length) continue
      rows.push({ merchant: hq, depth: 0 })
      if (!collapsed[hq.id]) {
        for (const b of hqHit ? branches : branchHits) {
          rows.push({ merchant: b, depth: 1 })
        }
      }
    }

    if (levelFilter !== 'hq') {
      for (const b of orphanBranches.filter(matchKw)) {
        rows.push({ merchant: b, depth: 0 })
      }
    }
    return rows
  }, [approved, hqList, kw, levelFilter, collapsed])

  const currentLogs = useMemo(
    () => (current ? merchantChangeLogs.filter((l) => l.merchantId === current.id) : []),
    [merchantChangeLogs, current],
  )

  function blankMerchant(type: 'hq' | 'branch', parentId?: string): Merchant {
    const hq = parentId ? hqList.find((h) => h.id === parentId) : undefined
    return {
      id: `${type === 'hq' ? 'm' : 's'}${Date.now()}`,
      name: createForm.name.trim(),
      type,
      parentId: type === 'branch' ? parentId : undefined,
      parentName: type === 'branch' ? hq?.name : undefined,
      takeout: type === 'branch',
      frontListed: false,
      address: createForm.address.trim() || '-',
      pickup: type === 'hq' ? '-' : createForm.pickup.trim() || createForm.address.trim() || '-',
      contact: createForm.contact.trim(),
      phone: createForm.phone.trim(),
      hours: joinHours(createStart, createEnd),
      qualStatus: 'valid',
      license: createForm.license.trim() || '-',
      expireAt: '2027-12-31',
      deposit: type === 'hq' ? 20000 : 5000,
      orderPackingFee: type === 'branch' ? 1 : 0,
      status: 'approved',
    }
  }

  function openCreate(type: 'hq' | 'branch', parentId = '') {
    setCreateForm({
      name: '',
      contact: '',
      phone: '',
      address: '',
      pickup: '',
      license: '',
      parentId: parentId || hqList[0]?.id || '',
      hours: '10:00-20:00',
    })
    setCreateStart('10:00')
    setCreateEnd('20:00')
    setMode(type === 'hq' ? 'createHq' : 'createBranch')
  }

  return (
    <>
      <PageHeader
        title="门店管理"
        desc="总店为品牌主体，分店挂在总店下承接外卖履约。列表按总店折叠展示分店。"
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost" type="button" onClick={() => openCreate('hq')}>
              新建总店
            </button>
            <button className="btn" type="button" onClick={() => openCreate('branch')}>
              新建分店
            </button>
          </div>
        }
      />
      <Panel>
        <Toolbar>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as 'all' | 'hq' | 'branch')}
          >
            <option value="all">全部层级</option>
            <option value="hq">仅总店</option>
            <option value="branch">仅分店</option>
          </select>
          <input
            placeholder="门店 / 总店 / 联系人 / 电话"
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>层级</th>
                <th>外卖能力</th>
                <th>移动端上架</th>
                <th>营业时间</th>
                <th>保证金</th>
                <th>资质</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {treeRows.map(({ merchant: m, depth }) => {
                const branchCount = approved.filter(
                  (x) => x.type === 'branch' && x.parentId === m.id,
                ).length
                const isHq = m.type === 'hq'
                return (
                  <tr key={m.id} className={isHq ? 'store-row-hq' : 'store-row-branch'}>
                    <td>
                      <div
                        className="store-name-cell"
                        style={{ paddingLeft: depth ? 28 : 0 }}
                      >
                        {isHq && levelFilter === 'all' ? (
                          <button
                            type="button"
                            className="store-fold-btn"
                            onClick={() =>
                              setCollapsed((prev) => ({ ...prev, [m.id]: !prev[m.id] }))
                            }
                            aria-label={collapsed[m.id] ? '展开分店' : '折叠分店'}
                          >
                            {collapsed[m.id] ? '▸' : '▾'}
                          </button>
                        ) : depth ? (
                          <span className="store-branch-mark">└</span>
                        ) : null}
                        <div>
                          <strong>{m.name}</strong>
                          <span className="sub">
                            {isHq
                              ? `${m.address} · ${branchCount} 家分店`
                              : `${m.parentName || '未挂总店'} · ${m.address}`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusTag tone={isHq ? 'info' : 'default'}>
                        {isHq ? '总店' : '分店'}
                      </StatusTag>
                    </td>
                    <td>
                      {isHq ? (
                        <span className="sub">—</span>
                      ) : (
                        <StatusTag tone={m.takeout ? 'success' : 'default'}>
                          {m.takeout ? '已开通' : '未开通'}
                        </StatusTag>
                      )}
                    </td>
                    <td>
                      {!isHq ? (
                        <button
                          type="button"
                          className={`switch${m.frontListed ? ' on' : ''}`}
                          disabled={!m.takeout && !m.frontListed}
                          title={
                            !m.takeout && !m.frontListed
                              ? '请先开通外卖后再上架'
                              : m.frontListed
                                ? '已上架，点击下架'
                                : '未上架，点击上架'
                          }
                          aria-label={m.frontListed ? '下架' : '上架'}
                          onClick={() => {
                            if (!m.frontListed && !m.takeout) {
                              notify('请先开通外卖，再上架到移动端')
                              return
                            }
                            updateMerchant(m.id, { frontListed: !m.frontListed })
                            notify(m.frontListed ? '已从移动端下架' : '已上架，用户端可见该门店')
                          }}
                        >
                          <span className="switch-knob" />
                        </button>
                      ) : (
                        <span className="sub">—</span>
                      )}
                    </td>
                    <td>{m.hours}</td>
                    <td>¥{(m.deposit || 0).toLocaleString('zh-CN')}</td>
                    <td>
                      <StatusTag
                        tone={
                          m.qualStatus === 'valid'
                            ? 'success'
                            : m.qualStatus === 'expiring'
                              ? 'warning'
                              : m.qualStatus === 'rejected'
                                ? 'danger'
                                : 'info'
                        }
                      >
                        {m.qualStatus === 'valid'
                          ? '有效'
                          : m.qualStatus === 'expiring'
                            ? '即将到期'
                            : m.qualStatus === 'rejected'
                              ? '已驳回'
                              : '待审'}
                      </StatusTag>
                      <span className="sub">{m.expireAt}</span>
                    </td>
                    <td className="ops">
                      <button
                        className="link-btn"
                        type="button"
                        onClick={() => {
                          setCurrent(m)
                          setMode('view')
                        }}
                      >
                        详情
                      </button>
                      <button
                        className="link-btn"
                        type="button"
                        onClick={() => {
                          setForm({ ...m })
                          const h = splitHours(m.hours)
                          setEditStart(h.start)
                          setEditEnd(h.end)
                          setMode('edit')
                        }}
                      >
                        编辑
                      </button>
                      {isHq ? (
                        <button
                          className="link-btn"
                          type="button"
                          onClick={() => openCreate('branch', m.id)}
                        >
                          添加分店
                        </button>
                      ) : (
                        <>
                          <button
                            className="link-btn"
                            type="button"
                            onClick={() => {
                              setCurrent(m)
                              setMode('toggle')
                            }}
                          >
                            {m.takeout ? '关闭外卖' : '开通外卖'}
                          </button>
                          {m.qualStatus === 'expiring' ? (
                            <button
                              className="link-btn"
                              type="button"
                              onClick={() => {
                                setCurrent(m)
                                setMode('remind')
                              }}
                            >
                              到期提醒
                            </button>
                          ) : null}
                        </>
                      )}
                      <button
                        className="link-btn"
                        type="button"
                        onClick={() => {
                          setCurrent(m)
                          setMode('changelog')
                        }}
                      >
                        变更记录
                      </button>
                    </td>
                  </tr>
                )
              })}
              {!treeRows.length ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-block">暂无门店</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 12, fontSize: 13, color: '#86909c' }}>
          说明：总店不直接对 C 端上架；分店开通外卖并打开上架开关后，用户可在移动端看到。配送半径在
          <Link to="/delivery/coverage"> 覆盖区域 </Link>
          按分店配置。
        </p>
      </Panel>

      <Modal
        open={mode === 'view' && !!current}
        title="门店详情"
        onClose={() => setMode(null)}
        footer={
          <button className="btn ghost" type="button" onClick={() => setMode(null)}>
            关闭
          </button>
        }
      >
        {current ? (
          <DescList
            items={[
              { label: '名称', value: current.name },
              { label: '层级', value: current.type === 'hq' ? '总店' : '分店' },
              { label: '所属总店', value: current.parentName || '-' },
              { label: '地址', value: current.address },
              { label: '取餐点', value: current.pickup },
              { label: '联系人', value: `${current.contact} ${current.phone}` },
              { label: '营业时间', value: current.hours },
              { label: '执照', value: current.license },
              { label: '资质到期', value: current.expireAt },
              { label: '保证金', value: `¥${(current.deposit || 0).toLocaleString('zh-CN')}` },
              {
                label: '外卖能力',
                value:
                  current.type === 'hq' ? '总店不承接外卖' : current.takeout ? '已开通' : '未开通',
              },
              {
                label: '移动端上架',
                value:
                  current.type === 'hq' ? '—' : current.frontListed ? '已上架' : '未上架',
              },
            ]}
          />
        ) : null}
      </Modal>

      <Modal
        open={mode === 'edit' && !!form}
        title={form?.type === 'hq' ? '编辑总店' : '编辑分店'}
        width={560}
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
                if (!form) return
                if (editStart >= editEnd) {
                  notify('结束时间需晚于开始时间')
                  return
                }
                const deposit = Number(form.deposit)
                if (!Number.isFinite(deposit) || deposit < 0) {
                  notify('请输入有效的已缴纳保证金金额')
                  return
                }
                let parentName = form.parentName
                let parentId = form.parentId
                if (form.type === 'branch' && form.parentId) {
                  const hq = hqList.find((h) => h.id === form.parentId)
                  parentName = hq?.name
                  parentId = hq?.id
                }
                saveMerchant({
                  ...form,
                  parentId,
                  parentName,
                  deposit: Math.round(deposit),
                  hours: joinHours(editStart, editEnd),
                })
                notify('门店信息已保存')
                setMode(null)
              }}
            >
              保存
            </button>
          </>
        }
      >
        {form ? (
          <div className="form-grid">
            <Field label={form.type === 'hq' ? '总店名称' : '分店名称'}>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            {form.type === 'branch' ? (
              <Field label="所属总店">
                <select
                  value={form.parentId || ''}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                >
                  <option value="">请选择</option>
                  {hqList.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field label="联系人">
              <input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </Field>
            <Field label="电话">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            {form.type === 'branch' ? (
              <Field label="取餐地址">
                <input
                  value={form.pickup}
                  onChange={(e) => setForm({ ...form, pickup: e.target.value })}
                />
              </Field>
            ) : null}
            <Field label="地址">
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
            <Field label="营业执照号">
              <input
                value={form.license}
                onChange={(e) => setForm({ ...form, license: e.target.value })}
              />
            </Field>
            <Field label="资质到期日">
              <input
                type="date"
                value={form.expireAt === '-' ? '' : form.expireAt}
                onChange={(e) =>
                  setForm({
                    ...form,
                    expireAt: e.target.value,
                    qualStatus: e.target.value ? 'valid' : form.qualStatus,
                  })
                }
              />
            </Field>
            <Field label="已缴纳保证金（元）">
              <input
                type="number"
                min={0}
                step={100}
                value={form.deposit}
                onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
              />
            </Field>
            <Field label="营业开始">
              <input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
            </Field>
            <Field label="营业结束">
              <input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
            </Field>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={mode === 'createHq' || mode === 'createBranch'}
        title={mode === 'createHq' ? '新建总店' : '新建分店'}
        width={560}
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
                if (!createForm.name.trim() || !createForm.contact.trim() || !createForm.phone.trim()) {
                  notify('请填写名称、联系人和电话')
                  return
                }
                if (mode === 'createBranch' && !createForm.parentId) {
                  notify('请选择所属总店')
                  return
                }
                if (createStart >= createEnd) {
                  notify('结束时间需晚于开始时间')
                  return
                }
                const m = blankMerchant(
                  mode === 'createHq' ? 'hq' : 'branch',
                  createForm.parentId || undefined,
                )
                saveMerchant(m)
                notify(mode === 'createHq' ? '总店已创建' : '分店已创建')
                setMode(null)
              }}
            >
              创建
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label={mode === 'createHq' ? '总店名称' : '分店名称'}>
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            />
          </Field>
          {mode === 'createBranch' ? (
            <Field label="所属总店">
              <select
                value={createForm.parentId}
                onChange={(e) => setCreateForm({ ...createForm, parentId: e.target.value })}
              >
                <option value="">请选择</option>
                {hqList.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <Field label="联系人">
            <input
              value={createForm.contact}
              onChange={(e) => setCreateForm({ ...createForm, contact: e.target.value })}
            />
          </Field>
          <Field label="电话">
            <input
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            />
          </Field>
          <Field label="地址">
            <input
              value={createForm.address}
              onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
            />
          </Field>
          {mode === 'createBranch' ? (
            <Field label="取餐地址">
              <input
                value={createForm.pickup}
                onChange={(e) => setCreateForm({ ...createForm, pickup: e.target.value })}
              />
            </Field>
          ) : null}
          <Field label="营业执照号">
            <input
              value={createForm.license}
              onChange={(e) => setCreateForm({ ...createForm, license: e.target.value })}
            />
          </Field>
          <Field label="营业开始">
            <input type="time" value={createStart} onChange={(e) => setCreateStart(e.target.value)} />
          </Field>
          <Field label="营业结束">
            <input type="time" value={createEnd} onChange={(e) => setCreateEnd(e.target.value)} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={mode === 'toggle' && !!current}
        title={current?.takeout ? '关闭外卖服务' : '开通外卖服务'}
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
                if (
                  !current.takeout &&
                  current.qualStatus !== 'valid' &&
                  current.qualStatus !== 'expiring'
                ) {
                  notify('门店资质无效，无法开通外卖')
                  return
                }
                const next = !current.takeout
                updateMerchant(current.id, {
                  takeout: next,
                  ...(next ? {} : { frontListed: false }),
                })
                notify(
                  next
                    ? '已开通外卖能力，可在列表中打开「移动端上架」开关对用户可见'
                    : '已关闭外卖，并已从移动端下架',
                )
                setMode(null)
              }}
            >
              确认
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#4e5969' }}>
          {current?.takeout
            ? `确认关闭「${current?.name}」外卖能力？将同时从移动端下架。`
            : `确认开通「${current?.name}」外卖能力？开通后可在列表中打开上架开关，用户才能下单。`}
        </p>
      </Modal>

      <Modal
        open={mode === 'remind' && !!current}
        title="发送到期提醒"
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
                notify(`已向 ${current?.contact} 发送资质到期提醒`)
                setMode(null)
              }}
            >
              确认发送
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#4e5969' }}>
          将提醒「{current?.name}」联系人 {current?.contact}，资质将于 {current?.expireAt}{' '}
          到期。可在编辑中更新执照与到期日。
        </p>
      </Modal>

      <Modal
        open={mode === 'changelog' && !!current}
        title={`变更记录 · ${current?.name || ''}`}
        width={720}
        onClose={() => setMode(null)}
        footer={
          <button className="btn ghost" type="button" onClick={() => setMode(null)}>
            关闭
          </button>
        }
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>变更项</th>
                <th>变更时间</th>
                <th>变更前</th>
                <th>变更后</th>
                <th>操作人</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.length ? (
                currentLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.field}</td>
                    <td>{log.changedAt}</td>
                    <td>{log.before}</td>
                    <td>{log.after}</td>
                    <td>{log.operator}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#86909c' }}>
                    暂无变更记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  )
}
