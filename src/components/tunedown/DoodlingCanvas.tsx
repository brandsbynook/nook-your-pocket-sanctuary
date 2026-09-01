import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { triggerHaptic } from '../../utils/haptics'
import BottomControlsDock, { ActionPill } from './BottomControlsDock'

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

  // Dynamic Full-Bleed Canvas Resizer without Blur
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
      ctx.fillStyle = '#0C0C0C'
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

    const baseWidth = WEIGHT_PRESETS.find(w => w.id === strokeWeight)?.width || 4.5
    const taper = Math.max(0.85, Math.min(1.25, 1 + (velocity - 10) * 0.012))
    const strokeWidth = baseWidth * taper

    ctx.strokeStyle = '#E5E0D8'
    ctx.lineWidth = strokeWidth

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
    ctx.fillStyle = '#0C0C0C'
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
    <div className="relative w-full h-full flex-1 touch-none select-none bg-[#0C0C0C] flex items-center justify-center overflow-hidden animate-fade-in">
      {/* ── Floating Top Header Bar ── */}
      <div className="absolute top-16 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <span className="font-serif-nook text-xs text-[#8A847A] tracking-wider uppercase bg-[#0C0C0C]/60 backdrop-blur-sm px-2.5 py-1 rounded">
          Charcoal Canvas
        </span>

        {/* Stroke Weight Pills */}
        <div className="flex items-center gap-1 bg-[#101014]/80 backdrop-blur-sm p-1 rounded-full border border-[#23201C]">
          {WEIGHT_PRESETS.map(w => (
            <button
              key={w.id}
              onClick={() => {
                setStrokeWeight(w.id)
                triggerHaptic(10)
              }}
              className={`
                px-2.5 py-1 rounded-full text-[0.62rem] font-sans tracking-wider uppercase transition-all duration-200 cursor-pointer focus:outline-none flex items-center gap-1.5
                ${strokeWeight === w.id
                  ? 'bg-[#23201C] text-[#EAE5DC] shadow-sm'
                  : 'text-[#8A847A] hover:text-[#EAE5DC]'
                }
              `}
            >
              <span
                className="rounded-full bg-current inline-block"
                style={{ width: w.id === 'fine' ? 3 : w.id === 'medium' ? 5 : 7, height: w.id === 'fine' ? 3 : w.id === 'medium' ? 5 : 7 }}
              />
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Full-Bleed Interactive Canvas Surface ── */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full absolute inset-0 cursor-crosshair block touch-none select-none z-10"
      />

      {/* ── Standardized Unified Bottom Controls Dock ── */}
      <BottomControlsDock>
        <ActionPill onClick={handleToggleMute}>
          <span className={`w-1.5 h-1.5 rounded-full ${isMuted ? 'bg-[#52525B]' : 'bg-[#C9B99A]'}`} />
          {isMuted ? 'MUTE' : 'SOUND ON'}
        </ActionPill>

        <ActionPill onClick={handleClear}>
          Clear
        </ActionPill>
      </BottomControlsDock>
    </div>
  )
}
