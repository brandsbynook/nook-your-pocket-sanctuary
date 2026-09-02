import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getCompanionChoice,
  setCompanionChoice,
  type CompanionId,
} from '../utils/storage'
import ScreenHeader from '../components/ScreenHeader'
import CompanionSelectorModal, { COMPANION_ROSTER } from '../components/CompanionSelectorModal'
import DecelerationModal from '../components/DecelerationModal'
import { triggerHaptic } from '../utils/haptics'

interface CompanionScreenProps {
  onBack: () => void
}

type PresetId = '25/5' | '45/10' | '60/15' | 'custom'

interface PresetOption {
  id: PresetId
  label: string
  workMinutes: number
  breakMinutes: number
}

const PRESETS: PresetOption[] = [
  { id: '25/5', label: '25 / 5', workMinutes: 25, breakMinutes: 5 },
  { id: '45/10', label: '45 / 10', workMinutes: 45, breakMinutes: 10 },
  { id: '60/15', label: '60 / 15', workMinutes: 60, breakMinutes: 15 },
  { id: 'custom', label: 'Custom', workMinutes: 25, breakMinutes: 5 },
]

const STORAGE_KEY_PRESET = 'nook:focus-preset'
const STORAGE_KEY_CUSTOM_WORK = 'nook:focus-custom-work'
const STORAGE_KEY_CUSTOM_BREAK = 'nook:focus-custom-break'

function loadSavedPreset(): PresetId {
  try {
    const p = localStorage.getItem(STORAGE_KEY_PRESET)
    if (p === '25/5' || p === '45/10' || p === '60/15' || p === 'custom') return p
    return '25/5'
  } catch {
    return '25/5'
  }
}

function loadSavedCustomWork(): number {
  try {
    const val = parseInt(localStorage.getItem(STORAGE_KEY_CUSTOM_WORK) || '25', 10)
    return isNaN(val) ? 25 : Math.max(1, Math.min(120, val))
  } catch {
    return 25
  }
}

