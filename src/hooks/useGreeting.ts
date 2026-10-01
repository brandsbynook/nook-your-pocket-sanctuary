import { useState } from 'react'

export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night'

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  if (hour >= 4 && hour < 6)   return 'dawn'
  if (hour >= 6 && hour < 12)  return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

const GREETINGS_POOL: Record<TimeOfDay, string[]> = {
  dawn: [
    "You're up early.",
    "The world is quiet. So are we.",
    "The day is still new.",
    "",
  ],
  morning: [
    "A clean page.",
    "Morning. Start whenever you're ready.",
    "Take what you need from here.",
    "",
  ],
  afternoon: [
    "A quiet pause.",
    "Step away for a moment.",
    "Midday.",
    "",
  ],
  evening: [
    "Setting the day down.",
    "Winding down.",
    "Offline for the night.",
    "",
  ],
  night: [
    "Late hours. Quiet space.",
    "Rest when you're ready.",
    "The quiet hours are yours.",
    "",
  ],
}

/**
 * Returns a static time-of-day greeting selected once on mount.
 * Stays completely static during the session (no mid-session flickering).
 * Includes a 25% chance of returning "" for complete quietness.
 */
export function useGreeting(): string {
  const [greeting] = useState<string>(() => {
    const tod = getTimeOfDay()
    const pool = GREETINGS_POOL[tod]
    const randomIndex = Math.floor(Math.random() * pool.length)
    return pool[randomIndex]
  })

  return greeting
}

export default useGreeting
