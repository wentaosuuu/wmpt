import { useCallback, useEffect, useState } from 'react'
import {
  fetchCuisineCategories,
  visibleCuisineChips,
  type CuisineCategory,
} from '../lib/cuisineApi'

export function useCuisineCategories() {
  const [raw, setRaw] = useState<CuisineCategory[]>([])
  const [loaded, setLoaded] = useState(false)

  const reload = useCallback(() => {
    fetchCuisineCategories().then((list) => {
      setRaw(list)
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    reload()
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(reload, 8000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [reload])

  return { chips: visibleCuisineChips(raw), loaded }
}
