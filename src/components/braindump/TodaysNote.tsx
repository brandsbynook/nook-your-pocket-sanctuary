import { useRef, useEffect, useState } from 'react'
import { saveTextEntry, getEditorFont, type EditorFont } from '../../utils/storage'
import TypefaceModal, { getFontFamilyClass } from '../TypefaceModal'

type Status = 'idle' | 'saved'

const MAX_CHARS = 280

export default function TodaysNote() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText]     = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [font, setFont]     = useState<EditorFont>(() => getEditorFont())
  const [showTypefaceModal, setShowTypefaceModal] = useState(false)
  const remaining = MAX_CHARS - text.length

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

  const activeFontClass = getFontFamilyClass(font)

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Date stamp */}
      <div className="mb-4">
        <p className="font-sans text-[#52525B] text-[0.62rem] tracking-[0.2em] uppercase">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long',
          })}
        </p>
      </div>

      {/* Helper text */}
      <p className="font-serif-nook text-neutral-500 text-[0.92rem] font-light italic leading-snug mb-4">
        One note for today. No more, no less.
      </p>

      {/* Textarea */}
      <div className="flex-1 overflow-y-auto min-h-0 mb-5">
        <textarea
          ref={textareaRef}
          id="todays-note-input"
          value={text}
          onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
          placeholder="What's the one thing you want to hold onto today?"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="sentences"
          className={`
            w-full bg-transparent resize-none outline-none border-none
            ${activeFontClass} text-neutral-200/90 text-[0.98rem]
            font-light leading-[1.85] tracking-wide
            placeholder:text-neutral-700
            min-h-[100px]
          `}
          style={{ height: 'auto' }}
        />
      </div>

      {/* Feedback */}
      <div
        className={`
          text-center font-sans text-[0.6rem] tracking-[0.2em] uppercase
          transition-all duration-500 mb-3
          ${status === 'saved' ? 'text-[#C9B99A] opacity-100' : 'opacity-0'}
        `}
        aria-live="polite"
      >
        {status === 'saved' && 'noted. it stays with you.'}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between border-t border-[#1E1E1E] pt-4">
        <div className="flex items-center gap-3">
          <button
            id="note-typeface-btn"
            type="button"
            onClick={() => setShowTypefaceModal(true)}
            className="
              font-sans text-[#71717A] text-[0.62rem]
              tracking-[0.16em] uppercase
              transition-colors duration-300
              hover:text-neutral-300 focus:outline-none flex items-center gap-1
            "
          >
            <span>Typeface</span>
          </button>

          {/* Character count — only shows when close to limit */}
          {remaining <= 40 && (
            <span
              className={`
                font-sans text-[0.6rem] tracking-wide tabular-nums
                transition-colors duration-300
                ${remaining <= 10 ? 'text-[#C9B99A]' : 'text-[#52525B]'}
              `}
            >
              {remaining} left
            </span>
          )}
        </div>

        <button
          id="note-keep-btn"
          onClick={handleKeep}
          disabled={!text.trim()}
          className="
            font-serif-nook text-[#E5E0D8] text-[0.95rem]
            font-light tracking-wide
            px-5 py-2 rounded-xl
            border border-[#2A2A2A]
            transition-all duration-300
            hover:border-[#C9B99A]/40 hover:text-[#C9B99A]
            disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none
          "
        >
          Keep this
        </button>
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
