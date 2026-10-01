import React from 'react'

interface LeafIconProps extends React.SVGProps<SVGSVGElement> {
  active?: boolean
  size?: number
  strokeWidth?: number
  className?: string
}

/**
 * Clean, minimal 2D Leaf icon representing organic Anchors, Keepsakes, and Quiet Mode in Nook.
 * 
 * - Inactive State: Thin stroke (1.5px), stroke color #8C8275, fill transparent.
 * - Active / Pinned State: Stroke color #EAE5DC, fill #EAE5DC (solid).
 * - Size: Standardized 16px–18px box to align seamlessly with text baselines.
 */
export function LeafIcon({
  active = false,
  size = 18,
  strokeWidth = 1.5,
  className = '',
  ...props
}: LeafIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={active ? '#EAE5DC' : 'none'}
      stroke={active ? '#EAE5DC' : '#8C8275'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 transition-all duration-300 ${className}`}
      aria-hidden="true"
      {...props}
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path
        d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"
        stroke={active ? '#12100E' : '#8C8275'}
        strokeWidth={active ? 1.8 : strokeWidth}
      />
    </svg>
  )
}

export default LeafIcon
