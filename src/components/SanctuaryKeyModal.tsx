import { useAudio } from '../context/AudioContext'

export default function SanctuaryKeyModal() {
  const { isPaywallOpen, isUnlocked, closePaywall, unlockSanctuaryKey, lockSanctuaryKey } = useAudio()

  if (!isPaywallOpen) return null

  return (
    <div
      id="sanctuary-key-backdrop"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={closePaywall}
    >
      <div
        id="sanctuary-key-modal"
        className="
          w-full max-w-[440px] mx-auto
          bg-[#121216] border-t border-x border-[#2A2A36]
          rounded-t-3xl px-6 pt-6 pb-8
          shadow-2xl animate-lift-in select-none text-[#E5E0D8]
        "
        onClick={e => e.stopPropagation()}
      >
        {/* ── Top Drag Handle ───────────────────────────────── */}
        <div className="w-10 h-1 bg-[#2C2C38] rounded-full mx-auto mb-5" />

        {/* ── Key Glyph Emblem ──────────────────────────────── */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-[#1C1A16] border border-[#C9B99A]/40 flex items-center justify-center text-[#C9B99A] mb-3 shadow-lg shadow-[#C9B99A]/5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-1.5 1.5L14 9a5.5 5.5 0 1 0 3 3l3.5-3.5-2-2 1.5-1.5z" />
              <circle cx="7.5" cy="16.5" r="1.5" />
            </svg>
          </div>

          <h2 className="font-serif-nook text-2xl font-light tracking-wide text-[#FFFFFF] mb-1.5">
            The Sanctuary Key
          </h2>

          <p className="font-serif-nook text-[#A1A1AA] text-sm font-light italic leading-relaxed max-w-[320px]">
            Unlock the full generative sound library, multi-track mixer, and all future visual canvases forever. Pay once, own for life. Zero subscriptions.
          </p>
        </div>

        {/* ── Included Atelier Features ─────────────────────── */}
        <div className="bg-[#16161E] border border-[#22222E] rounded-2xl p-4 mb-6 flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5 text-xs text-neutral-300">
            <span className="text-[#C9B99A] leading-none">✦</span>
            <span>Generative Sound Sanctuary (Forest Dusk, Campfire, Delta Sleep, Midnight Study)</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-neutral-300">
            <span className="text-[#C9B99A] leading-none">✦</span>
            <span>Custom Multi-Track Mixer with independent layer volume faders</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-neutral-300">
            <span className="text-[#C9B99A] leading-none">✦</span>
            <span>Unlimited Anchor Deadlines & Atelier Writing Fonts (Warm Mono & Script)</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-neutral-300">
            <span className="text-[#C9B99A] leading-none">✦</span>
            <span>Lifetime Ownership · Pay once, own forever with zero recurring subscriptions</span>
          </div>
        </div>

        {/* ── Action Buttons ────────────────────────────────── */}
        <div className="flex flex-col gap-2.5">
          <button
            id="unlock-sanctuary-btn"
            onClick={unlockSanctuaryKey}
            className="
              w-full py-3.5 rounded-xl border border-[#C9B99A]/60
              font-serif-nook text-[#FFFFFF] text-[1.05rem] font-normal tracking-wide
              bg-gradient-to-r from-[#2A241C] via-[#383024] to-[#2A241C]
              hover:border-[#C9B99A] hover:shadow-lg hover:shadow-[#C9B99A]/10
              transition-all duration-300 focus:outline-none flex items-center justify-center gap-2
            "
          >
            <span>Unlock Sanctuary · $4.99</span>
          </button>

          {/* Dev / Testing Simulated Unlock toggle */}
          <div className="flex items-center justify-between pt-1 px-1">
            <button
              id="simulate-unlock-toggle-btn"
              onClick={() => {
                if (isUnlocked) {
                  lockSanctuaryKey()
                } else {
                  unlockSanctuaryKey()
                }
              }}
              className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] hover:text-[#C9B99A] transition-colors focus:outline-none"
            >
              {isUnlocked ? '✦ Re-lock Key (Test Mode)' : '✦ Simulate Instant Unlock (Dev Test)'}
            </button>

            <button
              id="sanctuary-key-close-btn"
              onClick={closePaywall}
              className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#52525B] hover:text-[#A1A1AA] transition-colors focus:outline-none"
            >
              Perhaps later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
