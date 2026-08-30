/* ─────────────────────────────────────────────────
   storage.ts  — nook local persistence helpers
   • Text/note entries  → localStorage (JSON)
   • Voice blobs        → IndexedDB
───────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────

export type DumpType = 'text' | 'voice' | 'note' | 'doodle'

export interface DumpEntry {
  id: string
  type: DumpType
  content: string          // text / note content; empty string for voice
  timestamp: number        // Date.now()
  label?: string           // optional user label
}

// ── localStorage helpers (text + note) ────────────

const TEXT_KEY = 'nook:dumps'

function loadEntries(): DumpEntry[] {
  try {
    return JSON.parse(localStorage.getItem(TEXT_KEY) ?? '[]') as DumpEntry[]
  } catch {
    return []
  }
}

function saveEntries(entries: DumpEntry[]): void {
  localStorage.setItem(TEXT_KEY, JSON.stringify(entries))
}

export function saveTextEntry(content: string, type: DumpType = 'text'): DumpEntry {
  const entry: DumpEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    content,
    timestamp: Date.now(),
  }
  const entries = loadEntries()
  entries.unshift(entry)
  saveEntries(entries)
  return entry
}

export function getAllEntries(): DumpEntry[] {
  return loadEntries()
}

export function deleteEntry(id: string): void {
  saveEntries(loadEntries().filter(e => e.id !== id))
}

// ── IndexedDB helpers (voice blobs) ───────────────

const DB_NAME    = 'nook-voice'
const STORE_NAME = 'recordings'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

export interface VoiceRecord {
  id: string
  blob: Blob
  mimeType: string
  timestamp: number
  durationMs?: number
}

export async function saveVoiceRecord(record: VoiceRecord): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(record)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

export async function getVoiceRecord(id: string): Promise<VoiceRecord | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id)
    req.onsuccess = () => resolve(req.result as VoiceRecord | undefined)
    req.onerror   = () => reject(req.error)
  })
}

export async function getAllVoiceRecords(): Promise<VoiceRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
    req.onsuccess = () => {
      const records = (req.result as VoiceRecord[]).sort((a, b) => b.timestamp - a.timestamp)
      resolve(records)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function deleteVoiceRecord(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

// ── Reflections ──────────────────────────────────

export interface ReflectionEntry {
  id: string
  prompt: string
  response: string
  timestamp: number
}

const REFLECTIONS_KEY = 'nook:reflections'

export function loadReflections(): ReflectionEntry[] {
  try {
    return JSON.parse(localStorage.getItem(REFLECTIONS_KEY) ?? '[]') as ReflectionEntry[]
  } catch {
    return []
  }
}

export function saveReflectionEntry(prompt: string, response: string): ReflectionEntry {
  const entry: ReflectionEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    prompt,
    response,
    timestamp: Date.now(),
  }
  const all = loadReflections()
  all.unshift(entry)
  localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(all))
  return entry
}

export function deleteReflectionEntry(id: string): void {
  const all = loadReflections().filter(r => r.id !== id)
  localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(all))
}

// ── Custom Cards ─────────────────────────────────

export interface CustomCard {
  id: string
  title: string
  body: string
  createdAt: number
}

const CARDS_KEY = 'nook:custom-cards'

export function loadCustomCards(): CustomCard[] {
  try {
    return JSON.parse(localStorage.getItem(CARDS_KEY) ?? '[]') as CustomCard[]
  } catch {
    return []
  }
}

export function saveCustomCard(title: string, body: string): CustomCard {
  const card: CustomCard = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    body,
    createdAt: Date.now(),
  }
  const cards = loadCustomCards()
  cards.push(card)
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards))
  return card
}

export function deleteCustomCard(id: string): void {
  const cards = loadCustomCards().filter(c => c.id !== id)
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards))
}

// ── Settings ─────────────────────────────────────

export type ThemeId = 'obsidian' | 'warm-dusk' | 'muted-slate'

export interface NookSettings {
  showGreeting: boolean
  haptics:      boolean
  theme:        ThemeId
}

const SETTINGS_KEY = 'nook:settings'

const DEFAULT_SETTINGS: NookSettings = {
  showGreeting: true,
  haptics:      false,
  theme:        'obsidian',
}

export const THEME_CONFIGS: Record<ThemeId, { bg: string; border: string; label: string }> = {
  'obsidian':    { bg: '#0E0E0E', border: '#242424', label: 'Obsidian' },
  'warm-dusk':   { bg: '#141210', border: '#2E2824', label: 'Warm Dusk' },
  'muted-slate': { bg: '#101316', border: '#242A30', label: 'Muted Slate' },
}

export function applyTheme(theme: ThemeId): void {
  if (typeof document === 'undefined') return
  const config = THEME_CONFIGS[theme] || THEME_CONFIGS['obsidian']
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.backgroundColor = config.bg
  if (document.body) {
    document.body.style.backgroundColor = config.bg
  }
  const metaTheme = document.querySelector('meta[name="theme-color"]')
  if (metaTheme) {
    metaTheme.setAttribute('content', config.bg)
  }
  window.dispatchEvent(new CustomEvent('nook:theme-changed', { detail: theme }))
}

export function loadSettings(): NookSettings {
  try {
    const loaded = {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}'),
    } as NookSettings
    return loaded
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: NookSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  if (settings.theme) {
    applyTheme(settings.theme)
  }
}

// Apply persisted theme immediately upon script evaluation
if (typeof window !== 'undefined') {
  try {
    const currentTheme = loadSettings().theme
    applyTheme(currentTheme)
  } catch {
    // Graceful fallback
  }
}

export function resetApp(): void {
  localStorage.clear()
  applyTheme('obsidian')
}

// ── Onboarding & Profile ──────────────────────────

export function isOnboarded(): boolean {
  return localStorage.getItem('nook_onboarding_completed') === 'true' || localStorage.getItem('nook_onboarded') === 'true'
}

export function setOnboarded(val: boolean): void {
  if (val) {
    localStorage.setItem('nook_onboarding_completed', 'true')
    localStorage.setItem('nook_onboarded', 'true')
  } else {
    localStorage.removeItem('nook_onboarding_completed')
    localStorage.removeItem('nook_onboarded')
  }
}

export const VALID_COMPANION_IDS = [
  'bear',
  'bear1',
  'bear2',
  'bunny',
  'cat',
  'dog',
  'dog3',
  'elephant',
  'fox',
  'giraffe',
  'owl',
  'panda',
  'penguin',
  'rhino',
] as const

export type CompanionId = typeof VALID_COMPANION_IDS[number]

export function getCompanionChoice(): CompanionId {
  const saved = localStorage.getItem('nook_companion')
  if (saved && VALID_COMPANION_IDS.includes(saved as CompanionId)) {
    return saved as CompanionId
  }
  // Normalization for legacy keys
  if (saved === 'cat1') return 'cat'
  if (saved === 'bear') return 'bear'
  if (saved === 'fox') return 'fox'
  return 'cat'
}

export function setCompanionChoice(choice: string): void {
  localStorage.setItem('nook_companion', choice)
}

export function getUserNickname(): string {
  return localStorage.getItem('nook_nickname') || ''
}

export function setUserNickname(name: string): void {
  if (name.trim()) {
    localStorage.setItem('nook_nickname', name.trim())
  } else {
    localStorage.removeItem('nook_nickname')
  }
}

// ── Shared Editor Typography ──────────────────────

export type EditorFont = 'serif' | 'clean' | 'sans' | 'mono' | 'script' | 'typewriter' | 'humanist'

export function getEditorFont(): EditorFont {
  const font = localStorage.getItem('nook_editor_font') as EditorFont
  if (
    font === 'clean' ||
    font === 'sans' ||
    font === 'mono' ||
    font === 'script' ||
    font === 'typewriter' ||
    font === 'humanist' ||
    font === 'serif'
  ) {
    return font
  }
  return 'serif'
}

export function setEditorFont(font: EditorFont): void {
  localStorage.setItem('nook_editor_font', font)
  window.dispatchEvent(new CustomEvent('nook:editor-font-changed', { detail: font }))
}

// ── Sanctuary Key (Atelier Tier Unlock) ───────────

const SANCTUARY_KEY_UNLOCKED = 'nook_sanctuary_key_unlocked'

export function isSanctuaryUnlocked(): boolean {
  return localStorage.getItem(SANCTUARY_KEY_UNLOCKED) === 'true'
}

export function setSanctuaryUnlocked(unlocked: boolean): void {
  if (unlocked) {
    localStorage.setItem(SANCTUARY_KEY_UNLOCKED, 'true')
  } else {
    localStorage.removeItem(SANCTUARY_KEY_UNLOCKED)
  }
}

// ── Deadlines (Anchors in Time) ───────────────────

export interface NookDeadline {
  id: string
  title: string
  dueDate: string // "YYYY-MM-DD"
  createdAt: string
}

const DEADLINES_KEY = 'nook_deadlines'

export function getInitialDeadlines(): NookDeadline[] {
  const now = new Date()
  
  const inThreeDays = new Date(now)
  inThreeDays.setDate(now.getDate() + 3)
  
  const inEightDays = new Date(now)
  inEightDays.setDate(now.getDate() + 8)

  const inFifteenDays = new Date(now)
  inFifteenDays.setDate(now.getDate() + 15)

  return [
    {
      id: 'seed-1',
      title: 'Gentle project milestone',
      dueDate: inThreeDays.toISOString().split('T')[0],
      createdAt: now.toISOString(),
    },
    {
      id: 'seed-2',
      title: 'Submit portfolio update',
      dueDate: inEightDays.toISOString().split('T')[0],
      createdAt: now.toISOString(),
    },
    {
      id: 'seed-3',
      title: 'Quiet review & reflection',
      dueDate: inFifteenDays.toISOString().split('T')[0],
      createdAt: now.toISOString(),
    },
  ]
}

export function loadDeadlines(): NookDeadline[] {
  try {
    const raw = localStorage.getItem(DEADLINES_KEY)
    if (!raw) {
      const seeded = getInitialDeadlines()
      localStorage.setItem(DEADLINES_KEY, JSON.stringify(seeded))
      return seeded
    }
    return JSON.parse(raw) as NookDeadline[]
  } catch {
    return []
  }
}

export function saveDeadline(title: string, dueDate: string): NookDeadline {
  const deadline: NookDeadline = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    dueDate,
    createdAt: new Date().toISOString(),
  }
  const all = loadDeadlines()
  all.push(deadline)
  localStorage.setItem(DEADLINES_KEY, JSON.stringify(all))
  return deadline
}

export function deleteDeadline(id: string): void {
  const all = loadDeadlines().filter(d => d.id !== id)
  localStorage.setItem(DEADLINES_KEY, JSON.stringify(all))
}
