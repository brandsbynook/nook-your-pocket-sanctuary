import { useState, useEffect, useCallback } from 'react'
import DeadlineModal from '../components/DeadlineModal'
import QuietModeOverlay from '../components/QuietModeOverlay'
import HeaderAudioShortcut from '../components/HeaderAudioShortcut'
import { loadDeadlines, loadSettings, type NookDeadline } from '../utils/storage'
import { useGreeting } from '../hooks/useGreeting'

export type Screen = 'home' | 'brain-dump' | 'reflect' | 'companion' | 'tune-down' | 'soundscapes' | 'cards' | 'settings' | 'memory-chest'

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void
}

interface MenuItem {
  id: Screen
  title: string
  subtitle: string
}

const PRIMARY_MENU: MenuItem[] = [
  {
    id: 'brain-dump',
    title: 'Brain Dump',
    subtitle: 'unload the stories — unfiltered, unjudged.',
  },
  {
    id: 'reflect',
    title: 'Reflect',
    subtitle: 'unhurried prompts for quiet clarity',
  },
  {
    id: 'companion',
    title: 'Companion',
    subtitle: 'quiet company while you work',
  },
  {
    id: 'tune-down',
    title: 'Tune Down',
    subtitle: 'sensory regulation & stillness',
  },
  {
    id: 'soundscapes',
    title: 'Soundscapes',
    subtitle: 'generative ambient layers',
  },
]

const HORIZON_DAYS = 14

