import { useState } from 'react'
import {
  setOnboarded,
  setCompanionChoice,
  setUserNickname,
  loadSettings,
  saveSettings,
  type ThemeId,
} from '../utils/storage'

interface OnboardingScreenProps {
  onComplete: () => void
}

/* ─────────────────────────────────────────────────────────────
   Minimal Line-Art Companion SVGs
───────────────────────────────────────────────────────────── */
function CatIcon() {
  return (
    <svg width="44" height="34" viewBox="0 0 120 90" fill="none" className="text-current">
      <path
        d="M25 65C22 45 40 25 65 25C90 25 105 42 105 60C105 72 92 78 75 78C50 78 30 75 25 65Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M32 45C28 35 22 30 20 32C18 34 23 42 25 48C20 49 18 55 20 62"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M30 40C30 32 36 28 38 30C40 32 38 38 35 44"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M24 52C26 54 29 54 31 52"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="21" cy="54" r="1.5" fill="currentColor" />
      <path
        d="M102 62C108 55 110 40 102 35C96 32 94 38 96 46C98 55 92 68 76 74"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BearIcon() {
  return (
    <svg width="44" height="34" viewBox="0 0 120 90" fill="none" className="text-current">
      <path
        d="M30 68C22 55 28 30 55 28C85 26 100 45 98 68C95 78 78 80 58 80C38 80 32 75 30 68Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Ear left */}
      <path d="M40 28C38 20 46 16 50 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Ear right */}
      <path d="M65 24C70 16 78 20 76 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Muzzle */}
      <path d="M42 48C46 44 56 44 60 48C60 56 42 56 42 48Z" stroke="currentColor" strokeWidth="1.8" />
      {/* Nose */}
      <circle cx="51" cy="48" r="2" fill="currentColor" />
      {/* Sleeping eyes */}
      <path d="M36 40C39 42 42 42 45 40" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M57 40C60 42 63 42 66 40" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function BirdIcon() {
  return (
    <svg width="44" height="34" viewBox="0 0 120 90" fill="none" className="text-current">
      {/* Bird body resting */}
      <path
        d="M35 50C35 32 50 22 68 22C82 22 92 34 88 52C85 66 70 72 50 72C40 72 35 62 35 50Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Beak */}
      <path d="M35 40L24 44L35 48" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Sleeping eye */}
      <path d="M44 38C46 40 48 40 50 38" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Wing fold */}
      <path d="M60 40C72 45 80 58 75 66" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Tail */}
      <path d="M88 52L105 60L90 66" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const COMPANIONS = [
  { id: 'cat',  label: 'Sleeping Cat',  sub: 'Quiet curl & soft presence', icon: CatIcon },
  { id: 'bear', label: 'Resting Bear',  sub: 'Deep grounded calm',         icon: BearIcon },
  { id: 'bird', label: 'Quiet Bird',    sub: 'Stillness & soft perch',     icon: BirdIcon },
]

const THEME_OPTIONS: { id: ThemeId; title: string; desc: string; bg: string; border: string }[] = [
  {
    id: 'obsidian',
    title: 'Obsidian Dark',
    desc: 'Matte deep dark stillness',
    bg: '#0E0E0E',
    border: '#242424',
  },
  {
    id: 'warm-dusk',
    title: 'Warm Dusk',
    desc: 'Deep warm earthen charcoal',
    bg: '#141210',
    border: '#2E2824',
  },
  {
    id: 'muted-slate',
    title: 'Muted Slate',
    desc: 'Soft low-contrast dark slate',
    bg: '#101316',
    border: '#242A30',
  },
]

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<number>(1)
  const [nickname, setNickname] = useState<string>('')
  const [selectedCompanion, setSelectedCompanion] = useState<string>('cat')
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(() => loadSettings().theme)
  const [isFinishing, setIsFinishing] = useState<boolean>(false)

  function handleNextStep() {
    if (step === 1) {
      setUserNickname(nickname)
      setStep(2)
    } else if (step === 2) {
      setCompanionChoice(selectedCompanion)
      setStep(3)
    } else if (step === 3) {
      const current = loadSettings()
      saveSettings({ ...current, theme: selectedTheme })
      setStep(4)
    } else if (step === 4) {
      setIsFinishing(true)
      setOnboarded(true)
      setTimeout(() => {
        onComplete()
      }, 800)
    }
  }

  function handleSelectTheme(theme: ThemeId) {
    setSelectedTheme(theme)
    const current = loadSettings()
    saveSettings({ ...current, theme })
  }

  return (
    <main
      id="onboarding-screen"
      className={`
        h-[100dvh] w-full
        px-6 py-8
        flex flex-col justify-between
        overflow-hidden
        bg-[var(--bg-primary,#0E0E0E)]
        transition-opacity duration-800 ease-in-out
        ${isFinishing ? 'opacity-0' : 'opacity-100 animate-fade-in'}
      `}
    >
      {/* ── Top Progress Dots ───────────────────────────────── */}
      <div className="flex items-center justify-between w-full pt-2">
        <span className="font-serif-nook text-[#E5E0D8] text-sm tracking-[0.2em] font-light">
          nook.
        </span>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map(s => (
            <span
              key={s}
              className={`
                block h-[3px] rounded-full transition-all duration-500
                ${s === step
                  ? 'w-6 bg-[#C9B99A]'
                  : s < step
                  ? 'w-2 bg-[#E5E0D8]/40'
                  : 'w-2 bg-[#222222]'
                }
              `}
            />
          ))}
        </div>
      </div>

      {/* ── Step Content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center my-auto min-h-0 py-6">

        {/* ── STEP 1: Nickname ── */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center animate-lift-in">
            <h1 className="font-serif-nook text-2xl font-light text-[#E5E0D8] tracking-wide">
              welcome to nook.
            </h1>
            <p className="text-sm text-[#71717A] mt-2 font-sans font-light">
              A pocket sanctuary. Nothing to fix, nowhere to be.
            </p>

            <div className="w-full max-w-[300px] mt-12 mb-4 flex flex-col items-center">
              <label
                htmlFor="nickname-input"
                className="font-sans text-[0.65rem] tracking-[0.18em] uppercase text-[#71717A] mb-3"
              >
                What should we call you?
              </label>
              <input
                id="nickname-input"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="or leave blank to remain quiet"
                className="
                  w-full bg-transparent border-b border-[#333333] focus:border-[#E5E0D8]
                  text-center text-lg py-2 outline-none text-[#E5E0D8] font-serif-nook
                  placeholder:text-[#383838] placeholder:text-xs placeholder:font-sans
                  transition-colors
                "
                autoFocus
              />
            </div>
          </div>
        )}

        {/* ── STEP 2: Choose Companion ── */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center animate-lift-in">
            <h2 className="font-serif-nook text-2xl font-light text-[#E5E0D8] tracking-wide">
              A Quiet Presence
            </h2>
            <p className="text-xs text-[#71717A] mt-1.5 font-sans font-light px-4">
              Choose a companion to sit with you during focus and stillness.
            </p>

            <div className="w-full flex flex-col gap-3 mt-8">
              {COMPANIONS.map(c => {
                const isSelected = selectedCompanion === c.id
                const IconComponent = c.icon
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCompanion(c.id)}
                    className={`
                      w-full p-4 border rounded-xl flex items-center gap-4 text-left
                      transition-all duration-300 focus:outline-none
                      ${isSelected
                        ? 'border-[#C9B99A]/60 bg-[#161412] text-[#E5E0D8]'
                        : 'border-[#202020] bg-[#0E0E0E] text-[#71717A] hover:border-[#2C2C2C] hover:text-[#A1A1AA]'
                      }
                    `}
                  >
                    <div className="shrink-0">
                      <IconComponent />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-serif-nook text-base font-light text-[#E5E0D8]">
                        {c.label}
                      </span>
                      <span className="font-sans text-[0.62rem] text-[#71717A] tracking-wide">
                        {c.sub}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── STEP 3: Atmosphere Theme ── */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center animate-lift-in">
            <h2 className="font-serif-nook text-2xl font-light text-[#E5E0D8] tracking-wide">
              Atmosphere
            </h2>
            <p className="text-xs text-[#71717A] mt-1.5 font-sans font-light">
              Pick the palette that feels safest right now.
            </p>

            <div className="w-full flex flex-col gap-3 mt-8">
              {THEME_OPTIONS.map(t => {
                const isSelected = selectedTheme === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTheme(t.id)}
                    className={`
                      w-full p-4 border rounded-xl flex items-center justify-between text-left
                      transition-all duration-300 focus:outline-none
                      ${isSelected
                        ? 'border-[#C9B99A]/60 bg-[#161412]'
                        : 'border-[#202020] bg-[#0E0E0E] hover:border-[#2C2C2C]'
                      }
                    `}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-serif-nook text-base font-light text-[#E5E0D8]">
                        {t.title}
                      </span>
                      <span className="font-sans text-[0.62rem] text-[#71717A]">
                        {t.desc}
                      </span>
                    </div>

                    {/* Color Swatch Preview */}
                    <span
                      className="w-5 h-5 rounded-full border border-[#333333] shrink-0"
                      style={{ backgroundColor: t.bg }}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── STEP 4: Threshold ── */}
        {step === 4 && (
          <div className="flex flex-col items-center text-center animate-lift-in py-4">
            {/* Delicate ambient sparkle glyph */}
            <div className="relative mb-6 flex items-center justify-center">
              <div className="absolute w-28 h-28 rounded-full bg-[#C9B99A]/8 blur-xl pointer-events-none" />
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-[#C9B99A] animate-pulse">
                <path
                  d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2 className="font-serif-nook text-3xl font-light text-[#E5E0D8] tracking-wide">
              Your space is ready.
            </h2>
            <p className="text-sm text-[#71717A] mt-2 font-sans font-light">
              No tracking. No accounts. No demands.
            </p>
          </div>
        )}
      </div>

      {/* ── Bottom Action ────────────────────────────────────── */}
      <div className="flex flex-col items-center shrink-0 pt-4">
        {step < 4 ? (
          <button
            id={`onboarding-step-${step}-continue`}
            onClick={handleNextStep}
            className="
              px-8 py-2.5 border border-[#2A2A2A] rounded-full
              font-serif-nook text-[#E5E0D8] text-[1.05rem] font-light
              hover:border-[#C9B99A]/50 hover:text-[#C9B99A]
              transition-all duration-300 focus:outline-none
            "
          >
            Continue
          </button>
        ) : (
          <button
            id="enter-nook-btn"
            onClick={handleNextStep}
            className="
              px-9 py-3 bg-[#E5E0D8] hover:bg-[#F2EDE4] text-[#0E0E0E]
              font-serif-nook text-lg font-normal rounded-full
              shadow-xl transition-all duration-300 focus:outline-none
              hover:scale-[1.02]
            "
          >
            enter nook →
          </button>
        )}
      </div>
    </main>
  )
}
