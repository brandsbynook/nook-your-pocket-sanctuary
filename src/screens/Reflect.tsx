import { useState, useRef, useEffect } from 'react'
import { saveReflectionEntry, getEditorFont, type EditorFont } from '../utils/storage'
import HeaderAudioShortcut from '../components/HeaderAudioShortcut'
import TypefaceModal, { getFontFamilyClass } from '../components/TypefaceModal'

type ReflectTab = 'guided' | 'library'

interface PromptCategory {
  id: string
  title: string
  prompts: string[]
}

const DRAFTS_STORAGE_KEY = 'nook:reflect-drafts'

const CATEGORIES: PromptCategory[] = [
  {
    id: 'overwhelm',
    title: 'De-escalation & Overwhelm',
    prompts: [
      'What is taking up the most weight in your mind right now?',
      'If you could set down one expectation for the next hour, what would it be?',
      'What does your body need at this exact moment to feel 5% more at ease?',
    ],
  },
  {
    id: 'boundaries',
    title: 'Boundary & Energy Check',
    prompts: [
      'Name one thing you can let be unresolved today.',
      'What is asking for your energy right now that does not deserve it?',
      'Where in your day did you give more than you had to spare?',
    ],
  },
  {
    id: 'brainfog',
    title: 'Untangling Brain Fog',
    prompts: [
      'What is the single smallest step that would make you feel lighter?',
      'What are three facts about right now that are completely true and quiet?',
    ],
  },
  {
    id: 'compassion',
    title: 'Soft Self-Compassion',
    prompts: [
      'What expectation can you quietly set down?',
      'What would you say to a dear friend experiencing this exact moment?',
      'What is one small kindness you can offer yourself before this day ends?',
    ],
  },
]

const ALL_PROMPTS = CATEGORIES.flatMap(c => c.prompts)

