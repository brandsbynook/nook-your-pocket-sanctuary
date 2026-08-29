import { useState } from 'react'
import {
  loadSettings,
  saveSettings,
  resetApp,
  setOnboarded,
  type NookSettings,
  type ThemeId,
} from '../utils/storage'
import FooterNav, { type NavTabId } from '../components/FooterNav'

// ── Section wrapper ───────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <p className="
        font-sans text-[#3A3A3A] text-[0.58rem]
        tracking-[0.2em] uppercase mb-3
      ">
        {label}
      </p>
      <div className="flex flex-col gap-0 border border-[#1C1C1C]">
        {children}
      </div>
    </div>
  )
}

// ── Toggle row ────────────────────────────────────

interface ToggleRowProps {
  id: string
  label: string
  checked: boolean
  onChange: (val: boolean) => void
}

function ToggleRow({ id, label, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4 border-b border-[#1C1C1C] last:border-0">
      <span className="font-sans text-[#E5E0D8] text-[0.78rem] tracking-wide">
        {label}
      </span>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="flex items-center shrink-0 focus:outline-none group cursor-pointer"
        aria-label={label}
      >
        <span
          className={`
            w-11 h-6 rounded-full p-0.5 transition-colors duration-300 ease-in-out relative flex items-center shrink-0
            ${checked
              ? 'bg-[#4A3E2C] border border-[#7C6647]'
              : 'bg-[#222222] border border-transparent'
            }
          `}
        >
          <span
            className={`
              w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ease-in-out
              ${checked ? 'translate-x-5 bg-[#E5E0D8]' : 'translate-x-0 bg-[#888888]'}
            `}
          />
        </span>
      </button>
    </div>
  )
}

// ── Theme pill row ────────────────────────────────

const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'obsidian',    label: 'Obsidian'    },
  { id: 'warm-dusk',   label: 'Warm Dusk'   },
  { id: 'muted-slate', label: 'Muted Slate' },
]

interface ThemeSelectorProps {
  current: ThemeId
  onChange: (id: ThemeId) => void
}

