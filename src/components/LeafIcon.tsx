import React from 'react'

interface LeafIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  size?: number
}

/**
 * Minimal 2D Leaf Icon for Quiet Mode and botanical anchors in Nook.
 */
export const LeafIcon: React.FC<LeafIconProps> = ({
  className = 'w-4 h-4',
  size = 16,
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* 2D botanical single-stroke leaf contour with subtle central vein */}
      <path d="M11 20A7 7 0 0 1 4 13c0-4.5 4-8.5 9-10 1.5 5 2.5 9.5 7 11a7 7 0 0 1-9 6Z" />
      <path d="M11 20c0-4 1.5-7 5-10" />
    </svg>
  )
}

export default LeafIcon
