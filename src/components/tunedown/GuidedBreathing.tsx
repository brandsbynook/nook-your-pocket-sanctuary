import { useState, useEffect } from 'react'

export type BreathingPatternId = 'box' | '478' | 'soft' | 'tactile-box'

interface PhaseStep {
  label: string
  duration: number
  scale: number
  opacity: number
}

interface PatternConfig {
  id: BreathingPatternId
  name: string
  phases: PhaseStep[]
}

const PATTERNS: PatternConfig[] = [
  {
    id: 'box',
    name: 'Box (4-4-4-4)',
    phases: [
      { label: 'breathe in', duration: 4, scale: 1.25, opacity: 0.95 },
      { label: 'hold', duration: 4, scale: 1.25, opacity: 0.85 },
      { label: 'breathe out', duration: 4, scale: 0.82, opacity: 0.45 },
      { label: 'hold', duration: 4, scale: 0.82, opacity: 0.35 },
    ],
  },
  {
    id: '478',
    name: '4-7-8 Calm',
    phases: [
      { label: 'breathe in', duration: 4, scale: 1.3, opacity: 0.95 },
      { label: 'hold', duration: 7, scale: 1.3, opacity: 0.85 },
      { label: 'breathe out', duration: 8, scale: 0.8, opacity: 0.4 },
    ],
  },
  {
    id: 'soft',
    name: 'Soft 4-4',
    phases: [
      { label: 'breathe in', duration: 4, scale: 1.25, opacity: 0.95 },
      { label: 'breathe out', duration: 4, scale: 0.85, opacity: 0.45 },
    ],
  },
  {
    id: 'tactile-box',
    name: 'Tactile Box Frame',
    phases: [
      { label: 'breathe in', duration: 4, scale: 1.2, opacity: 0.95 },
      { label: 'hold', duration: 4, scale: 1.2, opacity: 0.85 },
      { label: 'breathe out', duration: 4, scale: 0.85, opacity: 0.5 },
      { label: 'hold', duration: 4, scale: 0.85, opacity: 0.4 },
    ],
  },
]

