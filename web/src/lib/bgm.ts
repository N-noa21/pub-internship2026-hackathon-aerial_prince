/**
 * BGM engine — mp3 file playback with crossfade.
 *
 * Audio files:
 *   TITLE    : オーケストラ15 (魔王魂)
 *   WISH     : grinning    (DOVA-SYNDROME / Cloria Sound Labs)
 *   AUDIENCE : ファンタジー01 (魔王魂)
 *   BEHEAD   : イベント01   (魔王魂)
 *   ADOPT    : ジングル01   (魔王魂)
 *   ENDING   : オーケストラ11 (魔王魂)
 *   RETHINK  : → AUDIENCE を継続
 */

type TrackDef = {
  src: string;
  loop: boolean;
  volume: number;
};

const TRACKS: Record<string, TrackDef> = {
  TITLE:    { src: "/audio/title.mp3",    loop: true,  volume: 0.5 },
  WISH:     { src: "/audio/wish.mp3",     loop: true,  volume: 0.4 },
  AUDIENCE: { src: "/audio/audience.mp3",  loop: true,  volume: 0.45 },
  BEHEAD:   { src: "/audio/behead.mp3",    loop: false, volume: 0.55 },
  ADOPT:    { src: "/audio/adopt.mp3",     loop: false, volume: 0.55 },
  ENDING:   { src: "/audio/ending.mp3",    loop: true,  volume: 0.5 },
};

const FADE_MS = 400;

class BgmEngine {
  private current: HTMLAudioElement | null = null;
  private currentScreen = "";
  private _muted = false;
  private preloaded = new Map<string, HTMLAudioElement>();

  get muted() {
    return this._muted;
  }

  /** Called from useBgm on first user gesture. Preloads audio files. */
  unlock() {
    this.preload();
  }

  preload() {
    for (const [key, def] of Object.entries(TRACKS)) {
      if (this.preloaded.has(key)) continue;
      const audio = new Audio(def.src);
      audio.preload = "auto";
      audio.loop = def.loop;
      audio.volume = 0;
      this.preloaded.set(key, audio);
    }
  }

  play(screen: string) {
    const resolved = screen === "RETHINK" ? "AUDIENCE" : screen;
    if (resolved === this.currentScreen) return;

    const def = TRACKS[resolved];
    if (!def) return;

    this.fadeOut();
    this.currentScreen = resolved;

    let audio = this.preloaded.get(resolved);
    if (audio) {
      this.preloaded.delete(resolved);
    } else {
      audio = new Audio(def.src);
    }
    audio.loop = def.loop;
    audio.volume = 0;
    audio.currentTime = 0;

    this.current = audio;
    const targetVol = this._muted ? 0 : def.volume;
    audio.play().then(() => this.fadeTo(audio!, targetVol)).catch(() => {});
  }

  stop() {
    this.fadeOut();
    this.currentScreen = "";
  }

  toggleMute(): boolean {
    this._muted = !this._muted;
    if (this.current) {
      const def = TRACKS[this.currentScreen];
      this.current.volume = this._muted ? 0 : (def?.volume ?? 0.5);
    }
    return this._muted;
  }

  private fadeOut() {
    const prev = this.current;
    if (!prev) return;
    this.current = null;
    const start = prev.volume;
    const steps = 10;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      prev.volume = Math.max(0, start * (1 - i / steps));
      if (i >= steps) {
        clearInterval(iv);
        prev.pause();
        prev.currentTime = 0;
      }
    }, FADE_MS / steps);
  }

  private fadeTo(audio: HTMLAudioElement, target: number) {
    const steps = 10;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      audio.volume = Math.min(target, target * (i / steps));
      if (i >= steps) clearInterval(iv);
    }, FADE_MS / steps);
  }
}

export const bgm = new BgmEngine();
