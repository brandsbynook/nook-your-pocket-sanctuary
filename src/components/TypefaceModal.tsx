import { useState, useEffect } from 'react'
import { getEditorFont, setEditorFont, type EditorFont } from '../utils/storage'
import { useAudio } from '../context/AudioContext'

export interface TypefaceOption {
  id: EditorFont
  name: string
  subtitle: string
  sample: string
  isPremium?: boolean
  fontClass: string
}

export const TYPEFACES: TypefaceOption[] = [
  {
    id: 'serif',
    name: 'Sanctuary Serif',
    subtitle: 'Warm, literary serif',
    sample: 'Words resting gently on paper',
    fontClass: 'font-serif-nook',
  },
  {
    id: 'sans',
    name: 'Minimal Sans',
    subtitle: 'Clean, low-friction grotesk',
    sample: 'Clarity and quiet precision',
    fontClass: 'font-sans',
  },
  {
    id: 'mono',
    name: 'Warm Monospace',
    subtitle: 'Distraction-free code & drafts',
    sample: 'Every character given its room',
    isPremium: true,
    fontClass: 'font-mono',
  },
  {
    id: 'script',
    name: 'Poetic Script',
    subtitle: 'Gentle, meditative cursive',
    sample: 'Fluid thoughts flowing freely',
    isPremium: true,
    fontClass: 'font-serif-nook italic',
  },
  {
    id: 'typewriter',
    name: 'Classic Typewriter',
    subtitle: 'Tactile mechanical rhythm',
    sample: 'The quiet cadence of keys',
    isPremium: true,
    fontClass: 'font-mono tracking-wider',
  },
  {
    id: 'humanist',
    name: 'Muted Humanist',
    subtitle: 'Soft, open letterforms',
    sample: 'Breathe into every sentence',
    isPremium: true,
    fontClass: 'font-sans font-light tracking-wide',
  },
]

export function getFontFamilyClass(font: EditorFont): string {
  switch (font) {
    case 'sans':
    case 'clean':
      return 'font-sans'
    case 'mono':
      return 'font-mono'
    case 'script':
      return 'font-serif-nook italic'
    case 'typewriter':
      return 'font-mono tracking-wider'
    case 'humanist':
      return 'font-sans font-light tracking-wide'
    case 'serif':
    default:
      return 'font-serif-nook'
  }
}

interface TypefaceModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectFont?: (font: EditorFont) => void
}

export default function TypefaceModal({ isOpen, onClose, onSelectFont }: TypefaceModalProps) {
  const [activeFont, setActiveFont] = useState<EditorFont>(() => getEditorFont())
  const { isUnlocked, openPaywall } = useAudio()

  useEffect(() => {
    const handleFontChanged = (e: Event) => {
      const customEvent = e as CustomEvent<EditorFont>
      if (customEvent.detail) {
        setActiveFont(customEvent.detail)
      }
    }

    window.addEventListener('nook:editor-font-changed', handleFontChanged)
    return () => window.removeEventListener('nook:editor-font-changed', handleFontChanged)
  }, [])

  if (!isOpen) return null

  function handleSelect(tf: TypefaceOption) {
    if (tf.isPremium && !isUnlocked) {
      openPaywall()
      return
    }
    setActiveFont(tf.id)
    setEditorFont(tf.id)
    onSelectFont?.(tf.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md px-4 pb-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="
          w-full max-w-[390px] bg-[#141416] border border-[#222225]
          rounded-3xl p-6 shadow-2xl backdrop-blur-xl animate-lift-in
          flex flex-col gap-4 max-h-[85dvh] overflow-y-auto
        "
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1F1F23] pb-3">
          <div className="flex flex-col">
            <h2 className="font-serif-nook text-[#E5E5E7] text-lg font-light">
              Writing Typeface
            </h2>
            <p className="font-sans text-[0.58rem] tracking-wider uppercase text-[#71717A]">
              Universal typography for your sanctuary
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#71717A] hover:text-[#E5E5E7] p-1.5 focus:outline-none text-sm"
          >
            ✕
          </button>
        </div>

        {/* Typeface List */}
        <div className="flex flex-col gap-2 my-1">
          {TYPEFACES.map(tf => {
            const isSelected = activeFont === tf.id || (tf.id === 'sans' && activeFont === 'clean')
            const isLocked = tf.isPremium && !isUnlocked

            return (
              <button
                key={tf.id}
                id={`typeface-option-${tf.id}`}
                onClick={() => handleSelect(tf)}
                className={`
                  w-full text-left p-3 rounded-2xl border transition-all duration-300
                  flex items-center justify-between group focus:outline-none
                  ${isSelected
                    ? 'bg-[#1A1A1E] border-[#3F3F46] shadow-sm'
                    : 'bg-[#141416] border-[#222225] hover:bg-[#1A1A1E] hover:border-[#3F3F46]'
                  }
                `}
              >
                <div className="flex flex-col items-start gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-[0.78rem] tracking-wide text-[#E5E5E7] font-medium">
                      {tf.name}
                    </span>
                    {isLocked && (
                      <span className="text-[0.6rem] text-[#E5E5E7] bg-[#222225] px-1.5 py-0.5 rounded-full border border-[#3F3F46]">
                        ⚿ Atelier
                      </span>
                    )}
                  </div>
                  <span className="font-sans text-[0.60rem] text-[#71717A] font-light">
                    {tf.subtitle}
                  </span>
                  <span className={`${tf.fontClass} text-[0.85rem] text-[#71717A] mt-1 opacity-80`}>
                    "{tf.sample}"
                  </span>
                </div>

                <div className="ml-3 shrink-0">
                  <span
                    className={`
                      w-4 h-4 rounded-full border flex items-center justify-center transition-colors
                      ${isSelected
                        ? 'border-[#E5E5E7] bg-[#E5E5E7]'
                        : 'border-[#52525B]'
                      }
                    `}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#141416]" />}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer info */}
        <p className="font-sans text-[0.55rem] text-[#71717A] text-center tracking-wider uppercase pt-1">
          Applies across Brain Dump & Reflect
        </p>
      </div>
    </div>
  )
}
