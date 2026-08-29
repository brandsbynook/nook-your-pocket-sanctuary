import { useRef, useEffect, useState } from 'react'
import { saveTextEntry } from '../../utils/storage'

type Status = 'idle' | 'saved'

const MAX_CHARS = 280

export default function TodaysNote() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText]     = useState('')
  const [status, setStatus] = useState<Status>('idle')
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

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Date stamp */}
      <p className="
        font-sans text-[#3A3A3A] text-[0.6rem]
        tracking-[0.2em] uppercase mb-5
      ">
        {new Date().toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long',
        })}
      </p>

      {/* Helper text */}
      <p className="
        font-serif-nook text-[#52525B] text-[0.95rem]
        font-light italic leading-relaxed mb-5
      ">
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
          className="
            w-full bg-transparent resize-none outline-none border-none
            font-sans text-[#E5E0D8]/90 text-[0.95rem]
            font-light leading-[1.85] tracking-wide
            placeholder:text-[#3A3A3A]
            min-h-[100px]
          "
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
        {/* Character count — only shows when close to limit */}
        <span
          className={`
            font-sans text-[0.6rem] tracking-wide tabular-nums
            transition-colors duration-300
            ${remaining <= 40
              ? remaining <= 10 ? 'text-[#C9B99A]' : 'text-[#52525B]'
              : 'text-transparent'
            }
          `}
        >
          {remaining} left
        </span>

        <button
          id="note-keep-btn"
          onClick={handleKeep}
          disabled={!text.trim()}
          className="
            font-serif-nook text-[#E5E0D8] text-[0.95rem]
            font-light tracking-wide
            px-5 py-2
            border border-[#2A2A2A]
            transition-all duration-300
            hover:border-[#C9B99A]/40 hover:text-[#C9B99A]
            disabled:opacity-30 disabled:cursor-not-allowed
          "
        >
          Keep this
        </button>
      </div>
    </div>
  )
}
