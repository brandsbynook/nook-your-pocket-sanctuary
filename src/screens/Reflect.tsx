import { useState, useRef, useEffect } from 'react'
import { saveReflectionEntry, getEditorFont, type EditorFont } from '../utils/storage'
import HeaderAudioShortcut from '../components/HeaderAudioShortcut'
import TypefaceModal, { getFontFamilyClass } from '../components/TypefaceModal'

export type ReflectTab = 'guided' | 'library'

/* ─────────────────────────────────────────────────────────────
   Prompt Data Structure (4 Curated Categories)
───────────────────────────────────────────────────────────── */
export interface ReflectCategory {
  id: string
  name: string
  prompts: string[]
}

export const REFLECT_CATEGORIES: ReflectCategory[] = [
  {
    id: 'compassion',
    name: 'Gentle Perspective',
    prompts: [
      "What is one small kindness you can offer yourself before this day ends?",
      "What felt unexpectedly quiet, neutral, or steady today?",
      "What is something you handled today, even if it felt clumsy?",
      "What would comfort look like in the next ten minutes?",
      "What expectation can you quietly set down without an apology?",
    ],
  },
  {
    id: 'clarity',
    name: 'Grounding & Clarity',
    prompts: [
      "What is the single essential thing in front of you right now?",
      "Name three neutral, physical facts about the room around you.",
      "If you didn't have to fix or solve anything this hour, what would you do?",
      "What part of this problem is actually yours to carry?",
      "What is one small detail you can simplify right now?",
    ],
  },
  {
    id: 'boundaries',
    name: 'Boundaries & Energy',
    prompts: [
      "What is a quiet boundary you can protect for the rest of today?",
      "Where can you give yourself permission to do less?",
      "Name one thing you can comfortably leave unresolved today.",
      "What is asking for your energy right now that doesn't deserve it?",
      "Where in your day did you give more than you had to spare?",
    ],
  },
  {
    id: 'weight',
    name: 'De-escalation & Weight',
    prompts: [
      "What is taking up the most mental space right now?",
      "If you could set down one expectation for the next hour, what would it be?",
      "What does your body need at this exact moment to feel slightly more at ease?",
      "What is one thing that can wait until tomorrow without consequence?",
      "Write down the looping thought just to give it somewhere to sit.",
    ],
  },
]

/* ─────────────────────────────────────────────────────────────
   5-Step Structured Reflection Steps
───────────────────────────────────────────────────────────── */
export const GUIDED_STEPS = [
  {
    step: 1,
    title: 'Current State',
    question: "What's on your mind right now?",
    placeholder: 'Name the thought, sensation, or situation present for you…',
  },
  {
    step: 2,
    title: 'The Trigger',
    question: 'What triggered this feeling or reaction?',
    placeholder: 'What happened right before this weight settled in?…',
  },
  {
    step: 3,
    title: 'Patterns & Memory',
    question: 'Does this bring back older memories or familiar patterns?',
    placeholder: 'Has a part of this felt familiar before in your past?…',
  },
  {
    step: 4,
    title: 'Alternative Lens',
    question: 'What is one other way to look at this situation?',
    placeholder: 'If viewed with calm detachment or gentleness, what else is true?…',
  },
  {
    step: 5,
    title: 'Quiet Takeaway',
    question: 'What is one small takeaway you can carry forward?',
    placeholder: 'One gentle realization or permission to take with you…',
  },
]

const GUIDED_STORAGE_KEY = 'nook:guided-reflection-steps'
const LIBRARY_STORAGE_KEY = 'nook:library-reflection-drafts'

