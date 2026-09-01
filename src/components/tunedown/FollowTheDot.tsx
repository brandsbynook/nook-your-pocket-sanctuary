import { useState, useEffect, useRef } from 'react'
import { triggerHaptic } from '../../utils/haptics'
import BottomControlsDock, { SegmentedPillGroup } from './BottomControlsDock'

export type DotMovementPattern = 'dynamic' | 'bloom'

interface FollowTheDotProps {
  initialPattern?: DotMovementPattern
}

export default function FollowTheDot({ initialPattern = 'dynamic' }: FollowTheDotProps) {
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
      if (pattern === 'dynamic') {
        // Smooth, unhurried harmonic flow blending bilateral sweeps, soft orbits, and undulating paths
        const t = timestamp * 0.0004
        const x = 50 + 24 * Math.sin(t * 1.3) + 12 * Math.cos(t * 0.7)
        const y = 50 + 18 * Math.cos(t * 1.1) + 10 * Math.sin(t * 0.5)
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
    { id: 'dynamic', label: 'Dynamic Flow' },
    { id: 'bloom',   label: 'Bloom' },
  ]

  return (
    <div className="relative w-full flex-1 min-h-[70vh] flex items-center justify-center overflow-hidden touch-none select-none bg-[#0B0B0E] animate-fade-in">
      {/* Floating Subtitle */}
      <p className="absolute top-16 left-4 right-4 z-20 font-serif-nook text-neutral-400 text-xs font-light italic text-center pointer-events-none">
        {pattern === 'bloom'
          ? 'A quiet visual anchor. Soften your focus and let your peripheral gaze widen.'
          : 'Smooth, unhurried tracking. Let your gaze float effortlessly with the light.'}
      </p>

      {/* Full-Bleed Container Area */}
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none z-10"
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

          {/* Layer 3: Grounded Core Dot */}
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

      {/* Standardized Unified Bottom Controls Dock */}
      <BottomControlsDock>
        <SegmentedPillGroup
          options={PATTERN_LABELS}
          value={pattern}
          onChange={handleSelectPattern}
        />
      </BottomControlsDock>
    </div>
  )
}