export default function GuidedBreathing() {
  const [patternId, setPatternId] = useState<BreathingPatternId>('box')
  const [phaseIndex, setPhaseIndex] = useState<number>(0)
  const [secondsLeft, setSecondsLeft] = useState<number>(4)
  const [isActive, setIsActive] = useState<boolean>(false)

  const activePattern = PATTERNS.find(p => p.id === patternId) || PATTERNS[0]
  const currentStep = activePattern.phases[phaseIndex] || activePattern.phases[0]

  // Reset phase and timer when pattern changes
  function handleSelectPattern(id: BreathingPatternId) {
    setPatternId(id)
    setPhaseIndex(0)
    const target = PATTERNS.find(p => p.id === id) || PATTERNS[0]
    setSecondsLeft(target.phases[0].duration)
  }

  // Timer interval
  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setPhaseIndex(prevIdx => {
            const nextIdx = (prevIdx + 1) % activePattern.phases.length
            setSecondsLeft(activePattern.phases[nextIdx].duration)
            return nextIdx
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, activePattern])

  function handleTogglePlay() {
    setIsActive(prev => !prev)
  }

  function handleReset() {
    setIsActive(false)
    setPhaseIndex(0)
    setSecondsLeft(activePattern.phases[0].duration)
  }

  // Progress within the active phase: 0 (start) to 1 (end)
  const stepDuration = currentStep.duration
  const fillPercentage = isActive ? Math.max(0, Math.min(100, ((stepDuration - secondsLeft + 1) / stepDuration) * 100)) : 0

  return (
    <div className="flex flex-col items-center justify-between flex-1 py-4 animate-fade-in text-center min-h-0">
      {/* ── Top Spacer (Quiet simplicity) ─────────────────────── */}
      <div className="h-2" />

      {/* ── Main Breathing Canvas / Visualizer ────────────────── */}
      <div className="relative my-auto flex flex-col items-center justify-center min-h-[220px]">
        {patternId === 'tactile-box' ? (
          /* ── Tactile 4-Pill Square Frame Visualizer ─────────── */
          <div
            onClick={handleTogglePlay}
            className="relative w-56 h-56 rounded-3xl border border-[#1E1E26] bg-[#101014] p-5 flex items-center justify-center cursor-pointer select-none group"
          >
            {/* 1. Top Pill Segment (Inhale · Phase 0) */}
            <div className="absolute top-3 left-8 right-8 h-2 rounded-full bg-[#1C1C24] overflow-hidden">
              <div
                className="h-full bg-[#C9B99A] rounded-full transition-all duration-700 ease-out"
                style={{
                  width: phaseIndex === 0 && isActive ? `${fillPercentage}%` : phaseIndex > 0 && isActive ? '100%' : '0%',
                }}
              />
            </div>

            {/* 2. Right Pill Segment (Hold · Phase 1) */}
            <div className="absolute top-8 right-3 bottom-8 w-2 rounded-full bg-[#1C1C24] overflow-hidden flex flex-col justify-start">
              <div
                className="w-full bg-[#C9B99A] rounded-full transition-all duration-700 ease-out"
                style={{
                  height: phaseIndex === 1 && isActive ? `${fillPercentage}%` : phaseIndex > 1 && isActive ? '100%' : '0%',
                }}
              />
            </div>

            {/* 3. Bottom Pill Segment (Exhale · Phase 2) */}
            <div className="absolute bottom-3 left-8 right-8 h-2 rounded-full bg-[#1C1C24] overflow-hidden flex justify-end">
              <div
                className="h-full bg-[#C9B99A] rounded-full transition-all duration-700 ease-out"
                style={{
                  width: phaseIndex === 2 && isActive ? `${fillPercentage}%` : phaseIndex > 2 && isActive ? '100%' : '0%',
                }}
              />
            </div>

            {/* 4. Left Pill Segment (Hold · Phase 3) */}
            <div className="absolute top-8 left-3 bottom-8 w-2 rounded-full bg-[#1C1C24] overflow-hidden flex flex-col justify-end">
              <div
                className="w-full bg-[#C9B99A] rounded-full transition-all duration-700 ease-out"
                style={{
                  height: phaseIndex === 3 && isActive ? `${fillPercentage}%` : '0%',
                }}
              />
            </div>

            {/* Center Core Display */}
            <div className="flex flex-col items-center justify-center text-center">
              {!isActive ? (
                <>
                  <span className="font-serif-nook text-neutral-300 text-lg font-light">
                    Tap to Begin
                  </span>
                  <span className="font-sans text-[0.58rem] tracking-[0.16em] uppercase text-neutral-500 mt-1">
                    box frame
                  </span>
                </>
              ) : (
                <>
                  <span className="font-serif-nook text-neutral-200 text-xl font-light tracking-wide transition-all">
                    {currentStep.label}
                  </span>
                  <span className="font-sans text-[0.65rem] text-[#C9B99A] tabular-nums mt-1 font-medium">
                    {secondsLeft}s
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          /* ── Radial Breathing Orb Visualizer ────────────────── */
          <div
            onClick={handleTogglePlay}
            className="relative flex items-center justify-center w-60 h-60 cursor-pointer select-none group"
          >
            {/* Ambient Radial Atmosphere Glow */}
            <div
              className="absolute w-52 h-52 rounded-full bg-[#C9B99A]/5 blur-3xl pointer-events-none transition-all duration-[3500ms] ease-in-out"
              style={{
                transform: `scale(${isActive ? currentStep.scale * 1.15 : 1})`,
                opacity: isActive ? currentStep.opacity * 0.7 : 0.2,
              }}
            />

            {/* Outer Subtle Ring */}
            <div
              className="absolute w-44 h-44 rounded-full border border-[#C9B99A]/15 transition-all duration-[3500ms] ease-in-out pointer-events-none"
              style={{
                transform: `scale(${isActive ? currentStep.scale * 1.04 : 1})`,
                opacity: isActive ? currentStep.opacity * 0.4 : 0.15,
              }}
            />

            {/* Core Breathing Orb */}
            <div
              className="
                w-36 h-36 rounded-full
                border border-[#C9B99A]/30
                bg-gradient-to-br from-[#181715] via-[#121214] to-[#0A0A0C]
                flex flex-col items-center justify-center
                transition-all duration-[3500ms] ease-in-out
                shadow-2xl group-hover:border-[#C9B99A]/50
              "
              style={{
                transform: `scale(${isActive ? currentStep.scale : 0.98})`,
                borderColor: `rgba(201, 185, 154, ${isActive ? currentStep.opacity * 0.5 : 0.25})`,
              }}
            >
              {!isActive ? (
                <>
                  <span className="font-serif-nook text-neutral-300 text-lg font-light">
                    Tap to Begin
                  </span>
                  <span className="font-sans text-[0.55rem] tracking-[0.14em] uppercase text-neutral-500 mt-0.5">
                    gentle breath
                  </span>
                </>
              ) : (
                <>
                  <span className="font-serif-nook text-neutral-200 text-lg font-light tracking-wide transition-opacity duration-500">
                    {currentStep.label}
                  </span>
                  <span className="font-sans text-[0.62rem] text-[#C9B99A] tabular-nums mt-0.5 font-medium">
                    {secondsLeft}s
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Pattern Selector Pills ────────────────────────────── */}
      <div className="w-full px-2 mb-3">
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {PATTERNS.map(p => {
            const isSelected = p.id === patternId
            return (
              <button
                key={p.id}
                id={`pattern-pill-${p.id}`}
                onClick={() => handleSelectPattern(p.id)}
                className={`
                  px-3 py-1 rounded-full text-[0.58rem] font-sans tracking-wider uppercase transition-all duration-300 focus:outline-none
                  ${isSelected
                    ? 'bg-[#22222C] text-neutral-200 border border-[#C9B99A]/40 shadow-sm'
                    : 'bg-[#141418] text-neutral-500 border border-[#1E1E24] hover:text-neutral-300 hover:border-[#2A2A36]'
                  }
                `}
              >
                {p.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Bottom Controls ───────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          id="breath-toggle-btn"
          onClick={handleTogglePlay}
          className="
            px-5 py-2 border border-[#242430] bg-[#141418] rounded-xl
            font-sans text-neutral-300 text-[0.62rem] tracking-[0.14em] uppercase
            hover:border-[#C9B99A]/40 hover:text-[#C9B99A]
            transition-all duration-300 focus:outline-none
          "
        >
          {isActive ? 'Pause' : 'Start'}
        </button>

        <button
          id="breath-reset-btn"
          onClick={handleReset}
          className="
            px-4 py-2 font-sans text-neutral-500 text-[0.60rem] tracking-[0.14em] uppercase
            hover:text-neutral-300 transition-colors focus:outline-none
          "
        >
          Reset
        </button>
      </div>
    </div>
  )
}
