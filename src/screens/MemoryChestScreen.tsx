import { useState, useEffect, useRef, useMemo } from 'react'
import {
  getAllEntries,
  deleteEntry,
  getAllVoiceRecords,
  deleteVoiceRecord,
  loadReflections,
  deleteReflectionEntry,
  type DumpEntry,
  type VoiceRecord,
  type ReflectionEntry,
} from '../utils/storage'
import FooterNav, { type NavTabId } from '../components/FooterNav'
import HeaderAudioShortcut from '../components/HeaderAudioShortcut'

export type MemoryTab = 'dumps' | 'reflections' | 'jar'

interface MemoryChestScreenProps {
  onBack: () => void
  onNavigate?: (tab: NavTabId) => void
}

const TABS: { id: MemoryTab; label: string }[] = [
  { id: 'dumps',       label: 'Dumps'       },
  { id: 'reflections', label: 'Reflections' },
  { id: 'jar',         label: 'Notes Jar'   },
]

function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(ms?: number): string {
  if (!ms) return '0:00'
  const s = Math.floor(ms / 1000)
  const min = Math.floor(s / 60)
  const sec = (s % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

/* ─────────────────────────────────────────────────────────────
   Minimal Voice Item Player
───────────────────────────────────────────────────────────── */
function VoiceDumpItem({
  record,
  onDelete,
}: {
  record: VoiceRecord
  onDelete: () => void
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(record.blob)
    audioUrlRef.current = url
    const audio = new Audio(url)
    audioRef.current = audio

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
        setCurrentTime(audio.currentTime * 1000)
      }
    }

    audio.onended = () => {
      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
    }

    return () => {
      audio.pause()
      URL.revokeObjectURL(url)
    }
  }, [record.blob])

  function togglePlay() {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || !audioRef.current.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, clickX / rect.width))
    audioRef.current.currentTime = percent * audioRef.current.duration
    setProgress(percent * 100)
  }

  return (
    <div className="rounded-2xl bg-neutral-900/40 border border-neutral-800/60 p-5 mb-4 transition-all duration-300 hover:border-neutral-700/70 group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] tracking-widest text-neutral-500 uppercase font-mono">
          Voice Recording · {formatDate(record.timestamp)}
        </span>

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onDelete}
              className="text-[10px] tracking-wider uppercase text-rose-400 hover:underline"
            >
              Let go
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-[10px] tracking-wider uppercase text-neutral-500 hover:text-neutral-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete recording"
            className="text-[10px] tracking-wider uppercase text-neutral-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
          >
            Let go
          </button>
        )}
      </div>

      <div className="flex items-center gap-3.5 mt-1">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full border border-neutral-700/80 bg-neutral-800/80 flex items-center justify-center text-neutral-200 hover:border-[#C9B99A]/50 transition-colors shrink-0 focus:outline-none"
          aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
        >
          {isPlaying ? (
            <span className="flex gap-[3px]">
              <span className="w-[2.5px] h-3.5 bg-neutral-200 rounded-sm" />
              <span className="w-[2.5px] h-3.5 bg-neutral-200 rounded-sm" />
            </span>
          ) : (
            <span className="text-[0.75rem] ml-0.5 leading-none text-neutral-200">▶</span>
          )}
        </button>

        {/* Scrubber */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div
            onClick={handleSeek}
            className="w-full h-2 bg-neutral-800 rounded-full cursor-pointer relative flex items-center overflow-hidden"
          >
            <div
              className="h-full bg-[#C9B99A] rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between font-mono text-[10px] text-neutral-500 tabular-nums">
            <span>{isPlaying ? formatDuration(currentTime) : '0:00'}</span>
            <span>{formatDuration(record.durationMs)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Apothecary Notes Jar (The Time Capsule Ritual)
───────────────────────────────────────────────────────────── */
const SANCTUARY_NOTES = [
  "You don't have to carry everything all at once.",
  "Peace is not the absence of noise, but finding stillness within.",
  "You are allowed to take up space and move at your own pace.",
  "There is nothing you need to prove right now.",
  "Softness is a quiet strength.",
  "Whatever you did today, it was enough.",
  "Breathe. You are safe in this quiet moment.",
  "Let go of what you cannot change today.",
  "Nothing to fix, nowhere to be.",
]

interface NoteSlip {
  text: string
  source: string
  date?: string
}

function NotesJarView({
  userNotes,
  onDeleteNote,
}: {
  userNotes: DumpEntry[]
  onDeleteNote: (id: string) => void
}) {
  const [viewMode, setViewMode] = useState<'jar' | 'list'>('jar')

  const allSlips: NoteSlip[] = useMemo(() => {
    if (userNotes.length > 0) {
      return userNotes.map(n => ({
        text: n.content,
        source: "Today's Note",
        date: formatDate(n.timestamp),
      }))
    }
    return SANCTUARY_NOTES.map(quote => ({
      text: quote,
      source: 'Sanctuary Keepsake',
      date: 'timeless',
    }))
  }, [userNotes])

  const [activeSlip, setActiveSlip] = useState<NoteSlip | null>(null)
  const [isRattling, setIsRattling] = useState(false)

  function handleDraw() {
    setIsRattling(true)
    setTimeout(() => {
      const randomIdx = Math.floor(Math.random() * allSlips.length)
      setActiveSlip(allSlips[randomIdx] || allSlips[0])
      setIsRattling(false)
    }, 450)
  }

  function handleFoldBack() {
    setActiveSlip(null)
  }

  // ── "View All Notes" List Mode ─────────────────────
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col flex-1 animate-fade-in pb-4">
        <div className="flex items-center justify-between mb-4 border-b border-neutral-800/80 pb-2.5">
          <button
            onClick={() => setViewMode('jar')}
            className="font-mono text-[10px] tracking-widest uppercase text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none cursor-pointer flex items-center gap-1"
          >
            <span>←</span>
            <span>draw from jar</span>
          </button>
          <span className="font-mono text-[10px] text-neutral-500">
            {userNotes.length} {userNotes.length === 1 ? 'note' : 'notes'}
          </span>
        </div>

        {userNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-serif-nook text-neutral-500 text-sm font-light italic">
              The jar is currently empty.
            </p>
            <p className="font-sans text-neutral-600 text-[0.58rem] tracking-wider uppercase mt-1">
              Save today's note in Brain Dump to place memories in the jar.
            </p>
          </div>
        ) : (
          userNotes.map(note => (
            <div
              key={note.id}
              className="rounded-2xl bg-neutral-900/40 border border-neutral-800/60 p-5 mb-4 transition-all duration-300 hover:border-neutral-700/70 group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] tracking-widest text-neutral-500 uppercase font-mono">
                  Daily Note · {formatDate(note.timestamp)}
                </span>
                <button
                  onClick={() => onDeleteNote(note.id)}
                  aria-label="Let go of note"
                  className="text-[10px] tracking-wider uppercase text-neutral-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none cursor-pointer"
                >
                  Let go
                </button>
              </div>
              <p className="font-serif-nook text-neutral-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-light">
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>
    )
  }

  // ── "Hero Jar" Draw Mode ───────────────────────────
  return (
    <div className="flex flex-col items-center justify-between flex-1 py-4 animate-fade-in text-center">
      {/* Center Vessel & Paper Slip */}
      <div className="flex flex-col items-center my-auto w-full px-2">
        {!activeSlip ? (
          /* Large Handcrafted Apothecary Jar */
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleDraw}
              id="apothecary-jar-button"
              aria-label="Draw note from apothecary jar"
              className={`
                group cursor-pointer focus:outline-none transition-all duration-300 p-2
                ${isRattling ? 'animate-bounce scale-95 rotate-3' : 'hover:scale-105'}
              `}
            >
              {/* Handcrafted Organic Apothecary Jar SVG */}
              <svg width="115" height="145" viewBox="0 0 115 145" fill="none" className="text-neutral-500 group-hover:text-neutral-300 transition-colors drop-shadow-md">
                {/* Cork Stopper with subtle line */}
                <path d="M39 12 C39 10 42 8 46 8 H69 C73 8 76 10 76 12 V19 H39 Z" fill="#201D1A" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <line x1="44" y1="14" x2="71" y2="14" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
                
                {/* Rounded Jar Lip */}
                <rect x="33" y="19" width="49" height="7" rx="3" fill="#141416" stroke="currentColor" strokeWidth="1.5" />
                
                {/* Soft Organic Jar Silhouette (smooth shoulders & body) */}
                <path d="M38 26 C38 34 22 42 16 54 C10 66 12 118 16 126 C22 138 34 140 57.5 140 C81 140 93 138 99 126 C103 118 105 66 99 54 C93 42 77 34 77 26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Subtle Specular Highlights */}
                <path d="M22 62 C20 75 20 110 24 122 C27 128 34 133 44 134" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.25" strokeLinecap="round" />
                <path d="M92 64 C94 74 94 98 90 108" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.2" strokeLinecap="round" />

                {/* Floating Folded Paper Slip 1 (-15deg) */}
                <g className="animate-float-slip-1 origin-[44px_82px]">
                  <rect x="32" y="76" width="25" height="13" rx="2" fill="#E8E2D8" fillOpacity="0.1" stroke="#D1C7B7" strokeWidth="1.1" strokeOpacity="0.75" />
                  <line x1="36" y1="82" x2="52" y2="82" stroke="#D1C7B7" strokeWidth="0.7" strokeOpacity="0.5" />
                </g>

                {/* Floating Folded Paper Slip 2 (8deg) */}
                <g className="animate-float-slip-2 origin-[64px_106px]">
                  <rect x="52" y="100" width="28" height="14" rx="2" fill="#E8E2D8" fillOpacity="0.12" stroke="#D1C7B7" strokeWidth="1.1" strokeOpacity="0.8" />
                  <line x1="56" y1="107" x2="74" y2="107" stroke="#D1C7B7" strokeWidth="0.7" strokeOpacity="0.5" />
                </g>

                {/* Floating Folded Paper Slip 3 (-6deg) */}
                <g className="animate-float-slip-3 origin-[42px_110px]">
                  <rect x="30" y="104" width="24" height="13" rx="2" fill="#E8E2D8" fillOpacity="0.09" stroke="#D1C7B7" strokeWidth="1.1" strokeOpacity="0.65" />
                </g>

                {/* Floating Folded Paper Slip 4 (22deg) */}
                <g className="animate-float-slip-4 origin-[72px_78px]">
                  <rect x="62" y="72" width="22" height="12" rx="2" fill="#E8E2D8" fillOpacity="0.1" stroke="#D1C7B7" strokeWidth="1.1" strokeOpacity="0.7" />
                </g>
              </svg>
            </button>
            <span className="font-serif-nook text-neutral-400 text-xs italic">
              Contains {userNotes.length} preserved {userNotes.length === 1 ? 'memory' : 'memories'} from your days.
            </span>
          </div>
        ) : (
          /* Unfolded Drawn Paper Slip */
          <div className="w-full max-w-[340px] rounded-2xl bg-neutral-900/90 border border-neutral-700/80 p-6 shadow-2xl backdrop-blur-md animate-lift-in flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <span className="text-[10px] tracking-widest text-neutral-500 uppercase font-mono truncate max-w-[200px]">
                {activeSlip.source}
              </span>
              {activeSlip.date && (
                <span className="text-[10px] text-neutral-500 font-mono">
                  {activeSlip.date}
                </span>
              )}
            </div>

            <p className="font-serif-nook text-neutral-100 text-lg md:text-xl font-light italic leading-relaxed py-2 text-left">
              "{activeSlip.text}"
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action & View All Link */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          {activeSlip ? (
            <>
              <button
                onClick={handleFoldBack}
                className="
                  font-mono text-[11px] tracking-widest uppercase
                  text-neutral-500 hover:text-neutral-300 transition-colors duration-200 focus:outline-none px-3 py-2
                "
              >
                Fold back into jar
              </button>
              <button
                onClick={handleDraw}
                className="
                  font-mono text-[11px] tracking-widest uppercase
                  text-neutral-200 hover:text-white font-medium transition-colors duration-200 focus:outline-none px-4 py-2 rounded-xl bg-neutral-800/70 border border-neutral-700/80
                "
              >
                Draw another
              </button>
            </>
          ) : (
            <button
              onClick={handleDraw}
              id="jar-draw-btn"
              className="
                font-mono text-[11px] tracking-widest uppercase
                text-neutral-300 hover:text-white font-medium
                px-6 py-2.5 rounded-2xl border border-neutral-700/80 bg-neutral-900/60 hover:bg-neutral-800/70
                transition-all duration-200 focus:outline-none cursor-pointer
              "
            >
              Draw a memory
            </button>
          )}
        </div>

        {/* Quiet toggle to view all notes */}
        {!activeSlip && userNotes.length > 0 && (
          <button
            onClick={() => setViewMode('list')}
            className="font-mono text-[10px] tracking-widest uppercase text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none cursor-pointer pt-1"
          >
            view all notes ({userNotes.length}) →
          </button>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Main Memory Chest Screen
───────────────────────────────────────────────────────────── */
export default function MemoryChestScreen({ onBack, onNavigate }: MemoryChestScreenProps) {
  const [activeTab, setActiveTab] = useState<MemoryTab>('dumps')
  const [entries, setEntries] = useState<DumpEntry[]>([])
  const [voiceRecords, setVoiceRecords] = useState<VoiceRecord[]>([])
  const [reflections, setReflections] = useState<ReflectionEntry[]>([])

  useEffect(() => {
    setEntries(getAllEntries())
    getAllVoiceRecords().then(setVoiceRecords).catch(() => {})
    setReflections(loadReflections())
  }, [])

  // Segregated data pools
  const dumps = useMemo(() => {
    return entries.filter(e => e.type === 'text' || e.type === 'voice' || e.type === 'doodle')
  }, [entries])

  const dailyNotes = useMemo(() => {
    return entries.filter(e => e.type === 'note')
  }, [entries])

  function handleDeleteEntry(id: string) {
    deleteEntry(id)
    setEntries(getAllEntries())
  }

  function handleDeleteVoice(id: string) {
    deleteVoiceRecord(id).then(() => {
      getAllVoiceRecords().then(setVoiceRecords).catch(() => {})
    })
  }

  function handleDeleteReflection(id: string) {
    deleteReflectionEntry(id)
    setReflections(loadReflections())
  }

  return (
    <main
      id="memory-chest-screen"
      className="
        h-[100dvh] max-w-md mx-auto
        px-6 pt-10 pb-6
        flex flex-col justify-between
        overflow-hidden
        bg-[#0E0E0E]
        animate-fade-in
      "
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* ── Top Bar ─────────────────────────────────────────── */}
        <header className="flex items-center justify-between mb-6 shrink-0">
          <button
            id="memory-chest-back"
            onClick={onBack}
            className="
              flex items-center gap-1.5
              font-sans text-neutral-500 text-[0.62rem]
              tracking-[0.14em] uppercase
              hover:text-neutral-300 transition-colors
              focus:outline-none py-1
            "
          >
            <span className="text-[0.8rem] leading-none">←</span>
            return
          </button>

          <div className="flex flex-col items-center gap-[2px]">
            <h1 className="font-serif-nook text-neutral-200 text-xl font-light tracking-[0.18em] leading-none">
              Memory Chest
            </h1>
            <p className="font-sans text-neutral-500 text-[0.58rem] tracking-[0.1em] text-center">
              everything you chose to keep
            </p>
          </div>

          <div className="flex items-center justify-end min-w-[60px]">
            <HeaderAudioShortcut />
          </div>
        </header>

        {/* ── 3 Consolidated Tabs ─────────────────────────────── */}
        <div
          role="tablist"
          aria-label="Keepsake categories"
          className="flex items-center mb-5 border-b border-neutral-800/80 shrink-0"
        >
          {TABS.map(tab => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className="
                  relative flex-1 pb-3
                  font-sans text-[0.56rem] tracking-[0.12em] uppercase
                  transition-colors duration-300
                  focus:outline-none cursor-pointer
                "
              >
                <span className={isActive ? 'text-neutral-200 font-medium' : 'text-neutral-500 hover:text-neutral-400'}>
                  {tab.label}
                </span>
                <span
                  className={`
                    absolute bottom-0 left-0 right-0 h-px
                    transition-all duration-400
                    ${isActive ? 'bg-[#C9B99A] opacity-90' : 'bg-transparent'}
                  `}
                  aria-hidden="true"
                />
              </button>
            )
          })}
        </div>

        {/* ── Tab Panels ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-0.5">
          {/* TAB 1: DUMPS */}
          {activeTab === 'dumps' && (
            <div className="flex flex-col animate-fade-in pb-4">
              {dumps.length === 0 && voiceRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="font-serif-nook text-neutral-500 text-sm font-light italic">
                    The chest is empty.
                  </p>
                  <p className="font-sans text-neutral-600 text-[0.58rem] tracking-wider uppercase mt-1">
                    Offload thoughts in Brain Dump to preserve them here.
                  </p>
                </div>
              ) : (
                <>
                  {/* Voice recordings */}
                  {voiceRecords.map(rec => (
                    <VoiceDumpItem
                      key={rec.id}
                      record={rec}
                      onDelete={() => handleDeleteVoice(rec.id)}
                    />
                  ))}

                  {/* Text Dumps */}
                  {dumps.map(entry => (
                    <div
                      key={entry.id}
                      className="rounded-2xl bg-neutral-900/40 border border-neutral-800/60 p-5 mb-4 transition-all duration-300 hover:border-neutral-700/70 group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] tracking-widest text-neutral-500 uppercase font-mono">
                          Text Dump · {formatDate(entry.timestamp)}
                        </span>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          aria-label="Let go of entry"
                          className="text-[10px] tracking-wider uppercase text-neutral-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none cursor-pointer"
                        >
                          Let go
                        </button>
                      </div>
                      <p className="font-serif-nook text-neutral-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-light">
                        {entry.content}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* TAB 2: REFLECTIONS */}
          {activeTab === 'reflections' && (
            <div className="flex flex-col animate-fade-in pb-4">
              {reflections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="font-serif-nook text-neutral-500 text-sm font-light italic">
                    No reflections saved yet.
                  </p>
                  <p className="font-sans text-neutral-600 text-[0.58rem] tracking-wider uppercase mt-1">
                    Complete a guided prompt in Reflect to preserve it here.
                  </p>
                </div>
              ) : (
                reflections.map(ref => (
                  <div
                    key={ref.id}
                    className="rounded-2xl bg-neutral-900/40 border border-neutral-800/60 p-5 mb-4 transition-all duration-300 hover:border-neutral-700/70 group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] tracking-widest text-neutral-500 uppercase font-mono">
                        Reflection · {formatDate(ref.timestamp)}
                      </span>
                      <button
                        onClick={() => handleDeleteReflection(ref.id)}
                        aria-label="Let go of reflection"
                        className="text-[10px] tracking-wider uppercase text-neutral-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none cursor-pointer"
                      >
                        Let go
                      </button>
                    </div>
                    {/* Prompt Header Quote */}
                    <p className="text-xs text-neutral-400 font-serif-nook italic mb-3 leading-relaxed border-l-2 border-neutral-800 pl-3 py-0.5">
                      "{ref.prompt}"
                    </p>
                    {/* Response */}
                    <p className="font-serif-nook text-neutral-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-light">
                      {ref.response}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: NOTES JAR (Primary Home for Daily Notes) */}
          {activeTab === 'jar' && (
            <NotesJarView
              userNotes={dailyNotes}
              onDeleteNote={handleDeleteEntry}
            />
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <FooterNav active="memory-chest" onSelect={onNavigate} />
    </main>
  )
}
