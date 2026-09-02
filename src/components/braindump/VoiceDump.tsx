import { useRef, useState, useCallback } from 'react'
import { saveVoiceRecord } from '../../utils/storage'

type RecordingState = 'idle' | 'requesting' | 'recording' | 'preview' | 'saving' | 'saved' | 'error'

interface AudioState {
  url:       string | null
  blob:      Blob   | null
  mimeType:  string
  startedAt: number
  duration:  number         // ms
}

const EMPTY_AUDIO: AudioState = {
  url: null, blob: null, mimeType: '', startedAt: 0, duration: 0,
}

function formatDuration(ms: number): string {
  const s   = Math.floor(ms / 1000)
  const min = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

/** Pick the best supported MIME type for MediaRecorder */
function getSupportedMime(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime
  }
  return ''
}

export default function VoiceDump() {
  const [state, setState]   = useState<RecordingState>('idle')
  const [audio, setAudio]   = useState<AudioState>(EMPTY_AUDIO)
  const [elapsed, setElapsed] = useState(0)     // ms while recording
  const [errorMsg, setErrorMsg] = useState('')

  const recorderRef  = useRef<MediaRecorder | null>(null)
  const chunksRef    = useRef<Blob[]>([])
  const streamRef    = useRef<MediaStream | null>(null)
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  /* ── Start recording ──────────────────────────── */
  const startRecording = useCallback(async () => {
    setState('requesting')
    setErrorMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = getSupportedMime()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      chunksRef.current   = []

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        const url = URL.createObjectURL(blob)
        const duration = Date.now() - startTimeRef.current
        setAudio({ url, blob, mimeType: recorder.mimeType, startedAt: startTimeRef.current, duration })
        setState('preview')
        // Stop all tracks
        streamRef.current?.getTracks().forEach(t => t.stop())
      }

      recorder.start(100)   // collect chunks every 100ms
      startTimeRef.current = Date.now()
      setState('recording')

      // Elapsed timer
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startTimeRef.current)
      }, 500)

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(msg.includes('Permission')
        ? 'Microphone access was denied.'
        : 'Could not start recording.')
      setState('error')
    }
  }, [])

  /* ── Stop recording ───────────────────────────── */
  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    recorderRef.current?.stop()
  }, [])

  /* ── Keep (save to IndexedDB) ─────────────────── */
  const handleKeep = useCallback(async () => {
    if (!audio.blob) return
    setState('saving')
    try {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      await saveVoiceRecord({
        id,
        blob:      audio.blob,
        mimeType:  audio.mimeType,
        timestamp: audio.startedAt,
        durationMs: audio.duration,
      })
      setState('saved')
      setTimeout(() => {
        // Reset for another recording
        if (audio.url) URL.revokeObjectURL(audio.url)
        setAudio(EMPTY_AUDIO)
        setElapsed(0)
        setState('idle')
      }, 2000)
    } catch {
      setErrorMsg('Could not save the recording.')
      setState('error')
    }
  }, [audio])

  /* ── Discard ──────────────────────────────────── */
  const handleDiscard = useCallback(() => {
    if (audio.url) URL.revokeObjectURL(audio.url)
    setAudio(EMPTY_AUDIO)
    setElapsed(0)
    setState('idle')
  }, [audio.url])

  // ── Render ──────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col items-center justify-start min-h-0 w-full pt-3 sm:pt-6 pb-2 overflow-y-auto">

      {/* Central record card */}
      <div className="w-full max-w-lg min-h-[300px] flex flex-col items-center justify-center mx-auto bg-[#141416] border border-[#222225] p-5 md:p-6 rounded-2xl shadow-xl relative mt-4 sm:mt-6">

        {/* ── idle / requesting ── */}
        {(state === 'idle' || state === 'requesting') && (
          <div className="flex flex-col items-center">
            <button
              id="voice-record-btn"
              onClick={startRecording}
              disabled={state === 'requesting'}
              aria-label="Start recording"
              className="
                flex flex-col items-center
                group focus:outline-none
                disabled:opacity-50 cursor-pointer
              "
            >
              {/* Warm Mic Presence */}
              <span className="
                flex items-center justify-center
                w-20 h-20 rounded-full
                border border-[#222225] bg-[#0A0A0B]/60
                transition-all duration-500
                group-hover:border-[#52525B] group-hover:bg-[#18181E] group-hover:scale-105
                shadow-lg
              ">
                {/* Mic SVG */}
                <svg width="24" height="28" viewBox="0 0 22 26" fill="none" className="text-[#71717A] group-hover:text-[#E5E5E7] transition-colors duration-300">
                  <rect x="6" y="1" width="10" height="15" rx="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M1 12C1 17.5 5.5 22 11 22C16.5 22 21 17.5 21 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="11" y1="22" x2="11" y2="25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
            </button>

            {/* Prompt text directly underneath central mic */}
            <p className="text-xs md:text-sm text-[#71717A] font-serif-nook italic text-center max-w-xs mx-auto mt-6 font-normal leading-relaxed">
              {state === 'requesting' ? 'Connecting microphone...' : 'Rant, vent out, scream. No one is listening but you.'}
            </p>
          </div>
        )}

        {/* ── recording ── */}
        {state === 'recording' && (
          <button
            id="voice-stop-btn"
            onClick={stopRecording}
            aria-label="Stop recording"
            className="flex flex-col items-center gap-4 group focus:outline-none cursor-pointer animate-fade-in"
          >
            {/* Breathing Glow Ring */}
            <span className="
              relative flex items-center justify-center
              w-20 h-20 rounded-full
              border border-[#E5E5E7]/40 bg-[#141416]
              ring-8 ring-[#E5E5E7]/10 animate-pulse
              transition-all duration-500
            ">
              {/* Stop Square */}
              <span className="w-6 h-6 bg-[#E5E5E7] rounded-md shadow-md" />
            </span>
            {/* Elapsed time and prompt */}
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-[#E5E5E7] text-sm tracking-widest tabular-nums">
                {formatDuration(elapsed)}
              </span>
              <span className="text-xs text-[#71717A] font-serif-nook italic mt-2">
                Tap again to stop
              </span>
            </div>
          </button>
        )}

        {/* ── preview ── */}
        {state === 'preview' && audio.url && (
          <div className="w-full flex flex-col items-center gap-6 animate-fade-in">
            {/* Duration */}
            <span className="font-mono text-[#71717A] text-xs tracking-widest">
              {formatDuration(audio.duration)}
            </span>

            {/* Native audio player */}
            <audio
              id="voice-preview-player"
              src={audio.url}
              controls
              className="w-full h-9 opacity-80 hover:opacity-100 transition-opacity"
              style={{ accentColor: '#E5E5E7' }}
            />

            {/* Actions */}
            <div className="flex items-center justify-between w-full border-t border-[#1F1F23] pt-4">
              <button
                id="voice-discard-btn"
                onClick={handleDiscard}
                className="
                  font-mono text-[11px] tracking-widest uppercase
                  text-[#71717A] hover:text-[#E5E5E7]
                  transition-colors duration-200 focus:outline-none cursor-pointer
                "
              >
                Clear / Let go
              </button>
              <button
                id="voice-keep-btn"
                onClick={handleKeep}
                className="
                  font-mono text-[11px] tracking-widest uppercase
                  text-[#71717A] hover:text-[#E5E5E7]
                  transition-colors duration-200 focus:outline-none cursor-pointer
                "
              >
                Keep this
              </button>
            </div>
          </div>
        )}

        {/* ── saving ── */}
        {state === 'saving' && (
          <span className="font-sans text-neutral-400 text-xs tracking-wider animate-pulse">
            saving...
          </span>
        )}

        {/* ── saved ── */}
        {state === 'saved' && (
          <span className="font-serif-nook text-neutral-300 text-sm italic animate-fade-in">
            kept in memory chest
          </span>
        )}

        {/* ── error ── */}
        {state === 'error' && (
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <p className="font-sans text-neutral-400 text-xs tracking-wide">
              {errorMsg || 'Could not access microphone.'}
            </p>
            <button
              onClick={() => { setState('idle'); setErrorMsg('') }}
              className="font-mono text-[11px] tracking-widest uppercase text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
