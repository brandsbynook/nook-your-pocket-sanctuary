import { useState, useEffect, useRef } from 'react'
import { getCompanionChoice, setCompanionChoice } from '../utils/storage'
import { playCompletionBell } from '../utils/bellSound'
import HeaderAudioShortcut from '../components/HeaderAudioShortcut'

type SessionPhase = 'focus' | 'pause'
type SessionState = 'idle' | 'running' | 'paused' | 'completed'
type FrictionMode = 'slider' | 'math'

interface CompanionScreenProps {
  onBack: () => void
}

interface IntervalPreset {
  id: string
  label: string
  focusMinutes: number
  pauseMinutes: number
}

const INTERVAL_PRESETS: IntervalPreset[] = [
  { id: 'classic', label: '25 / 5', focusMinutes: 25, pauseMinutes: 5 },
  { id: 'deep', label: '50 / 10', focusMinutes: 50, pauseMinutes: 10 },
  { id: 'gentle', label: '15 / 3', focusMinutes: 15, pauseMinutes: 3 },
]

/* ─────────────────────────────────────────────────────────────
   Minimalist Line-Art Companions (Cat / Bear / Panda / Bird)
───────────────────────────────────────────────────────────── */
function SleepyCatSvg() {
  return (
    <svg width="110" height="85" viewBox="0 0 120 90" fill="none" className="text-neutral-300">
      {/* Curled sleeping cat body */}
      <path
        d="M25 65C22 45 40 25 65 25C90 25 105 42 105 60C105 72 92 78 75 78C50 78 30 75 25 65Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left ear */}
      <path
        d="M32 45C28 35 22 30 20 32C18 34 23 42 25 48C20 49 18 55 20 62"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Right ear */}
      <path
        d="M30 40C30 32 36 28 38 30C40 32 38 38 35 44"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Sleeping eye */}
      <path
        d="M24 52C26 54 29 54 31 52"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Little nose */}
      <circle cx="21" cy="54" r="1.3" fill="currentColor" />
      {/* Tucked tail */}
      <path
        d="M102 62C108 55 110 40 102 35C96 32 94 38 96 46C98 55 92 68 76 74"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      {/* Peaceful spine curve */}
      <path
        d="M50 35C62 35 75 39 84 48"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="2 3"
        strokeOpacity="0.35"
      />
    </svg>
  )
}

function RestingBearSvg() {
  return (
    <svg width="110" height="85" viewBox="0 0 120 90" fill="none" className="text-neutral-300">
      {/* Sleeping Bear Body */}
      <path
        d="M30 68C22 55 28 30 55 28C85 26 100 45 98 68C95 78 78 80 58 80C38 80 32 75 30 68Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left round ear */}
      <path d="M38 28C36 19 45 16 49 23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Right round ear */}
      <path d="M66 23C71 16 80 19 78 28" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Gentle muzzle */}
      <path d="M42 48C46 44 56 44 60 48C60 56 42 56 42 48Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="51" cy="48" r="2" fill="currentColor" />
      {/* Soft snoozing eyes */}
      <path d="M36 40C39 42 42 42 45 40" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M57 40C60 42 63 42 66 40" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* Resting paw fold */}
      <path d="M35 68C42 68 46 72 48 78" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.6" />
    </svg>
  )
}

