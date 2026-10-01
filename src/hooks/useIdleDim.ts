import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Adaptive Ambient Dimming Hook (Intentional & State-Gated)
 * 
 * When `enabled` is false:
 * - Controls remain strictly visible (`isControlsVisible: true`).
 * - No inactivity timers are started, and event listeners are bypassed/cleaned up.
 * 
 * When `enabled` is true:
 * - Automatically dims chrome controls after `idleTimeout` (default 5000ms) of inactivity.
 * - Resets on user interaction ('pointerdown', 'touchstart', 'keydown').
 */
export function useIdleDim(enabled = true, idleTimeout = 5000) {
  const [isControlsVisible, setIsControlsVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const wake = useCallback(() => {
    setIsControlsVisible(true)
    clearTimer()
    if (!enabled) return

    timerRef.current = setTimeout(() => {
      setIsControlsVisible(false)
    }, idleTimeout)
  }, [clearTimer, enabled, idleTimeout])

  useEffect(() => {
    if (!enabled) {
      setIsControlsVisible(true)
      clearTimer()
      return
    }

    // Begin countdown on idle when enabled
    wake()

    const handleActivity = () => {
      wake()
    }

    const events = ['pointerdown', 'touchstart', 'keydown'] as const
    events.forEach(evt => {
      window.addEventListener(evt, handleActivity, { passive: true })
    })

    return () => {
      clearTimer()
      events.forEach(evt => {
        window.removeEventListener(evt, handleActivity)
      })
    }
  }, [enabled, wake, clearTimer])

  return { isControlsVisible, wake }
}

export default useIdleDim
