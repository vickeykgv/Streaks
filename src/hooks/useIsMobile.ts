import { useState, useEffect } from 'react'

const MOBILE_QUERY = '(max-width: 1023px)'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY)
    const sync = (e?: MediaQueryListEvent) => setIsMobile(e ? e.matches : media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return isMobile
}
