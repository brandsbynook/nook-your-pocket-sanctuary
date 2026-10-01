import { useAudio } from '../context/AudioContext'

export default function HeaderAudioShortcut() {
  const { isAudioPlaying, toggleQuickSheet } = useAudio()

  return (
    <button
      id="header-audio-shortcut"
      onClick={toggleQuickSheet}
      aria-label={isAudioPlaying ? 'Ambient sound active — open sound player' : 'Open ambient sound sanctuary'}
      title={isAudioPlaying ? 'Ambient audio playing (tap to open)' : 'Ambient sound (tap to open)'}
      className={`
        relative p-2 rounded-full transition-all duration-400 focus:outline-none flex items-center justify-center
        ${isAudioPlaying
          ? 'text-[#E5E5E7] opacity-100 bg-[#141416] border border-[#222225] shadow-sm'
          : 'text-[#52525B] opacity-40 hover:opacity-100 hover:text-[#E5E5E7] hover:bg-[#141416] border border-transparent'
        }
      `}
    >
      {/* Soundwave / Headphones Glyph */}
      <div className={`flex items-center justify-center ${isAudioPlaying ? 'animate-glyph-breath' : ''}`}>
        {isAudioPlaying ? (
          // Playing animated ambient waves
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 11v2" />
            <path d="M7 8v8" />
            <path d="M11 5v14" />
            <path d="M15 9v6" />
            <path d="M19 7v10" />
            <path d="M22 11v2" />
          </svg>
        ) : (
          // Subtle resting headphones/waves glyph
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          </svg>
        )}
      </div>

      {/* Tiny pulsing ambient indicator when active */}
      {isAudioPlaying && (
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#E5E5E7] animate-pulse" />
      )}
    </button>
  )
}
