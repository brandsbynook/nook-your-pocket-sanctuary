/* ─────────────────────────────────────────────────────────────
   crumpleSound.ts — Cathartic Paper Crumple & Whoosh Audio
   Uses Web Audio API to synthesize a tactile paper crunch & release
───────────────────────────────────────────────────────────── */

import { triggerHaptic } from './haptics'

export function playPaperCrumpleSound(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime
    const duration = 0.55

    // 1. Noise buffer with textured micro-envelope for paper crunch
    const bufferSize = Math.floor(ctx.sampleRate * duration)
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate
      const modulation = 0.65 + 0.35 * Math.sin(t * 90) * Math.sin(t * 210)
      output[i] = (Math.random() * 2 - 1) * modulation
    }

    const whiteNoise = ctx.createBufferSource()
    whiteNoise.buffer = noiseBuffer

    // 2. Dynamic Bandpass filter sweep (crisp paper crunch shifting to deep release whoosh)
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2400, now)
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.25)
    filter.frequency.exponentialRampToValueAtTime(420, now + duration)
    filter.Q.setValueAtTime(2.8, now)

    // 3. Multi-stage gain envelope (initial crush -> compression -> release)
    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(0.001, now)
    gainNode.gain.linearRampToValueAtTime(0.38, now + 0.03) // Initial crisp crunch
    gainNode.gain.linearRampToValueAtTime(0.14, now + 0.08)
    gainNode.gain.linearRampToValueAtTime(0.42, now + 0.16) // Ball compression
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.25)
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.35) // Throw whoosh
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    whiteNoise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    whiteNoise.start(now)
    whiteNoise.stop(now + duration)

    // Haptic feedback pulse if supported
    triggerHaptic([40, 30, 60])
  } catch {
    // Graceful fallback
  }
}
