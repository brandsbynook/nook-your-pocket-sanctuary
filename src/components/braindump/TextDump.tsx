import { useRef, useEffect, useState } from 'react'
import { saveTextEntry, getEditorFont, type EditorFont } from '../../utils/storage'
import { playPaperCrumpleSound } from '../../utils/crumpleSound'
import TypefaceModal, { getFontFamilyClass } from '../TypefaceModal'

type Status = 'idle' | 'saved' | 'cleared'

export default function TextDump() {
  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const [text, setText]     = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [font, setFont]     = useState<EditorFont>(() => getEditorFont())
  const [showTypefaceModal, setShowTypefaceModal] = useState(false)
  const [isCrumpling, setIsCrumpling] = useState(false)
  const [showPuff, setShowPuff] = useState(false)

  /* Auto-expand textarea height */
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  /* Focus on mount */
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  function handleKeep() {
    if (!text.trim()) return
    saveTextEntry(text.trim(), 'text')
    setText('')
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2200)
  }

  function handleClear() {
    if (!text || isCrumpling) return
    setIsCrumpling(true)
    playPaperCrumpleSound()

    // Trigger soft smoke / particle puff at Stage 3
    setTimeout(() => {
      setShowPuff(true)
      setTimeout(() => setShowPuff(false), 500)
    }, 550)

    // Complete full 900ms choreographic release
    setTimeout(() => {
      setText('')
      setIsCrumpling(false)
      setStatus('cleared')
      setTimeout(() => setStatus('idle'), 1500)
    }, 900)
  }

  const activeFontClass = getFontFamilyClass(font)

  return (
    <div className="flex-1 flex flex-col items-center justify-start min-h-0 w-full pt-3 sm:pt-6 pb-2 overflow-y-auto">
      <div className="w-full max-w-lg min-h-[300px] flex flex-col mx-auto bg-[#141416] border border-[#222225] p-5 md:p-6 rounded-2xl shadow-xl relative mt-4 sm:mt-6">
        {/* Helper text */}
        <div className="mb-4">
          <p className="font-serif-nook text-[#71717A] text-[0.92rem] font-light italic leading-snug">
            Everything can go here.
          </p>
        </div>

        {/* Textarea with Multi-Stage Physics Crumple Animation */}
        <div className={`flex-1 overflow-y-auto min-h-0 mb-5 relative ${isCrumpling ? 'animate-crumple-discard' : 'animate-fade-in'}`}>
          <textarea
            ref={textareaRef}
            id="text-dump-input"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Start writing..."
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            disabled={isCrumpling}
            className={`
              w-full bg-transparent resize-none outline-none focus:outline-none border-none
              ${activeFontClass} text-[#E5E5E7] text-[0.98rem]
              font-light leading-[1.85] tracking-wide
              placeholder:text-[#52525B]
              min-h-[140px] transition-all duration-300
            `}
            style={{ height: 'auto' }}
          />
        </div>

        {/* Soft Particle Puff at Release Point */}
        {showPuff && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-20 h-20 rounded-full border border-[#52525B]/30 bg-[#27272A]/20 backdrop-blur-xs animate-puff-fade" />
          </div>
        )}

        {/* Confirmation feedback */}
        <div
          className={`
            text-center font-sans text-[0.6rem] tracking-[0.2em] uppercase
            transition-all duration-500 mb-3
            ${status === 'saved'   ? 'text-[#E5E5E7] opacity-100' :
              status === 'cleared' ? 'text-[#52525B] opacity-100' :
                                     'opacity-0'}
          `}
          aria-live="polite"
        >
          {status === 'saved'   && 'kept. it\'s safe now.'}
          {status === 'cleared' && 'page cleared.'}
        </div>

        {/* Equalized Bottom actions */}
        <div className="flex items-center justify-between border-t border-[#1F1F23] pt-4 mt-auto">
          <button
            id="text-dump-discard"
            onClick={handleClear}
            disabled={!text || isCrumpling}
            className="
              font-mono text-[11px] tracking-widest uppercase
              text-[#71717A] hover:text-[#E5E5E7]
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors duration-200 focus:outline-none cursor-pointer
            "
          >
            Clear / Let go
          </button>

          <button
            id="text-dump-typeface-btn"
            type="button"
            onClick={() => setShowTypefaceModal(true)}
            className="
              font-mono text-[11px] tracking-widest uppercase
              text-[#71717A] hover:text-[#E5E5E7]
              transition-colors duration-200 focus:outline-none cursor-pointer
            "
          >
            Typeface
          </button>

          <button
            id="text-dump-keep"
            onClick={handleKeep}
            disabled={!text.trim() || isCrumpling}
            className="
              font-mono text-[11px] tracking-widest uppercase
              text-[#71717A] hover:text-[#E5E5E7]
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors duration-200 focus:outline-none cursor-pointer
            "
          >
            Keep this
          </button>
        </div>
      </div>

      {/* Typeface Selection Modal */}
      <TypefaceModal
        isOpen={showTypefaceModal}
        onClose={() => setShowTypefaceModal(false)}
        onSelectFont={setFont}
      />
    </div>
  )
}
