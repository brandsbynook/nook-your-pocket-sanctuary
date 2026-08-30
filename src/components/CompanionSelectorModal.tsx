import { type CompanionId } from '../utils/storage'

export interface CompanionItem {
  id: CompanionId
  name: string
  image: string
}

export const COMPANION_ROSTER: CompanionItem[] = [
  { id: 'bear',     name: 'Bear',        image: '/companions/bear.png' },
  { id: 'bear1',    name: 'Polar Bear',  image: '/companions/bear1.png' },
  { id: 'bear2',    name: 'Sleepy Bear', image: '/companions/bear2.png' },
  { id: 'bunny',    name: 'Bunny',       image: '/companions/bunny.png' },
  { id: 'cat',      name: 'Cat',         image: '/companions/cat.png' },
  { id: 'dog',      name: 'Dog',         image: '/companions/dog.png' },
  { id: 'dog3',     name: 'Pup',         image: '/companions/dog3.png' },
  { id: 'elephant', name: 'Elephant',    image: '/companions/elephant.png' },
  { id: 'fox',      name: 'Fox',         image: '/companions/fox.png' },
  { id: 'giraffe',  name: 'Giraffe',     image: '/companions/giraffe.png' },
  { id: 'owl',      name: 'Owl',         image: '/companions/owl.png' },
  { id: 'panda',    name: 'Panda',       image: '/companions/panda.png' },
  { id: 'penguin',  name: 'Penguin',     image: '/companions/penguin.png' },
  { id: 'rhino',    name: 'Rhino',       image: '/companions/rhino.png' },
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
          w-full max-w-md max-h-[85vh] bg-[#0E0E12] border border-[#22222C]
          rounded-2xl p-5 sm:p-6 flex flex-col
          shadow-2xl relative overflow-hidden select-none animate-lift-in
        "
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1E1E26] shrink-0">
          <div className="flex flex-col">
            <h2 id="companion-modal-title" className="font-serif-nook text-xl text-[#FFFFFF] font-light tracking-wide">
              Sanctuary Companions
            </h2>
            <p className="font-sans text-[0.58rem] text-neutral-500 tracking-[0.1em] mt-0.5">
              a quiet presence to keep you company
            </p>
          </div>
          <button
            id="close-companion-modal-btn"
            onClick={onClose}
            aria-label="Close companion selector"
            className="font-sans text-[0.62rem] text-neutral-500 hover:text-neutral-300 tracking-[0.14em] uppercase px-2 py-1 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Scrollable Companion Roster (2-Column Grid with No Truncation) */}
        <div className="grid grid-cols-2 gap-2.5 my-4 overflow-y-auto pr-1 no-scrollbar max-h-[55vh]">
          {COMPANION_ROSTER.map(comp => {
            const isSelected = comp.id === selectedId
            return (
              <button
                key={comp.id}
                id={`modal-companion-${comp.id}`}
                onClick={() => {
                  onSelect(comp.id)
                  if ('vibrate' in navigator) navigator.vibrate([12])
                }}
                className={`
                  flex items-center gap-3 p-3 rounded-xl text-left border transition-all duration-300 cursor-pointer focus:outline-none group
                  ${isSelected
                    ? 'border-[#C9B99A]/60 bg-[#1D1B16] text-[#FFFFFF] shadow-sm shadow-[#C9B99A]/5'
                    : 'border-[#1E1E26] bg-[#101014] text-[#A1A1AA] hover:border-[#2A2A38] hover:bg-[#131318]'
                  }
                `}
              >
                {/* Companion Thumbnail */}
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-black/40 p-0.5">
                  <img
                    src={comp.image}
                    alt={comp.name}
                    className="w-full h-full object-contain pointer-events-none group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </div>

                {/* Companion Name (clean whitespace-nowrap, no trailing dots) */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`font-serif-nook text-sm font-light whitespace-nowrap leading-tight ${isSelected ? 'text-[#FFFFFF]' : 'text-neutral-300 group-hover:text-[#FFFFFF]'}`}>
                    {comp.name}
                  </span>
                  {isSelected && (
                    <span className="font-sans text-[0.52rem] text-[#C9B99A] uppercase tracking-wider mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C9B99A] animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Done Action */}
        <div className="pt-3 border-t border-[#1E1E26] shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#1A1916] border border-[#C9B99A]/40 text-[#FFFFFF] hover:bg-[#22201C] font-serif-nook text-sm font-light rounded-xl transition-colors cursor-pointer tracking-wide"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
