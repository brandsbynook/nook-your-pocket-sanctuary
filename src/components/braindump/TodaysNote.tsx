import { useRef, useEffect, useState } from 'react'
import { saveTextEntry, getEditorFont, type EditorFont } from '../../utils/storage'
import { playPaperCrumpleSound } from '../../utils/crumpleSound'
import TypefaceModal, { getFontFamilyClass } from '../TypefaceModal'

type Status = 'idle' | 'saved' | 'cleared'

const MAX_CHARS = 280

export default function TodaysNote() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText]     = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [font, setFont]     = useState<EditorFont>(() => getEditorFont())
  const [showTypefaceModal, setShowTypefaceModal] = useState(false)
  const [isCrumpling, setIsCrumpling] = useState(false)
  const [showPuff, setShowPuff] = useState(false)

  /* Auto-expand */
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
    saveTextEntry(text.trim(), 'note')
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
    <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full py-2">
      <div className="w-full max-w-lg mx-auto bg-[#161412] border border-[#2C2926] p-5 md:p-6 rounded-2xl shadow-xl flex flex-col relative my-auto">
        {/* Date stamp */}
        <div className="mb-4">
          <p className="font-sans text-[#52525B] text-[0.62rem] tracking-[0.2em] uppercase">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </p>
        </div>

        {/* Textarea with Multi-Stage Physics Crumple Animation */}
        <div className={`flex-1 overflow-y-auto min-h-0 mb-5 relative ${isCrumpling ? 'animate-crumple-discard' : 'animate-fade-in'}`}>
          <textarea
            ref={textareaRef}
            id="todays-note-input"
            value={text}
            onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Something you want to remember from today."
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="sentences"
            disabled={isCrumpling}
            className={`
              w-full bg-transparent resize-none outline-none border-none
              ${activeFontClass} text-neutral-200/90 text-[0.98rem]
              font-light leading-[1.85] tracking-wide
              placeholder:text-neutral-500/60 placeholder:italic placeholder:font-serif-nook
              min-h-[120px] transition-all duration-300
            `}
            style={{ height: 'auto' }}
          />
        </div>

        {/* Soft Particle Puff at Release Point */}
        {showPuff && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-20 h-20 rounded-full border border-neutral-500/30 bg-neutral-700/20 backdrop-blur-xs animate-puff-fade" />
          </div>
        )}

        {/* Feedback */}
        <div
          className={`
            text-center font-serif-nook text-xs italic tracking-wider transition-all duration-500 mb-3
            ${status === 'saved'   ? 'text-[#C9B99A] opacity-100' :
              status === 'cleared' ? 'text-neutral-500 font-sans uppercase text-[0.6rem] tracking-[0.2em] opacity-100' :
                                     'opacity-0'}
          `}
          aria-live="polite"
        >
          {status === 'saved'   && 'Folded and placed into your Notes Jar.'}
          {status === 'cleared' && 'note cleared.'}
        </div>

        {/* Equalized Bottom actions */}
        <div className="flex items-center justify-between border-t border-neutral-800/80 pt-4">
          <button
            id="todays-note-clear-btn"
            onClick={handleClear}
            disabled={!text || isCrumpling}
            className="
              font-mono text-[11px] tracking-widest uppercase
              text-neutral-500 hover:text-neutral-300
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors duration-200 focus:outline-none cursor-pointer
            "
          >
            Clear / Let go
          </button>

          <button
            id="note-typeface-btn"
            type="button"
            onClick={() => setShowTypefaceModal(true)}
            className="
              font-mono text-[11px] tracking-widest uppercase
              text-neutral-500 hover:text-neutral-300
              transition-colors duration-200 focus:outline-none cursor-pointer
            "
          >
            Typeface
          </button>

          <button
            id="note-keep-btn"
            onClick={handleKeep}
            disabled={!text.trim() || isCrumpling}
            className="
              font-mono text-[11px] tracking-widest uppercase
              text-neutral-500 hover:text-neutral-300
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
