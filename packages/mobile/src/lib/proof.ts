/** 示例送达凭证图（原型演示用，避免依赖 mock） */
export function sampleDeliveryProof(caption = '送达凭证') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#dbeafe"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient></defs>
  <rect width="640" height="480" fill="url(#g)"/>
  <rect x="48" y="56" width="544" height="368" rx="20" fill="#fff" stroke="#cbd5e1" stroke-width="2"/>
  <circle cx="180" cy="200" r="48" fill="#94a3b8"/>
  <rect x="260" y="170" width="240" height="22" rx="6" fill="#cbd5e1"/>
  <rect x="260" y="210" width="180" height="16" rx="6" fill="#e2e8f0"/>
  <text x="320" y="320" text-anchor="middle" font-size="28" fill="#334155" font-family="system-ui,sans-serif">${caption}</text>
  <text x="320" y="360" text-anchor="middle" font-size="18" fill="#64748b" font-family="system-ui,sans-serif">门口放置 · 已拍照存证</text>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
