import { useState } from 'react'
import {
  loadCustomCards,
  saveCustomCard,
  deleteCustomCard,
  type CustomCard,
} from '../utils/storage'
import FooterNav, { type NavTabId } from '../components/FooterNav'
import HeaderAudioShortcut from '../components/HeaderAudioShortcut'
import { triggerHaptic } from '../utils/haptics'

// ── Default cards ─────────────────────────────────

interface CardDef {
  id: string
  title: string
  body: string
  isDefault: true
}

const DEFAULT_CARDS: CardDef[] = [
  { id: 'd1', isDefault: true, title: 'Shutdown',        body: 'I am in shutdown and cannot speak right now.' },
  { id: 'd2', isDefault: true, title: 'Sensory Overload', body: 'The environment is too much. I need quiet.' },
  { id: 'd3', isDefault: true, title: 'Need Space',       body: 'I need some space right now. I am okay.' },
  { id: 'd4', isDefault: true, title: 'I Heard You',      body: 'I heard you. I just need a little more time to process.' },
  { id: 'd5', isDefault: true, title: 'Need Help',        body: 'I need help right now.' },
  { id: 'd6', isDefault: true, title: "I Don't Know",     body: "I don't know what I need right now." },
]

// ── Full-screen card overlay ──────────────────────

interface FullscreenCardProps {
  title: string
  body: string
  onDismiss: () => void
}

