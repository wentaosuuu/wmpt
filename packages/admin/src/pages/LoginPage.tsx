import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Field } from '../components/ui'
import { useAdmin } from '../store/AdminStore'

export function LoginPage() {
  const { login, notify } = useAdmin()
  const navigate = useNavigate()
  const [username, setUsername] = useState('13800000001')
  const [password, setPassword] = useState('admin123')

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="brand">云宝宝外卖</div>
        <h1>账号登录</h1>
        <Field label="手机号">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="手机号为唯一登录标识"
            inputMode="tel"
          />
        </Field>
        <Field label="密码">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <button
          className="btn"
          type="button"
          style={{ width: '100%' }}
          onClick={() => {
            if (login(username, password)) navigate('/', { replace: true })
            else notify('手机号或密码不正确')
          }}
        >
          登录
        </button>
        <p className="login-hint">
          演示手机号：13800000001 / admin123（管理员）、13800001001 / shop123（商家）、13800000003 /
          cs123（客服）、13800000004 / finance123（财务）
        </p>
      </div>
    </div>
  )
}
