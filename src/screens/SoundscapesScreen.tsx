import SoundSanctuary from '../components/tunedown/SoundSanctuary'
import HeaderAudioShortcut from '../components/HeaderAudioShortcut'

interface SoundscapesScreenProps {
  onBack: () => void
}

export default function SoundscapesScreen({ onBack }: SoundscapesScreenProps) {
  return (
    <main
      id="soundscapes-screen"
      className="
        h-[100dvh] w-full
        px-7 sm:px-8 pt-14 sm:pt-16 pb-12 sm:pb-14
        flex flex-col justify-between
        overflow-hidden
        bg-[#0A0A0B]
        animate-fade-in
      "
    >
      <div className="flex flex-col flex-1 min-h-0 max-w-[360px] mx-auto w-full">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between shrink-0 w-full">
          <button
            id="soundscapes-back"
            onClick={onBack}
            className="
              flex items-center gap-1.5
              font-sans text-[#52525B] text-[0.62rem]
              tracking-[0.14em] uppercase
              hover:text-[#E5E5E7] transition-colors
              focus:outline-none py-1 cursor-pointer
            "
          >
            <span className="text-[0.8rem] leading-none">←</span>
            return
          </button>

          <div className="flex items-center justify-end min-w-[60px]">
            <HeaderAudioShortcut />
          </div>
        </div>

        {/* Decoupled Title Block */}
        <div className="flex flex-col items-center gap-1.5 mt-8 sm:mt-10 mb-5 text-center shrink-0">
          <h1 className="font-serif-nook text-[#E5E5E7] text-xl font-light tracking-[0.18em] leading-none">
            Soundscapes
          </h1>
          <p className="font-sans text-[#71717A] text-[0.58rem] tracking-[0.1em] text-center">
            generative ambient layers
          </p>
        </div>

        {/* Sound Sanctuary Component */}
        <SoundSanctuary />
      </div>
    </main>
  )
}
