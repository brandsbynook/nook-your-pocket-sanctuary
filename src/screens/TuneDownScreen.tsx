import { useState } from 'react'
import GuidedBreathing from '../components/tunedown/GuidedBreathing'
import FollowTheDot   from '../components/tunedown/FollowTheDot'
import DoodlingCanvas from '../components/tunedown/DoodlingCanvas'
import StimPad        from '../components/tunedown/StimPad'

type TuneDownTab = 'breathe' | 'follow-dot' | 'doodle' | 'stim-pad'

interface TuneDownScreenProps {
  onBack: () => void
}

const TABS: { id: TuneDownTab; label: string }[] = [
  { id: 'breathe',    label: 'Breathe'    },
  { id: 'follow-dot', label: 'Follow Dot' },
  { id: 'doodle',     label: 'Doodle'     },
  { id: 'stim-pad',   label: 'Stim Pad'   },
]

export default function TuneDownScreen({ onBack }: TuneDownScreenProps) {
  const [activeTab, setActiveTab] = useState<TuneDownTab>('breathe')

  return (
    <main
      id="tune-down-screen"
      className="
        h-[100dvh] max-w-[420px] mx-auto
        px-6 pt-10 pb-6
        flex flex-col justify-between
        overflow-hidden
        bg-[#0E0E0E]
        animate-fade-in
      "
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex items-center justify-between mb-5 shrink-0">
          <button
            id="tune-down-back"
            onClick={onBack}
            className="
              flex items-center gap-1.5
              font-sans text-[#52525B] text-[0.62rem]
              tracking-[0.14em] uppercase
              hover:text-[#71717A] transition-colors
              focus:outline-none
            "
          >
            <span className="text-[0.8rem] leading-none">←</span>
            return
          </button>

          <div className="flex flex-col items-center gap-[2px]">
            <h1 className="font-serif-nook text-[#E5E0D8] text-xl font-light tracking-[0.18em] leading-none">
              Tune Down
            </h1>
            <p className="font-sans text-[#3A3A3A] text-[0.58rem] tracking-[0.1em] text-center">
              Sensory regulation & stillness
            </p>
          </div>

          <div className="w-[60px]" aria-hidden="true" />
        </header>

        {/* ── Sub-Navigation Tabs ─────────────────────────────── */}
        <div
          role="tablist"
          aria-label="Tune down regulation modes"
          className="flex items-center mb-4 border-b border-[#1E1E1E] shrink-0"
        >
          {TABS.map(tab => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className="
                  relative flex-1 pb-3
                  font-sans text-[0.56rem] tracking-[0.12em] uppercase
                  transition-colors duration-300
                  focus:outline-none
                "
              >
                <span className={isActive ? 'text-[#E5E0D8]' : 'text-[#3A3A3A] hover:text-[#52525B]'}>
                  {tab.label}
                </span>
                {/* Active underline */}
                <span
                  className={`
                    absolute bottom-0 left-0 right-0 h-px
                    transition-all duration-400
                    ${isActive ? 'bg-[#C9B99A] opacity-80' : 'bg-transparent'}
                  `}
                  aria-hidden="true"
                />
              </button>
            )
          })}
        </div>

        {/* ── Active Module Content ───────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'breathe'    && <GuidedBreathing />}
          {activeTab === 'follow-dot' && <FollowTheDot />}
          {activeTab === 'doodle'     && <DoodlingCanvas />}
          {activeTab === 'stim-pad'   && <StimPad />}
        </div>
      </div>
    </main>
  )
}
