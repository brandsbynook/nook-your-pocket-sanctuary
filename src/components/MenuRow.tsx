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
          py-5
          group cursor-pointer transition-colors
          focus:outline-none focus-visible:outline-none
          text-left
        "
        aria-label={title}
      >
        {/* Left: title + subtitle stacked */}
        <div className="flex flex-col items-start gap-[2px]">
          <h2 className="
            font-serif-nook text-xl font-light
            tracking-wide leading-snug
            text-[#EAE5DC] group-hover:text-[#F4EFE6] group-active:text-[#F4EFE6] transition-colors
          ">
            {title}
          </h2>
          {subtitle && (
            <p className="
              font-sans text-[13px] tracking-normal mt-1
              text-[#7A7164] group-hover:text-[#A89F91] transition-colors
            ">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right: delicate arrow */}
        <span
          className="
            text-[#7A7164] text-sm font-light leading-none
            transition-all duration-300
            group-hover:text-[#A89F91] group-hover:translate-x-0.5
            ml-4 shrink-0
          "
          aria-hidden="true"
        >
          ›
        </span>
      </button>

      {/* Crisp faint separator */}
      {showDivider && <div className="border-b border-[#2C2926]/40 w-full" />}
    </div>
  )
}
