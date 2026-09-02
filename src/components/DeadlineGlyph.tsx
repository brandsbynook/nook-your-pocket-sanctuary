import { useState, useEffect, useCallback } from 'react'
import { loadDeadlines, type NookDeadline } from '../utils/storage'
import DeadlineModal from './DeadlineModal'

const TRACK_WIDTH = 70
const OPACITIES = ['opacity-85', 'opacity-50', 'opacity-25']
const HORIZON_DAYS = 14

function getDaysRemaining(dueDateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDateStr)
  due.setHours(0, 0, 0, 0)
  const diffTime = due.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}

export default function DeadlineGlyph() {
  const [deadlines, setDeadlines] = useState<NookDeadline[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const refreshDeadlines = useCallback(() => {
    const all = loadDeadlines()
    const todayStr = new Date().toISOString().split('T')[0]
    // Filter active (non-expired) and sort ascending
    const active = all
      .filter(d => d.dueDate >= todayStr)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    setDeadlines(active)
  }, [])

  useEffect(() => {
    refreshDeadlines()
  }, [refreshDeadlines])

  return (
    <>
      <button
        id="deadline-glyph"
        onClick={() => setIsModalOpen(true)}
        className="flex flex-col items-end gap-[10px] cursor-pointer focus:outline-none p-1 group"
        aria-label="View and manage deadlines"
        title="Visual deadline anchors (tap to view)"
      >
        {[0, 1, 2].map(index => {
          const deadline = deadlines[index]
          const opacityClass = OPACITIES[index]

          if (!deadline) {
            // Empty placeholder slot
            return (
              <span
                key={index}
                className="block h-[4.5px] bg-[#1F1F23] rounded-full transition-all duration-500 group-hover:bg-[#3F3F46]"
                style={{ width: `${TRACK_WIDTH}px` }}
              />
            )
          }

          const daysLeft = getDaysRemaining(deadline.dueDate)
          // Ratio: scale based on remaining days (14 days = 100% full, 0 days = 18% minimal sliver)
          const fillRatio = Math.min(1, Math.max(0.18, daysLeft / HORIZON_DAYS))
          const fillWidth = Math.max(6, Math.round(TRACK_WIDTH * fillRatio))

          return (
            <div
              key={deadline.id}
              className="relative flex items-center justify-end h-[4.5px] bg-[#141416] rounded-full overflow-hidden"
              style={{ width: `${TRACK_WIDTH}px` }}
            >
              <span
                className={`block h-full bg-[#E5E5E7] rounded-full ${opacityClass} transition-all duration-500 group-hover:bg-white`}
                style={{ width: `${fillWidth}px` }}
              />
            </div>
          )
        })}
      </button>

      <DeadlineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={refreshDeadlines}
      />
    </>
  )
}
