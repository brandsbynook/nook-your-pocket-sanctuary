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
  className = 'mb-6 shrink-0',
}: ScreenHeaderProps) {
  return (
    <div id={id} className={`flex flex-col w-full ${className}`}>
      {/* Top Navigation Bar (Return & Audio Shortcut) */}
      <div className="flex items-center justify-between w-full">
        <button
          id={id ? `${id}-back` : 'header-back'}
          onClick={onBack}
          aria-label={`Return back from ${title}`}
          className="
            flex items-center gap-1.5 py-1 px-0.5
            font-sans text-[#52525B] text-[0.62rem]
            tracking-[0.14em] uppercase
            hover:text-[#E5E5E7] transition-colors
            focus:outline-none cursor-pointer
          "
        >
          <span className="text-[0.8rem] leading-none" aria-hidden="true">←</span>
          {backLabel}
        </button>

        <div className="flex items-center justify-end gap-1.5 min-w-[60px]">
          {rightElement}
          {!hideAudioShortcut && <HeaderAudioShortcut />}
        </div>
      </div>

      {/* Decoupled Title & Subtitle Block */}
      <div className="flex flex-col items-center gap-1.5 mt-8 sm:mt-10 mb-2 text-center">
        <h1 className="font-serif-nook text-[#E5E5E7] text-xl font-light tracking-[0.18em] leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="font-sans text-[#71717A] text-[0.58rem] tracking-[0.1em] text-center">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
