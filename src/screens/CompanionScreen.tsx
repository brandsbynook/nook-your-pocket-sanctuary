import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getCompanionChoice,
  setCompanionChoice,
  type CompanionId,
} from '../utils/storage'
import ScreenHeader from '../components/ScreenHeader'
import CompanionSelectorModal, { COMPANION_ROSTER } from '../components/CompanionSelectorModal'
import DecelerationModal from '../components/DecelerationModal'

interface CompanionScreenProps {
  onBack: () => void
}

const TOTAL_POMODORO_SECONDS = 25 * 60 // 25:00

function formatTimeRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/* ─────────────────────────────────────────────────────────────
   Gentle Singing Bowl Completion Chime
───────────────────────────────────────────────────────────── */
function playCompletionChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const now = ctx.currentTime

    const freqs = [392, 587.33, 784, 1174.66]
    const gains = [0.25, 0.12, 0.08, 0.04]

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(gains[i], now + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 3.9)
    })
  } catch {
    // Audio context may be restricted
  }
}

export default function CompanionScreen({ onBack }: CompanionScreenProps) {
  // Companion state persisted in localStorage
  const [selectedCompanionId, setSelectedCompanionId] = useState<CompanionId>(() => getCompanionChoice())
  const [isSelectorModalOpen, setIsSelectorModalOpen] = useState(false)

  // Pomodoro Timer States (25:00 countdown)
  const [timeLeft, setTimeLeft] = useState(TOTAL_POMODORO_SECONDS)
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // Mindful Friction-Exit Intercept Modal
  const [isDecelerationOpen, setIsDecelerationOpen] = useState(false)

  // Tap ripple effect
  const [tapRippleKey, setTapRippleKey] = useState(0)
  const [isRippling, setIsRippling] = useState(false)
  const rippleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Resolve active companion safely with fallback to Cat
  const activeCompanion = COMPANION_ROSTER.find(c => c.id === selectedCompanionId) ?? COMPANION_ROSTER[4]

  // Select and persist companion
  const handleSelectCompanion = (id: CompanionId) => {
    setSelectedCompanionId(id)
    setCompanionChoice(id)
    setIsSelectorModalOpen(false)
  }

  // Ring Tap: Toggle Start / Pause
  const handleRingTap = useCallback(() => {
    if ('vibrate' in navigator) navigator.vibrate([18])

    setTapRippleKey(k => k + 1)
    setIsRippling(true)
    if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current)
    rippleTimeoutRef.current = setTimeout(() => setIsRippling(false), 900)

    if (isCompleted || timeLeft === 0) {
      // Restart session
      setTimeLeft(TOTAL_POMODORO_SECONDS)
      setIsCompleted(false)
      setIsRunning(true)
      return
    }

    setIsRunning(prev => !prev)
  }, [isCompleted, timeLeft])

  // Timer interval countdown
  useEffect(() => {
    if (isRunning && !isCompleted) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            setIsCompleted(true)
            playCompletionChime()
            if ('vibrate' in navigator) navigator.vibrate([40, 60, 80])
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning, isCompleted])

  // Clean up ripple timer
  useEffect(() => {
    return () => {
      if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current)
    }
  }, [])

  // Back Navigation Handler with Friction Intercept
  const handleBackAttempt = () => {
    if (isRunning && timeLeft < TOTAL_POMODORO_SECONDS - 3) {
      setIsDecelerationOpen(true)
    } else {
      onBack()
    }
  }

  // Confirm Exit from Deceleration Modal
  const handleConfirmExit = () => {
    setIsRunning(false)
    setIsDecelerationOpen(false)
    onBack()
  }

  // SVG Dial Dimensions
  const dialSize = 270
  const trackStrokeWidth = 6.5
  const radius = (dialSize - trackStrokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Counter-clockwise depletion: Starts full (dashoffset = 0) and increases to circumference as timeLeft -> 0
  const progressRatio = timeLeft / TOTAL_POMODORO_SECONDS
  const strokeDashoffset = circumference * (1 - progressRatio)

  return (
    <main
      id="companion-screen"
      className="
        h-[100dvh] max-w-md mx-auto
        px-6 pt-10 pb-6
        flex flex-col justify-between
        bg-[#0E0E0E] text-[#E5E0D8]
        overflow-hidden select-none
        animate-fade-in
      "
    >
      {/* ── 1. Standard Nook Header (Wide-Tracked "C o m p a n i o n") ── */}
      <ScreenHeader
        id="companion-screen-header"
        title="C o m p a n i o n"
        subtitle="a quiet presence while you work"
        onBack={handleBackAttempt}
        rightElement={
          timeLeft < TOTAL_POMODORO_SECONDS && !isRunning ? (
            <button
              id="companion-reset-btn"
              onClick={() => {
                setTimeLeft(TOTAL_POMODORO_SECONDS)
                setIsCompleted(false)
              }}
              className="font-sans text-[0.62rem] tracking-[0.14em] uppercase text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none cursor-pointer py-1 px-1.5"
            >
              Reset
            </button>
          ) : undefined
        }
      />

      {/* ── 2. Minimalist Center Pomodoro Dial ────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 my-auto">
        {/* Interactive Circular Dial Container */}
        <div
          id="focus-timer-ring-touch-target"
          onClick={handleRingTap}
          role="button"
          tabIndex={0}
          aria-label={isRunning ? 'Pause focus session' : 'Start focus session'}
          className="relative flex items-center justify-center cursor-pointer select-none group"
          style={{ width: dialSize, height: dialSize }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            className={`
              absolute inset-0 rounded-full pointer-events-none transition-opacity duration-1000
              ${isRunning ? 'opacity-100' : 'opacity-35'}
            `}
            style={{
              background: 'radial-gradient(ellipse at center, rgba(201,185,154,0.06) 0%, rgba(201,185,154,0.01) 60%, transparent 80%)',
            }}
          />

          {/* Tap Feedback Ripple */}
          {isRippling && (
            <div
              key={tapRippleKey}
              className="absolute inset-0 rounded-full pointer-events-none animate-companion-tap-glow"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(201,185,154,0.2) 0%, rgba(201,185,154,0.04) 55%, transparent 80%)',
              }}
            />
          )}

          {/* ── Circular Progress Ring Track (SVG) ── */}
          <svg
            width={dialSize}
            height={dialSize}
            className="absolute inset-0 pointer-events-none -rotate-90"
          >
            {/* Dark Muted Ring Track */}
            <circle
              cx={dialSize / 2}
              cy={dialSize / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={trackStrokeWidth}
              fill="none"
            />

            {/* Smooth Foreground Arc Depleting Toward Zero */}
            <circle
              cx={dialSize / 2}
              cy={dialSize / 2}
              r={radius}
              stroke="#F2EDE4"
              strokeWidth={trackStrokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>

          {/* ── Centered Selected Companion with 4s Breathing Animation & Image Error Fallback ── */}
          <div className="relative z-10 flex items-center justify-center pointer-events-none">
            <img
              src={activeCompanion.imagePath || activeCompanion.image}
              alt={activeCompanion.name}
              className="w-40 h-40 sm:w-44 sm:h-44 object-contain pointer-events-none select-none drop-shadow-md animate-companion-breathe-4s"
              onError={e => {
                e.currentTarget.onerror = null
                e.currentTarget.src = '/companions/cat.png'
              }}
            />
          </div>
        </div>

        {/* ── 3. Subtle Remaining Time Readout in Serif Italics ──── */}
        <div className="flex flex-col items-center mt-6 gap-1">
          <p
            id="focus-timer-time-readout"
            className="font-serif-nook text-2xl sm:text-3xl text-neutral-200 font-light italic tracking-wider leading-none select-none"
          >
            {formatTimeRemaining(timeLeft)}
          </p>

          <p className="font-serif-nook italic text-xs text-neutral-400 font-normal tracking-wide mt-1">
            {isCompleted
              ? 'Session Completed · Rest Well'
              : isRunning
              ? 'In Flow · Tap Ring to Pause'
              : timeLeft < TOTAL_POMODORO_SECONDS
              ? 'Paused · Tap Ring to Resume'
              : 'Tap Ring to Begin'}
          </p>
        </div>

        {/* ── 4. Quiet, Subtle Companion Selector Trigger ────────── */}
        <div className="mt-7 flex items-center justify-center">
          <button
            id="open-companion-selector-btn"
            onClick={() => setIsSelectorModalOpen(true)}
            className="
              flex items-center gap-2.5 px-4 py-1.5 rounded-full
              bg-[#14141A] border border-[#22222C] hover:border-[#C9B99A]/50 hover:bg-[#1A1916]
              transition-all duration-300 focus:outline-none cursor-pointer group shadow-sm
            "
            aria-label="Change companion"
          >
            {/* Miniature companion active dot */}
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9B99A] group-hover:scale-110 transition-transform" />

            <span className="font-serif-nook text-sm text-neutral-300 group-hover:text-[#FFFFFF] tracking-wide">
              {activeCompanion.name}
            </span>

            {/* Subtle gear / switch glyph */}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500 group-hover:text-[#C9B99A] transition-colors">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── 5. Companion Roster Selection Modal ────────────────── */}
      <CompanionSelectorModal
        isOpen={isSelectorModalOpen}
        selectedId={selectedCompanionId}
        onSelect={handleSelectCompanion}
        onClose={() => setIsSelectorModalOpen(false)}
      />

      {/* ── 6. Mindful Friction-Exit Intercept Modal ───────────── */}
      <DecelerationModal
        isOpen={isDecelerationOpen}
        onClose={() => setIsDecelerationOpen(false)}
        onConfirmExit={handleConfirmExit}
      />
    </main>
  )
}
