import { useEffect, useRef, useState } from 'react'

interface BannerScreenProps {
  onBack: () => void
}

export default function BannerScreen({ onBack }: BannerScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [downloaded, setDownloaded] = useState<boolean>(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  function renderGraphic(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1024
    canvas.height = 500

    // 1. Deep sanctuary obsidian background (#0A0A0B)
    ctx.fillStyle = '#0A0A0B'
    ctx.fillRect(0, 0, 1024, 500)

    // Combined block height = 56px (heading) + 12px (marginTop) + 22px (subtitle) = 90px
    // Vertically centered block: Top = (500 - 90) / 2 = 205px
    // Heading center Y = 205 + 28 = 233px
    // Subtitle center Y = 233 + 28 + 12 + 11 = 284px

    // 2. Heading: "nook." (fontSize: 56px, color: #E6E4DD, letterSpacing: -0.02em)
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = '-0.02em'
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#E6E4DD'
    ctx.font = '300 56px "Cormorant Garamond", Georgia, serif'
    ctx.fillText('nook.', 512, 233)

    // 3. Subtitle: "your pocket sanctuary" (fontSize: 22px, color: #8C8A82, fontStyle: italic, marginTop: 12px)
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = 'normal'
    }
    ctx.fillStyle = '#8C8A82'
    ctx.font = 'italic 300 22px "Cormorant Garamond", Georgia, serif'
    ctx.fillText('your pocket sanctuary', 512, 284)
  }

  function downloadCanvas(canvas: HTMLCanvasElement) {
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)

      const a = document.createElement('a')
      a.href = url
      a.download = 'nook-feature-graphic.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setDownloaded(true)
    }, 'image/png')
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Ensure Cormorant Garamond font is fully loaded before drawing
    if (document.fonts) {
      document.fonts.ready
        .then(() =>
          Promise.all([
            document.fonts.load('300 56px "Cormorant Garamond"'),
            document.fonts.load('italic 300 22px "Cormorant Garamond"'),
          ])
        )
        .then(() => {
          renderGraphic(canvas)
          downloadCanvas(canvas)
        })
        .catch(() => {
          renderGraphic(canvas)
          downloadCanvas(canvas)
        })
    } else {
      renderGraphic(canvas)
      downloadCanvas(canvas)
    }
  }, [])

  function handleManualDownload() {
    if (canvasRef.current) {
      downloadCanvas(canvasRef.current)
    }
  }

  return (
    <main
      id="banner-generator-screen"
      className="
        h-[100dvh] w-full
        px-6 py-10
        flex flex-col justify-between items-center
        overflow-y-auto
        bg-[#0A0A0B] text-[#E5E5E7]
        animate-fade-in
      "
    >
      <div className="flex flex-col items-center max-w-xl w-full text-center my-auto gap-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between w-full">
          <button
            id="banner-back-btn"
            onClick={onBack}
            className="
              flex items-center gap-1.5
              font-sans text-[#71717A] text-[0.68rem]
              tracking-[0.14em] uppercase
              hover:text-[#E5E5E7] transition-colors
              focus:outline-none cursor-pointer
            "
          >
            <span className="text-[0.8rem] leading-none">←</span>
            return
          </button>
          <span className="font-sans text-[0.6rem] tracking-[0.2em] uppercase text-[#52525B]">
            Play Store Asset · 1024 × 500
          </span>
        </div>

        <div>
          <h1 className="font-serif-nook text-2xl sm:text-3xl font-light tracking-wide text-[#E5E5E7] mb-2">
            Feature Graphic Generator
          </h1>
          <p className="font-serif-nook text-sm text-[#71717A] italic">
            Exact Play Store specifications: 1024px × 500px obsidian sanctuary banner.
          </p>
        </div>

        {/* Live Canvas Preview (scaled down responsively while maintaining 1024x500 render) */}
        <div className="w-full border border-[#222225] rounded-2xl overflow-hidden bg-black p-2 shadow-2xl flex flex-col items-center">
          <canvas
            ref={canvasRef}
            width={1024}
            height={500}
            className="w-full h-auto aspect-[1024/500] rounded-xl block"
          />
        </div>

        {/* Status & Actions */}
        <div className="flex flex-col items-center gap-3 w-full">
          {downloaded ? (
            <p className="font-sans text-xs text-[#E5E5E7] tracking-wider flex items-center gap-2">
              <span className="text-emerald-400">✓</span> Download triggered: <span className="underline">nook-feature-graphic.png</span>
            </p>
          ) : (
            <p className="font-sans text-xs text-[#71717A] tracking-wider">
              Rendering canvas with primary display serif font...
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              id="download-graphic-btn"
              onClick={handleManualDownload}
              className="
                w-full py-3.5 rounded-xl border border-[#222225]
                font-serif-nook text-[#E5E5E7] text-base font-normal tracking-wide
                bg-[#141416] hover:bg-[#1E1E22] hover:border-[#3F3F46]
                transition-all duration-300 focus:outline-none flex items-center justify-center gap-2
                cursor-pointer
              "
            >
              <span>Download nook-feature-graphic.png</span>
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                download="nook-feature-graphic.png"
                className="
                  w-full sm:w-auto px-6 py-3.5 rounded-xl border border-[#222225]
                  font-sans text-xs tracking-[0.14em] uppercase text-[#71717A] hover:text-[#E5E5E7]
                  bg-[#0A0A0B] hover:bg-[#141416]
                  transition-all duration-300 flex items-center justify-center
                "
              >
                Direct Link
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
