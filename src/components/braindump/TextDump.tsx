import { useRef, useEffect, useState } from 'react'
import { saveTextEntry } from '../../utils/storage'

type Status = 'idle' | 'saved' | 'cleared'

export default function TextDump() {
  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const [text, setText]     = useState('')
  const [status, setStatus] = useState<Status>('idle')

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
    setText('')
    setStatus('cleared')
    setTimeout(() => setStatus('idle'), 1500)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Helper text */}
      <p className="
        font-serif-nook text-[#52525B] text-[0.95rem]
        font-light italic leading-relaxed mb-5
      ">
        Everything can go here. The mess, the noise,
        the things you can't say out loud.
      </p>

      {/* Textarea — grows with content, scrollable inside its flex container */}
      <div className="flex-1 overflow-y-auto min-h-0 mb-5">
        <textarea
          ref={textareaRef}
          id="text-dump-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Start writing..."
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          className="
            w-full bg-transparent resize-none outline-none border-none
            font-sans text-[#E5E0D8]/90 text-[0.95rem]
            font-light leading-[1.85] tracking-wide
            placeholder:text-[#3A3A3A]
            min-h-[120px]
          "
          style={{ height: 'auto' }}
        />
      </div>

      {/* Confirmation feedback */}
      <div
        className={`
          text-center font-sans text-[0.6rem] tracking-[0.2em] uppercase
          transition-all duration-500 mb-3
          ${status === 'saved'   ? 'text-[#C9B99A] opacity-100' :
            status === 'cleared' ? 'text-[#52525B] opacity-100' :
                                   'opacity-0'}
        `}
        aria-live="polite"
      >
        {status === 'saved'   && 'kept. it\'s safe now.'}
        {status === 'cleared' && 'page cleared.'}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between border-t border-[#1E1E1E] pt-4">
        <button
          id="text-dump-discard"
          onClick={handleClear}
          disabled={!text}
          className="
            font-sans text-[#52525B] text-[0.62rem]
            tracking-[0.16em] uppercase
            transition-colors duration-300
            hover:text-[#71717A]
            disabled:opacity-30 disabled:cursor-not-allowed
          "
        >
          Clear page
        </button>

        <button
          id="text-dump-keep"
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
