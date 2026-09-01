import { useState, useRef, useCallback } from 'react'
import { triggerHaptic } from '../../utils/haptics'
import BottomControlsDock, { ActionPill } from './BottomControlsDock'

export default function BubbleLattice({ isMuted = false }: { isMuted?: boolean }) {
  const [poppedState, setPoppedState] = useState<boolean[]>(() => Array(36).fill(false))
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
    setPoppedState(Array(36).fill(false))
  }

  return (
    <div className="relative w-full flex-1 min-h-[70vh] flex items-center justify-center overflow-hidden touch-none select-none animate-fade-in">
      {/* Floating Subtitle */}
      <p className="absolute top-16 left-0 right-0 z-20 font-serif-nook text-[#9E988F] text-xs font-light italic px-4 text-center pointer-events-none">
        Tactile popping grid. Press to release, unhurried and infinite.
      </p>

      {/* 6x6 Bubble Lattice Grid */}
      <div className="z-10 w-full max-w-[340px] px-4 flex flex-col items-center gap-4 pointer-events-auto">
        <div className="grid grid-cols-6 gap-2.5 w-full aspect-square p-2">
          {poppedState.map((popped, idx) => (
            <button
              key={idx}
              onClick={() => handlePop(idx)}
              className={`
                rounded-2xl transition-all duration-300 transform active:scale-90 focus:outline-none cursor-pointer flex items-center justify-center relative
                ${popped
                  ? 'bg-[#18181E] border border-[#262632] shadow-inner'
                  : 'bg-gradient-to-b from-[#25252E] to-[#1B1B22] border border-[#353544]/70 shadow-md hover:border-[#C9B99A]/40'
                }
              `}
              aria-label={`Bubble ${idx + 1}`}
            >
              <div
                className={`
                  w-3.5 h-3.5 rounded-full transition-all duration-300
                  ${popped
                    ? 'bg-[#0E0E12] shadow-inner scale-75 opacity-50'
                    : 'bg-[#C9B99A]/60 shadow-[0_0_8px_rgba(201,185,154,0.3)] scale-100'
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
