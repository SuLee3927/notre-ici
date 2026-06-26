// Web Audio API synthesized sounds for 糯糯的梦境大冒险
// No external files needed — all sounds generated in-browser

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// ── helpers ──────────────────────────────────────────────────────────────

function gain(ac, value) {
  const g = ac.createGain();
  g.gain.value = value;
  return g;
}

function osc(ac, type, freq, start, duration, vol = 0.3) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  o.connect(g);
  g.connect(ac.destination);
  o.start(start);
  o.stop(start + duration);
}

function sweep(ac, type, freqFrom, freqTo, start, duration, vol = 0.25) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freqFrom, start);
  o.frequency.exponentialRampToValueAtTime(freqTo, start + duration);
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  o.connect(g);
  g.connect(ac.destination);
  o.start(start);
  o.stop(start + duration);
}

function noise(ac, start, duration, vol = 0.15) {
  const bufSize = ac.sampleRate * duration;
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  src.connect(g);
  g.connect(ac.destination);
  src.start(start);
  src.stop(start + duration);
}

// ── SFX ──────────────────────────────────────────────────────────────────

export function sfxDigitCollect() {
  const ac = getCtx();
  const t = ac.currentTime;
  // bright ascending "ding ✨"
  osc(ac, "sine", 880, t, 0.12, 0.35);
  osc(ac, "sine", 1320, t + 0.07, 0.2, 0.3);
  osc(ac, "sine", 1760, t + 0.14, 0.14, 0.25);
}

export function sfxDigitError() {
  const ac = getCtx();
  const t = ac.currentTime;
  // soft "噗"
  noise(ac, t, 0.12, 0.08);
  osc(ac, "sine", 200, t, 0.18, 0.06);
}

export function sfxMirrorFlip() {
  const ac = getCtx();
  const t = ac.currentTime;
  // "唰—" whoosh + sparkle
  sweep(ac, "sawtooth", 800, 200, t, 0.25, 0.1);
  osc(ac, "sine", 2000, t + 0.1, 0.15, 0.12);
  osc(ac, "sine", 2400, t + 0.18, 0.1, 0.1);
}

export function sfxCalendarStack() {
  const ac = getCtx();
  const t = ac.currentTime;
  // paper rustle + thud
  noise(ac, t, 0.25, 0.12);
  osc(ac, "sine", 120, t + 0.2, 0.18, 0.2);
}

export function sfxColorReverse() {
  const ac = getCtx();
  const t = ac.currentTime;
  // electric buzz + bubble pops
  osc(ac, "sawtooth", 60, t, 0.35, 0.15);
  [0, 0.1, 0.2, 0.28].forEach(dt => noise(ac, t + dt, 0.05, 0.1));
}

export function sfxShadowRight() {
  const ac = getCtx();
  const t = ac.currentTime;
  // ascending chord "Ah~"
  [523, 659, 784, 1047].forEach((f, i) => osc(ac, "sine", f, t + i * 0.08, 0.4, 0.22));
}

export function sfxShadowWrong() {
  const ac = getCtx();
  const t = ac.currentTime;
  // descending slide "呜～"
  sweep(ac, "sine", 440, 200, t, 0.4, 0.2);
}

export function sfxPasswordRight() {
  const ac = getCtx();
  const t = ac.currentTime;
  // click + door + shimmer
  noise(ac, t, 0.08, 0.25);
  osc(ac, "sine", 80, t + 0.05, 0.3, 0.3);
  [880, 1100, 1320, 1760].forEach((f, i) => osc(ac, "sine", f, t + 0.4 + i * 0.08, 0.3, 0.28));
}

export function sfxPasswordWrong() {
  const ac = getCtx();
  const t = ac.currentTime;
  // low warning buzz
  osc(ac, "sawtooth", 100, t, 0.25, 0.12);
  osc(ac, "sawtooth", 80, t + 0.2, 0.2, 0.1);
}

export function sfxCountdownTick() {
  const ac = getCtx();
  const t = ac.currentTime;
  osc(ac, "square", 800, t, 0.05, 0.08);
}

