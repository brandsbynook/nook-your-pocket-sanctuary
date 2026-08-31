import { useState, useEffect, useRef, useCallback } from 'react'
import { triggerHaptic } from '../utils/haptics'

interface DecelerationModalProps {
  isOpen: boolean
  onClose: () => void        // Stay in Stillness
  onConfirmExit: () => void  // Exit to Home
}

type PauseMode = 'hold' | 'breath'

export default function DecelerationModal({
  isOpen,
  onClose,
  onConfirmExit,
}: DecelerationModalProps) {
  const [mode, setMode] = useState<PauseMode>('hold')

  // ── 8-Second Hold State ──
  const [holdProgress, setHoldProgress] = useState(0) // 0 to 1
  const [isHolding, setIsHolding] = useState(false)
  const holdStartRef = useRef<number | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // ── 10-Second Breath State (5s Inhale · 5s Exhale) ──
  const [breathActive, setBreathActive] = useState(false)
  const [breathElapsed, setBreathElapsed] = useState(0) // 0 to 10s
  const [breathCompleted, setBreathCompleted] = useState(false)
  const breathIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const HOLD_DURATION_MS = 8000 // 8 seconds friction

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setHoldProgress(0)
      setIsHolding(false)
      setBreathActive(false)
      setBreathElapsed(0)
      setBreathCompleted(false)
    }
  }, [isOpen])

  // ── Hold Animation Loop (8 Seconds) ──
  const handlePointerDown = useCallback(() => {
    setIsHolding(true)
    holdStartRef.current = performance.now() - (holdProgress * HOLD_DURATION_MS)

    const step = (now: number) => {
      if (!holdStartRef.current) return
      const elapsed = now - holdStartRef.current
      const progress = Math.min(1, elapsed / HOLD_DURATION_MS)
      setHoldProgress(progress)

      if (progress >= 1) {
        setIsHolding(false)
        triggerHaptic([30, 40, 60])
        onConfirmExit()
      } else {
        animFrameRef.current = requestAnimationFrame(step)
      }
    }

    animFrameRef.current = requestAnimationFrame(step)
  }, [holdProgress, onConfirmExit])

  const handlePointerUpOrLeave = useCallback(() => {
    if (!isHolding) return
    setIsHolding(false)
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    holdStartRef.current = null

    // Smoothly decay progress back to 0
    let current = holdProgress
    const decay = () => {
      current = Math.max(0, current - 0.04)
      setHoldProgress(current)
      if (current > 0) {
        requestAnimationFrame(decay)
      }
    }
    requestAnimationFrame(decay)
  }, [isHolding, holdProgress])

  // ── 10-Second Somatic Breath Loop (5s Inhale · 5s Exhale) ──
  const startBreathingCycle = useCallback(() => {
    setBreathActive(true)
    setBreathElapsed(0)
    setBreathCompleted(false)

    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current)

    const startTime = Date.now()
    breathIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      if (elapsed >= 10) {
        setBreathElapsed(10)
        setBreathActive(false)
        setBreathCompleted(true)
        if (breathIntervalRef.current) {
          clearInterval(breathIntervalRef.current)
          breathIntervalRef.current = null
        }
        triggerHaptic([30, 50])
      } else {
        setBreathElapsed(elapsed)
      }
    }, 50)
  }, [])

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current)
    }
  }, [])

  if (!isOpen) return null

  // SVG Ring Calculations for 8s Hold Button
  const size = 130
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (holdProgress * circumference)

  // Remaining seconds for 8s hold
  const holdSecondsLeft = Math.max(1, Math.ceil((1 - holdProgress) * 8))

  // Breath calculations
  const breathPhase = breathElapsed < 5 ? 'Inhale' : 'Exhale'
  const breathProgressRatio = Math.min(1, breathElapsed / 10)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deceleration-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="
          w-full max-w-sm bg-[#101014] border border-[#22222C]
          rounded-2xl p-6 sm:p-7 flex flex-col items-center text-center
          shadow-2xl relative overflow-hidden select-none animate-lift-in
        "
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle Ambient Radial Glow */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(201,185,154,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Modal Title & Intentional Subtitle in Title Case */}
        <h2
          id="deceleration-modal-title"
          className="font-serif-nook text-2xl font-light text-[#FFFFFF] tracking-wide"
        >
          Mindful Deceleration
        </h2>
        <p className="font-serif-nook italic text-xs text-neutral-400 font-light mt-1 leading-relaxed px-2">
          You are currently in stillness. Take a grounding breath before stepping away.
        </p>

        {/* Mode Toggle Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#14141A] border border-[#262634] rounded-full my-5">
          <button
            type="button"
            onClick={() => setMode('hold')}
            className={`
              px-4 py-1.5 rounded-full font-serif-nook text-xs tracking-wide transition-all duration-200 cursor-pointer
              ${mode === 'hold'
                ? 'bg-[#1E1C18] border border-[#C9B99A]/50 text-[#F4F0EA] shadow-sm'
                : 'text-neutral-500 hover:text-neutral-300'
              }
            `}
          >
            8s Hold
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('breath')
              if (!breathActive && !breathCompleted) {
                startBreathingCycle()
              }
            }}
            className={`
              px-4 py-1.5 rounded-full font-serif-nook text-xs tracking-wide transition-all duration-200 cursor-pointer
              ${mode === 'breath'
                ? 'bg-[#1E1C18] border border-[#C9B99A]/50 text-[#F4F0EA] shadow-sm'
                : 'text-neutral-500 hover:text-neutral-300'
              }
            `}
          >
            10s Breath
          </button>
        </div>

        {/* Mode 1: 8-Second Hold Interactive Area */}
        {mode === 'hold' && (
          <div className="flex flex-col items-center my-2">
            <div
              id="friction-hold-button"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUpOrLeave}
              onPointerLeave={handlePointerUpOrLeave}
              onContextMenu={e => e.preventDefault()}
              className="
                relative w-[130px] h-[130px] rounded-full flex items-center justify-center cursor-pointer select-none
                transition-transform duration-200 touch-none active:scale-95
              "
              role="button"
              tabIndex={0}
              aria-label="Press and hold for 8 seconds to exit session"
            >
              {/* Background circular track */}
              <svg width={size} height={size} className="absolute inset-0 -rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Foreground smooth animated fill arc */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={holdProgress > 0.8 ? '#F5F5F7' : '#C9B99A'}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>

              {/* Inner hold text / indicator */}
              <div className="flex flex-col items-center justify-center p-3 text-center pointer-events-none">
                <span className="font-serif-nook text-sm text-neutral-200 font-light">
                  {isHolding ? `${holdSecondsLeft}s Left` : 'Press & Hold'}
                </span>
                <span className="font-serif-nook italic text-[11px] text-neutral-500 mt-0.5">
                  {isHolding ? 'Stay grounded' : '8 seconds'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: 10-Second Somatic Breath Cycle (5s Inhale · 5s Exhale) */}
        {mode === 'breath' && (
          <div className="flex flex-col items-center my-2 w-full">
            {/* Visual Expanding Breath Bubble */}
            <div className="relative w-[130px] h-[130px] flex items-center justify-center">
              <div
                className="w-24 h-24 rounded-full border border-[#C9B99A]/40 bg-[#1E1C18] flex flex-col items-center justify-center transition-transform duration-300"
                style={{
                  transform: breathActive
                    ? breathElapsed < 5
                      ? `scale(${0.85 + (breathElapsed / 5) * 0.3})`
                      : `scale(${1.15 - ((breathElapsed - 5) / 5) * 0.3})`
                    : 'scale(1)',
                }}
              >
                <span className="font-serif-nook text-base text-[#FFFFFF] font-light">
                  {breathCompleted
                    ? 'Complete'
                    : breathActive
                    ? breathPhase
                    : '10s Breath'}
                </span>
                <span className="font-serif-nook italic text-[10px] text-neutral-400 mt-0.5">
                  {breathCompleted
                    ? 'Grounding complete'
                    : breathActive
                    ? `${Math.max(1, Math.ceil(breathElapsed < 5 ? 5 - breathElapsed : 10 - breathElapsed))}s`
                    : '5s In · 5s Out'}
                </span>
              </div>
            </div>

            {/* Linear Progress Bar for 10s Breath */}
            <div className="w-48 h-1 bg-[#262634] rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-[#C9B99A] transition-all duration-100 ease-linear rounded-full"
                style={{ width: `${breathProgressRatio * 100}%` }}
              />
            </div>

            {/* Breath Control or Completion Trigger */}
            <div className="mt-3">
              {!breathActive && !breathCompleted && (
                <button
                  type="button"
                  onClick={startBreathingCycle}
                  className="font-serif-nook text-xs text-[#C9B99A] hover:underline cursor-pointer"
                >
                  Begin 10s Breath →
                </button>
              )}

              {breathCompleted && (
                <button
                  id="confirm-breath-exit-btn"
                  type="button"
                  onClick={onConfirmExit}
                  className="
                    px-5 py-1.5 bg-[#22201C] border border-[#C9B99A]/60 text-[#FFFFFF]
                    font-serif-nook text-xs rounded-full hover:bg-[#2A2722] transition-colors cursor-pointer shadow-sm
                  "
                >
                  Proceed to Return →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="w-full mt-6 pt-4 border-t border-[#22222C] flex flex-col gap-2">
          <button
            id="friction-stay-btn"
            type="button"
            onClick={onClose}
            className="
              w-full py-2.5 rounded-xl bg-[#1D1B16] border border-[#C9B99A]/60 text-[#FFFFFF] hover:bg-[#24221C]
              font-serif-nook text-sm font-light tracking-wide
              transition-all duration-200 cursor-pointer shadow-sm
            "
          >
            Stay in Stillness
          </button>
        </div>
      </div>
    </div>
  )
}
