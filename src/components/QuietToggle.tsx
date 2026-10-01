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
      className="p-1 text-[#71717A] hover:text-[#E5E5E7] transition-colors focus:outline-none cursor-pointer"
    >
      <LeafIcon
        size={20}
        className={`transition-colors duration-300 ${isQuiet ? 'text-[#E5E5E7]' : 'text-[#71717A] hover:text-[#E5E5E7]'}`}
      />
    </button>
  )
}
