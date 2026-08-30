import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  proceduralAudio,
  type TrackId,
  ALL_TRACK_PRESETS,
  type TrackPreset,
  type MixerLevels,
} from '../utils/proceduralAudio'
import { isSanctuaryUnlocked, setSanctuaryUnlocked } from '../utils/storage'

interface AudioContextValue {
  isAudioPlaying: boolean
  activeTrack: TrackId
  volume: number
  isQuickSheetOpen: boolean
  isPaywallOpen: boolean
  isUnlocked: boolean
  presets: TrackPreset[]
  allPresets: TrackPreset[]
  mixerLevels: MixerLevels
  toggleAudio: () => void
  playTrack: (track?: TrackId) => void
  stopAudio: () => void
  setTrack: (track: TrackId) => void
  setVolume: (vol: number) => void
  setMixerLevels: (levels: Partial<MixerLevels>) => void
  openQuickSheet: () => void
  closeQuickSheet: () => void
  toggleQuickSheet: () => void
  openPaywall: () => void
  closePaywall: () => void
  unlockSanctuaryKey: () => void
  lockSanctuaryKey: () => void
}

const AudioContext = createContext<AudioContextValue | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(() =>
    proceduralAudio.getIsPlaying()
  )
  const [activeTrack, setActiveTrack] = useState<TrackId>(() =>
    proceduralAudio.getCurrentTrack()
  )
  const [volume, setVolumeState] = useState<number>(() =>
    proceduralAudio.getVolume()
  )
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() =>
    isSanctuaryUnlocked()
  )
  const [isQuickSheetOpen, setIsQuickSheetOpen] = useState<boolean>(false)
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false)
  const [mixerLevels, setMixerLevelsState] = useState<MixerLevels>(() =>
    proceduralAudio.getMixerLevels()
  )

  const openPaywall = useCallback(() => {
    setIsPaywallOpen(true)
  }, [])

  const closePaywall = useCallback(() => {
    setIsPaywallOpen(false)
  }, [])

  const unlockSanctuaryKey = useCallback(() => {
    setSanctuaryUnlocked(true)
    setIsUnlocked(true)
    closePaywall()
  }, [closePaywall])

  const lockSanctuaryKey = useCallback(() => {
    setSanctuaryUnlocked(false)
    setIsUnlocked(false)
    if (activeTrack !== 'rain' && activeTrack !== 'brown-noise' && activeTrack !== 'wind') {
      proceduralAudio.setTrack('brown-noise')
      setActiveTrack('brown-noise')
    }
  }, [activeTrack])

  // Play a track with tier permission check
  const playTrack = useCallback(
    (track?: TrackId) => {
      const target = track || activeTrack
      const preset = ALL_TRACK_PRESETS.find(p => p.id === target)

      if (preset?.tier === 'atelier' && !isSanctuaryUnlocked()) {
        openPaywall()
        return
      }

      proceduralAudio.play(target)
      setIsAudioPlaying(true)
      setActiveTrack(target)
    },
    [activeTrack, openPaywall]
  )

  const stopAudio = useCallback(() => {
    proceduralAudio.stop()
    setIsAudioPlaying(false)
  }, [])

  const toggleAudio = useCallback(() => {
    if (proceduralAudio.getIsPlaying()) {
      proceduralAudio.stop()
      setIsAudioPlaying(false)
    } else {
      playTrack(activeTrack)
    }
  }, [activeTrack, playTrack])

  const setTrack = useCallback(
    (track: TrackId) => {
      const preset = ALL_TRACK_PRESETS.find(p => p.id === track)

      if (preset?.tier === 'atelier' && !isSanctuaryUnlocked()) {
        openPaywall()
        return
      }

      setActiveTrack(track)
      proceduralAudio.setTrack(track)
      if (proceduralAudio.getIsPlaying()) {
        setIsAudioPlaying(true)
      }
    },
    [openPaywall]
  )

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol)
    proceduralAudio.setVolume(vol)
  }, [])

  const setMixerLevels = useCallback((levels: Partial<MixerLevels>) => {
    proceduralAudio.setMixerLevels(levels)
    setMixerLevelsState(proceduralAudio.getMixerLevels())
  }, [])

  const openQuickSheet = useCallback(() => {
    setIsQuickSheetOpen(true)
  }, [])

  const closeQuickSheet = useCallback(() => {
    setIsQuickSheetOpen(false)
  }, [])

  const toggleQuickSheet = useCallback(() => {
    setIsQuickSheetOpen(prev => !prev)
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsAudioPlaying(proceduralAudio.getIsPlaying())
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <AudioContext.Provider
      value={{
        isAudioPlaying,
        activeTrack,
        volume,
        isQuickSheetOpen,
        isPaywallOpen,
        isUnlocked,
        presets: ALL_TRACK_PRESETS.filter(p => p.tier === 'core'),
        allPresets: ALL_TRACK_PRESETS,
        mixerLevels,
        toggleAudio,
        playTrack,
        stopAudio,
        setTrack,
        setVolume,
        setMixerLevels,
        openQuickSheet,
        closeQuickSheet,
        toggleQuickSheet,
        openPaywall,
        closePaywall,
        unlockSanctuaryKey,
        lockSanctuaryKey,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}
