import { useState } from 'react'
import TextDump   from '../components/braindump/TextDump'
import VoiceDump  from '../components/braindump/VoiceDump'
import TodaysNote from '../components/braindump/TodaysNote'

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
        h-[100dvh] max-w-[420px] mx-auto
        px-6 pt-10 pb-6
        flex flex-col
        overflow-hidden
        bg-[#0E0E0E]
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

        {/* Spacer to balance the back button */}
        <div className="w-[60px]" aria-hidden="true" />
      </header>

      {/* ── Mode switcher ────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Brain dump modes"
        className="flex items-center gap-0 mb-7 border-b border-[#1E1E1E]"
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
                relative flex-1 pb-3
                font-sans text-[0.58rem] tracking-[0.14em] uppercase
                transition-colors duration-300
                focus:outline-none
              "
            >
              <span className={isActive ? 'text-[#E5E0D8]' : 'text-[#3A3A3A] hover:text-[#52525B]'}>
                {tab.label}
              </span>
              {/* Active underline */}
              <span
                className={`
                  absolute bottom-0 left-0 right-0 h-px
                  transition-all duration-400
                  ${isActive ? 'bg-[#C9B99A] opacity-80' : 'bg-transparent'}
                `}
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>

      {/* ── Tab panels ───────────────────────────────── */}
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
