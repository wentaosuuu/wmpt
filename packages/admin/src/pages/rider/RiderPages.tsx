import { useMemo, useState } from 'react'
import { DescList, Field, Modal, PageHeader, Panel, Toolbar } from '../../components/ui'
import { useAdmin } from '../../store/AdminStore'
import type { Rider, RiderAttachment } from '../../types'

const ATTACH_KIND_LABEL: Record<RiderAttachment['kind'], string> = {
  id_card: '身份证',
  other: '其他材料',
}

const emptyForm = {
  name: '',
  phone: '',
  idNo: '',
  emergencyName: '',
  emergencyPhone: '',
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

export function RidersPage() {
  const { riders, createRider, updateRider, notify } = useAdmin()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [attachments, setAttachments] = useState<RiderAttachment[]>([])
  const [kw, setKw] = useState('')
  const [current, setCurrent] = useState<Rider | null>(null)

  const list = useMemo(
    () =>
      riders.filter(
        (r) =>
          r.name.includes(kw) ||
          r.phone.includes(kw) ||
          r.idNo.includes(kw) ||
          r.id.includes(kw),
      ),
    [riders, kw],
  )

  function addFiles(kind: RiderAttachment['kind'], files: FileList | null) {
    if (!files?.length) return
    const next: RiderAttachment[] = Array.from(files).map((f, i) => ({
      id: `ratt${Date.now()}_${i}`,
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
        title="骑手管理"
        desc="创建后账号立即生效。用开关控制骑手是否可接单。"
        extra={
          <button
            className="btn"
            type="button"
            onClick={() => {
              setForm(emptyForm)
              setAttachments([])
              setOpen(true)
            }}
          >
            新建骑手
          </button>
        }
      />
      <Panel>
        <Toolbar>
          <input
            placeholder="姓名 / 手机号 / 身份证"
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>身份证号</th>
                <th>紧急联系人</th>
                <th>创建时间</th>
                <th>账号状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.name}
                    <span className="sub">{r.phone}</span>
                  </td>
                  <td>{r.idNo}</td>
                  <td>
                    {r.emergencyName}
                    <span className="sub">{r.emergencyPhone}</span>
                  </td>
                  <td>{r.createdAt}</td>
                  <td>
                    <button
                      type="button"
                      className={`switch${r.status === 'enabled' ? ' on' : ''}`}
                      title={r.status === 'enabled' ? '已启用，点击停用' : '已停用，点击启用'}
                      aria-label={r.status === 'enabled' ? '停用' : '启用'}
                      onClick={() => {
                        const next = r.status === 'enabled' ? 'disabled' : 'enabled'
                        updateRider(r.id, { status: next })
                        notify(next === 'enabled' ? `${r.name} 已启用` : `${r.name} 已停用`)
                      }}
                    >
                      <span className="switch-knob" />
                    </button>
                  </td>
                  <td className="ops">
                    <button className="link-btn" type="button" onClick={() => setCurrent(r)}>
                      详情
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-block">暂无骑手</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={open}
        title="新建骑手"
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
                  !/^1\d{10}$/.test(form.phone) ||
                  form.idNo.trim().length < 15 ||
                  !form.emergencyName ||
                  !/^1\d{10}$/.test(form.emergencyPhone)
                ) {
                  notify('请完整填写姓名、手机号、身份证和紧急联系人')
                  return
                }
                if (riders.some((r) => r.phone === form.phone)) {
                  notify('该手机号已存在骑手账号')
                  return
                }
                if (!attachments.some((a) => a.kind === 'id_card')) {
                  notify('请上传身份证')
                  return
                }
                createRider({ ...form, idNo: form.idNo.trim(), attachments })
                notify('骑手已创建，账号默认启用')
                setOpen(false)
              }}
            >
              创建
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="姓名">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="手机号">
            <input
              value={form.phone}
              placeholder="用于登录与联系"
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="身份证号">
            <input value={form.idNo} onChange={(e) => setForm({ ...form, idNo: e.target.value })} />
          </Field>
          <Field label="紧急联系人">
            <input
              value={form.emergencyName}
              onChange={(e) => setForm({ ...form, emergencyName: e.target.value })}
            />
          </Field>
          <Field label="紧急联系电话">
            <input
              value={form.emergencyPhone}
              onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
            />
          </Field>
        </div>
        <div className="attach-section">
          <div className="attach-section-title">证件附件</div>
          <p className="attach-hint">身份证为必传。</p>
          <div className="attach-upload-grid">
            {(
              [
                ['id_card', '身份证'],
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

      <Modal
        open={!!current}
        title="骑手详情"
        onClose={() => setCurrent(null)}
        footer={
          <button className="btn ghost" type="button" onClick={() => setCurrent(null)}>
            关闭
          </button>
        }
      >
        {current ? (
          <>
            <DescList
              items={[
                { label: '姓名', value: current.name },
                { label: '手机号', value: current.phone },
                { label: '身份证号', value: current.idNo },
                {
                  label: '紧急联系人',
                  value: `${current.emergencyName} ${current.emergencyPhone}`,
                },
                { label: '账号状态', value: current.status === 'enabled' ? '启用' : '停用' },
                { label: '创建时间', value: current.createdAt },
              ]}
            />
            <div className="attach-section" style={{ marginTop: 16 }}>
              <div className="attach-section-title">证件附件</div>
              {current.attachments.length ? (
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
    </>
  )
}
