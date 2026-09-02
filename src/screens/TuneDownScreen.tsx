import { useState } from 'react'
import BubbleLattice from '../components/tunedown/BubbleLattice'
import StimPad        from '../components/tunedown/StimPad'
import FollowTheDot, { type DotMovementPattern } from '../components/tunedown/FollowTheDot'
import DoodlingCanvas, { type DoodleMode } from '../components/tunedown/DoodlingCanvas'
import GuidedBreathing, { type PatternId } from '../components/tunedown/GuidedBreathing'
import HeaderAudioShortcut from '../components/HeaderAudioShortcut'
import { triggerHaptic } from '../utils/haptics'

export type PracticeId = 'bubble-lattice' | 'stim-pad' | 'follow-dot' | 'doodle' | 'breathe'
export type AccordionSectionId = 'breathe' | 'follow-dot' | 'doodle' | 'stim'

interface TuneDownScreenProps {
  onBack: () => void
  initialPractice?: PracticeId | null
}

export default function TuneDownScreen({ onBack, initialPractice = null }: TuneDownScreenProps) {
  const [openSection, setOpenSection] = useState<AccordionSectionId | null>(null)
  const [activePractice, setActivePractice] = useState<PracticeId | null>(initialPractice)
  const [breathePattern, setBreathePattern] = useState<PatternId>('soft')
  const [dotPattern, setDotPattern] = useState<DotMovementPattern>('dynamic')
  const [doodleMode, setDoodleMode] = useState<DoodleMode>('open')

  function handleToggleSection(section: AccordionSectionId) {
    triggerHaptic(10)
    setOpenSection(prev => (prev === section ? null : section))
  }

  function handleLaunchBreathe(pattern: PatternId) {
    triggerHaptic(15)
    setBreathePattern(pattern)
    setActivePractice('breathe')
  }

  function handleLaunchDot(pattern: DotMovementPattern) {
    triggerHaptic(15)
    setDotPattern(pattern)
    setActivePractice('follow-dot')
  }

  function handleLaunchDoodle(mode: DoodleMode) {
    triggerHaptic(15)
    setDoodleMode(mode)
    setActivePractice('doodle')
  }

  function handleLaunchStim(id: 'bubble-lattice' | 'stim-pad') {
    triggerHaptic(15)
    setActivePractice(id)
  }

  const activeTitle =
    activePractice === 'bubble-lattice'
      ? 'Bubble Lattice'
      : activePractice === 'stim-pad'
      ? 'Resonant Surface'
      : activePractice === 'follow-dot'
      ? 'Ripple & Flow'
      : activePractice === 'doodle'
      ? 'Doodle'
      : activePractice === 'breathe'
      ? 'Breathe'
      : 'Tune Down'

  const activeSubtext =
    activePractice === 'bubble-lattice'
      ? 'tactile popping & discrete sensory release'
      : activePractice === 'stim-pad'
      ? 'continuous kinetic glide & acoustic anchor'
      : activePractice === 'follow-dot'
      ? 'fluid touch & soft gaze'
      : activePractice === 'doodle'
      ? 'quiet drawing & mark-making'
      : activePractice === 'breathe'
      ? 'somatic pacing & rhythm'
      : 'sensory regulation & stillness'

  return (
    <main
      id="tune-down-screen"
      className="h-[100dvh] w-full max-w-md mx-auto flex flex-col bg-[#0A0A0B] text-[#E5E5E7] px-5 pt-8 pb-6 overflow-hidden select-none"
    >
      <div className="flex-1 flex flex-col min-h-0 w-full">
        {/* ── Fixed Document-Flow Header with Breathing Room ── */}
        <header className="flex items-center justify-between pb-4 shrink-0">
          <button
            id="tune-down-back"
            onClick={activePractice ? () => setActivePractice(null) : onBack}
            className="
              flex items-center gap-1.5
              font-sans text-[#52525B] text-[0.62rem]
              tracking-[0.14em] uppercase
              hover:text-[#E5E5E7] transition-colors
              focus:outline-none py-1 cursor-pointer
            "
          >
            <span className="text-[0.8rem] leading-none">←</span>
            {activePractice ? 'tools' : 'return'}
          </button>

          <div className="flex flex-col items-center gap-[2px]">
            <h1 className="font-serif-nook text-xl tracking-widest text-[#E5E5E7] leading-none">
              {activeTitle}
            </h1>
            <p className="font-sans text-xs text-[#71717A] mt-1 text-center tracking-wide">
              {activeSubtext}
            </p>
          </div>

          <div className="flex items-center justify-end min-w-[60px]">
            <HeaderAudioShortcut />
          </div>
        </header>

      {/* ── View 1: 4 Primary Accordion Drawers ── */}
      {!activePractice ? (
        <div className="flex-1 flex flex-col justify-start overflow-y-auto px-6 pb-8 animate-fade-in">
            <div className="flex flex-col gap-y-3 mt-8 w-full">
              {/* ── 1. BREATHE ACCORDION ── */}
              <div className="rounded-2xl border border-[#222225] bg-[#141416] overflow-hidden transition-all duration-300">
                <button
                  id="accordion-breathe"
                  onClick={() => handleToggleSection('breathe')}
                  className="w-full p-4 flex items-center justify-between group text-left cursor-pointer focus:outline-none"
                  aria-expanded={openSection === 'breathe'}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-serif text-[1.15rem] tracking-wide text-[#E5E5E7] font-normal group-hover:text-[#FFFFFF] transition-colors">
                      Breathe
                    </span>
                    <span className="text-xs text-[#71717A] tracking-normal font-sans">
                      somatic pacing & rhythm
                    </span>
                  </div>

                  <span
                    className={`
                      text-[#71717A] text-sm font-light leading-none
                      transition-transform duration-300
                      group-hover:text-[#E5E5E7]
                      ml-4 shrink-0
                      ${openSection === 'breathe' ? 'rotate-90 text-[#E5E5E7]' : ''}
                    `}
                    aria-hidden="true"
                  >
                    ›
                  </span>
                </button>

                {openSection === 'breathe' && (
                  <div className="flex flex-col animate-fade-in">
                    <button
                      onClick={() => handleLaunchBreathe('soft')}
                      className="py-3 px-4 border-t border-[#1F1F23] flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none hover:bg-[#1A1A1E] text-left"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif text-sm text-[#E5E5E7] italic font-normal group-hover/opt:text-[#FFFFFF]">
                          Unhurried Flow
                        </span>
                        <span className="text-[11px] text-[#71717A] font-sans">
                          equal-ratio steady calm breath
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#E5E5E7]">
                        Begin →
                      </span>
                    </button>

                    <button
                      onClick={() => handleLaunchBreathe('box')}
                      className="py-3 px-4 border-t border-[#1F1F23] flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none hover:bg-[#1A1A1E] text-left"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif text-sm text-[#E5E5E7] italic font-normal group-hover/opt:text-[#FFFFFF]">
                          Box Breathing
                        </span>
                        <span className="text-[11px] text-[#71717A] font-sans">
                          4-4-4-4 grounding cadence
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#E5E5E7]">
                        Begin →
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* ── 2. RIPPLE & FLOW ACCORDION ── */}
              <div className="rounded-2xl border border-[#222225] bg-[#141416] overflow-hidden transition-all duration-300">
                <button
                  id="accordion-follow-dot"
                  onClick={() => handleToggleSection('follow-dot')}
                  className="w-full p-4 flex items-center justify-between group text-left cursor-pointer focus:outline-none"
                  aria-expanded={openSection === 'follow-dot'}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-serif text-[1.15rem] tracking-wide text-[#E5E5E7] font-normal group-hover:text-[#FFFFFF] transition-colors">
                      Ripple & Flow
                    </span>
                    <span className="text-xs text-[#71717A] tracking-normal font-sans">
                      fluid touch & soft gaze
                    </span>
                  </div>

                  <span
                    className={`
                      text-[#71717A] text-sm font-light leading-none
                      transition-transform duration-300
                      group-hover:text-[#E5E5E7]
                      ml-4 shrink-0
                      ${openSection === 'follow-dot' ? 'rotate-90 text-[#E5E5E7]' : ''}
                    `}
                    aria-hidden="true"
                  >
                    ›
                  </span>
                </button>

                {openSection === 'follow-dot' && (
                  <div className="flex flex-col animate-fade-in">
                    <button
                      onClick={() => handleLaunchDot('dynamic')}
                      className="py-3 px-4 border-t border-[#1F1F23] flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none hover:bg-[#1A1A1E] text-left"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif text-sm text-[#E5E5E7] italic font-normal group-hover/opt:text-[#FFFFFF]">
                          Dynamic Flow
                        </span>
                        <span className="text-[11px] text-[#71717A] font-sans">
                          smooth, gentle gaze tracking
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#E5E5E7]">
                        Begin →
                      </span>
                    </button>

                    <button
                      onClick={() => handleLaunchDot('bloom')}
                      className="py-3 px-4 border-t border-[#1F1F23] flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none hover:bg-[#1A1A1E] text-left"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif text-sm text-[#E5E5E7] italic font-normal group-hover/opt:text-[#FFFFFF]">
                          Bloom
                        </span>
                        <span className="text-[11px] text-[#71717A] font-sans">
                          foveal soft-focus & optic rest
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#E5E5E7]">
                        Begin →
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* ── 3. DOODLE ACCORDION ── */}
              <div className="rounded-2xl border border-[#222225] bg-[#141416] overflow-hidden transition-all duration-300">
                <button
                  id="accordion-doodle"
                  onClick={() => handleToggleSection('doodle')}
                  className="w-full p-4 flex items-center justify-between group text-left cursor-pointer focus:outline-none"
                  aria-expanded={openSection === 'doodle'}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-serif text-[1.15rem] tracking-wide text-[#E5E5E7] font-normal group-hover:text-[#FFFFFF] transition-colors">
                      Doodle
                    </span>
                    <span className="text-xs text-[#71717A] tracking-normal font-sans">
                      quiet drawing & mark-making
                    </span>
                  </div>

                  <span
                    className={`
                      text-[#71717A] text-sm font-light leading-none
                      transition-transform duration-300
                      group-hover:text-[#E5E5E7]
                      ml-4 shrink-0
                      ${openSection === 'doodle' ? 'rotate-90 text-[#E5E5E7]' : ''}
                    `}
                    aria-hidden="true"
                  >
                    ›
                  </span>
                </button>

                {openSection === 'doodle' && (
                  <div className="flex flex-col animate-fade-in">
                    <button
                      onClick={() => handleLaunchDoodle('open')}
                      className="py-3 px-4 border-t border-[#1F1F23] flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none hover:bg-[#1A1A1E] text-left"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif text-sm text-[#E5E5E7] italic font-normal group-hover/opt:text-[#FFFFFF]">
                          Open Canvas
                        </span>
                        <span className="text-[11px] text-[#71717A] font-sans">
                          boundless warm charcoal mark-making
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#E5E5E7]">
                        Begin →
                      </span>
                    </button>

                    <button
                      onClick={() => handleLaunchDoodle('symmetry')}
                      className="py-3 px-4 border-t border-[#1F1F23] flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none hover:bg-[#1A1A1E] text-left"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif text-sm text-[#E5E5E7] italic font-normal group-hover/opt:text-[#FFFFFF]">
                          Symmetry Flow
                        </span>
                        <span className="text-[11px] text-[#71717A] font-sans">
                          bilateral mirrored mark-making
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#E5E5E7]">
                        Begin →
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* ── 4. STIM / FIDGET ACCORDION ── */}
              <div className="rounded-2xl border border-[#222225] bg-[#141416] overflow-hidden transition-all duration-300">
                <button
                  id="accordion-stim"
                  onClick={() => handleToggleSection('stim')}
                  className="w-full p-4 flex items-center justify-between group text-left cursor-pointer focus:outline-none"
                  aria-expanded={openSection === 'stim'}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-serif text-[1.15rem] tracking-wide text-[#E5E5E7] font-normal group-hover:text-[#FFFFFF] transition-colors">
                      Stim / Fidget
                    </span>
                    <span className="text-xs text-[#71717A] tracking-normal font-sans">
                      responsive touch & sensory grounding
                    </span>
                  </div>

                  <span
                    className={`
                      text-[#71717A] text-sm font-light leading-none
                      transition-transform duration-300
                      group-hover:text-[#E5E5E7]
                      ml-4 shrink-0
                      ${openSection === 'stim' ? 'rotate-90 text-[#E5E5E7]' : ''}
                    `}
                    aria-hidden="true"
                  >
                    ›
                  </span>
                </button>

                {openSection === 'stim' && (
                  <div className="flex flex-col animate-fade-in">
                    {/* Tool 1: Bubble Lattice */}
                    <button
                      id="stim-bubble-lattice"
                      onClick={() => handleLaunchStim('bubble-lattice')}
                      className="py-3 px-4 border-t border-[#1F1F23] flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none hover:bg-[#1A1A1E] text-left"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif text-sm text-[#E5E5E7] italic font-normal group-hover/opt:text-[#FFFFFF]">
                          Bubble Lattice
                        </span>
                        <span className="text-[11px] text-[#71717A] font-sans">
                          tactile popping & discrete sensory release
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#E5E5E7]">
                        Begin →
                      </span>
                    </button>

                    {/* Tool 2: Resonant Surface */}
                    <button
                      id="stim-stim-pad"
                      onClick={() => handleLaunchStim('stim-pad')}
                      className="py-3 px-4 border-t border-[#1F1F23] flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none hover:bg-[#1A1A1E] text-left"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif text-sm text-[#E5E5E7] italic font-normal group-hover/opt:text-[#FFFFFF]">
                          Resonant Surface
                        </span>
                        <span className="text-[11px] text-[#71717A] font-sans">
                          continuous kinetic glide & acoustic anchor
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#E5E5E7]">
                        Begin →
                      </span>
                    </button>

                    {/* Footnote */}
                    <div className="pt-3 pb-1 text-center font-serif italic text-xs text-[#71717A]">
                      more unfolding soon
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Note */}
              <p className="mt-8 pb-6 text-center text-xs text-[#71717A] italic select-none">
                More sensory paths unfolding soon.
              </p>
            </div>
          </div>
        ) : (
          /* ── View 2: Full-Frame Active Practice Exercise ─── */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-fade-in">
            {activePractice === 'breathe'        && <GuidedBreathing initialPattern={breathePattern} />}
            {activePractice === 'follow-dot'     && <FollowTheDot initialPattern={dotPattern} />}
            {activePractice === 'doodle'         && <DoodlingCanvas initialMode={doodleMode} />}
            {activePractice === 'bubble-lattice' && <BubbleLattice />}
            {activePractice === 'stim-pad'       && <StimPad />}
          </div>
        )}
      </div>
    </main>
  )
}
