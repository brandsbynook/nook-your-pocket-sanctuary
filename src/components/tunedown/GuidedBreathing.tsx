import { useState, useEffect, useRef, useCallback } from 'react'

/* ─── Pattern Definitions (2 Essential Cadences) ─── */
export type PatternId = 'soft' | 'box'

type BoxEdge = 'top' | 'right' | 'bottom' | 'left'

interface BoxPhase {
  kind: 'box'
  name: string
  duration: number
  edge: BoxEdge
}

interface OrbPhase {
  kind: 'orb'
  name: string
  duration: number
  scale: number
  opacity: number
}

type Phase = BoxPhase | OrbPhase

interface Pattern {
  id: PatternId
  label: string
  subline: string
  phases: Phase[]
}

const PATTERNS: Pattern[] = [
  {
    id: 'soft',
    label: 'Soft (4-4)',
    subline: 'equal-ratio steady calm breath (4–4)',
    phases: [
      { kind: 'orb', name: 'Inhale', duration: 4, scale: 1.35, opacity: 0.75 },
      { kind: 'orb', name: 'Exhale', duration: 4, scale: 1.00, opacity: 0.30 },
    ],
  },
  {
    id: 'box',
    label: 'Box Breathing (4-4-4-4)',
    subline: 'equal-sided focus & still anchor',
    phases: [
      { kind: 'box', name: 'Inhale', duration: 4, edge: 'top'    },
      { kind: 'box', name: 'Hold',   duration: 4, edge: 'right'  },
      { kind: 'box', name: 'Exhale', duration: 4, edge: 'bottom' },
      { kind: 'box', name: 'Hold',   duration: 4, edge: 'left'   },
    ],
  },
]

/* ─── Single-Line Physiological Validation Cues ─────────────── */
const PHYSIOLOGICAL_CUES = [
  'Longer exhales engage the vagal brake.',
  'Paced rhythm lowers sympathetic arousal.',
  'Steady breath signals safety to the brainstem.',
  'Balanced cadence stabilizes autonomic tone.',
  'Controlled pacing eases nervous system strain.',
  'A slower rhythm mechanically slows heart rate.',
]

interface GuidedBreathingProps {
  initialPattern?: PatternId
}

