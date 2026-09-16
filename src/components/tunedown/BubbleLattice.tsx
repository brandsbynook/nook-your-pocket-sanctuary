import { useState, useRef, useCallback } from 'react'
import { triggerHaptic } from '../../utils/haptics'
import { ActionPill } from './BottomControlsDock'

export interface BubbleLatticeProps {
  isMuted?: boolean
  title?: string
  subtitle?: string
  caption?: string
}

export default function BubbleLattice({
  isMuted = false,
  title,
  subtitle,
  caption = 'Tactile popping grid. Press to release, unhurried and infinite.',
}: BubbleLatticeProps) {
  const [poppedState, setPoppedState] = useState<boolean[]>(() => Array(48).fill(false))
  const audioCtxRef = useRef<AudioContext | null>(null)

  const playPopSound = useCallback(() => {
    if (isMuted) return
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass()
        }
      }
      const ctx = audioCtxRef.current
      if (!ctx) return
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      // Random gentle pitch between 420Hz and 640Hz with fast sweep
      const freq = 420 + Math.random() * 220
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.04)

      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.06)
    } catch {
      // Fallback silently
    }
  }, [isMuted])

  const handlePop = (index: number) => {
    triggerHaptic(12)
    playPopSound()

    setPoppedState(prev => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }

  const handleResetAll = () => {
    triggerHaptic(15)
    setPoppedState(Array(48).fill(false))
  }

  return (
    <div className="h-full flex flex-col justify-between items-center overflow-hidden py-2 select-none touch-none animate-fade-in w-full">
      {/* ── 1. Compact Top Block (Title, Subtitle & Helper Caption) ── */}
      <div className="shrink-0 text-center px-4 mb-1 sm:mb-2 pointer-events-none">
        {title && (
          <h2 className="font-serif-nook text-lg sm:text-xl text-[#E5E5E7] tracking-widest leading-tight">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="font-sans text-[0.62rem] sm:text-xs text-[#71717A] tracking-wider uppercase mt-0.5">
            {subtitle}
          </p>
        )}
        {caption && (
          <p className="font-serif-nook text-xs sm:text-sm text-[#A1A1AA] italic font-normal tracking-wide">
            {caption}
          </p>
        )}
      </div>

      {/* ── 2. Responsive Grid Sizing in Flexible Container ── */}
      <div className="flex-1 flex items-center justify-center min-h-0 w-full px-2 sm:px-4">
        <div className="grid grid-cols-6 gap-2 sm:gap-3 max-h-[50vh] max-w-xs sm:max-w-sm w-full p-1 place-items-center pointer-events-auto">
          {poppedState.map((popped, idx) => (
            <button
              key={idx}
              onClick={() => handlePop(idx)}
              className={`
                w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 aspect-square max-h-[5.5vh] max-w-[5.5vh] rounded-xl
                transition-all duration-300 transform active:scale-90 focus:outline-none cursor-pointer
                flex items-center justify-center relative
                ${popped
                  ? 'bg-[#0D0D0F] border border-[#1F1F23] shadow-inner'
                  : 'bg-[#141416] border border-[#222225] shadow-md hover:border-[#52525B]'
                }
              `}
              aria-label={`Bubble ${idx + 1}`}
            >
              <div
                className={`
                  w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all duration-300
                  ${popped
                    ? 'bg-[#52525B] shadow-inner scale-75 opacity-50'
                    : 'bg-[#E5E5E7]/70 shadow-[0_0_8px_rgba(229,229,231,0.2)] scale-100'
                  }
                `}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Pinned Bottom Restore Grid Action ── */}
      <div className="shrink-0 pb-2 z-10 pointer-events-auto select-none">
        <div className="flex items-center gap-1.5 p-1.5 bg-[#141416] border border-[#222225] rounded-full shadow-none">
          <ActionPill onClick={handleResetAll}>
            Restore Grid
          </ActionPill>
        </div>
      </div>
    </div>
  )
}

export { BubbleLattice as Bubble }
