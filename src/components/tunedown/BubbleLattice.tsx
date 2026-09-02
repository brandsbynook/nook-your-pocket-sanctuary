import { useState, useRef, useCallback } from 'react'
import { triggerHaptic } from '../../utils/haptics'
import BottomControlsDock, { ActionPill } from './BottomControlsDock'

export default function BubbleLattice({ isMuted = false }: { isMuted?: boolean }) {
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
    <div className="relative w-full flex-1 min-h-[70vh] flex items-center justify-center overflow-hidden touch-none select-none animate-fade-in">
      {/* Floating Subtitle */}
      <p className="absolute top-16 left-0 right-0 z-20 font-serif-nook text-[#71717A] text-xs font-light italic px-4 text-center pointer-events-none">
        Tactile popping grid. Press to release, unhurried and infinite.
      </p>

      {/* 6x8 Responsive Mobile Matrix Bubble Grid */}
      <div className="z-10 w-full max-w-sm px-4 flex flex-col items-center gap-4 pointer-events-auto">
        <div className="grid grid-cols-6 gap-2 w-full p-2">
          {poppedState.map((popped, idx) => (
            <button
              key={idx}
              onClick={() => handlePop(idx)}
              className={`
                aspect-square rounded-xl transition-all duration-300 transform active:scale-90 focus:outline-none cursor-pointer flex items-center justify-center relative
                ${popped
                  ? 'bg-[#0D0D0F] border border-[#1F1F23] shadow-inner'
                  : 'bg-[#141416] border border-[#222225] shadow-md hover:border-[#52525B]'
                }
              `}
              aria-label={`Bubble ${idx + 1}`}
            >
              <div
                className={`
                  w-3.5 h-3.5 rounded-full transition-all duration-300
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

      {/* Standardized Unified Bottom Dock */}
      <BottomControlsDock>
        <ActionPill onClick={handleResetAll}>
          Restore Grid
        </ActionPill>
      </BottomControlsDock>
    </div>
  )
}
