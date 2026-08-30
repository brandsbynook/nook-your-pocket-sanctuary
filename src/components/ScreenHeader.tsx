import { type ReactNode } from 'react'
import HeaderAudioShortcut from './HeaderAudioShortcut'

interface ScreenHeaderProps {
  id?: string
  title: string
  subtitle?: string
  onBack: () => void
  backLabel?: string
  rightElement?: ReactNode
  hideAudioShortcut?: boolean
  className?: string
}

export default function ScreenHeader({
  id,
  title,
  subtitle,
  onBack,
  backLabel = 'return',
  rightElement,
  hideAudioShortcut = false,
  className = 'mb-5 shrink-0',
}: ScreenHeaderProps) {
  return (
    <header id={id} className={`flex items-center justify-between ${className}`}>
      {/* Back button */}
      <button
        id={id ? `${id}-back` : 'header-back'}
        onClick={onBack}
        aria-label={`Return back from ${title}`}
        className="
          flex items-center gap-1.5 py-1.5 px-1
          font-sans text-[#52525B] text-[0.62rem]
          tracking-[0.14em] uppercase
          hover:text-[#71717A] transition-colors
          focus:outline-none
        "
      >
        <span className="text-[0.8rem] leading-none" aria-hidden="true">←</span>
        {backLabel}
      </button>

      {/* Screen Title & Subtitle */}
      <div className="flex flex-col items-center gap-[2px]">
        <h1 className="font-serif-nook text-[#E5E0D8] text-xl font-light tracking-[0.18em] leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="font-sans text-[#3A3A3A] text-[0.58rem] tracking-[0.1em] text-center">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Action Bar (Audio Shortcut + Optional Custom Elements) */}
      <div className="flex items-center justify-end gap-1.5 min-w-[60px]">
        {rightElement}
        {!hideAudioShortcut && <HeaderAudioShortcut />}
      </div>
    </header>
  )
}