function loadGuidedDrafts(): Record<number, string> {
  try {
    return JSON.parse(localStorage.getItem(GUIDED_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function persistGuidedDrafts(drafts: Record<number, string>) {
  localStorage.setItem(GUIDED_STORAGE_KEY, JSON.stringify(drafts))
}

function loadLibraryDrafts(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function persistLibraryDrafts(drafts: Record<string, string>) {
  localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(drafts))
}

interface ReflectProps {
  onBack: () => void
}

export default function Reflect({ onBack }: ReflectProps) {
  const [activeTab, setActiveTab] = useState<ReflectTab>('guided')

  // ── Tier 1: Guided Flow State ──
  const [guidedStepIndex, setGuidedStepIndex] = useState<number>(0)
  const [guidedDrafts, setGuidedDrafts] = useState<Record<number, string>>(() => loadGuidedDrafts())
  const [isFadingStep, setIsFadingStep] = useState<boolean>(false)

  // ── Tier 2: Library State ──
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [activePrompt, setActivePrompt] = useState<string | null>(null)
  const [libraryDrafts, setLibraryDrafts] = useState<Record<string, string>>(() => loadLibraryDrafts())

  // ── Shared UI States ──
  const [isSaved, setIsSaved] = useState<boolean>(false)
  const [font, setFont] = useState<EditorFont>(() => getEditorFont())
  const [showTypefaceModal, setShowTypefaceModal] = useState(false)

  const guidedTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const libraryTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  const currentGuidedStep = GUIDED_STEPS[guidedStepIndex]
  const currentGuidedAnswer = guidedDrafts[guidedStepIndex] || ''
  const currentLibraryAnswer = activePrompt ? libraryDrafts[activePrompt] || '' : ''

  // Auto-resize textareas
  useEffect(() => {
    if (activeTab === 'guided') {
      const el = guidedTextareaRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${Math.max(130, el.scrollHeight)}px`
    } else if (activePrompt) {
      const el = libraryTextareaRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${Math.max(140, el.scrollHeight)}px`
    }
  }, [currentGuidedAnswer, guidedStepIndex, activeTab, activePrompt, currentLibraryAnswer])

  // ── Guided Flow Handlers ──
  function handleGuidedTextChange(val: string) {
    const next = { ...guidedDrafts, [guidedStepIndex]: val }
    setGuidedDrafts(next)
    persistGuidedDrafts(next)
  }

  function handleNavigateStep(direction: 'prev' | 'next') {
    setIsFadingStep(true)
    setTimeout(() => {
      if (direction === 'next') {
        setGuidedStepIndex(prev => Math.min(GUIDED_STEPS.length - 1, prev + 1))
      } else {
        setGuidedStepIndex(prev => Math.max(0, prev - 1))
      }
      setIsFadingStep(false)
    }, 150)
  }

  function handleSaveUnifiedGuidedReflection() {
    const hasAnyContent = Object.values(guidedDrafts).some(t => t.trim().length > 0)
    if (!hasAnyContent) return

    // Build unified 5-step response
    const sections: string[] = []
    GUIDED_STEPS.forEach(stepObj => {
      const answer = (guidedDrafts[stepObj.step - 1] || '').trim()
      if (answer) {
        sections.push(`${stepObj.step}. ${stepObj.question}\n${answer}`)
      }
    })

    const unifiedText = sections.join('\n\n')
    saveReflectionEntry('Guided Reflection (5-Step Inquiry)', unifiedText)

    // Clear guided drafts
    setGuidedDrafts({})
    persistGuidedDrafts({})
    setGuidedStepIndex(0)

    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2600)
  }

  function handleClearGuided() {
    const next = { ...guidedDrafts }
    delete next[guidedStepIndex]
    setGuidedDrafts(next)
    persistGuidedDrafts(next)
  }

  // ── Library Prompt Handlers ──
  function handleLibraryTextChange(val: string) {
    if (!activePrompt) return
    const next = { ...libraryDrafts, [activePrompt]: val }
    setLibraryDrafts(next)
    persistLibraryDrafts(next)
  }

  function handleSaveLibraryReflection() {
    if (!activePrompt || !currentLibraryAnswer.trim()) return
    saveReflectionEntry(activePrompt, currentLibraryAnswer.trim())

    // Clear saved draft
    const next = { ...libraryDrafts }
    delete next[activePrompt]
    setLibraryDrafts(next)
    persistLibraryDrafts(next)

    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2600)
  }

  function handleClearLibraryPrompt() {
    if (!activePrompt) return
    const next = { ...libraryDrafts }
    delete next[activePrompt]
    setLibraryDrafts(next)
    persistLibraryDrafts(next)
  }

  return (
    <main
      id="reflect-screen"
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
        {/* ── Top Bar ─────────────────────────────────────────── */}
        <header className="flex items-center justify-between mb-5 shrink-0">
          <button
            id="reflect-back"
            onClick={activeTab === 'library' && activePrompt ? () => setActivePrompt(null) : onBack}
            className="
              flex items-center gap-1.5
              font-sans text-[#52525B] text-[0.62rem]
              tracking-[0.14em] uppercase
              hover:text-[#71717A] transition-colors
              focus:outline-none py-1 cursor-pointer
            "
          >
            <span className="text-[0.8rem] leading-none">←</span>
            {activeTab === 'library' && activePrompt ? 'library' : 'return'}
          </button>

          <div className="flex flex-col items-center gap-[2px]">
            <h1 className="font-serif-nook text-neutral-300 text-xl font-light tracking-[0.18em] leading-none">
              Reflect
            </h1>
            <p className="font-sans text-neutral-600 text-[0.58rem] tracking-[0.1em] text-center">
              unhurried prompts for quiet clarity
            </p>
          </div>

          <div className="flex items-center justify-end min-w-[60px]">
            <HeaderAudioShortcut />
          </div>
        </header>

        {/* ── Tabs (Guided Flow vs Prompt Library) ────────────── */}
        <div
          role="tablist"
          aria-label="Reflection modes"
          className="flex items-center mb-5 border-b border-[#1E1E1E] shrink-0"
        >
          <button
            id="tab-guided"
            role="tab"
            aria-selected={activeTab === 'guided'}
            onClick={() => {
              setActiveTab('guided')
              setActivePrompt(null)
            }}
            className="
              relative flex-1 pb-3
              font-sans text-[0.58rem] tracking-[0.16em] uppercase
              transition-colors duration-300
              focus:outline-none cursor-pointer
            "
          >
            <span className={activeTab === 'guided' ? 'text-[#E5E0D8]' : 'text-[#3A3A3A] hover:text-[#52525B]'}>
              Guided Flow
            </span>
            <span
              className={`
                absolute bottom-0 left-0 right-0 h-px
                transition-all duration-400
                ${activeTab === 'guided' ? 'bg-[#C9B99A] opacity-90' : 'bg-transparent'}
              `}
              aria-hidden="true"
            />
          </button>

          <button
            id="tab-library"
            role="tab"
            aria-selected={activeTab === 'library'}
            onClick={() => setActiveTab('library')}
            className="
              relative flex-1 pb-3
              font-sans text-[0.58rem] tracking-[0.16em] uppercase
              transition-colors duration-300
              focus:outline-none cursor-pointer
            "
          >
            <span className={activeTab === 'library' ? 'text-[#E5E0D8]' : 'text-[#3A3A3A] hover:text-[#52525B]'}>
              Prompt Library
            </span>
            <span
              className={`
                absolute bottom-0 left-0 right-0 h-px
                transition-all duration-400
                ${activeTab === 'library' ? 'bg-[#C9B99A] opacity-90' : 'bg-transparent'}
              `}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* ── Tab Content ─────────────────────────────────────── */}
        {activeTab === 'guided' ? (
          /* ═════════════════════════════════════════════════════
             Tier 1: 5-Step Guided Structured Reflection Flow
             ═════════════════════════════════════════════════════ */
          <div className="flex flex-col flex-1 min-h-0 animate-fade-in justify-between">
            <div className="flex flex-col flex-1 min-h-0">
              {/* Step Navigation & 5-Step Progress Indicators */}
              <div className="mb-4 shrink-0">
                {/* 5-Step Progress Bars */}
                <div className="flex items-center gap-1.5 mb-3">
                  {GUIDED_STEPS.map((s, idx) => {
                    const isPassed = idx < guidedStepIndex
                    const isCurrent = idx === guidedStepIndex
                    const hasAnswer = !!(guidedDrafts[idx] && guidedDrafts[idx].trim().length > 0)

                    return (
                      <button
                        key={s.step}
                        onClick={() => setGuidedStepIndex(idx)}
                        title={`Step ${s.step}: ${s.title}`}
                        className={`
                          flex-1 h-1.5 rounded-full transition-all duration-300 cursor-pointer focus:outline-none
                          ${isCurrent
                            ? 'bg-[#C9B99A]'
                            : hasAnswer || isPassed
                            ? 'bg-[#C9B99A]/40 hover:bg-[#C9B99A]/60'
                            : 'bg-[#222226] hover:bg-[#2C2C32]'
                          }
                        `}
                      />
                    )
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-sans text-[0.58rem] tracking-[0.18em] uppercase text-stone-500 font-normal">
                    Step {guidedStepIndex + 1} of 5 · {currentGuidedStep.title}
                  </span>

                  {currentGuidedAnswer.trim().length > 0 && (
                    <span className="flex items-center gap-1 font-sans text-[0.55rem] tracking-[0.12em] uppercase text-[#C9B99A]/75">
                      <span className="w-1 h-1 rounded-full bg-[#C9B99A] animate-pulse" />
                      Draft saved
                    </span>
                  )}
                </div>

                {/* Soft Quiet Question Prompt (Journal Scale) */}
                <div
                  className={`
                    pt-2.5 pb-2 px-0.5 transition-opacity duration-200 ease-in-out
                    ${isFadingStep ? 'opacity-0' : 'opacity-100'}
                  `}
                >
                  <p className="font-serif-nook text-stone-300 text-base sm:text-[1.05rem] font-normal leading-relaxed tracking-wide">
                    {currentGuidedStep.question}
                  </p>
                  <p className="text-sm text-stone-500 font-serif-nook italic mt-1 font-normal leading-normal">
                    {currentGuidedStep.placeholder}
                  </p>
                </div>
              </div>

              {/* Distraction-free Writing Area */}
              <div className="flex-1 overflow-y-auto min-h-[140px] mb-4 pr-1">
                <textarea
                  ref={guidedTextareaRef}
                  id="guided-reflect-textarea"
                  value={currentGuidedAnswer}
                  onChange={e => handleGuidedTextChange(e.target.value)}
                  placeholder="Reflect quietly here…"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  className={`
                    w-full bg-transparent resize-none outline-none border-none
                    ${getFontFamilyClass(font)} text-neutral-200/90 text-[0.98rem] font-light leading-[1.85] tracking-wide
                    placeholder:text-stone-600 placeholder:text-sm placeholder:font-serif placeholder:italic placeholder:font-light min-h-[130px]
                  `}
                  style={{ height: 'auto' }}
                />
              </div>
            </div>

            {/* Bottom Step Navigation & Unified Save */}
            <div className="shrink-0 pt-3 border-t border-neutral-800/80">
              {/* Feedback toast */}
              <div
                className={`
                  text-center font-sans text-[0.6rem] tracking-[0.2em] uppercase transition-all duration-500 mb-3
                  ${isSaved ? 'text-[#C9B99A] opacity-100' : 'opacity-0'}
                `}
                aria-live="polite"
              >
                Kept in memory chest
              </div>

              <div className="flex items-center justify-between">
                {/* Previous Step Button */}
                <button
                  id="guided-prev-btn"
                  onClick={() => handleNavigateStep('prev')}
                  disabled={guidedStepIndex === 0}
                  className="
                    font-sans text-[0.62rem] tracking-[0.14em] uppercase
                    text-neutral-500 hover:text-neutral-300
                    disabled:opacity-20 disabled:cursor-not-allowed
                    transition-colors duration-200 focus:outline-none cursor-pointer
                  "
                >
                  ← Prev
                </button>

                {/* Clear Step Button */}
                <button
                  id="guided-clear-btn"
                  onClick={handleClearGuided}
                  disabled={!currentGuidedAnswer}
                  className="
                    font-sans text-[0.62rem] tracking-[0.14em] uppercase
                    text-neutral-500 hover:text-neutral-300
                    disabled:opacity-20 disabled:cursor-not-allowed
                    transition-colors duration-200 focus:outline-none cursor-pointer
                  "
                >
                  Clear
                </button>

                {/* Typeface Selector */}
                <button
                  id="reflect-typeface-btn"
                  type="button"
                  onClick={() => setShowTypefaceModal(true)}
                  className="
                    font-sans text-[0.6rem] tracking-[0.14em] uppercase
                    text-neutral-500 hover:text-neutral-300
                    transition-colors duration-200 focus:outline-none cursor-pointer
                  "
                >
                  Typeface
                </button>

                {/* Next Step / Complete Action */}
                {guidedStepIndex < GUIDED_STEPS.length - 1 ? (
                  <button
                    id="guided-next-btn"
                    onClick={() => handleNavigateStep('next')}
                    className="
                      font-sans text-[0.62rem] tracking-[0.14em] uppercase
                      text-[#C9B99A] hover:text-[#E5E0D8]
                      transition-colors duration-200 focus:outline-none cursor-pointer
                    "
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    id="guided-save-unified-btn"
                    onClick={handleSaveUnifiedGuidedReflection}
                    className="
                      px-3.5 py-1.5 rounded-full bg-[#1D1B16] border border-[#C9B99A]/60 text-[#FFFFFF]
                      font-serif-nook text-xs font-light tracking-wide hover:bg-[#26231C]
                      transition-all duration-200 focus:outline-none cursor-pointer shadow-sm
                    "
                  >
                    Complete & Save to Chest
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : activePrompt ? (
          /* ═════════════════════════════════════════════════════
             Tier 2: Single-Prompt Free Writing Canvas
             ═════════════════════════════════════════════════════ */
          <div className="flex flex-col flex-1 min-h-0 animate-fade-in justify-between">
            <div className="flex flex-col flex-1 min-h-0">
              {/* Active Prompt Header */}
              <div className="mb-4 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-sans text-[0.58rem] tracking-[0.18em] uppercase text-stone-500">
                    Quiet Reflection
                  </span>

                  {currentLibraryAnswer.trim().length > 0 && (
                    <span className="flex items-center gap-1 font-sans text-[0.55rem] tracking-[0.12em] uppercase text-[#C9B99A]/75">
                      <span className="w-1 h-1 rounded-full bg-[#C9B99A] animate-pulse" />
                      Draft saved
                    </span>
                  )}
                </div>

                <div className="py-2 px-0.5">
                  <p className="font-serif-nook text-stone-300 text-base sm:text-[1.05rem] font-normal italic leading-relaxed tracking-wide">
                    "{activePrompt}"
                  </p>
                </div>
              </div>

              {/* Free-Write Textarea */}
              <div className="flex-1 overflow-y-auto min-h-[140px] mb-4 pr-1">
                <textarea
                  ref={libraryTextareaRef}
                  id="library-reflect-textarea"
                  value={currentLibraryAnswer}
                  onChange={e => handleLibraryTextChange(e.target.value)}
                  placeholder="Take your time. There is no right way to answer…"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  className={`
                    w-full bg-transparent resize-none outline-none border-none
                    ${getFontFamilyClass(font)} text-neutral-200/90 text-[0.98rem] font-light leading-[1.85] tracking-wide
                    placeholder:text-stone-500 placeholder:text-sm placeholder:font-serif placeholder:italic placeholder:font-normal min-h-[140px]
                  `}
                  style={{ height: 'auto' }}
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="shrink-0 pt-3 border-t border-neutral-800/80">
              {/* Feedback toast */}
              <div
                className={`
                  text-center font-sans text-[0.6rem] tracking-[0.2em] uppercase transition-all duration-500 mb-3
                  ${isSaved ? 'text-[#C9B99A] opacity-100' : 'opacity-0'}
                `}
                aria-live="polite"
              >
                Kept in memory chest
              </div>

              <div className="flex items-center justify-between">
                <button
                  id="library-clear-btn"
                  onClick={handleClearLibraryPrompt}
                  disabled={!currentLibraryAnswer}
                  className="
                    font-sans text-[0.62rem] tracking-[0.14em] uppercase
                    text-neutral-500 hover:text-neutral-300
                    disabled:opacity-20 disabled:cursor-not-allowed
                    transition-colors duration-200 focus:outline-none cursor-pointer
                  "
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => setShowTypefaceModal(true)}
                  className="
                    font-sans text-[0.6rem] tracking-[0.14em] uppercase
                    text-neutral-500 hover:text-neutral-300
                    transition-colors duration-200 focus:outline-none cursor-pointer
                  "
                >
                  Typeface
                </button>

                <button
                  id="library-save-btn"
                  onClick={handleSaveLibraryReflection}
                  disabled={!currentLibraryAnswer.trim()}
                  className="
                    px-3.5 py-1.5 rounded-full bg-[#1D1B16] border border-[#C9B99A]/60 text-[#FFFFFF]
                    font-serif-nook text-xs font-light tracking-wide hover:bg-[#26231C]
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-200 focus:outline-none cursor-pointer shadow-sm
                  "
                >
                  Save to Chest
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════
             Tier 2: Clean Minimalist Category List & Drawer
             (Styled identically to Tune Down's list rows)
             ═════════════════════════════════════════════════════ */
          <div className="flex-1 overflow-y-auto min-h-0 animate-fade-in pr-0.5">
            <nav id="reflect-prompt-list" aria-label="Reflect prompt categories" className="flex flex-col">
              {REFLECT_CATEGORIES.map((cat, index) => {
                const isOpen = expandedCategory === cat.id
                const showDivider = index < REFLECT_CATEGORIES.length - 1

                return (
                  <div key={cat.id} className="w-full">
                    {/* Category Header Row */}
                    <button
                      id={`category-toggle-${cat.id}`}
                      onClick={() => setExpandedCategory(isOpen ? null : cat.id)}
                      className="
                        w-full flex items-center justify-between
                        py-4 px-1
                        group
                        transition-all duration-300
                        focus:outline-none
                        text-left cursor-pointer
                      "
                      aria-expanded={isOpen}
                    >
                      <span className="
                        font-serif-nook text-neutral-300 text-[1.12rem] font-light
                        tracking-wide leading-snug
                        group-hover:text-[#C9B99A] transition-colors duration-300
                      ">
                        {cat.name}
                      </span>

                      <span
                        className={`
                          text-neutral-500 text-sm font-light leading-none
                          transition-transform duration-300
                          group-hover:text-[#C9B99A]
                          ml-4 shrink-0
                          ${isOpen ? 'rotate-90 text-[#C9B99A]' : ''}
                        `}
                        aria-hidden="true"
                      >
                        ›
                      </span>
                    </button>

                    {/* Smooth Borderless Prompts Drawer */}
                    {isOpen && (
                      <div className="pb-3 pt-1 flex flex-col animate-fade-in">
                        {cat.prompts.map((p, pIdx) => {
                          const isLastPrompt = pIdx === cat.prompts.length - 1
                          return (
                            <div
                              key={pIdx}
                              onClick={() => setActivePrompt(p)}
                              className={`
                                py-3 px-2 group cursor-pointer transition-colors duration-200
                                hover:bg-[#16161C]/50 rounded-lg
                                ${!isLastPrompt ? 'border-b border-[#1A1A22]' : ''}
                              `}
                            >
                              <p className="font-serif-nook text-stone-300/90 text-sm md:text-[0.95rem] font-light italic leading-relaxed group-hover:text-[#FFFFFF] transition-colors">
                                "{p}"
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* 1px Faint Divider between Category Rows */}
                    {showDivider && <div className="h-px w-full bg-[#1F1F24]" />}
                  </div>
                )
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Typeface Selection Modal */}
      <TypefaceModal
        isOpen={showTypefaceModal}
        onClose={() => setShowTypefaceModal(false)}
        onSelectFont={setFont}
      />
    </main>
  )
}