function loadDrafts(): Record<number, string> {
  try {
    return JSON.parse(localStorage.getItem(DRAFTS_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function persistDrafts(drafts: Record<number, string>) {
  localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts))
}

interface ReflectProps {
  onBack: () => void
}

export default function Reflect({ onBack }: ReflectProps) {
  const [activeTab, setActiveTab] = useState<ReflectTab>('guided')
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0)
  const [drafts, setDrafts] = useState<Record<number, string>>(() => loadDrafts())
  const [isSaved, setIsSaved] = useState<boolean>(false)
  const [isFadingPrompt, setIsFadingPrompt] = useState<boolean>(false)
  const [openCategory, setOpenCategory] = useState<string>('overwhelm')
  const [font, setFont] = useState<EditorFont>(() => getEditorFont())
  const [showTypefaceModal, setShowTypefaceModal] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const currentPrompt = ALL_PROMPTS[currentPromptIndex] || ALL_PROMPTS[0]
  const currentAnswer = drafts[currentPromptIndex] || ''

  // Auto-expand textarea on answer change or prompt switch
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [currentAnswer, currentPromptIndex, activeTab])

  function handleTextChange(val: string) {
    const next = { ...drafts, [currentPromptIndex]: val }
    setDrafts(next)
    persistDrafts(next)
  }

  function handleNavigatePrompt(direction: 'prev' | 'next') {
    setIsFadingPrompt(true)
    setTimeout(() => {
      if (direction === 'next') {
        setCurrentPromptIndex(prev => (prev + 1) % ALL_PROMPTS.length)
      } else {
        setCurrentPromptIndex(prev => (prev - 1 + ALL_PROMPTS.length) % ALL_PROMPTS.length)
      }
      setIsFadingPrompt(false)
    }, 200)
  }

  function handleSave() {
    if (!currentAnswer.trim()) return
    saveReflectionEntry(currentPrompt, currentAnswer.trim())
    
    // Clear only this prompt's draft
    const next = { ...drafts }
    delete next[currentPromptIndex]
    setDrafts(next)
    persistDrafts(next)

    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2400)
  }

  function handleClear() {
    const next = { ...drafts }
    delete next[currentPromptIndex]
    setDrafts(next)
    persistDrafts(next)
  }

  return (
    <main
      id="reflect-screen"
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
        {/* ── Top Bar ─────────────────────────────────────────── */}
        <header className="flex items-center justify-between mb-5 shrink-0">
          <button
            id="reflect-back"
            onClick={onBack}
            className="
              flex items-center gap-1.5
              font-sans text-[#52525B] text-[0.62rem]
              tracking-[0.14em] uppercase
              hover:text-[#71717A] transition-colors
              focus:outline-none py-1
            "
          >
            <span className="text-[0.8rem] leading-none">←</span>
            return
          </button>

          <div className="flex flex-col items-center gap-[2px]">
            <h1 className="font-serif-nook text-neutral-300 text-xl font-light tracking-[0.18em] leading-none">
              Reflect
            </h1>
            <p className="font-sans text-neutral-600 text-[0.58rem] tracking-[0.1em] text-center">
              gentle prompts, no pressure
            </p>
          </div>

          <div className="flex items-center justify-end min-w-[60px]">
            <HeaderAudioShortcut />
          </div>
        </header>

        {/* ── Tabs (Guided Flow vs Library) ───────────────────── */}
        <div
          role="tablist"
          aria-label="Reflection modes"
          className="flex items-center mb-5 border-b border-[#1E1E1E] shrink-0"
        >
          <button
            id="tab-guided"
            role="tab"
            aria-selected={activeTab === 'guided'}
            onClick={() => setActiveTab('guided')}
            className="
              relative flex-1 pb-3
              font-sans text-[0.58rem] tracking-[0.16em] uppercase
              transition-colors duration-300
              focus:outline-none
            "
          >
            <span className={activeTab === 'guided' ? 'text-[#E5E0D8]' : 'text-[#3A3A3A] hover:text-[#52525B]'}>
              Guided Flow
            </span>
            <span
              className={`
                absolute bottom-0 left-0 right-0 h-px
                transition-all duration-400
                ${activeTab === 'guided' ? 'bg-[#C9B99A] opacity-80' : 'bg-transparent'}
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
              focus:outline-none
            "
          >
            <span className={activeTab === 'library' ? 'text-[#E5E0D8]' : 'text-[#3A3A3A] hover:text-[#52525B]'}>
              Prompt Library
            </span>
            <span
              className={`
                absolute bottom-0 left-0 right-0 h-px
                transition-all duration-400
                ${activeTab === 'library' ? 'bg-[#C9B99A] opacity-80' : 'bg-transparent'}
              `}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* ── Tab Content ─────────────────────────────────────── */}
        {activeTab === 'guided' ? (
          /* Mode 1: Guided Flow */
          <div className="flex flex-col flex-1 min-h-0 animate-fade-in justify-between">
            <div className="flex flex-col flex-1 min-h-0">
              {/* Prompt Header with Bidirectional Navigation & Draft Indicator */}
              <div className="mb-5 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  {/* Left: Prompt Counter & Auto-save status */}
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-[0.58rem] tracking-[0.18em] uppercase text-[#71717A]">
                      {currentPromptIndex + 1} / {ALL_PROMPTS.length}
                    </span>
                    {currentAnswer.trim().length > 0 && (
                      <span className="flex items-center gap-1 font-sans text-[0.55rem] tracking-[0.12em] uppercase text-[#C9B99A]/70">
                        <span className="w-1 h-1 rounded-full bg-[#C9B99A] animate-pulse" />
                        draft saved
                      </span>
                    )}
                  </div>

                  {/* Right: Bidirectional Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      id="prev-prompt-btn"
                      onClick={() => handleNavigatePrompt('prev')}
                      aria-label="Previous prompt"
                      className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#52525B] hover:text-[#C9B99A] transition-colors focus:outline-none"
                    >
                      ‹ prev
                    </button>
                    <span className="text-[#333333] text-xs">|</span>
                    <button
                      id="next-prompt-btn"
                      onClick={() => handleNavigatePrompt('next')}
                      aria-label="Next prompt"
                      className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#52525B] hover:text-[#C9B99A] transition-colors focus:outline-none"
                    >
                      next ›
                    </button>
                  </div>
                </div>

                {/* Prompt Card with smooth fade — soft breathing invitation */}
                <div
                  className={`
                    py-3 px-1 transition-opacity duration-300 ease-in-out
                    ${isFadingPrompt ? 'opacity-0' : 'opacity-100'}
                  `}
                >
                  <p className="font-serif-nook text-neutral-400 text-base md:text-lg font-normal italic leading-relaxed">
                    "{currentPrompt}"
                  </p>
                </div>
              </div>

              {/* Distraction-free Writing Area (isolated per prompt) */}
              <div className="flex-1 overflow-y-auto min-h-[120px] mb-4">
                <textarea
                  ref={textareaRef}
                  id="reflect-textarea"
                  value={currentAnswer}
                  onChange={e => handleTextChange(e.target.value)}
                  placeholder="Reflect quietly..."
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  className={`
                    w-full bg-transparent resize-none outline-none border-none
                    ${getFontFamilyClass(font)} text-neutral-200/90 text-[0.98rem] font-light leading-[1.85] tracking-wide
                    placeholder:text-neutral-700 min-h-[100px]
                  `}
                  style={{ height: 'auto' }}
                />
              </div>
            </div>

            {/* Bottom Actions & Confirmation */}
            <div className="shrink-0 pt-3 border-t border-[#1C1C1C]">
              {/* Feedback toast */}
              <div
                className={`
                  text-center font-sans text-[0.6rem] tracking-[0.2em] uppercase transition-all duration-500 mb-3
                  ${isSaved ? 'text-[#C9B99A] opacity-100' : 'opacity-0'}
                `}
                aria-live="polite"
              >
                kept in memory chest
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    id="reflect-clear-btn"
                    onClick={handleClear}
                    disabled={!currentAnswer}
                    className="
                      font-sans text-[#52525B] text-[0.62rem] tracking-[0.16em] uppercase
                      hover:text-[#71717A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none
                    "
                  >
                    Clear / Let go
                  </button>

                  <span className="text-neutral-800 text-xs">•</span>

                  <button
                    id="reflect-typeface-btn"
                    type="button"
                    onClick={() => setShowTypefaceModal(true)}
                    className="
                      font-sans text-[#71717A] text-[0.62rem]
                      tracking-[0.16em] uppercase
                      transition-colors duration-300
                      hover:text-neutral-300 focus:outline-none flex items-center gap-1
                    "
                  >
                    <span>Typeface</span>
                  </button>
                </div>

                <button
                  id="reflect-save-btn"
                  onClick={handleSave}
                  disabled={!currentAnswer.trim()}
                  className="
                    px-5 py-2 rounded-xl border border-[#2A2A2A]
                    font-serif-nook text-[#E5E0D8] text-[0.95rem] font-light
                    hover:border-[#C9B99A]/40 hover:text-[#C9B99A]
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-300 focus:outline-none
                  "
                >
                  Save to Chest
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Mode 2: Prompt Library */
          <div className="flex-1 overflow-y-auto min-h-0 animate-fade-in pr-1">
            <div className="flex flex-col gap-3 pb-4">
              {CATEGORIES.map(cat => {
                const isOpen = openCategory === cat.id
                return (
                  <div
                    key={cat.id}
                    className="border border-[#1E1E1E] rounded-xl overflow-hidden bg-[#111111]/40"
                  >
                    <button
                      onClick={() => setOpenCategory(isOpen ? '' : cat.id)}
                      className="
                        w-full px-4 py-3.5 flex items-center justify-between
                        text-left font-serif-nook text-[#E5E0D8] text-[0.95rem]
                        hover:bg-[#161616] transition-colors focus:outline-none
                      "
                    >
                      <span>{cat.title}</span>
                      <span className="text-xs text-[#52525B] font-mono">{isOpen ? '−' : '+'}</span>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-3 flex flex-col gap-2.5 border-t border-[#1A1A1A] pt-2.5">
                        {cat.prompts.map((p, pIdx) => (
                          <div
                            key={pIdx}
                            onClick={() => {
                              const targetIdx = ALL_PROMPTS.indexOf(p)
                              if (targetIdx !== -1) {
                                setCurrentPromptIndex(targetIdx)
                                setActiveTab('guided')
                              }
                            }}
                            className="
                              p-2.5 rounded bg-[#161616]/60 hover:bg-[#1E1E1E]
                              cursor-pointer transition-colors group
                            "
                          >
                            <p className="font-serif-nook text-[#A1A1AA] text-xs font-light italic group-hover:text-[#E5E0D8]">
                              "{p}"
                            </p>
                            <span className="font-sans text-[0.55rem] tracking-[0.14em] uppercase text-[#52525B] mt-1 block">
                              Reflect with this →
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
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
