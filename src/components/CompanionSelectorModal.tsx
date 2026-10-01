import { type CompanionId } from '../utils/storage'
import { triggerHaptic } from '../utils/haptics'

export interface CompanionItem {
  id: CompanionId
  name: string
  image: string
  imagePath: string
}

export const COMPANION_ROSTER: CompanionItem[] = [
  { id: 'cat',      name: 'Cat',         image: '/companions/cat.png',       imagePath: '/companions/cat.png' },
  { id: 'dog',      name: 'Dog',         image: '/companions/dog.png',       imagePath: '/companions/dog.png' },
  { id: 'bear1',    name: 'Polar Bear',  image: '/companions/bear1.png',     imagePath: '/companions/bear1.png' },
  { id: 'rhino',    name: 'Rhino',       image: '/companions/rhino.png',     imagePath: '/companions/rhino.png' },
  { id: 'penguin',  name: 'Penguin',     image: '/companions/penguin.png',   imagePath: '/companions/penguin.png' },
  { id: 'panda',    name: 'Panda',       image: '/companions/panda.png',     imagePath: '/companions/panda.png' },
  { id: 'bunny',    name: 'Bunny',       image: '/companions/bunny.png',     imagePath: '/companions/bunny.png' },
  { id: 'elephant', name: 'Elephant',    image: '/companions/elephant_.png', imagePath: '/companions/elephant_.png' },
]

interface CompanionSelectorModalProps {
  isOpen: boolean
  selectedId: CompanionId
  onSelect: (id: CompanionId) => void
  onClose: () => void
}

export default function CompanionSelectorModal({
  isOpen,
  selectedId,
  onSelect,
  onClose,
}: CompanionSelectorModalProps) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="companion-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="
          w-full max-w-md bg-[#141416] border border-[#222225]
          rounded-2xl p-5 sm:p-6 flex flex-col
          shadow-2xl relative overflow-hidden select-none animate-lift-in
        "
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23] shrink-0">
          <div className="flex flex-col">
            <h2 id="companion-modal-title" className="font-serif-nook text-xl text-[#E5E5E7] font-light tracking-wide">
              Sanctuary Companions
            </h2>
            <p className="font-sans text-[0.58rem] text-[#71717A] tracking-[0.1em] mt-0.5">
              a quiet presence to keep you company
            </p>
          </div>
          <button
            id="close-companion-modal-btn"
            onClick={onClose}
            aria-label="Close companion selector"
            className="font-sans text-[0.62rem] text-[#71717A] hover:text-[#E5E5E7] tracking-[0.14em] uppercase px-2 py-1 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* 8-Item Companion Roster (Clean 2x4 Grid with No Scroll or Orphaned Slots) */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          {COMPANION_ROSTER.map(comp => {
            const isSelected = comp.id === selectedId
            return (
              <button
                key={comp.id}
                id={`modal-companion-${comp.id}`}
                onClick={() => {
                  onSelect(comp.id)
                  triggerHaptic(12)
                }}
                className={`
                  flex items-center gap-3 p-3 rounded-xl text-left border transition-all duration-300 cursor-pointer focus:outline-none group
                  ${isSelected
                    ? 'border-[#3F3F46] bg-[#1A1A1E] text-[#FFFFFF] shadow-sm'
                    : 'border-[#222225] bg-[#0A0A0B] text-[#71717A] hover:border-[#3F3F46] hover:bg-[#141416]'
                  }
                `}
              >
                {/* Companion Thumbnail with Fallback Safety */}
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-black/40 p-0.5">
                  <img
                    src={comp.imagePath || comp.image}
                    alt={comp.name}
                    className="w-full h-full object-contain pointer-events-none group-hover:scale-105 transition-transform"
                    loading="lazy"
                    onError={e => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = '/companions/cat.png'
                    }}
                  />
                </div>

                {/* Companion Name (clean whitespace-nowrap, no trailing dots) */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`font-serif-nook text-sm font-light whitespace-nowrap leading-tight ${isSelected ? 'text-[#E5E5E7]' : 'text-[#71717A] group-hover:text-[#E5E5E7]'}`}>
                    {comp.name}
                  </span>
                  {isSelected && (
                    <span className="font-sans text-[0.52rem] text-[#E5E5E7] uppercase tracking-wider mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E5E5E7] animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Done Action */}
        <div className="pt-3 border-t border-[#1F1F23] shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#141416] border border-[#222225] text-[#E5E5E7] hover:bg-[#1E1E22] font-serif-nook text-sm font-light rounded-xl transition-colors cursor-pointer tracking-wide"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
