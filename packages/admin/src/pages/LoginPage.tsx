import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Field } from '../components/ui'
import { useAdmin } from '../store/AdminStore'

function EyeIcon({ off }: { off: boolean }) {
  if (off) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 3l18 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M10.6 10.7a2.2 2.2 0 0 0 3 3M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 9.2 3.6 10.5 7-.4 1-1 2-1.8 2.9M6.1 6.3C4 7.6 2.5 9.4 1.5 12c1.3 3.4 5.3 7 10.5 7 1.5 0 2.9-.3 4.2-.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function LoginPage() {
  const { login, notify } = useAdmin()
  const navigate = useNavigate()
  const [username, setUsername] = useState('13800000001')
  const [password, setPassword] = useState('admin123')
  const [showPwd, setShowPwd] = useState(false)

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
          <div className="password-field">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="password-toggle"
              type="button"
              aria-label={showPwd ? '隐藏密码' : '显示密码'}
              onClick={() => setShowPwd((v) => !v)}
            >
              <EyeIcon off={showPwd} />
            </button>
          </div>
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
