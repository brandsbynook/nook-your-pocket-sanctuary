import { useState } from 'react'
import {
  loadCustomCards,
  saveCustomCard,
  deleteCustomCard,
  type CustomCard,
} from '../utils/storage'
import FooterNav, { type NavTabId } from '../components/FooterNav'
import HeaderAudioShortcut from '../components/HeaderAudioShortcut'

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
        bg-[#0E0E0E] px-10
        animate-fade-in
        focus:outline-none
      "
      onClick={onDismiss}
      aria-label="Tap to dismiss"
    >
      <p className="
        font-serif-nook text-[#E5E0D8]
        text-[2rem] font-light leading-[1.3] tracking-wide
        text-center mb-6
      ">
        {body}
      </p>
      <span className="
        font-sans text-[#3A3A3A] text-[0.58rem]
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
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 animate-fade-in">
      <div className="
        w-full max-w-[420px] bg-[#111111]
        border-t border-[#1E1E1E]
        px-6 pt-6 pb-10
        flex flex-col gap-4
        animate-lift-in
      ">
        <h2 className="font-serif-nook text-[#E5E0D8] text-lg font-light tracking-wide">
          New card
        </h2>

        <input
          id="new-card-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Short label (e.g. Too Loud)"
          className="
            w-full bg-transparent border-b border-[#242424]
            font-sans text-[#E5E0D8] text-sm font-light
            placeholder:text-[#3A3A3A] py-2
            focus:outline-none focus:border-[#52525B]
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
            w-full bg-transparent border-b border-[#242424]
            font-sans text-[#E5E0D8] text-sm font-light
            placeholder:text-[#3A3A3A] py-2 resize-none
            focus:outline-none focus:border-[#52525B]
            transition-colors leading-relaxed
          "
        />

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onCancel}
            className="font-sans text-[#52525B] text-[0.62rem] tracking-[0.16em] uppercase hover:text-[#71717A] transition-colors"
          >
            Cancel
          </button>
          <button
            id="save-new-card"
            onClick={handleSave}
            disabled={!title.trim() || !body.trim()}
            className="
              font-serif-nook text-[#E5E0D8] text-[0.95rem] font-light
              px-5 py-2 border border-[#2A2A2A]
              hover:border-[#C9B99A]/40 hover:text-[#C9B99A]
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-300
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
        onClick={onTap}
        className="
          w-full text-left
          border border-[#1C1C1C] bg-[#0E0E0E]
          px-4 py-4
          hover:border-[#2A2A2A] hover:bg-[#111]
          transition-all duration-300
          focus:outline-none
        "
      >
        <p className="font-serif-nook text-[#E5E0D8] text-base font-light tracking-wide leading-snug mb-1">
          {title}
        </p>
        <p className="font-sans text-[#52525B] text-[0.68rem] font-light leading-snug tracking-wide line-clamp-2">
          {body}
        </p>
      </button>

      {onDelete && (
        <button
          onClick={onDelete}
          aria-label={`Delete ${title}`}
          className="
            absolute top-3 right-3
            text-[#3A3A3A] text-[0.7rem]
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            hover:text-[#71717A]
            focus:outline-none
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
          h-[100dvh] max-w-[420px] mx-auto
          px-6 pt-10 pb-6
          flex flex-col justify-between
          overflow-hidden
          bg-[#0E0E0E]
          animate-fade-in
        "
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <header className="flex items-center justify-between mb-7 shrink-0">
            <button
              id="cards-back"
              onClick={onBack}
              className="
                flex items-center gap-1.5
                font-sans text-[#52525B] text-[0.62rem]
                tracking-[0.14em] uppercase
                hover:text-[#71717A] transition-colors
                focus:outline-none
              "
            >
              <span className="text-[0.8rem] leading-none">←</span>
              return
            </button>

            <div className="flex flex-col items-center gap-[3px]">
              <h1 className="font-serif-nook text-[#E5E0D8] text-xl font-light tracking-[0.18em] leading-none">
                Cards
              </h1>
              <p className="font-sans text-[#3A3A3A] text-[0.58rem] tracking-[0.1em] text-center">
                Show this to someone when words are hard.
              </p>
            </div>

            <div className="flex items-center justify-end min-w-[60px]">
              <HeaderAudioShortcut />
            </div>
          </header>

          {/* Scrollable card list */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2 pb-4">

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
              <div className="h-px w-full bg-[#1C1C1C] my-2" />
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
                w-full mt-2 py-4
                border border-dashed border-[#242424]
                font-sans text-[#3A3A3A] text-[0.6rem]
                tracking-[0.18em] uppercase
                hover:border-[#52525B] hover:text-[#52525B]
                transition-all duration-300
                focus:outline-none
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
