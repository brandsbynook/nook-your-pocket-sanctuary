import { useState, useEffect, useRef, useCallback } from 'react'
import BottomControlsDock from './BottomControlsDock'

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
    label: 'Unhurried Flow',
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

  /* ── Reset ────────────────────────────────────────────────── */
  function handleReset(e: React.MouseEvent) {
    e.stopPropagation()
    stopTick()
    setIsActive(false)
    setPhaseIndex(0)
    setSecondsLeft(activePattern.phases[0].duration)
    phaseIndexRef.current = 0
    secondsLeftRef.current = activePattern.phases[0].duration
  }

  /* ── Orb CSS transition duration (tied to phase duration) ─── */
  function orbTransitionStyle(phase: OrbPhase) {
    const durMs = phase.duration * 1000
    const easing = phase.name === 'Inhale' ? 'ease-out'
                 : phase.name === 'Exhale' ? 'ease-in-out'
                 : 'linear' // Hold: instant, no re-scale
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

      {/* ── 1. Static Subtle Cue (Top Mode Switcher Removed) ────── */}
      <div
        className={`
          w-full flex flex-col items-center pt-2 shrink-0 transition-all duration-700
          ${isActive ? 'opacity-0 pointer-events-none -translate-y-2' : 'opacity-100 translate-y-0'}
        `}
      >
        {/* Single-Line Physiological Validation Cue */}
        <div className="mb-4 max-w-xs mx-auto overflow-hidden px-2 w-full">
          <p
            className="font-serif-nook italic text-[#8C8275] text-xs tracking-wider text-center whitespace-nowrap truncate transition-opacity duration-1000"
            style={{ opacity: cueVisible && !isActive ? 1 : 0 }}
          >
            {PHYSIOLOGICAL_CUES[cueIndex]}
          </p>
        </div>
      </div>

      {/* ── 2. Central Interactive Visualizer ────────────────── */}
      <div className="relative my-auto flex flex-col items-center justify-center min-h-[240px]">

        {patternId === 'box' ? (
          /* ── 2D BOX: SVG Square with rx="16" ry="16", 1.5px Track (#2C2926) & Animated 1.5px Fill (#EAE5DC) ── */
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
              {/* ── Base track 1.5px stroke (#2C2926) ── */}
              <rect
                x="10" y="10"
                width="200" height="200"
                rx="16" ry="16"
                fill="none"
                stroke="#2C2926"
                strokeWidth="1.5"
              />

              {/* ── Crisp #EAE5DC 1.5px progressive stroke fill (Smoothly following rx=16 ry=16 rounded corners) ── */}
              <rect
                x="10" y="10"
                width="200" height="200"
                rx="16" ry="16"
                fill="none"
                stroke="#EAE5DC"
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

            {/* ── Center Dynamic Phase Display ── */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center gap-0.5 pointer-events-none">
              {!isActive && phaseIndex === 0 && secondsLeft === activePattern.phases[0].duration ? (
                <span className="font-serif-nook text-xs tracking-wider text-[#8C8275] italic group-hover:text-[#EAE5DC] transition-colors duration-200">
                  tap to begin
                </span>
              ) : (
                <>
                  <span className="font-serif-nook text-[#EAE5DC] text-[16px] font-light tracking-wide capitalize">
                    {currentPhase.name}
                  </span>
                  <span className="font-sans text-xs tracking-wider text-[#8C8275] tabular-nums mt-0.5">
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
              className="absolute w-56 h-56 rounded-full bg-[#C9B99A]/5 blur-3xl pointer-events-none"
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
              className="absolute w-48 h-48 rounded-full border border-[#C9B99A]/12 pointer-events-none"
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
                bg-[#161412]
                border border-[#2C2926]
                flex flex-col items-center justify-center
                group-hover:border-[#3A3632]
                pointer-events-none
              "
              style={orbTransitionStyle(currentPhase as OrbPhase)}
            >
              {!isActive && phaseIndex === 0 && secondsLeft === activePattern.phases[0].duration ? (
                <span className="font-serif-nook text-xs tracking-wider text-[#8C8275] italic">
                  tap to begin
                </span>
              ) : (
                <>
                  <span className="font-serif-nook text-[#EAE5DC] text-[16px] font-light tracking-wide capitalize">
                    {currentPhase.name}
                  </span>
                  <span className="font-sans text-xs tracking-wider text-[#8C8275] tabular-nums mt-0.5">
                    {secondsLeft}s
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Standardized Unified Bottom Controls Dock ────────── */}
      <BottomControlsDock>
        {/* Mode Segmented Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            id="pattern-pill-soft"
            onClick={() => handleSelectPattern('soft')}
            className={`
              px-3.5 py-1 rounded-full text-xs transition-colors cursor-pointer focus:outline-none select-none
              ${patternId === 'soft'
                ? 'bg-[#2C2926] text-[#EAE5DC] font-medium'
                : 'text-[#8C8275] hover:text-[#EAE5DC]'
              }
            `}
          >
            4-4
          </button>

          <button
            type="button"
            id="pattern-pill-box"
            onClick={() => handleSelectPattern('box')}
            className={`
              px-3.5 py-1 rounded-full text-xs transition-colors cursor-pointer focus:outline-none select-none
              ${patternId === 'box'
                ? 'bg-[#2C2926] text-[#EAE5DC] font-medium'
                : 'text-[#8C8275] hover:text-[#EAE5DC]'
              }
            `}
          >
            4-4-4-4
          </button>
        </div>

        {/* Subtle 1px vertical line divider */}
        <div className="h-4 w-[1px] bg-[#2C2926]" />

        {/* Reset Button */}
        <button
          type="button"
          id="breath-reset-btn"
          onClick={handleReset}
          className="text-[#8C8275] hover:text-[#EAE5DC] px-3 py-1 text-xs uppercase tracking-wider transition-colors focus:outline-none cursor-pointer select-none"
        >
          Reset
        </button>
      </BottomControlsDock>
    </div>
  )
}
