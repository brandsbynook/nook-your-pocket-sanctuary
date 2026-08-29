interface MenuRowProps {
  id: string
  title: string
  subtitle?: string
  delay?: number
  onClick?: () => void
}

export default function MenuRow({ id, title, subtitle, delay = 0, onClick }: MenuRowProps) {
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
          group
          transition-all duration-300
          focus:outline-none focus-visible:outline-none
          text-left
        "
        aria-label={title}
      >
        {/* Left: title + subtitle stacked */}
        <div className="flex flex-col items-start gap-[4px]">
          <span className="
            font-serif-nook text-[#E5E0D8] text-[1.15rem] font-light
            tracking-wide leading-snug
            group-hover:text-[#C9B99A] transition-colors duration-300
          ">
            {title}
          </span>
          {subtitle && (
            <span className="
              font-sans text-[#52525B] text-[0.68rem]
              font-light leading-none tracking-[0.07em]
              transition-colors duration-300
              group-hover:text-[#71717A]
            ">
              {subtitle}
            </span>
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

      {/* Soft divider — slightly more visible than #1C1C1C */}
      <div className="h-px w-full bg-[#242424]" />
    </div>
  )
}
