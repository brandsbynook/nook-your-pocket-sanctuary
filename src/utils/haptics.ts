/**
 * Nook Haptics Utility
 * Cleanly wraps navigator.vibrate with defensive fallback checks and error handling
 * for mobile & browser environments.
 */

export type HapticType = 'light' | 'medium' | 'heavy' | number | number[]

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
 * Safely handles the Navigator Vibration API with graceful fallback.
 *
 * @param type 'light' | 'medium' | 'heavy', a duration in ms, or pattern array
 */
export const triggerHaptic = (type: HapticType = 'light') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      const patterns = {
        light: 12,
        medium: 24,
        heavy: 40,
      }
      let pattern: number | number[]
      if (typeof type === 'string' && type in patterns) {
        pattern = patterns[type as keyof typeof patterns]
      } else if (typeof type === 'number' || Array.isArray(type)) {
        pattern = type
      } else {
        pattern = 12
      }
      navigator.vibrate(pattern)
    } catch {
      // Graceful fallback for non-supported browsers
    }
  }
}

/**
 * Common haptic patterns tailored for gentle sanctuary interactions
 */
export const haptics = {
  light: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy'),
  tap: (duration = 15) => triggerHaptic(duration),
  soft: () => triggerHaptic('light'),
  success: () => triggerHaptic([40, 60, 80]),
  pulse: () => triggerHaptic([30, 50]),
  crumple: () => triggerHaptic([40, 30, 60]),
  notice: () => triggerHaptic([30, 40, 60]),
}

export default haptics
