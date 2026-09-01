import { useState } from 'react'
import { LeafIcon } from './LeafIcon'

interface QuietToggleProps {
  active?: boolean
  onToggle?: (active: boolean) => void
}

export default function QuietToggle({ active, onToggle }: QuietToggleProps) {
  const [internalQuiet, setInternalQuiet] = useState(false)
  const isQuiet = active !== undefined ? active : internalQuiet

  function handleClick() {
    const next = !isQuiet
    if (active === undefined) {
      setInternalQuiet(next)
    }
    onToggle?.(next)
  }

  return (
    <button
      id="quiet-toggle"
      onClick={handleClick}
      aria-label={isQuiet ? 'Disable quiet mode' : 'Enable quiet mode'}
      aria-pressed={isQuiet}
      className="flex items-center gap-2 select-none focus:outline-none group cursor-pointer"
    >
      <LeafIcon
        size={16}
        className={`transition-colors duration-300 ${isQuiet ? 'text-[#C9B99A]' : 'text-[#71717A] group-hover:text-[#A1A1AA]'}`}
      />
      {/* Organic Pill track */}
      <span
        className={`
          w-11 h-6 rounded-full p-0.5 transition-colors duration-300 ease-in-out relative flex items-center shrink-0
          ${isQuiet
            ? 'bg-[#4A3E2C] border border-[#7C6647]'
            : 'bg-[#222222] border border-transparent'
          }
        `}
      >
        {/* Knob / Thumb */}
        <span
          className={`
            w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ease-in-out
            ${isQuiet ? 'translate-x-5 bg-[#E5E0D8]' : 'translate-x-0 bg-[#888888]'}
          `}
        />
      </span>

      {/* Label */}
      <span
        className={`
          font-sans text-[0.62rem] tracking-[0.18em] uppercase
          transition-colors duration-300
          ${isQuiet ? 'text-[#C9B99A]' : 'text-[#71717A] group-hover:text-[#A1A1AA]'}
        `}
      >
        quiet
      </span>
    </button>
  )
}
