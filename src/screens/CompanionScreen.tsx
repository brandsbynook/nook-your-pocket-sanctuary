import { useState, useEffect, useCallback, useRef } from 'react'
import { getCompanionChoice, setCompanionChoice } from '../utils/storage'

interface CompanionScreenProps {
  onBack: () => void
}

/* ─────────────────────────────────────────────────────────────────────
   SVG COMPANIONS
   Each animal: crescent curl, minimal line-art, warm amber tones.
───────────────────────────────────────────────────────────────────── */

function CurledCatSvg() {
  return (
    <svg viewBox="0 0 200 200" width="180" height="180" fill="none">
      {/* Body: crescent C-curl, back arcing over top */}
      <path
        d="M 62,82 C 55,65 62,42 80,34 C 100,25 128,32 145,52 C 162,73 162,103 150,126 C 138,150 116,162 90,162 C 74,162 62,154 58,144 C 70,148 86,148 100,142 C 118,133 130,114 128,94 C 126,76 112,60 94,57 C 78,54 65,64 62,82 Z"
        fill="rgba(254,243,199,0.06)"
        stroke="rgba(254,243,199,0.68)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Head: round, tucked low-left */}
      <ellipse cx="58" cy="90" rx="21" ry="19" transform="rotate(-10 58 90)"
        fill="rgba(254,243,199,0.06)" stroke="rgba(254,243,199,0.68)" strokeWidth="1.7" />
      {/* Left ear */}
      <path className="animate-ear-twitch" d="M 41,76 L 36,60 L 52,70"
        stroke="rgba(254,243,199,0.68)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
        style={{ transformOrigin: '46px 73px' }} />
      {/* Right ear */}
      <path d="M 60,72 L 64,57 L 74,68"
        stroke="rgba(254,243,199,0.68)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Closed crescent eyes */}
      <path d="M 47,88 C 50,91 54,91 57,88" stroke="rgba(254,243,199,0.72)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M 60,86 C 63,89 67,89 70,86" stroke="rgba(254,243,199,0.72)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* Tiny nose */}
      <ellipse cx="58" cy="95" rx="2" ry="1.2" fill="rgba(254,243,199,0.65)" />
      {/* Tail curling around front */}
      <path d="M 90,162 C 100,172 102,182 88,184 C 72,186 52,174 46,158 C 42,148 46,136 54,134"
        stroke="rgba(254,243,199,0.50)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function CurledFoxSvg() {
  return (
    <svg viewBox="0 0 200 200" width="180" height="180" fill="none">
      {/* Body */}
      <path
        d="M 60,85 C 52,66 60,42 80,32 C 102,22 132,30 150,52 C 168,74 166,108 152,132 C 138,155 112,165 85,162 C 68,160 55,150 52,140 C 66,144 85,144 100,136 C 120,125 130,104 126,84 C 122,66 106,52 88,50 C 72,48 62,64 60,85 Z"
        fill="rgba(254,243,199,0.06)" stroke="rgba(254,243,199,0.68)" strokeWidth="1.7"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Head */}
      <ellipse cx="56" cy="92" rx="22" ry="20" transform="rotate(-12 56 92)"
        fill="rgba(254,243,199,0.06)" stroke="rgba(254,243,199,0.68)" strokeWidth="1.7" />
      {/* Fox ears: tall and pointed */}
      <path className="animate-ear-twitch" d="M 36,76 L 28,52 L 50,68"
        stroke="rgba(254,243,199,0.68)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
        style={{ transformOrigin: '43px 72px' }} />
      <path d="M 58,70 L 62,48 L 78,65"
        stroke="rgba(254,243,199,0.68)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Narrow fox muzzle */}
      <path d="M 44,96 L 38,104 L 50,104"
        stroke="rgba(254,243,199,0.45)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Closed eyes */}
      <path d="M 45,88 C 48,91 52,91 55,88" stroke="rgba(254,243,199,0.72)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M 58,86 C 62,89 66,89 69,86" stroke="rgba(254,243,199,0.72)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* Big fluffy tail */}
      <path d="M 85,162 C 100,178 106,192 90,196 C 70,200 44,184 36,164 C 30,150 36,136 48,134"
        stroke="rgba(254,243,199,0.52)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M 90,196 C 84,202 76,202 74,198"
        stroke="rgba(254,243,199,0.28)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function HunchedOwlSvg() {
  return (
    <svg viewBox="0 0 200 200" width="180" height="180" fill="none">
      {/* Body: round puffed ball */}
      <ellipse cx="100" cy="118" rx="52" ry="54"
        fill="rgba(254,243,199,0.06)" stroke="rgba(254,243,199,0.68)" strokeWidth="1.7" />
      {/* Head */}
      <ellipse cx="100" cy="70" rx="32" ry="30"
        fill="rgba(254,243,199,0.06)" stroke="rgba(254,243,199,0.68)" strokeWidth="1.7" />
      {/* Ear tufts */}
      <path className="animate-ear-twitch" d="M 76,44 L 70,28 L 84,40"
        stroke="rgba(254,243,199,0.68)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
        style={{ transformOrigin: '77px 42px' }} />
      <path d="M 116,40 L 124,26 L 130,40"
        stroke="rgba(254,243,199,0.68)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Closed round eyes */}
      <path d="M 84,68 C 88,72 94,72 98,68" stroke="rgba(254,243,199,0.72)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M 102,68 C 106,72 112,72 116,68" stroke="rgba(254,243,199,0.72)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Tiny hooked beak */}
      <path d="M 97,76 C 97,82 103,82 103,76"
        stroke="rgba(254,243,199,0.50)" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      {/* Wing feather lines */}
      <path d="M 56,110 C 62,122 66,140 63,156" stroke="rgba(254,243,199,0.22)" strokeWidth="1.2" strokeLinecap="round" fill="none" strokeDasharray="2 5" />
      <path d="M 144,110 C 138,122 134,140 137,156" stroke="rgba(254,243,199,0.22)" strokeWidth="1.2" strokeLinecap="round" fill="none" strokeDasharray="2 5" />
      {/* Talons */}
      <path d="M 82,170 C 78,177 72,177 70,174" stroke="rgba(254,243,199,0.38)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M 100,172 C 98,179 96,179 94,176" stroke="rgba(254,243,199,0.38)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M 118,170 C 122,177 128,177 130,174" stroke="rgba(254,243,199,0.38)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function CurledBearSvg() {
  return (
    <svg viewBox="0 0 200 200" width="180" height="180" fill="none">
      {/* Chunky body */}
      <path
        d="M 55,90 C 44,68 52,40 75,28 C 100,16 136,26 155,52 C 174,78 170,116 154,140 C 138,164 108,174 80,168 C 60,164 46,150 42,136 C 62,144 86,144 104,132 C 126,117 134,94 128,72 C 122,52 102,38 80,40 C 62,42 52,64 55,90 Z"
        fill="rgba(254,243,199,0.06)" stroke="rgba(254,243,199,0.68)" strokeWidth="1.9"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Head */}
      <ellipse cx="52" cy="100" rx="25" ry="24" transform="rotate(-8 52 100)"
        fill="rgba(254,243,199,0.06)" stroke="rgba(254,243,199,0.68)" strokeWidth="1.9" />
      {/* Round bear ears */}
      <circle className="animate-ear-twitch" cx="36" cy="80" r="10"
        fill="rgba(254,243,199,0.04)" stroke="rgba(254,243,199,0.68)" strokeWidth="1.6"
        style={{ transformOrigin: '42px 87px' }} />
      <circle cx="60" cy="76" r="10"
        fill="rgba(254,243,199,0.04)" stroke="rgba(254,243,199,0.68)" strokeWidth="1.6" />
      {/* Muzzle */}
      <ellipse cx="52" cy="108" rx="13" ry="9" stroke="rgba(254,243,199,0.38)" strokeWidth="1.2" fill="none" />
      <ellipse cx="52" cy="106" rx="2.5" ry="1.5" fill="rgba(254,243,199,0.58)" />
      {/* Closed eyes */}
      <path d="M 38,96 C 41,99 45,99 48,96" stroke="rgba(254,243,199,0.72)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M 54,93 C 57,96 61,96 64,93" stroke="rgba(254,243,199,0.72)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* Little paw peeking */}
      <path d="M 42,134 C 44,142 50,146 58,144"
        stroke="rgba(254,243,199,0.40)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────
   Companion Registry
───────────────────────────────────────────────────────────── */
const COMPANIONS = [
  { id: 'cat',  label: 'CAT',  Svg: CurledCatSvg  },
  { id: 'fox',  label: 'FOX',  Svg: CurledFoxSvg  },
  { id: 'owl',  label: 'OWL',  Svg: HunchedOwlSvg },
  { id: 'bear', label: 'BEAR', Svg: CurledBearSvg },
]

/* ─────────────────────────────────────────────────────────────
   Main Companion Screen
───────────────────────────────────────────────────────────── */
export default function CompanionScreen({ onBack }: CompanionScreenProps) {
  const [companion, setCompanion] = useState<string>(
    () => getCompanionChoice() || 'cat'
  )
  const [tapping, setTapping] = useState(false)
  const [glowKey, setGlowKey] = useState(0)
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeCompanion = COMPANIONS.find(c => c.id === companion) ?? COMPANIONS[0]
  const { Svg: ActiveSvg } = activeCompanion

  function handleSelectCompanion(id: string) {
    setCompanion(id)
    setCompanionChoice(id)
  }

  const handleTap = useCallback(() => {
    if ('vibrate' in navigator) navigator.vibrate([18])
    setGlowKey(k => k + 1)
    setTapping(true)
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current)
    tapTimeoutRef.current = setTimeout(() => setTapping(false), 1000)
  }, [])

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current)
    }
  }, [])

  return (
    <main className="flex flex-col h-full bg-[#0C0C0F] text-neutral-200 overflow-hidden">

      {/* Back nav */}
      <div className="flex items-center px-5 pt-5 pb-2 shrink-0">
        <button
          id="companion-back-btn"
          onClick={onBack}
          className="font-mono text-[10px] tracking-widest uppercase text-neutral-600 hover:text-neutral-400 transition-colors focus:outline-none cursor-pointer"
        >
          ← back
        </button>
      </div>

      {/* Header */}
      <div className="text-center px-6 pt-1 pb-0 shrink-0">
        <h1 className="font-serif text-xl text-neutral-300 font-light tracking-wide lowercase">
          companion
        </h1>
        <p className="text-xs text-neutral-500 font-serif italic font-normal mt-1 lowercase">
          a quiet presence while you work or rest
        </p>
      </div>

      {/* Companion Visual */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-6">

        {/* Tap target + glow container */}
        <div
          className="relative flex items-center justify-center cursor-pointer select-none"
          style={{ width: 256, height: 256 }}
          onClick={handleTap}
          role="button"
          aria-label={`Tap to greet your ${activeCompanion.label.toLowerCase()}`}
        >
          {/* Ambient background glow */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(254,243,199,0.04) 0%, transparent 70%)',
            }}
          />

          {/* Tap pulse ring — key remount re-fires CSS animation */}
          {tapping && (
            <div
              key={glowKey}
              className="absolute inset-0 rounded-full pointer-events-none animate-companion-tap-glow"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(254,243,199,0.22) 0%, rgba(254,243,199,0.06) 55%, transparent 80%)',
              }}
            />
          )}

          {/* Breathing wrapper */}
          <div className="animate-cat-breathe flex items-center justify-center">
            <ActiveSvg />
          </div>
        </div>

        {/* Presence caption */}
        <p
          className="font-serif text-[11px] text-neutral-600 italic font-normal text-center mt-0.5 lowercase tracking-wide transition-all duration-500"
          style={{ opacity: tapping ? 0.85 : 0.45 }}
        >
          {tapping
            ? `your ${activeCompanion.label.toLowerCase()} stirs softly\u2026`
            : 'sleeping peacefully'}
        </p>
      </div>

      {/* Presence Selector */}
      <div className="shrink-0 px-6 pb-10 flex flex-col items-center gap-3">
        <div className="w-12 h-px bg-neutral-800/50 mb-1" />
        <div className="flex items-center justify-center gap-2">
          {COMPANIONS.map(c => {
            const active = c.id === companion
            return (
              <button
                key={c.id}
                id={`companion-pill-${c.id}`}
                onClick={() => handleSelectCompanion(c.id)}
                className={`
                  px-3.5 py-1.5 rounded-full font-mono text-[9px] tracking-widest uppercase
                  transition-all duration-300 focus:outline-none cursor-pointer
                  ${active
                    ? 'bg-neutral-800/80 text-neutral-300 border border-neutral-700/70'
                    : 'bg-transparent text-neutral-600 border border-neutral-800/40 hover:text-neutral-400 hover:border-neutral-700/50'
                  }
                `}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </div>
    </main>
  )
}
