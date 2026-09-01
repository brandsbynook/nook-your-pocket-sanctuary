import React from 'react'

interface BottomControlsDockProps {
  children: React.ReactNode
  className?: string
}

/**
 * Standardized Unified Bottom Dock for sensory, stimming, and drawing tools.
 * Position: Absolute at bottom (z-20 pointer-events-auto select-none).
 * Outer Pill: Pure matte backing bg-[#1E1B18] with crisp 1px border border-[#2C2926] and rounded-full p-1.5 shadow-none.
 */
export const BottomControlsDock: React.FC<BottomControlsDockProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto select-none max-w-[90vw] ${className}`}>
      <div className="flex items-center gap-1.5 p-1.5 bg-[#1E1B18] border border-[#2C2926] rounded-full shadow-none">
        {children}
      </div>
    </div>
  )
}

interface ActionPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  children: React.ReactNode
  icon?: React.ReactNode
}

/**
 * Standardized Action Button (Mute, Clear, Reset, Restore)
 * Base: px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider text-[#8C8275] hover:text-[#EAE5DC] hover:bg-[#2C2926]/50 transition-colors flex items-center gap-1.5
 */
export const ActionPill: React.FC<ActionPillProps> = ({
  active = false,
  children,
  icon,
  className = '',
  ...props
}) => {
  return (
    <button
      type="button"
      className={`
        px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider
        transition-colors flex items-center justify-center gap-1.5
        cursor-pointer focus:outline-none select-none
        ${active
          ? 'bg-[#2C2926] text-[#EAE5DC] font-medium'
          : 'text-[#8C8275] hover:text-[#EAE5DC] hover:bg-[#2C2926]/50'
        }
        disabled:opacity-40 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {icon && <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}

interface SegmentedPillOption<T extends string> {
  id: T
  label: string
  icon?: React.ReactNode
}

interface SegmentedPillGroupProps<T extends string> {
  options: SegmentedPillOption<T>[]
  value: T
  onChange: (value: T) => void
}

/**
 * Standardized Segmented Tab Selector (Mode switches)
 * Active: bg-[#2C2926] text-[#EAE5DC] font-medium
 * Inactive: text-[#8C8275] hover:text-[#EAE5DC]
 * Sizing: px-4 py-1.5 rounded-full text-xs uppercase tracking-widest transition-colors
 */
export function SegmentedPillGroup<T extends string>({
  options,
  value,
  onChange,
}: SegmentedPillGroupProps<T>) {
  return (
    <div className="flex items-center gap-1">
      {options.map(opt => {
        const isActive = opt.id === value
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`
              px-4 py-1.5 rounded-full text-xs uppercase tracking-widest
              transition-colors flex items-center justify-center gap-1.5
              cursor-pointer focus:outline-none select-none
              ${isActive
                ? 'bg-[#2C2926] text-[#EAE5DC] font-medium'
                : 'text-[#8C8275] hover:text-[#EAE5DC]'
              }
            `}
          >
            {opt.icon && <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default BottomControlsDock
