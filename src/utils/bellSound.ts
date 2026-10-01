/* ─────────────────────────────────────────────────────────────
   bellSound.ts — Low-Frequency Bell / Singing Bowl Synthesizer
   Uses the Web Audio API to produce a soft, warm, grounding chime
   at session completion. Purely synthetic, zero external assets.
───────────────────────────────────────────────────────────── */

export function playCompletionBell(): void {
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
    const duration = 4.2

    // Master gain node with exponential decay
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.0001, now)
    // Soft attack (prevents popping)
    masterGain.gain.linearRampToValueAtTime(0.28, now + 0.04)
    // Long natural singing bowl resonance decay
    masterGain.gain.exponentialRampToValueAtTime(0.00001, now + duration)

    // Gentle lowpass filter to produce warm, matte, non-piercing bell tones
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(540, now)
    filter.Q.setValueAtTime(1.2, now)

    filter.connect(masterGain)
    masterGain.connect(ctx.destination)

    // Harmonic partials (tuned to a serene low G meditative singing bowl)
    const partials = [
      { freq: 196.0, gain: 1.0 },   // G3 fundamental (deep, grounding)
      { freq: 392.0, gain: 0.35 },  // G4 octave
      { freq: 587.3, gain: 0.12 },  // D5 fifth
      { freq: 830.6, gain: 0.04 },  // G#5 subtle shimmer
    ]

    partials.forEach(({ freq, gain }) => {
      const osc = ctx.createOscillator()
      const oscGain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      // Slight pitch drift downwards like a physical bowl
      osc.frequency.exponentialRampToValueAtTime(freq * 0.998, now + duration)

      oscGain.gain.setValueAtTime(gain, now)
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

      osc.connect(oscGain)
      oscGain.connect(filter)

      osc.start(now)
      osc.stop(now + duration)
    })

    // Clean up AudioContext after decay
    setTimeout(() => {
      ctx.close().catch(() => {})
    }, (duration + 0.6) * 1000)
  } catch (err) {
    console.warn('Silent bell fallback - AudioContext unavailable:', err)
  }
}
