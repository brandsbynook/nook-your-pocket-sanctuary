import React from 'react'

interface BottomControlsDockProps {
  children: React.ReactNode
  justify?: 'center' | 'between'
  className?: string
}

/**
 * Standardized bottom control dock for sensory, stimming, and drawing tools.
 * Safely centered and padded above the mobile home indicator.
 */
export function BottomControlsDock({
  children,
  justify = 'center',
  className = '',
}: BottomControlsDockProps) {
  return (
    <div
      className={`
        w-full max-w-md mx-auto px-6 py-3 sm:py-4
        flex items-center ${justify === 'between' ? 'justify-between' : 'justify-center'} gap-3
        shrink-0 select-none
        ${className}
      `}
    >
      {children}
    </div>
  )
}

interface ActionPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  children: React.ReactNode
  icon?: React.ReactNode
}

/**
 * Standardized Action Pill:
 * - Base: h-9 px-4 rounded-full text-xs uppercase tracking-widest transition-colors
 * - Inactive/Secondary: bg-[#1E1B18] border border-[#2C2926] text-[#8C8275] hover:text-[#EAE5DC]
 * - Active/Primary: bg-[#2C2926] border border-[#3A3632] text-[#EAE5DC]
 */
export function ActionPill({
  active = false,
  children,
  icon,
  className = '',
  ...props
}: ActionPillProps) {
  return (
    <button
      type="button"
      className={`
        h-9 min-h-[36px] px-4 rounded-full
        font-sans text-xs uppercase tracking-widest
        transition-colors flex items-center justify-center gap-2
        cursor-pointer focus:outline-none select-none
        ${active
          ? 'bg-[#2C2926] border border-[#3A3632] text-[#EAE5DC]'
          : 'bg-[#1E1B18] border border-[#2C2926] text-[#8C8275] hover:text-[#EAE5DC]'
        }
        disabled:opacity-40 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {icon && <span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span>}
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
 * Dual / Multi-Mode Segmented Pill Selector with uniform 36px touch targets
 */
export function SegmentedPillGroup<T extends string>({
  options,
  value,
  onChange,
}: SegmentedPillGroupProps<T>) {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#1E1B18] border border-[#2C2926]">
      {options.map(opt => {
        const isActive = opt.id === value
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`
              h-8 min-h-[32px] px-4 rounded-full
              font-sans text-xs uppercase tracking-widest
              transition-all duration-200 flex items-center justify-center gap-1.5
              cursor-pointer focus:outline-none select-none
              ${isActive
                ? 'bg-[#2C2926] border border-[#3A3632] text-[#EAE5DC]'
                : 'text-[#8C8275] hover:text-[#EAE5DC] border border-transparent'
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
