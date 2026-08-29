import { useState, useEffect, useRef } from 'react'
import { getCompanionChoice } from '../utils/storage'

type CompanionMode = 'timed' | 'open'
type SessionState = 'idle' | 'running' | 'paused' | 'completed'

interface CompanionScreenProps {
  onBack: () => void
}

const PRESET_MINUTES = [15, 25, 45]

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function formatOpenTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/* ─────────────────────────────────────────────────────────────
   Minimalist Resting Companion SVG (Cat / Bear / Bird)
───────────────────────────────────────────────────────────── */
function RestingCompanion({ isSleeping = true }: { isSleeping?: boolean }) {
  const choice = getCompanionChoice()

  return (
    <div className="relative flex flex-col items-center justify-center py-4">
      {/* Soft radial glow */}
      <div className="absolute w-36 h-36 rounded-full bg-[#C9B99A]/5 blur-2xl pointer-events-none" />

      {/* Stylized vector line art */}
      <div className="animate-breathe relative">
        {choice === 'bear' ? (
          <svg width="120" height="90" viewBox="0 0 120 90" fill="none" className="text-[#E5E0D8]/80">
            <path
              d="M30 68C22 55 28 30 55 28C85 26 100 45 98 68C95 78 78 80 58 80C38 80 32 75 30 68Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path d="M40 28C38 20 46 16 50 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M65 24C70 16 78 20 76 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M42 48C46 44 56 44 60 48C60 56 42 56 42 48Z" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="51" cy="48" r="2" fill="currentColor" />
            <path d="M36 40C39 42 42 42 45 40" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M57 40C60 42 63 42 66 40" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : choice === 'bird' ? (
          <svg width="120" height="90" viewBox="0 0 120 90" fill="none" className="text-[#E5E0D8]/80">
            <path
              d="M35 50C35 32 50 22 68 22C82 22 92 34 88 52C85 66 70 72 50 72C40 72 35 62 35 50Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path d="M35 40L24 44L35 48" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M44 38C46 40 48 40 50 38" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M60 40C72 45 80 58 75 66" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M88 52L105 60L90 66" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="120" height="90" viewBox="0 0 120 90" fill="none" className="text-[#E5E0D8]/80">
            {/* Curled cat body */}
            <path
              d="M25 65C22 45 40 25 65 25C90 25 105 42 105 60C105 72 92 78 75 78C50 78 30 75 25 65Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M32 45C28 35 22 30 20 32C18 34 23 42 25 48C20 49 18 55 20 62"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M30 40C30 32 36 28 38 30C40 32 38 38 35 44"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M24 52C26 54 29 54 31 52"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <circle cx="21" cy="54" r="1.2" fill="currentColor" />
            <path
              d="M102 62C108 55 110 40 102 35C96 32 94 38 96 46C98 55 92 68 76 74"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeOpacity="0.75"
            />
            {isSleeping && (
              <path
                d="M48 35C58 35 72 38 80 45"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="2 3"
                strokeOpacity="0.4"
              />
            )}
          </svg>
        )}
      </div>

      {/* Floating Zzz / peaceful particle */}
      <div className="flex items-center gap-1.5 mt-2 opacity-50">
        <span className="w-1 h-1 rounded-full bg-[#C9B99A] animate-pulse" />
        <span className="w-1 h-1 rounded-full bg-[#C9B99A] animate-pulse" style={{ animationDelay: '300ms' }} />
        <span className="w-1 h-1 rounded-full bg-[#C9B99A] animate-pulse" style={{ animationDelay: '600ms' }} />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Main CompanionScreen Component
───────────────────────────────────────────────────────────── */
export default function CompanionScreen({ onBack }: CompanionScreenProps) {
  const [mode, setMode] = useState<CompanionMode>('timed')
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25)
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [timeRemaining, setTimeRemaining] = useState<number>(25 * 60)
  const [openSeconds, setOpenSeconds] = useState<number>(0)
  const [showExitDialog, setShowExitDialog] = useState<boolean>(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync initial countdown with selected minutes
  useEffect(() => {
    if (sessionState === 'idle') {
      setTimeRemaining(selectedMinutes * 60)
    }
  }, [selectedMinutes, sessionState])

  // Timer lifecycle handler
  useEffect(() => {
    if (sessionState === 'running') {
      timerRef.current = setInterval(() => {
        if (mode === 'timed') {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              setSessionState('completed')
              return 0
            }
            return prev - 1
          })
        } else {
          setOpenSeconds(prev => prev + 1)
        }
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [sessionState, mode])

  function handleStart() {
    setSessionState('running')
  }

  function handlePause() {
    setSessionState('paused')
  }

  function handleResume() {
    setSessionState('running')
  }

  function handleEndSession() {
    setSessionState('idle')
    setTimeRemaining(selectedMinutes * 60)
    setOpenSeconds(0)
    setShowExitDialog(false)
  }

  function handleReturnClick() {
    if (sessionState === 'running' || sessionState === 'paused') {
      setShowExitDialog(true)
    } else {
      onBack()
    }
  }

  function handleForceExit() {
    handleEndSession()
    onBack()
  }

  // Calculate progress for timed circular indicator
  const totalSeconds = selectedMinutes * 60
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - timeRemaining) / totalSeconds) * 100 : 0
  const strokeDashoffset = 283 - (283 * (100 - progressPercent)) / 100

  return (
    <main
      id="companion-screen"
      className="
        h-[100dvh] max-w-[420px] mx-auto
        px-6 pt-10 pb-6
        flex flex-col justify-between
        overflow-hidden
        bg-[#0E0E0E]
        animate-fade-in
      "
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between shrink-0">
        <button
          id="companion-back"
          onClick={handleReturnClick}
          className="
            flex items-center gap-1.5
            font-sans text-[#52525B] text-[0.62rem]
            tracking-[0.14em] uppercase
            hover:text-[#71717A] transition-colors
            focus:outline-none
          "
        >
          <span className="text-[0.8rem] leading-none">←</span>
          return
        </button>

        <h1 className="font-serif-nook text-[#E5E0D8] text-xl font-light tracking-[0.18em] leading-none">
          Companion
        </h1>

        <div className="w-[60px]" aria-hidden="true" />
      </header>

      {/* ── Main Presence Area ───────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto min-h-0">
        {sessionState !== 'completed' ? (
          <>
            {/* Resting Companion Emblem */}
            <RestingCompanion isSleeping={sessionState !== 'running'} />

            <p className="font-serif-nook text-[#71717A] text-[1.05rem] font-light italic tracking-wide text-center mt-1 mb-6">
              Sitting with you. No rush, no expectations.
            </p>

            {/* Mode Switcher (only configurable when idle) */}
            {sessionState === 'idle' && (
              <div className="flex items-center border border-[#1E1E1E] p-0.5 rounded-full mb-6">
                <button
                  id="mode-timed-btn"
                  onClick={() => setMode('timed')}
                  className={`
                    px-4 py-1.5 rounded-full font-sans text-[0.6rem] tracking-[0.14em] uppercase
                    transition-all duration-300 focus:outline-none
                    ${mode === 'timed'
                      ? 'bg-[#1C1C1C] text-[#E5E0D8] border border-[#2A2A2A]'
                      : 'text-[#52525B] hover:text-[#71717A]'
                    }
                  `}
                >
                  Timed Focus
                </button>
                <button
                  id="mode-open-btn"
                  onClick={() => setMode('open')}
                  className={`
                    px-4 py-1.5 rounded-full font-sans text-[0.6rem] tracking-[0.14em] uppercase
                    transition-all duration-300 focus:outline-none
                    ${mode === 'open'
                      ? 'bg-[#1C1C1C] text-[#E5E0D8] border border-[#2A2A2A]'
                      : 'text-[#52525B] hover:text-[#71717A]'
                    }
                  `}
                >
                  Open Presence
                </button>
              </div>
            )}

            {/* Timed Focus Duration Selection */}
            {mode === 'timed' && sessionState === 'idle' && (
              <div className="flex items-center gap-2 mb-6">
                {PRESET_MINUTES.map(mins => (
                  <button
                    key={mins}
                    id={`preset-${mins}m`}
                    onClick={() => setSelectedMinutes(mins)}
                    className={`
                      px-3.5 py-1 border font-sans text-[0.65rem] tracking-wider
                      transition-all duration-300 focus:outline-none
                      ${selectedMinutes === mins
                        ? 'border-[#C9B99A]/50 text-[#C9B99A] bg-[#C9B99A]/8'
                        : 'border-[#222222] text-[#52525B] hover:border-[#333333]'
                      }
                    `}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            )}

            {/* Active Display / Countdown */}
            <div className="relative flex flex-col items-center justify-center my-2">
              {mode === 'timed' && (sessionState === 'running' || sessionState === 'paused') && (
                <div className="relative w-40 h-40 flex items-center justify-center">
                  {/* Subtle circular SVG track */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="#1A1A1A"
                      strokeWidth="2"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="#C9B99A"
                      strokeWidth="2"
                      strokeDasharray="283"
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-serif-nook text-[#E5E0D8] text-3xl font-light tracking-wide tabular-nums">
                      {formatTime(timeRemaining)}
                    </span>
                    <span className="font-sans text-[0.55rem] tracking-[0.16em] uppercase text-[#71717A] mt-1">
                      {sessionState === 'paused' ? 'paused' : 'resting with you'}
                    </span>
                  </div>
                </div>
              )}

              {mode === 'open' && (sessionState === 'running' || sessionState === 'paused') && (
                <div className="flex flex-col items-center">
                  <span className="font-serif-nook text-[#E5E0D8] text-3xl font-light tracking-wide tabular-nums">
                    {formatOpenTime(openSeconds)}
                  </span>
                  <span className="font-sans text-[0.55rem] tracking-[0.16em] uppercase text-[#71717A] mt-1">
                    {sessionState === 'paused' ? 'paused' : 'quietly present'}
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ── Completion State ── */
          <div className="flex flex-col items-center text-center animate-fade-in py-6">
            <RestingCompanion isSleeping={true} />

            <h2 className="font-serif-nook text-[#E5E0D8] text-2xl font-light tracking-wide mt-4 mb-1">
              Session complete.
            </h2>
            <p className="font-serif-nook text-[#71717A] text-[1.1rem] font-light italic leading-relaxed mb-8">
              Thank you for your time.
            </p>

            <div className="flex flex-col gap-3 w-full max-w-[200px]">
              <button
                id="companion-rest-again-btn"
                onClick={handleEndSession}
                className="
                  w-full py-2.5 border border-[#2A2A2A]
                  font-serif-nook text-[#E5E0D8] text-[0.95rem] font-light
                  hover:border-[#C9B99A]/40 hover:text-[#C9B99A]
                  transition-all duration-300 focus:outline-none
                "
              >
                Rest again
              </button>
              <button
                id="companion-finish-return-btn"
                onClick={onBack}
                className="
                  w-full py-2 font-sans text-[#52525B] text-[0.62rem]
                  tracking-[0.16em] uppercase hover:text-[#71717A]
                  transition-colors focus:outline-none
                "
              >
                Return home
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Control Actions Bar ──────────────────────────────── */}
      {sessionState !== 'completed' && (
        <div className="flex items-center justify-center gap-4 shrink-0 pt-4 border-t border-[#1C1C1C]">
          {sessionState === 'idle' && (
            <button
              id="companion-begin-btn"
              onClick={handleStart}
              className="
                px-8 py-2.5 border border-[#2A2A2A]
                font-serif-nook text-[#E5E0D8] text-[1.05rem] font-light
                hover:border-[#C9B99A]/40 hover:text-[#C9B99A]
                transition-all duration-300 focus:outline-none
              "
            >
              Begin with companion
            </button>
          )}

          {sessionState === 'running' && (
            <>
              <button
                id="companion-pause-btn"
                onClick={handlePause}
                className="
                  px-6 py-2 border border-[#2A2A2A]
                  font-sans text-[#E5E0D8] text-[0.68rem] tracking-[0.14em] uppercase
                  hover:border-[#C9B99A]/40 hover:text-[#C9B99A]
                  transition-all duration-300 focus:outline-none
                "
              >
                Pause
              </button>
              <button
                id="companion-end-btn"
                onClick={handleEndSession}
                className="
                  px-4 py-2 font-sans text-[#52525B] text-[0.62rem] tracking-[0.14em] uppercase
                  hover:text-[#71717A] transition-colors focus:outline-none
                "
              >
                End session
              </button>
            </>
          )}

          {sessionState === 'paused' && (
            <>
              <button
                id="companion-resume-btn"
                onClick={handleResume}
                className="
                  px-6 py-2 border border-[#2A2A2A]
                  font-sans text-[#E5E0D8] text-[0.68rem] tracking-[0.14em] uppercase
                  hover:border-[#C9B99A]/40 hover:text-[#C9B99A]
                  transition-all duration-300 focus:outline-none
                "
              >
                Resume
              </button>
              <button
                id="companion-end-paused-btn"
                onClick={handleEndSession}
                className="
                  px-4 py-2 font-sans text-[#52525B] text-[0.62rem] tracking-[0.14em] uppercase
                  hover:text-[#71717A] transition-colors focus:outline-none
                "
              >
                End session
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Soft Exit Friction Confirmation Modal ────────────── */}
      {showExitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6 animate-fade-in">
          <div className="w-full max-w-[340px] bg-[#121212] border border-[#222222] p-6 text-center animate-lift-in">
            <h3 className="font-serif-nook text-[#E5E0D8] text-xl font-light mb-2">
              Take your time.
            </h3>
            <p className="font-serif-nook text-[#71717A] text-sm font-light italic mb-6">
              Are you ready to step away?
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                id="exit-dialog-stay-btn"
                onClick={() => setShowExitDialog(false)}
                className="
                  w-full py-2.5 border border-[#2A2A2A]
                  font-serif-nook text-[#E5E0D8] text-[0.95rem] font-light
                  hover:border-[#C9B99A]/40 hover:text-[#C9B99A]
                  transition-all duration-300 focus:outline-none
                "
              >
                Stay a little longer
              </button>
              <button
                id="exit-dialog-end-btn"
                onClick={handleForceExit}
                className="
                  w-full py-2 font-sans text-[#52525B] text-[0.6rem] tracking-[0.14em] uppercase
                  hover:text-[#71717A] transition-colors focus:outline-none
                "
              >
                End gently
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
