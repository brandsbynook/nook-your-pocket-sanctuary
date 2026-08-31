import { useState, useEffect, useRef } from 'react'
import { triggerHaptic } from '../../utils/haptics'

export type DotMovementPattern = 'horizontal' | 'orbit' | 'wave' | 'bloom'

interface FollowTheDotProps {
  initialPattern?: DotMovementPattern
}

export default function FollowTheDot({ initialPattern = 'horizontal' }: FollowTheDotProps) {
  const [pattern, setPattern] = useState<DotMovementPattern>(initialPattern)
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 })

  const reqRef = useRef<number | null>(null)

  useEffect(() => {
    if (pattern === 'bloom') {
      setPosition({ x: 50, y: 50 })
      return
    }

    const animate = (timestamp: number) => {
      if (pattern === 'horizontal') {
        // EMDR-inspired smooth bilateral horizontal sweep (15% to 85%)
        const t = timestamp * 0.0008
        const x = 50 + 35 * Math.sin(t)
        const y = 50
        setPosition({ x, y })
      } else if (pattern === 'orbit') {
        // Smooth circular/elliptical orbit
        const t = timestamp * 0.0006
        const x = 50 + 30 * Math.cos(t)
        const y = 50 + 26 * Math.sin(t)
        setPosition({ x, y })
      } else if (pattern === 'wave') {
        // Gentle undulating Lissajous wave
        const t = timestamp * 0.0005
        const x = 50 + 32 * Math.sin(t * 1.2) * Math.cos(t * 0.6)
        const y = 50 + 26 * Math.sin(t * 0.8 + 1.2)
        setPosition({ x, y })
      }

      reqRef.current = requestAnimationFrame(animate)
    }

    reqRef.current = requestAnimationFrame(animate)

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current)
    }
  }, [pattern])

  function handleSelectPattern(p: DotMovementPattern) {
    setPattern(p)
    triggerHaptic(12)
  }

  const PATTERN_LABELS: { id: DotMovementPattern; label: string }[] = [
    { id: 'horizontal', label: 'Bilateral' },
    { id: 'orbit',      label: 'Orbit' },
    { id: 'wave',       label: 'Wave' },
    { id: 'bloom',      label: 'Bloom' },
  ]

  return (
    <div className="flex flex-col items-center justify-between flex-1 py-4 animate-fade-in text-center min-h-0 w-full">
      {/* Subtitle */}
      <p className="font-serif-nook text-neutral-400 text-xs font-light italic px-4">
        {pattern === 'bloom'
          ? 'A quiet visual anchor. Soften your focus and let your peripheral gaze widen.'
          : pattern === 'horizontal'
          ? 'EMDR-inspired bilateral eye tracking. Rest your gaze on the light.'
          : pattern === 'orbit'
          ? 'Slow continuous orbit. Allow your attention to gently follow.'
          : 'Soft horizon wave. Follow the rhythmic movement without forcing focus.'
        }
      </p>

      {/* Floating Canvas / Container Area (Clean, without crosshair artifact) */}
      <div
        ref={containerRef}
        className="relative my-auto w-full h-[280px] border border-neutral-800/60 bg-[#0B0B0E] rounded-2xl overflow-hidden shadow-inner flex items-center justify-center"
      >
        {/* Soft floating orb / Foveal soft-focus bloom anchor */}
        <div
          className={`
            absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none
            ${pattern === 'bloom' ? 'transition-none' : 'transition-transform duration-300 ease-out'}
          `}
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
          }}
        >
          {/* Layer 1: Wide panoramic peripheral halo (Active during Bloom mode) */}
          {pattern === 'bloom' && (
            <div
              className="absolute -inset-16 rounded-full bg-gradient-to-r from-[rgba(229,224,216,0.18)] to-[rgba(201,185,154,0.12)] animate-foveal-halo pointer-events-none"
            />
          )}

          {/* Layer 2: Mid-aperture luminous diffuse glow */}
          <div
            className={`
              rounded-full absolute pointer-events-none transition-all duration-700
              ${pattern === 'bloom'
                ? '-inset-8 bg-gradient-to-tr from-[#C9B99A]/30 to-[#E5E0D8]/20 animate-foveal-bloom'
                : '-inset-3 bg-[#C9B99A]/20 blur-xl w-16 h-16'
              }
            `}
          />

          {/* Layer 3: Grounded Core Dot (Stays calm and centered) */}
          <div
            className={`
              relative rounded-full bg-gradient-to-r from-[#E5E0D8] to-[#C9B99A] shadow-lg flex items-center justify-center transition-all duration-500
              ${pattern === 'bloom' ? 'w-8 h-8 ring-1 ring-[#C9B99A]/40' : 'w-8 h-8'}
            `}
          >
            <div
              className={`
                rounded-full bg-white/90
                ${pattern === 'bloom' ? 'w-3 h-3 opacity-90' : 'w-3 h-3 animate-ping'}
              `}
              style={{ animationDuration: '3s' }}
            />
          </div>
        </div>
      </div>

      {/* Pattern Controls */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-neutral-500 mr-1">
          Pattern:
        </span>
        {PATTERN_LABELS.map(item => (
          <button
            key={item.id}
            id={`pattern-${item.id}-btn`}
            onClick={() => handleSelectPattern(item.id)}
            className={`
              px-2.5 py-1.5 rounded-xl border font-mono text-[10px] tracking-wider uppercase
              transition-all duration-200 focus:outline-none cursor-pointer
              ${pattern === item.id
                ? 'border-[#C9B99A]/50 text-[#C9B99A] bg-[#C9B99A]/10'
                : 'border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-400'
              }
            `}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
