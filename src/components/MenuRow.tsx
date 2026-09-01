interface MenuRowProps {
  id: string
  title: string
  subtitle?: string
  delay?: number
  showDivider?: boolean
  onClick?: () => void
}

export default function MenuRow({ id, title, subtitle, delay = 0, showDivider = true, onClick }: MenuRowProps) {
  return (
    <div
      className="animate-row-reveal"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <button
        id={id}
        onClick={onClick}
        className="
          w-full flex items-center justify-between
          py-[1.4rem]
          group cursor-pointer transition-colors
          focus:outline-none focus-visible:outline-none
          text-left
        "
        aria-label={title}
      >
        {/* Left: title + subtitle stacked */}
        <div className="flex flex-col items-start gap-[4px]">
          <h2 className="
            font-serif-nook text-[1.15rem] font-light
            tracking-wide leading-snug
            text-[#C2B69D] group-hover:text-[#EAE5DC] group-active:text-[#EAE5DC] transition-colors
          ">
            {title}
          </h2>
          {subtitle && (
            <p className="
              font-sans text-xs tracking-wider mt-1
              text-[#8C8275] group-hover:text-[#A89F91] transition-colors
            ">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right: delicate arrow */}
        <span
          className="
            text-[#52525B] text-sm font-light leading-none
            transition-all duration-300
            group-hover:text-[#C9B99A]/70 group-hover:translate-x-0.5
            ml-4 shrink-0
          "
          aria-hidden="true"
        >
          ›
        </span>
      </button>

      {/* Soft divider — only rendered between items */}
      {showDivider && <div className="h-px w-full bg-[#242424]" />}
    </div>
  )
}