export default function GuidedBreathing({ initialPattern = 'soft' }: GuidedBreathingProps) {
  // Default active technique
  const [patternId, setPatternId] = useState<PatternId>(initialPattern)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(4)
  const [isActive, setIsActive] = useState(false)

  // Physiological cue state with 15s cross-fade
  const [cueIndex, setCueIndex] = useState(() => Math.floor(Math.random() * PHYSIOLOGICAL_CUES.length))
  const [cueVisible, setCueVisible] = useState(true)

  const phaseIndexRef = useRef(phaseIndex)
  const secondsLeftRef = useRef(secondsLeft)
  const isActiveRef = useRef(isActive)
  const patternRef = useRef(PATTERNS[0])

  const activePattern = PATTERNS.find(p => p.id === patternId) || PATTERNS[0]
  const currentPhase = activePattern.phases[phaseIndex]

  // Keep refs in sync
  phaseIndexRef.current = phaseIndex
  secondsLeftRef.current = secondsLeft
  isActiveRef.current = isActive
  patternRef.current = activePattern

  // 15-second gentle cross-fade rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCueVisible(false)
      setTimeout(() => {
        setCueIndex(prev => (prev + 1) % PHYSIOLOGICAL_CUES.length)
        setCueVisible(true)
      }, 1000)
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  /* ── Deterministic 1-second tick engine ───────────────────── */
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [])

  const startTick = useCallback(() => {
    stopTick()
    tickRef.current = setInterval(() => {
      const pattern = patternRef.current
      const prevSeconds = secondsLeftRef.current
      const prevIndex = phaseIndexRef.current

      if (prevSeconds > 1) {
        const next = prevSeconds - 1
        secondsLeftRef.current = next
        setSecondsLeft(next)
      } else {
        // Advance to next phase
        const nextIndex = (prevIndex + 1) % pattern.phases.length
        const nextDuration = pattern.phases[nextIndex].duration
        phaseIndexRef.current = nextIndex
        secondsLeftRef.current = nextDuration
        setPhaseIndex(nextIndex)
        setSecondsLeft(nextDuration)
      }
    }, 1000)
  }, [stopTick])

  /* ── isActive toggle ──────────────────────────────────────── */
  useEffect(() => {
    if (isActive) {
      startTick()
    } else {
      stopTick()
    }
    return stopTick
  }, [isActive, startTick, stopTick])

  /* ── Pattern switch ───────────────────────────────────────── */
  function handleSelectPattern(id: PatternId) {
    if (id === patternId) return
    stopTick()
    const pat = PATTERNS.find(p => p.id === id) || PATTERNS[0]
    setPatternId(id)
    setPhaseIndex(0)
    setSecondsLeft(pat.phases[0].duration)
    phaseIndexRef.current = 0
    secondsLeftRef.current = pat.phases[0].duration
    patternRef.current = pat
    setIsActive(false)
  }

  /* ── Tap toggle ───────────────────────────────────────────── */
  function handleTogglePlay(e: React.MouseEvent) {
    e.stopPropagation()
    setIsActive(prev => !prev)
  }

  /* ── Orb CSS transition duration (tied to phase duration) ─── */
  function orbTransitionStyle(phase: OrbPhase) {
    const durMs = phase.duration * 1000
    const easing = phase.name === 'Inhale' ? 'ease-out'
                 : phase.name === 'Exhale' ? 'ease-in-out'
                 : 'linear'
    return {
      transform: isActive ? `scale(${phase.scale})` : 'scale(1.0)',
      opacity: isActive ? phase.opacity : 0.3,
      transition: isActive
        ? `transform ${durMs}ms ${easing}, opacity ${durMs}ms ease-in-out`
        : 'transform 800ms ease-in-out, opacity 800ms ease-in-out',
    }
  }

  return (
    <div className="flex flex-col items-center justify-between flex-1 py-2 animate-fade-in text-center min-h-0 w-full select-none">
      {/* ── 1. Top Document Flow (Pills & Mantra) ── */}
      <div className="w-full flex flex-col items-center shrink-0">
        {/* Row of Pill Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="pattern-pill-soft"
            onClick={() => handleSelectPattern('soft')}
            className={
              patternId === 'soft'
                ? 'border border-[#52525B] bg-[#18181B] text-[#E5E5E7] px-3.5 py-1.5 rounded-full text-xs font-sans'
                : 'border border-[#222225] text-[#71717A] hover:text-[#E5E5E7] px-3.5 py-1.5 rounded-full text-xs font-sans transition-colors'
            }
          >
            Soft (4-4)
          </button>

          <button
            type="button"
            id="pattern-pill-box"
            onClick={() => handleSelectPattern('box')}
            className={
              patternId === 'box'
                ? 'border border-[#52525B] bg-[#18181B] text-[#E5E5E7] px-3.5 py-1.5 rounded-full text-xs font-sans'
                : 'border border-[#222225] text-[#71717A] hover:text-[#E5E5E7] px-3.5 py-1.5 rounded-full text-xs font-sans transition-colors'
            }
          >
            Box Breathing (4-4-4-4)
          </button>
        </div>

        {/* Physiological Cue */}
        <p
          className="font-serif-nook text-sm sm:text-base text-[#A1A1AA] italic font-normal tracking-wide text-center mt-3 transition-opacity duration-700"
          style={{ opacity: cueVisible ? 1 : 0 }}
        >
          {PHYSIOLOGICAL_CUES[cueIndex]}
        </p>
      </div>

      {/* ── 2. Central Interactive Visualizer Float in Center ── */}
      <div className="relative my-auto flex flex-col items-center justify-center min-h-[240px]">
        {patternId === 'box' ? (
          /* ── 2D BOX: SVG Square ── */
          <div
            onClick={handleTogglePlay}
            className="relative flex items-center justify-center cursor-pointer group select-none"
            style={{ width: '220px', height: '220px' }}
            role="button"
            aria-label={isActive ? 'Pause breathing' : 'Start breathing'}
          >
            <svg
              viewBox="0 0 220 220"
              width="220"
              height="220"
              className="absolute inset-0 block overflow-visible"
            >
              {/* Base track */}
              <rect
                x="10" y="10"
                width="200" height="200"
                rx="16" ry="16"
                fill="none"
                stroke="#222225"
                strokeWidth="1.5"
              />

              {/* Progressive stroke fill */}
              <rect
                x="10" y="10"
                width="200" height="200"
                rx="16" ry="16"
                fill="none"
                stroke="#E5E5E7"
                strokeWidth="1.5"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray="100"
                style={{
                  animationName: 'boxBreatheTracer',
                  animationDuration: '16s',
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                  animationPlayState: isActive ? 'running' : 'paused',
                  strokeDashoffset: isActive ? undefined : 100,
                  filter: 'none',
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}
              />
            </svg>

            {/* Center Dynamic Phase Display */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center gap-0.5 pointer-events-none">
              {!isActive && phaseIndex === 0 && secondsLeft === activePattern.phases[0].duration ? (
                <span className="font-serif-nook text-sm text-[#A1A1AA] tracking-wider uppercase transition-colors duration-200">
                  tap to begin
                </span>
              ) : (
                <>
                  <span className="font-serif-nook text-[#E5E5E7] text-[16px] font-light tracking-wide capitalize">
                    {currentPhase.name}
                  </span>
                  <span className="font-sans text-xs tracking-wider text-[#71717A] tabular-nums mt-0.5">
                    {secondsLeft}s
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          /* ── ORB: Phase-Driven Expansion / Hold / Contraction ── */
          <div
            onClick={handleTogglePlay}
            className="relative flex items-center justify-center w-64 h-64 cursor-pointer group"
            role="button"
            aria-label={isActive ? 'Pause breathing' : 'Start breathing'}
          >
            {/* Ambient atmosphere */}
            <div
              className="absolute w-56 h-56 rounded-full bg-[#E5E5E7]/5 blur-3xl pointer-events-none"
              style={{
                transform: isActive
                  ? `scale(${(currentPhase as OrbPhase).scale * 1.15})`
                  : 'scale(1)',
                opacity: isActive ? (currentPhase as OrbPhase).opacity * 0.6 : 0.1,
                transition: isActive
                  ? `transform ${(currentPhase as OrbPhase).duration * 1000}ms ease-in-out, opacity ${(currentPhase as OrbPhase).duration * 1000}ms ease-in-out`
                  : 'all 800ms ease',
              }}
            />

            {/* Outer breath ring */}
            <div
              className="absolute w-48 h-48 rounded-full border border-[#E5E5E7]/12 pointer-events-none"
              style={{
                transform: isActive
                  ? `scale(${(currentPhase as OrbPhase).scale * 1.04})`
                  : 'scale(1)',
                opacity: isActive ? (currentPhase as OrbPhase).opacity * 0.35 : 0.12,
                transition: isActive
                  ? `transform ${(currentPhase as OrbPhase).duration * 1000}ms ease-in-out, opacity ${(currentPhase as OrbPhase).duration * 1000}ms ease-in-out`
                  : 'all 800ms ease',
              }}
            />

            {/* Core breathing orb */}
            <div
              className="
                w-36 h-36 rounded-full
                bg-[#141416]
                border border-[#222225]
                flex flex-col items-center justify-center
                group-hover:border-[#3F3F46]
                pointer-events-none
              "
              style={orbTransitionStyle(currentPhase as OrbPhase)}
            >
              {!isActive && phaseIndex === 0 && secondsLeft === activePattern.phases[0].duration ? (
                <span className="font-serif-nook text-sm text-[#A1A1AA] tracking-wider uppercase">
                  tap to begin
                </span>
              ) : (
                <>
                  <span className="font-serif-nook text-[#E5E5E7] text-[16px] font-light tracking-wide capitalize">
                    {currentPhase.name}
                  </span>
                  <span className="font-sans text-xs tracking-wider text-[#71717A] tabular-nums mt-0.5">
                    {secondsLeft}s
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

