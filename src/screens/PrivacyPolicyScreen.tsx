import HeaderAudioShortcut from '../components/HeaderAudioShortcut'

interface PrivacyPolicyScreenProps {
  onBack: () => void
}

export default function PrivacyPolicyScreen({ onBack }: PrivacyPolicyScreenProps) {
  return (
    <main
      id="privacy-policy-screen"
      className="
        h-[100dvh] w-full
        px-7 sm:px-8 pt-14 sm:pt-16 pb-10 sm:pb-12
        flex flex-col justify-between
        overflow-hidden
        bg-[#0A0A0B]
        animate-fade-in
      "
    >
      <div className="flex flex-col flex-1 min-h-0 max-w-[400px] mx-auto w-full">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between shrink-0 w-full">
          <button
            id="privacy-back"
            onClick={onBack}
            className="
              flex items-center gap-1.5
              font-sans text-[#52525B] text-[0.62rem]
              tracking-[0.14em] uppercase
              hover:text-[#E5E5E7] transition-colors
              focus:outline-none cursor-pointer
            "
          >
            <span className="text-[0.8rem] leading-none">←</span>
            return
          </button>

          <div className="flex items-center justify-end min-w-[60px]">
            <HeaderAudioShortcut />
          </div>
        </div>

        {/* Decoupled Header Title */}
        <div className="flex flex-col items-center gap-1.5 mt-7 sm:mt-8 mb-5 text-center shrink-0">
          <h1 className="font-serif-nook text-[#E5E5E7] text-2xl sm:text-3xl font-light tracking-[0.16em] leading-none">
            Privacy Policy
          </h1>
          <p className="font-sans text-[#52525B] text-[0.6rem] tracking-[0.2em] uppercase mt-1">
            Effective Date: September 2026
          </p>
        </div>

        {/* Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-5 text-left pb-6">
          {/* Introductory Note */}
          <div className="border border-[#1F1F23] bg-[#141416]/60 p-4.5 rounded-xl">
            <p className="font-serif-nook text-sm sm:text-base text-[#E5E5E7]/90 leading-relaxed font-light italic">
              nook was created as a quiet personal sanctuary. We believe that true emotional rest requires unconditional privacy. We collect zero personal information, require no accounts, and never monetize your attention.
            </p>
          </div>

          {/* Section 1: Offline-First & Local Storage */}
          <div className="space-y-2">
            <h2 className="font-serif-nook text-base text-[#E5E5E7] font-normal tracking-wide">
              1. Offline-First & Local Storage
            </h2>
            <div className="border border-[#1F1F23] bg-[#141416]/30 p-4 rounded-xl">
              <p className="font-sans text-xs text-[#A1A1AA] leading-relaxed tracking-wide font-light">
                All of your journal entries, brain dumps, reflections, sensory preferences, custom cards, deadlines, and companion choices are stored strictly and exclusively on your local device via local browser storage. No personal notes or sanctuary interactions are ever transmitted to external servers, cloud databases, or remote hosts.
              </p>
            </div>
          </div>

          {/* Section 2: No User Tracking or Accounts */}
          <div className="space-y-2">
            <h2 className="font-serif-nook text-base text-[#E5E5E7] font-normal tracking-wide">
              2. Zero Accounts & No Telemetry Tracking
            </h2>
            <div className="border border-[#1F1F23] bg-[#141416]/30 p-4 rounded-xl">
              <p className="font-sans text-xs text-[#A1A1AA] leading-relaxed tracking-wide font-light">
                nook operates with zero account registration. We do not ask for or store names, email addresses, or phone numbers. We do not use third-party analytics SDKs, telemetry trackers, session recorders, or advertising identifiers. Your time spent here remains entirely unmonitored.
              </p>
            </div>
          </div>

          {/* Section 3: In-App Purchases & Sanctuary Key */}
          <div className="space-y-2">
            <h2 className="font-serif-nook text-base text-[#E5E5E7] font-normal tracking-wide">
              3. In-App Purchases & Payments
            </h2>
            <div className="border border-[#1F1F23] bg-[#141416]/30 p-4 rounded-xl">
              <p className="font-sans text-xs text-[#A1A1AA] leading-relaxed tracking-wide font-light">
                Optional sanctuary enhancements (such as the Sanctuary Key) and subscriptions are processed directly through trusted, verified platform providers (including Google Play Billing). nook never receives, processes, or stores your credit card details, banking credentials, or billing addresses.
              </p>
            </div>
          </div>

          {/* Section 4: Data Ownership & Complete Erasure */}
          <div className="space-y-2">
            <h2 className="font-serif-nook text-base text-[#E5E5E7] font-normal tracking-wide">
              4. Data Export & Deletion
            </h2>
            <div className="border border-[#1F1F23] bg-[#141416]/30 p-4 rounded-xl">
              <p className="font-sans text-xs text-[#A1A1AA] leading-relaxed tracking-wide font-light">
                Because your data lives solely on your device, you maintain complete sovereignty over it at all times. You may export a JSON backup of all your records or permanently purge all stored data instantly using the “Reset App” control within Settings.
              </p>
            </div>
          </div>

          {/* Section 5: Contact Information */}
          <div className="space-y-2">
            <h2 className="font-serif-nook text-base text-[#E5E5E7] font-normal tracking-wide">
              5. Contact Us
            </h2>
            <div className="border border-[#1F1F23] bg-[#141416]/30 p-4 rounded-xl space-y-1.5">
              <p className="font-sans text-xs text-[#A1A1AA] leading-relaxed tracking-wide font-light">
                If you have any questions, concerns, or requests regarding this Privacy Policy or your experience within nook, please reach out to:
              </p>
              <p className="font-sans text-xs text-[#E5E5E7] tracking-wider pt-1">
                Nook Studio Co.
              </p>
              <a
                href="mailto:support@nookstudio.co"
                className="font-sans text-xs text-[#71717A] hover:text-[#E5E5E7] underline transition-colors block"
              >
                support@nookstudio.co
              </a>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-2 text-center">
            <p className="font-sans text-[0.62rem] text-[#52525B] tracking-wider">
              nook. — your pocket sanctuary • v1.0.0
            </p>
          </div>
        </div>

        {/* Bottom Return Button */}
        <div className="pt-3 border-t border-[#1F1F23] shrink-0">
          <button
            id="privacy-return-bottom"
            onClick={onBack}
            className="
              w-full py-3
              border border-[#1F1F23] hover:border-[#3F3F46]
              bg-[#141416] hover:bg-[#1A1A1D]
              text-[#E5E5E7] font-sans text-xs tracking-[0.14em] uppercase
              rounded-xl transition-all duration-300
              focus:outline-none cursor-pointer
            "
          >
            Return to Sanctuary
          </button>
        </div>
      </div>
    </main>
  )
}
