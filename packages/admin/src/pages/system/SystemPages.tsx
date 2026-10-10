import { useMemo, useState } from 'react'
import { MenuPermissionTree } from '../../components/MenuPermissionTree'
import { Field, Modal, PageHeader, Panel, StatusTag, Toolbar } from '../../components/ui'
import { useAdmin } from '../../store/AdminStore'
import {
  deptDepth,
  deptLevelLabel,
  merchantDepts,
  sortDeptsTree,
} from '../../lib/dept'
import type { SysDept, SysRole, SysUser } from '../../types'

export function UsersPage() {
  const { sysUsers, depts, roles, saveSysUser, updateSysUser, notify } = useAdmin()
  const [kw, setKw] = useState('')
  const [current, setCurrent] = useState<SysUser | null>(null)
  const [form, setForm] = useState<SysUser | null>(null)
  const [mode, setMode] = useState<'edit' | 'status' | null>(null)

  const list = useMemo(
    () =>
      sysUsers.filter(
        (u) => u.name.includes(kw) || u.phone.includes(kw) || u.deptName.includes(kw),
      ),
    [sysUsers, kw],
  )

  const deptOptions = useMemo(() => sortDeptsTree(depts), [depts])

  return (
    <>
      <PageHeader
        title="用户管理"
        desc="以手机号为唯一登录标识；用户挂到市/区/门店部门，并通过角色获得菜单权限。"
      />
      <Panel>
        <Toolbar>
          <input placeholder="姓名 / 手机号 / 部门" value={kw} onChange={(e) => setKw(e.target.value)} />
          <button
            className="btn"
            type="button"
            onClick={() => {
              const leaf = merchantDepts(depts)[0] ?? depts[0]
              const blank: SysUser = {
                id: `u${Date.now()}`,
                username: '',
                name: '',
                phone: '',
                deptId: leaf?.id ?? '',
                deptName: leaf?.name ?? '',
                roleIds: [roles[0]?.id ?? ''],
                roleNames: roles[0]?.name ?? '',
                status: 'enabled',
                createdAt: new Date().toISOString().slice(0, 10),
              }
              setForm(blank)
              setCurrent(blank)
              setMode('edit')
            }}
          >
            新增用户
          </button>
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>手机号（登录标识）</th>
                <th>姓名</th>
                <th>部门</th>
                <th>角色</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td>{u.phone}</td>
                  <td>{u.name}</td>
                  <td>{u.deptName}</td>
                  <td>{u.roleNames}</td>
                  <td>
                    <StatusTag tone={u.status === 'enabled' ? 'success' : 'default'}>
                      {u.status === 'enabled' ? '启用' : '停用'}
                    </StatusTag>
                  </td>
                  <td>{u.createdAt}</td>
                  <td className="ops">
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => {
                        setCurrent(u)
                        setForm({ ...u })
                        setMode('edit')
                      }}
                    >
                      编辑
                    </button>
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => {
                        setCurrent(u)
                        setMode('status')
                      }}
                    >
                      {u.status === 'enabled' ? '停用' : '启用'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={mode === 'edit' && !!form}
        title={form && sysUsers.some((u) => u.id === form.id) ? '编辑用户' : '新增用户'}
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
                const phone = form.phone.trim()
                if (!form.name || !phone) {
                  notify('请填写姓名与手机号')
                  return
                }
                if (!/^1\d{10}$/.test(phone)) {
                  notify('请输入 11 位手机号')
                  return
                }
                const dup = sysUsers.find((u) => u.phone === phone && u.id !== form.id)
                if (dup) {
                  notify('该手机号已存在，手机号为唯一标识')
                  return
                }
                const dept = depts.find((d) => d.id === form.deptId)
                const role = roles.find((r) => r.id === form.roleIds[0])
                saveSysUser({
                  ...form,
                  phone,
                  username: phone,
                  deptName: dept?.name ?? form.deptName,
                  roleNames: role?.name ?? form.roleNames,
                })
                notify('用户已保存')
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
            <Field label="手机号（唯一登录标识）">
              <input
                value={form.phone}
                inputMode="tel"
                placeholder="11 位手机号"
                onChange={(e) => setForm({ ...form, phone: e.target.value, username: e.target.value })}
              />
            </Field>
            <Field label="姓名">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="所属部门">
              <select
                value={form.deptId}
                onChange={(e) => setForm({ ...form, deptId: e.target.value })}
              >
                {deptOptions.map((d) => {
                  const depth = deptDepth(depts, d.id)
                  const pad = '\u3000'.repeat(Math.max(0, depth - 1))
                  return (
                    <option key={d.id} value={d.id}>
                      {pad}
                      {deptLevelLabel(depth)} · {d.name}
                    </option>
                  )
                })}
              </select>
            </Field>
            <Field label="角色">
              <select
                value={form.roleIds[0] ?? ''}
                onChange={(e) => setForm({ ...form, roleIds: [e.target.value] })}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="状态">
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as SysUser['status'] })
                }
              >
                <option value="enabled">启用</option>
                <option value="disabled">停用</option>
              </select>
            </Field>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={mode === 'status' && !!current}
        title={current?.status === 'enabled' ? '停用用户' : '启用用户'}
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
                updateSysUser(current.id, {
                  status: current.status === 'enabled' ? 'disabled' : 'enabled',
                })
                notify(current.status === 'enabled' ? '用户已停用' : '用户已启用')
                setMode(null)
              }}
            >
              确认
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#4e5969' }}>
          确认{current?.status === 'enabled' ? '停用' : '启用'}手机号「{current?.phone}」吗？
        </p>
      </Modal>
    </>
  )
}

