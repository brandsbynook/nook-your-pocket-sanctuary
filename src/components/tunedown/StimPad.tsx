import { useRef, useEffect, useLayoutEffect, useCallback, useState } from 'react'
import { triggerHaptic } from '../../utils/haptics'

interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
  color: string
}

const RIPPLE_PALETTE = [
  'rgba(201, 185, 154, ', // warm amber
  'rgba(229, 224, 216, ', // warm off-white
  'rgba(168, 162, 153, ', // soft stone
]

// Singleton lazy AudioContext helper
let sharedAudioCtx: AudioContext | null = null
function getAudioContext(): AudioContext | null {
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx()
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {})
  }
  return sharedAudioCtx
}

export default function StimPad({ isMuted = false }: { isMuted?: boolean }) {
  const [isSettled, setIsSettled] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isInteractingRef = useRef<boolean>(false)
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null)
  const travelAccumulatorRef = useRef<number>(0)
  const reqRef = useRef<number | null>(null)

  // Resonant rings simulation data
  const ripplesRef = useRef<Ripple[]>([])

  // Web Audio Synthesizer Nodes (Pure 180Hz–280Hz Sine Resonance)
  const isAudioReadyRef = useRef<boolean>(false)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  // Initialize Sine Wave Audio Graph
  const initAudio = useCallback(() => {
    if (isMuted) return
    const ctx = getAudioContext()
    if (!ctx) return

    if (!isAudioReadyRef.current) {
      try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(180, ctx.currentTime) // 180Hz warm foundation
        gain.gain.setValueAtTime(0, ctx.currentTime)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()

        oscRef.current = osc
        gainRef.current = gain
        isAudioReadyRef.current = true
      } catch {
        // Ignore audio restrictions
      }
    }
  }, [isMuted])

  // Modulate Sine Resonance with Velocity
  const playAudio = useCallback((velocity: number) => {
    if (isMuted) return
    const ctx = getAudioContext()
    if (!ctx || !oscRef.current || !gainRef.current) return
    const t = ctx.currentTime

    // 180Hz to 280Hz frequency sweep
    const targetFreq = 180 + Math.min(100, velocity * 5)
    oscRef.current.frequency.setTargetAtTime(targetFreq, t, 0.03)

    // Soft volume swell
    const targetGain = Math.min(0.08, Math.max(0.02, velocity * 0.006))
    gainRef.current.gain.setTargetAtTime(targetGain, t, 0.03)
  }, [isMuted])

  const stopAudio = useCallback(() => {
    const ctx = getAudioContext()
    if (!ctx || !gainRef.current) return
    const t = ctx.currentTime
    // Clean 40ms exponential decay on release
    gainRef.current.gain.setTargetAtTime(0, t, 0.04)
  }, [])

  useEffect(() => {
    if (isMuted) {
      stopAudio()
    }
  }, [isMuted, stopAudio])

  // Initialize / Resize Canvas Buffer
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }
  }, [])

  useLayoutEffect(() => {
    resizeCanvas()
  }, [resizeCanvas])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    // Continuous Render Loop for Expanding Concentric Resonant Rings
    const render = () => {
      if (!ctx || !canvas) return
      const rect = canvas.getBoundingClientRect()

      ctx.fillStyle = '#0C0C0C'
      ctx.fillRect(0, 0, rect.width, rect.height)

      const ripples = ripplesRef.current
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]
        r.radius += 1.3
        r.alpha *= 0.965

        // Primary outer ring
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `${r.color}${r.alpha})`
        ctx.lineWidth = 1.6
        ctx.stroke()

        // Inner harmonic resonance wave
        if (r.radius > 8) {
          ctx.beginPath()
          ctx.arc(r.x, r.y, r.radius * 0.6, 0, Math.PI * 2)
          ctx.strokeStyle = `${r.color}${r.alpha * 0.45})`
          ctx.lineWidth = 0.9
          ctx.stroke()
        }

        if (r.alpha < 0.01 || r.radius > r.maxRadius) {
          ripples.splice(i, 1)
        }
      }

      reqRef.current = requestAnimationFrame(render)
    }

    reqRef.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (reqRef.current) cancelAnimationFrame(reqRef.current)
      stopAudio()
    }
  }, [resizeCanvas, stopAudio])

  // Handle Pointer / Glide Interaction
  function handlePointerAction(clientX: number, clientY: number, isInitial = false) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = clientX - rect.left
    const py = clientY - rect.top

    let velocity = 8
    if (lastPointerPosRef.current) {
      const vx = px - lastPointerPosRef.current.x
      const vy = py - lastPointerPosRef.current.y
      velocity = Math.hypot(vx, vy)
      travelAccumulatorRef.current += velocity

      // Micro-haptic tick at periodic gliding intervals (every 18px)
      if (travelAccumulatorRef.current >= 18) {
        triggerHaptic(4)
        travelAccumulatorRef.current %= 18
      }
    }

    // Spawn harmonic resonant ring
    if (isInitial || velocity > 6) {
      const randColor = RIPPLE_PALETTE[Math.floor(Math.random() * RIPPLE_PALETTE.length)]
      ripplesRef.current.push({
        x: px,
        y: py,
        radius: 3,
        maxRadius: 75 + Math.random() * 45,
        alpha: 0.82,
        color: randColor,
      })
      if (isInitial) triggerHaptic(10)
    }

    playAudio(velocity)
    lastPointerPosRef.current = { x: px, y: py }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    initAudio()
    isInteractingRef.current = true
    lastPointerPosRef.current = null
    travelAccumulatorRef.current = 0
    e.currentTarget.setPointerCapture?.(e.pointerId)
    handlePointerAction(e.clientX, e.clientY, true)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isInteractingRef.current) return
    handlePointerAction(e.clientX, e.clientY, false)
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    isInteractingRef.current = false
    lastPointerPosRef.current = null
    stopAudio()
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId)
    } catch {
      // Ignore
    }
  }

  function handleClearSettle() {
    triggerHaptic(8)
    setIsSettled(true)
    setTimeout(() => setIsSettled(false), 1000)
    ripplesRef.current = []
  }

  return (
    <div className="flex flex-col items-center justify-between flex-1 py-2 animate-fade-in min-h-0 w-full select-none">
      {/* ── Top Header Bar ── */}
      <div className="flex items-center justify-between w-full mb-3 shrink-0 px-1">
        <span className="font-serif-nook text-xs text-[#8A847A] tracking-wider uppercase">
          Acoustic Resonance
        </span>

        {/* Clear / Settle Action */}
        <button
          onClick={handleClearSettle}
          className="
            px-2.5 py-1 border border-[#222] rounded-md
            font-sans text-[0.62rem] tracking-[0.12em] uppercase
            text-[#71717A] hover:text-[#C9B99A] hover:border-[#C9B99A]/40
            transition-colors cursor-pointer focus:outline-none
          "
        >
          {isSettled ? 'Settled' : 'Clear'}
        </button>
      </div>

      {/* ── 1:1 Aspect Ratio Canvas Surface ── */}
      <div className="relative overflow-hidden aspect-square w-full max-w-[380px] my-auto mx-auto border border-[#1F1F1F] bg-[#0C0C0C] rounded-2xl touch-none flex items-center justify-center shadow-2xl">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full block touch-none select-none cursor-crosshair"
        />
      </div>

      {/* ── Bottom Prompt ── */}
      <div className="w-full pt-3 shrink-0 flex items-center justify-center">
        <span className="font-serif-nook text-[#52525B] text-[0.78rem] italic pointer-events-none select-none">
          Unhurried resonant waves swelling with touch.
        </span>
      </div>
    </div>
  )
}
