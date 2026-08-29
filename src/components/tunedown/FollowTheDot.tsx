import { useState, useEffect, useRef } from 'react'

type DotSpeed = 'gentle' | 'slower' | 'still'

export default function FollowTheDot() {
  const [speed, setSpeed] = useState<DotSpeed>('gentle')
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 })

  const timeRef = useRef<number>(0)
  const reqRef = useRef<number | null>(null)

  useEffect(() => {
    if (speed === 'still') {
      setPosition({ x: 50, y: 50 })
      return
    }

    const speedMultiplier = speed === 'gentle' ? 0.0006 : 0.0003

    const animate = (timestamp: number) => {
      timeRef.current = timestamp * speedMultiplier

      // Organic Lissajous curve inside percentage space (20% to 80%)
      const x = 50 + 30 * Math.sin(timeRef.current * 1.3) * Math.cos(timeRef.current * 0.7)
      const y = 50 + 30 * Math.sin(timeRef.current * 0.9 + 1.2) * Math.cos(timeRef.current * 0.5)

      setPosition({ x, y })
      reqRef.current = requestAnimationFrame(animate)
    }

    reqRef.current = requestAnimationFrame(animate)

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current)
    }
  }, [speed])

  return (
    <div className="flex flex-col items-center justify-between flex-1 py-4 animate-fade-in text-center min-h-0 w-full">
      {/* Subtitle */}
      <p className="font-serif-nook text-[#71717A] text-[0.95rem] font-light italic px-4">
        Rest your eyes here. Follow the light at your own pace.
      </p>

      {/* Floating Canvas / Container Area */}
      <div
        ref={containerRef}
        className="relative my-auto w-full h-[280px] border border-[#1A1A1A] bg-[#0C0C0C] rounded-sm overflow-hidden"
      >
        {/* Soft floating orb */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ease-out pointer-events-none"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
          }}
        >
          {/* Outer glow blur */}
          <div className="w-16 h-16 rounded-full bg-[#C9B99A]/20 blur-xl absolute -inset-2" />

          {/* Core Dot */}
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-r from-[#E5E0D8] to-[#C9B99A] shadow-lg flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white opacity-80 animate-ping" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        {/* Delicate center guide crosshair (very low opacity) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <div className="w-16 h-px bg-white" />
          <div className="h-16 w-px bg-white absolute" />
        </div>
      </div>

      {/* Speed Controls */}
      <div className="flex items-center gap-2">
        <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#52525B] mr-1">
          Speed:
        </span>
        {(['gentle', 'slower', 'still'] as DotSpeed[]).map(s => (
          <button
            key={s}
            id={`speed-${s}-btn`}
            onClick={() => setSpeed(s)}
            className={`
              px-3 py-1 border font-sans text-[0.62rem] tracking-wider uppercase
              transition-all duration-300 focus:outline-none
              ${speed === s
                ? 'border-[#C9B99A]/50 text-[#C9B99A] bg-[#C9B99A]/8'
                : 'border-[#222222] text-[#52525B] hover:border-[#333333]'
              }
            `}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