function getTimelineFillPercent(dueDateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDateStr)
  due.setHours(0, 0, 0, 0)
  const diffTime = due.getTime() - today.getTime()
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  const ratio = Math.max(0.15, Math.min(1, (HORIZON_DAYS - daysLeft) / HORIZON_DAYS))
  return ratio * 100
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const greeting = useGreeting()
  const [showGreetingSetting] = useState<boolean>(() => loadSettings().showGreeting ?? true)
  const [deadlines, setDeadlines] = useState<NookDeadline[]>([])
  const [isAnchorModalOpen, setIsAnchorModalOpen] = useState(false)
  const [isQuietModeOpen, setIsQuietModeOpen] = useState(false)

  const refreshAnchors = useCallback(() => {
    const all = loadDeadlines()
    const todayStr = new Date().toISOString().split('T')[0]
    const active = all
      .filter(d => d.dueDate >= todayStr)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    setDeadlines(active)
  }, [])

  useEffect(() => {
    refreshAnchors()
  }, [refreshAnchors])

  return (
    <>
      <main
        id="home-screen"
        className="
          h-[100dvh] max-w-md mx-auto
          px-6 pt-10 pb-6
          flex flex-col justify-between
          overflow-hidden
          bg-[#0B0B0E] select-none
          animate-fade-in
        "
      >
        {/* ═══ Top Section (Brand Stack & Sub-row Cluster) ════════ */}
        <div className="flex flex-col shrink-0">
          {/* ── 1. Brand Header with Universal Audio Shortcut ─── */}
          <header className="flex items-start justify-between w-full">
            <div className="flex flex-col items-start">
              <h1 className="font-serif-nook text-xl text-neutral-200 tracking-[0.14em] lowercase font-light leading-none">
                nook.
              </h1>
              <p className="font-serif-nook text-xs text-neutral-500 italic lowercase font-normal mt-1">
                your pocket sanctuary
              </p>
            </div>

            <div className="flex items-center">
              <HeaderAudioShortcut />
            </div>
          </header>

          {/* ── 2. Shared Baseline Sub-row: "Quiet" Toggle & Deadline Reminder ── */}
          <div className="flex items-center justify-between mt-5 px-0.5">
            {/* Minimalist Quiet Mode Toggle */}
            <button
              id="home-quiet-mode-toggle"
              role="switch"
              aria-checked={isQuietModeOpen}
              onClick={() => setIsQuietModeOpen(prev => !prev)}
              className="flex items-center gap-2 group cursor-pointer focus:outline-none py-1"
              aria-label="Toggle Quiet Mode"
            >
              <span className="font-serif-nook italic text-xs text-stone-500 tracking-wider group-hover:text-stone-400 transition-colors">
                Quiet
              </span>

              {/* Delicate Muted Switch */}
              <span
                className={`
                  w-7 h-3.5 rounded-full p-[2px] transition-colors duration-300 ease-in-out relative flex items-center shrink-0
                  ${isQuietModeOpen
                    ? 'bg-[#383329] border border-[#5E523E]'
                    : 'bg-[#18181E] border border-[#24242C]'
                  }
                `}
              >
                <span
                  className={`
                    w-2.5 h-2.5 rounded-full shadow-sm transform transition-transform duration-300 ease-in-out
                    ${isQuietModeOpen ? 'translate-x-3.5 bg-[#C9B99A]' : 'translate-x-0 bg-[#52525B]'}
                  `}
                />
              </span>
            </button>

            {/* Visual Deadline Reminder (Anchors) */}
            <button
              id="deadline-timeline-bars"
              onClick={() => setIsAnchorModalOpen(true)}
              className="flex flex-col items-end gap-1 p-1 group cursor-pointer focus:outline-none"
              title="Visual deadline anchors (tap to manage)"
              aria-label="Visual deadline anchors"
            >
              {[0, 1, 2].map(index => {
                const deadline = deadlines[index]
                const fillPercent = deadline ? getTimelineFillPercent(deadline.dueDate) : 0
                return (
                  <div
                    key={index}
                    className="w-10 h-[2px] rounded-full bg-neutral-800/90 overflow-hidden flex justify-start transition-all duration-300 group-hover:bg-neutral-700/80"
                  >
                    {deadline ? (
                      <div
                        className="h-full bg-neutral-300/80 rounded-full transition-all duration-500"
                        style={{ width: `${fillPercent}%` }}
                      />
                    ) : null}
                  </div>
                )
              })}
            </button>
          </div>
        </div>

        {/* ═══ Lifted Center Content (Greeting & 5 Core Rooms) ═══ */}
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full my-auto px-1">
          {/* ── 3. Faded & Re-centered Dynamic Greeting ─────────── */}
          {showGreetingSetting && greeting ? (
            <div className="pb-5 text-center animate-lift-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
              <p className="font-serif-nook text-sm text-neutral-500/80 font-normal italic tracking-wide leading-relaxed text-center">
                {greeting}
              </p>
            </div>
          ) : (
            <div className="pb-3" />
          )}

          {/* ── 4. Lifted 5-Room Navigation List ────────────────── */}
          <nav aria-label="Sanctuary practices" className="flex flex-col w-full max-w-[300px] sm:max-w-[320px] mx-auto">
            {PRIMARY_MENU.map((item, index) => (
              <div key={item.id} className="w-full">
                <button
                  id={`home-menu-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className="
                    w-full text-left py-2.5 sm:py-3 flex flex-col items-start gap-[2px]
                    group transition-colors duration-200
                    focus:outline-none cursor-pointer
                  "
                >
                  <span className="font-serif-nook text-[1.05rem] text-neutral-300 font-light tracking-wide group-hover:text-neutral-100 transition-colors duration-200">
                    {item.title}
                  </span>
                  <span className="font-sans text-xs text-neutral-500/80 font-normal mt-0.5 transition-colors duration-200 group-hover:text-neutral-400">
                    {item.subtitle}
                  </span>
                </button>
                {index < PRIMARY_MENU.length - 1 && (
                  <div className="h-px w-full bg-neutral-800/70" />
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* ═══ 4. Clean Footer ═════════════════════════════════════ */}
        <div className="flex flex-col items-center mt-12">
          <footer className="w-full pt-4 border-t border-neutral-900/90 flex items-center justify-between px-2">
            <button
              onClick={() => onNavigate('cards')}
              className="font-sans text-[10px] tracking-[0.2em] text-neutral-500 uppercase hover:text-neutral-300 transition-colors focus:outline-none"
            >
              Cards
            </button>
            <button
              onClick={() => onNavigate('memory-chest')}
              className="font-sans text-[10px] tracking-[0.2em] text-neutral-500 uppercase hover:text-neutral-300 transition-colors focus:outline-none"
            >
              Memory Chest
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="font-sans text-[10px] tracking-[0.2em] text-neutral-500 uppercase hover:text-neutral-300 transition-colors focus:outline-none"
            >
              Settings
            </button>
          </footer>
        </div>
      </main>

      {/* ── Solid Opaque Anchors Modal ────────────────────────── */}
      <DeadlineModal
        isOpen={isAnchorModalOpen}
        onClose={() => setIsAnchorModalOpen(false)}
        onUpdate={refreshAnchors}
      />

      {/* ── Dedicated Home Quiet Mode Overlay ──────────────────── */}
      <QuietModeOverlay
        isOpen={isQuietModeOpen}
        onClose={() => setIsQuietModeOpen(false)}
      />
    </>
  )
}
