import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { triggerHaptic } from '../../utils/haptics'

export type DoodleMode = 'open' | 'symmetry'

interface DoodlingCanvasProps {
  initialMode?: DoodleMode
}

export type ColorId = 'bone' | 'sand' | 'charcoal'

interface ColorSwatch {
  id: ColorId
  label: string
  hex: string
}

const COLOR_SWATCHES: ColorSwatch[] = [
  { id: 'bone',     label: 'Bone',     hex: '#E5E5E7' },
  { id: 'sand',     label: 'Sand',     hex: '#D4C3A3' },
  { id: 'charcoal', label: 'Charcoal', hex: '#3F3F46' },
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
  const [activeColor, setActiveColor] = useState<ColorId>('bone')
  const [isEraser, setIsEraser] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef<boolean>(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)

  // Web Audio Nodes for Charcoal Friction
  const isAudioReadyRef = useRef<boolean>(false)
  const filterRef = useRef<BiquadFilterNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  // Initialize Charcoal Scratch Audio Engine
  const initAudio = useCallback(() => {
    if (isMuted) return
    const ctx = getDoodleAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    if (!isAudioReadyRef.current) {
      try {
        const bufferSize = ctx.sampleRate * 2
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const output = noiseBuffer.getChannelData(0)
        let lastOut = 0.0
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1
          output[i] = (lastOut + 0.02 * white) / 1.02
          lastOut = output[i]
        }

        const noiseSource = ctx.createBufferSource()
        noiseSource.buffer = noiseBuffer
        noiseSource.loop = true

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
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    const t = ctx.currentTime

    const targetFreq = Math.min(1600, Math.max(550, 720 + velocity * 28))
    filterRef.current.frequency.setTargetAtTime(targetFreq, t, 0.02)

    const targetGain = Math.min(0.18, Math.max(0.01, velocity * 0.012))
    gainRef.current.gain.setTargetAtTime(targetGain, t, 0.02)
  }, [isMuted])

  const stopFrictionAudio = useCallback(() => {
    const ctx = getDoodleAudioContext()
    if (!ctx || !gainRef.current) return
    const t = ctx.currentTime
    gainRef.current.gain.setTargetAtTime(0, t, 0.03)
  }, [])

  useEffect(() => {
    if (isMuted) {
      stopFrictionAudio()
    }
  }, [isMuted, stopFrictionAudio])

  // Dynamic Slate Canvas Resizer
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    const width = parent ? parent.clientWidth : canvas.clientWidth
    const height = parent ? parent.clientHeight : canvas.clientHeight
    if (width === 0 || height === 0) return

    const dpr = window.devicePixelRatio || 1

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')
    if (tempCtx && canvas.width > 0 && canvas.height > 0) {
      tempCtx.drawImage(canvas, 0, 0)
    }

    canvas.width = width * dpr
    canvas.height = height * dpr

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.fillStyle = '#0D0D0E'
      ctx.fillRect(0, 0, width, height)

      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.drawImage(tempCanvas, 0, 0, width, height)
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

    const activeSwatch = COLOR_SWATCHES.find(s => s.id === activeColor) || COLOR_SWATCHES[0]

    if (isEraser) {
      ctx.strokeStyle = '#0D0D0E'
      ctx.lineWidth = 20
    } else {
      const baseWidth = 4.5
      const taper = Math.max(0.85, Math.min(1.25, 1 + (velocity - 10) * 0.012))
      ctx.strokeStyle = activeSwatch.hex
      ctx.lineWidth = baseWidth * taper
    }

    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()

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
    const parent = canvas.parentElement
    const width = parent ? parent.clientWidth : canvas.clientWidth
    const height = parent ? parent.clientHeight : canvas.clientHeight
    ctx.fillStyle = '#0D0D0E'
    ctx.fillRect(0, 0, width, height)
  }

  function handleToggleMute() {
    triggerHaptic(8)
    setIsMuted(prev => {
      const next = !prev
      if (next) {
        stopFrictionAudio()
      }
      return next
    })
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-[#0A0A0B] select-none touch-none animate-fade-in py-2 px-4">
      {/* ── Top Controls Bar (Directly Above Canvas) ── */}
      <div className="flex items-center justify-between mb-3 px-1 shrink-0">
        {/* Left Side: 3 Circular Color Swatches */}
        <div className="flex items-center gap-2.5">
          {COLOR_SWATCHES.map(swatch => {
            const isSelected = !isEraser && activeColor === swatch.id
            return (
              <button
                key={swatch.id}
                type="button"
                onClick={() => {
                  setIsEraser(false)
                  setActiveColor(swatch.id)
                  triggerHaptic(10)
                }}
                aria-label={`Select ${swatch.label} color`}
                title={swatch.label}
                className={`
                  w-6 h-6 rounded-full border transition-all duration-200 cursor-pointer focus:outline-none
                  ${isSelected
                    ? 'border-[#E5E5E7] scale-110 shadow-sm ring-1 ring-[#E5E5E7]/50'
                    : 'border-[#222225] hover:scale-105 opacity-80 hover:opacity-100'
                  }
                `}
                style={{ backgroundColor: swatch.hex }}
              />
            )
          })}
        </div>

        {/* Right Side: Minimalist ERASER and CLEAR Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsEraser(prev => !prev)
              triggerHaptic(10)
            }}
            className={`
              text-xs tracking-widest border px-3 py-1 rounded transition-all duration-200 cursor-pointer focus:outline-none uppercase font-sans
              ${isEraser
                ? 'text-[#E5E5E7] border-[#3F3F46] bg-[#222225]'
                : 'text-[#71717A] border-[#222225] hover:text-[#E5E5E7] hover:border-[#3F3F46]'
              }
            `}
          >
            ERASER
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="text-xs tracking-widest text-[#71717A] border border-[#222225] hover:text-[#E5E5E7] hover:border-[#3F3F46] px-3 py-1 rounded transition-all duration-200 cursor-pointer focus:outline-none uppercase font-sans"
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* ── Canvas Frame (Framed Slate) ── */}
      <div className="relative flex-1 w-full rounded-2xl border border-[#222225] bg-[#0D0D0E] overflow-hidden my-1">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full absolute inset-0 cursor-crosshair block touch-none select-none z-10"
        />
      </div>

      {/* ── Bottom Row (Directly Below Canvas) ── */}
      <div className="flex items-center justify-between mt-3 px-1 shrink-0">
        {/* Left Side: Subtitle Italic Prompt */}
        <span className="text-xs text-[#52525B] italic font-serif-nook">
          "No lines have to make sense."
        </span>

        {/* Right Side: Unobtrusive Sound Toggle Button */}
        <button
          type="button"
          onClick={handleToggleMute}
          className="text-xs tracking-widest text-[#71717A] border border-[#222225] hover:text-[#E5E5E7] hover:border-[#3F3F46] px-3 py-1.5 rounded transition-all duration-200 cursor-pointer focus:outline-none uppercase font-sans"
        >
          SOUND: {isMuted ? 'OFF' : 'ON'}
        </button>
      </div>
    </div>
  )
}

