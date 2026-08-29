import { useMemo } from 'react'

interface Greeting {
  headline: string
  subline: string
}

function getTimeOfDay(): 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours()
  if (hour >= 4 && hour < 6)   return 'dawn'
  if (hour >= 6 && hour < 12)  return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

const greetings: Record<string, Greeting[]> = {
  dawn: [
    { headline: "You're up early.", subline: "The world is still quiet. So are we." },
    { headline: "The softest hour.", subline: "No one needs anything from you yet." },
  ],
  morning: [
    { headline: "Whenever you're ready,", subline: "however you choose." },
    { headline: "Good morning, gently.", subline: "There's no rush to begin." },
    { headline: "The day is still new.", subline: "It can hold whatever you bring to it." },
  ],
  afternoon: [
    { headline: "You made it to midday.", subline: "That's enough." },
    { headline: "Pause, just for a moment.", subline: "The afternoon doesn't need anything from you." },
    { headline: "Still here.", subline: "Still okay." },
  ],
  evening: [
    { headline: "The day is winding down.", subline: "You can too." },
    { headline: "Softly, now.", subline: "Let the evening carry what's left." },
    { headline: "You did what you could.", subline: "That was enough." },
  ],
  night: [
    { headline: "It's late and quiet.", subline: "A good time to just… be." },
    { headline: "No thoughts required.", subline: "Just rest here for a moment." },
    { headline: "The world can wait.", subline: "This moment is yours." },
  ],
}

import { getUserNickname } from '../utils/storage'

export function useGreeting(): Greeting {
  return useMemo(() => {
    const tod = getTimeOfDay()
    const pool = greetings[tod]
    const base = pool[Math.floor(Math.random() * pool.length)]
    const nickname = getUserNickname()
    if (nickname && base.headline.endsWith(',')) {
      return {
        headline: `${base.headline.slice(0, -1)}, ${nickname},`,
        subline: base.subline,
      }
    }
    return base
  }, [])
}
