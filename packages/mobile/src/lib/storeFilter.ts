export function sortStores<
  T extends {
    distanceKm: number
    monthlySales: number
    deliveryFee: number
    status: string
  },
>(list: T[], sort: string) {
  const next = [...list]
  next.sort((a, b) => {
    const openA = a.status === 'closed' ? 1 : 0
    const openB = b.status === 'closed' ? 1 : 0
    if (openA !== openB) return openA - openB
    if (sort === 'distance') return a.distanceKm - b.distanceKm
    if (sort === 'sales') return b.monthlySales - a.monthlySales
    if (sort === 'deliveryFee') return a.deliveryFee - b.deliveryFee
    return b.monthlySales - a.monthlySales || a.distanceKm - b.distanceKm
  })
  return next
}
