export type NavTabId = 'cards' | 'memory-chest' | 'settings'

interface FooterNavProps {
  active?: NavTabId | string
  onSelect?: (tab: NavTabId) => void
}

const navItems: { id: NavTabId; label: string }[] = [
  { id: 'cards',        label: 'Cards'        },
  { id: 'memory-chest', label: 'Memory Chest' },
  { id: 'settings',     label: 'Settings'     },
]

export default function FooterNav({ active, onSelect }: FooterNavProps) {
  const activeNormalized = active?.replace(/^nav-/, '')

  return (
    <nav
      id="footer-nav"
      className="flex items-center justify-between pt-3 pb-safe border-t border-[#1E1E1E]"
      aria-label="Main navigation"
    >
      {navItems.map(({ id, label }) => {
        const isActive = activeNormalized === id
        return (
          <button
            key={id}
            id={`nav-${id}`}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelect?.(id)}
            className="
              flex flex-col items-center gap-[5px]
              py-1 flex-1
              transition-all duration-300 group
              focus:outline-none
            "
          >
            <span
              className={`
                font-sans text-[0.58rem] tracking-[0.16em] uppercase
                transition-colors duration-300
                ${isActive
                  ? 'text-[#C9B99A]'
                  : 'text-[#52525B] group-hover:text-[#71717A]'
                }
              `}
            >
              {label}
            </span>

            {/* Active dot indicator — amber accent */}
            <span
              className={`
                block h-[3px] w-[3px]
                transition-all duration-400
                ${isActive ? 'bg-[#C9B99A] opacity-100' : 'opacity-0'}
              `}
              aria-hidden="true"
            />
          </button>
        )
      })}
    </nav>
  )
}
