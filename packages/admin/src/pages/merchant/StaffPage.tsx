import { useMemo, useState } from 'react'
import { Field, Modal, PageHeader, Panel, StatusTag, Toolbar } from '../../components/ui'
import { useAdmin } from '../../store/AdminStore'
import type { StoreStaff } from '../../types'

const emptyForm = {
  name: '',
  phone: '',
  storeId: '',
  canAudit: false,
}

export function StaffPage() {
  const { merchants, storeStaff, createStaff, updateStaff, notify } = useAdmin()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<StoreStaff | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [kw, setKw] = useState('')
  const [storeFilter, setStoreFilter] = useState('all')

  const stores = useMemo(
    () => merchants.filter((m) => m.status === 'approved'),
    [merchants],
  )

  const list = useMemo(
    () =>
      storeStaff.filter((s) => {
        if (storeFilter !== 'all' && s.storeId !== storeFilter) return false
        if (!kw) return true
        return s.name.includes(kw) || s.phone.includes(kw) || s.storeName.includes(kw)
      }),
    [storeStaff, storeFilter, kw],
  )

  function openCreate() {
    const first = stores[0]
    setForm({
      name: '',
      phone: '',
      storeId: first?.id ?? '',
      canAudit: false,
    })
    setEdit(null)
    setOpen(true)
  }

  function openEdit(staff: StoreStaff) {
    setForm({
      name: staff.name,
      phone: staff.phone,
      storeId: staff.storeId,
      canAudit: staff.canAudit,
    })
    setEdit(staff)
    setOpen(true)
  }

  return (
    <>
      <PageHeader
        title="员工管理"
        desc="管理自家门店员工账号。岗位固定为员工，可配置是否有审核权限。"
        extra={
          <button className="btn" type="button" onClick={openCreate}>
            新建员工
          </button>
        }
      />
      <Panel>
        <Toolbar>
          <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
            <option value="all">全部门店</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            placeholder="姓名 / 手机号 / 门店"
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>所属门店</th>
                <th>岗位</th>
                <th>审核权限</th>
                <th>创建时间</th>
                <th>账号状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.name}
                    <span className="sub">{s.phone}</span>
                  </td>
                  <td>{s.storeName}</td>
                  <td>员工</td>
                  <td>
                    <StatusTag tone={s.canAudit ? 'success' : 'default'}>
                      {s.canAudit ? '有' : '无'}
                    </StatusTag>
                  </td>
                  <td>{s.createdAt}</td>
                  <td>
                    <button
                      type="button"
                      className={`switch${s.status === 'enabled' ? ' on' : ''}`}
                      title={s.status === 'enabled' ? '已启用，点击停用' : '已停用，点击启用'}
                      aria-label={s.status === 'enabled' ? '停用' : '启用'}
                      onClick={() => {
                        const next = s.status === 'enabled' ? 'disabled' : 'enabled'
                        updateStaff(s.id, { status: next })
                        notify(next === 'enabled' ? `${s.name} 已启用` : `${s.name} 已停用`)
                      }}
                    >
                      <span className="switch-knob" />
                    </button>
                  </td>
                  <td className="ops">
                    <button className="link-btn" type="button" onClick={() => openEdit(s)}>
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-block">暂无员工</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={open}
        title={edit ? '编辑员工' : '新建员工'}
        width={520}
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
                if (!form.name.trim() || !/^1\d{10}$/.test(form.phone) || !form.storeId) {
                  notify('请完整填写姓名、手机号和所属门店')
                  return
                }
                const dup = storeStaff.find((s) => s.phone === form.phone && s.id !== edit?.id)
                if (dup) {
                  notify('该手机号已绑定其他员工')
                  return
                }
                const store = stores.find((m) => m.id === form.storeId)
                if (!store) {
                  notify('请选择有效门店')
                  return
                }
                if (edit) {
                  updateStaff(edit.id, {
                    name: form.name.trim(),
                    phone: form.phone,
                    storeId: store.id,
                    storeName: store.name,
                    canAudit: form.canAudit,
                  })
                  notify('员工信息已更新')
                } else {
                  createStaff({
                    name: form.name.trim(),
                    phone: form.phone,
                    storeId: store.id,
                    storeName: store.name,
                    canAudit: form.canAudit,
                  })
                  notify('员工已创建，账号默认启用')
                }
                setOpen(false)
              }}
            >
              {edit ? '保存' : '创建'}
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
              inputMode="tel"
              placeholder="用于登录与联系"
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="所属门店">
            <select
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
            >
              <option value="">请选择门店</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="岗位">
            <input value="员工" disabled />
          </Field>
          <Field label="是否有审核权限">
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <button
                type="button"
                className={`switch${form.canAudit ? ' on' : ''}`}
                aria-label={form.canAudit ? '关闭审核权限' : '开启审核权限'}
                onClick={() => setForm({ ...form, canAudit: !form.canAudit })}
              >
                <span className="switch-knob" />
              </button>
              <span style={{ fontSize: 13, color: '#4e5969' }}>
                {form.canAudit ? '有审核权限' : '无审核权限'}
              </span>
            </label>
          </Field>
        </div>
      </Modal>
    </>
  )
}
