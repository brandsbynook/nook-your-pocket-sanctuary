/**
 * Nook Haptics Utility
 * Cleanly wraps navigator.vibrate with defensive fallback checks and error handling
 * for mobile & browser environments.
 */

export function isHapticsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'vibrate' in navigator &&
    typeof navigator.vibrate === 'function'
  )
}

/**
 * Triggers a vibration pattern if supported by the browser/device.
 * Safely fails silently if unsupported or blocked by user gesture requirements.
 *
 * @param pattern Duration in ms, or an array of duration/pause intervals
 * @returns boolean indicating if the vibration was dispatched
 */
export function triggerHaptic(pattern: number | number[] = 18): boolean {
  if (!isHapticsSupported()) {
    return false
  }

  try {
    return navigator.vibrate(pattern)
  } catch {
    // Graceful fallback for security context or permission errors
    return false
  }
}

/**
 * Common haptic patterns tailored for gentle sanctuary interactions
 */
export const haptics = {
  /** Delicate single tap for button/toggle presses */
  tap: (duration = 15) => triggerHaptic(duration),

  /** Soft confirmation pulse */
  soft: () => triggerHaptic([12]),

  /** Double subtle pulse for completions */
  success: () => triggerHaptic([40, 60, 80]),

  /** Gentle double beat for state transitions */
  pulse: () => triggerHaptic([30, 50]),

  /** Texture crumple pulse */
  crumple: () => triggerHaptic([40, 30, 60]),

  /** Warning or boundary encounter */
  notice: () => triggerHaptic([30, 40, 60]),
}

export default haptics
