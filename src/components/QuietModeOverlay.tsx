import { useState, useEffect, useRef, useCallback } from 'react'
import { useAudio } from '../context/AudioContext'
import HeaderAudioShortcut from './HeaderAudioShortcut'

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

export default function QuietModeOverlay({ isOpen, onClose }: QuietModeOverlayProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [textVisible, setTextVisible] = useState(true)

  const { isAudioPlaying, volume, toggleAudio, setVolume, activeTrack, allPresets } = useAudio()
  const originalVolumeRef = useRef<number>(volume)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const ripplesRef = useRef<Ripple[]>([])
  const textTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize Particles
  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    const count = 16 // 12-16 soft dust motes

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.8, // 0.8px to 2.4px
        vx: (Math.random() - 0.5) * 0.2, // slow drift
        vy: -(Math.random() * 0.25 + 0.08), // gentle upward float
        alpha: Math.random() * 0.12 + 0.04,
        baseAlpha: Math.random() * 0.14 + 0.06,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.02 + 0.01,
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

      // ── 1. Draw & Update Drifting Particles ──
      const particles = particlesRef.current
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.phase += p.phaseSpeed

        // Soft breathing shimmer for each mote
        p.alpha = p.baseAlpha + Math.sin(p.phase) * (p.baseAlpha * 0.45)

        // Screen wrap
        if (p.y < -10) p.y = height + 10
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(229, 224, 216, ${Math.max(0, p.alpha)})`
        ctx.fill()
      }

      // ── 2. Draw & Update Fluid Ripples ──
      const ripples = ripplesRef.current
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]
        r.radius += 2.2
        r.alpha -= 0.007

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1)
          continue
        }

        // Primary outer expanding fluid ring
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
        ctx.lineWidth = 1.2
        ctx.strokeStyle = `rgba(201, 185, 154, ${r.alpha * 0.7})`
        ctx.stroke()

        // Inner secondary soft echo ring
        if (r.radius > 20) {
          ctx.beginPath()
          ctx.arc(r.x, r.y, r.radius * 0.65, 0, Math.PI * 2)
          ctx.lineWidth = 0.8
          ctx.strokeStyle = `rgba(229, 224, 216, ${r.alpha * 0.35})`
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

  // Lifecycle & Audio Volume Whisper Ramp
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      setTextVisible(true)
      originalVolumeRef.current = volume

      // Soft volume dip to whisper level when entering quiet stillness
      if (isAudioPlaying) {
        const whisperVolume = Math.min(volume * 0.65, 0.22)
        setVolume(whisperVolume)
      }

      const frame = requestAnimationFrame(() => {
        setVisible(true)
      })

      // Fade out micro-copy after 4 seconds for pure stillness
      textTimerRef.current = setTimeout(() => {
        setTextVisible(false)
      }, 4000)

      return () => {
        cancelAnimationFrame(frame)
        if (textTimerRef.current) clearTimeout(textTimerRef.current)
      }
    } else {
      setVisible(false)
      // Restore volume
      setVolume(originalVolumeRef.current)

      const timer = setTimeout(() => {
        setMounted(false)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Spawn fluid ripple on touch/pointer down
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ripplesRef.current.push({
      x,
      y,
      radius: 6,
      maxRadius: 190,
      alpha: 0.4,
    })
  }

  function handleOverlayClick() {
    onClose()
  }

  if (!mounted) return null

  const currentTrackLabel = allPresets.find(p => p.id === activeTrack)?.subtitle || 'Quiet Calm'

  return (
    <div
      id="quiet-mode-overlay"
      onClick={handleOverlayClick}
      onPointerDown={handlePointerDown}
      aria-label="Tap anywhere to exit quiet space"
      className={`
        fixed inset-0 z-50
        bg-[#09090C]
        cursor-pointer select-none
        transition-opacity duration-700 ease-out
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* ── Fullscreen Canvas for Dust Motes & Fluid Ripples ── */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      />

      {/* ── Dead-Centered 8-Second Slow-Breathing Orb ────────── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        {/* Soft expanding atmospheric outer halo */}
        <div
          className="absolute w-80 h-80 rounded-full bg-[#C9B99A]/4 blur-3xl animate-breathe-8s"
        />

        {/* Outer 8s breathing ring (scale 0.98 to 1.04) */}
        <div
          className="
            w-52 h-52 sm:w-56 sm:h-56 rounded-full
            border border-[#C9B99A]/15
            flex items-center justify-center
            animate-breathe-8s transition-transform
          "
        >
          {/* Secondary concentric subtle halo */}
          <div className="w-36 h-36 rounded-full border border-[#C9B99A]/20 flex items-center justify-center">
            {/* Inner core breathing light */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#181614] via-[#101010] to-[#080808] border border-[#C9B99A]/30 shadow-2xl flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#C9B99A]/70 blur-[1px] animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Centered Mobile UI Layer (max-w-md constraint) ──── */}
      <div className="relative z-10 max-w-md mx-auto h-full flex flex-col justify-between p-6 pointer-events-auto">
        {/* Top Header Row */}
        <header className="w-full flex items-center justify-between shrink-0 pt-4">
          <div className="flex items-center gap-2">
            <span className="font-sans text-[0.55rem] tracking-[0.2em] uppercase text-[#52525B] opacity-70">
              Quiet Space
            </span>
            {isAudioPlaying && (
              <span className="flex items-center gap-1 font-sans text-[0.52rem] tracking-wider text-[#C9B99A]/60">
                · {currentTrackLabel}
              </span>
            )}
          </div>

          {/* Audio controls group */}
          <div
            className="flex items-center gap-1.5"
            onClick={e => e.stopPropagation()}
          >
            {/* Discrete Play/Mute Ambient Toggle */}
            <button
              id="quiet-mode-audio-toggle"
              onClick={toggleAudio}
              title={isAudioPlaying ? 'Mute ambient whisper' : 'Play ambient whisper'}
              className="
                px-2.5 py-1 rounded-full border border-[#22222C] bg-[#121218]/60
                font-sans text-[0.55rem] tracking-[0.14em] uppercase text-[#71717A]
                hover:text-[#E5E0D8] hover:border-[#33333E] transition-all focus:outline-none
                flex items-center gap-1.5
              "
            >
              {isAudioPlaying ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9B99A] animate-pulse" />
                  <span>Ambient Whisper</span>
                </>
              ) : (
                <>
                  <span className="text-[0.65rem] leading-none">▶</span>
                  <span>Play Ambient</span>
                </>
              )}
            </button>

            {/* Universal Header Audio Shortcut */}
            <HeaderAudioShortcut />
          </div>
        </header>

        {/* Center Spacer */}
        <div className="flex-1 pointer-events-none" />

        {/* Bottom Whisper & Return Prompt */}
        <footer className="flex flex-col items-center gap-3 text-center shrink-0 pb-2">
          {/* Fading Whisper Text */}
          <p
            className={`
              font-serif-nook text-[#71717A] text-[1.1rem] font-light italic tracking-wide
              transition-opacity duration-1000 ease-in-out
              ${textVisible ? 'opacity-85' : 'opacity-0 pointer-events-none'}
            `}
          >
            A quiet space. Nothing is required of you.
          </p>

          {/* Minimal return guide with soft hover */}
          <span className="font-sans text-[0.58rem] tracking-[0.2em] uppercase text-[#52525B] hover:text-[#A1A1AA] transition-colors">
            tap anywhere to return
          </span>
        </footer>
      </div>
    </div>
  )
}
