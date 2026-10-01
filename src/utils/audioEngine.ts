/* ─────────────────────────────────────────────────────────────
   audioEngine.ts — Web Audio API Ambient Brown Noise Generator
   Synthesizes a soft, warm ambient hum with smooth volume ramps
───────────────────────────────────────────────────────────── */

class AmbientAudioEngine {
  private ctx: AudioContext | null = null
  private noiseNode: AudioNode | null = null
  private gainNode: GainNode | null = null
  private filterNode: BiquadFilterNode | null = null
  private isPlaying = false
  private muted = false
  private baseVolume = 0.18

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
    }
  }

  /** Generate continuous brown noise buffer */
  private createBrownNoiseNode(ctx: AudioContext): AudioNode {
    const bufferSize = ctx.sampleRate * 2 // 2-second looped buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let lastOut = 0.0

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      // Brown noise integration filter
      data[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = data[i]
      data[i] *= 3.5 // scale to reasonable amplitude
    }

    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = buffer
    noiseSource.loop = true
    return noiseSource
  }

  public async start(fadeDuration = 2.0) {
    this.init()
    if (!this.ctx) return

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }

    if (this.isPlaying) return

    // Create noise source
    const noise = this.createBrownNoiseNode(this.ctx)
    this.noiseNode = noise

    // Create gentle lowpass filter to remove harshness (warm room / rain tone)
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(320, this.ctx.currentTime)
    filter.Q.setValueAtTime(0.7, this.ctx.currentTime)
    this.filterNode = filter

    // Create gain node for smooth fade
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime)
    const targetGain = this.muted ? 0.0001 : this.baseVolume
    gain.gain.exponentialRampToValueAtTime(targetGain, this.ctx.currentTime + fadeDuration)
    this.gainNode = gain

    // Connect audio graph: noise -> filter -> gain -> destination
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.ctx.destination)

    if ('start' in noise) {
      ;(noise as AudioBufferSourceNode).start(0)
    }

    this.isPlaying = true
  }

  public stop(fadeDuration = 1.5) {
    if (!this.isPlaying || !this.ctx || !this.gainNode) return

    const now = this.ctx.currentTime
    this.gainNode.gain.cancelScheduledValues(now)
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now)
    this.gainNode.gain.exponentialRampToValueAtTime(0.00001, now + fadeDuration)

    setTimeout(() => {
      if (this.noiseNode && 'stop' in this.noiseNode) {
        try {
          ;(this.noiseNode as AudioBufferSourceNode).stop()
        } catch {
          // already stopped
        }
      }
      this.noiseNode?.disconnect()
      this.filterNode?.disconnect()
      this.gainNode?.disconnect()
      this.noiseNode = null
      this.filterNode = null
      this.gainNode = null
      this.isPlaying = false
    }, fadeDuration * 1000 + 100)
  }

  public toggleMute(fadeDuration = 0.4) {
    this.muted = !this.muted
    if (!this.gainNode || !this.ctx) return this.muted

    const now = this.ctx.currentTime
    this.gainNode.gain.cancelScheduledValues(now)
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now)

    if (this.muted) {
      this.gainNode.gain.exponentialRampToValueAtTime(0.00001, now + fadeDuration)
    } else {
      this.gainNode.gain.exponentialRampToValueAtTime(this.baseVolume, now + fadeDuration)
    }
    return this.muted
  }

  public getIsMuted(): boolean {
    return this.muted
  }

  public getIsPlaying(): boolean {
    return this.isPlaying
  }
}

export const ambientAudio = new AmbientAudioEngine()
