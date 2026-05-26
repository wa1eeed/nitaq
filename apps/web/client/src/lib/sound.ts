/**
 * Lightweight Web Audio chimes — no external assets, no network requests.
 * Each chime is a small ADSR-shaped sequence of oscillator tones, designed
 * to feel familiar but distinct:
 *
 *   - newOrder      → carrier — bright two-note rising chime (incoming!)
 *   - orderSent     → client  — short upward "whoosh"  (request dispatched)
 *   - orderCompleted→ client  — pleasant 3-note major arpeggio (success)
 *   - notification  → all     — single soft note (subtle ping)
 *
 * Browsers require a user gesture before AudioContext can start, so the
 * first call may be silent until the user interacts with the page. We catch
 * & ignore that error.
 */

export type SoundKind = 'newOrder' | 'orderSent' | 'orderCompleted' | 'notification';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  return ctx;
}

interface Note {
  freq: number;       // Hz
  start: number;      // seconds (offset from "now")
  duration: number;   // seconds
  type?: OscillatorType;
  peakGain?: number;
}

function playNotes(notes: Note[], masterGain = 0.18) {
  const audio = getCtx();
  if (!audio) return;
  // Resume if suspended (autoplay policy)
  if (audio.state === 'suspended') audio.resume().catch(() => undefined);

  const now = audio.currentTime;
  for (const n of notes) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = n.type ?? 'sine';
    osc.frequency.value = n.freq;

    const peak = (n.peakGain ?? 1) * masterGain;
    const start = now + n.start;
    const end = start + n.duration;

    // ADSR envelope — fast attack, gentle release, no clicks
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.012);
    gain.gain.linearRampToValueAtTime(peak * 0.7, start + n.duration * 0.5);
    gain.gain.linearRampToValueAtTime(0, end);

    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

const PRESETS: Record<SoundKind, Note[]> = {
  // Two ascending notes (G5 → C6) — alert but friendly. ~280ms total.
  newOrder: [
    { freq: 783.99, start: 0.00, duration: 0.12, type: 'triangle' },
    { freq: 1046.5, start: 0.10, duration: 0.18, type: 'triangle' },
  ],
  // Quick upward sweep ~150ms — "sent"
  orderSent: [
    { freq: 523.25, start: 0.00, duration: 0.08, type: 'sine' },
    { freq: 783.99, start: 0.06, duration: 0.10, type: 'sine' },
  ],
  // C major arpeggio C5–E5–G5 — success
  orderCompleted: [
    { freq: 523.25, start: 0.00, duration: 0.14, type: 'sine' },
    { freq: 659.25, start: 0.13, duration: 0.14, type: 'sine' },
    { freq: 783.99, start: 0.26, duration: 0.22, type: 'sine' },
  ],
  // Single soft chime — subtle
  notification: [
    { freq: 880.0,  start: 0.00, duration: 0.16, type: 'sine', peakGain: 0.6 },
  ],
};

export function playSound(kind: SoundKind): void {
  try {
    const notes = PRESETS[kind];
    if (!notes) return;
    playNotes(notes);
  } catch {
    /* swallow — sound is non-essential */
  }
}

/** Returns true when the user has muted sounds in localStorage. */
export function isMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('nitaq-sounds-muted') === '1';
}

export function setMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('nitaq-sounds-muted', muted ? '1' : '0');
}

/** Convenience wrapper that respects the mute preference. */
export function playSoundIfEnabled(kind: SoundKind): void {
  if (isMuted()) return;
  playSound(kind);
}
