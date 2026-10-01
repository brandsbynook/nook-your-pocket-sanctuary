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
            text-[#E5E5E7] group-hover:text-[#FFFFFF] group-active:text-[#FFFFFF] transition-colors
          ">
            {title}
          </h2>
          {subtitle && (
            <p className="
              font-sans text-[13px] tracking-normal mt-1
              text-[#71717A] group-hover:text-[#A1A1AA] transition-colors
            ">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right: delicate arrow */}
        <span
          className="
            text-[#71717A] text-sm font-light leading-none
            transition-all duration-300
            group-hover:text-[#A1A1AA] group-hover:translate-x-0.5
            ml-4 shrink-0
          "
          aria-hidden="true"
        >
          ›
        </span>
      </button>

      {/* Crisp faint separator */}
      {showDivider && <div className="border-b border-[#1F1F23] w-full" />}
    </div>
  )
}
