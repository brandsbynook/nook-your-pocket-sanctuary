import { useState } from 'react'
import {
  loadDeadlines,
  saveDeadline,
  deleteDeadline,
  type NookDeadline,
} from '../utils/storage'
import { useAudio } from '../context/AudioContext'

interface DeadlineModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

function getRelativeDaysText(dueDateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDateStr)
  due.setHours(0, 0, 0, 0)

  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Past'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `In ${diffDays} days`
  if (diffDays < 14) return 'In 1 week'
  const weeks = Math.round(diffDays / 7)
  return `In ${weeks} weeks`
}

function getPresetDate(preset: 'end-of-week' | 'next-week'): string {
  const d = new Date()
  if (preset === 'end-of-week') {
    const day = d.getDay()
    const diff = (7 - day) % 7 || 7
    d.setDate(d.getDate() + diff)
  } else {
    d.setDate(d.getDate() + 7)
  }
  return d.toISOString().split('T')[0]
}

export default function DeadlineModal({ isOpen, onClose, onUpdate }: DeadlineModalProps) {
  const [deadlines, setDeadlines] = useState<NookDeadline[]>(() => loadDeadlines())
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState<string>(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 3)
    return tomorrow.toISOString().split('T')[0]
  })
  const [isAdding, setIsAdding] = useState(false)

  const { isUnlocked, openPaywall } = useAudio()

  if (!isOpen) return null

  function handleStartAdd() {
    if (deadlines.length >= 3 && !isUnlocked) {
      openPaywall()
      return
    }
    setIsAdding(true)
  }

  function handleAdd() {
    if (!title.trim() || !dueDate) return
    const created = saveDeadline(title.trim(), dueDate)
    setDeadlines(prev => [...prev, created])
    setTitle('')
    setIsAdding(false)
    onUpdate()
  }

  function handleDelete(id: string) {
    deleteDeadline(id)
    setDeadlines(prev => prev.filter(d => d.id !== id))
    onUpdate()
  }

  function handleSetPreset(preset: 'end-of-week' | 'next-week') {
    setDueDate(getPresetDate(preset))
  }

  // Active upcoming deadlines sorted chronologically
  const todayStr = new Date().toISOString().split('T')[0]
  const activeDeadlines = [...deadlines]
    .filter(d => d.dueDate >= todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center px-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* ── Modal Card (Opaque solid dark, rounded-2xl, shadow-2xl) ─── */}
      <div
        className="bg-[#141416] border border-[#222225] rounded-2xl w-full max-w-[380px] p-6 shadow-2xl animate-lift-in flex flex-col gap-4 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-[#1F1F23] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-nook text-xl font-light text-[#E5E5E7] leading-tight">
                Anchors
              </h2>
              <span className="font-sans text-[0.55rem] tracking-[0.14em] uppercase text-[#71717A]">
                {isUnlocked ? '✦ Unlimited' : `${activeDeadlines.length}/3 Free`}
              </span>
            </div>
            <p className="text-xs text-[#71717A] mt-1 font-sans">
              Anchors in time. No rush, no guilt.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-[#71717A] hover:text-[#E5E5E7] transition-colors p-1.5 rounded-lg hover:bg-[#18181C]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Deadline Items List ─────────────────────────────── */}
        <div className="flex flex-col max-h-[260px] overflow-y-auto min-h-[40px] pr-0.5">
          {activeDeadlines.length === 0 ? (
            <p className="font-serif-nook text-[#71717A] text-sm font-light italic text-center py-6">
              No active anchors set.
            </p>
          ) : (
            activeDeadlines.map(d => (
              <div
                key={d.id}
                className="bg-[#18181C] border border-[#222225] rounded-xl p-3.5 mb-2.5 flex justify-between items-center group hover:border-[#3F3F46] transition-colors"
              >
                <div className="flex flex-col gap-0.5 min-w-0 pr-3">
                  <span className="text-sm font-normal text-[#E5E5E7] truncate font-sans">
                    {d.title}
                  </span>
                  <span className="text-xs text-[#71717A] font-sans tracking-wide">
                    {getRelativeDaysText(d.dueDate)} • {d.dueDate}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(d.id)}
                  aria-label={`Delete ${d.title}`}
                  className="text-[#52525B] hover:text-[#E5E5E7] hover:bg-[#222225] p-1.5 rounded-md transition-colors shrink-0"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* ── Add Anchor Section ──────────────────────────────── */}
        {isAdding ? (
          <div className="bg-[#18181C] border border-[#222225] rounded-xl p-3.5 flex flex-col gap-3 animate-fade-in mt-1">
            <input
              id="anchor-title-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Anchor title (e.g. Submit draft)"
              className="
                w-full bg-transparent border-b border-[#222225]
                font-sans text-sm text-[#E5E5E7] font-normal
                placeholder:text-[#52525B] py-1.5 focus:outline-none focus:border-[#3F3F46]
              "
              autoFocus
            />

            {/* Presets & Date Picker */}
            <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetPreset('end-of-week')}
                  className="px-2.5 py-1 bg-[#222225] hover:bg-[#2C2C30] rounded-md font-sans text-[0.62rem] tracking-wider uppercase text-[#71717A] hover:text-[#E5E5E7] transition-colors"
                >
                  End of week
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset('next-week')}
                  className="px-2.5 py-1 bg-[#222225] hover:bg-[#2C2C30] rounded-md font-sans text-[0.62rem] tracking-wider uppercase text-[#71717A] hover:text-[#E5E5E7] transition-colors"
                >
                  Next week
                </button>
              </div>

              <input
                type="date"
                value={dueDate}
                min={todayStr}
                onChange={e => setDueDate(e.target.value)}
                className="bg-[#222225] border border-[#3F3F46] text-[#E5E5E7] font-sans text-xs px-2.5 py-1 rounded-md focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="font-sans text-xs text-[#52525B] hover:text-[#E5E5E7] px-2 py-1 transition-colors"
              >
                Cancel
              </button>
              <button
                id="save-anchor-btn"
                type="button"
                onClick={handleAdd}
                disabled={!title.trim()}
                className="
                  px-4 py-1.5 bg-[#E5E5E7] hover:bg-white text-[#0A0A0B] font-medium text-xs rounded-lg
                  disabled:opacity-30 disabled:cursor-not-allowed transition-colors
                "
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <button
            id="open-add-anchor-btn"
            onClick={handleStartAdd}
            className="w-full py-3 mt-2 border border-dashed border-[#222225] hover:border-[#3F3F46] rounded-xl text-xs text-[#71717A] hover:text-[#E5E5E7] flex items-center justify-center gap-1.5 transition-colors focus:outline-none"
          >
            <span>+ Add Anchor</span>
            {deadlines.length >= 3 && !isUnlocked && (
              <span className="text-[0.62rem] text-[#E5E5E7] font-sans ml-1">⚿ Key</span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
