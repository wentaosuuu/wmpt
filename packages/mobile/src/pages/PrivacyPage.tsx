import { NavBar } from '../components/ui'

export function PrivacyPage() {
  return (
    <section className="page pad">
      <NavBar title="个人信息授权与隐私说明" />
      <div className="card">
        <p>云宝宝外卖基于爱南宁用户体系登录。为完成配送，将收集：</p>
        <ul>
          <li>账号手机号，用于登录与联系。</li>
          <li>收货市、区、街道和定位，用于配送范围校验。</li>
          <li>订单、支付渠道与售后记录，用于履约和对账。</li>
        </ul>
        <p className="muted">电话、地址的查看和导出受后台权限控制，向北京配送公司共享骑手履约所需最小信息，并保留共享记录。</p>
      </div>
    </section>
  )
}
