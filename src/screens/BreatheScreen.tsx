import GuidedBreathing from '../components/tunedown/GuidedBreathing'
import ScreenHeader from '../components/ScreenHeader'

interface BreatheScreenProps {
  onBack: () => void
}

export default function BreatheScreen({ onBack }: BreatheScreenProps) {
  return (
    <main
      id="breathe-screen"
      className="
        h-[100dvh] max-w-[420px] mx-auto
        px-6 pt-10 pb-6
        flex flex-col justify-between
        overflow-hidden
        bg-[#0E0E0E] text-[#E5E0D8]
        animate-fade-in
      "
    >
      <div className="flex flex-col flex-1 min-h-0">
        <ScreenHeader
          id="breathe-screen-header"
          title="Breathe"
          subtitle="gentle somatic pacing"
          onBack={onBack}
        />
        <div className="flex-1 flex flex-col min-h-0">
          <GuidedBreathing />
        </div>
      </div>
    </main>
  )
}
