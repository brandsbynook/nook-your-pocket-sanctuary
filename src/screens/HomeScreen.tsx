import { useState } from 'react'
import { useGreeting }      from '../hooks/useGreeting'
import QuietToggle         from '../components/QuietToggle'
import DeadlineGlyph       from '../components/DeadlineGlyph'
import MenuRow             from '../components/MenuRow'
import FooterNav           from '../components/FooterNav'
import QuietModeOverlay    from '../components/QuietModeOverlay'
import { loadSettings }     from '../utils/storage'

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

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const greeting = useGreeting()
  const settings = loadSettings()
  const [quietMode, setQuietMode] = useState<boolean>(false)

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
            {/* Left: wordmark + quiet toggle in a single row */}
            <div className="flex items-center gap-3">
              <h1 className="
                font-serif-nook text-[#E5E0D8]
                text-xl font-light tracking-[0.22em] leading-none
              ">
                nook.
              </h1>
              <QuietToggle
                active={quietMode}
                onToggle={(active) => setQuietMode(active)}
              />
            </div>

            {/* Right: deadline glyph */}
            <DeadlineGlyph />
          </header>

          {/* ── Greeting ───────────────────────────────────────── */}
          {settings.showGreeting && (
            <section
              id="greeting-section"
              className="mt-10 mb-8 animate-lift-in"
              aria-label="Greeting"
              style={{ animationDelay: '100ms', animationFillMode: 'both' }}
            >
              <p className="
                font-serif-nook text-[#E5E0D8]/85
                text-[1.85rem] font-light leading-[1.2] tracking-[-0.01em]
              ">
                {greeting.headline}
              </p>
              <p className="
                font-serif-nook text-[#71717A]
                text-[1.3rem] font-light italic leading-snug tracking-wide
                mt-[2px]
              ">
                {greeting.subline}
              </p>
            </section>
          )}

          {/* ── Primary Menu ───────────────────────────────────── */}
          <nav id="primary-menu" aria-label="Primary menu" className={settings.showGreeting ? '' : 'mt-10'}>
            {/* Top divider */}
            <div className="h-px w-full bg-[#242424] mb-0" />

            {menuItems.map((item, i) => (
              <MenuRow
                key={item.id}
                id={item.id}
                title={item.title}
                subtitle={item.subtitle}
                delay={160 + i * 65}
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

          {/* ── Anchor tagline ─────────────────────────────────── */}
          <p
            id="bottom-tagline"
            className="
              font-sans text-[#52525B] text-[0.62rem]
              tracking-[0.18em] italic text-center
              mt-7 animate-fade-in
            "
            style={{ animationDelay: '600ms', animationFillMode: 'both' }}
          >
            Nothing to fix, nowhere to be.
          </p>
        </div>

        {/* ═══ Footer Navigation ══════════════════════════════════ */}
        <FooterNav onSelect={(tab) => onNavigate(tab as Screen)} />
      </main>

      {/* ── Quiet Mode Sensory Overlay ────────────────────────── */}
      <QuietModeOverlay
        isOpen={quietMode}
        onClose={() => setQuietMode(false)}
      />
    </>
  )
}
