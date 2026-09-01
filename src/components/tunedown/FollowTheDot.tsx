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

export default function FollowTheDot({ initialPattern = 'dynamic' }: { initialPattern?: DotMovementPattern }) {
  const [pattern, setPattern] = useState<DotMovementPattern>(initialPattern)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [ripples, setRipples] = useState<Ripple[]>([])

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
    triggerHaptic(12)
  }

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    pointerRef.current = { x: px, y: py, active: true }
    triggerHaptic(8)

    // Spawn 1px faint expanding ripple ring on tap/release
    const newRipple: Ripple = {
      id: Date.now() + Math.random(),
      x: px,
      y: py,
      radius: 8,
      alpha: 0.45,
    }
    setRipples(prev => [...prev.slice(-4), newRipple])
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
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

  // Ripple animation loop
  useEffect(() => {
    if (ripples.length === 0) return
    const timer = setInterval(() => {
      setRipples(prev =>
        prev
          .map(r => ({
            ...r,
            radius: r.radius + 1.8,
            alpha: r.alpha - 0.02,
          }))
          .filter(r => r.alpha > 0)
      )
    }, 16)
    return () => clearInterval(timer)
  }, [ripples.length])

  // Main 60fps Physics & Wander Engine
  useEffect(() => {
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

      if (pattern === 'bloom') {
        // Stationary center anchor for foveal bloom
        posRef.current.x = width / 2
        posRef.current.y = height / 2
        if (dotElemRef.current) {
          dotElemRef.current.style.transform = `translate3d(${width / 2}px, ${height / 2}px, 0)`
        }
        animId = requestAnimationFrame(updatePhysics)
        return
      }

      // Continuous time clock
      timeRef.current += 0.008
      const time = timeRef.current

      // 1. Base Wander Target Calculation (Non-integer harmonic ratio curves)
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

      // Orthogonal vector for tangential orbital curving
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

      // Direct DOM update for 60fps performance without React re-renders
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

      {/* 1px Faint Expanding Ripple Rings */}
      {ripples.map(r => (
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

      {/* 18px Solid Flat Circle (Zero shadow / glow) */}
      <div
        ref={dotElemRef}
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
        style={{
          transform: 'translate3d(50vw, 50vh, 0)',
        }}
      >
        {pattern === 'bloom' ? (
          <div className="relative flex items-center justify-center">
            {/* Foveal peripheral halo for Bloom */}
            <div className="absolute -inset-16 rounded-full bg-gradient-to-r from-[rgba(229,224,216,0.18)] to-[rgba(201,185,154,0.12)] animate-foveal-halo pointer-events-none" />
            <div className="w-[18px] h-[18px] rounded-full bg-[#EAE5DC]" />
          </div>
        ) : (
          <div className="w-[18px] h-[18px] rounded-full bg-[#EAE5DC]" />
        )}
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
