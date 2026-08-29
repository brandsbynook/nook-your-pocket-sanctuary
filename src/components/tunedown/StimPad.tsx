import { useRef, useEffect } from 'react'

interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
  color: string
}

const RIPPLE_COLORS = [
  'rgba(201, 185, 154, ',  // warm amber/sand
  'rgba(229, 224, 216, ',  // off-white
  'rgba(113, 113, 122, ',  // muted slate
]

export default function StimPad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ripplesRef = useRef<Ripple[]>([])
  const reqRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(dpr, dpr)

    const render = () => {
      if (!ctx || !canvas) return
      ctx.fillStyle = '#0C0C0C'
      ctx.fillRect(0, 0, rect.width, rect.height)

      // Update and draw ripples
      const ripples = ripplesRef.current
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]
        r.radius += 1.2
        r.alpha *= 0.96

        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `${r.color}${r.alpha})`
        ctx.lineWidth = 1.8
        ctx.stroke()

        // Inner secondary wave
        if (r.radius > 8) {
          ctx.beginPath()
          ctx.arc(r.x, r.y, r.radius * 0.6, 0, Math.PI * 2)
          ctx.strokeStyle = `${r.color}${r.alpha * 0.5})`
          ctx.lineWidth = 1
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
      if (reqRef.current) cancelAnimationFrame(reqRef.current)
    }
  }, [])

  function addRipple(clientX: number, clientY: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    const randomColor = RIPPLE_COLORS[Math.floor(Math.random() * RIPPLE_COLORS.length)]

    ripplesRef.current.push({
      x,
      y,
      radius: 2,
      maxRadius: 65 + Math.random() * 35,
      alpha: 0.8,
      color: randomColor,
    })
  }

  function handlePointerDown(e: React.PointerEvent) {
    addRipple(e.clientX, e.clientY)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (e.buttons > 0 || e.pointerType === 'touch') {
      addRipple(e.clientX, e.clientY)
    }
  }

  return (
    <div className="flex flex-col items-center justify-between flex-1 py-4 animate-fade-in text-center min-h-0 w-full">
      {/* Subtitle */}
      <p className="font-serif-nook text-[#71717A] text-[0.95rem] font-light italic px-4">
        Tap or glide anywhere. No targets, no scores.
      </p>

      {/* Interactive Liquid Surface */}
      <div className="w-full flex-1 min-h-[280px] my-auto border border-[#1E1E1E] bg-[#0C0C0C] rounded-sm overflow-hidden touch-none relative cursor-pointer">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="w-full h-full block select-none"
        />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <span className="font-sans text-[0.6rem] tracking-[0.2em] uppercase text-[#71717A]">
            touch the surface
          </span>
        </div>
      </div>

      {/* Footer calm note */}
      <p className="font-sans text-[#52525B] text-[0.62rem] tracking-[0.14em] uppercase">
        Pure sensory stillness
      </p>
    </div>
  )
}