export function DeptsPage() {
  const { depts, saveDept, updateDept, notify } = useAdmin()
  const [kw, setKw] = useState('')
  const [form, setForm] = useState<SysDept | null>(null)
  const [current, setCurrent] = useState<SysDept | null>(null)
  const [mode, setMode] = useState<'edit' | 'status' | null>(null)

  const tree = useMemo(() => sortDeptsTree(depts), [depts])
  const list = useMemo(
    () =>
      tree.filter(
        (d) => d.name.includes(kw) || d.leader.includes(kw) || d.phone.includes(kw),
      ),
    [tree, kw],
  )
  const rootId = depts.find((d) => !d.parentId)?.id ?? null

  return (
    <>
      <PageHeader
        title="部门管理"
        desc="组织树按 市 → 区 → 门店 三级维护；三级门店名称即入驻申请中的「所属商家」选项。"
      />
      <Panel>
        <Toolbar>
          <input placeholder="市 / 区 / 门店 / 负责人 / 电话" value={kw} onChange={(e) => setKw(e.target.value)} />
          <button
            className="btn"
            type="button"
            onClick={() => {
              const blank: SysDept = {
                id: `d${Date.now()}`,
                name: '',
                parentId: rootId,
                leader: '',
                phone: '',
                status: 'enabled',
                sort: depts.length + 1,
              }
              setForm(blank)
              setMode('edit')
            }}
          >
            新增部门
          </button>
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>上级</th>
                <th>负责人</th>
                <th>电话</th>
                <th>排序</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => {
                const depth = deptDepth(depts, d.id)
                return (
                  <tr key={d.id}>
                    <td style={{ paddingLeft: 8 + (depth - 1) * 20 }}>{d.name}</td>
                    <td>{depts.find((x) => x.id === d.parentId)?.name ?? '-'}</td>
                    <td>{d.leader}</td>
                    <td>{d.phone}</td>
                    <td>{d.sort}</td>
                    <td>
                      <StatusTag tone={d.status === 'enabled' ? 'success' : 'default'}>
                        {d.status === 'enabled' ? '启用' : '停用'}
                      </StatusTag>
                    </td>
                    <td className="ops">
                      <button
                        className="link-btn"
                        type="button"
                        onClick={() => {
                          setForm({ ...d })
                          setMode('edit')
                        }}
                      >
                        编辑
                      </button>
                      <button
                        className="link-btn"
                        type="button"
                        onClick={() => {
                          setCurrent(d)
                          setMode('status')
                        }}
                      >
                        {d.status === 'enabled' ? '停用' : '启用'}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {!list.length ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-block">暂无部门</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={mode === 'edit' && !!form}
        title="部门信息"
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
                if (!form.name) {
                  notify('请填写名称')
                  return
                }
                const nextDepth = form.parentId ? deptDepth(depts, form.parentId) + 1 : 1
                if (nextDepth > 3) {
                  notify('最多三级：市 → 区 → 门店')
                  return
                }
                saveDept(form)
                notify('部门已保存')
                setMode(null)
              }}
            >
              保存
            </button>
          </>
        }
      >
        {form ? (
          <>
            <Field label="名称">
              <input
                value={form.name}
                placeholder={
                  form.parentId
                    ? deptDepth(depts, form.parentId) === 1
                      ? '如：青秀区'
                      : '如：南门食堂 · 外卖档口'
                    : '如：南宁市'
                }
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="上级（市下挂区，区下挂门店）">
              <select
                value={form.parentId ?? ''}
                onChange={(e) => setForm({ ...form, parentId: e.target.value || null })}
              >
                <option value="">无（一级：市）</option>
                {sortDeptsTree(depts)
                  .filter((d) => d.id !== form.id && deptDepth(depts, d.id) < 3)
                  .map((d) => {
                    const depth = deptDepth(depts, d.id)
                    return (
                      <option key={d.id} value={d.id}>
                        {deptLevelLabel(depth)} · {d.name}
                      </option>
                    )
                  })}
              </select>
            </Field>
            <div className="form-grid">
              <Field label="负责人">
                <input
                  value={form.leader}
                  onChange={(e) => setForm({ ...form, leader: e.target.value })}
                />
              </Field>
              <Field label="电话">
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#86909c' }}>
              当前将保存为「
              {deptLevelLabel(form.parentId ? deptDepth(depts, form.parentId) + 1 : 1)}」级节点
            </p>
          </>
        ) : null}
      </Modal>

      <Modal
        open={mode === 'status' && !!current}
        title={current?.status === 'enabled' ? '停用部门' : '启用部门'}
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
                updateDept(current.id, {
                  status: current.status === 'enabled' ? 'disabled' : 'enabled',
                })
                notify('部门状态已更新')
                setMode(null)
              }}
            >
              确认
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#4e5969' }}>
          确认{current?.status === 'enabled' ? '停用' : '启用'}部门「{current?.name}」吗？
        </p>
      </Modal>
    </>
  )
}

