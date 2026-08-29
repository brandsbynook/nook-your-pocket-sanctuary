import { useState, useEffect } from 'react'

type BreathPhase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out'

const PHASE_CONFIG: Record<
  BreathPhase,
  { label: string; sublabel: string; duration: number; next: BreathPhase; scale: number; opacity: number }
> = {
  inhale: {
    label: 'breathe in',
    sublabel: 'filling softly with air',
    duration: 4,
    next: 'hold-in',
    scale: 1.35,
    opacity: 0.95,
  },
  'hold-in': {
    label: 'hold gently',
    sublabel: 'still and quiet',
    duration: 4,
    next: 'exhale',
    scale: 1.35,
    opacity: 0.85,
  },
  exhale: {
    label: 'release',
    sublabel: 'letting everything go',
    duration: 4,
    next: 'hold-out',
    scale: 0.8,
    opacity: 0.35,
  },
  'hold-out': {
    label: 'rest',
    sublabel: 'empty and peaceful',
    duration: 4,
    next: 'inhale',
    scale: 0.8,
    opacity: 0.25,
  },
}

export default function GuidedBreathing() {
  const [phase, setPhase] = useState<BreathPhase>('inhale')
  const [secondsLeft, setSecondsLeft] = useState<number>(4)
  const [isActive, setIsActive] = useState<boolean>(true)

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          const nextPhase = PHASE_CONFIG[phase].next
          setPhase(nextPhase)
          return PHASE_CONFIG[nextPhase].duration
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, phase])

  function handleReset() {
    setPhase('inhale')
    setSecondsLeft(4)
    setIsActive(true)
  }

  const currentConfig = PHASE_CONFIG[phase]

  return (
    <div className="flex flex-col items-center justify-between flex-1 py-4 animate-fade-in text-center min-h-0">
      {/* Top hint */}
      <p className="font-serif-nook text-[#71717A] text-[0.95rem] font-light italic">
        Follow the circle's rhythm. There is no right or wrong way.
      </p>

      {/* Pulsing Breathing Circle */}
      <div className="relative my-auto flex items-center justify-center w-64 h-64">
        {/* Soft atmospheric ambient glow */}
        <div
          className="absolute w-52 h-52 rounded-full bg-[#C9B99A]/10 blur-3xl pointer-events-none transition-all duration-[4000ms] ease-in-out"
          style={{
            transform: `scale(${currentConfig.scale * 1.2})`,
            opacity: currentConfig.opacity * 0.8,
          }}
        />

        {/* Outer subtle ring */}
        <div
          className="absolute w-44 h-44 rounded-full border border-[#C9B99A]/20 transition-all duration-[4000ms] ease-in-out"
          style={{
            transform: `scale(${currentConfig.scale * 1.05})`,
            opacity: currentConfig.opacity * 0.5,
          }}
        />

        {/* Core Glowing Orb */}
        <div
          className="w-36 h-36 rounded-full border border-[#C9B99A]/40 bg-gradient-to-br from-[#1F1C18] to-[#121212] flex flex-col items-center justify-center transition-all duration-[4000ms] ease-in-out shadow-2xl"
          style={{
            transform: `scale(${currentConfig.scale})`,
            borderColor: `rgba(201, 185, 154, ${currentConfig.opacity * 0.6})`,
          }}
        >
          <span className="font-serif-nook text-[#E5E0D8] text-lg font-light tracking-wider transition-opacity duration-700">
            {currentConfig.label}
          </span>
          <span className="font-sans text-[0.62rem] text-[#71717A] tabular-nums mt-1">
            {secondsLeft}s
          </span>
        </div>
      </div>

      {/* Sublabel status */}
      <p className="font-sans text-[#52525B] text-[0.65rem] tracking-[0.14em] uppercase mb-4 h-4">
        {currentConfig.sublabel}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          id="breath-toggle-btn"
          onClick={() => setIsActive(!isActive)}
          className="
            px-5 py-2 border border-[#2A2A2A]
            font-sans text-[#E5E0D8] text-[0.65rem] tracking-[0.14em] uppercase
            hover:border-[#C9B99A]/40 hover:text-[#C9B99A]
            transition-all duration-300 focus:outline-none
          "
        >
          {isActive ? 'Pause' : 'Resume'}
        </button>
        <button
          id="breath-reset-btn"
          onClick={handleReset}
          className="
            px-4 py-2 font-sans text-[#52525B] text-[0.62rem] tracking-[0.14em] uppercase
            hover:text-[#71717A] transition-colors focus:outline-none
          "
        >
          Reset
        </button>
      </div>
    </div>
  )
}
