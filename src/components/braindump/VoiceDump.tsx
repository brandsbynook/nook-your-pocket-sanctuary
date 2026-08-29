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
    <div className="flex flex-col flex-1 items-center justify-between min-h-0">

      {/* Helper text */}
      <p className="
        w-full font-serif-nook text-[#52525B] text-[0.95rem]
        font-light italic leading-relaxed mb-8
      ">
        Just speak. No one is listening but you.
      </p>

      {/* Central record area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full">

        {/* ── idle / requesting ── */}
        {(state === 'idle' || state === 'requesting') && (
          <button
            id="voice-record-btn"
            onClick={startRecording}
            disabled={state === 'requesting'}
            aria-label="Start recording"
            className="
              flex flex-col items-center gap-3
              group focus:outline-none
              disabled:opacity-50
            "
          >
            {/* Mic circle */}
            <span className="
              flex items-center justify-center
              w-16 h-16 rounded-full
              border border-[#2A2A2A]
              bg-[#141414]
              transition-all duration-500
              group-hover:border-[#E5E0D8]/20 group-hover:bg-[#1A1A1A]
            ">
              {/* Mic SVG */}
              <svg width="22" height="26" viewBox="0 0 22 26" fill="none" className="text-[#71717A] group-hover:text-[#E5E0D8] transition-colors duration-300">
                <rect x="6" y="1" width="10" height="15" rx="5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M1 12C1 17.5 5.5 22 11 22C16.5 22 21 17.5 21 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <line x1="11" y1="22" x2="11" y2="25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="font-sans text-[#52525B] text-[0.6rem] tracking-[0.18em] uppercase">
              {state === 'requesting' ? 'requesting...' : 'tap to record'}
            </span>
          </button>
        )}

        {/* ── recording ── */}
        {state === 'recording' && (
          <button
            id="voice-stop-btn"
            onClick={stopRecording}
            aria-label="Stop recording"
            className="flex flex-col items-center gap-3 group focus:outline-none"
          >
            {/* Pulsing stop button */}
            <span className="
              relative flex items-center justify-center
              w-16 h-16 rounded-full
              border border-[#C9B99A]/30
              bg-[#1A1517]
            ">
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full border border-[#C9B99A]/20 animate-ping" style={{ animationDuration: '1.6s' }} />
              {/* Stop square */}
              <span className="w-5 h-5 bg-[#C9B99A]/80 rounded-sm" />
            </span>
            {/* Elapsed time */}
            <span className="font-sans text-[#C9B99A] text-[0.72rem] tracking-[0.12em] tabular-nums">
              {formatDuration(elapsed)}
            </span>
            <span className="font-sans text-[#52525B] text-[0.58rem] tracking-[0.16em] uppercase">
              tap to stop
            </span>
          </button>
        )}

        {/* ── preview ── */}
        {state === 'preview' && audio.url && (
          <div className="w-full flex flex-col items-center gap-5">
            {/* Duration */}
            <span className="font-sans text-[#71717A] text-[0.68rem] tracking-widest">
              {formatDuration(audio.duration)}
            </span>

            {/* Native audio player — styled via accent-color */}
            <audio
              id="voice-preview-player"
              src={audio.url}
              controls
              className="w-full h-8 opacity-70 hover:opacity-100 transition-opacity"
              style={{ accentColor: '#C9B99A' }}
            />

            {/* Actions */}
            <div className="flex items-center justify-between w-full border-t border-[#1E1E1E] pt-4">
              <button
                id="voice-discard-btn"
                onClick={handleDiscard}
                className="
                  font-sans text-[#52525B] text-[0.62rem]
                  tracking-[0.16em] uppercase
                  transition-colors hover:text-[#71717A]
                "
              >
                Discard
              </button>
              <button
                id="voice-keep-btn"
                onClick={handleKeep}
                className="
                  font-serif-nook text-[#E5E0D8] text-[0.95rem]
                  font-light tracking-wide
                  px-5 py-2
                  border border-[#2A2A2A]
                  transition-all duration-300
                  hover:border-[#C9B99A]/40 hover:text-[#C9B99A]
                "
              >
                Keep this
              </button>
            </div>
          </div>
        )}

        {/* ── saving ── */}
        {state === 'saving' && (
          <span className="font-sans text-[#52525B] text-[0.62rem] tracking-[0.18em] uppercase animate-pulse">
            saving…
          </span>
        )}

        {/* ── saved ── */}
        {state === 'saved' && (
          <span className="font-sans text-[#C9B99A] text-[0.62rem] tracking-[0.18em] uppercase animate-fade-in">
            kept. it's safe now.
          </span>
        )}

        {/* ── error ── */}
        {state === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <p className="font-sans text-[#52525B] text-[0.72rem] text-center tracking-wide">
              {errorMsg}
            </p>
            <button
              onClick={() => { setState('idle'); setErrorMsg('') }}
              className="font-sans text-[#71717A] text-[0.58rem] tracking-[0.16em] uppercase hover:text-[#E5E0D8] transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
