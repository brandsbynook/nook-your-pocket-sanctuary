import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { saveTextEntry } from '../../utils/storage'

export type DoodleMode = 'open' | 'vanishing' | 'symmetry'

interface DoodlingCanvasProps {
  initialMode?: DoodleMode
}

interface StrokePoint {
  x: number
  y: number
  color: string
  width: number
  isEraser: boolean
  isStart?: boolean
  timestamp: number
}

const COLORS = [
  { id: 'off-white', label: 'Off-white',  hex: '#E5E0D8' },
  { id: 'sand',      label: 'Warm Sand',  hex: '#C5A880' },
  { id: 'slate',     label: 'Muted Slate', hex: '#71717A' },
]

export default function DoodlingCanvas({ initialMode = 'open' }: DoodlingCanvasProps) {
  const [mode, setMode] = useState<DoodleMode>(initialMode)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef<boolean>(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  const vanishingStrokesRef = useRef<StrokePoint[]>([])
  const animFrameRef = useRef<number | null>(null)

  const [activeColor, setActiveColor] = useState<string>('#E5E0D8')
  const [isEraser, setIsEraser] = useState<boolean>(false)
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false)

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
    return () => window.removeEventListener('resize', initCanvas)
  }, [initCanvas])

  // Vanishing Ink Animation Loop
  useEffect(() => {
    if (mode !== 'vanishing') return

    const loop = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const rect = canvas.getBoundingClientRect()
      const now = Date.now()

      // Clear
      ctx.fillStyle = '#0C0C0C'
      ctx.fillRect(0, 0, rect.width, rect.height)

      // Prune & draw remaining points
      const points = vanishingStrokesRef.current
      vanishingStrokesRef.current = points.filter(p => now - p.timestamp < 4000)

      for (let i = 0; i < vanishingStrokesRef.current.length; i++) {
        const p = vanishingStrokesRef.current[i]
        const age = now - p.timestamp
        const alpha = Math.max(0, 1 - age / 4000)

        if (p.isStart || i === 0) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
        } else {
          const prev = vanishingStrokesRef.current[i - 1]
          if (!p.isStart) {
            ctx.beginPath()
            ctx.moveTo(prev.x, prev.y)
            ctx.lineTo(p.x, p.y)
            ctx.strokeStyle = p.isEraser ? '#0C0C0C' : p.color
            ctx.globalAlpha = alpha
            ctx.lineWidth = p.width
            ctx.stroke()
            ctx.globalAlpha = 1.0
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [mode])

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
    const coords = getPointerCoords(e)
    if (!coords) return
    isDrawingRef.current = true
    lastPosRef.current = coords
    e.currentTarget.setPointerCapture?.(e.pointerId)

    if (mode === 'vanishing') {
      vanishingStrokesRef.current.push({
        x: coords.x,
        y: coords.y,
        color: activeColor,
        width: isEraser ? 22 : 2.5,
        isEraser,
        isStart: true,
        timestamp: Date.now(),
      })
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const currentPos = getPointerCoords(e)
    if (!ctx || !currentPos || !lastPosRef.current || !canvas) return

    const rect = canvas.getBoundingClientRect()
    const strokeWidth = isEraser ? 22 : 2.5
    const strokeColor = isEraser ? '#0C0C0C' : activeColor

    if (mode === 'vanishing') {
      vanishingStrokesRef.current.push({
        x: currentPos.x,
        y: currentPos.y,
        color: strokeColor,
        width: strokeWidth,
        isEraser,
        isStart: false,
        timestamp: Date.now(),
      })
    } else {
      // Primary stroke
      ctx.beginPath()
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
      ctx.lineTo(currentPos.x, currentPos.y)
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = strokeWidth
      ctx.stroke()

      // If Symmetry mode, mirror across vertical centerline
      if (mode === 'symmetry') {
        const midX = rect.width
        const mirrorStartX = midX - lastPosRef.current.x
        const mirrorEndX = midX - currentPos.x

        ctx.beginPath()
        ctx.moveTo(mirrorStartX, lastPosRef.current.y)
        ctx.lineTo(mirrorEndX, currentPos.y)
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = strokeWidth
        ctx.stroke()
      }
    }

    lastPosRef.current = currentPos
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    isDrawingRef.current = false
    lastPosRef.current = null
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId)
    } catch {
      // Ignore fallback
    }
  }

  function handleClear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#0C0C0C'
    ctx.fillRect(0, 0, rect.width, rect.height)
    vanishingStrokesRef.current = []
  }

  function handleSave() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    saveTextEntry(dataUrl, 'doodle')
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 2000)
  }

  return (
    <div className="flex flex-col items-center justify-between flex-1 py-2 animate-fade-in min-h-0 w-full select-none">
      {/* Tool & Color Header Bar */}
      <div className="flex items-center justify-between w-full mb-3 shrink-0 flex-wrap gap-2">
        {/* Colors */}
        <div className="flex items-center gap-2">
          {COLORS.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setActiveColor(c.hex)
                setIsEraser(false)
              }}
              aria-label={c.label}
              className={`
                w-5 h-5 rounded-full border transition-all duration-200 focus:outline-none cursor-pointer
                ${!isEraser && activeColor === c.hex
                  ? 'scale-110 border-[#C9B99A] ring-1 ring-[#C9B99A]/50'
                  : 'border-transparent opacity-60 hover:opacity-100'
                }
              `}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 border border-[#222] p-0.5 rounded-lg bg-[#101014]">
          {(['open', 'vanishing', 'symmetry'] as DoodleMode[]).map(m => (
            <button
              key={m}
              onClick={() => {
                setMode(m)
                handleClear()
              }}
              className={`
                px-2 py-1 font-mono text-[9px] uppercase tracking-wider rounded-md transition-all cursor-pointer focus:outline-none
                ${mode === m
                  ? 'bg-[#C9B99A]/20 text-[#C9B99A]'
                  : 'text-[#71717A] hover:text-[#E5E0D8]'
                }
              `}
            >
              {m === 'open' ? 'Open' : m === 'vanishing' ? 'Vanishing' : 'Symmetry'}
            </button>
          ))}
        </div>

        {/* Tools: Eraser & Clear */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`
              px-2.5 py-1 border font-sans text-[0.6rem] tracking-[0.1em] uppercase transition-all cursor-pointer rounded-sm
              ${isEraser
                ? 'border-[#C9B99A] text-[#C9B99A]'
                : 'border-[#222] text-[#52525B] hover:text-[#71717A]'
              }
            `}
          >
            Eraser
          </button>
          <button
            onClick={handleClear}
            className="px-2.5 py-1 border border-[#222] font-sans text-[0.6rem] tracking-[0.1em] uppercase text-[#52525B] hover:text-[#71717A] transition-colors cursor-pointer rounded-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Drawing Canvas Area with Aspect-Square container */}
      <div className="relative overflow-hidden aspect-square w-full max-w-[380px] my-auto mx-auto border border-[#1E1E1E] bg-[#0C0C0C] rounded-2xl touch-none flex items-center justify-center shadow-xl">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full cursor-crosshair block touch-none select-none"
        />

        {savedFeedback && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-fade-in pointer-events-none select-none">
            <span className="font-sans text-[0.65rem] tracking-[0.18em] uppercase text-[#C9B99A] pointer-events-none select-none">
              kept in memory chest
            </span>
          </div>
        )}
      </div>

      {/* Bottom Save Action */}
      <div className="flex items-center justify-between w-full pt-3 shrink-0">
        <span className="font-serif-nook text-[#52525B] text-[0.8rem] italic pointer-events-none select-none">
          {mode === 'vanishing'
            ? 'Strokes softly dissolve away after 4 seconds.'
            : mode === 'symmetry'
            ? 'Bilateral mirrored balance across the center.'
            : 'No lines have to make sense.'}
        </span>

        <button
          id="doodle-save-btn"
          onClick={handleSave}
          className="
            px-4 py-1.5 border border-[#2A2A2A] rounded-sm
            font-serif-nook text-[#E5E0D8] text-[0.85rem] font-light
            hover:border-[#C9B99A]/40 hover:text-[#C9B99A]
            transition-all duration-300 focus:outline-none cursor-pointer
          "
        >
          Save to Memory Chest
        </button>
      </div>
    </div>
  )
}
