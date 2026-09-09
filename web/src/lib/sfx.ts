/**
 * 効果音。音源ファイルを持たず WebAudio で合成する（CSP・同梱サイズの都合）。
 * RPG の「ピッ」「ズバッ」程度の音で十分ゲーム感が出る。
 */
let ctx: AudioContext | null = null;
let muted = false;


function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "square",
              gain = .05, when = 0, slideTo?: number) {
  const c = ac(); if (!c || muted) return;
  const t0 = c.currentTime + when;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + .008);
  g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0); o.stop(t0 + dur + .02);
}

function noise(dur: number, gain = .12, when = 0, hp = 800) {
  const c = ac(); if (!c || muted) return;
  const t0 = c.currentTime + when;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp;
  const g = c.createGain(); g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t0);
}

export const sfx = {
  /** カーソル移動 */
  tick: () => tone(1200, .035, "square", .03),
  /** 決定 */
  confirm: () => { tone(660, .06, "square", .045); tone(990, .12, "square", .045, .06); },
  /** 戻る */
  cancel: () => { tone(440, .07, "square", .04); tone(300, .12, "square", .04, .07); },
  /** 台詞の文字送り */
  blip: () => tone(1500, .02, "square", .012),
  /** 斬撃 */
  slash: () => { noise(.16, .18, 0, 1800); tone(2400, .08, "sawtooth", .03, 0, 200); },
  /** 落下・衝撃 */
  thud: () => { tone(90, .28, "sine", .25, 0, 40); noise(.12, .1, 0, 120); },
  /** 大砲 */
  boom: () => { noise(.35, .22, 0, 80); tone(60, .4, "sine", .3, 0, 30); },
  /** スタンプ */
  stamp: () => { tone(180, .1, "square", .12, 0, 90); noise(.08, .12, 0, 400); },
  /** 採用のファンファーレ */
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .18, "square", .05, i * .11)),
  /** 称号の出現 */
  reveal: () => { tone(220, .5, "sine", .12, 0, 110); tone(880, .3, "triangle", .05, .05); },
  /** 蹄の音（ロード中）*/
  hoof: () => { tone(320, .05, "triangle", .05, 0, 180); tone(280, .05, "triangle", .05, .1, 160); },
  isMuted: () => muted,
  toggle: () => { muted = !muted; return muted; },
};
