import { useState, useEffect, useRef } from 'react'
import { triggerHaptic } from '../../utils/haptics'
import BottomControlsDock, { SegmentedPillGroup } from './BottomControlsDock'

export type DotMovementPattern = 'orbit' | 'bilateral' | 'pendulum' | 'bloom'

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

interface TrailPoint {
  x: number
  y: number
  opacity: number
  scale: number
}

interface FollowTheDotProps {
  initialPattern?: DotMovementPattern
}

export default function FollowTheDot({ initialPattern = 'orbit' }: FollowTheDotProps) {
  const [pattern, setPattern] = useState<DotMovementPattern>(initialPattern)
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [bloomRipples, setBloomRipples] = useState<BloomRing[]>([])
  const [now, setNow] = useState(Date.now())

  const containerRef = useRef<HTMLDivElement | null>(null)
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false })
  const timeRef = useRef<number>(0)
  const dotElemRef = useRef<HTMLDivElement | null>(null)

  // Motion tracks and ghost wake refs
  const trailRef = useRef<TrailPoint[]>([])
  const trailElemsRef = useRef<(HTMLDivElement | null)[]>([])
  const orbitEllipseRef = useRef<SVGEllipseElement | null>(null)

  // Pattern switch handler
  function handleSelectPattern(p: DotMovementPattern) {
    setPattern(p)
    trailRef.current = []
    trailElemsRef.current.forEach(el => {
      if (el) el.style.display = 'none'
    })
    if (p !== 'bloom') {
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
      const clampedY = Math.max(80, py)
      const nowTime = Date.now()

      const newSequence: BloomRing[] = [
        { id: nowTime + Math.random(), x: px, y: clampedY, delayMs: 0, peakOpacity: 0.60, createdAt: nowTime },
        { id: nowTime + 1 + Math.random(), x: px, y: clampedY, delayMs: 220, peakOpacity: 0.45, createdAt: nowTime },
        { id: nowTime + 2 + Math.random(), x: px, y: clampedY, delayMs: 440, peakOpacity: 0.30, createdAt: nowTime },
      ]
      setBloomRipples(prev => [...prev, ...newSequence])
    } else {
      pointerRef.current = { x: px, y: py, active: true }
      triggerHaptic(8)

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

  // Main 60fps Physics & Wander Engine for motion modes
  useEffect(() => {
    if (pattern === 'bloom') return

    let animId: number
    trailRef.current = []
    trailElemsRef.current.forEach(el => {
      if (el) el.style.display = 'none'
    })

    const container = containerRef.current
    if (container) {
      const rect = container.getBoundingClientRect()
      posRef.current = { x: rect.width / 2, y: rect.height * 0.42 }
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
      const visualCenterY = height * 0.42

      timeRef.current += 0.0075
      const t = timeRef.current

      let driftX = width / 2
      let driftY = visualCenterY

      if (pattern === 'orbit') {
        const orbitAngle = t * 0.06
        const a = width * 0.38
        const b = height * 0.27
        const rawX = Math.cos(t) * a
        const rawY = Math.sin(t) * b
        driftX = (width / 2) + (rawX * Math.cos(orbitAngle) - rawY * Math.sin(orbitAngle))
        driftY = visualCenterY + (rawX * Math.sin(orbitAngle) + rawY * Math.cos(orbitAngle))

        if (orbitEllipseRef.current) {
          orbitEllipseRef.current.setAttribute('cx', String(width / 2))
          orbitEllipseRef.current.setAttribute('cy', String(visualCenterY))
          orbitEllipseRef.current.setAttribute('rx', String(a))
          orbitEllipseRef.current.setAttribute('ry', String(b))
          orbitEllipseRef.current.style.transformOrigin = `${width / 2}px ${visualCenterY}px`
          orbitEllipseRef.current.style.transform = `rotate(${orbitAngle}rad)`
        }
      } else if (pattern === 'bilateral') {
        const rx = width * 0.42
        const ry = height * 0.32
        driftX = (width / 2) + Math.sin(t) * rx
        driftY = visualCenterY + (Math.sin(t * 2) / 1.4) * ry
      } else if (pattern === 'pendulum') {
        const swingAngle = Math.sin(t * 1.5) * 0.85
        const pivotY = visualCenterY - (height * 0.12)
        const length = height * 0.42
        driftX = (width / 2) + Math.sin(swingAngle) * length
        driftY = pivotY + Math.cos(swingAngle) * length
      }

      const targetX = pointerRef.current.active ? pointerRef.current.x : driftX
      const targetY = pointerRef.current.active ? pointerRef.current.y : driftY

      const dx = targetX - posRef.current.x
      const dy = targetY - posRef.current.y
      const dist = Math.hypot(dx, dy) || 0.001

      if (pointerRef.current.active) {
        const step = Math.min(dist * 0.045, 3.2)
        posRef.current.x += (dx / dist) * step
        posRef.current.y += (dy / dist) * step
      } else {
        posRef.current.x += dx * 0.06
        posRef.current.y += dy * 0.06
      }

      const pad = 30
      posRef.current.x = Math.max(pad, Math.min(width - pad, posRef.current.x))
      posRef.current.y = Math.max(pad, Math.min(height - pad, posRef.current.y))

      if (dotElemRef.current) {
        dotElemRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`
      }

      if (pattern === 'bilateral' || pattern === 'pendulum') {
        trailRef.current = [
          { x: posRef.current.x, y: posRef.current.y, opacity: 0.4, scale: 0.95 },
          ...trailRef.current.map(p => ({ ...p, opacity: p.opacity * 0.86, scale: p.scale * 0.95 }))
        ].filter(p => p.opacity > 0.02).slice(0, 14)

        for (let i = 0; i < 14; i++) {
          const el = trailElemsRef.current[i]
          if (!el) continue
          const p = trailRef.current[i]
          if (p) {
            const size = 18 * p.scale
            el.style.display = 'block'
            el.style.width = `${size}px`
            el.style.height = `${size}px`
            el.style.opacity = String(p.opacity)
            el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
          } else {
            el.style.display = 'none'
          }
        }
      } else {
        if (trailRef.current.length > 0) {
          trailRef.current = []
        }
        for (let i = 0; i < 14; i++) {
          const el = trailElemsRef.current[i]
          if (el) el.style.display = 'none'
        }
      }

      animId = requestAnimationFrame(updatePhysics)
    }

    animId = requestAnimationFrame(updatePhysics)
    return () => cancelAnimationFrame(animId)
  }, [pattern])

  const PATTERN_LABELS: { id: DotMovementPattern; label: string }[] = [
    { id: 'orbit', label: 'Orbit' },
    { id: 'bilateral', label: 'Bilateral' },
    { id: 'pendulum', label: 'Pendulum' },
  ]

  return (
    <div className="w-full h-full flex flex-col flex-1 min-h-0 bg-[#0A0A0B] animate-fade-in select-none">
      {/* Fixed Header Area */}
      <div className="flex flex-col items-center text-center px-6 pt-4 pb-2 select-none pointer-events-none shrink-0">
        <h1 className="font-serif text-xl sm:text-2xl text-[#E5E5E7] tracking-tight">
          {pattern === 'bloom' ? 'Bloom' : 'Dynamic Flow'}
        </h1>
        <p className="text-xs sm:text-sm text-[#71717A] tracking-wider mt-1">fluid touch & soft gaze</p>
        <p className="font-serif text-sm sm:text-base text-[#A1A1AA] italic font-normal tracking-wide leading-relaxed mt-3 max-w-xs">
          {pattern === 'bloom'
            ? 'A quiet visual anchor. Soften your focus and let your peripheral gaze widen.'
            : 'Smooth organic drift. Touch and hold to softly guide the light.'}
        </p>
      </div>

      {/* Interactive Touch Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex-1 w-full relative touch-none overflow-hidden flex items-center justify-center"
      >
        {/* Motion Mode Ripples */}
        {pattern !== 'bloom' && ripples.map(r => (
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

        {/* Bloom Mode Water-Ripple Touch Effect */}
        {pattern === 'bloom' && bloomRipples.map(r => {
          const ringElapsed = Math.max(0, now - (r.createdAt + r.delayMs))
          if (now < r.createdAt + r.delayMs) return null
          if (ringElapsed >= 3000) return null

          const progress = Math.min(1, ringElapsed / 3000)
          const eased = 1 - Math.pow(1 - progress, 3)
          const radius = eased * 180

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

        {/* Orbit faint planetary track */}
        {pattern === 'orbit' && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <ellipse
              ref={orbitEllipseRef}
              fill="none"
              stroke="rgba(229, 229, 231, 0.08)"
              strokeWidth="1"
            />
          </svg>
        )}

        {/* Fading ghost wake circles */}
        {(pattern === 'bilateral' || pattern === 'pendulum') && (
          Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              ref={el => {
                trailElemsRef.current[i] = el
              }}
              className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full bg-[#E5E5E7]"
              style={{ display: 'none' }}
            />
          ))
        )}

        {/* Solid Flat Circle */}
        {pattern !== 'bloom' && (
          <div
            ref={dotElemRef}
            className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{
              transform: 'translate3d(50vw, 42vh, 0)',
            }}
          >
            <div className="w-[18px] h-[18px] rounded-full bg-[#E5E5E7]" />
          </div>
        )}

        {/* Bottom Controls Dock */}
        {pattern !== 'bloom' && (
          <BottomControlsDock>
            <SegmentedPillGroup
              options={PATTERN_LABELS}
              value={pattern}
              onChange={handleSelectPattern}
            />
          </BottomControlsDock>
        )}
      </div>
    </div>
  )
}