function loadSavedCustomBreak(): number {
  try {
    const val = parseInt(localStorage.getItem(STORAGE_KEY_CUSTOM_BREAK) || '5', 10)
    return isNaN(val) ? 5 : Math.max(1, Math.min(30, val))
  } catch {
    return 5
  }
}

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

  // Presets & Custom Interval States
  const [activePreset, setActivePreset] = useState<PresetId>(() => loadSavedPreset())
  const [customWorkMinutes, setCustomWorkMinutes] = useState<number>(() => loadSavedCustomWork())
  const [customBreakMinutes, setCustomBreakMinutes] = useState<number>(() => loadSavedCustomBreak())
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)

  // Calculate current session work minutes based on preset
  const getWorkMinutes = useCallback((): number => {
    if (activePreset === 'custom') return customWorkMinutes
    const found = PRESETS.find(p => p.id === activePreset)
    return found ? found.workMinutes : 25
  }, [activePreset, customWorkMinutes])

  const totalSessionSeconds = getWorkMinutes() * 60

  // Pomodoro Timer States
  const [timeLeft, setTimeLeft] = useState(() => totalSessionSeconds)
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
  const activeCompanion = COMPANION_ROSTER.find(c => c.id === selectedCompanionId) ?? COMPANION_ROSTER[0]

  // Select and persist companion
  const handleSelectCompanion = (id: CompanionId) => {
    setSelectedCompanionId(id)
    setCompanionChoice(id)
    setIsSelectorModalOpen(false)
  }

  // Preset Selection Handler
  const handleSelectPreset = (id: PresetId) => {
    if (isRunning) return
    setActivePreset(id)
    localStorage.setItem(STORAGE_KEY_PRESET, id)

    if (id === 'custom') {
      setIsCustomModalOpen(true)
      const secs = customWorkMinutes * 60
      setTimeLeft(secs)
    } else {
      const found = PRESETS.find(p => p.id === id)
      if (found) {
        setTimeLeft(found.workMinutes * 60)
      }
    }
    setIsCompleted(false)
  }

  // Update Custom Duration
  const handleSaveCustomIntervals = (work: number, rest: number) => {
    const cleanWork = Math.max(1, Math.min(120, work))
    const cleanRest = Math.max(1, Math.min(30, rest))
    setCustomWorkMinutes(cleanWork)
    setCustomBreakMinutes(cleanRest)
    localStorage.setItem(STORAGE_KEY_CUSTOM_WORK, cleanWork.toString())
    localStorage.setItem(STORAGE_KEY_CUSTOM_BREAK, cleanRest.toString())
    setActivePreset('custom')
    localStorage.setItem(STORAGE_KEY_PRESET, 'custom')

    if (!isRunning) {
      setTimeLeft(cleanWork * 60)
      setIsCompleted(false)
    }
    setIsCustomModalOpen(false)
  }

  // Ring Tap: Toggle Start / Pause
  const handleRingTap = useCallback(() => {
    triggerHaptic(18)

    setTapRippleKey(k => k + 1)
    setIsRippling(true)
    if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current)
    rippleTimeoutRef.current = setTimeout(() => setIsRippling(false), 900)

    if (isCompleted || timeLeft === 0) {
      // Restart session
      setTimeLeft(totalSessionSeconds)
      setIsCompleted(false)
      setIsRunning(true)
      return
    }

    setIsRunning(prev => !prev)
  }, [isCompleted, timeLeft, totalSessionSeconds])

  // Timer interval countdown
  useEffect(() => {
    if (isRunning && !isCompleted) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            setIsCompleted(true)
            playCompletionChime()
            triggerHaptic([40, 60, 80])
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
    if (isRunning && timeLeft < totalSessionSeconds - 3) {
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
  const progressRatio = totalSessionSeconds > 0 ? timeLeft / totalSessionSeconds : 0
  const strokeDashoffset = circumference * (1 - progressRatio)

  return (
    <main
      id="companion-screen"
      className="
        h-[100dvh] w-full
        px-6 pt-10 pb-6
        flex flex-col justify-between
        bg-[#0A0A0B] text-[#E5E5E7]
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
          timeLeft < totalSessionSeconds && !isRunning ? (
            <button
              id="companion-reset-btn"
              onClick={() => {
                setTimeLeft(totalSessionSeconds)
                setIsCompleted(false)
              }}
              className="font-sans text-[0.62rem] tracking-[0.14em] uppercase text-[#71717A] hover:text-[#E5E5E7] transition-colors focus:outline-none cursor-pointer py-1 px-1.5"
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
              background: 'radial-gradient(ellipse at center, rgba(229,229,231,0.06) 0%, rgba(229,229,231,0.01) 60%, transparent 80%)',
            }}
          />

          {/* Tap Feedback Ripple */}
          {isRippling && (
            <div
              key={tapRippleKey}
              className="absolute inset-0 rounded-full pointer-events-none animate-companion-tap-glow"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(229,229,231,0.2) 0%, rgba(229,229,231,0.04) 55%, transparent 80%)',
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
              stroke="#E5E5E7"
              strokeWidth={trackStrokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>

          {/* ── Centered Selected Companion with 4s Breathing Animation & Image Fallback ── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
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
        <div className="flex flex-col items-center mt-5 gap-1">
          <button
            id="focus-timer-time-readout"
            onClick={() => {
              if (!isRunning) setIsCustomModalOpen(true)
            }}
            disabled={isRunning}
            title={!isRunning ? 'Tap to adjust custom duration' : undefined}
            className="font-serif-nook text-2xl sm:text-3xl text-[#E5E5E7] font-light italic tracking-wider leading-none select-none focus:outline-none cursor-pointer disabled:cursor-default"
          >
            {formatTimeRemaining(timeLeft)}
          </button>

          <p className="font-serif-nook italic text-xs text-[#71717A] font-normal tracking-wide mt-1">
            {isCompleted
              ? 'Session Completed · Rest Well'
              : isRunning
              ? 'In Flow · Tap Ring to Pause'
              : timeLeft < totalSessionSeconds
              ? 'Paused · Tap Ring to Resume'
              : 'Tap Ring to Begin'}
          </p>
        </div>

        {/* ── 4. Quiet Horizontal Focus Preset Selector ──────────── */}
        <div
          className={`
            mt-4 flex items-center justify-center gap-1.5 transition-all duration-500
            ${isRunning ? 'opacity-0 pointer-events-none -translate-y-1' : 'opacity-100 translate-y-0'}
          `}
        >
          {PRESETS.map(p => {
            const isSelected = activePreset === p.id
            return (
              <button
                key={p.id}
                id={`preset-btn-${p.id.replace('/', '-')}`}
                onClick={() => handleSelectPreset(p.id)}
                className={`
                  px-3 py-1 rounded-full font-serif-nook text-xs tracking-wide transition-all duration-200 focus:outline-none cursor-pointer
                  ${isSelected
                    ? 'bg-[#141416] text-[#E5E5E7] border border-[#222225] shadow-sm'
                    : 'bg-transparent text-[#71717A] border border-[#1F1F23] hover:text-[#E5E5E7]'
                  }
                `}
              >
                {p.id === 'custom' ? `Custom (${customWorkMinutes}m)` : p.label}
              </button>
            )
          })}
        </div>

        {/* ── 5. Quiet Companion Selector Trigger ────────────────── */}
        <div className="mt-5 flex items-center justify-center">
          <button
            id="open-companion-selector-btn"
            onClick={() => setIsSelectorModalOpen(true)}
            className="
              flex items-center gap-2.5 px-4 py-1.5 rounded-full
              bg-[#141416] border border-[#222225] hover:border-[#3F3F46] hover:bg-[#1A1A1E]
              transition-all duration-300 focus:outline-none cursor-pointer group shadow-sm
            "
            aria-label="Change companion"
          >
            {/* Miniature companion active dot */}
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5E5E7] group-hover:scale-110 transition-transform" />

            <span className="font-serif-nook text-sm text-[#E5E5E7] group-hover:text-[#FFFFFF] tracking-wide">
              {activeCompanion.name}
            </span>

            {/* Subtle gear / switch glyph */}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-[#71717A] group-hover:text-[#E5E5E7] transition-colors">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── 6. Manual Custom Focus & Break Intervals Modal ─────── */}
      {isCustomModalOpen && (
        <CustomIntervalModal
          isOpen={isCustomModalOpen}
          initialWork={customWorkMinutes}
          initialBreak={customBreakMinutes}
          onSave={handleSaveCustomIntervals}
          onClose={() => setIsCustomModalOpen(false)}
        />
      )}

      {/* ── 7. Companion Roster Selection Modal ────────────────── */}
      <CompanionSelectorModal
        isOpen={isSelectorModalOpen}
        selectedId={selectedCompanionId}
        onSelect={handleSelectCompanion}
        onClose={() => setIsSelectorModalOpen(false)}
      />

      {/* ── 8. Mindful Friction-Exit Intercept Modal ───────────── */}
      <DecelerationModal
        isOpen={isDecelerationOpen}
        onClose={() => setIsDecelerationOpen(false)}
        onConfirmExit={handleConfirmExit}
      />
    </main>
  )
}

/* ─────────────────────────────────────────────────────────────
   Custom Interval Settings Modal
───────────────────────────────────────────────────────────── */
interface CustomIntervalModalProps {
  isOpen: boolean
  initialWork: number
  initialBreak: number
  onSave: (work: number, rest: number) => void
  onClose: () => void
}

function CustomIntervalModal({
  isOpen,
  initialWork,
  initialBreak,
  onSave,
  onClose,
}: CustomIntervalModalProps) {
  const [work, setWork] = useState(initialWork)
  const [rest, setRest] = useState(initialBreak)

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[340px] bg-[#141416] border border-[#222225] rounded-2xl p-6 flex flex-col gap-6 shadow-2xl animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center">
          <h3 className="font-serif-nook text-[#E5E5E7] text-lg font-light tracking-wide">
            Custom Interval
          </h3>
          <p className="font-sans text-[#71717A] text-[0.62rem] tracking-[0.14em] uppercase mt-1">
            tailor your focus and rest pacing
          </p>
        </div>

        {/* Stepper Controls */}
        <div className="flex flex-col gap-4">
          {/* Focus Duration */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181C] border border-[#222225]">
            <div className="flex flex-col">
              <span className="font-serif-nook text-[#E5E5E7] text-sm font-light">
                Focus Duration
              </span>
              <span className="font-sans text-[#71717A] text-[0.55rem] tracking-wider uppercase">
                1 – 120 minutes
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setWork(w => Math.max(1, w - (w > 10 ? 5 : 1)))}
                className="w-7 h-7 rounded-full bg-[#222225] text-[#E5E5E7] hover:text-white flex items-center justify-center font-mono text-sm focus:outline-none cursor-pointer"
              >
                −
              </button>
              <span className="font-serif-nook text-[#E5E5E7] text-base font-normal tabular-nums min-w-[3rem] text-center">
                {work} min
              </span>
              <button
                type="button"
                onClick={() => setWork(w => Math.min(120, w + (w >= 10 ? 5 : 1)))}
                className="w-7 h-7 rounded-full bg-[#222225] text-[#E5E5E7] hover:text-white flex items-center justify-center font-mono text-sm focus:outline-none cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Rest / Break Gap */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181C] border border-[#222225]">
            <div className="flex flex-col">
              <span className="font-serif-nook text-[#E5E5E7] text-sm font-light">
                Rest Gap
              </span>
              <span className="font-sans text-[#71717A] text-[0.55rem] tracking-wider uppercase">
                1 – 30 minutes
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRest(r => Math.max(1, r - 1))}
                className="w-7 h-7 rounded-full bg-[#222225] text-[#E5E5E7] hover:text-white flex items-center justify-center font-mono text-sm focus:outline-none cursor-pointer"
              >
                −
              </button>
              <span className="font-serif-nook text-[#E5E5E7] text-base font-normal tabular-nums min-w-[3rem] text-center">
                {rest} min
              </span>
              <button
                type="button"
                onClick={() => setRest(r => Math.min(30, r + 1))}
                className="w-7 h-7 rounded-full bg-[#222225] text-[#E5E5E7] hover:text-white flex items-center justify-center font-mono text-sm focus:outline-none cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onClose}
            className="font-sans text-[0.62rem] tracking-[0.14em] uppercase text-[#71717A] hover:text-[#E5E5E7] transition-colors focus:outline-none cursor-pointer py-1.5 px-3"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onSave(work, rest)}
            className="px-4 py-1.5 rounded-full bg-[#141416] border border-[#222225] text-[#E5E5E7] font-serif-nook text-xs font-light tracking-wide hover:bg-[#1E1E22] transition-all duration-200 focus:outline-none cursor-pointer shadow-sm"
          >
            Set Custom Interval
          </button>
        </div>
      </div>
    </div>
  )
}
