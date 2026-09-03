import { useState, useEffect } from 'react'
import { useAudio } from '../context/AudioContext'
import {
  getDefaultOfferingPackage,
  purchasePatronPackage,
  type Package,
} from '../services/revenuecat'

export default function SanctuaryKeyModal() {
  const { isPaywallOpen, isUnlocked, closePaywall, unlockSanctuaryKey, lockSanctuaryKey } = useAudio()
  const [rcPackage, setRcPackage] = useState<Package | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isPaywallOpen) {
      setIsSuccess(false)
      setErrorMessage(null)
      // Attempt to load package details from default offering
      getDefaultOfferingPackage().then(pkg => {
        if (pkg) setRcPackage(pkg)
      }).catch(() => {})
    }
  }, [isPaywallOpen])

  if (!isPaywallOpen) return null

  const displayPrice = rcPackage?.rcBillingProduct?.currentPrice?.formattedPrice || '$4.99'

  async function handlePurchase() {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await purchasePatronPackage(rcPackage)

      if (result.success) {
        setIsSuccess(true)
        unlockSanctuaryKey()
        setTimeout(() => {
          closePaywall()
        }, 2200)
      } else if (result.cancelled) {
        // User closed or cancelled checkout
        setIsLoading(false)
      } else {
        // Handle checkout error or fall back to simulation if unconfigured
        const errorText = result.error instanceof Error ? result.error.message : 'Checkout unavailable'
        setErrorMessage(errorText)
        setIsLoading(false)
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Transaction could not be completed')
      setIsLoading(false)
    } finally {
      setIsLoading(false)
    }
  }

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
          bg-[#141416] border-t border-x border-[#222225]
          rounded-t-3xl px-6 pt-6 pb-8
          shadow-2xl animate-lift-in select-none text-[#E5E5E7]
        "
        onClick={e => e.stopPropagation()}
      >
        {/* ── Top Drag Handle ───────────────────────────────── */}
        <div className="w-10 h-1 bg-[#222225] rounded-full mx-auto mb-5" />

        {/* ── Patron Emblem ─────────────────────────────────── */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-[#18181C] border border-[#222225] flex items-center justify-center text-[#E5E5E7] mb-3 shadow-lg">
            <span className="text-lg">✦</span>
          </div>

          <h2 className="font-serif-nook text-2xl font-light tracking-wide text-[#E5E5E7] mb-1">
            Become a Patron of nook
          </h2>

          <p className="font-sans text-[0.68rem] tracking-[0.14em] uppercase text-[#A1A1AA] mb-2 font-medium">
            Unlock the full soundscape archive.
          </p>

          <p className="font-serif-nook text-[#71717A] text-xs sm:text-sm font-light italic leading-relaxed max-w-[320px]">
            “A quiet, one-time contribution helps to sustain nook and the independent craft.”
          </p>
        </div>

        {/* ── Confirmation Message Post-Purchase ─────────────── */}
        {isSuccess ? (
          <div className="bg-[#18181C] border border-[#3F3F46] rounded-2xl p-5 mb-6 text-center animate-fade-in">
            <span className="text-[#E5E5E7] text-xl block mb-2">✦</span>
            <p className="font-serif-nook text-base text-[#E5E5E7] font-light italic leading-relaxed">
              Thank you for supporting nook. The sanctuary archive is unlocked.
            </p>
          </div>
        ) : (
          /* ── Included Patron Atelier Features ───────────────── */
          <div className="bg-[#18181C] border border-[#222225] rounded-2xl p-4 mb-5 flex flex-col gap-2.5">
            <div className="flex items-start gap-2.5 text-xs text-[#E5E5E7]">
              <span className="text-[#E5E5E7] leading-none">✦</span>
              <span>Complete Soundscape Archive (Forest Dusk, Campfire, Delta Sleep, Midnight Study)</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-[#E5E5E7]">
              <span className="text-[#E5E5E7] leading-none">✦</span>
              <span>Custom Multi-Track Mixer with independent layer volume faders</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-[#E5E5E7]">
              <span className="text-[#E5E5E7] leading-none">✦</span>
              <span>Unlimited Anchor Deadlines & Atelier Writing Fonts</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-[#E5E5E7]">
              <span className="text-[#E5E5E7] leading-none">✦</span>
              <span>Lifetime Ownership · Pay once, own forever with zero recurring fees</span>
            </div>
          </div>
        )}

        {/* ── Error Notification (if any) ───────────────────── */}
        {errorMessage && !isSuccess && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-red-950/40 border border-red-900/50 text-red-200 text-xs text-center font-sans">
            <p>{errorMessage}</p>
          </div>
        )}

        {/* ── Action Buttons ────────────────────────────────── */}
        <div className="flex flex-col gap-2.5">
          {!isSuccess && (
            <button
              id="unlock-sanctuary-btn"
              onClick={handlePurchase}
              disabled={isLoading}
              className="
                w-full py-3.5 rounded-xl border border-[#222225]
                font-serif-nook text-[#E5E5E7] text-[1.05rem] font-normal tracking-wide
                bg-[#141416] hover:bg-[#1E1E22] hover:border-[#3F3F46]
                transition-all duration-300 focus:outline-none flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
              "
            >
              {isLoading ? (
                <span className="flex items-center gap-2 font-sans text-xs tracking-wider uppercase text-[#A1A1AA]">
                  <span className="w-2 h-2 rounded-full bg-[#E5E5E7] animate-ping" />
                  Connecting to Atelier...
                </span>
              ) : (
                <span>Become a Patron · {displayPrice}</span>
              )}
            </button>
          )}

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
              className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] hover:text-[#E5E5E7] transition-colors focus:outline-none cursor-pointer"
            >
              {isUnlocked ? '✦ Re-lock Key (Test Mode)' : '✦ Simulate Instant Unlock (Dev Test)'}
            </button>

            <button
              id="sanctuary-key-close-btn"
              onClick={closePaywall}
              className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#52525B] hover:text-[#71717A] transition-colors focus:outline-none cursor-pointer"
            >
              Perhaps later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
