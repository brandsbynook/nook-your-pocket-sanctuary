import { useState, useEffect, useRef } from 'react'
import { ambientAudio } from '../utils/audioEngine'

interface QuietModeOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export default function QuietModeOverlay({ isOpen, onClose }: QuietModeOverlayProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [textVisible, setTextVisible] = useState(true)
  const [isMuted, setIsMuted] = useState(false)

  const textTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      setTextVisible(true)
      // trigger fade in next tick
      const frame = requestAnimationFrame(() => {
        setVisible(true)
      })

      // Start ambient audio with smooth fade
      ambientAudio.start(2.0).catch(() => {})

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
      ambientAudio.stop(1.5)
      const timer = setTimeout(() => {
        setMounted(false)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  function handleToggleMute(e: React.MouseEvent) {
    e.stopPropagation()
    const nextMuted = ambientAudio.toggleMute(0.4)
    setIsMuted(nextMuted)
  }

  function handleOverlayClick() {
    onClose()
  }

  if (!mounted) return null

  return (
    <div
      id="quiet-mode-overlay"
      onClick={handleOverlayClick}
      aria-label="Tap anywhere to exit quiet mode"
      className={`
        fixed inset-0 z-50
        flex flex-col items-center justify-between
        px-6 py-10
        bg-[#0B0B0B]
        cursor-pointer select-none
        transition-opacity duration-800 ease-in-out
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* ── Top Bar with Sound Toggle ───────────────────────── */}
      <div className="w-full flex items-center justify-between shrink-0">
        <span className="font-sans text-[0.55rem] tracking-[0.2em] uppercase text-[#3A3A3A] opacity-60">
          quiet mode
        </span>

        {/* Audio Mute / Unmute Button */}
        <button
          onClick={handleToggleMute}
          aria-label={isMuted ? 'Unmute ambient sound' : 'Mute ambient sound'}
          className="p-2 text-[#52525B] hover:text-[#71717A] opacity-40 hover:opacity-80 transition-opacity focus:outline-none"
        >
          {isMuted ? (
            // Muted Speaker Icon
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            // Playing Speaker Waves Icon
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Center Slow-Breathing Orb ───────────────────────── */}
      <div className="relative my-auto flex items-center justify-center">
        {/* Soft expanding atmospheric outer halo */}
        <div
          className="absolute w-72 h-72 rounded-full bg-[#C9B99A]/4 blur-3xl pointer-events-none animate-pulse"
          style={{ animationDuration: '8s' }}
        />

        {/* Outer gentle ring */}
        <div
          className="w-48 h-48 rounded-full border border-[#C9B99A]/15 flex items-center justify-center transition-all duration-[6000ms] animate-breathe"
        >
          {/* Inner core breathing light */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1C1A17] to-[#0E0E0E] border border-[#C9B99A]/30 shadow-2xl flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#C9B99A]/60 blur-[1px]" />
          </div>
        </div>
      </div>

      {/* ── Bottom Whisper & Return Guide ───────────────────── */}
      <div className="flex flex-col items-center gap-3 text-center shrink-0 mb-4">
        {/* Fading Whisper Text */}
        <p
          className={`
            font-serif-nook text-[#71717A] text-[1.1rem] font-light italic tracking-wide
            transition-opacity duration-1000 ease-in-out
            ${textVisible ? 'opacity-80' : 'opacity-0 pointer-events-none'}
          `}
        >
          A quiet space. Nothing is required of you.
        </p>

        {/* Minimal return guide */}
        <span className="font-sans text-[0.58rem] tracking-[0.2em] uppercase text-[#333333] hover:text-[#52525B] transition-colors">
          tap anywhere to return
        </span>
      </div>
    </div>
  )
}
