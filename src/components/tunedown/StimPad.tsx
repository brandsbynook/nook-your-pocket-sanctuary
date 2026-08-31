import { useRef, useEffect, useLayoutEffect, useCallback, useState } from 'react'
import { triggerHaptic } from '../../utils/haptics'

export type StimMode = 'ripples' | 'charcoal' | 'sands'

interface SandGrain {
  homeX: number
  homeY: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
}

interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
  color: string
}

interface CharcoalPoint {
  x: number
  y: number
  lastX: number
  lastY: number
  width: number
  alpha: number
}

const RIPPLE_PALETTE = [
  'rgba(201, 185, 154, ', // warm amber
  'rgba(229, 224, 216, ', // off-white
  'rgba(142, 136, 128, ', // muted stone
]

const EARTHEN_DUNE_PALETTE = [
  '#4A4237',
  '#3E372E',
  '#38322A',
  '#302B24',
  '#2B2620',
  '#231F1A',
  '#1E1B18',
  '#171513',
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

export default function StimPad() {
  const [stimMode, setStimMode] = useState<StimMode>('ripples')
  const [isSettled, setIsSettled] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isInteractingRef = useRef<boolean>(false)
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null)
  const travelAccumulatorRef = useRef<number>(0)
  const reqRef = useRef<number | null>(null)

  // Simulation data
  const grainsRef = useRef<SandGrain[]>([])
  const ripplesRef = useRef<Ripple[]>([])
  const charcoalStrokesRef = useRef<CharcoalPoint[]>([])

  // Web Audio Synthesizer Nodes
  const isAudioReadyRef = useRef<boolean>(false)

  // 1. Ripple Synth
  const rippleOscRef = useRef<OscillatorNode | null>(null)
  const rippleGainRef = useRef<GainNode | null>(null)

  // 2. Charcoal Noise Synth
  const charcoalNoiseNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const charcoalFilterRef = useRef<BiquadFilterNode | null>(null)
  const charcoalGainRef = useRef<GainNode | null>(null)

  // 3. Sands Granular Synth
  const sandsNoiseNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const sandsFilterRef = useRef<BiquadFilterNode | null>(null)
  const sandsGainRef = useRef<GainNode | null>(null)

  // Generate Paul Kellet Pink / Brown Noise Buffer
  const createNoiseBuffer = (ctx: AudioContext, seconds = 2): AudioBuffer => {
    const bufferSize = ctx.sampleRate * seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12
      b6 = white * 0.115926
    }
    return buffer
  }

  // Initialize Audio Synthesizer Graph
  const initAudio = useCallback(() => {
    const ctx = getAudioContext()
    if (!ctx) return

    if (!isAudioReadyRef.current) {
      try {
        // ── 1. RIPPLE SYNTH (Sine Singing Bowl Resonance) ──
        const rOsc = ctx.createOscillator()
        const rGain = ctx.createGain()
        rOsc.type = 'sine'
        rOsc.frequency.setValueAtTime(216, ctx.currentTime)
        rGain.gain.setValueAtTime(0, ctx.currentTime)
        rOsc.connect(rGain)
        rGain.connect(ctx.destination)
        rOsc.start()
        rippleOscRef.current = rOsc
        rippleGainRef.current = rGain

        // ── 2. CHARCOAL SYNTH (Noise -> Bandpass ~800Hz Q:1.2) ──
        const noiseBuffer = createNoiseBuffer(ctx, 2.5)
        const cNoise = ctx.createBufferSource()
        cNoise.buffer = noiseBuffer
        cNoise.loop = true

        const cFilter = ctx.createBiquadFilter()
        cFilter.type = 'bandpass'
        cFilter.frequency.setValueAtTime(800, ctx.currentTime)
        cFilter.Q.setValueAtTime(1.2, ctx.currentTime)

        const cGain = ctx.createGain()
        cGain.gain.setValueAtTime(0, ctx.currentTime)

        cNoise.connect(cFilter)
        cFilter.connect(cGain)
        cGain.connect(ctx.destination)
        cNoise.start()
        charcoalNoiseNodeRef.current = cNoise
        charcoalFilterRef.current = cFilter
        charcoalGainRef.current = cGain

        // ── 3. SANDS SYNTH (Noise -> Lowpass ~450Hz Q:1.0) ──
        const sNoise = ctx.createBufferSource()
        sNoise.buffer = noiseBuffer
        sNoise.loop = true

        const sFilter = ctx.createBiquadFilter()
        sFilter.type = 'lowpass'
        sFilter.frequency.setValueAtTime(450, ctx.currentTime)
        sFilter.Q.setValueAtTime(1.0, ctx.currentTime)

        const sGain = ctx.createGain()
        sGain.gain.setValueAtTime(0, ctx.currentTime)

        sNoise.connect(sFilter)
        sFilter.connect(sGain)
        sGain.connect(ctx.destination)
        sNoise.start()
        sandsNoiseNodeRef.current = sNoise
        sandsFilterRef.current = sFilter
        sandsGainRef.current = sGain

        isAudioReadyRef.current = true
      } catch {
        // Ignore audio init restrictions
      }
    }
  }, [])

  // Modulate Audio dynamically based on speed & displaced grains
  const playModeAudio = useCallback((velocity: number, grainDisplacementFactor = 0) => {
    const ctx = getAudioContext()
    if (!ctx) return
    const t = ctx.currentTime

    if (stimMode === 'ripples') {
      if (rippleGainRef.current && rippleOscRef.current) {
        const targetFreq = 216 + Math.min(144, velocity * 7)
        rippleOscRef.current.frequency.setTargetAtTime(targetFreq, t, 0.04)
        const targetVol = Math.min(0.065, Math.max(0.015, velocity * 0.005))
        rippleGainRef.current.gain.setTargetAtTime(targetVol, t, 0.03)
      }
    } else if (stimMode === 'charcoal') {
      if (charcoalGainRef.current) {
        // Continuous bandpass noise ramping to ~0.12 during pointermove
        const targetGain = Math.min(0.12, Math.max(0.02, velocity * 0.008))
        charcoalGainRef.current.gain.setTargetAtTime(targetGain, t, 0.02)
      }
    } else if (stimMode === 'sands') {
      if (sandsGainRef.current) {
        // Lowpass 450Hz noise scaling smoothly with pointer velocity & grains
        const targetGain = Math.min(0.12, grainDisplacementFactor * 0.07 + velocity * 0.006)
        sandsGainRef.current.gain.setTargetAtTime(targetGain, t, 0.03)
      }
    }
  }, [stimMode])

  const stopModeAudio = useCallback(() => {
    const ctx = getAudioContext()
    if (!ctx) return
    const t = ctx.currentTime

    if (rippleGainRef.current) {
      rippleGainRef.current.gain.setTargetAtTime(0, t, 0.08)
    }
    if (charcoalGainRef.current) {
      // Drops to 0 in 30ms on release
      charcoalGainRef.current.gain.setTargetAtTime(0, t, 0.03)
    }
    if (sandsGainRef.current) {
      // Drops to 0 smoothly on release
      sandsGainRef.current.gain.setTargetAtTime(0, t, 0.03)
    }
  }, [])

  // Initialize Dense Matte Earthen Dune Bed (~3,400 micro-grains)
  const initSandBed = useCallback((width: number, height: number) => {
    const totalGrains = 3400
    const grains: SandGrain[] = []

    for (let i = 0; i < totalGrains; i++) {
      const rx = Math.random() * width
      const ry = Math.random() * height
      const col = EARTHEN_DUNE_PALETTE[Math.floor(Math.random() * EARTHEN_DUNE_PALETTE.length)]

      grains.push({
        homeX: rx,
        homeY: ry,
        x: rx,
        y: ry,
        vx: 0,
        vy: 0,
        size: 0.85 + Math.random() * 1.35,
        color: col,
        alpha: 0.65 + Math.random() * 0.35,
      })
    }
    grainsRef.current = grains
  }, [])

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

    initSandBed(rect.width, rect.height)
  }, [initSandBed])

  useLayoutEffect(() => {
    resizeCanvas()
  }, [resizeCanvas])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    // Continuous Render Loop
    const render = () => {
      if (!ctx || !canvas) return
      const rect = canvas.getBoundingClientRect()

      ctx.fillStyle = '#0C0C0C'
      ctx.fillRect(0, 0, rect.width, rect.height)

      // ── 1. RIPPLES RENDERING ──
      if (stimMode === 'ripples') {
        const ripples = ripplesRef.current
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i]
          r.radius += 1.4
          r.alpha *= 0.962

          ctx.beginPath()
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
          ctx.strokeStyle = `${r.color}${r.alpha})`
          ctx.lineWidth = 1.6
          ctx.stroke()

          if (r.radius > 10) {
            ctx.beginPath()
            ctx.arc(r.x, r.y, r.radius * 0.58, 0, Math.PI * 2)
            ctx.strokeStyle = `${r.color}${r.alpha * 0.45})`
            ctx.lineWidth = 0.9
            ctx.stroke()
          }

          if (r.alpha < 0.01 || r.radius > r.maxRadius) {
            ripples.splice(i, 1)
          }
        }
      }

      // ── 2. CHARCOAL RENDERING ──
      else if (stimMode === 'charcoal') {
        const strokes = charcoalStrokesRef.current
        for (let i = 0; i < strokes.length; i++) {
          const s = strokes[i]
          ctx.beginPath()
          ctx.moveTo(s.lastX, s.lastY)
          ctx.lineTo(s.x, s.y)
          ctx.strokeStyle = `rgba(229, 224, 216, ${s.alpha})`
          ctx.lineWidth = s.width
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.stroke()
        }
      }

      // ── 3. SANDS RENDERING (2,800 Grains with Viscous Furrowing) ──
      else if (stimMode === 'sands') {
        const grains = grainsRef.current
        const len = grains.length

        for (let i = 0; i < len; i++) {
          const g = grains[i]

          // High viscosity settling + gentle memory relaxation
          const dx = g.homeX - g.x
          const dy = g.homeY - g.y
          g.vx += dx * 0.003
          g.vy += dy * 0.003
          g.vx *= 0.90 // high friction kinetic sand damping
          g.vy *= 0.90
          g.x += g.vx
          g.y += g.vy

          ctx.fillStyle = g.color
          ctx.globalAlpha = g.alpha
          ctx.fillRect(g.x, g.y, g.size, g.size)
        }
        ctx.globalAlpha = 1.0
      }

      reqRef.current = requestAnimationFrame(render)
    }

    reqRef.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (reqRef.current) cancelAnimationFrame(reqRef.current)
      stopModeAudio()
    }
  }, [resizeCanvas, stimMode, stopModeAudio])

  // Handle Touch Actions based on active mode
  function handlePointerAction(clientX: number, clientY: number, isInitial = false) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = clientX - rect.left
    const py = clientY - rect.top

    let velocity = 8
    let pointerVx = 0
    let pointerVy = 0

    if (lastPointerPosRef.current) {
      pointerVx = px - lastPointerPosRef.current.x
      pointerVy = py - lastPointerPosRef.current.y
      velocity = Math.hypot(pointerVx, pointerVy)
      travelAccumulatorRef.current += velocity

      // Mode-specific tactile haptic triggers
      if (stimMode === 'charcoal' || stimMode === 'sands') {
        if (travelAccumulatorRef.current >= 14) {
          triggerHaptic(4)
          travelAccumulatorRef.current %= 14
        }
      }
    }

    // ── Mode: Ripples ──
    if (stimMode === 'ripples') {
      if (isInitial || velocity > 7) {
        const randColor = RIPPLE_PALETTE[Math.floor(Math.random() * RIPPLE_PALETTE.length)]
        ripplesRef.current.push({
          x: px,
          y: py,
          radius: 3,
          maxRadius: 65 + Math.random() * 40,
          alpha: 0.82,
          color: randColor,
        })
        if (isInitial) triggerHaptic(10)
      }
      playModeAudio(velocity)
    }

    // ── Mode: Charcoal ──
    else if (stimMode === 'charcoal') {
      if (lastPointerPosRef.current) {
        const grainCount = 4
        for (let g = 0; g < grainCount; g++) {
          const jitterX = (Math.random() - 0.5) * 2.8
          const jitterY = (Math.random() - 0.5) * 2.8
          charcoalStrokesRef.current.push({
            x: px + jitterX,
            y: py + jitterY,
            lastX: lastPointerPosRef.current.x + jitterX,
            lastY: lastPointerPosRef.current.y + jitterY,
            width: 1.0 + Math.random() * 2.4,
            alpha: 0.22 + Math.random() * 0.48,
          })
        }
      }
      playModeAudio(velocity)
    }

    // ── Mode: Sands (True Furrow Displacement) ──
    else if (stimMode === 'sands') {
      const touchRadius = 36
      const radiusSq = touchRadius * touchRadius
      const grains = grainsRef.current
      let displacedCount = 0

      for (let i = 0; i < grains.length; i++) {
        const g = grains[i]
        const dx = g.x - px
        const dy = g.y - py
        const distSq = dx * dx + dy * dy

        if (distSq < radiusSq && distSq > 0) {
          displacedCount++
          const dist = Math.sqrt(distSq)
          const pushForce = (1 - dist / touchRadius) * 4.2
          const nx = dx / dist
          const ny = dy / dist

          // Push away radially + directional furrow banking along stroke normal
          g.vx += nx * pushForce + pointerVx * 0.28
          g.vy += ny * pushForce + pointerVy * 0.28
        }
      }

      const displacementFactor = Math.min(1, displacedCount / 120)
      playModeAudio(velocity, displacementFactor)
    }

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
    stopModeAudio()
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

    // Clear ripples
    ripplesRef.current = []

    // Clear charcoal strokes
    charcoalStrokesRef.current = []

    // Settle sand bed back into uniform organic calm
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      initSandBed(rect.width, rect.height)
    }
  }

  return (
    <div className="flex flex-col items-center justify-between flex-1 py-2 animate-fade-in min-h-0 w-full select-none">
      {/* ── Top Header Controls & Mode Switcher ── */}
      <div className="flex items-center justify-between w-full mb-3 shrink-0 px-1">
        {/* Mode Selector Pill */}
        <div className="flex items-center gap-1 border border-[#222] p-0.5 rounded-lg bg-[#101014]">
          {(['ripples', 'charcoal', 'sands'] as StimMode[]).map(m => (
            <button
              key={m}
              onClick={() => {
                triggerHaptic(10)
                setStimMode(m)
                stopModeAudio()
              }}
              className={`
                px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider rounded-md transition-all cursor-pointer focus:outline-none
                ${stimMode === m
                  ? 'bg-[#C9B99A]/20 text-[#C9B99A]'
                  : 'text-[#71717A] hover:text-[#E5E0D8]'
                }
              `}
            >
              {m === 'ripples' ? 'Ripples' : m === 'charcoal' ? 'Charcoal' : 'Sands'}
            </button>
          ))}
        </div>

        {/* Clear / Settle Button */}
        <button
          onClick={handleClearSettle}
          className="
            px-2.5 py-1 border border-[#222] rounded-md
            font-sans text-[0.62rem] tracking-[0.12em] uppercase
            text-[#71717A] hover:text-[#C9B99A] hover:border-[#C9B99A]/40
            transition-colors cursor-pointer focus:outline-none
          "
        >
          {isSettled ? 'Settled' : 'Clear / Settle'}
        </button>
      </div>

      {/* ── 1:1 Aspect Ratio Canvas ── */}
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
          {stimMode === 'ripples'
            ? 'Resonant concentric waves swelling with touch.'
            : stimMode === 'charcoal'
            ? 'Organic charcoal tooth friction across the dark.'
            : 'Viscous kinetic sand furrowing under your touch.'}
        </span>
      </div>
    </div>
  )
}
