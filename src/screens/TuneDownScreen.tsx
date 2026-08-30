import { useState } from 'react'
import GuidedBreathing from '../components/tunedown/GuidedBreathing'
import FollowTheDot   from '../components/tunedown/FollowTheDot'
import DoodlingCanvas from '../components/tunedown/DoodlingCanvas'
import StimPad        from '../components/tunedown/StimPad'
import HeaderAudioShortcut from '../components/HeaderAudioShortcut'

export type PracticeId = 'breathe' | 'stim-pad' | 'doodle' | 'follow-dot'

interface PracticeItem {
  id: PracticeId
  title: string
  subtitle: string
}

const PRACTICES: PracticeItem[] = [
  {
    id: 'breathe',
    title: 'Breathe',
    subtitle: 'gentle somatic pacing',
  },
  {
    id: 'stim-pad',
    title: 'Stim Pad',
    subtitle: 'tactile touch canvas',
  },
  {
    id: 'doodle',
    title: 'Doodle',
    subtitle: 'boundless quiet canvas',
  },
  {
    id: 'follow-dot',
    title: 'Follow Dot',
    subtitle: 'visual tracking anchor',
  },
]

interface TuneDownScreenProps {
  onBack: () => void
  initialPractice?: PracticeId | null
}

export default function TuneDownScreen({ onBack, initialPractice = null }: TuneDownScreenProps) {
  const [activePractice, setActivePractice] = useState<PracticeId | null>(initialPractice)

  const activeItem = PRACTICES.find(p => p.id === activePractice)

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
        <header className="flex items-center justify-between mb-6 shrink-0">
          <button
            id="tune-down-back"
            onClick={activePractice ? () => setActivePractice(null) : onBack}
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
            <h1 className="font-serif-nook text-neutral-300 text-xl font-light tracking-[0.18em] leading-none">
              {activePractice && activeItem ? activeItem.title : 'Tune Down'}
            </h1>
            <p className="font-sans text-neutral-600 text-[0.58rem] tracking-[0.1em] text-center">
              {activePractice && activeItem ? activeItem.subtitle : 'sensory regulation & stillness'}
            </p>
          </div>

          <div className="flex items-center justify-end min-w-[60px]">
            <HeaderAudioShortcut />
          </div>
        </header>

        {/* ── View 1: Spacious Practice List (When no exercise active) ── */}
        {!activePractice ? (
          <div className="flex-1 flex flex-col justify-center my-auto animate-fade-in">
            <nav id="tune-down-practice-list" aria-label="Grounding practices" className="flex flex-col">
              {PRACTICES.map((practice, index) => {
                const showDivider = index < PRACTICES.length - 1
                return (
                  <div
                    key={practice.id}
                    className="animate-row-reveal"
                    style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
                  >
                    <button
                      id={`practice-${practice.id}`}
                      onClick={() => setActivePractice(practice.id)}
                      className="
                        w-full flex items-center justify-between
                        py-[1.3rem]
                        group
                        transition-all duration-300
                        focus:outline-none
                        text-left
                      "
                    >
                      <div className="flex flex-col items-start gap-[3px]">
                        <span className="
                          font-serif-nook text-neutral-300 text-[1.15rem] font-light
                          tracking-wide leading-snug
                          group-hover:text-[#C9B99A] transition-colors duration-300
                        ">
                          {practice.title}
                        </span>
                        <span className="
                          font-sans text-neutral-500 text-[0.68rem]
                          font-light leading-none tracking-[0.06em]
                          transition-colors duration-300
                          group-hover:text-neutral-400
                        ">
                          {practice.subtitle}
                        </span>
                      </div>

                      <span
                        className="
                          text-neutral-600 text-sm font-light leading-none
                          transition-all duration-300
                          group-hover:text-[#C9B99A]/70 group-hover:translate-x-0.5
                          ml-4 shrink-0
                        "
                        aria-hidden="true"
                      >
                        ›
                      </span>
                    </button>

                    {showDivider && <div className="h-px w-full bg-[#1F1F24]" />}
                  </div>
                )
              })}
            </nav>
          </div>
        ) : (
          /* ── View 2: Full-Frame Active Practice Exercise ─── */
          <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
            {activePractice === 'breathe'    && <GuidedBreathing />}
            {activePractice === 'stim-pad'   && <StimPad />}
            {activePractice === 'doodle'     && <DoodlingCanvas />}
            {activePractice === 'follow-dot' && <FollowTheDot />}
          </div>
        )}
      </div>
    </main>
  )
}
