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
  const [isTactileOpen, setIsTactileOpen] = useState<boolean>(true)
  const [activePractice, setActivePractice] = useState<PracticeId | null>(initialPractice)
  const [breathePattern, setBreathePattern] = useState<PatternId>('soft')
  const [dotPattern, setDotPattern] = useState<DotMovementPattern>('horizontal')
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
      ? 'Stim Pad'
      : activePractice === 'follow-dot'
      ? 'Follow Dot'
      : activePractice === 'doodle'
      ? 'Doodle'
      : activePractice === 'breathe'
      ? 'Breathe'
      : 'Tune Down'

  const activeSubtext =
    activePractice === 'bubble-lattice'
      ? 'soft popping grid & tactile release'
      : activePractice === 'stim-pad'
      ? 'continuous kinetic touch canvas'
      : activePractice === 'follow-dot'
      ? 'bilateral tracking & soft-focus gaze'
      : activePractice === 'doodle'
      ? 'quiet drawing & mark-making'
      : activePractice === 'breathe'
      ? 'somatic pacing & rhythm'
      : 'sensory regulation & stillness'

  return (
    <main
      id="tune-down-screen"
      className="
        min-h-[100dvh] w-full max-w-md mx-auto
        px-6 pt-10 pb-8
        flex flex-col justify-start
        bg-[var(--bg-primary,#0E0E0E)] text-[#E5E0D8]
        animate-fade-in
      "
    >
      <div className={`flex flex-col ${activePractice ? 'flex-1 h-[calc(100dvh-5rem)]' : 'flex-initial'} min-h-0 w-full`}>
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex items-center justify-between mb-2 shrink-0">
          <button
            id="tune-down-back"
            onClick={activePractice ? () => setActivePractice(null) : onBack}
            className="
              flex items-center gap-1.5
              font-sans text-neutral-500 text-[0.62rem]
              tracking-[0.14em] uppercase
              hover:text-neutral-300 transition-colors
              focus:outline-none py-1 cursor-pointer
            "
          >
            <span className="text-[0.8rem] leading-none">←</span>
            {activePractice ? 'tools' : 'return'}
          </button>

          <div className="flex flex-col items-center gap-[2px]">
            <h1 className="font-serif-nook text-xl tracking-widest text-[#E5E0D8] leading-none">
              {activeTitle}
            </h1>
            <p className="font-sans text-xs text-[#9E988F] mt-1 text-center tracking-wide">
              {activeSubtext}
            </p>
          </div>

          <div className="flex items-center justify-end min-w-[60px]">
            <HeaderAudioShortcut />
          </div>
        </header>

        {/* ── View 1: 4 Primary Accordion Drawers ── */}
        {!activePractice ? (
          <div className="flex-1 flex flex-col justify-start overflow-y-auto pr-0.5 animate-fade-in">
            <div className="flex flex-col gap-y-3 mt-8 w-full">
              {/* ── 1. BREATHE ACCORDION ── */}
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#141414]/60 overflow-hidden transition-all duration-300">
                <button
                  id="accordion-breathe"
                  onClick={() => handleToggleSection('breathe')}
                  className="w-full p-4 flex items-center justify-between group text-left cursor-pointer focus:outline-none"
                  aria-expanded={openSection === 'breathe'}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-serif-nook text-[#E5E0D8] text-[1.12rem] font-light tracking-wide group-hover:text-[#C9B99A] transition-colors">
                      Breathe
                    </span>
                    <span className="font-sans text-[#71717A] text-[0.7rem] font-light tracking-wide">
                      somatic pacing & rhythm
                    </span>
                  </div>

                  <span
                    className={`
                      text-neutral-500 text-sm font-light leading-none
                      transition-transform duration-300
                      group-hover:text-[#C9B99A]
                      ml-4 shrink-0
                      ${openSection === 'breathe' ? 'rotate-90 text-[#C9B99A]' : ''}
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
                      className="px-4 py-3 text-xs text-[#9E988F] hover:text-[#E5E0D8] border-t border-[#1F1F1F]/60 flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif-nook text-sm text-[#E5E0D8] group-hover/opt:text-[#FFFFFF]">
                          4-4 Soft
                        </span>
                        <span className="text-[0.68rem] text-[#71717A] font-light italic">
                          unhurried equal-ratio breath
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#C9B99A]">
                        Begin →
                      </span>
                    </button>

                    <button
                      onClick={() => handleLaunchBreathe('478')}
                      className="px-4 py-3 text-xs text-[#9E988F] hover:text-[#E5E0D8] border-t border-[#1F1F1F]/60 flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif-nook text-sm text-[#E5E0D8] group-hover/opt:text-[#FFFFFF]">
                          4-7-8 Calm
                        </span>
                        <span className="text-[0.68rem] text-[#71717A] font-light italic">
                          nervous system reset
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#C9B99A]">
                        Begin →
                      </span>
                    </button>

                    <button
                      onClick={() => handleLaunchBreathe('box')}
                      className="px-4 py-3 text-xs text-[#9E988F] hover:text-[#E5E0D8] border-t border-[#1F1F1F]/60 flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif-nook text-sm text-[#E5E0D8] group-hover/opt:text-[#FFFFFF]">
                          Box Breathing
                        </span>
                        <span className="text-[0.68rem] text-[#71717A] font-light italic">
                          4-4-4-4 grounding cadence
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#C9B99A]">
                        Begin →
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* ── 2. FOLLOW DOT ACCORDION ── */}
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#141414]/60 overflow-hidden transition-all duration-300">
                <button
                  id="accordion-follow-dot"
                  onClick={() => handleToggleSection('follow-dot')}
                  className="w-full p-4 flex items-center justify-between group text-left cursor-pointer focus:outline-none"
                  aria-expanded={openSection === 'follow-dot'}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-serif-nook text-[#E5E0D8] text-[1.12rem] font-light tracking-wide group-hover:text-[#C9B99A] transition-colors">
                      Follow Dot
                    </span>
                    <span className="font-sans text-[#71717A] text-[0.7rem] font-light tracking-wide">
                      bilateral tracking & soft-focus gaze
                    </span>
                  </div>

                  <span
                    className={`
                      text-neutral-500 text-sm font-light leading-none
                      transition-transform duration-300
                      group-hover:text-[#C9B99A]
                      ml-4 shrink-0
                      ${openSection === 'follow-dot' ? 'rotate-90 text-[#C9B99A]' : ''}
                    `}
                    aria-hidden="true"
                  >
                    ›
                  </span>
                </button>

                {openSection === 'follow-dot' && (
                  <div className="flex flex-col animate-fade-in">
                    <button
                      onClick={() => handleLaunchDot('horizontal')}
                      className="px-4 py-3 text-xs text-[#9E988F] hover:text-[#E5E0D8] border-t border-[#1F1F1F]/60 flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif-nook text-sm text-[#E5E0D8] group-hover/opt:text-[#FFFFFF]">
                          Bilateral
                        </span>
                        <span className="text-[0.68rem] text-[#71717A] font-light italic">
                          horizontal tracking
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#C9B99A]">
                        Begin →
                      </span>
                    </button>

                    <button
                      onClick={() => handleLaunchDot('orbit')}
                      className="px-4 py-3 text-xs text-[#9E988F] hover:text-[#E5E0D8] border-t border-[#1F1F1F]/60 flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif-nook text-sm text-[#E5E0D8] group-hover/opt:text-[#FFFFFF]">
                          Orbit
                        </span>
                        <span className="text-[0.68rem] text-[#71717A] font-light italic">
                          circular gaze tracking
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#C9B99A]">
                        Begin →
                      </span>
                    </button>

                    <button
                      onClick={() => handleLaunchDot('wave')}
                      className="px-4 py-3 text-xs text-[#9E988F] hover:text-[#E5E0D8] border-t border-[#1F1F1F]/60 flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif-nook text-sm text-[#E5E0D8] group-hover/opt:text-[#FFFFFF]">
                          Wave
                        </span>
                        <span className="text-[0.68rem] text-[#71717A] font-light italic">
                          sinusoidal path tracking
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#C9B99A]">
                        Begin →
                      </span>
                    </button>

                    <button
                      onClick={() => handleLaunchDot('bloom')}
                      className="px-4 py-3 text-xs text-[#9E988F] hover:text-[#E5E0D8] border-t border-[#1F1F1F]/60 flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif-nook text-sm text-[#E5E0D8] group-hover/opt:text-[#FFFFFF]">
                          Bloom
                        </span>
                        <span className="text-[0.68rem] text-[#71717A] font-light italic">
                          foveal soft-focus & optic rest
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#C9B99A]">
                        Begin →
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* ── 3. DOODLE ACCORDION ── */}
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#141414]/60 overflow-hidden transition-all duration-300">
                <button
                  id="accordion-doodle"
                  onClick={() => handleToggleSection('doodle')}
                  className="w-full p-4 flex items-center justify-between group text-left cursor-pointer focus:outline-none"
                  aria-expanded={openSection === 'doodle'}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-serif-nook text-[#E5E0D8] text-[1.12rem] font-light tracking-wide group-hover:text-[#C9B99A] transition-colors">
                      Doodle
                    </span>
                    <span className="font-sans text-[#71717A] text-[0.7rem] font-light tracking-wide">
                      quiet drawing & mark-making
                    </span>
                  </div>

                  <span
                    className={`
                      text-neutral-500 text-sm font-light leading-none
                      transition-transform duration-300
                      group-hover:text-[#C9B99A]
                      ml-4 shrink-0
                      ${openSection === 'doodle' ? 'rotate-90 text-[#C9B99A]' : ''}
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
                      className="px-4 py-3 text-xs text-[#9E988F] hover:text-[#E5E0D8] border-t border-[#1F1F1F]/60 flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif-nook text-sm text-[#E5E0D8] group-hover/opt:text-[#FFFFFF]">
                          Open Canvas
                        </span>
                        <span className="text-[0.68rem] text-[#71717A] font-light italic">
                          boundless warm charcoal mark-making
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#C9B99A]">
                        Begin →
                      </span>
                    </button>

                    <button
                      onClick={() => handleLaunchDoodle('vanishing')}
                      className="px-4 py-3 text-xs text-[#9E988F] hover:text-[#E5E0D8] border-t border-[#1F1F1F]/60 flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif-nook text-sm text-[#E5E0D8] group-hover/opt:text-[#FFFFFF]">
                          Vanishing Ink
                        </span>
                        <span className="text-[0.68rem] text-[#71717A] font-light italic">
                          lines dissolve gently after ~4s
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#C9B99A]">
                        Begin →
                      </span>
                    </button>

                    <button
                      onClick={() => handleLaunchDoodle('symmetry')}
                      className="px-4 py-3 text-xs text-[#9E988F] hover:text-[#E5E0D8] border-t border-[#1F1F1F]/60 flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-serif-nook text-sm text-[#E5E0D8] group-hover/opt:text-[#FFFFFF]">
                          Symmetry Flow
                        </span>
                        <span className="text-[0.68rem] text-[#71717A] font-light italic">
                          bilateral mirrored mark-making
                        </span>
                      </div>
                      <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#C9B99A]">
                        Begin →
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* ── 4. STIM / FIDGET ACCORDION ── */}
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#141414]/60 overflow-hidden transition-all duration-300">
                <button
                  id="accordion-stim"
                  onClick={() => handleToggleSection('stim')}
                  className="w-full p-4 flex items-center justify-between group text-left cursor-pointer focus:outline-none"
                  aria-expanded={openSection === 'stim'}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-serif-nook text-[#E5E0D8] text-[1.12rem] font-light tracking-wide group-hover:text-[#C9B99A] transition-colors">
                      Stim / Fidget
                    </span>
                    <span className="font-sans text-[#71717A] text-[0.7rem] font-light tracking-wide">
                      responsive touch & sensory grounding
                    </span>
                  </div>

                  <span
                    className={`
                      text-neutral-500 text-sm font-light leading-none
                      transition-transform duration-300
                      group-hover:text-[#C9B99A]
                      ml-4 shrink-0
                      ${openSection === 'stim' ? 'rotate-90 text-[#C9B99A]' : ''}
                    `}
                    aria-hidden="true"
                  >
                    ›
                  </span>
                </button>

                {openSection === 'stim' && (
                  <div className="flex flex-col animate-fade-in divide-y divide-[#1F1F1F]/60">
                    {/* a. Tactile Stim Expandable Sub-Drawer */}
                    <div className="flex flex-col">
                      <button
                        onClick={() => {
                          triggerHaptic(10)
                          setIsTactileOpen(prev => !prev)
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between group/sub text-left cursor-pointer focus:outline-none hover:bg-[#181818]/60 transition-colors"
                        aria-expanded={isTactileOpen}
                      >
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-serif-nook text-[#E5E0D8] text-[0.98rem] font-light group-hover/sub:text-[#C9B99A] transition-colors">
                            Tactile Stim
                          </span>
                          <span className="font-sans text-[0.66rem] text-[#71717A] font-light">
                            responsive touch & physical grounding
                          </span>
                        </div>
                        <span
                          className={`
                            text-neutral-500 text-xs font-light transition-transform duration-200 ml-3 shrink-0
                            ${isTactileOpen ? 'rotate-90 text-[#C9B99A]' : ''}
                          `}
                        >
                          ›
                        </span>
                      </button>

                      {isTactileOpen && (
                        <div className="flex flex-col bg-[#0F0F12]/60 animate-fade-in">
                          <button
                            onClick={() => handleLaunchStim('bubble-lattice')}
                            className="px-5 py-2.5 text-xs text-[#9E988F] hover:text-[#E5E0D8] border-t border-[#1F1F1F]/40 flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none"
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-serif-nook text-sm text-[#E5E0D8] group-hover/opt:text-[#FFFFFF]">
                                Bubble Lattice
                              </span>
                              <span className="text-[0.68rem] text-[#71717A] font-light italic">
                                soft popping grid with realistic audio & micro-haptics
                              </span>
                            </div>
                            <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#C9B99A]">
                              Begin →
                            </span>
                          </button>

                          <button
                            onClick={() => handleLaunchStim('stim-pad')}
                            className="px-5 py-2.5 text-xs text-[#9E988F] hover:text-[#E5E0D8] border-t border-[#1F1F1F]/40 flex items-center justify-between cursor-pointer transition-colors group/opt focus:outline-none"
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-serif-nook text-sm text-[#E5E0D8] group-hover/opt:text-[#FFFFFF]">
                                Stim Pad
                              </span>
                              <span className="text-[0.68rem] text-[#71717A] font-light italic">
                                continuous kinetic touch canvas
                              </span>
                            </div>
                            <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A] group-hover/opt:text-[#C9B99A]">
                              Begin →
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* b. Visual Stim Static Row */}
                    <div className="w-full px-4 py-3 flex items-center justify-between text-left cursor-default select-none">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-serif-nook text-[#9E988F] text-[0.98rem] font-light">
                          Visual Stim
                        </span>
                        <span className="font-sans text-[0.66rem] text-[#71717A] font-light">
                          optic nerve rest & gaze anchors
                        </span>
                      </div>
                      <span className="text-[11px] italic text-[#8E8880] shrink-0 ml-3 font-serif-nook">
                        Unfolding soon
                      </span>
                    </div>

                    {/* c. Kinetic Stim Static Row */}
                    <div className="w-full px-4 py-3 flex items-center justify-between text-left cursor-default select-none">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-serif-nook text-[#9E988F] text-[0.98rem] font-light">
                          Kinetic Stim
                        </span>
                        <span className="font-sans text-[0.66rem] text-[#71717A] font-light">
                          unhurried fine-motor release
                        </span>
                      </div>
                      <span className="text-[11px] italic text-[#8E8880] shrink-0 ml-3 font-serif-nook">
                        Unfolding soon
                      </span>
                    </div>

                    {/* d. Cognitive Stim Static Row */}
                    <div className="w-full px-4 py-3 flex items-center justify-between text-left cursor-default select-none">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-serif-nook text-[#9E988F] text-[0.98rem] font-light">
                          Cognitive Stim
                        </span>
                        <span className="font-sans text-[0.66rem] text-[#71717A] font-light">
                          zero-pressure spatial ordering
                        </span>
                      </div>
                      <span className="text-[11px] italic text-[#8E8880] shrink-0 ml-3 font-serif-nook">
                        Unfolding soon
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Note */}
              <p className="mt-8 pb-6 text-center text-xs text-[#8E8880] italic select-none">
                More sensory paths unfolding soon.
              </p>
            </div>
          </div>
        ) : (
          /* ── View 2: Full-Frame Active Practice Exercise ─── */
          <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
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
