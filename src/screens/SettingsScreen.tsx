import { useState } from 'react'
import {
  loadSettings,
  saveSettings,
  resetApp,
  getUserNickname,
  setUserNickname,
  type NookSettings,
} from '../utils/storage'
import FooterNav, { type NavTabId } from '../components/FooterNav'
import HeaderAudioShortcut from '../components/HeaderAudioShortcut'

// ── Section wrapper ───────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <p className="
        font-sans text-[#52525B] text-[0.58rem]
        tracking-[0.2em] uppercase mb-3
      ">
        {label}
      </p>
      <div className="flex flex-col gap-0 border border-[#1F1F23]">
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
    <div className="flex items-center justify-between px-4 py-4 border-b border-[#1F1F23] last:border-0">
      <span className="font-sans text-[#E5E5E7] text-[0.78rem] tracking-wide">
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
              ? 'bg-[#222225] border border-[#3F3F46]'
              : 'bg-[#141416] border border-[#222225]'
            }
          `}
        >
          <span
            className={`
              w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ease-in-out
              ${checked ? 'translate-x-5 bg-[#E5E5E7]' : 'translate-x-0 bg-[#52525B]'}
            `}
          />
        </span>
      </button>
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
        border-b border-[#1F1F23] last:border-0
        font-sans text-[0.78rem] tracking-wide
        transition-colors duration-300
        focus:outline-none text-left
        ${destructive
          ? 'text-[#71717A] hover:text-[#E5E5E7]'
          : 'text-[#E5E5E7] hover:text-[#FFFFFF]'
        }
      `}
    >
      {label}
      <span className="text-[#52525B] text-sm" aria-hidden="true">›</span>
    </button>
  )
}

// ── Main SettingsScreen ───────────────────────────

interface SettingsScreenProps {
  onBack: () => void
  onNavigate?: (tab: NavTabId) => void
}

export default function SettingsScreen({ onBack, onNavigate }: SettingsScreenProps) {
  const [settings, setSettings] = useState<NookSettings>(() => loadSettings())
  const [nickname, setNickname] = useState<string>(() => getUserNickname())
  const [resetDone, setResetDone] = useState(false)

  function update(patch: Partial<NookSettings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
  }

  function handleNicknameChange(val: string) {
    setNickname(val)
    setUserNickname(val)
  }

  function handleReset() {
    if (!window.confirm('Reset nook? All local data will be cleared.')) return
    resetApp()
    setResetDone(true)
    setTimeout(() => window.location.reload(), 1200)
  }

  function handleExport() {
    const data = {
      dumps:              JSON.parse(localStorage.getItem('nook:dumps')                  ?? '[]'),
      reflections:        JSON.parse(localStorage.getItem('nook:reflections')            ?? '[]'),
      guidedReflections:  JSON.parse(localStorage.getItem('nook:guided-reflection-steps') ?? '{}'),
      libraryReflections: JSON.parse(localStorage.getItem('nook:library-reflection-drafts') ?? '{}'),
      cards:              JSON.parse(localStorage.getItem('nook:custom-cards')           ?? '[]'),
      deadlines:          JSON.parse(localStorage.getItem('nook_deadlines')              ?? '[]'),
      settings:           JSON.parse(localStorage.getItem('nook:settings')               ?? '{}'),
      companion:          localStorage.getItem('nook_companion')                         ?? 'cat',
      nickname:           localStorage.getItem('nook_nickname')                          ?? '',
      exportedAt:         new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'nook-sanctuary-backup.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <main
      id="settings-screen"
      className="
        h-[100dvh] w-full
        px-6 pt-10 pb-6
        flex flex-col justify-between
        overflow-hidden
        bg-[#0A0A0B]
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
              hover:text-[#E5E5E7] transition-colors
              focus:outline-none
            "
          >
            <span className="text-[0.8rem] leading-none">←</span>
            return
          </button>

          <h1 className="font-serif-nook text-[#E5E5E7] text-xl font-light tracking-[0.18em] leading-none">
            Settings
          </h1>

          <div className="flex items-center justify-end min-w-[60px]">
            <HeaderAudioShortcut />
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-4">

          {/* Preferences */}
          <Section label="Preferences">
            {/* Sanctuary Name / Nickname */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1F1F23]">
              <span className="font-sans text-[#E5E5E7] text-[0.78rem] tracking-wide">
                Your Name
              </span>
              <input
                id="settings-nickname-input"
                type="text"
                value={nickname}
                onChange={e => handleNicknameChange(e.target.value)}
                placeholder="What should nook call you?"
                className="
                  bg-transparent border-b border-[#1F1F23] text-right font-serif-nook text-sm text-[#E5E5E7]
                  placeholder:text-[#52525B] placeholder:text-xs placeholder:font-sans focus:outline-none focus:border-[#3F3F46] py-0.5 max-w-[170px]
                "
              />
            </div>
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

          {/* Privacy & Storage */}
          <Section label="Privacy & Storage">
            <div className="px-4 py-4 border-b border-[#1F1F23]">
              <p className="font-sans text-[#71717A] text-[0.7rem] leading-relaxed tracking-wide">
                All data stays on this device.
                No accounts, no telemetry.
              </p>
            </div>
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
              <h3 className="font-serif-nook text-[#E5E5E7] text-lg font-light tracking-wide">
                About nook
              </h3>
              <span className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#71717A]">
                A note from the founder
              </span>
            </div>

            <div className="border border-[#1F1F23] bg-[#141416] p-5 rounded-2xl flex flex-col gap-4">
              <div className="font-serif-nook text-[#71717A] text-[0.92rem] font-light leading-relaxed space-y-3.5">
                <p className="italic text-[#E5E5E7]">
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

                <p className="italic text-[#E5E5E7]">
                  Take what you need, leave what you don't.
                </p>
              </div>

              {/* Sign-off */}
              <div className="pt-2 border-t border-[#1F1F23] flex items-center justify-between">
                <span className="font-serif-nook text-[#E5E5E7] text-sm font-light italic">
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
            <p className="font-sans text-[#E5E5E7] text-[0.6rem] tracking-[0.2em] uppercase text-center mt-2 animate-fade-in">
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
