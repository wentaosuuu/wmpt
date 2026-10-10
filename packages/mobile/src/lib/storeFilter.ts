export function sortStores<
  T extends {
    distanceKm: number
    rating: number
    monthlySales: number
    deliveryFee: number
    etaMin: number
    status: string
  },
>(list: T[], sort: string) {
  const next = [...list]
  next.sort((a, b) => {
    const openA = a.status === 'closed' ? 1 : 0
    const openB = b.status === 'closed' ? 1 : 0
    if (openA !== openB) return openA - openB
    if (sort === 'distance') return a.distanceKm - b.distanceKm
    if (sort === 'rating') return b.rating - a.rating
    if (sort === 'sales') return b.monthlySales - a.monthlySales
    if (sort === 'deliveryFee') return a.deliveryFee - b.deliveryFee
    if (sort === 'eta') return a.etaMin - b.etaMin
    return b.rating * 100 + b.monthlySales / 100 - (a.rating * 100 + a.monthlySales / 100)
  })
  return next
}
