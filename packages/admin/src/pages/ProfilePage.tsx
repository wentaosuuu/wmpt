import { useState } from 'react'
import { Field, PageHeader, Panel } from '../components/ui'
import { useAdmin } from '../store/AdminStore'

export function ProfilePage() {
  const { user, changePassword, notify } = useAdmin()
  const [oldPwd, setOldPwd] = useState('')
  const [nextPwd, setNextPwd] = useState('')
  const [confirm, setConfirm] = useState('')

  return (
    <>
      <PageHeader title="个人中心" desc="查看当前登录信息并修改密码。" />
      <Panel>
        <div className="desc-list" style={{ marginBottom: 20 }}>
          <div className="desc-item">
            <dt>姓名</dt>
            <dd>{user?.name}</dd>
          </div>
          <div className="desc-item">
            <dt>手机号</dt>
            <dd>{user?.username}</dd>
          </div>
          <div className="desc-item">
            <dt>角色</dt>
            <dd>{user?.role}</dd>
          </div>
        </div>
        <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>修改密码</h3>
        <div className="form-grid">
          <Field label="原密码">
            <input type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} />
          </Field>
          <Field label="新密码">
            <input type="password" value={nextPwd} onChange={(e) => setNextPwd(e.target.value)} />
          </Field>
          <Field label="确认新密码">
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
        </div>
        <button
          className="btn"
          type="button"
          onClick={() => {
            if (nextPwd.length < 6) {
              notify('新密码至少 6 位')
              return
            }
            if (nextPwd !== confirm) {
              notify('两次输入的新密码不一致')
              return
            }
            if (changePassword(oldPwd, nextPwd)) {
              notify('密码已更新')
              setOldPwd('')
              setNextPwd('')
              setConfirm('')
            } else notify('原密码不正确')
          }}
        >
          保存密码
        </button>
      </Panel>
    </>
  )
}
