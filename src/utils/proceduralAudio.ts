/* ─────────────────────────────────────────────────────────────
   proceduralAudio.ts — Generative Ambient Audio Engine
   Synthesizes Free Core and Atelier Soundscapes procedurally
   via the Web Audio API with zero external media files.
───────────────────────────────────────────────────────────── */

export type TrackTier = 'core' | 'atelier'

export type TrackId =
  | 'rain'
  | 'brown-noise'
  | 'wind'
  | 'forest-dusk'
  | 'campfire'
  | 'midnight-study'
  | 'delta-sleep'
  | 'custom-mixer'

export interface TrackPreset {
  id: TrackId
  tier: TrackTier
  label: string
  subtitle: string
  intent: string
  description: string
}

export const ALL_TRACK_PRESETS: TrackPreset[] = [
  // ── Free Core ──────────────────────────────
  {
    id: 'rain',
    tier: 'core',
    label: 'Heavy Rain',
    subtitle: 'Midnight Rain',
    intent: 'Deep Focus & Solitude',
    description: 'Immersive multi-layered rainfall with gentle resonance.',
  },
  {
    id: 'brown-noise',
    tier: 'core',
    label: 'Brown Noise',
    subtitle: 'Deep Calm',
    intent: 'Overwhelm Relief & Grounding',
    description: 'Warm low-frequency integration filter for mental stillness.',
  },
  {
    id: 'wind',
    tier: 'core',
    label: 'Gentle Wind',
    subtitle: 'Soft Breeze',
    intent: 'De-escalation & Flow',
    description: 'Slow rhythmic air currents sweeping through quiet valleys.',
  },

  // ── Atelier Tier ────────────────────────────
  {
    id: 'forest-dusk',
    tier: 'atelier',
    label: 'Forest Dusk',
    subtitle: 'Night Canopy',
    intent: 'Evening Transition',
    description: 'Gentle nocturnal winds blended with distant cricket chirps.',
  },
  {
    id: 'campfire',
    tier: 'atelier',
    label: 'Campfire Glow',
    subtitle: 'Warm Embers',
    intent: 'Cozy Solitude',
    description: 'Thermal hearth crackles and comforting woodsmoke hum.',
  },
  {
    id: 'midnight-study',
    tier: 'atelier',
    label: 'Midnight Study',
    subtitle: 'Lo-Fi Room Air',
    intent: 'Late Night Flow',
    description: 'Gentle tape noise with warm room acoustics and grounding drone.',
  },
  {
    id: 'delta-sleep',
    tier: 'atelier',
    label: 'Delta Sleep',
    subtitle: '2.5Hz Wave',
    intent: 'Restorative Deep Rest',
    description: 'Binaural delta frequency entrainment combined with deep sub-bass.',
  },
  {
    id: 'custom-mixer',
    tier: 'atelier',
    label: 'Multi-Track Mixer',
    subtitle: 'Custom Blend',
    intent: 'Personalized Soundscape',
    description: 'Harmonize independent faders for Rain, Wind, Fire, and Brown Noise.',
  },
]

export const TRACK_PRESETS = ALL_TRACK_PRESETS.filter(p => p.tier === 'core')

export interface MixerLevels {
  rain: number
  brownNoise: number
  wind: number
  fire: number
}

class ProceduralAudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeNodes: {
    sources: AudioNode[]
    gain: GainNode
    cleanup?: () => void
  } | null = null

  private currentTrack: TrackId = 'brown-noise'
  private isPlaying = false
  private volume = 0.45 // 0.0 to 1.0
  private mixerLevels: MixerLevels = {
    rain: 0.7,
    brownNoise: 0.5,
    wind: 0.4,
    fire: 0.3,
  }

  constructor() {
    try {
      const savedTrack = localStorage.getItem('nook:ambient-track') as TrackId | null
      if (savedTrack && ALL_TRACK_PRESETS.some(p => p.id === savedTrack)) {
        this.currentTrack = savedTrack
      }
      const savedVol = localStorage.getItem('nook:ambient-volume')
      if (savedVol) {
        const parsed = parseFloat(savedVol)
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed
        }
      }
      const savedMixer = localStorage.getItem('nook:mixer-levels')
      if (savedMixer) {
        this.mixerLevels = { ...this.mixerLevels, ...JSON.parse(savedMixer) }
      }
    } catch {
      // fallback
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()

      const master = this.ctx.createGain()
      master.gain.setValueAtTime(this.volume, this.ctx.currentTime)
      master.connect(this.ctx.destination)
      this.masterGain = master
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
  }

  /* ── 1. Brown Noise Generator ──────────────────────────── */
  private createBrownNoise(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let lastOut = 0.0

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = data[i]
      data[i] *= 3.8
    }

    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = buffer
    noiseSource.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(320, ctx.currentTime)
    filter.Q.setValueAtTime(0.8, ctx.currentTime)

    noiseSource.connect(filter)
    filter.connect(destination)
    noiseSource.start(0)

    return {
      sources: [noiseSource, filter],
      cleanup: () => {
        try {
          noiseSource.stop()
        } catch {}
      },
    }
  }

  /* ── 2. Heavy Rain Generator ───────────────────────────── */
  private createRain(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 3
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate)
    const left = buffer.getChannelData(0)
    const right = buffer.getChannelData(1)

    let b0L = 0, b1L = 0, b2L = 0, b3L = 0, b4L = 0, b5L = 0, b6L = 0
    let b0R = 0, b1R = 0, b2R = 0, b3R = 0, b4R = 0, b5R = 0, b6R = 0

    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1
      b0L = 0.99886 * b0L + whiteL * 0.0555179
      b1L = 0.99332 * b1L + whiteL * 0.0750759
      b2L = 0.96900 * b2L + whiteL * 0.1538520
      b3L = 0.86650 * b3L + whiteL * 0.3104856
      b4L = 0.55000 * b4L + whiteL * 0.5329522
      b5L = -0.7616 * b5L - whiteL * 0.0168980
      left[i] = (b0L + b1L + b2L + b3L + b4L + b5L + b6L + whiteL * 0.5362) * 0.11
      b6L = whiteL * 0.115926

      const whiteR = Math.random() * 2 - 1
      b0R = 0.99886 * b0R + whiteR * 0.0555179
      b1R = 0.99332 * b1R + whiteR * 0.0750759
      b2R = 0.96900 * b2R + whiteR * 0.1538520
      b3R = 0.86650 * b3R + whiteR * 0.3104856
      b4R = 0.55000 * b4R + whiteR * 0.5329522
      b5R = -0.7616 * b5R - whiteR * 0.0168980
      right[i] = (b0R + b1R + b2R + b3R + b4R + b5R + b6R + whiteR * 0.5362) * 0.11
      b6R = whiteR * 0.115926
    }

    const rainSource = ctx.createBufferSource()
    rainSource.buffer = buffer
    rainSource.loop = true

    const rainFilter = ctx.createBiquadFilter()
    rainFilter.type = 'lowpass'
    rainFilter.frequency.setValueAtTime(1400, ctx.currentTime)
    rainFilter.Q.setValueAtTime(0.5, ctx.currentTime)

    const hpFilter = ctx.createBiquadFilter()
    hpFilter.type = 'highpass'
    hpFilter.frequency.setValueAtTime(180, ctx.currentTime)

    rainSource.connect(hpFilter)
    hpFilter.connect(rainFilter)
    rainFilter.connect(destination)
    rainSource.start(0)

    return {
      sources: [rainSource, hpFilter, rainFilter],
      cleanup: () => {
        try {
          rainSource.stop()
        } catch {}
      },
    }
  }

  /* ── 3. Gentle Wind Generator ──────────────────────────── */
  private createWind(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 4
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let lastOut = 0.0

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + 0.04 * white) / 1.04
      lastOut = data[i]
      data[i] *= 3.0
    }

    const windSource = ctx.createBufferSource()
    windSource.buffer = buffer
    windSource.loop = true

    const bandpass = ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.setValueAtTime(360, ctx.currentTime)
    bandpass.Q.setValueAtTime(1.8, ctx.currentTime)

    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime)

    const lfoGain = ctx.createGain()
    lfoGain.gain.setValueAtTime(180, ctx.currentTime)

    lfo.connect(lfoGain)
    lfoGain.connect(bandpass.frequency)

    windSource.connect(bandpass)
    bandpass.connect(destination)

    windSource.start(0)
    lfo.start(0)

    return {
      sources: [windSource, bandpass, lfo, lfoGain],
      cleanup: () => {
        try {
          windSource.stop()
          lfo.stop()
        } catch {}
      },
    }
  }

  /* ── 4. Forest Dusk Generator (Atelier) ────────────────── */
  private createForestDusk(ctx: AudioContext, destination: AudioNode) {
    const wind = this.createWind(ctx, destination)

    // Soft high-frequency insect chirps (subtle bandpassed pulses)
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(4600, ctx.currentTime)

    const chirpFilter = ctx.createBiquadFilter()
    chirpFilter.type = 'bandpass'
    chirpFilter.frequency.setValueAtTime(4600, ctx.currentTime)
    chirpFilter.Q.setValueAtTime(8, ctx.currentTime)

    const chirpGain = ctx.createGain()
    chirpGain.gain.setValueAtTime(0.015, ctx.currentTime)

    const chirpLFO = ctx.createOscillator()
    chirpLFO.type = 'triangle'
    chirpLFO.frequency.setValueAtTime(6.0, ctx.currentTime) // cricket pulse rate

    const chirpMod = ctx.createGain()
    chirpMod.gain.setValueAtTime(0.015, ctx.currentTime)

    chirpLFO.connect(chirpMod)
    chirpMod.connect(chirpGain.gain)

    osc.connect(chirpFilter)
    chirpFilter.connect(chirpGain)
    chirpGain.connect(destination)

    osc.start(0)
    chirpLFO.start(0)

    return {
      sources: [...wind.sources, osc, chirpFilter, chirpGain, chirpLFO, chirpMod],
      cleanup: () => {
        wind.cleanup()
        try {
          osc.stop()
          chirpLFO.stop()
        } catch {}
      },
    }
  }

  /* ── 5. Campfire Glow Generator (Atelier) ──────────────── */
  private createCampfire(ctx: AudioContext, destination: AudioNode) {
    const brown = this.createBrownNoise(ctx, destination)

    // Irregular crackle noise
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      // Sparse impulse sparks
      if (Math.random() < 0.003) {
        data[i] = (Math.random() * 2 - 1) * 0.9
      } else {
        data[i] = 0
      }
    }

    const crackleSource = ctx.createBufferSource()
    crackleSource.buffer = buffer
    crackleSource.loop = true

    const crackleFilter = ctx.createBiquadFilter()
    crackleFilter.type = 'bandpass'
    crackleFilter.frequency.setValueAtTime(1200, ctx.currentTime)
    crackleFilter.Q.setValueAtTime(2.0, ctx.currentTime)

    const crackleGain = ctx.createGain()
    crackleGain.gain.setValueAtTime(0.18, ctx.currentTime)

    crackleSource.connect(crackleFilter)
    crackleFilter.connect(crackleGain)
    crackleGain.connect(destination)

    crackleSource.start(0)

    return {
      sources: [...brown.sources, crackleSource, crackleFilter, crackleGain],
      cleanup: () => {
        brown.cleanup()
        try {
          crackleSource.stop()
        } catch {}
      },
    }
  }

  /* ── 6. Midnight Study Generator (Atelier) ─────────────── */
  private createMidnightStudy(ctx: AudioContext, destination: AudioNode) {
    const rain = this.createRain(ctx, destination)

    // Warm tape drone (low octave sine pads)
    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(110, ctx.currentTime)

    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(220, ctx.currentTime)

    const droneGain = ctx.createGain()
    droneGain.gain.setValueAtTime(0.04, ctx.currentTime)

    osc1.connect(droneGain)
    osc2.connect(droneGain)
    droneGain.connect(destination)

    osc1.start(0)
    osc2.start(0)

    return {
      sources: [...rain.sources, osc1, osc2, droneGain],
      cleanup: () => {
        rain.cleanup()
        try {
          osc1.stop()
          osc2.stop()
        } catch {}
      },
    }
  }

  /* ── 7. Delta Sleep Generator (Atelier) ────────────────── */
  private createDeltaSleep(ctx: AudioContext, destination: AudioNode) {
    const brown = this.createBrownNoise(ctx, destination)

    // Binaural beat: Left 108Hz, Right 110.5Hz -> 2.5Hz Delta beat
    const merger = ctx.createChannelMerger(2)

    const oscL = ctx.createOscillator()
    oscL.type = 'sine'
    oscL.frequency.setValueAtTime(108.0, ctx.currentTime)

    const oscR = ctx.createOscillator()
    oscR.type = 'sine'
    oscR.frequency.setValueAtTime(110.5, ctx.currentTime)

    const binauralGain = ctx.createGain()
    binauralGain.gain.setValueAtTime(0.06, ctx.currentTime)

    oscL.connect(merger, 0, 0)
    oscR.connect(merger, 0, 1)
    merger.connect(binauralGain)
    binauralGain.connect(destination)

    oscL.start(0)
    oscR.start(0)

    return {
      sources: [...brown.sources, oscL, oscR, merger, binauralGain],
      cleanup: () => {
        brown.cleanup()
        try {
          oscL.stop()
          oscR.stop()
        } catch {}
      },
    }
  }

  /* ── 8. Custom Multi-Track Mixer (Atelier) ─────────────── */
  private createCustomMixer(ctx: AudioContext, destination: AudioNode) {
    const rainGain = ctx.createGain()
    rainGain.gain.setValueAtTime(this.mixerLevels.rain, ctx.currentTime)
    const rain = this.createRain(ctx, rainGain)
    rainGain.connect(destination)

    const brownGain = ctx.createGain()
    brownGain.gain.setValueAtTime(this.mixerLevels.brownNoise, ctx.currentTime)
    const brown = this.createBrownNoise(ctx, brownGain)
    brownGain.connect(destination)

    const windGain = ctx.createGain()
    windGain.gain.setValueAtTime(this.mixerLevels.wind, ctx.currentTime)
    const wind = this.createWind(ctx, windGain)
    windGain.connect(destination)

    const campfireGain = ctx.createGain()
    campfireGain.gain.setValueAtTime(this.mixerLevels.fire, ctx.currentTime)
    const campfire = this.createCampfire(ctx, campfireGain)
    campfireGain.connect(destination)

    return {
      sources: [
        ...rain.sources,
        ...brown.sources,
        ...wind.sources,
        ...campfire.sources,
        rainGain,
        brownGain,
        windGain,
        campfireGain,
      ],
      cleanup: () => {
        rain.cleanup()
        brown.cleanup()
        wind.cleanup()
        campfire.cleanup()
      },
    }
  }

  /* ── Build Track Subgraph ──────────────────────────────── */
  private buildTrackGraph(ctx: AudioContext, track: TrackId, targetGain: GainNode) {
    switch (track) {
      case 'rain':
        return this.createRain(ctx, targetGain)
      case 'wind':
        return this.createWind(ctx, targetGain)
      case 'forest-dusk':
        return this.createForestDusk(ctx, targetGain)
      case 'campfire':
        return this.createCampfire(ctx, targetGain)
      case 'midnight-study':
        return this.createMidnightStudy(ctx, targetGain)
      case 'delta-sleep':
        return this.createDeltaSleep(ctx, targetGain)
      case 'custom-mixer':
        return this.createCustomMixer(ctx, targetGain)
      case 'brown-noise':
      default:
        return this.createBrownNoise(ctx, targetGain)
    }
  }

  /* ── Playback Controls ─────────────────────────────────── */
  public async play(track?: TrackId, fadeDuration = 1.6) {
    this.initContext()
    if (!this.ctx || !this.masterGain) return

    const selectedTrack = track || this.currentTrack
    this.currentTrack = selectedTrack

    try {
      localStorage.setItem('nook:ambient-track', selectedTrack)
    } catch {}

    const now = this.ctx.currentTime

    if (this.activeNodes) {
      const oldGain = this.activeNodes.gain
      const oldCleanup = this.activeNodes.cleanup
      const oldSources = this.activeNodes.sources

      oldGain.gain.cancelScheduledValues(now)
      oldGain.gain.setValueAtTime(oldGain.gain.value, now)
      oldGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.6)

      setTimeout(() => {
        oldCleanup?.()
        oldSources.forEach(s => s.disconnect())
        oldGain.disconnect()
      }, 700)
    }

    const trackGain = this.ctx.createGain()
    trackGain.gain.setValueAtTime(0.0001, now)
    trackGain.gain.exponentialRampToValueAtTime(1.0, now + fadeDuration)
    trackGain.connect(this.masterGain)

    const graph = this.buildTrackGraph(this.ctx, selectedTrack, trackGain)

    this.activeNodes = {
      sources: graph.sources,
      gain: trackGain,
      cleanup: graph.cleanup,
    }

    this.isPlaying = true
  }

  public stop(fadeDuration = 1.2) {
    if (!this.isPlaying || !this.ctx || !this.activeNodes) {
      this.isPlaying = false
      return
    }

    const now = this.ctx.currentTime
    const node = this.activeNodes
    node.gain.gain.cancelScheduledValues(now)
    node.gain.gain.setValueAtTime(node.gain.gain.value, now)
    node.gain.gain.exponentialRampToValueAtTime(0.00001, now + fadeDuration)

    setTimeout(() => {
      node.cleanup?.()
      node.sources.forEach(s => s.disconnect())
      node.gain.disconnect()
    }, fadeDuration * 1000 + 100)

    this.activeNodes = null
    this.isPlaying = false
  }

  public setTrack(track: TrackId) {
    if (this.currentTrack === track && this.isPlaying) return
    this.currentTrack = track
    try {
      localStorage.setItem('nook:ambient-track', track)
    } catch {}

    if (this.isPlaying) {
      this.play(track, 1.2)
    }
  }

  public setVolume(vol: number) {
    const clamped = Math.min(Math.max(vol, 0), 1)
    this.volume = clamped
    try {
      localStorage.setItem('nook:ambient-volume', clamped.toString())
    } catch {}

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime
      this.masterGain.gain.cancelScheduledValues(now)
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now)
      this.masterGain.gain.linearRampToValueAtTime(clamped, now + 0.05)
    }
  }

  public setMixerLevels(levels: Partial<MixerLevels>) {
    this.mixerLevels = { ...this.mixerLevels, ...levels }
    try {
      localStorage.setItem('nook:mixer-levels', JSON.stringify(this.mixerLevels))
    } catch {}

    if (this.currentTrack === 'custom-mixer' && this.isPlaying) {
      this.play('custom-mixer', 0.5)
    }
  }

  public getMixerLevels(): MixerLevels {
    return this.mixerLevels
  }

  public toggle(track?: TrackId) {
    if (this.isPlaying) {
      this.stop()
    } else {
      this.play(track || this.currentTrack)
    }
    return this.isPlaying
  }

  public getIsPlaying(): boolean {
    return this.isPlaying
  }

  public getCurrentTrack(): TrackId {
    return this.currentTrack
  }

  public getVolume(): number {
    return this.volume
  }
}

export const proceduralAudio = new ProceduralAudioEngine()
