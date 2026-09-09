/**
 * Web Audio API chiptune BGM engine.
 * Procedurally generates music per game screen — no external files needed.
 */

type Note = [number, number]; // [frequency Hz, duration in beats]
const REST = 0;

// ── Note frequencies (A4=440) ──
const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.0, A4 = 440.0, B4 = 493.88;
const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.0;
const C3 = 130.81, D3 = 146.83, E3 = 164.81, F3 = 174.61, G3 = 196.0, A3 = 220.0, B3 = 246.94;

type TrackDef = {
  bpm: number;
  loop: boolean;
  melody: Note[];
  bass?: Note[];
  wave?: OscillatorType;
  bassWave?: OscillatorType;
  gain?: number;
};

// ── Track definitions per screen ──
const TRACKS: Record<string, TrackDef> = {
  TITLE: {
    bpm: 90,
    loop: true,
    wave: "triangle",
    bassWave: "sine",
    gain: 0.18,
    melody: [
      [C4, 2], [E4, 2], [G4, 2], [C5, 2],
      [B4, 1], [G4, 1], [E4, 2], [REST, 2],
      [A4, 2], [G4, 1], [F4, 1], [E4, 2], [D4, 2],
      [C4, 2], [REST, 2], [G4, 2], [REST, 2],
      [F4, 2], [E4, 2], [D4, 2], [C4, 2],
      [D4, 1], [E4, 1], [F4, 2], [G4, 4],
    ],
    bass: [
      [C3, 4], [C3, 4], [A3, 4], [E3, 4],
      [F3, 4], [C3, 4], [G3, 4], [G3, 4],
    ],
  },

  WISH: {
    bpm: 100,
    loop: true,
    wave: "sine",
    bassWave: "sine",
    gain: 0.13,
    melody: [
      [E4, 2], [G4, 2], [A4, 2], [G4, 2],
      [F4, 2], [E4, 2], [D4, 4],
      [E4, 2], [F4, 2], [G4, 2], [A4, 2],
      [G4, 2], [E4, 2], [C4, 4],
    ],
    bass: [
      [C3, 4], [F3, 4], [G3, 4], [C3, 4],
    ],
  },

  AUDIENCE: {
    bpm: 140,
    loop: true,
    wave: "square",
    bassWave: "triangle",
    gain: 0.12,
    melody: [
      [G4, 1], [A4, 1], [B4, 1], [G4, 1], [E5, 2], [D5, 2],
      [C5, 1], [B4, 1], [A4, 1], [G4, 1], [A4, 2], [REST, 2],
      [G4, 1], [A4, 1], [B4, 1], [D5, 1], [C5, 2], [A4, 2],
      [G4, 2], [E4, 2], [G4, 4],
      [E4, 1], [G4, 1], [A4, 1], [B4, 1], [C5, 2], [B4, 2],
      [A4, 1], [G4, 1], [A4, 2], [G4, 4],
    ],
    bass: [
      [C3, 2], [G3, 2], [C3, 2], [G3, 2],
      [A3, 2], [E3, 2], [F3, 2], [G3, 2],
      [C3, 2], [G3, 2], [F3, 2], [G3, 2],
    ],
  },

  BEHEAD: {
    bpm: 200,
    loop: false,
    wave: "sawtooth",
    gain: 0.16,
    melody: [
      [E5, 1], [REST, 1], [E5, 1], [REST, 1],
      [C5, 2], [A4, 2], [F4, 4],
      [D4, 2], [C4, 2], [REST, 4],
    ],
  },

  ADOPT: {
    bpm: 160,
    loop: false,
    wave: "square",
    bassWave: "triangle",
    gain: 0.15,
    melody: [
      [C5, 1], [E5, 1], [G5, 2], [G5, 1], [A5, 1], [G5, 2],
      [E5, 1], [C5, 1], [D5, 2], [E5, 4],
      [C5, 1], [D5, 1], [E5, 1], [G5, 1], [A5, 2], [G5, 2],
      [E5, 2], [C5, 2], [C5, 4],
    ],
    bass: [
      [C3, 4], [E3, 4], [F3, 4], [G3, 4],
      [C3, 4], [E3, 4], [F3, 4], [C3, 4],
    ],
  },

  ENDING: {
    bpm: 80,
    loop: true,
    wave: "triangle",
    bassWave: "sine",
    gain: 0.15,
    melody: [
      [E4, 3], [D4, 1], [C4, 2], [REST, 2],
      [E4, 2], [F4, 2], [G4, 4],
      [A4, 3], [G4, 1], [F4, 2], [E4, 2],
      [D4, 4], [REST, 4],
      [C4, 2], [E4, 2], [G4, 2], [A4, 2],
      [G4, 3], [F4, 1], [E4, 2], [D4, 2],
      [C4, 4], [REST, 4],
    ],
    bass: [
      [C3, 4], [G3, 4], [A3, 4], [E3, 4],
      [F3, 4], [C3, 4], [G3, 4], [C3, 4],
    ],
  },
};

