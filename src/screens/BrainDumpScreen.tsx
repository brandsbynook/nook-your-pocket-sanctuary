import { useState } from 'react'
import TextDump   from '../components/braindump/TextDump'
import VoiceDump  from '../components/braindump/VoiceDump'
import TodaysNote from '../components/braindump/TodaysNote'
import HeaderAudioShortcut from '../components/HeaderAudioShortcut'

type Tab = 'text' | 'voice' | 'note'

interface BrainDumpScreenProps {
  onBack: () => void
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'text',  label: 'Text Dump'    },
  { id: 'voice', label: 'Voice Dump'   },
  { id: 'note',  label: "Today's Note" },
]

export default function BrainDumpScreen({ onBack }: BrainDumpScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('text')

  return (
    <main
      id="brain-dump-screen"
      className="
        h-[100dvh] w-full
        px-6 pt-10 pb-6
        flex flex-col
        overflow-hidden
        bg-[var(--bg-primary,#0E0E0E)]
        animate-fade-in
      "
    >
      {/* ── Header ──────────────────────────────────── */}
      <header className="flex items-center justify-between mb-8">
        {/* Back button */}
        <button
          id="brain-dump-back"
          onClick={onBack}
          aria-label="Return to home"
          className="
            flex items-center gap-1.5
            font-sans text-[#52525B] text-[0.62rem]
            tracking-[0.14em] uppercase
            transition-colors duration-300
            hover:text-[#71717A]
            focus:outline-none
          "
        >
          <span className="text-[0.8rem] leading-none" aria-hidden="true">←</span>
          return
        </button>

        {/* Screen title */}
        <h1 className="
          font-serif-nook text-[#E5E0D8]
          text-xl font-light tracking-[0.18em] leading-none
        ">
          Brain Dump
        </h1>

        {/* Right action area with ambient audio shortcut */}
        <div className="flex items-center justify-end min-w-[60px]">
          <HeaderAudioShortcut />
        </div>
      </header>

      {/* ── Mode switcher (Softened Horizontal Sub-Tabs) ──────── */}
      <div
        role="tablist"
        aria-label="Brain dump modes"
        className="flex items-center justify-between mb-6 border-b border-neutral-800/60 pb-2.5"
      >
        {tabs.map(tab => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className="
                flex-1 text-center font-mono text-[11px] tracking-widest uppercase
                transition-colors duration-200 focus:outline-none cursor-pointer
              "
            >
              <span className={isActive ? 'text-neutral-200 font-medium' : 'text-neutral-500 hover:text-neutral-400 font-normal'}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Tab panels with gentle fade ─────────────────────── */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="flex flex-col flex-1 min-h-0 animate-fade-in"
        key={activeTab}   /* remount panel on tab switch to reset state */
      >
        {activeTab === 'text'  && <TextDump />}
        {activeTab === 'voice' && <VoiceDump />}
        {activeTab === 'note'  && <TodaysNote />}
      </div>
    </main>
  )
}
