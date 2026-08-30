import { useState, useEffect, useCallback } from 'react'
import QuietToggle         from '../components/QuietToggle'
import DeadlineModal       from '../components/DeadlineModal'
import MenuRow             from '../components/MenuRow'
import FooterNav           from '../components/FooterNav'
import QuietModeOverlay    from '../components/QuietModeOverlay'
import { loadSettings, loadDeadlines, type NookDeadline } from '../utils/storage'

const menuItems = [
  {
    id:       'menu-brain-dump',
    title:    'Brain Dump',
    subtitle: "offload whatever's in your head",
  },
  {
    id:       'menu-reflect',
    title:    'Reflect',
    subtitle: 'gentle prompts, no pressure',
  },
  {
    id:       'menu-companion',
    title:    'Companion',
    subtitle: 'a quiet presence when you need one',
  },
  {
    id:       'menu-tune-down',
    title:    'Tune Down',
    subtitle: 'sounds and stillness',
  },
]

export type Screen = 'home' | 'brain-dump' | 'reflect' | 'companion' | 'tune-down' | 'cards' | 'settings' | 'memory-chest'

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void
}

function getCalmGreetingLine(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) {
    return 'The world is still quiet. So are we.'
  } else if (hour >= 12 && hour < 18) {
    return 'Take your time. There is no rush.'
  } else if (hour >= 18 && hour < 22) {
    return 'The quiet hours are yours.'
  } else {
    return 'Nothing to fix, nowhere to be.'
  }
}

function getRelativeDaysText(dueDateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDateStr)
  due.setHours(0, 0, 0, 0)

  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'past'
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays < 7) return `in ${diffDays} days`
  if (diffDays < 14) return 'in 1 week'
  const weeks = Math.round(diffDays / 7)
  return `in ${weeks} weeks`
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const calmGreeting = getCalmGreetingLine()
  const settings = loadSettings()
  const [quietMode, setQuietMode] = useState<boolean>(false)
  const [deadlines, setDeadlines] = useState<NookDeadline[]>([])
  const [isAnchorModalOpen, setIsAnchorModalOpen] = useState(false)

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

  const nearestAnchor = deadlines[0]

  return (
    <>
      <main
        id="home-screen"
        className={`
          h-[100dvh] max-w-[420px] mx-auto
          px-6 pt-10 pb-6
          flex flex-col justify-between
          overflow-hidden
          bg-[#0E0E0E]
          transition-opacity duration-800 ease-in-out
          ${quietMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
      >
        {/* ═══ Upper block ════════════════════════════════════════ */}
        <div className="flex flex-col">

          {/* ── Header ─────────────────────────────────────────── */}
          <header
            id="app-header"
            className="flex items-center justify-between animate-fade-in"
          >
            {/* Left: wordmark + quiet toggle + brand subtitle */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="
                  font-serif-nook text-neutral-300
                  text-xl font-light tracking-[0.22em] leading-none
                ">
                  nook.
                </h1>
                <QuietToggle
                  active={quietMode}
                  onToggle={(active) => setQuietMode(active)}
                />
              </div>
              <span className="text-xs text-neutral-400 font-normal font-sans tracking-wide mt-1">
                your pocket sanctuary
              </span>
            </div>
          </header>

          {/* ── Single Calm Greeting Line (No quotes) ──────────── */}
          {settings.showGreeting && (
            <section
              id="greeting-section"
              className="mt-8 mb-4 animate-lift-in text-center"
              aria-label="Greeting"
              style={{ animationDelay: '100ms', animationFillMode: 'both' }}
            >
              <p className="w-full italic font-serif-nook text-sm md:text-base text-neutral-400 font-normal leading-relaxed">
                {calmGreeting}
              </p>
            </section>
          )}

          {/* ── Nearest Upcoming Anchor / Set Anchor Banner ─────────── */}
          <div className="mb-6 flex justify-center animate-lift-in" style={{ animationDelay: '140ms', animationFillMode: 'both' }}>
            <button
              id="home-anchor-card"
              onClick={() => setIsAnchorModalOpen(true)}
              className="
                px-4 py-1.5 rounded-full
                bg-neutral-900/60 hover:bg-neutral-800/70 border border-neutral-800/80 hover:border-neutral-700
                backdrop-blur-md transition-all duration-300
                flex items-center gap-2 max-w-full text-left group focus:outline-none cursor-pointer
              "
            >
              {nearestAnchor ? (
                <>
                  <span className="text-[#C9B99A] text-xs leading-none">✦</span>
                  <span className="font-serif-nook text-neutral-300 text-xs md:text-sm font-normal truncate max-w-[180px] sm:max-w-[220px]">
                    {nearestAnchor.title}
                  </span>
                  <span className="text-neutral-600 text-xs">•</span>
                  <span className="font-sans text-[0.62rem] text-neutral-400 tracking-wide lowercase shrink-0">
                    {getRelativeDaysText(nearestAnchor.dueDate)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-neutral-500 text-xs leading-none">+</span>
                  <span className="font-sans text-neutral-400 text-[0.68rem] tracking-wider uppercase group-hover:text-neutral-300 transition-colors">
                    set an anchor
                  </span>
                </>
              )}
            </button>
          </div>

          {/* ── Primary Menu ───────────────────────────────────── */}
          <nav id="primary-menu" aria-label="Primary menu">
            {menuItems.map((item, i) => (
              <MenuRow
                key={item.id}
                id={item.id}
                title={item.title}
                subtitle={item.subtitle}
                delay={160 + i * 65}
                showDivider={i < menuItems.length - 1}
                onClick={
                  item.id === 'menu-brain-dump'
                    ? () => onNavigate('brain-dump')
                    : item.id === 'menu-reflect'
                    ? () => onNavigate('reflect')
                    : item.id === 'menu-companion'
                    ? () => onNavigate('companion')
                    : item.id === 'menu-tune-down'
                    ? () => onNavigate('tune-down')
                    : undefined
                }
              />
            ))}
          </nav>
        </div>

        {/* ═══ Footer Navigation ══════════════════════════════════ */}
        <FooterNav onSelect={(tab) => onNavigate(tab as Screen)} />
      </main>

      {/* ── Anchors / Deadlines Modal ─────────────────────────── */}
      <DeadlineModal
        isOpen={isAnchorModalOpen}
        onClose={() => setIsAnchorModalOpen(false)}
        onUpdate={refreshAnchors}
      />

      {/* ── Quiet Mode Sensory Overlay ────────────────────────── */}
      <QuietModeOverlay
        isOpen={quietMode}
        onClose={() => setQuietMode(false)}
      />
    </>
  )
}
