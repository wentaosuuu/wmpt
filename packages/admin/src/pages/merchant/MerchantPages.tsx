import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapLocationPicker } from '../../components/MapLocationPicker'
import {
  DescList,
  Field,
  FloatTip,
  Modal,
  PageHeader,
  Panel,
  StatusTag,
  Toolbar,
} from '../../components/ui'
import {
  districtsOf,
  formatRegionPath,
  regionTree,
  streetsOf,
} from '../../data/regionTree'
import { joinHours, splitHours } from '../../lib/options'
import { useAdmin } from '../../store/AdminStore'
import type { Merchant, StoreApplication, StoreAttachment } from '../../types'

const emptyApply = {
  name: '',
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
  const { applications, cuisineCategories, submitApplication, notify } = useAdmin()
  const cuisineOptions = useMemo(
    () =>
      cuisineCategories
        .filter((c) => c.enabled && !c.isAll)
        .sort((a, b) => a.sort - b.sort)
        .map((c) => c.name),
    [cuisineCategories],
  )
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyApply)
  const [openStart, setOpenStart] = useState('10:00')
  const [openEnd, setOpenEnd] = useState('20:00')
  const [attachments, setAttachments] = useState<StoreAttachment[]>([])
  const [kw, setKw] = useState('')

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

  function openApply() {
    setForm({ ...emptyApply })
    setOpenStart('10:00')
    setOpenEnd('20:00')
    setAttachments([])
    setOpen(true)
  }

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
        desc="提交门店入驻申请并上传资质附件，管理员审核通过后进入门店管理。"
        extra={
          <button className="btn" type="button" onClick={openApply}>
            新建门店入驻
          </button>
        }
      />
      <Panel>
        <Toolbar>
          <input
            placeholder="申请单号 / 门店 / 联系人 / 营业执照号"
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
                </tr>
              ))}
              {!mine.length ? (
                <tr>
                  <td colSpan={6}>
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
                  !form.contact ||
                  !form.phone ||
                  !form.city ||
                  !form.district ||
                  !form.street ||
                  !form.addressDetail ||
                  !form.license
                ) {
                  notify('请完整填写门店名称、联系人、电话、地址和营业执照号')
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
                notify('入驻申请已提交，等待管理员审核')
                setOpen(false)
              }}
            >
              提交申请
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="门店名称">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="联系人">
            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          </Field>
          <Field label="联系电话">
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="经营品类">
            <select value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })}>
              {cuisineOptions.map((c) => (
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

        <div className="address-block" style={{ marginTop: 12 }}>
          <MapLocationPicker
            value={{
              city: form.city,
              district: form.district,
              street: form.street,
              addressDetail: form.addressDetail,
            }}
            onChange={(next) =>
              setForm({
                ...form,
                city: next.city,
                district: next.district,
                street: next.street,
                addressDetail: next.addressDetail ?? form.addressDetail,
              })
            }
          />
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Field label="门店所在市">
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
            <Field label="门店所在区">
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
            <Field label="门店所在街道">
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
        desc="审核门店入驻与资质附件。通过后生成门店档案，再到门店管理上架。"
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
            placeholder="申请单号 / 门店 / 联系人 / 营业执照号"
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
                <th>营业执照号</th>
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
                { label: '品类', value: current.cuisine },
                {
                  label: '门店地址',
                  value: current.address ||
                    [current.city, current.district, current.street, current.addressDetail]
                      .filter(Boolean)
                      .join(' '),
                },
                { label: '联系人', value: `${current.contact} ${current.phone}` },
                { label: '营业执照号', value: current.license },
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
                notify(mode === 'approve' ? '已通过：门店档案已创建' : '已驳回申请')
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
            { label: '营业执照号', value: current?.license },
          ]}
        />
        {mode === 'approve' ? (
          <p style={{ fontSize: 13, color: '#86909c' }}>
            通过即完成入驻与资质审核：创建门店档案、资质记为有效且未上架。后续在「门店管理」用上架开关控制用户端可见。
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
  const {
    merchants,
    merchantChangeLogs,
    cuisineCategories,
    coverages,
    updateMerchant,
    saveMerchant,
    saveCoverage,
    notify,
  } = useAdmin()
  const [kw, setKw] = useState('')
  const [current, setCurrent] = useState<Merchant | null>(null)
  const [mode, setMode] = useState<'view' | 'edit' | 'remind' | 'changelog' | null>(null)
  const [form, setForm] = useState<Merchant | null>(null)
  const [editStart, setEditStart] = useState('10:00')
  const [editEnd, setEditEnd] = useState('20:00')
  const [editRadiusKm, setEditRadiusKm] = useState('3')

  function radiusOf(storeId: string) {
    return coverages.find((c) => c.storeId === storeId)?.radiusKm
  }

  const list = useMemo(
    () =>
      merchants.filter((m) => {
        if (m.status !== 'approved') return false
        if (!kw) return true
        return m.name.includes(kw) || m.contact.includes(kw) || m.phone.includes(kw)
      }),
    [merchants, kw],
  )

  const currentLogs = useMemo(
    () => (current ? merchantChangeLogs.filter((l) => l.merchantId === current.id) : []),
    [merchantChangeLogs, current],
  )

  return (
    <>
      <PageHeader
        title="门店管理"
        desc="维护门店信息与门牌照片（移动端列表封面）。新建门店请到「门店入驻」提交审核。"
        extra={
          <Link className="btn" to="/merchants/apply">
            去门店入驻
          </Link>
        }
      />
      <Panel>
        <Toolbar>
          <input
            placeholder="门店 / 联系人 / 电话"
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>移动端上架</th>
                <th>营业时间</th>
                <th>保证金</th>
                <th>资质</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => {
                return (
                  <tr key={m.id}>
                    <td>
                      <div className="store-name-cell">
                        {m.doorPhoto ? (
                          <img className="door-photo-thumb" src={m.doorPhoto} alt="" />
                        ) : (
                          <span className="door-photo-thumb empty">无</span>
                        )}
                        <div>
                          <strong>{m.name}</strong>
                          <span className="sub">{m.address}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`switch${m.frontListed ? ' on' : ''}`}
                        title={m.frontListed ? '已上架，点击下架' : '未上架，点击上架'}
                        aria-label={m.frontListed ? '下架' : '上架'}
                        onClick={() => {
                          const next = !m.frontListed
                          updateMerchant(m.id, { frontListed: next, takeout: next })
                          notify(next ? '已上架，用户端可见该门店' : '已从移动端下架')
                        }}
                      >
                        <span className="switch-knob" />
                      </button>
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
                          setEditRadiusKm(String(radiusOf(m.id) ?? 3))
                          setMode('edit')
                        }}
                      >
                        编辑
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
              {!list.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-block">暂无门店</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 12, fontSize: 13, color: '#86909c' }}>
          说明：打开「移动端上架」后用户端可见并可下单；新建门店须在
          <Link to="/merchants/apply"> 门店入驻 </Link>
          提交材料并由管理员审核。配送半径在编辑门店时配置，以门店地址为圆心、半径内均可配送。
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
          <>
            <DescList
              items={[
                { label: '名称', value: current.name },
                { label: '地址', value: current.address },
                { label: '取餐点', value: current.pickup },
                { label: '联系人', value: `${current.contact} ${current.phone}` },
                { label: '营业时间', value: current.hours },
                { label: '营业执照号', value: current.license },
                { label: '资质到期', value: current.expireAt },
                { label: '保证金', value: `¥${(current.deposit || 0).toLocaleString('zh-CN')}` },
                {
                  label: '起送费',
                  value: `¥${(current.minOrder || 0).toLocaleString('zh-CN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                },
                {
                  label: '预估配送费',
                  value: `¥${(current.deliveryFee || 0).toLocaleString('zh-CN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                },
                {
                  label: '配送半径',
                  value: `${radiusOf(current.id) ?? 3} 公里`,
                },
                { label: '经营品类', value: current.cuisine || '-' },
                { label: '移动端上架', value: current.frontListed ? '已上架' : '未上架' },
              ]}
            />
            <div className="door-photo-block" style={{ marginTop: 16 }}>
              <div className="attach-section-title">门牌照片</div>
              {current.doorPhoto ? (
                <img className="door-photo-preview" src={current.doorPhoto} alt="门牌照片" />
              ) : (
                <div className="empty-block">未上传，移动端将使用默认封面</div>
              )}
            </div>
          </>
        ) : null}
      </Modal>

      <Modal
        open={mode === 'edit' && !!form}
        title="编辑门店"
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
                const minOrder = Number(form.minOrder)
                if (!Number.isFinite(minOrder) || minOrder < 0) {
                  notify('请输入有效的起送费')
                  return
                }
                const radiusKmRaw = Number(editRadiusKm)
                if (!Number.isFinite(radiusKmRaw) || radiusKmRaw <= 0) {
                  notify('请输入大于 0 的配送半径')
                  return
                }
                const radiusKm = Math.round(radiusKmRaw * 10) / 10
                saveMerchant({
                  ...form,
                  deposit: Math.round(deposit),
                  minOrder: Math.round(minOrder * 100) / 100,
                  hours: joinHours(editStart, editEnd),
                })
                saveCoverage({
                  storeId: form.id,
                  storeName: form.name,
                  radiusKm,
                  enabled: true,
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
            <Field label="门店名称">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="联系人">
              <input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </Field>
            <Field label="电话">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="取餐地址">
              <input
                value={form.pickup}
                onChange={(e) => setForm({ ...form, pickup: e.target.value })}
              />
            </Field>
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
            <Field label="起送费（元）">
              <input
                type="number"
                min={0}
                step={1}
                value={form.minOrder}
                onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })}
              />
              <p className="attach-hint" style={{ marginTop: 6 }}>
                消费者餐品金额未达起送费时不可下单（不含配送费、包装费）
              </p>
            </Field>
            <Field
              label={
                <>
                  预估配送费（元）
                  <FloatTip
                    label="预估配送费说明"
                    text="预估配送费由商家做初始化预估；实际配送费会根据峰谷时段、天气情况做动态调整，以订单结算页面为准。"
                  />
                </>
              }
            >
              <input
                type="number"
                min={0}
                step={1}
                value={form.deliveryFee}
                onChange={(e) => setForm({ ...form, deliveryFee: Number(e.target.value) })}
              />
            </Field>
            <Field
              label={
                <>
                  配送半径（公里）
                  <FloatTip
                    label="配送半径说明"
                    text="以门店地址为圆心配置配送半径，半径范围内的收货地址均可配送。"
                  />
                </>
              }
            >
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={editRadiusKm}
                onChange={(e) => setEditRadiusKm(e.target.value)}
                placeholder="例如 3"
              />
            </Field>
            <Field label="经营品类">
              <select
                value={form.cuisine}
                onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
              >
                {cuisineCategories
                  .filter((c) => c.enabled && !c.isAll)
                  .sort((a, b) => a.sort - b.sort)
                  .map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="营业开始">
              <input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
            </Field>
            <Field label="营业结束">
              <input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
            </Field>
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label>门牌照片</label>
              <p className="attach-hint" style={{ marginTop: 0 }}>
                用于移动端门店列表与详情封面展示，建议上传清晰门头/门牌图。
              </p>
              <div className="door-photo-edit">
                {form.doorPhoto ? (
                  <img className="door-photo-preview" src={form.doorPhoto} alt="门牌预览" />
                ) : (
                  <div className="door-photo-preview empty">暂无照片</div>
                )}
                <div className="door-photo-actions">
                  <label className="btn ghost door-photo-upload">
                    {form.doorPhoto ? '更换照片' : '上传照片'}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (!file) return
                        if (!file.type.startsWith('image/')) {
                          notify('请选择图片文件')
                          return
                        }
                        if (file.size > 3 * 1024 * 1024) {
                          notify('图片请控制在 3MB 以内')
                          return
                        }
                        const reader = new FileReader()
                        reader.onload = () => {
                          setForm({ ...form, doorPhoto: String(reader.result || '') })
                          notify('门牌照片已选择，保存后门店生效')
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                  {form.doorPhoto ? (
                    <button
                      className="link-btn danger"
                      type="button"
                      onClick={() => setForm({ ...form, doorPhoto: '' })}
                    >
                      移除
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
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
          到期。可在编辑中更新营业执照号与到期日。
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
