import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { NavBar, Tag } from '../components/ui'
import { useApp } from '../store/AppStore'

export function AddressListPage() {
  const { addresses, setDefaultAddress, removeAddress } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const pick = params.get('pick')

  return (
    <section className="page">
      <NavBar title="收货地址" extra={<Link to="/address/new">新增</Link>} />
      {addresses.map((a) => (
        <div key={a.id} className="card">
          <div className="row">
            <h4 style={{ margin: 0 }}>
              {a.name} {a.phone}
            </h4>
            {a.isDefault ? <Tag>默认</Tag> : null}
          </div>
          <p>
            {a.city} {a.district} {a.street}
          </p>
          <p className="muted">{a.detail}</p>
          {a.inRange ? <Tag tone="green">在配送范围内</Tag> : <Tag tone="red">超出配送范围</Tag>}
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn ghost" type="button" onClick={() => navigate(`/address/${a.id}`)}>
              编辑
            </button>
            {!a.isDefault ? (
              <button className="btn ghost" type="button" onClick={() => setDefaultAddress(a.id)}>
                设为默认
              </button>
            ) : null}
            <button className="btn ghost" type="button" onClick={() => removeAddress(a.id)}>
              删除
            </button>
            {pick ? (
              <button
                className="btn"
                type="button"
                disabled={!a.inRange}
                onClick={() => navigate('/checkout', { state: { addressId: a.id } })}
              >
                使用该地址
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  )
}
