import { useMemo, useState } from 'react'
import { useAdmin } from '../store/AdminStore'

/** 已入驻门店列表 */
export function useApprovedStores() {
  const { merchants } = useAdmin()
  return useMemo(
    () => merchants.filter((m) => m.status === 'approved'),
    [merchants],
  )
}

/**
 * 可选门店筛选（含「全部门店」），用于订单 / 配送等跨店列表页。
 */
export function useOptionalStoreFilter() {
  const stores = useApprovedStores()
  const [storeId, setStoreId] = useState('all')

  function matchStore(id: string) {
    return storeId === 'all' || id === storeId
  }

  return { stores, storeId, setStoreId, matchStore }
}