function SleepingPandaSvg() {
  return (
    <svg width="110" height="85" viewBox="0 0 120 90" fill="none" className="text-neutral-300">
      {/* Panda Body */}
      <path
        d="M32 68C24 56 29 32 56 30C84 28 98 46 96 68C93 78 76 80 57 80C38 80 34 75 32 68Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Dark Panda Ears */}
      <path d="M38 28C35 18 45 15 50 23" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M66 23C71 15 81 18 78 28" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Gentle Panda Eye Patches */}
      <ellipse cx="40" cy="42" rx="6" ry="4" transform="rotate(-15 40 42)" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" />
      <path d="M37 42C39 44 42 44 44 42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      
      <ellipse cx="62" cy="42" rx="6" ry="4" transform="rotate(15 62 42)" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" />
      <path d="M59 42C61 44 64 44 66 42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />

      {/* Nose & Soft Snooze */}
      <ellipse cx="51" cy="49" rx="2.5" ry="1.8" fill="currentColor" />
      <path d="M48 53C51 55 54 55 56 53" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function QuietBirdSvg() {
  return (
    <svg width="110" height="85" viewBox="0 0 120 90" fill="none" className="text-neutral-300">
      {/* Bird body resting */}
      <path
        d="M35 50C35 32 50 22 68 22C82 22 92 34 88 52C85 66 70 72 50 72C40 72 35 62 35 50Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Tiny beak */}
      <path d="M35 40L24 44L35 48" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* Sleeping eye */}
      <path d="M44 38C46 40 48 40 50 38" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* Wing fold */}
      <path d="M60 40C72 45 80 58 75 66" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* Tail feathers */}
      <path d="M88 52L105 60L90 66" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function MinimalCompanionGlyph({ companion }: { companion: string }) {
  switch (companion) {
    case 'bear':
      return <RestingBearSvg />
    case 'panda':
      return <SleepingPandaSvg />
    case 'bird':
      return <QuietBirdSvg />
    case 'cat':
    default:
      return <SleepyCatSvg />
  }
}

/* ─────────────────────────────────────────────────────────────
   Main Companion Focus Component
───────────────────────────────────────────────────────────── */
export default function CompanionScreen({ onBack }: CompanionScreenProps) {
  // Companion choice
  const [companion, setCompanion] = useState<string>(() => getCompanionChoice())

  // Interval configurations
  const [focusMinutes, setFocusMinutes] = useState<number>(25)
  const [pauseMinutes, setPauseMinutes] = useState<number>(5)
  const [activePreset, setActivePreset] = useState<string>('classic')
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)

  // Session State
  const [phase, setPhase] = useState<SessionPhase>('focus')
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60)
  const [totalPhaseSeconds, setTotalPhaseSeconds] = useState<number>(25 * 60)

  // Exit Intercept Friction Modal State
  const [showExitModal, setShowExitModal] = useState<boolean>(false)
  const [frictionMode, setFrictionMode] = useState<FrictionMode>('slider')
  const [sliderValue, setSliderValue] = useState<number>(0)
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false)
  const sliderTrackRef = useRef<HTMLDivElement | null>(null)

  // Calm Math Sum State
  const [mathProblem, setMathProblem] = useState<{ a: number; b: number; sum: number }>({ a: 7, b: 6, sum: 13 })
  const [mathAnswer, setMathAnswer] = useState<string>('')
  const [mathError, setMathError] = useState<boolean>(false)

  // Config Drawer Toggle (when idle)
  const [showConfig, setShowConfig] = useState<boolean>(false)

  // Timer Ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Generate random calm math challenge
  const generateMathChallenge = () => {
    const a = Math.floor(Math.random() * 8) + 4
    const b = Math.floor(Math.random() * 8) + 3
    setMathProblem({ a, b, sum: a + b })
    setMathAnswer('')
    setMathError(false)
  }

  // Update total duration when configuring while idle
  useEffect(() => {
    if (sessionState === 'idle') {
      const targetMins = phase === 'focus' ? focusMinutes : pauseMinutes
      setSecondsRemaining(targetMins * 60)
      setTotalPhaseSeconds(targetMins * 60)
    }
  }, [focusMinutes, pauseMinutes, phase, sessionState])

  // Timer Tick Engine
  useEffect(() => {
    if (sessionState === 'running') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            // Phase or session finished
            if (soundEnabled) {
              playCompletionBell()
            }

            if (phase === 'focus') {
              // Switch to pause automatically or complete
              setPhase('pause')
              const nextTotal = pauseMinutes * 60
              setTotalPhaseSeconds(nextTotal)
              return nextTotal
            } else {
              // Pause finished -> complete cycle
              setSessionState('completed')
              return 0
            }
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [sessionState, phase, pauseMinutes, soundEnabled])

  // Ring Arc Calculation (Purely geometric countdown receding from 100% full to 0%)
  const remainingRatio = totalPhaseSeconds > 0 ? secondsRemaining / totalPhaseSeconds : 0
  const clampedRatio = Math.min(Math.max(remainingRatio, 0), 1)
  // Radius: 100 on 240x240 viewBox -> Circumference = 2 * PI * 100 ≈ 628.318
  const circumference = 2 * Math.PI * 100
  const strokeDashoffset = circumference * (1 - clampedRatio)

  // Actions
  function handleStart() {
    setSessionState('running')
    setShowConfig(false)
  }

  function handlePause() {
    setSessionState('paused')
  }

  function handleResume() {
    setSessionState('running')
  }

  function handleReset() {
    setSessionState('idle')
    setPhase('focus')
    const targetMins = focusMinutes
    setSecondsRemaining(targetMins * 60)
    setTotalPhaseSeconds(targetMins * 60)
    setShowExitModal(false)
    setSliderValue(0)
  }

  // Intercept exit triggers
  function handleAttemptExit() {
    if (sessionState === 'running' || sessionState === 'paused') {
      generateMathChallenge()
      setSliderValue(0)
      setShowExitModal(true)
    } else {
      onBack()
    }
  }

  function handleConfirmedExit() {
    handleReset()
    onBack()
  }

  // Friction Slider Drag Logic
  function handleSliderTouchStart() {
    setIsDraggingSlider(true)
  }

  function handleSliderMove(clientX: number) {
    if (!isDraggingSlider || !sliderTrackRef.current) return
    const rect = sliderTrackRef.current.getBoundingClientRect()
    const relativeX = clientX - rect.left
    const percentage = Math.min(Math.max((relativeX / rect.width) * 100, 0), 100)
    setSliderValue(percentage)

    // If dragged all the way past 92%
    if (percentage >= 92) {
      setIsDraggingSlider(false)
      setTimeout(() => {
        handleConfirmedExit()
      }, 250)
    }
  }

  function handleSliderEnd() {
    if (sliderValue < 92) {
      // Snap back smoothly
      setSliderValue(0)
    }
    setIsDraggingSlider(false)
  }

  // Math submission logic
  function handleMathSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (parseInt(mathAnswer.trim(), 10) === mathProblem.sum) {
      handleConfirmedExit()
    } else {
      setMathError(true)
      setTimeout(() => setMathError(false), 1200)
    }
  }

  return (
    <main
      id="companion-screen"
      className="
        relative h-[100dvh] max-w-[440px] mx-auto
        px-6 pt-10 pb-8
        flex flex-col justify-between
        overflow-hidden select-none
        bg-[#0C0C0E] text-[#E5E0D8]
        animate-fade-in
      "
      onMouseMove={e => isDraggingSlider && handleSliderMove(e.clientX)}
      onMouseUp={handleSliderEnd}
      onTouchMove={e => isDraggingSlider && e.touches[0] && handleSliderMove(e.touches[0].clientX)}
      onTouchEnd={handleSliderEnd}
    >
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between shrink-0 z-10">
        <button
          id="companion-back"
          onClick={handleAttemptExit}
          className="
            flex items-center gap-1.5 py-2 px-1
            font-sans text-[#71717A] text-[0.68rem]
            tracking-[0.16em] uppercase
            hover:text-[#E5E0D8] transition-colors
            focus:outline-none
          "
        >
          <span className="text-[0.85rem] leading-none">←</span>
          return
        </button>

        {/* Phase & Screen Title */}
        <div className="flex flex-col items-center gap-[2px]">
          <h1 className="font-serif-nook text-neutral-300 text-xl font-light tracking-[0.18em] leading-none">
            Companion
          </h1>
          <p className="font-sans text-neutral-500 text-[0.58rem] tracking-[0.1em] text-center">
            a quiet presence
          </p>
        </div>

        {/* Config Quick Toggle */}
        <div className="flex items-center gap-1.5">
          <HeaderAudioShortcut />

          {sessionState === 'idle' && (
            <button
              id="companion-config-toggle"
              onClick={() => setShowConfig(prev => !prev)}
              title="Companion preferences"
              className={`
                p-1.5 rounded-full border transition-all duration-300 focus:outline-none
                ${showConfig
                  ? 'border-[#C9B99A]/50 text-[#C9B99A] bg-[#1A1A1E]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }
              `}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* ── Main Center Ring Sanctuary ──────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto min-h-0 relative">
        {sessionState !== 'completed' ? (
          <div className="flex flex-col items-center justify-center">
            {/* The Ultra-Minimal Center Circular Ring */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Soft warm radial glow behind companion */}
              <div className="absolute w-44 h-44 rounded-full bg-white/[0.02] blur-3xl pointer-events-none" />

              {/* Pure SVG Dial: Matte Dark Track + Slim Semi-Translucent Progress Arc */}
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 240 240"
              >
                {/* Slim Matte Dark Background Track */}
                <circle
                  cx="120"
                  cy="120"
                  r="100"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Slim Soft Muted Progress Arc (50% thickness, semi-translucent warm cream/white) */}
                <circle
                  cx="120"
                  cy="120"
                  r="100"
                  stroke="rgba(255, 255, 255, 0.35)"
                  strokeWidth="5.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-[stroke-dashoffset] duration-700 ease-out"
                />
              </svg>

              {/* Center Content: Minimalist SVG line-art with 4s breathing micro-animation */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="animate-breathe-4s flex items-center justify-center">
                  <MinimalCompanionGlyph companion={companion} />
                </div>

                {/* Subtle Ambient Breathing Status Whisper (NO digits) */}
                <div className="mt-2 flex items-center gap-1.5 opacity-60">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      sessionState === 'running'
                        ? phase === 'focus' ? 'bg-[#FFFFFF] animate-pulse' : 'bg-[#C9B99A] animate-pulse'
                        : 'bg-[#52525B]'
                    }`}
                  />
                  <span className="font-sans text-[0.55rem] tracking-[0.24em] uppercase text-neutral-400">
                    {sessionState === 'running'
                      ? phase === 'focus' ? 'deep focus' : 'gentle pause'
                      : sessionState === 'paused'
                      ? 'stillness'
                      : 'presence'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Low-Profile Interval Settings (Visible on main screen when idle) */}
            {sessionState === 'idle' && (
              <div className="mt-6 flex flex-col items-center gap-2.5 animate-fade-in w-full max-w-[320px]">
                {/* Interval Presets Pills */}
                <div className="flex items-center gap-1 p-1 rounded-full bg-[#121218] border border-[#1E1E26]">
                  {INTERVAL_PRESETS.map(preset => {
                    const isSelected = activePreset === preset.id
                    return (
                      <button
                        key={preset.id}
                        id={`companion-preset-${preset.id}`}
                        onClick={() => {
                          setActivePreset(preset.id)
                          setFocusMinutes(preset.focusMinutes)
                          setPauseMinutes(preset.pauseMinutes)
                        }}
                        className={`
                          px-3 py-1 rounded-full font-sans text-[0.58rem] tracking-wider uppercase transition-all duration-300 focus:outline-none
                          ${isSelected
                            ? 'bg-[#22222E] text-neutral-200 border border-[#3A3A4A] shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-300'
                          }
                        `}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                  <button
                    id="companion-preset-custom"
                    onClick={() => setActivePreset('custom')}
                    className={`
                      px-3 py-1 rounded-full font-sans text-[0.58rem] tracking-wider uppercase transition-all duration-300 focus:outline-none
                      ${activePreset === 'custom'
                        ? 'bg-[#22222E] text-neutral-200 border border-[#3A3A4A] shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-300'
                      }
                    `}
                  >
                    Custom
                  </button>
                </div>

                {/* Inline Custom Time Selector */}
                {activePreset === 'custom' && (
                  <div className="flex items-center gap-4 text-xs font-sans text-neutral-400 bg-[#14141A] border border-[#22222E] px-3 py-1.5 rounded-xl animate-lift-in">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[0.55rem] uppercase text-neutral-500">Focus</span>
                      <button onClick={() => setFocusMinutes(m => Math.max(1, m - 5))} className="w-4 h-4 rounded border border-neutral-700 flex items-center justify-center text-neutral-300 hover:border-neutral-500">-</button>
                      <span className="text-[0.68rem] tabular-nums text-neutral-200 font-medium">{focusMinutes}m</span>
                      <button onClick={() => setFocusMinutes(m => Math.min(120, m + 5))} className="w-4 h-4 rounded border border-neutral-700 flex items-center justify-center text-neutral-300 hover:border-neutral-500">+</button>
                    </div>
                    <div className="h-3 w-px bg-neutral-800" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[0.55rem] uppercase text-neutral-500">Pause</span>
                      <button onClick={() => setPauseMinutes(m => Math.max(1, m - 1))} className="w-4 h-4 rounded border border-neutral-700 flex items-center justify-center text-neutral-300 hover:border-neutral-500">-</button>
                      <span className="text-[0.68rem] tabular-nums text-neutral-200 font-medium">{pauseMinutes}m</span>
                      <button onClick={() => setPauseMinutes(m => Math.min(30, m + 1))} className="w-4 h-4 rounded border border-neutral-700 flex items-center justify-center text-neutral-300 hover:border-neutral-500">+</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── Completion Screen ──────────────────────────────── */
          <div className="flex flex-col items-center text-center animate-fade-in py-4 max-w-[280px]">
            <div className="animate-breathe-4s mb-4">
              <MinimalCompanionGlyph companion={companion} />
            </div>

            <h2 className="font-serif-nook text-[#E5E0D8] text-2xl font-light tracking-wide mb-1">
              Cycle Completed.
            </h2>
            <p className="font-serif-nook text-[#71717A] text-[1.05rem] font-light italic leading-relaxed mb-6">
              You held your center with grace.
            </p>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                id="companion-next-cycle-btn"
                onClick={handleReset}
                className="
                  w-full py-2.5 border border-[#33333E] rounded-md
                  font-serif-nook text-[#FFFFFF] text-[1rem] font-light
                  hover:border-[#FFFFFF]/60 hover:bg-[#1A1A22]
                  transition-all duration-300 focus:outline-none
                "
              >
                Begin Next Focus
              </button>
              <button
                id="companion-home-btn"
                onClick={onBack}
                className="
                  w-full py-2 font-sans text-[#71717A] text-[0.62rem]
                  tracking-[0.18em] uppercase hover:text-[#E5E0D8]
                  transition-colors focus:outline-none
                "
              >
                Return to Sanctuary
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Control Bar ─────────────────────────────────────── */}
      {sessionState !== 'completed' && (
        <div className="flex items-center justify-center gap-4 shrink-0 pt-4 border-t border-[#18181E] z-10">
          {sessionState === 'idle' && (
            <button
              id="companion-begin-btn"
              onClick={handleStart}
              className="
                px-8 py-3 border border-[#2A2A34] rounded-full
                font-serif-nook text-[#FFFFFF] text-[1.08rem] font-light tracking-wide
                bg-[#121218] hover:border-[#FFFFFF]/50 hover:bg-[#1A1A24]
                transition-all duration-300 focus:outline-none shadow-lg
              "
            >
              Enter Focus
            </button>
          )}

          {sessionState === 'running' && (
            <>
              <button
                id="companion-pause-btn"
                onClick={handlePause}
                className="
                  px-6 py-2.5 border border-[#2A2A34] rounded-full
                  font-sans text-[#E5E0D8] text-[0.68rem] tracking-[0.16em] uppercase
                  bg-[#14141A] hover:border-[#FFFFFF]/40
                  transition-all duration-300 focus:outline-none
                "
              >
                Pause
              </button>
              <button
                id="companion-end-btn"
                onClick={handleAttemptExit}
                className="
                  px-4 py-2.5 font-sans text-[#71717A] text-[0.64rem] tracking-[0.16em] uppercase
                  hover:text-[#E5E0D8] transition-colors focus:outline-none
                "
              >
                End
              </button>
            </>
          )}

          {sessionState === 'paused' && (
            <>
              <button
                id="companion-resume-btn"
                onClick={handleResume}
                className="
                  px-6 py-2.5 border border-[#2A2A34] rounded-full
                  font-sans text-[#FFFFFF] text-[0.68rem] tracking-[0.16em] uppercase
                  bg-[#1A1A24] hover:border-[#FFFFFF]/60
                  transition-all duration-300 focus:outline-none
                "
              >
                Resume
              </button>
              <button
                id="companion-end-paused-btn"
                onClick={handleAttemptExit}
                className="
                  px-4 py-2.5 font-sans text-[#71717A] text-[0.64rem] tracking-[0.16em] uppercase
                  hover:text-[#E5E0D8] transition-colors focus:outline-none
                "
              >
                End
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Companion Settings Modal (Character Choice & Sound) ── */}
      {showConfig && (
        <div
          className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex items-center justify-center px-4 animate-fade-in"
          onClick={() => setShowConfig(false)}
        >
          <div
            className="bg-[#121216] border border-neutral-800/80 rounded-2xl w-full max-w-[340px] p-6 shadow-2xl animate-lift-in flex flex-col gap-4 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E1E26] pb-3">
              <h2 className="font-serif-nook text-lg font-light text-neutral-300">
                Companion Settings
              </h2>
              <button
                onClick={() => setShowConfig(false)}
                className="text-neutral-500 hover:text-neutral-300 p-1 text-sm focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Character Selection */}
            <div className="flex flex-col gap-2">
              <span className="font-sans text-[0.58rem] tracking-[0.16em] uppercase text-neutral-500">
                Choose Companion
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'cat', label: 'Cat' },
                  { id: 'bear', label: 'Bear' },
                  { id: 'panda', label: 'Panda' },
                  { id: 'bird', label: 'Bird' },
                ].map(c => {
                  const isSelected = companion === c.id
                  return (
                    <button
                      key={c.id}
                      id={`companion-choice-${c.id}`}
                      onClick={() => {
                        setCompanion(c.id)
                        setCompanionChoice(c.id)
                      }}
                      className={`
                        py-2 px-1 rounded-xl border text-center font-sans text-xs transition-all focus:outline-none
                        ${isSelected
                          ? 'border-[#C9B99A]/50 bg-[#1E1E28] text-neutral-200 shadow-sm'
                          : 'border-[#1E1E26] bg-[#14141A] text-neutral-500 hover:text-neutral-300'
                        }
                      `}
                    >
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Completion Bell Sound Toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1E1E26]">
              <div className="flex flex-col">
                <span className="font-serif-nook text-sm text-neutral-300 font-light">Completion Chime</span>
                <span className="font-sans text-[0.55rem] text-neutral-500">Low-frequency warm chime</span>
              </div>
              <button
                id="toggle-sound-bell-modal-btn"
                onClick={() => setSoundEnabled(prev => !prev)}
                className={`
                  px-3 py-1 rounded-full font-sans text-[0.58rem] tracking-wider uppercase border transition-all focus:outline-none
                  ${soundEnabled
                    ? 'border-[#C9B99A]/40 bg-[#1E1E28] text-neutral-200'
                    : 'border-[#1E1E26] text-neutral-500 hover:text-neutral-300'
                  }
                `}
              >
                {soundEnabled ? 'Enabled' : 'Silent'}
              </button>
            </div>

            <button
              onClick={() => setShowConfig(false)}
              className="w-full mt-2 py-2 bg-[#1A1A22] hover:bg-[#22222E] border border-[#262634] text-neutral-300 rounded-xl font-serif-nook text-sm font-light transition-colors focus:outline-none"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── Soft Friction-Exit Intercept Modal ──────────────── */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-6 animate-fade-in">
          <div className="w-full max-w-[340px] bg-[#121218] border border-[#262630] rounded-2xl p-6 text-center animate-lift-in shadow-2xl">
            {/* Calming, non-judgmental prompt */}
            <div className="w-8 h-8 rounded-full bg-[#FFFFFF]/5 border border-[#FFFFFF]/10 flex items-center justify-center mx-auto mb-3">
              <span className="w-2 h-2 rounded-full bg-[#FFFFFF] animate-pulse" />
            </div>

            <h3 className="font-serif-nook text-[#FFFFFF] text-xl font-light mb-1.5">
              Take a breath.
            </h3>
            <p className="font-serif-nook text-[#A1A1AA] text-sm font-light italic leading-relaxed mb-5">
              Impulses to shift tasks often pass in moments. Ground yourself before stepping away.
            </p>

            {/* Friction Selector: Smooth Slider vs Calm Math */}
            <div className="flex items-center justify-center gap-4 mb-4 border-b border-[#1E1E26] pb-2">
              <button
                onClick={() => setFrictionMode('slider')}
                className={`font-sans text-[0.58rem] tracking-[0.16em] uppercase transition-colors ${
                  frictionMode === 'slider' ? 'text-[#FFFFFF] font-medium' : 'text-[#71717A] hover:text-[#A1A1AA]'
                }`}
              >
                Gentle Slide
              </button>
              <span className="text-[#33333E]">•</span>
              <button
                onClick={() => {
                  generateMathChallenge()
                  setFrictionMode('math')
                }}
                className={`font-sans text-[0.58rem] tracking-[0.16em] uppercase transition-colors ${
                  frictionMode === 'math' ? 'text-[#FFFFFF] font-medium' : 'text-[#71717A] hover:text-[#A1A1AA]'
                }`}
              >
                Calm Reflection
              </button>
            </div>

            {/* Option 1: Smooth Drag-to-Align Slider */}
            {frictionMode === 'slider' && (
              <div className="mb-6">
                <div
                  ref={sliderTrackRef}
                  id="friction-slider-track"
                  onMouseDown={handleSliderTouchStart}
                  onTouchStart={handleSliderTouchStart}
                  className="
                    relative w-full h-12 bg-[#1A1A22] border border-[#2A2A36] rounded-full
                    flex items-center px-1.5 cursor-pointer touch-none select-none
                  "
                >
                  <span className="absolute inset-0 flex items-center justify-center font-sans text-[0.62rem] tracking-[0.16em] uppercase text-[#71717A] pointer-events-none">
                    Slide gently to step away →
                  </span>

                  {/* Sliding Pearl Orb */}
                  <div
                    className="
                      w-9 h-9 rounded-full bg-[#F4F0EA] flex items-center justify-center
                      shadow-md transition-transform duration-75 relative z-10
                    "
                    style={{
                      transform: `translateX(${(sliderValue / 100) * (sliderTrackRef.current ? sliderTrackRef.current.clientWidth - 46 : 240)}px)`,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#121212" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Option 2: Calm Math Sum Challenge */}
            {frictionMode === 'math' && (
              <form onSubmit={handleMathSubmit} className="mb-6 flex flex-col items-center">
                <span className="font-serif-nook text-lg text-[#FFFFFF] mb-3">
                  What is {mathProblem.a} + {mathProblem.b}?
                </span>

                <div className="flex items-center gap-2">
                  <input
                    id="calm-math-input"
                    type="number"
                    value={mathAnswer}
                    onChange={e => setMathAnswer(e.target.value)}
                    placeholder="answer"
                    autoFocus
                    className="
                      w-24 px-3 py-1.5 bg-[#1A1A22] border border-[#2E2E3C] rounded-lg
                      font-serif-nook text-center text-lg text-[#FFFFFF] focus:outline-none focus:border-[#FFFFFF]/60
                    "
                  />
                  <button
                    type="submit"
                    className="
                      px-3.5 py-1.5 border border-[#2E2E3C] rounded-lg
                      font-sans text-[0.62rem] tracking-[0.14em] uppercase text-[#E5E0D8]
                      hover:bg-[#22222C] transition-colors
                    "
                  >
                    Release
                  </button>
                </div>

                {mathError && (
                  <span className="font-serif-nook text-xs text-[#E5A8A8] italic mt-2 animate-fade-in">
                    Take your time. Breathe and try once more.
                  </span>
                )}
              </form>
            )}

            {/* Primary Action: Stay in Stillness */}
            <div className="flex flex-col gap-2">
              <button
                id="friction-stay-btn"
                onClick={() => setShowExitModal(false)}
                className="
                  w-full py-2.5 border border-[#FFFFFF]/30 rounded-xl
                  font-serif-nook text-[#FFFFFF] text-[0.98rem] font-light
                  bg-[#1A1A24] hover:bg-[#222230] hover:border-[#FFFFFF]/60
                  transition-all duration-300 focus:outline-none
                "
              >
                Stay in stillness
              </button>

              <button
                id="friction-instant-exit-btn"
                onClick={handleConfirmedExit}
                className="
                  w-full py-1.5 font-sans text-[#71717A] text-[0.58rem] tracking-[0.14em] uppercase
                  hover:text-[#A1A1AA] transition-colors focus:outline-none
                "
              >
                End session now
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
