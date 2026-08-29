import { useState, useRef, useEffect } from 'react'
import { saveTextEntry } from '../../utils/storage'

const COLORS = [
  { id: 'off-white', label: 'Off-white',  hex: '#E5E0D8' },
  { id: 'sand',      label: 'Warm Sand',  hex: '#C5A880' },
  { id: 'slate',     label: 'Muted Slate', hex: '#71717A' },
]

export default function DoodlingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef<boolean>(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)

  const [activeColor, setActiveColor] = useState<string>('#E5E0D8')
  const [isEraser, setIsEraser] = useState<boolean>(false)
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false)

  // Initialize canvas resolution
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.fillStyle = '#0C0C0C'
      ctx.fillRect(0, 0, rect.width, rect.height)
    }
  }, [])

  function getCanvasCoords(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    const coords = getCanvasCoords(e)
    if (!coords) return
    isDrawingRef.current = true
    lastPosRef.current = coords
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const currentPos = getCanvasCoords(e)
    if (!ctx || !currentPos || !lastPosRef.current) return

    ctx.beginPath()
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
    ctx.lineTo(currentPos.x, currentPos.y)

    if (isEraser) {
      ctx.strokeStyle = '#0C0C0C'
      ctx.lineWidth = 18
    } else {
      ctx.strokeStyle = activeColor
      ctx.lineWidth = 2.5
    }

    ctx.stroke()
    lastPosRef.current = currentPos
  }

  function stopDrawing() {
    isDrawingRef.current = false
    lastPosRef.current = null
  }

  function handleClear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#0C0C0C'
    ctx.fillRect(0, 0, rect.width, rect.height)
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
    <div className="flex flex-col items-center justify-between flex-1 py-2 animate-fade-in min-h-0 w-full">
      {/* Tool & Color Header Bar */}
      <div className="flex items-center justify-between w-full mb-3 shrink-0">
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
                w-5 h-5 rounded-full border transition-all duration-200 focus:outline-none
                ${!isEraser && activeColor === c.hex
                  ? 'scale-110 border-[#C9B99A] ring-1 ring-[#C9B99A]/50'
                  : 'border-transparent opacity-60 hover:opacity-100'
                }
              `}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>

        {/* Tools: Eraser & Clear */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`
              px-2.5 py-1 border font-sans text-[0.6rem] tracking-[0.1em] uppercase transition-all
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
            className="px-2.5 py-1 border border-[#222] font-sans text-[0.6rem] tracking-[0.1em] uppercase text-[#52525B] hover:text-[#71717A] transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Drawing Canvas Area */}
      <div className="w-full flex-1 min-h-[260px] border border-[#1E1E1E] bg-[#0C0C0C] rounded-sm overflow-hidden touch-none relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair block"
        />

        {savedFeedback && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-fade-in pointer-events-none">
            <span className="font-sans text-[0.65rem] tracking-[0.18em] uppercase text-[#C9B99A]">
              kept in memory chest
            </span>
          </div>
        )}
      </div>

      {/* Bottom Save Action */}
      <div className="flex items-center justify-between w-full pt-3 shrink-0">
        <span className="font-serif-nook text-[#52525B] text-[0.8rem] italic">
          No lines have to make sense.
        </span>

        <button
          id="doodle-save-btn"
          onClick={handleSave}
          className="
            px-4 py-1.5 border border-[#2A2A2A]
            font-serif-nook text-[#E5E0D8] text-[0.85rem] font-light
            hover:border-[#C9B99A]/40 hover:text-[#C9B99A]
            transition-all duration-300 focus:outline-none
          "
        >
          Save to Memory Chest
        </button>
      </div>
    </div>
  )
}
