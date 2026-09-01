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

      // Continuous time clock
      timeRef.current += 0.008
      const time = timeRef.current

      // 1. Base Wander Target Calculation
      const wanderX = Math.sin(time * 0.7) * 0.6 + Math.cos(time * 1.3) * 0.4
      const wanderY = Math.cos(time * 0.5) * 0.6 + Math.sin(time * 1.1) * 0.4

      let targetX = width / 2 + wanderX * (width * 0.36)
      let targetY = height / 2 + wanderY * (height * 0.30)

      // 2. Blend Pointer Attraction when active touch is present
      if (pointerRef.current.active) {
        const px = pointerRef.current.x
        const py = pointerRef.current.y
        targetX = px * 0.85 + targetX * 0.15
        targetY = py * 0.85 + targetY * 0.15
      }

      // 3. Gravitational Attractor & Orbital Curve Physics
      const dx = targetX - posRef.current.x
      const dy = targetY - posRef.current.y
      const dist = Math.hypot(dx, dy) || 0.001

      const nx = dx / dist
      const ny = dy / dist

      const orthoX = -ny
      const orthoY = nx

      const pullForce = Math.min(0.24, dist * 0.003)
      const orbitalForce = Math.sin(time * 2.2) * 0.04 * Math.min(1.2, dist * 0.008)

      velRef.current.x += nx * pullForce + orthoX * orbitalForce
      velRef.current.y += ny * pullForce + orthoY * orbitalForce

      // 4. Damping & Speed Calibration
      velRef.current.x *= 0.92
      velRef.current.y *= 0.92

      const maxSpeed = 3.5
      const currentSpeed = Math.hypot(velRef.current.x, velRef.current.y)
      if (currentSpeed > maxSpeed) {
        velRef.current.x = (velRef.current.x / currentSpeed) * maxSpeed
        velRef.current.y = (velRef.current.y / currentSpeed) * maxSpeed
      }

      posRef.current.x += velRef.current.x
      posRef.current.y += velRef.current.y

      // Screen boundary padding clamp
      const pad = 24
      posRef.current.x = Math.max(pad, Math.min(width - pad, posRef.current.x))
      posRef.current.y = Math.max(pad, Math.min(height - pad, posRef.current.y))

      // Direct DOM update for 60fps performance
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
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-full min-h-[70vh] flex-1 flex items-center justify-center overflow-hidden touch-none select-none bg-[#0B0B0E] animate-fade-in"
    >
      {/* Subtitle */}
      <p className="absolute top-16 left-4 right-4 z-20 font-serif-nook text-neutral-400 text-xs font-light italic text-center pointer-events-none">
        {pattern === 'bloom'
          ? 'A quiet visual anchor. Soften your focus and let your peripheral gaze widen.'
          : 'Smooth organic drift. Touch and hold to softly guide the light.'}
      </p>

      {/* Dynamic Flow Mode Ripples */}
      {pattern === 'dynamic' && ripples.map(r => (
        <div
          key={r.id}
          className="absolute rounded-full border border-[#EAE5DC]/25 pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
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
              border: '1px solid #C9B99A',
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
          <div className="w-[18px] h-[18px] rounded-full bg-[#EAE5DC]" />
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
  )
}
