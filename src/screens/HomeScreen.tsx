import { useState } from 'react'
import QuietModeOverlay from '../components/QuietModeOverlay'
import QuietToggle from '../components/QuietToggle'
import DeadlineGlyph from '../components/DeadlineGlyph'
import { loadSettings } from '../utils/storage'
import { useGreeting } from '../hooks/useGreeting'
import { hapticLight } from '../utils/haptics'

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
          h-full w-full
          px-6 sm:px-8
          flex flex-col justify-between
          overflow-hidden
          select-none
          bg-[#0A0A0B]
          animate-fade-in
        "
      >
        {/* ── UPPER BUFFER 1: Screen Top → Layer 1 (Header) ── */}
        <div className="flex-[0.6] min-h-2" />

        {/* ── LAYER 1: Header + Tagline ── */}
        <header className="w-full shrink-0 flex flex-col items-center text-center">
          <h1 className="font-serif-nook text-3xl sm:text-4xl text-[#E5E5E7] tracking-[0.14em] lowercase font-light leading-none">
            nook.
          </h1>
          <p className="font-serif-nook text-xs sm:text-sm text-[#71717A] italic lowercase font-normal mt-1.5 sm:mt-2">
            your pocket sanctuary
          </p>
        </header>

        {/* ── UPPER BUFFER 2: Layer 1 → Layer 2 (Nearly 1:1 with Buffer 1) ── */}
        <div className="flex-[0.6] min-h-2" />

        {/* ── LAYER 2: Horizon (Utility Row & Greeting) ── */}
        <div className="w-full shrink-0 px-2 flex flex-col">
          <div className="flex items-center justify-between mb-2 w-full">
            <QuietToggle active={isQuietModeOpen} onToggle={(active) => setIsQuietModeOpen(active)} />
            <DeadlineGlyph />
          </div>

          {showGreetingSetting && greeting ? (
            <div className="text-center animate-lift-in">
              <p className="font-serif-nook text-xs sm:text-sm text-[#71717A] font-normal italic tracking-wide leading-relaxed text-center">
                {greeting}
              </p>
            </div>
          ) : null}
        </div>

        {/* ── UPPER BUFFER 3: Layer 2 → Layer 3 (Nearly 1:1 with Upper Buffers) ── */}
        <div className="flex-[0.6] min-h-2" />

        {/* ── LAYER 3: The 5 Practices (Core Anchor) ── */}
        <nav aria-label="Sanctuary practices" className="flex flex-col w-full px-2 shrink-0">
          {PRIMARY_MENU.map((item, index) => (
            <div key={item.id} className="w-full">
              <button
                id={`home-menu-${item.id}`}
                onClick={() => {
                  hapticLight()
                  onNavigate(item.id)
                }}
                className="
                  w-full text-left py-2 sm:py-2.5 flex flex-col items-start gap-[2px]
                  group cursor-pointer transition-colors
                  focus:outline-none
                "
              >
                <h2 className="font-serif-nook text-[20px] sm:text-2xl text-[#E5E5E7] font-light tracking-wide group-hover:text-[#FFFFFF] group-active:text-[#FFFFFF] transition-colors leading-snug">
                  {item.title}
                </h2>
                <p className="font-sans text-[12.5px] sm:text-sm text-[#71717A] tracking-normal mt-0.5 group-hover:text-[#A1A1AA] transition-colors leading-normal">
                  {item.subtitle}
                </p>
              </button>
              {index < PRIMARY_MENU.length - 1 && (
                <div className="border-b border-[#1F1F23] w-full" />
              )}
            </div>
          ))}
        </nav>

        {/* ── BASE BUFFER: Layer 3 → Layer 4 (Enforces upward bias: Base > Upper) ── */}
        <div className="flex-[2.6] min-h-4" />

        {/* ── LAYER 4: Footer ── */}
        <footer className="w-full shrink-0 pb-[clamp(1rem,2.8vh,2rem)] pt-3 sm:pt-4 border-t border-[#1F1F23] flex items-center justify-between px-2">
          <button
            onClick={() => onNavigate('cards')}
            className="font-sans text-[11px] tracking-[0.22em] text-[#52525B] uppercase hover:text-[#E5E5E7] transition-colors focus:outline-none"
          >
            Cards
          </button>
          <button
            onClick={() => onNavigate('memory-chest')}
            className="font-sans text-[11px] tracking-[0.22em] text-[#52525B] uppercase hover:text-[#E5E5E7] transition-colors focus:outline-none"
          >
            Memory Chest
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="font-sans text-[11px] tracking-[0.22em] text-[#52525B] uppercase hover:text-[#E5E5E7] transition-colors focus:outline-none"
          >
            Settings
          </button>
        </footer>
      </main>

      <QuietModeOverlay
        isOpen={isQuietModeOpen}
        onClose={() => setIsQuietModeOpen(false)}
      />
    </>
  )
}
