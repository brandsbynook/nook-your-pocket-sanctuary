import { useState } from 'react'
import QuietModeOverlay from '../components/QuietModeOverlay'
import QuietToggle from '../components/QuietToggle'
import DeadlineGlyph from '../components/DeadlineGlyph'
import { loadSettings } from '../utils/storage'
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

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const greeting = useGreeting()
  const [showGreetingSetting] = useState<boolean>(() => loadSettings().showGreeting ?? true)
  const [isQuietModeOpen, setIsQuietModeOpen] = useState(false)

  return (
    <>
      <main
        id="home-screen"
        className="
          min-h-[100dvh] w-full
          px-6 pt-10 pb-6
          flex flex-col justify-between
          overflow-y-auto
          bg-[#0A0A0B] select-none
          animate-fade-in
        "
      >
        {/* ═══ Top Section (Brand Stack & Sub-row Cluster) ════════ */}
        <div className="flex flex-col shrink-0">
          {/* ── 1. Centered Brand Header ─── */}
          <header className="flex flex-col items-center text-center w-full">
            <h1 className="font-serif-nook text-3xl sm:text-4xl text-[#E5E5E7] tracking-[0.14em] lowercase font-light leading-none">
              nook.
            </h1>
            <p className="font-serif-nook text-xs sm:text-sm text-[#71717A] italic lowercase font-normal mt-2">
              your pocket sanctuary
            </p>
          </header>

          {/* ── 2. Utility Row: Quiet Leaf Button & Deadline Glyph ── */}
          <div className="flex items-center justify-between mt-6 mb-4 px-2">
            <QuietToggle active={isQuietModeOpen} onToggle={(active) => setIsQuietModeOpen(active)} />
            <DeadlineGlyph />
          </div>
        </div>

        {/* ═══ Lifted Center Content (Greeting & 5 Core Rooms) ═══ */}
        <div className="flex-1 flex flex-col justify-start max-w-md mx-auto w-full px-1">
          {/* ── 3. Faded & Re-centered Dynamic Greeting ─────────── */}
          {showGreetingSetting && greeting ? (
            <div className="mt-8 pb-5 text-center animate-lift-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
              <p className="font-serif-nook text-sm text-[#71717A] font-normal italic tracking-wide leading-relaxed text-center">
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
                    w-full text-left py-5 flex flex-col items-start gap-[2px]
                    group cursor-pointer transition-colors
                    focus:outline-none
                  "
                >
                  <h2 className="font-serif-nook text-xl text-[#E5E5E7] font-light tracking-wide group-hover:text-[#FFFFFF] group-active:text-[#FFFFFF] transition-colors">
                    {item.title}
                  </h2>
                  <p className="font-sans text-[13px] text-[#71717A] tracking-normal mt-1 group-hover:text-[#A1A1AA] transition-colors">
                    {item.subtitle}
                  </p>
                </button>
                {index < PRIMARY_MENU.length - 1 && (
                  <div className="border-b border-[#1F1F23] w-full" />
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* ═══ 4. Clean Footer ═════════════════════════════════════ */}
        <div className="flex flex-col items-center mt-4 pb-4">
          <footer className="w-full pt-4 border-t border-[#1F1F23] flex items-center justify-between px-2">
            <button
              onClick={() => onNavigate('cards')}
              className="font-sans text-[10px] tracking-[0.2em] text-[#52525B] uppercase hover:text-[#E5E5E7] transition-colors focus:outline-none"
            >
              Cards
            </button>
            <button
              onClick={() => onNavigate('memory-chest')}
              className="font-sans text-[10px] tracking-[0.2em] text-[#52525B] uppercase hover:text-[#E5E5E7] transition-colors focus:outline-none"
            >
              Memory Chest
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="font-sans text-[10px] tracking-[0.2em] text-[#52525B] uppercase hover:text-[#E5E5E7] transition-colors focus:outline-none"
            >
              Settings
            </button>
          </footer>
        </div>
      </main>

      {/* ── Dedicated Home Quiet Mode Overlay ──────────────────── */}
      <QuietModeOverlay
        isOpen={isQuietModeOpen}
        onClose={() => setIsQuietModeOpen(false)}
      />
    </>
  )
}