function ThemeSelector({ current, onChange }: ThemeSelectorProps) {
  return (
    <div className="px-4 py-4 flex items-center gap-2 flex-wrap">
      {THEMES.map(t => (
        <button
          key={t.id}
          id={`theme-${t.id}`}
          onClick={() => onChange(t.id)}
          className={`
            font-sans text-[0.62rem] tracking-[0.14em] uppercase
            px-3 py-1.5
            border transition-all duration-300
            focus:outline-none
            ${current === t.id
              ? 'border-[#C9B99A]/50 text-[#C9B99A] bg-[#C9B99A]/8'
              : 'border-[#242424] text-[#52525B] hover:border-[#3A3A3A] hover:text-[#71717A]'
            }
          `}
          aria-pressed={current === t.id}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Action row ────────────────────────────────────

interface ActionRowProps {
  id: string
  label: string
  destructive?: boolean
  onClick: () => void
}

function ActionRow({ id, label, destructive = false, onClick }: ActionRowProps) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`
        w-full flex items-center justify-between
        px-4 py-4
        border-b border-[#1C1C1C] last:border-0
        font-sans text-[0.78rem] tracking-wide
        transition-colors duration-300
        focus:outline-none text-left
        ${destructive
          ? 'text-[#71717A] hover:text-[#C9B99A]'
          : 'text-[#E5E0D8] hover:text-[#C9B99A]'
        }
      `}
    >
      {label}
      <span className="text-[#3A3A3A] text-sm" aria-hidden="true">›</span>
    </button>
  )
}

// ── Main SettingsScreen ───────────────────────────

interface SettingsScreenProps {
  onBack: () => void
  onNavigate?: (tab: NavTabId) => void
  onReplayOnboarding?: () => void
}

export default function SettingsScreen({ onBack, onNavigate, onReplayOnboarding }: SettingsScreenProps) {
  const [settings, setSettings] = useState<NookSettings>(() => loadSettings())
  const [resetDone, setResetDone] = useState(false)

  function update(patch: Partial<NookSettings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
  }

  function handleReplayOnboarding() {
    setOnboarded(false)
    if (onReplayOnboarding) {
      onReplayOnboarding()
    } else {
      window.location.reload()
    }
  }

  function handleReset() {
    if (!window.confirm('Reset nook? All local data will be cleared.')) return
    resetApp()
    setResetDone(true)
    setTimeout(() => window.location.reload(), 1200)
  }

  function handleExport() {
    const data = {
      dumps:       JSON.parse(localStorage.getItem('nook:dumps')        ?? '[]'),
      reflections: JSON.parse(localStorage.getItem('nook:reflections')  ?? '[]'),
      cards:       JSON.parse(localStorage.getItem('nook:custom-cards') ?? '[]'),
      deadlines:   JSON.parse(localStorage.getItem('nook_deadlines')    ?? '[]'),
      settings:    JSON.parse(localStorage.getItem('nook:settings')     ?? '{}'),
      exported:    new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `nook-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main
      id="settings-screen"
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
        {/* Header */}
        <header className="flex items-center justify-between mb-8 shrink-0">
          <button
            id="settings-back"
            onClick={onBack}
            className="
              flex items-center gap-1.5
              font-sans text-[#52525B] text-[0.62rem]
              tracking-[0.14em] uppercase
              hover:text-[#71717A] transition-colors
              focus:outline-none
            "
          >
            <span className="text-[0.8rem] leading-none">←</span>
            return
          </button>

          <h1 className="font-serif-nook text-[#E5E0D8] text-xl font-light tracking-[0.18em] leading-none">
            Settings
          </h1>

          <div className="w-[60px]" aria-hidden="true" />
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-4">

          {/* Preferences */}
          <Section label="Preferences">
            <ToggleRow
              id="toggle-greeting"
              label="Show Home Greeting"
              checked={settings.showGreeting}
              onChange={v => update({ showGreeting: v })}
            />
            <ToggleRow
              id="toggle-haptics"
              label="Subtle Haptics"
              checked={settings.haptics}
              onChange={v => update({ haptics: v })}
            />
          </Section>

          {/* Theme */}
          <Section label="Theme">
            <ThemeSelector
              current={settings.theme}
              onChange={theme => update({ theme })}
            />
          </Section>

          {/* Privacy & Storage */}
          <Section label="Privacy & Storage">
            <div className="px-4 py-4 border-b border-[#1C1C1C]">
              <p className="font-sans text-[#52525B] text-[0.7rem] leading-relaxed tracking-wide">
                All data stays on this device.
                No accounts, no telemetry.
              </p>
            </div>
            <ActionRow
              id="replay-onboarding-btn"
              label="Replay Onboarding"
              onClick={handleReplayOnboarding}
            />
            <ActionRow
              id="export-data-btn"
              label="Export Data"
              onClick={handleExport}
            />
            <ActionRow
              id="reset-app-btn"
              label="Reset App"
              destructive
              onClick={handleReset}
            />
          </Section>

          {/* About nook & Founder's Note */}
          <div className="mb-7">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="font-serif-nook text-[#E5E0D8] text-lg font-light tracking-wide">
                About nook
              </h3>
              <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A]">
                A note from the founder
              </span>
            </div>

            <div className="border border-[#1C1C1C] bg-[#0E0E0E] p-5 rounded-sm flex flex-col gap-4">
              <div className="font-serif-nook text-[#D4D4D8] text-[0.92rem] font-light leading-relaxed space-y-3.5">
                <p className="italic text-[#E5E0D8]">
                  I built nook because I needed it to exist.
                </p>

                <p>
                  As someone with ADHD and Asperger’s, I know what it feels like when the world gets too loud, too demanding, and too fast. Most tools are built by neurotypical minds. Even with the best intentions, they rely on things that quietly overwhelm us: streaks that induce guilt, notifications that break focus, forced positivity, and endless pressure to optimize.
                </p>

                <p>
                  I wanted to create the kind of space I always needed but rarely found: a place built from the inside out, by someone who actually lives in those shoes.
                </p>

                <p>
                  nook isn’t here to fix you, track you, or make you more productive. It exists simply to hold space when your mind is full, your senses are overloaded, or words are hard to find. Everything stays on your device. Nothing is saved to a cloud. Nothing is watching.
                </p>

                <p className="italic text-[#E5E0D8]">
                  Take what you need, leave what you don't.
                </p>
              </div>

              {/* Sign-off */}
              <div className="pt-2 border-t border-[#181818] flex items-center justify-between">
                <span className="font-serif-nook text-[#C9B99A] text-sm font-light italic">
                  — The Founder
                </span>
                <span className="font-sans text-[#52525B] text-[0.62rem] tracking-wider">
                  v1.0.0 • Offline-first • Built with care
                </span>
              </div>
            </div>
          </div>

          {/* Reset confirmation */}
          {resetDone && (
            <p className="font-sans text-[#C9B99A] text-[0.6rem] tracking-[0.2em] uppercase text-center mt-2 animate-fade-in">
              Resetting…
            </p>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <FooterNav active="settings" onSelect={onNavigate} />
    </main>
  )
}
