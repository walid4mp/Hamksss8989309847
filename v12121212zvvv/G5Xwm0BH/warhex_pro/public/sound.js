const SoundFX = {
  ctx: null,
  enabled: true,
  volume: 0.45,
  masterMuted: false,
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { this.enabled = false; }
  },
  ensureCtx() {
    if (!this.enabled || this.masterMuted) return false;
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
    return !!this.ctx;
  },
  setVolume(v = 0.45) { this.volume = Math.max(0, Math.min(1, Number(v) || 0)); return this.volume; },
  tone(freq, dur, type = 'sine', vol = 0.15) {
    if (!this.ensureCtx()) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(Math.max(0.001, vol * this.volume), this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.start(); osc.stop(this.ctx.currentTime + dur);
  },
  move() { this.tone(420, 0.07, 'triangle', 0.12); },
  capture() { this.tone(220, 0.12, 'sawtooth', 0.18); setTimeout(() => this.tone(160, 0.08, 'square', 0.1), 40); },
  check() { this.tone(840, 0.16, 'square', 0.12); setTimeout(() => this.tone(620, 0.18, 'square', 0.1), 85); },
  checkmate() { [860, 660, 420].forEach((f, i) => setTimeout(() => this.tone(f, 0.2 + i * 0.05, 'square', 0.12), i * 120)); },
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 'triangle', 0.12), i * 90)); },
  lose() { [400, 350, 300, 250].forEach((f, i) => setTimeout(() => this.tone(f, 0.24, 'sine', 0.11), i * 110)); },
  dice() { this.tone(320 + Math.random() * 220, 0.05, 'square', 0.09); setTimeout(() => this.tone(210 + Math.random() * 120, 0.1, 'square', 0.07), 55); },
  gift() { this.tone(930, 0.08, 'triangle', 0.08); setTimeout(() => this.tone(1210, 0.1, 'triangle', 0.07), 70); },
  coins() { this.tone(1080, 0.04, 'square', 0.06); setTimeout(() => this.tone(1280, 0.06, 'square', 0.05), 45); },
  gems() { this.tone(620, 0.12, 'triangle', 0.07); setTimeout(() => this.tone(980, 0.18, 'triangle', 0.06), 70); },
  levelUp() { [500, 700, 900, 1200].forEach((f, i) => setTimeout(() => this.tone(f, 0.1, 'triangle', 0.09), i * 75)); },
  click() { this.tone(620, 0.03, 'triangle', 0.05); },
  notify() { this.tone(880, 0.1, 'sine', 0.08); setTimeout(() => this.tone(1110, 0.1, 'sine', 0.07), 80); },
  error() { this.tone(200, 0.15, 'sawtooth', 0.12); },
  vibrate(ms = 45) { if (navigator.vibrate) navigator.vibrate(ms); },
  toggle() { this.enabled = !this.enabled; return this.enabled; },
};
if (typeof window !== 'undefined') window.SoundFX = SoundFX;
