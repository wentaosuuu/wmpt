/** 三端共用：送达凭证展示 */
export function DeliveryProofView({
  src,
  caption = '送达凭证',
}: {
  src: string
  caption?: string
}) {
  return (
    <div className="delivery-proof">
      <div className="delivery-proof-hd">{caption}</div>
      <img src={src} alt={caption} />
    </div>
  )
}
