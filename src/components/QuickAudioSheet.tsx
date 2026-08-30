import { useAudio } from '../context/AudioContext'
import { type TrackId } from '../utils/proceduralAudio'

interface QuickAudioSheetProps {
  onNavigateSoundSanctuary?: () => void
}

export default function QuickAudioSheet({
  onNavigateSoundSanctuary,
}: QuickAudioSheetProps) {
  const {
    isAudioPlaying,
    activeTrack,
    volume,
    isQuickSheetOpen,
    presets,
    toggleAudio,
    setTrack,
    setVolume,
    closeQuickSheet,
  } = useAudio()

  if (!isQuickSheetOpen) return null

  const currentPreset = presets.find(p => p.id === activeTrack) || presets[0]

  function handleNavigate() {
    closeQuickSheet()
    onNavigateSoundSanctuary?.()
  }

  return (
    <div
      id="quick-audio-sheet-backdrop"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/65 backdrop-blur-sm animate-fade-in"
      onClick={closeQuickSheet}
    >
      <div
        id="quick-audio-sheet"
        className="
          w-full max-w-[440px] mx-auto
          bg-[#121216] border-t border-x border-[#22222A]
          rounded-t-2xl px-6 pt-5 pb-8
          shadow-2xl animate-lift-in select-none
        "
        onClick={e => e.stopPropagation()}
      >
        {/* ── Top Handle & Header ───────────────────────────── */}
        <div className="w-10 h-1 bg-[#262630] rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1A1A22] border border-[#2A2A34] flex items-center justify-center text-[#F4F0EA]">
              {isAudioPlaying ? (
                <span className="w-2 h-2 rounded-full bg-[#C9B99A] animate-pulse" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
              )}
            </div>

            <div className="flex flex-col">
              <span className="font-serif-nook text-[#FFFFFF] text-base font-light tracking-wide leading-none">
                {currentPreset.subtitle}
              </span>
              <span className="font-sans text-[0.55rem] tracking-[0.16em] uppercase text-[#71717A] mt-1">
                {isAudioPlaying ? 'Ambient soundscape active' : 'Quiet presence'}
              </span>
            </div>
          </div>

          {/* Quick Play/Pause & Close */}
          <div className="flex items-center gap-2">
            <button
              id="sheet-play-pause-btn"
              onClick={toggleAudio}
              className={`
                px-3.5 py-1.5 rounded-full border text-[0.62rem] font-sans tracking-[0.14em] uppercase
                transition-all duration-300 focus:outline-none flex items-center gap-1.5
                ${isAudioPlaying
                  ? 'border-[#C9B99A]/50 bg-[#1E1C1A] text-[#E5E0D8]'
                  : 'border-[#2E2E3C] bg-[#181820] text-[#A1A1AA] hover:text-white'
                }
              `}
            >
              {isAudioPlaying ? (
                <>
                  <span className="w-1.5 h-1.5 bg-[#C9B99A] rounded-full" />
                  Pause
                </>
              ) : (
                <>
                  <span className="text-[0.7rem] leading-none">▶</span>
                  Play
                </>
              )}
            </button>

            <button
              id="sheet-close-btn"
              onClick={closeQuickSheet}
              aria-label="Close sound sheet"
              className="p-1.5 text-[#52525B] hover:text-[#A1A1AA] rounded-full transition-colors focus:outline-none"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Preset Pills (3 Presets: Heavy Rain, Brown Noise, Gentle Wind) ── */}
        <div className="mb-5">
          <span className="font-sans text-[0.56rem] tracking-[0.18em] uppercase text-[#71717A] block mb-2">
            Soundscape Presets
          </span>

          <div className="grid grid-cols-3 gap-2">
            {presets.map(preset => {
              const isSelected = activeTrack === preset.id
              return (
                <button
                  key={preset.id}
                  id={`preset-${preset.id}`}
                  onClick={() => setTrack(preset.id as TrackId)}
                  className={`
                    py-2.5 px-2 rounded-xl border text-center transition-all duration-300 focus:outline-none
                    ${isSelected
                      ? 'border-[#FFFFFF]/40 bg-[#1C1C24] text-[#FFFFFF] shadow-sm'
                      : 'border-[#1E1E26] bg-[#141418] text-[#71717A] hover:border-[#2E2E3A] hover:text-[#A1A1AA]'
                    }
                  `}
                >
                  <div className="font-serif-nook text-sm font-light leading-snug">{preset.label}</div>
                  <div className="font-sans text-[0.52rem] tracking-wider text-[#52525B] mt-0.5">{preset.subtitle}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Master Volume Slider ─────────────────────────── */}
        <div className="mb-6 bg-[#16161C] border border-[#22222C] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-sans text-[0.56rem] tracking-[0.16em] uppercase text-[#71717A]">
              Master Volume
            </span>
            <span className="font-sans text-[0.62rem] text-[#A1A1AA] tabular-nums">
              {Math.round(volume * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            </svg>

            <input
              id="quick-audio-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="
                w-full h-1.5 bg-[#262632] rounded-lg appearance-none cursor-pointer
                accent-[#F4F0EA] focus:outline-none
              "
            />

            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </div>
        </div>

        {/* ── Link to Full Sound Sanctuary ────────────────── */}
        <button
          id="explore-sound-sanctuary-btn"
          onClick={handleNavigate}
          className="
            w-full py-2.5 border border-[#2E2E3A] rounded-xl
            font-serif-nook text-[#E5E0D8] text-[0.95rem] font-light
            hover:border-[#C9B99A]/50 hover:bg-[#1A1A22] hover:text-[#C9B99A]
            transition-all duration-300 focus:outline-none flex items-center justify-center gap-2
          "
        >
          <span>Explore Sound Sanctuary</span>
          <span className="text-xs">→</span>
        </button>
      </div>
    </div>
  )
}