// Alias RETHINK → re-use AUDIENCE (plays briefly during API call)
TRACKS.RETHINK = { ...TRACKS.AUDIENCE, gain: 0.08 };

class BgmEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private scheduledSources: AudioBufferSourceNode[] = [];
  private oscillators: OscillatorNode[] = [];
  private currentTrack = "";
  private _muted = false;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  get muted() {
    return this._muted;
  }

  /** Must be called from a user gesture to unlock AudioContext. */
  unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._muted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  play(screen: string) {
    if (screen === this.currentTrack) return;
    this.stop();
    this.currentTrack = screen;
    const track = TRACKS[screen];
    if (!track || !this.ctx || !this.masterGain) return;
    this.scheduleTrack(track);
  }

  stop() {
    this.currentTrack = "";
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    for (const o of this.oscillators) {
      try { o.stop(); } catch { /* already stopped */ }
    }
    this.oscillators = [];
  }

  toggleMute(): boolean {
    this._muted = !this._muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        this._muted ? 0 : 1,
        this.ctx!.currentTime,
      );
    }
    return this._muted;
  }

  private scheduleTrack(track: TrackDef) {
    if (!this.ctx || !this.masterGain) return;

    const beatSec = 60 / track.bpm;
    const now = this.ctx.currentTime + 0.05;

    const melodyDur = this.scheduleVoice(
      track.melody, now, beatSec,
      track.wave ?? "square", track.gain ?? 0.12,
    );
    if (track.bass) {
      this.scheduleVoice(
        track.bass, now, beatSec,
        track.bassWave ?? "triangle", (track.gain ?? 0.12) * 0.7,
        true,
      );
    }

    if (track.loop) {
      this.loopTimer = setTimeout(() => {
        if (this.currentTrack && TRACKS[this.currentTrack]) {
          this.oscillators = [];
          this.scheduleTrack(TRACKS[this.currentTrack]);
        }
      }, melodyDur * 1000);
    }
  }

  private scheduleVoice(
    notes: Note[], startTime: number, beatSec: number,
    wave: OscillatorType, vol: number, loopBass = false,
  ): number {
    if (!this.ctx || !this.masterGain) return 0;

    const totalBeats = notes.reduce((s, n) => s + n[1], 0);
    const totalDur = totalBeats * beatSec;

    let t = startTime;
    const playNotes = loopBass
      ? this.repeatToFill(notes, totalDur, beatSec)
      : notes;

    for (const [freq, beats] of playNotes) {
      const dur = beats * beatSec;
      if (freq !== REST) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = wave;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur - 0.02);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + dur);
        this.oscillators.push(osc);
      }
      t += dur;
    }
    return totalDur;
  }

  private repeatToFill(notes: Note[], totalDur: number, beatSec: number): Note[] {
    const bassBeats = notes.reduce((s, n) => s + n[1], 0);
    const bassDur = bassBeats * beatSec;
    if (bassDur <= 0) return notes;
    const repeats = Math.ceil(totalDur / bassDur);
    const out: Note[] = [];
    for (let i = 0; i < repeats; i++) out.push(...notes);
    return out;
  }
}

export const bgm = new BgmEngine();
