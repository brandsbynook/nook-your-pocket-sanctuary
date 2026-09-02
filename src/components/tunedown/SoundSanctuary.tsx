import { useState } from 'react'
import { useAudio } from '../../context/AudioContext'
import { ALL_TRACK_PRESETS, type TrackPreset } from '../../utils/proceduralAudio'

export default function SoundSanctuary() {
  const {
    isAudioPlaying,
    activeTrack,
    volume,
    isUnlocked,
    mixerLevels,
    playTrack,
    stopAudio,
    setTrack,
    setVolume,
    setMixerLevels,
    openPaywall,
  } = useAudio()

  const [showMixerPanel, setShowMixerPanel] = useState<boolean>(false)

  const coreTracks = ALL_TRACK_PRESETS.filter(p => p.tier === 'core')
  const atelierTracks = ALL_TRACK_PRESETS.filter(p => p.tier === 'atelier')

  function handleTrackClick(track: TrackPreset) {
    if (track.tier === 'atelier' && !isUnlocked) {
      openPaywall()
      return
    }

    if (track.id === 'custom-mixer') {
      setShowMixerPanel(true)
    } else {
      setShowMixerPanel(false)
    }

    if (activeTrack === track.id && isAudioPlaying) {
      stopAudio()
    } else {
      setTrack(track.id)
      playTrack(track.id)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-0.5 pb-6 animate-fade-in select-none">
      {/* ── Active Playback Controller Header ────────────────── */}
      <div className="bg-[#141416] border border-[#222225] rounded-2xl p-4 mb-5 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="sound-sanctuary-master-toggle"
            onClick={() => {
              if (isAudioPlaying) {
                stopAudio()
              } else {
                playTrack(activeTrack)
              }
            }}
            className={`
              w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300
              ${isAudioPlaying
                ? 'border-[#3F3F46] bg-[#222225] text-[#E5E5E7] shadow-md'
                : 'border-[#222225] bg-[#0A0A0B] text-[#71717A] hover:text-[#E5E5E7]'
              }
            `}
          >
            {isAudioPlaying ? (
              <span className="w-2.5 h-2.5 bg-[#E5E5E7] rounded-full animate-pulse" />
            ) : (
              <span className="text-xs leading-none ml-0.5">▶</span>
            )}
          </button>

          <div className="flex flex-col">
            <span className="font-serif-nook text-base text-[#E5E5E7] font-light leading-none">
              {ALL_TRACK_PRESETS.find(p => p.id === activeTrack)?.subtitle || 'Ambient Hum'}
            </span>
            <span className="font-sans text-[0.55rem] tracking-[0.16em] uppercase text-[#71717A] mt-1">
              {isAudioPlaying ? 'Now playing in background' : 'Paused · tap to play'}
            </span>
          </div>
        </div>

        {/* Volume quick slider */}
        <div className="flex items-center gap-2 max-w-[100px]">
          <input
            id="sound-sanctuary-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1 bg-[#1F1F23] rounded-lg appearance-none cursor-pointer accent-[#E5E5E7]"
          />
        </div>
      </div>

      {/* ── Section 1: Free Core Soundscapes ─────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="font-sans text-[0.58rem] tracking-[0.2em] uppercase text-[#71717A]">
            Core Sanctuary
          </span>
          <span className="font-sans text-[0.55rem] tracking-[0.12em] uppercase text-[#52525B]">
            Free Forever
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {coreTracks.map(track => {
            const isPlayingThis = isAudioPlaying && activeTrack === track.id
            const isSelected = activeTrack === track.id

            return (
              <button
                key={track.id}
                id={`track-${track.id}`}
                onClick={() => handleTrackClick(track)}
                className={`
                  w-full text-left p-3.5 rounded-xl border transition-all duration-300
                  flex items-center justify-between group focus:outline-none
                  ${isPlayingThis
                    ? 'border-[#3F3F46] bg-[#1A1A1E] text-[#FFFFFF] shadow-sm'
                    : isSelected
                    ? 'border-[#222225] bg-[#141416] text-[#E5E5E7]'
                    : 'border-[#1F1F23] bg-[#0A0A0B] text-[#71717A] hover:border-[#222225] hover:bg-[#141416]'
                  }
                `}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-serif-nook text-base font-light text-[#E5E5E7]">
                      {track.label}
                    </span>
                    <span className="font-sans text-[0.52rem] tracking-wider text-[#71717A]">
                      · {track.intent}
                    </span>
                  </div>
                  <p className="font-sans text-[0.58rem] text-[#71717A] leading-normal line-clamp-1">
                    {track.description}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2 pl-2">
                  {isPlayingThis ? (
                    <span className="flex items-center gap-1 font-sans text-[0.55rem] tracking-[0.12em] uppercase text-[#E5E5E7]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E5E5E7] animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[#52525B] group-hover:text-[#E5E5E7] text-xs">
                      ▶
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Section 2: Atelier Soundscapes ───────────────────── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <span className="font-sans text-[0.58rem] tracking-[0.2em] uppercase text-[#E5E5E7]">
              Atelier Tier
            </span>
            <span className="text-[0.6rem] text-[#E5E5E7]">⚿</span>
          </div>

          {!isUnlocked ? (
            <button
              id="sanctuary-key-unlock-badge"
              onClick={openPaywall}
              className="font-sans text-[0.55rem] tracking-[0.14em] uppercase text-[#E5E5E7] hover:underline focus:outline-none"
            >
              Unlock with Key →
            </button>
          ) : (
            <span className="font-sans text-[0.55rem] tracking-[0.14em] uppercase text-[#E5E5E7]/80">
              ✦ Unlocked
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {atelierTracks.map(track => {
            const isPlayingThis = isAudioPlaying && activeTrack === track.id
            const isSelected = activeTrack === track.id

            return (
              <button
                key={track.id}
                id={`track-${track.id}`}
                onClick={() => handleTrackClick(track)}
                className={`
                  w-full text-left p-3.5 rounded-xl border transition-all duration-300
                  flex items-center justify-between group focus:outline-none
                  ${isPlayingThis
                    ? 'border-[#3F3F46] bg-[#1A1A1E] text-[#FFFFFF] shadow-sm'
                    : isSelected
                    ? 'border-[#222225] bg-[#141416] text-[#E5E5E7]'
                    : 'border-[#1F1F23] bg-[#0A0A0B] text-[#71717A] hover:border-[#222225] hover:bg-[#141416]'
                  }
                `}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-serif-nook text-base font-light text-[#E5E5E7]">
                      {track.label}
                    </span>
                    <span className="font-sans text-[0.52rem] tracking-wider text-[#71717A]">
                      · {track.intent}
                    </span>
                  </div>
                  <p className="font-sans text-[0.58rem] text-[#71717A] leading-normal line-clamp-1">
                    {track.description}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2 pl-2">
                  {!isUnlocked ? (
                    <span className="px-2 py-0.5 rounded border border-[#222225] text-[#E5E5E7] text-[0.62rem] font-sans flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Key
                    </span>
                  ) : isPlayingThis ? (
                    <span className="flex items-center gap-1 font-sans text-[0.55rem] tracking-[0.12em] uppercase text-[#E5E5E7]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E5E5E7] animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[#52525B] group-hover:text-[#E5E5E7] text-xs">
                      ▶
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Multi-Track Mixer Panel (If unlocked and open) ─────── */}
      {(showMixerPanel || (activeTrack === 'custom-mixer' && isUnlocked)) && isUnlocked && (
        <div className="mt-4 bg-[#141416] border border-[#222225] rounded-2xl p-4 animate-lift-in">
          <div className="flex items-center justify-between mb-3">
            <span className="font-serif-nook text-sm text-[#E5E5E7]">Multi-Track Blend</span>
            <span className="font-sans text-[0.55rem] uppercase tracking-wider text-[#E5E5E7]">
              Live Synthesizer
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { id: 'rain', label: 'Rain Wash', key: 'rain' as const },
              { id: 'brown', label: 'Brown Noise', key: 'brownNoise' as const },
              { id: 'wind', label: 'Gentle Breeze', key: 'wind' as const },
              { id: 'fire', label: 'Campfire Crackle', key: 'fire' as const },
            ].map(layer => (
              <div key={layer.id} className="flex items-center justify-between text-xs">
                <span className="font-sans text-[0.58rem] text-[#71717A] w-24">{layer.label}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={mixerLevels[layer.key]}
                  onChange={e => setMixerLevels({ [layer.key]: parseFloat(e.target.value) })}
                  className="w-32 h-1 bg-[#1F1F23] rounded-lg appearance-none cursor-pointer accent-[#E5E5E7]"
                />
                <span className="font-sans text-[0.55rem] text-[#71717A] w-7 text-right tabular-nums">
                  {Math.round(mixerLevels[layer.key] * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
