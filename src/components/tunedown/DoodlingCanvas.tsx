import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { triggerHaptic } from '../../utils/haptics'

export type DoodleMode = 'open' | 'symmetry'
export type StrokeWeight = 'fine' | 'medium' | 'broad'

interface DoodlingCanvasProps {
  initialMode?: DoodleMode
}

const WEIGHT_PRESETS: { id: StrokeWeight; label: string; width: number }[] = [
  { id: 'fine',   label: 'FINE',   width: 2.0 },
  { id: 'medium', label: 'MEDIUM', width: 4.5 },
  { id: 'broad',  label: 'BROAD',  width: 8.0 },
]

// Singleton lazy AudioContext helper
let doodleAudioCtx: AudioContext | null = null
function getDoodleAudioContext(): AudioContext | null {
  if (!doodleAudioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioCtx) {
      doodleAudioCtx = new AudioCtx()
    }
  }
  if (doodleAudioCtx && doodleAudioCtx.state === 'suspended') {
    doodleAudioCtx.resume().catch(() => {})
  }
  return doodleAudioCtx
}

export default function DoodlingCanvas({ initialMode = 'open' }: DoodlingCanvasProps) {
  const [strokeWeight, setStrokeWeight] = useState<StrokeWeight>('medium')
  const [isMuted, setIsMuted] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef<boolean>(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)

  // Web Audio Nodes for Charcoal Friction
  const isAudioReadyRef = useRef<boolean>(false)
  const filterRef = useRef<BiquadFilterNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  // Generate Paul Kellet Filtered Noise Buffer
  const createNoiseBuffer = (ctx: AudioContext, seconds = 2.5): AudioBuffer => {
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

  // Initialize Charcoal Audio Graph
  const initAudio = useCallback(() => {
    if (isMuted) return
    const ctx = getDoodleAudioContext()
    if (!ctx) return

    if (!isAudioReadyRef.current) {
      try {
        const noiseBuffer = createNoiseBuffer(ctx, 2.5)
        const noiseSource = ctx.createBufferSource()
        noiseSource.buffer = noiseBuffer
        noiseSource.loop = true

        // Bandpass filter (~820Hz, gentle Q: 1.3)
        const bFilter = ctx.createBiquadFilter()
        bFilter.type = 'bandpass'
        bFilter.frequency.setValueAtTime(820, ctx.currentTime)
        bFilter.Q.setValueAtTime(1.3, ctx.currentTime)

        const gainNode = ctx.createGain()
        gainNode.gain.setValueAtTime(0, ctx.currentTime)

        noiseSource.connect(bFilter)
        bFilter.connect(gainNode)
        gainNode.connect(ctx.destination)
        noiseSource.start()

        filterRef.current = bFilter
        gainRef.current = gainNode
        isAudioReadyRef.current = true
      } catch {
        // Ignore audio restrictions
      }
    }
  }, [isMuted])

  // Modulate Charcoal Friction Audio with Pointer Velocity
  const playFrictionAudio = useCallback((velocity: number) => {
    if (isMuted) return
    const ctx = getDoodleAudioContext()
    if (!ctx || !filterRef.current || !gainRef.current) return
    const t = ctx.currentTime

    // Dynamic frequency modulation within 720Hz–1080Hz band
    const targetFreq = 760 + Math.min(300, velocity * 12)
    filterRef.current.frequency.setTargetAtTime(targetFreq, t, 0.02)

    // Soft master gain scaling up to 0.14
    const targetGain = Math.min(0.14, Math.max(0.02, velocity * 0.009))
    gainRef.current.gain.setTargetAtTime(targetGain, t, 0.02)
  }, [isMuted])

  const stopFrictionAudio = useCallback(() => {
    const ctx = getDoodleAudioContext()
    if (!ctx || !gainRef.current) return
    const t = ctx.currentTime
    // Instant 30ms fade on lift or pause
    gainRef.current.gain.setTargetAtTime(0, t, 0.03)
  }, [])

  // If muted state changes to true while playing, immediately silence
  useEffect(() => {
    if (isMuted) {
      stopFrictionAudio()
    }
  }, [isMuted, stopFrictionAudio])

  // Initialize canvas resolution matching exact 1:1 pixel ratio
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const dpr = window.devicePixelRatio || 1

    // Store previous content before resize
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')
    if (tempCtx && canvas.width > 0 && canvas.height > 0) {
      tempCtx.drawImage(canvas, 0, 0)
    }

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.fillStyle = '#0C0C0C'
      ctx.fillRect(0, 0, rect.width, rect.height)

      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height)
      }
    }
  }, [])

  useLayoutEffect(() => {
    initCanvas()
  }, [initCanvas])

  useEffect(() => {
    initCanvas()
    window.addEventListener('resize', initCanvas)
    return () => {
      window.removeEventListener('resize', initCanvas)
      stopFrictionAudio()
    }
  }, [initCanvas, stopFrictionAudio])

  function getPointerCoords(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    initAudio()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    isDrawingRef.current = true
    const pos = getPointerCoords(e)
    lastPosRef.current = pos
    if (pos) {
      drawSegment(pos, pos, 0)
      playFrictionAudio(6)
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return
    const pos = getPointerCoords(e)
    if (!pos || !lastPosRef.current) return

    const vx = pos.x - lastPosRef.current.x
    const vy = pos.y - lastPosRef.current.y
    const velocity = Math.hypot(vx, vy)

    drawSegment(lastPosRef.current, pos, velocity)
    playFrictionAudio(velocity)
    lastPosRef.current = pos
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    isDrawingRef.current = false
    lastPosRef.current = null
    stopFrictionAudio()
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId)
    } catch {
      // Ignore
    }
  }

  function drawSegment(start: { x: number; y: number }, end: { x: number; y: number }, velocity: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()

    const baseWidth = WEIGHT_PRESETS.find(w => w.id === strokeWeight)?.width || 4.5
    // Subtle dynamic taper based on stroke velocity (entry/exit feathering)
    const taper = Math.max(0.85, Math.min(1.25, 1 + (velocity - 10) * 0.012))
    const strokeWidth = baseWidth * taper

    ctx.strokeStyle = '#E5E0D8'
    ctx.lineWidth = strokeWidth

    // Primary stroke
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()

    // Bilateral Symmetry stroke (Mirrored horizontally across center if symmetry mode)
    if (initialMode === 'symmetry') {
      const centerX = rect.width / 2
      const mirrorStartX = centerX - (start.x - centerX)
      const mirrorEndX = centerX - (end.x - centerX)

      ctx.beginPath()
      ctx.moveTo(mirrorStartX, start.y)
      ctx.lineTo(mirrorEndX, end.y)
      ctx.stroke()
    }
  }

  function handleClear() {
    triggerHaptic(8)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#0C0C0C'
    ctx.fillRect(0, 0, rect.width, rect.height)
  }

  function handleToggleMute() {
    triggerHaptic(8)
    setIsMuted(prev => !prev)
  }

  return (
    <div className="flex flex-col items-center justify-between flex-1 py-2 animate-fade-in min-h-0 w-full select-none">
      {/* ── Top Centered Stroke Switcher ── */}
      <div className="flex items-center justify-center w-full mb-3 shrink-0 px-1">
        <div className="flex items-center gap-1 border border-[#222] p-0.5 rounded-lg bg-[#101014]">
          {WEIGHT_PRESETS.map(w => (
            <button
              key={w.id}
              onClick={() => {
                triggerHaptic(6)
                setStrokeWeight(w.id)
              }}
              className={`
                px-3 py-1 font-mono text-[9px] uppercase tracking-wider rounded-md transition-all cursor-pointer focus:outline-none flex items-center gap-1.5
                ${strokeWeight === w.id
                  ? 'bg-[#C9B99A]/20 text-[#EAE5DC]'
                  : 'text-[#8A847A] hover:text-[#EAE5DC]'
                }
              `}
            >
              <span
                className={`rounded-full ${strokeWeight === w.id ? 'bg-[#EAE5DC]' : 'bg-[#8A847A]'}`}
                style={{ width: w.id === 'fine' ? 3 : w.id === 'medium' ? 5 : 7, height: w.id === 'fine' ? 3 : w.id === 'medium' ? 5 : 7 }}
              />
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 1:1 Aspect Ratio Canvas ── */}
      <div className="relative overflow-hidden aspect-square w-full max-w-[380px] my-auto mx-auto border border-[#1E1E1E] bg-[#0C0C0C] rounded-2xl touch-none flex items-center justify-center shadow-2xl">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full cursor-crosshair block touch-none select-none"
        />
      </div>

      {/* ── Bottom Controls: Balanced Action Row (Local Audio Mute & Clear) ── */}
      <div className="flex items-center justify-between w-full pt-3 px-1 shrink-0">
        {/* Local Audio Mute Toggle */}
        <button
          onClick={handleToggleMute}
          className="
            text-[#8A847A] hover:text-[#EAE5DC] text-xs font-serif tracking-wide
            py-1.5 px-4 border border-[#23201C] rounded-full transition-colors
            cursor-pointer focus:outline-none flex items-center gap-1.5
          "
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isMuted ? 'bg-[#52525B]' : 'bg-[#C9B99A]'}`} />
          {isMuted ? 'Sound Off' : 'Sound On'}
        </button>

        {/* Clear Action */}
        <button
          onClick={handleClear}
          className="
            text-[#8A847A] hover:text-[#EAE5DC] text-xs font-serif tracking-wide
            py-1.5 px-4 border border-[#23201C] rounded-full transition-colors
            cursor-pointer focus:outline-none
          "
        >
          Clear
        </button>
      </div>
    </div>
  )
}
