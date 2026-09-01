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

      {/* ── 1. Pattern Switcher & Static Subtle Cue ────────────── */}
      <div
        className={`
          w-full flex flex-col items-center pt-1 shrink-0 transition-all duration-700
          ${isActive ? 'opacity-0 pointer-events-none -translate-y-2' : 'opacity-100 translate-y-0'}
        `}
      >
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {PATTERNS.map(p => {
            const sel = p.id === patternId
            return (
              <button
                key={p.id}
                id={`pattern-pill-${p.id}`}
                onClick={() => handleSelectPattern(p.id)}
                className={`
                  px-3.5 py-1.5 rounded-full font-serif-nook text-xs tracking-wide transition-all duration-300 focus:outline-none cursor-pointer
                  ${sel
                    ? 'bg-[#1D1B16] text-[#FFFFFF] border border-[#C9B99A]/50 shadow-sm'
                    : 'bg-[#101014] text-neutral-500 border border-[#1E1E26] hover:text-neutral-300 hover:border-[#2A2A38]'
                  }
                `}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Single-Line Physiological Validation Cue */}
        <div className="mt-6 mb-8 max-w-xs mx-auto overflow-hidden px-2 w-full">
          <p
            className="font-serif-nook italic font-normal text-stone-400/80 text-sm tracking-wide text-center whitespace-nowrap truncate transition-opacity duration-1000"
            style={{ opacity: cueVisible && !isActive ? 1 : 0 }}
          >
            {PHYSIOLOGICAL_CUES[cueIndex]}
          </p>
        </div>
      </div>

      {/* ── 2. Central Interactive Visualizer ────────────────── */}
      <div className="relative my-auto flex flex-col items-center justify-center min-h-[240px]">

        {patternId === 'box' ? (
          /* ── BOX: Continuous Clockwise Progressive Rounded Tracer ── */
          <div
            onClick={handleTogglePlay}
            className="relative flex items-center justify-center cursor-pointer group"
            style={{ width: '220px', height: '220px' }}
            role="button"
            aria-label={isActive ? 'Pause breathing' : 'Start breathing'}
          >
            <svg
              viewBox="0 0 220 220"
              width="220"
              height="220"
              style={{ overflow: 'visible', position: 'absolute', inset: 0 }}
            >
              {/* ── Background muted track ─────────────────────────── */}
              <rect
                x="10" y="10"
                width="200" height="200"
                rx="28" ry="28"
                fill="transparent"
                stroke="rgba(64,64,80,0.4)"
                strokeWidth="2.5"
              />

              {/* ── Continuous clockwise glowing tracer ── */}
              <rect
                x="10" y="10"
                width="200" height="200"
                rx="28" ry="28"
                fill="transparent"
                stroke="#FEF3C7"
                strokeWidth="3.5"
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
                  filter: isActive
                    ? 'drop-shadow(0 0 6px rgba(254,243,199,0.5)) drop-shadow(0 0 12px rgba(254,243,199,0.25))'
                    : 'none',
                  opacity: isActive ? 0.90 : 0,
                  transition: 'opacity 0.5s ease',
                }}
              />
            </svg>

            {/* ── Center Dynamic Phase Display (Muted Serif Typography) ── */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center gap-0.5 pointer-events-none">
              {!isActive && phaseIndex === 0 && secondsLeft === activePattern.phases[0].duration ? (
                <span className="font-serif-nook text-stone-400 text-base font-light italic group-hover:text-neutral-200 transition-colors duration-200">
                  tap to begin
                </span>
              ) : (
                <>
                  <span className="font-serif-nook text-neutral-100 text-2xl font-light tracking-wide capitalize">
                    {currentPhase.name}
                  </span>
                  <span className="font-serif-nook text-stone-400 text-base italic font-normal tabular-nums mt-0.5">
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
                bg-gradient-to-br from-[#181715] via-[#121214] to-[#0A0A0C]
                border border-[#C9B99A]/25
                flex flex-col items-center justify-center
                shadow-2xl group-hover:border-[#C9B99A]/45
                pointer-events-none
              "
              style={orbTransitionStyle(currentPhase as OrbPhase)}
            >
              {!isActive && phaseIndex === 0 && secondsLeft === activePattern.phases[0].duration ? (
                <span className="font-serif-nook text-stone-400 text-base font-light italic">
                  tap to begin
                </span>
              ) : (
                <>
                  <span className="font-serif-nook text-neutral-100 text-xl font-light tracking-wide capitalize">
                    {currentPhase.name}
                  </span>
                  <span className="font-serif-nook text-stone-400 text-sm italic font-normal mt-0.5 tabular-nums">
                    {secondsLeft}s
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Quiet Reset ───────────────────────────────────── */}
      <div className="h-8 flex items-center justify-center shrink-0">
        {(isActive || phaseIndex > 0 || secondsLeft !== activePattern.phases[0].duration) && (
          <button
            id="breath-reset-btn"
            onClick={handleReset}
            className="font-serif-nook text-xs tracking-wider uppercase text-neutral-600 hover:text-neutral-400 transition-colors focus:outline-none cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