function FullscreenCard({ body, onDismiss }: FullscreenCardProps) {
  return (
    <button
      id="fullscreen-card"
      className="
        fixed inset-0 z-50
        flex flex-col items-center justify-center
        bg-[#0A0A0B] px-10
        animate-fade-in
        focus:outline-none
      "
      onClick={onDismiss}
      aria-label="Tap to dismiss"
    >
      <p className="
        font-serif-nook text-[#E5E5E7]
        text-[2rem] font-light leading-[1.3] tracking-wide
        text-center mb-6
      ">
        {body}
      </p>
      <span className="
        font-sans text-[#52525B] text-[0.58rem]
        tracking-[0.2em] uppercase
      ">
        tap anywhere to dismiss
      </span>
    </button>
  )
}

// ── Create card modal ─────────────────────────────

interface CreateCardModalProps {
  onSave: (title: string, body: string) => void
  onCancel: () => void
}

function CreateCardModal({ onSave, onCancel }: CreateCardModalProps) {
  const [title, setTitle] = useState('')
  const [body,  setBody]  = useState('')

  function handleSave() {
    if (!title.trim() || !body.trim()) return
    onSave(title.trim(), body.trim())
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="
        w-full max-w-[420px] bg-[#141416]
        border border-[#222225] rounded-t-3xl
        px-6 pt-6 pb-10
        flex flex-col gap-4
        animate-lift-in shadow-2xl
      ">
        <h2 className="font-serif-nook text-[#E5E5E7] text-lg font-light tracking-wide">
          New card
        </h2>

        <input
          id="new-card-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Short label (e.g. Too Loud)"
          className="
            w-full bg-transparent border-b border-[#222225]
            font-sans text-[#E5E5E7] text-sm font-light
            placeholder:text-[#52525B] py-2
            focus:outline-none focus:border-[#3F3F46]
            transition-colors
          "
        />

        <textarea
          id="new-card-body"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="What this card says..."
          rows={3}
          className="
            w-full bg-transparent border-b border-[#222225]
            font-sans text-[#E5E5E7] text-sm font-light
            placeholder:text-[#52525B] py-2 resize-none
            focus:outline-none focus:border-[#3F3F46]
            transition-colors leading-relaxed
          "
        />

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onCancel}
            className="font-sans text-[#52525B] text-[0.62rem] tracking-[0.16em] uppercase hover:text-[#E5E5E7] transition-colors focus:outline-none"
          >
            Cancel
          </button>
          <button
            id="save-new-card"
            onClick={handleSave}
            disabled={!title.trim() || !body.trim()}
            className="
              font-sans text-xs tracking-widest uppercase
              text-[#E5E5E7] hover:text-white font-medium
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all focus:outline-none
            "
          >
            Save card
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card tile ─────────────────────────────────────

interface CardTileProps {
  title: string
  body: string
  onTap: () => void
  onDelete?: () => void
}

function CardTile({ title, body, onTap, onDelete }: CardTileProps) {
  return (
    <div className="group relative">
      <button
        onClick={() => {
          triggerHaptic(15)
          onTap()
        }}
        className="
          w-full text-left
          border border-[#222225] bg-[#141416]
          p-4 rounded-2xl
          hover:border-[#3F3F46] hover:bg-[#1A1A1E]
          transition-all duration-300
          focus:outline-none cursor-pointer
        "
      >
        <p className="font-serif-nook text-[#E5E5E7] text-base font-normal tracking-wide leading-snug">
          {title}
        </p>
        <p className="text-xs text-[#71717A] font-normal mt-1 leading-relaxed line-clamp-2">
          {body}
        </p>
      </button>

      {onDelete && (
        <button
          onClick={onDelete}
          aria-label={`Delete ${title}`}
          className="
            absolute top-3.5 right-3.5
            text-[#52525B] text-sm
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            hover:text-[#E5E5E7]
            focus:outline-none p-1
          "
        >
          ×
        </button>
      )}
    </div>
  )
}

// ── Main CardsScreen ──────────────────────────────

interface CardsScreenProps {
  onBack: () => void
  onNavigate?: (tab: NavTabId) => void
}

export default function CardsScreen({ onBack, onNavigate }: CardsScreenProps) {
  const [customCards, setCustomCards] = useState<CustomCard[]>(() => loadCustomCards())
  const [fullscreen,  setFullscreen]  = useState<{ title: string; body: string } | null>(null)
  const [creating,    setCreating]    = useState(false)

  function handleCreate(title: string, body: string) {
    const card = saveCustomCard(title, body)
    setCustomCards(prev => [...prev, card])
    setCreating(false)
  }

  function handleDelete(id: string) {
    deleteCustomCard(id)
    setCustomCards(prev => prev.filter(c => c.id !== id))
  }

  return (
    <>
      <main
        id="cards-screen"
        className="
          h-[100dvh] w-full
          px-7 sm:px-8 pt-14 sm:pt-16 pb-12 sm:pb-14
          flex flex-col justify-between
          overflow-hidden
          bg-[#0A0A0B]
          animate-fade-in
        "
      >
        <div className="flex flex-col flex-1 min-h-0 max-w-[360px] mx-auto w-full">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between shrink-0 w-full">
            <button
              id="cards-back"
              onClick={onBack}
              className="
                flex items-center gap-1.5
                font-sans text-[#52525B] text-[0.62rem]
                tracking-[0.14em] uppercase
                hover:text-[#E5E5E7] transition-colors
                focus:outline-none py-1 cursor-pointer
              "
            >
              <span className="text-[0.8rem] leading-none">←</span>
              return
            </button>

            <div className="flex items-center justify-end min-w-[60px]">
              <HeaderAudioShortcut />
            </div>
          </div>

          {/* Decoupled Title Block */}
          <div className="flex flex-col items-center gap-1.5 mt-8 sm:mt-10 mb-5 text-center shrink-0">
            <h1 className="font-serif-nook text-[#E5E5E7] text-xl font-light tracking-[0.18em] leading-none">
              Cards
            </h1>
            <p className="font-sans text-[#71717A] text-[0.58rem] tracking-[0.1em] text-center">
              Show this to someone when words are hard.
            </p>
          </div>

          {/* Scrollable card list */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2.5 pb-4 pr-0.5">

            {/* Default cards */}
            {DEFAULT_CARDS.map(card => (
              <CardTile
                key={card.id}
                title={card.title}
                body={card.body}
                onTap={() => setFullscreen({ title: card.title, body: card.body })}
              />
            ))}

            {/* Divider before custom cards */}
            {customCards.length > 0 && (
              <div className="h-px w-full bg-[#1F1F23] my-1" />
            )}

            {/* Custom cards */}
            {customCards.map(card => (
              <CardTile
                key={card.id}
                title={card.title}
                body={card.body}
                onTap={() => setFullscreen({ title: card.title, body: card.body })}
                onDelete={() => handleDelete(card.id)}
              />
            ))}

            {/* Create new card button */}
            <button
              id="create-card-btn"
              onClick={() => setCreating(true)}
              className="
                w-full mt-1.5 py-3.5 rounded-2xl
                border border-dashed border-[#222225]
                font-sans text-[#52525B] text-[0.62rem]
                tracking-widest uppercase
                hover:border-[#3F3F46] hover:text-[#E5E5E7]
                transition-all duration-300
                focus:outline-none cursor-pointer
              "
            >
              + Create new card
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <FooterNav active="cards" onSelect={onNavigate} />
      </main>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <FullscreenCard
          title={fullscreen.title}
          body={fullscreen.body}
          onDismiss={() => setFullscreen(null)}
        />
      )}

      {/* Create modal */}
      {creating && (
        <CreateCardModal
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
        />
      )}
    </>
  )
}