export function sfxDoorClose() {
  const ac = getCtx();
  const t = ac.currentTime;
  noise(ac, t, 0.12, 0.3);
  osc(ac, "sine", 60, t + 0.05, 0.5, 0.25);
}

export function sfxHover() {
  const ac = getCtx();
  const t = ac.currentTime;
  osc(ac, "sine", 1200, t, 0.05, 0.06);
}

// ── BGM ──────────────────────────────────────────────────────────────────
// Simple music-box style melody using short note sequences scheduled in a loop

const NOTES = {
  C4:261, D4:294, E4:330, F4:349, G4:392, A4:440, B4:494,
  C5:523, D5:587, E5:659, G5:784, A5:880, B5:988,
};

let bgmStop = null;

function playMelodyLoop(melody, tempo, vol, detune = 0) {
  const ac = getCtx();
  let loop = true;
  let timeout;

  function schedule(startTime) {
    if (!loop) return;
    let t = startTime;
    melody.forEach(([freq, dur]) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sine";
      o.frequency.value = freq * Math.pow(2, detune / 1200);
      const beatDur = (60 / tempo) * dur;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.02);
      g.gain.setValueAtTime(vol, t + beatDur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + beatDur);
      o.connect(g);
      g.connect(ac.destination);
      o.start(t);
      o.stop(t + beatDur);
      t += beatDur;
    });
    const totalDur = melody.reduce((s, [, d]) => s + (60 / tempo) * d, 0);
    timeout = setTimeout(() => schedule(ac.currentTime), totalDur * 1000 - 200);
  }

  schedule(ac.currentTime);
  return () => { loop = false; clearTimeout(timeout); };
}

// Dreamy music-box melody (B-01 style)
const DREAM_MELODY = [
  [NOTES.C5,1],[NOTES.E5,1],[NOTES.G5,1],[NOTES.C5,2],
  [NOTES.B4,1],[NOTES.D5,1],[NOTES.G5,1],[NOTES.B4,2],
  [NOTES.A4,1],[NOTES.C5,1],[NOTES.E5,1],[NOTES.A4,2],
  [NOTES.G4,1],[NOTES.B4,1],[NOTES.D5,1],[NOTES.G4,2],
];

// Tense melody (B-02 style) — faster
const TENSE_MELODY = [
  [NOTES.C4,.5],[NOTES.C4,.5],[NOTES.D4,.5],[NOTES.C4,.5],
  [NOTES.F4,.5],[NOTES.E4,1],[NOTES.C4,.5],[NOTES.D4,.5],
  [NOTES.C4,.5],[NOTES.G4,.5],[NOTES.F4,1],[NOTES.E4,1],
];

// Wake ending (B-04 style) — warm piano
const WAKE_MELODY = [
  [NOTES.C5,2],[NOTES.E5,2],[NOTES.G5,2],[NOTES.C5,4],
  [NOTES.D5,2],[NOTES.F4,2],[NOTES.A4,2],[NOTES.D5,4],
];

// Dream ending (B-05 style) — harp-like, ethereal
const DREAM_END_MELODY = [
  [NOTES.C5,1.5],[NOTES.G5,1.5],[NOTES.E5,1.5],[NOTES.A5,1.5],
  [NOTES.B4,2],  [NOTES.G5,2],  [NOTES.D5,3],
];

export function bgmStart(type = "dream") {
  bgmStop?.();
  const configs = {
    dream:    { melody: DREAM_MELODY,    tempo: 70,  vol: 0.08 },
    tense:    { melody: TENSE_MELODY,    tempo: 140, vol: 0.1  },
    wakeEnd:  { melody: WAKE_MELODY,     tempo: 60,  vol: 0.1  },
    dreamEnd: { melody: DREAM_END_MELODY,tempo: 50,  vol: 0.09 },
  };
  const { melody, tempo, vol } = configs[type] || configs.dream;
  bgmStop = playMelodyLoop(melody, tempo, vol);
}

export function bgmStop_() {
  bgmStop?.();
  bgmStop = null;
}

export { bgmStop_ as bgmStopAll };
