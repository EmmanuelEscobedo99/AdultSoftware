import { useEffect, useRef } from 'react'

export function useInView(callback, options) {
  const ref = useRef(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) callbackRef.current(entry.target)
        }
      },
      { threshold: 0.6, ...options },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [options])

  return ref
}
