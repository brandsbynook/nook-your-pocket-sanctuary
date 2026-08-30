import { useState, useEffect, useRef, useCallback } from 'react'

/* ─── Pattern Definitions ───────────────────────────────────── */
export type PatternId = 'box' | '478' | 'soft'

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
    id: 'box',
    label: 'BOX (4-4-4-4)',
    subline: 'stabilizes autonomic nervous system · vagal brake engaged',
    phases: [
      { kind: 'box', name: 'Inhale', duration: 4, edge: 'top'    },
      { kind: 'box', name: 'Hold',   duration: 4, edge: 'right'  },
      { kind: 'box', name: 'Exhale', duration: 4, edge: 'bottom' },
      { kind: 'box', name: 'Hold',   duration: 4, edge: 'left'   },
    ],
  },
  {
    id: '478',
    label: '4-7-8 CALM',
    subline: 'downregulates sympathetic arousal · restores prefrontal calm',
    phases: [
      { kind: 'orb', name: 'Inhale', duration: 4, scale: 1.45, opacity: 0.80 },
      { kind: 'orb', name: 'Hold',   duration: 7, scale: 1.45, opacity: 0.80 },
      { kind: 'orb', name: 'Exhale', duration: 8, scale: 1.00, opacity: 0.30 },
    ],
  },
  {
    id: 'soft',
    label: 'SOFT 4-4',
    subline: 'regulates respiratory sinus arrhythmia · steady rhythm',
    phases: [
      { kind: 'orb', name: 'Inhale', duration: 4, scale: 1.35, opacity: 0.75 },
      { kind: 'orb', name: 'Exhale', duration: 4, scale: 1.00, opacity: 0.30 },
    ],
  },
]

/* ─── Rotating neuro-somatic cues (shared across all patterns) ─────── */
const SOMATIC_CUES = [
  'paced breathing stimulates the vagus nerve',
  'stabilizes autonomic nervous system · vagal brake engaged',
  'downregulates sympathetic arousal · fight-or-flight eases',
  'restores prefrontal executive regulation & clarity',
  'regulates respiratory sinus arrhythmia · steady heart rate',
]

export default function GuidedBreathing() {
  const [patternId, setPatternId] = useState<PatternId>('box')
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(4)
  const [isActive, setIsActive] = useState(false)
  // Rotating somatic cue
  const [cueIndex, setCueIndex] = useState(0)
  const [cueVisible, setCueVisible] = useState(true)

  const phaseIndexRef = useRef(phaseIndex)
  const secondsLeftRef = useRef(secondsLeft)
  const isActiveRef = useRef(isActive)
  const patternRef = useRef(PATTERNS[0])

  const activePattern = PATTERNS.find(p => p.id === patternId)!
  const currentPhase = activePattern.phases[phaseIndex]

  // Keep refs in sync
  phaseIndexRef.current = phaseIndex
  secondsLeftRef.current = secondsLeft
  isActiveRef.current = isActive
  patternRef.current = activePattern

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

  /* ── Rotating somatic cue: cross-fade every 8s ───────────── */
  useEffect(() => {
    const rotateId = setInterval(() => {
      setCueVisible(false)
      setTimeout(() => {
        setCueIndex(prev => (prev + 1) % SOMATIC_CUES.length)
        setCueVisible(true)
      }, 800)
    }, 8000)
    return () => clearInterval(rotateId)
  }, [])

  /* ── Pattern switch ───────────────────────────────────────── */
  function handleSelectPattern(id: PatternId) {
    if (id === patternId) return
    stopTick()
    const pat = PATTERNS.find(p => p.id === id)!
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

  /* ── Box tracer: CSS animation drives the loop seamlessly ── */
  // The CSS @keyframes boxBreatheTracer (100 → 0 over 16s, infinite) handles
  // the visual with zero JS involvement at cycle boundaries — no snap possible.
  // animation-play-state pauses/resumes at the exact current frame.

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center justify-between flex-1 py-2 animate-fade-in text-center min-h-0 w-full select-none">

      {/* ── 1. Pattern Switcher ───────────────────────────────── */}
      <div className="w-full flex flex-col items-center pt-1 shrink-0">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {PATTERNS.map(p => {
            const sel = p.id === patternId
            return (
              <button
                key={p.id}
                id={`pattern-pill-${p.id}`}
                onClick={() => handleSelectPattern(p.id)}
                className={`
                  px-3 py-1.5 rounded-full font-mono text-[10px] tracking-wider uppercase transition-all duration-300 focus:outline-none cursor-pointer
                  ${sel
                    ? 'bg-neutral-800/90 text-neutral-200 border border-neutral-700/80 shadow-sm'
                    : 'bg-neutral-900/40 text-neutral-500 border border-neutral-800/60 hover:text-neutral-300 hover:border-neutral-700/60'
                  }
                `}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Rotating somatic cue — cross-fades every 8s */}
        <p
          className="font-sans text-xs md:text-sm text-neutral-300 tracking-wide text-center font-normal mt-3 max-w-xs px-4 leading-snug"
          style={{ transition: 'opacity 800ms ease', opacity: cueVisible ? 1 : 0 }}
        >
          {SOMATIC_CUES[cueIndex]}
        </p>
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
                stroke="rgba(64,64,80,0.55)"
                strokeWidth="3"
              />

              {/* ── Continuous clockwise glowing tracer (CSS-driven, no snap) ── */}
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

            {/* ── Center Dynamic Phase Display ─────────────────────── */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center gap-1">
              {!isActive && phaseIndex === 0 && secondsLeft === activePattern.phases[0].duration ? (
                <span className="font-serif-nook text-neutral-400 text-base font-light italic group-hover:text-neutral-200 transition-colors duration-200">
                  tap to begin
                </span>
              ) : (
                <>
                  <span className="font-serif-nook text-neutral-100 text-xl font-light tracking-wide capitalize">
                    {currentPhase.name}
                  </span>
                  <span className="font-serif-nook text-amber-100/80 text-base italic font-normal tabular-nums">
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
                <span className="font-serif-nook text-neutral-400 text-base font-light italic">
                  tap to begin
                </span>
              ) : (
                <>
                  <span className="font-serif-nook text-neutral-100 text-lg font-light tracking-wide capitalize">
                    {currentPhase.name}
                  </span>
                  <span className="font-serif-nook text-[#C9B99A]/90 text-sm italic font-normal mt-0.5 tabular-nums">
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
        {(isActive || phaseIndex > 0 || secondsLeft !== activePattern.phases[0].duration) ? (
          <button
            id="breath-reset-btn"
            onClick={handleReset}
            className="font-mono text-[10px] tracking-widest uppercase text-neutral-600 hover:text-neutral-400 transition-colors focus:outline-none cursor-pointer"
          >
            reset
          </button>
        ) : (
          <span className="font-mono text-[10px] tracking-widest uppercase text-neutral-700/40 pointer-events-none">
            tap visualizer to begin
          </span>
        )}
      </div>
    </div>
  )
}