export function RolesPage() {
  const { roles, saveRole, updateRole, notify } = useAdmin()
  const [kw, setKw] = useState('')
  const [form, setForm] = useState<SysRole | null>(null)
  const [current, setCurrent] = useState<SysRole | null>(null)
  const [mode, setMode] = useState<'edit' | 'status' | null>(null)

  const list = useMemo(
    () =>
      roles.filter(
        (r) =>
          r.name.includes(kw) ||
          r.code.includes(kw) ||
          r.remark.includes(kw) ||
          r.permissions.some((p) => p.includes(kw)),
      ),
    [roles, kw],
  )

  function permSummary(r: SysRole) {
    if (r.permissions.includes('*')) return '全部菜单'
    if (!r.permissions.length) return '未配置'
    return `已选 ${r.permissions.length} 项`
  }

  return (
    <>
      <PageHeader
        title="角色管理"
        desc="角色定义可访问的菜单权限；用户绑定角色后，按手机号登录即可获得对应菜单。"
      />
      <Panel>
        <Toolbar>
          <input placeholder="角色名称 / 编码 / 备注" value={kw} onChange={(e) => setKw(e.target.value)} />
          <button
            className="btn"
            type="button"
            onClick={() => {
              setForm({
                id: `r${Date.now()}`,
                name: '',
                code: '',
                remark: '',
                status: 'enabled',
                permissions: [],
              })
              setMode('edit')
            }}
          >
            新增角色
          </button>
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>角色名称</th>
                <th>角色编码</th>
                <th>备注</th>
                <th>菜单权限</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.code}</td>
                  <td>{r.remark}</td>
                  <td>{permSummary(r)}</td>
                  <td>
                    <StatusTag tone={r.status === 'enabled' ? 'success' : 'default'}>
                      {r.status === 'enabled' ? '启用' : '停用'}
                    </StatusTag>
                  </td>
                  <td className="ops">
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => {
                        setForm({ ...r, permissions: [...r.permissions] })
                        setMode('edit')
                      }}
                    >
                      编辑
                    </button>
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => {
                        setCurrent(r)
                        setMode('status')
                      }}
                    >
                      {r.status === 'enabled' ? '停用' : '启用'}
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-block">暂无角色</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={mode === 'edit' && !!form}
        title="角色与菜单权限"
        width={640}
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
                if (!form.name || !form.code) {
                  notify('请填写角色名称与编码')
                  return
                }
                if (!form.permissions.length) {
                  notify('请至少勾选一项菜单权限')
                  return
                }
                saveRole(form)
                notify('角色已保存，对应用户登录后侧栏将按权限展示')
                setMode(null)
              }}
            >
              保存
            </button>
          </>
        }
      >
        {form ? (
          <>
            <div className="form-grid">
              <Field label="角色名称">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="角色编码">
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </Field>
            </div>
            <Field label="备注">
              <textarea value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} />
            </Field>
            <Field label="菜单权限">
              <MenuPermissionTree
                value={form.permissions}
                onChange={(permissions) => setForm({ ...form, permissions })}
              />
            </Field>
          </>
        ) : null}
      </Modal>

      <Modal
        open={mode === 'status' && !!current}
        title={current?.status === 'enabled' ? '停用角色' : '启用角色'}
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
                updateRole(current.id, {
                  status: current.status === 'enabled' ? 'disabled' : 'enabled',
                })
                notify('角色状态已更新')
                setMode(null)
              }}
            >
              确认
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#4e5969' }}>
          确认{current?.status === 'enabled' ? '停用' : '启用'}角色「{current?.name}」吗？
        </p>
      </Modal>
    </>
  )
}
