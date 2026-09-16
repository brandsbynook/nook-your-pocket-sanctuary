import { useState, useEffect, useRef } from 'react'
import { triggerHaptic } from '../../utils/haptics'
import BottomControlsDock, { SegmentedPillGroup } from './BottomControlsDock'

export type DotMovementPattern = 'dynamic' | 'bloom'

interface Ripple {
  id: number
  x: number
  y: number
  radius: number
  alpha: number
}

interface BloomRing {
  id: number
  x: number
  y: number
  delayMs: number
  peakOpacity: number
  createdAt: number
}

export default function FollowTheDot({ initialPattern = 'dynamic' }: { initialPattern?: DotMovementPattern }) {
  const [pattern, setPattern] = useState<DotMovementPattern>(initialPattern)
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [bloomRipples, setBloomRipples] = useState<BloomRing[]>([])
  const [now, setNow] = useState<number>(Date.now())

  const containerRef = useRef<HTMLDivElement | null>(null)

  // Physics state refs (uncontrolled for 60fps smoothness)
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const velRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const timeRef = useRef<number>(0)

  // Active touch/pointer target
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false })
  const dotElemRef = useRef<HTMLDivElement | null>(null)

  // Pattern switch handler
  function handleSelectPattern(p: DotMovementPattern) {
    setPattern(p)
    if (p === 'dynamic') {
      triggerHaptic(12)
    }
  }

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    if (pattern === 'bloom') {
      // Fix header clipping: clamp py so ripple center never renders under fixed top header bar
      const clampedY = Math.max(80, py)
      const nowTime = Date.now()

      // 3-ring staggered sequence per tap (Ring 1: 0ms/0.60, Ring 2: 220ms/0.45, Ring 3: 440ms/0.30)
      const newSequence: BloomRing[] = [
        { id: nowTime + Math.random(),     x: px, y: clampedY, delayMs: 0,   peakOpacity: 0.60, createdAt: nowTime },
        { id: nowTime + 1 + Math.random(), x: px, y: clampedY, delayMs: 220, peakOpacity: 0.45, createdAt: nowTime },
        { id: nowTime + 2 + Math.random(), x: px, y: clampedY, delayMs: 440, peakOpacity: 0.30, createdAt: nowTime },
      ]
      setBloomRipples(prev => [...prev, ...newSequence])
    } else {
      pointerRef.current = { x: px, y: py, active: true }
      triggerHaptic(8)

      // Spawn 1px faint expanding ripple ring on tap in dynamic mode
      const newRipple: Ripple = {
        id: Date.now() + Math.random(),
        x: px,
        y: py,
        radius: 8,
        alpha: 0.45,
      }
      setRipples(prev => [...prev.slice(-4), newRipple])
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pattern === 'bloom') return
    if (!pointerRef.current.active) return
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    pointerRef.current.x = e.clientX - rect.left
    pointerRef.current.y = e.clientY - rect.top
  }

  const handlePointerUp = () => {
    pointerRef.current.active = false
  }

  // Ripple animation & pruning loop
  useEffect(() => {
    if (ripples.length === 0 && bloomRipples.length === 0) return
    const timer = setInterval(() => {
      const currentTime = Date.now()
      setNow(currentTime)

      setRipples(prev =>
        prev
          .map(r => ({
            ...r,
            radius: r.radius + 1.8,
            alpha: r.alpha - 0.02,
          }))
          .filter(r => r.alpha > 0)
      )

      setBloomRipples(prev => prev.filter(r => currentTime - r.createdAt < r.delayMs + 3000))
    }, 16)
    return () => clearInterval(timer)
  }, [ripples.length, bloomRipples.length])

  // Main 60fps Physics & Wander Engine for Dynamic Flow mode
  useEffect(() => {
    if (pattern !== 'dynamic') return

    let animId: number

    const container = containerRef.current
    if (container) {
      const rect = container.getBoundingClientRect()
      posRef.current = { x: rect.width / 2, y: rect.height / 2 }
    }

    const updatePhysics = () => {
      const container = containerRef.current
      if (!container) {
        animId = requestAnimationFrame(updatePhysics)
        return
      }

      const rect = container.getBoundingClientRect()
      const width = rect.width || window.innerWidth
      const height = rect.height || window.innerHeight

      timeRef.current += 0.008
      const t = timeRef.current

      // Continuous migratory wander path
      const wanderX = (Math.sin(t * 0.6) * 0.7 + Math.cos(t * 1.1) * 0.3) * (width * 0.35)
      const wanderY = (Math.cos(t * 0.45) * 0.7 + Math.sin(t * 0.9) * 0.3) * (height * 0.28)

      let targetX = width / 2 + wanderX
      let targetY = height / 2 + wanderY

      if (pointerRef.current.active) {
        targetX = pointerRef.current.x
        targetY = pointerRef.current.y
      }

      const dx = targetX - posRef.current.x
      const dy = targetY - posRef.current.y
      const dist = Math.hypot(dx, dy) || 0.001

      const nx = dx / dist
      const ny = dy / dist

      // Perpendicular centrifugal/orbital swirl
      const orthoX = -ny
      const orthoY = nx
      const pull = Math.min(0.18, dist * 0.0025)
      const orbital = Math.sin(t * 1.8) * 0.09 + 0.05

      velRef.current.x += nx * pull + orthoX * orbital
      velRef.current.y += ny * pull + orthoY * orbital

      velRef.current.x *= 0.965
      velRef.current.y *= 0.965

      // Enforce steady meditative glide speed so it never stalls
      const speed = Math.hypot(velRef.current.x, velRef.current.y)
      const minSpeed = 0.8
      const maxSpeed = 2.8

      if (speed < minSpeed) {
        const factor = minSpeed / (speed || 0.001)
        velRef.current.x *= factor
        velRef.current.y *= factor
      } else if (speed > maxSpeed) {
        const factor = maxSpeed / speed
        velRef.current.x *= factor
        velRef.current.y *= factor
      }

      posRef.current.x += velRef.current.x
      posRef.current.y += velRef.current.y

      const pad = 28
      posRef.current.x = Math.max(pad, Math.min(width - pad, posRef.current.x))
      posRef.current.y = Math.max(pad, Math.min(height - pad, posRef.current.y))

      if (dotElemRef.current) {
        dotElemRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`
      }

      animId = requestAnimationFrame(updatePhysics)
    }

    animId = requestAnimationFrame(updatePhysics)
    return () => cancelAnimationFrame(animId)
  }, [pattern])

  const PATTERN_LABELS: { id: DotMovementPattern; label: string }[] = [
    { id: 'dynamic', label: 'Dynamic Flow' },
    { id: 'bloom',   label: 'Bloom' },
  ]

  return (
    <div className="w-full h-full flex flex-col flex-1 min-h-0 bg-[#0A0A0B] animate-fade-in select-none">
      {/* Fixed Header Area (outside interactive canvas) */}
      <div className="flex flex-col items-center text-center px-6 pt-4 pb-2 select-none pointer-events-none shrink-0">
        <h1 className="font-serif text-xl sm:text-2xl text-[#E5E5E7] tracking-tight">Ripple & Flow</h1>
        <p className="text-xs sm:text-sm text-[#71717A] tracking-wider mt-1">fluid touch & soft gaze</p>
        <p className="font-serif text-sm sm:text-base text-[#A1A1AA] italic font-normal tracking-wide leading-relaxed mt-3 max-w-xs">
          {pattern === 'bloom'
            ? 'A quiet visual anchor. Soften your focus and let your peripheral gaze widen.'
            : 'Smooth organic drift. Touch and hold to softly guide the light.'}
        </p>
      </div>

      {/* Interactive Touch Container (starts below header) */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex-1 w-full relative touch-none overflow-hidden flex items-center justify-center"
      >
        {/* Dynamic Flow Mode Ripples */}
        {pattern === 'dynamic' && ripples.map(r => (
          <div
            key={r.id}
            className="absolute rounded-full border border-[#E5E5E7]/25 pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
            style={{
              left: `${r.x}px`,
              top: `${r.y}px`,
              width: `${r.radius * 2}px`,
              height: `${r.radius * 2}px`,
              opacity: r.alpha,
            }}
          />
        ))}

        {/* Bloom Mode Water-Ripple Touch Effect (3-ring staggered sequence per tap) */}
        {pattern === 'bloom' && bloomRipples.map(r => {
          const ringElapsed = Math.max(0, now - (r.createdAt + r.delayMs))
          if (now < r.createdAt + r.delayMs) return null
          if (ringElapsed >= 3000) return null

          const progress = Math.min(1, ringElapsed / 3000)
          // Ease-out timing (fast at first, slowing down to ~180px radius)
          const eased = 1 - Math.pow(1 - progress, 3)
          const radius = eased * 180

          // Opacity drops faster in first 2/3 and completes fully by 85% of duration (2550ms)
          const fadeProgress = Math.min(1, progress / 0.85)
          const opacity = Math.max(0, r.peakOpacity * Math.pow(1 - fadeProgress, 1.4))

          if (opacity <= 0.001) return null

          return (
            <div
              key={r.id}
              className="absolute rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${r.x}px`,
                top: `${r.y}px`,
                width: `${radius * 2}px`,
                height: `${radius * 2}px`,
                border: '1px solid #E5E5E7',
                opacity,
              }}
            />
          )
        })}

        {/* Solid Flat Circle (Rendered ONLY in Dynamic Flow mode) */}
        {pattern === 'dynamic' && (
          <div
            ref={dotElemRef}
            className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{
              transform: 'translate3d(50vw, 50vh, 0)',
            }}
          >
            <div className="w-[18px] h-[18px] rounded-full bg-[#E5E5E7]" />
          </div>
        )}

        {/* Standardized Unified Bottom Controls Dock */}
        <BottomControlsDock>
          <SegmentedPillGroup
            options={PATTERN_LABELS}
            value={pattern}
            onChange={handleSelectPattern}
          />
        </BottomControlsDock>
      </div>
    </div>
  )
}
