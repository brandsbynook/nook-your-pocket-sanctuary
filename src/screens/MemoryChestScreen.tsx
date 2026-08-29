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

type MemoryTab = 'dumps' | 'reflections' | 'jar'

interface MemoryChestScreenProps {
  onBack: () => void
  onNavigate?: (tab: NavTabId) => void
}

const TABS: { id: MemoryTab; label: string }[] = [
  { id: 'dumps',       label: 'Dumps' },
  { id: 'reflections', label: 'Reflections' },
  { id: 'jar',         label: 'Notes Jar' },
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
    <div className="border border-[#1C1C1C] bg-[#0E0E0E] p-4 transition-all duration-300 hover:border-[#2A2A2A] group">
      <div className="flex items-center justify-between mb-2">
        <span className="font-sans text-[0.6rem] tracking-[0.16em] uppercase text-[#71717A]">
          Voice Recording · {formatDate(record.timestamp)}
        </span>

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onDelete}
              className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#C9B99A] hover:underline"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#52525B]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete recording"
            className="text-[#3A3A3A] text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#71717A]"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mt-1">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full border border-[#2A2A2A] bg-[#141414] flex items-center justify-center text-[#E5E0D8] hover:border-[#C9B99A]/40 transition-colors shrink-0 focus:outline-none"
          aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
        >
          {isPlaying ? (
            <span className="flex gap-[3px]">
              <span className="w-[2.5px] h-3 bg-[#E5E0D8]" />
              <span className="w-[2.5px] h-3 bg-[#E5E0D8]" />
            </span>
          ) : (
            <span className="text-[0.7rem] ml-0.5 leading-none">▶</span>
          )}
        </button>

        {/* Minimal custom scrubber */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div
            onClick={handleSeek}
            className="w-full h-2 bg-[#1A1A1A] rounded-full cursor-pointer relative flex items-center overflow-hidden"
          >
            <div
              className="h-full bg-[#C9B99A]/70 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between font-sans text-[0.58rem] text-[#52525B] tabular-nums">
            <span>{isPlaying ? formatDuration(currentTime) : '0:00'}</span>
            <span>{formatDuration(record.durationMs)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Notes Jar View
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
]

function NotesJarView({
  userNotes,
}: {
  userNotes: DumpEntry[]
}) {
  const allPool = useMemo(() => {
    const fromUser = userNotes.map(n => n.content)
    return fromUser.length > 0 ? fromUser : SANCTUARY_NOTES
  }, [userNotes])

  const [currentNote, setCurrentNote] = useState<string>(() => {
    return allPool[Math.floor(Math.random() * allPool.length)]
  })
  const [isShaking, setIsShaking] = useState(false)

  function drawNewNote() {
    setIsShaking(true)
    setTimeout(() => {
      let next = currentNote
      if (allPool.length > 1) {
        while (next === currentNote) {
          next = allPool[Math.floor(Math.random() * allPool.length)]
        }
      }
      setCurrentNote(next)
      setIsShaking(false)
    }, 400)
  }

  return (
    <div className="flex flex-col items-center justify-between flex-1 py-4 animate-fade-in text-center">
      {/* Top hint */}
      <p className="font-sans text-[#52525B] text-[0.65rem] tracking-[0.14em] uppercase">
        Tap the jar to draw a quiet thought
      </p>

      {/* Center Jar / Note Display */}
      <div className="flex flex-col items-center my-auto w-full px-2">
        {/* Tactile Jar Emblem */}
        <button
          onClick={drawNewNote}
          aria-label="Draw note from jar"
          className={`
            mb-6 p-4 rounded-full border border-[#222222] bg-[#121212]
            hover:border-[#C9B99A]/40 transition-all duration-300 focus:outline-none
            ${isShaking ? 'scale-95 rotate-3' : 'hover:scale-105'}
          `}
        >
          {/* Stylized Sanctuary Vessel SVG */}
          <svg width="36" height="42" viewBox="0 0 36 42" fill="none" className="text-[#C9B99A]/80">
            <path d="M12 4H24M14 4V8M22 4V8M10 8H26C29 8 31 10.5 31 13.5V33C31 37 28 39 24 39H12C8 39 5 37 5 33V13.5C5 10.5 7 8 10 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M10 18C14 20 22 20 26 18" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" strokeLinecap="round"/>
            <circle cx="18" cy="27" r="2" fill="currentColor" fillOpacity="0.7"/>
          </svg>
        </button>

        {/* Drawn Note Card */}
        <div
          className={`
            border border-[#1E1E1E] bg-[#111111]/80 px-6 py-7 w-full max-w-[340px]
            transition-all duration-500
            ${isShaking ? 'opacity-20 translate-y-2' : 'opacity-100 translate-y-0 animate-lift-in'}
          `}
        >
          <p className="font-serif-nook text-[#E5E0D8] text-[1.25rem] font-light italic leading-relaxed">
            "{currentNote}"
          </p>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={drawNewNote}
        className="
          font-serif-nook text-[#E5E0D8] text-[0.95rem] font-light
          px-6 py-2.5 border border-[#2A2A2A]
          hover:border-[#C9B99A]/40 hover:text-[#C9B99A]
          transition-all duration-300 focus:outline-none
        "
      >
        Draw another
      </button>
    </div>
  )
}

function isDoodleEntry(dump: DumpEntry): boolean {
  return (
    dump.type === 'doodle' ||
    dump.content.startsWith('data:image/') ||
    dump.content.startsWith('[Doodle]')
  )
}

function getDoodleImageUrl(dump: DumpEntry): string {
  return dump.content.replace(/^\[Doodle\]\s*/, '')
}

/* ─────────────────────────────────────────────────────────────
   Main MemoryChestScreen
───────────────────────────────────────────────────────────── */
export default function MemoryChestScreen({ onBack, onNavigate }: MemoryChestScreenProps) {
  const [activeTab, setActiveTab] = useState<MemoryTab>('dumps')
  const [textDumps, setTextDumps] = useState<DumpEntry[]>(() => getAllEntries())
  const [voiceRecords, setVoiceRecords] = useState<VoiceRecord[]>([])
  const [reflections, setReflections] = useState<ReflectionEntry[]>(() => loadReflections())
  const [expandedTextId, setExpandedTextId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [selectedDoodleUrl, setSelectedDoodleUrl] = useState<string | null>(null)

  useEffect(() => {
    getAllVoiceRecords().then(records => {
      setVoiceRecords(records)
    })
  }, [])

  function handleDeleteDump(id: string) {
    deleteEntry(id)
    setTextDumps(prev => prev.filter(d => d.id !== id))
    setConfirmDeleteId(null)
  }

  function handleDeleteVoice(id: string) {
    deleteVoiceRecord(id).then(() => {
      setVoiceRecords(prev => prev.filter(v => v.id !== id))
    })
  }

  function handleDeleteReflection(id: string) {
    deleteReflectionEntry(id)
    setReflections(prev => prev.filter(r => r.id !== id))
    setConfirmDeleteId(null)
  }

  return (
    <>
      <main
        id="memory-chest-screen"
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
          <header className="flex items-center justify-between mb-6 shrink-0">
            <button
              id="memory-chest-back"
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

            <div className="flex flex-col items-center gap-[3px]">
              <h1 className="font-serif-nook text-[#E5E0D8] text-xl font-light tracking-[0.18em] leading-none">
                Memory Chest
              </h1>
              <p className="font-sans text-[#3A3A3A] text-[0.58rem] tracking-[0.1em] text-center">
                Things you chose to keep.
              </p>
            </div>

            <div className="w-[60px]" aria-hidden="true" />
          </header>

          {/* Sub-Navigation Tabs */}
          <div
            role="tablist"
            aria-label="Memory Chest views"
            className="flex items-center mb-5 border-b border-[#1E1E1E] shrink-0"
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

          {/* Tab Content Container */}
          <div className="flex-1 overflow-y-auto min-h-0 pb-4">
            {/* ── Dumps Tab ── */}
            {activeTab === 'dumps' && (
              <div className="flex flex-col gap-3 animate-fade-in">
                {textDumps.length === 0 && voiceRecords.length === 0 ? (
                  <div className="py-14 px-6 text-center">
                    <p className="font-serif-nook text-[#71717A] text-[1.05rem] font-light italic leading-relaxed">
                      Nothing stored here yet. Your chest will hold things whenever you choose to keep them.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Text Dumps & Doodles */}
                    {textDumps.map(dump => {
                      const isExpanded = expandedTextId === dump.id
                      const isConfirming = confirmDeleteId === dump.id
                      const isDoodle = isDoodleEntry(dump)
                      const typeLabel = isDoodle
                        ? 'DOODLE'
                        : dump.type === 'note'
                        ? "TODAY'S NOTE"
                        : 'TEXT DUMP'

                      return (
                        <div
                          key={dump.id}
                          className="border border-[#1C1C1C] bg-[#0E0E0E] p-4 transition-all duration-300 hover:border-[#2A2A2A] group rounded-sm"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-sans text-[0.6rem] tracking-[0.16em] uppercase text-[#71717A]">
                              {typeLabel} · {formatDate(dump.timestamp)}
                            </span>

                            {isConfirming ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDeleteDump(dump.id)}
                                  className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#C9B99A] hover:underline"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#52525B]"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(dump.id)}
                                aria-label="Delete entry"
                                className="text-[#3A3A3A] text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#71717A] p-1"
                              >
                                ×
                              </button>
                            )}
                          </div>

                          {isDoodle ? (
                            <div className="my-2">
                              <img
                                src={getDoodleImageUrl(dump)}
                                alt="Saved doodle"
                                onClick={() => setSelectedDoodleUrl(getDoodleImageUrl(dump))}
                                className="w-full h-40 object-contain bg-[#111111] rounded-lg border border-[#222222] cursor-pointer hover:border-[#383838] transition-colors"
                              />
                            </div>
                          ) : (
                            <>
                              <p className={`font-sans text-[#E5E0D8]/90 text-[0.88rem] font-light leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                                {dump.content}
                              </p>

                              {dump.content.length > 120 && (
                                <button
                                  onClick={() => setExpandedTextId(isExpanded ? null : dump.id)}
                                  className="mt-2 font-sans text-[0.6rem] tracking-[0.12em] uppercase text-[#52525B] hover:text-[#C9B99A] transition-colors"
                                >
                                  {isExpanded ? 'Show less' : 'Read more'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}

                    {/* Voice Records */}
                    {voiceRecords.map(record => (
                      <VoiceDumpItem
                        key={record.id}
                        record={record}
                        onDelete={() => handleDeleteVoice(record.id)}
                      />
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ── Reflections Tab ── */}
            {activeTab === 'reflections' && (
              <div className="flex flex-col gap-3 animate-fade-in">
                {reflections.length === 0 ? (
                  <div className="py-14 px-6 text-center">
                    <p className="font-serif-nook text-[#71717A] text-[1.05rem] font-light italic leading-relaxed">
                      Nothing stored here yet. Your reflections will rest here whenever you take time to reflect.
                    </p>
                  </div>
                ) : (
                  reflections.map(ref => {
                    const isConfirming = confirmDeleteId === ref.id
                    return (
                      <div
                        key={ref.id}
                        className="border border-[#1C1C1C] bg-[#0E0E0E] p-4 transition-all duration-300 hover:border-[#2A2A2A] group rounded-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-sans text-[0.6rem] tracking-[0.16em] uppercase text-[#71717A]">
                            Reflection · {formatDate(ref.timestamp)}
                          </span>

                          {isConfirming ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeleteReflection(ref.id)}
                                className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#C9B99A] hover:underline"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="font-sans text-[0.58rem] tracking-[0.14em] uppercase text-[#52525B]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(ref.id)}
                              aria-label="Delete reflection"
                              className="text-[#3A3A3A] text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#71717A] p-1"
                            >
                              ×
                            </button>
                          )}
                        </div>

                        <p className="font-serif-nook text-[#E5E0D8] text-[1.05rem] font-light italic mb-2">
                          "{ref.prompt}"
                        </p>
                        <p className="font-sans text-[#A1A1AA] text-[0.85rem] font-light leading-relaxed">
                          {ref.response}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* ── Notes Jar Tab ── */}
            {activeTab === 'jar' && (
              <NotesJarView userNotes={textDumps} />
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <FooterNav active="memory-chest" onSelect={onNavigate} />
      </main>

      {/* ── Fullscreen Doodle Lightbox Viewer ── */}
      {selectedDoodleUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in"
          onClick={() => setSelectedDoodleUrl(null)}
        >
          <div
            className="relative max-w-[380px] w-full bg-[#111111] border border-[#262626] rounded-2xl p-4 flex flex-col items-center shadow-2xl animate-lift-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between mb-3 border-b border-[#222222] pb-2">
              <span className="font-serif-nook text-sm text-[#E5E0D8] font-light">
                Doodle
              </span>
              <button
                onClick={() => setSelectedDoodleUrl(null)}
                aria-label="Close viewer"
                className="text-[#71717A] hover:text-[#E5E0D8] p-1 text-sm rounded-md transition-colors"
              >
                ✕
              </button>
            </div>

            <img
              src={selectedDoodleUrl}
              alt="Full resolution doodle"
              className="w-full max-h-[320px] object-contain rounded-lg bg-[#0C0C0C] border border-[#202020]"
            />

            <div className="flex items-center justify-between w-full mt-4 pt-2 border-t border-[#1C1C1C]">
              <button
                onClick={() => setSelectedDoodleUrl(null)}
                className="font-sans text-xs text-[#71717A] hover:text-[#E5E0D8] transition-colors"
              >
                Close
              </button>

              <a
                href={selectedDoodleUrl}
                download={`nook-doodle-${Date.now()}.png`}
                className="px-4 py-1.5 bg-[#E5E0D8] hover:bg-[#F0ECE1] text-[#141414] text-xs font-medium rounded-lg transition-colors"
              >
                Download / Export
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
