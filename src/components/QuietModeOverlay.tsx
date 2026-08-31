import { useState, useEffect, useRef, useCallback } from 'react'
import { proceduralAudio } from '../utils/proceduralAudio'
import { triggerHaptic } from '../utils/haptics'

interface QuietModeOverlayProps {
  isOpen: boolean
  onClose: () => void
}

interface Particle {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  alpha: number
  baseAlpha: number
  phase: number
  phaseSpeed: number
}

interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
}

const QUIET_MODE_VOLUME = 0.48

export default function QuietModeOverlay({ isOpen, onClose }: QuietModeOverlayProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const ripplesRef = useRef<Ripple[]>([])
  const previousVolumeRef = useRef<number>(0.5)
  const previousPlayingRef = useRef<boolean>(false)

  // Initialize Particles (clearly visible, warm amber-tinted floating motes 2px - 4px)
  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    const count = 28 // Organic cluster of visible motes

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 1.2, // 1.2px to 2.7px radius = 2.4px to 5.4px diameter
        vx: (Math.random() - 0.5) * 0.22,
        vy: -(Math.random() * 0.35 + 0.1), // slow upward organic drift
        alpha: Math.random() * 0.2 + 0.3, // clearly visible 0.30 - 0.50 opacity
        baseAlpha: Math.random() * 0.15 + 0.32,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.02 + 0.008,
      })
    }
    particlesRef.current = particles
  }, [])

  // Canvas render & animation loop
  useEffect(() => {
    if (!mounted) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    initParticles(width, height)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // ── 1. Draw & Update Drifting Amber Dust Motes ──
      const particles = particlesRef.current
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.phase += p.phaseSpeed

        // Soft breathing shimmer for each particle
        p.alpha = p.baseAlpha + Math.sin(p.phase) * (p.baseAlpha * 0.35)

        // Screen wrap
        if (p.y < -15) p.y = height + 15
        if (p.x < -15) p.x = width + 15
        if (p.x > width + 15) p.x = -15

        ctx.save()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)

        // Soft warm amber particle glow
        ctx.shadowBlur = 4
        ctx.shadowColor = `rgba(245, 215, 170, ${Math.max(0, p.alpha * 0.7)})`
        ctx.fillStyle = `rgba(245, 220, 185, ${Math.max(0, Math.min(1, p.alpha))})`
        ctx.fill()
        ctx.restore()
      }

      // ── 2. Draw & Update Expanding Low-Contrast Fluid Ripples ──
      const ripples = ripplesRef.current
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]
        r.radius += 1.8
        r.alpha -= 0.008

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1)
          continue
        }

        // Ultra-subtle, low-contrast expanding fluid ring (border: rgba(229, 224, 216, 0.08))
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
        ctx.lineWidth = 1.0
        ctx.strokeStyle = `rgba(229, 224, 216, ${r.alpha * 0.18})`
        ctx.stroke()

        // Inner secondary soft echo ring
        if (r.radius > 20) {
          ctx.beginPath()
          ctx.arc(r.x, r.y, r.radius * 0.6, 0, Math.PI * 2)
          ctx.lineWidth = 0.6
          ctx.strokeStyle = `rgba(201, 185, 154, ${r.alpha * 0.10})`
          ctx.stroke()
        }
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [mounted, initParticles])

  // Lifecycle & Audio Handling (Volume 0.48, 800ms fade-in / 500ms fade-out)
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      previousVolumeRef.current = proceduralAudio.getVolume()
      previousPlayingRef.current = proceduralAudio.getIsPlaying()

      // Start warm ambient drone at calibrated audible volume ~0.48
      proceduralAudio.setVolume(QUIET_MODE_VOLUME)
      proceduralAudio.play('brown-noise', 0.8)
      setIsPlayingAudio(true)

      const frame = requestAnimationFrame(() => {
        setVisible(true)
      })

      return () => {
        cancelAnimationFrame(frame)
      }
    } else {
      setVisible(false)

      // Fade out audio over 500ms
      proceduralAudio.stop(0.5)
      setIsPlayingAudio(false)
      const timer = setTimeout(() => {
        proceduralAudio.setVolume(previousVolumeRef.current)
        if (previousPlayingRef.current) {
          proceduralAudio.play('brown-noise', 0.8)
        }
        setMounted(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Toggle ambient audio on demand
  const handleToggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPlayingAudio) {
      proceduralAudio.stop(0.5)
      setIsPlayingAudio(false)
    } else {
      proceduralAudio.setVolume(QUIET_MODE_VOLUME)
      proceduralAudio.play('brown-noise', 0.8)
      setIsPlayingAudio(true)
    }
  }

  // Spawn fluid ripple and micro-haptic on touch/pointer down anywhere on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    triggerHaptic(12)

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ripplesRef.current.push({
      x,
      y,
      radius: 6,
      maxRadius: 180,
      alpha: 0.45,
    })
  }

  if (!mounted) return null

  return (
    <div
      id="quiet-mode-overlay"
      onPointerDown={handlePointerDown}
      className={`
        fixed inset-0 z-50
        bg-[var(--bg-primary,#141210)]
        select-none touch-none
        transition-opacity duration-500 ease-out
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* ── 1. Fullscreen Canvas for Floating Dust Particles & Fluid Ripples ── */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      />

      {/* ── 2. Centered Frame Layer ── */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="w-full max-w-[420px] h-[100dvh] mx-auto flex flex-col justify-between py-12 px-6 relative">
          {/* Top Bar: Left "← RETURN" Button · Right "PLAY AMBIENT" */}
          <div className="flex items-center justify-between w-full pointer-events-auto shrink-0">
            <button
              id="quiet-mode-return-btn"
              onClick={onClose}
              className="text-xs uppercase tracking-widest text-[#9E988F] hover:text-[#E5E0D8] transition-colors cursor-pointer focus:outline-none flex items-center gap-1.5 py-1"
            >
              ← RETURN
            </button>

            {/* Top Right Ambient Audio Toggle Pill */}
            <button
              id="quiet-mode-audio-pill"
              onClick={handleToggleAudio}
              title={isPlayingAudio ? 'Pause ambient drone' : 'Play ambient drone'}
              className="
                px-3 py-1.5 rounded-full
                border border-neutral-800/80 bg-neutral-900/60 hover:bg-neutral-800/80 hover:border-neutral-700
                font-sans text-[10px] tracking-[0.14em] uppercase text-neutral-400 hover:text-neutral-200
                transition-all duration-300 focus:outline-none cursor-pointer flex items-center gap-1.5 shadow-sm
              "
            >
              {isPlayingAudio ? (
                <>
                  <span className="text-[0.65rem] text-[#C9B99A] leading-none">◼</span>
                  <span>Pause Ambient</span>
                  <span className="text-[0.7rem] leading-none ml-0.5">🎧</span>
                </>
              ) : (
                <>
                  <span className="text-[0.65rem] text-[#C9B99A] leading-none">▶</span>
                  <span>Play Ambient</span>
                  <span className="text-[0.7rem] leading-none ml-0.5">🎧</span>
                </>
              )}
            </button>
          </div>

          {/* Central Orbital Star Anchor (Centered in Mobile Frame w-64 h-64) */}
          <div className="w-64 h-64 mx-auto my-auto relative flex items-center justify-center pointer-events-none">
            {/* Outermost ring (w-64 / 256px) */}
            <div className="w-64 h-64 rounded-full border border-white/[0.04] flex items-center justify-center">
              {/* Third concentric ring (~192px) */}
              <div className="w-48 h-48 rounded-full border border-white/[0.06] flex items-center justify-center">
                {/* Second concentric ring (~128px) */}
                <div className="w-32 h-32 rounded-full border border-[#C9B99A]/15 flex items-center justify-center">
                  {/* Inner core circle (~70px) */}
                  <div className="w-[70px] h-[70px] rounded-full border border-[#C9B99A]/25 bg-[#121216]/50 flex items-center justify-center shadow-2xl">
                    {/* Soft breathing warm amber glowing center dot */}
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E5D7BE] shadow-[0_0_14px_rgba(229,215,190,0.85)] animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Center: Faint "TAP ANYWHERE" cue */}
          <div className="w-full flex justify-center text-center shrink-0">
            <p className="text-[11px] tracking-widest text-[#5A5650] uppercase select-none">
              TAP ANYWHERE
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
