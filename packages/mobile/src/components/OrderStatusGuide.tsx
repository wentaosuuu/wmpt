import { aftersaleStatusOrder, fulfillmentStatusOrder, statusHint, statusText } from '../lib/utils'

export function OrderStatusGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="role-sheet" onClick={onClose}>
      <div
        className="role-sheet-card status-guide-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="订单状态说明"
      >
        <h3>订单状态说明</h3>
        <p className="muted status-guide-lead">
          「进行中」是订单列表的分组，包含待商家接单到送达之前的全部进度，并不等于骑手已经在路上。每笔订单以自己的状态为准。
        </p>
        <div className="status-guide-scroll">
          <h4>正常履约</h4>
          <ol className="status-guide-list">
            {fulfillmentStatusOrder.map((id, index) => (
              <li key={id}>
                <strong>
                  {index + 1}. {statusText(id)}
                </strong>
                <span>{statusHint(id)}</span>
              </li>
            ))}
          </ol>
          <h4>异常与售后</h4>
          <ol className="status-guide-list">
            {aftersaleStatusOrder.map((id) => (
              <li key={id}>
                <strong>{statusText(id)}</strong>
                <span>{statusHint(id)}</span>
              </li>
            ))}
          </ol>
        </div>
        <button className="btn block" type="button" onClick={onClose}>
          我知道了
        </button>
      </div>
    </div>
  )
}
