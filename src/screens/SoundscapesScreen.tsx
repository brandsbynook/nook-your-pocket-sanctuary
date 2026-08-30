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
        h-[100dvh] max-w-md mx-auto
        px-6 pt-10 pb-6
        flex flex-col justify-between
        overflow-hidden
        bg-[#0E0E0E]
        animate-fade-in
      "
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 shrink-0">
          <button
            id="soundscapes-back"
            onClick={onBack}
            className="
              flex items-center gap-1.5
              font-sans text-neutral-500 text-[0.62rem]
              tracking-[0.14em] uppercase
              hover:text-neutral-300 transition-colors
              focus:outline-none py-1
            "
          >
            <span className="text-[0.8rem] leading-none">←</span>
            return
          </button>

          <div className="flex flex-col items-center gap-[2px]">
            <h1 className="font-serif-nook text-neutral-200 text-xl font-light tracking-[0.18em] leading-none">
              Soundscapes
            </h1>
            <p className="font-sans text-neutral-500 text-[0.58rem] tracking-[0.1em] text-center">
              generative ambient layers
            </p>
          </div>

          <div className="flex items-center justify-end min-w-[60px]">
            <HeaderAudioShortcut />
          </div>
        </header>

        {/* Sound Sanctuary Component */}
        <SoundSanctuary />
      </div>
    </main>
  )
}
