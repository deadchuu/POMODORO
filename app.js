'use strict';

/* ═══════════════════════════════════════════════
   UTILS
   ═══════════════════════════════════════════════ */
function formatTime(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

/* ═══════════════════════════════════════════════
   STORAGE
   ═══════════════════════════════════════════════ */
const STORAGE_KEY = 'pomodoro_v1';
const DEFAULTS = {
  workDuration:       25,
  shortBreakDuration: 5,
  longBreakDuration:  20,
  soundEnabled:       true,
  autoStart:          false,
  darkMode:           false,
  sessionCount:       0,
};
const Storage = {
  load()          { try { const r = localStorage.getItem(STORAGE_KEY); return r ? {...DEFAULTS, ...JSON.parse(r)} : {...DEFAULTS}; } catch { return {...DEFAULTS}; } },
  save(s)         { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {} },
  update(patch)   { this.save({...this.load(), ...patch}); },
  incSession()    { const s = this.load(); this.save({...s, sessionCount: s.sessionCount + 1}); return s.sessionCount + 1; },
};

/* ═══════════════════════════════════════════════
   TIMER CLASS
   ═══════════════════════════════════════════════ */
class Timer {
  #duration  = 25 * 60;
  #remaining = 25 * 60;
  #state     = 'idle';
  #startTime = null;
  #rafId     = null;
  #cbs       = { tick: [], complete: [], stateChange: [] };

  setDuration(s) {
    s = clamp(Math.round(s), 60, 3600);
    this.#duration = this.#remaining = s;
    this.#emit('tick', s);
  }
  setRemaining(s) {
    if (this.#state === 'running') return;
    this.#remaining = clamp(Math.round(s), 0, this.#duration);
    this.#emit('tick', this.#remaining);
  }
  start() {
    if (this.#state === 'running' || this.#remaining <= 0) return;
    this.#startTime = performance.now() - (this.#duration - this.#remaining) * 1000;
    this.#state = 'running';
    this.#emit('stateChange', 'running');
    this.#loop();
  }
  pause() {
    if (this.#state !== 'running') return;
    cancelAnimationFrame(this.#rafId);
    this.#state = 'paused';
    this.#emit('stateChange', 'paused');
  }
  reset() {
    cancelAnimationFrame(this.#rafId);
    this.#remaining = this.#duration;
    this.#state = 'idle';
    this.#emit('tick', this.#remaining);
    this.#emit('stateChange', 'idle');
  }
  on(ev, cb)      { if (this.#cbs[ev]) this.#cbs[ev].push(cb); return this; }
  get remaining() { return this.#remaining; }
  get duration()  { return this.#duration; }
  get state()     { return this.#state; }

  #loop() {
    this.#rafId = requestAnimationFrame(() => {
      const elapsed = (performance.now() - this.#startTime) / 1000;
      const prev = Math.ceil(this.#remaining);
      const newR  = Math.max(0, this.#duration - elapsed);
      this.#remaining = newR;

      if (Math.ceil(newR) !== prev) this.#emit('tick', Math.ceil(newR));

      if (newR <= 0) {
        this.#remaining = 0;
        this.#state = 'completed';
        this.#emit('tick', 0);
        this.#emit('complete');
        this.#emit('stateChange', 'completed');
        return;
      }
      this.#loop();
    });
  }
  #emit(ev, d) { (this.#cbs[ev] || []).forEach(cb => cb(d)); }
}

/* ═══════════════════════════════════════════════
   ARC SLIDER
   ═══════════════════════════════════════════════ */
class ArcSlider {
  #cx = 200; #cy = 200; #r = 155;
  #startAngle = 135; #sweep = 270;
  #min = 1; #max = 60;
  #value = 25; #dragging = false;
  #svgEl; #trackEl; #progressEl; #handleEl; #ticksEl; #labelsEl;
  #cbs = { change: [], commit: [] };

  constructor(id) {
    this.#svgEl      = document.getElementById(id);
    this.#trackEl    = document.getElementById('slider-track');
    this.#progressEl = document.getElementById('slider-progress');
    this.#handleEl   = document.getElementById('slider-handle');
    this.#ticksEl    = document.getElementById('tick-marks');
    this.#labelsEl   = document.getElementById('tick-labels');

    this.#buildTrack();
    this.#buildTicks();
    this.#bindEvents();
    this.setValue(this.#value);
  }

  setValue(min) {
    this.#value = clamp(min, this.#min, this.#max);
    this.#render();
  }
  setProgress(ratio) { this.setValue(ratio * this.#max); }
  get value() { return this.#value; }
  on(ev, cb)  { if (this.#cbs[ev]) this.#cbs[ev].push(cb); return this; }

  #buildTrack() {
    this.#trackEl.setAttribute('d', this.#arcPath(this.#startAngle, this.#startAngle + this.#sweep));
    this.#trackEl.setAttribute('stroke-width', '8');
    this.#trackEl.setAttribute('stroke-linecap', 'round');
  }

  #buildTicks() {
    this.#ticksEl.innerHTML = this.#labelsEl.innerHTML = '';
    const NS = 'http://www.w3.org/2000/svg';

    for (let m = 0; m <= this.#max; m += 5) {
      const ang   = this.#minToAngle(m);
      const outer = this.#polar(this.#r + 15, ang);
      const inner = this.#polar(this.#r - 15, ang);
      const major = m % 25 === 0;

      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', outer.x); line.setAttribute('y1', outer.y);
      line.setAttribute('x2', inner.x); line.setAttribute('y2', inner.y);
      line.setAttribute('stroke', major ? 'var(--color-tomato)' : 'var(--color-border)');
      line.setAttribute('stroke-width', major ? '2.5' : '1.5');
      line.setAttribute('stroke-linecap', 'round');
      this.#ticksEl.appendChild(line);

      if ([0, 15, 25, 30, 45, 60].includes(m)) {
        const lp  = this.#polar(this.#r + 30, ang);
        const txt = document.createElementNS(NS, 'text');
        txt.setAttribute('x', lp.x); txt.setAttribute('y', lp.y);
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('dominant-baseline', 'middle');
        txt.setAttribute('class', 'slider__label-text');
        txt.textContent = m;
        this.#labelsEl.appendChild(txt);
      }
    }
  }

  #render() {
    const ang = this.#minToAngle(this.#value);
    const hp  = this.#polar(this.#r, ang);

    // Progress arc
    if (this.#value > this.#min) {
      this.#progressEl.setAttribute('d', this.#arcPath(this.#startAngle, ang));
    } else {
      this.#progressEl.setAttribute('d', 'M0 0');
    }

    // Handle
    this.#handleEl.setAttribute('cx', hp.x);
    this.#handleEl.setAttribute('cy', hp.y);
    this.#handleEl.setAttribute('aria-valuenow', Math.round(this.#value));
    this.#handleEl.setAttribute('aria-valuetext', `${Math.round(this.#value)} хвилин`);
  }

  #bindEvents() {
    // Mouse
    this.#handleEl.addEventListener('mousedown', e => { e.preventDefault(); this.#dragging = true; this.#handleEl.classList.add('slider__handle--dragging'); });
    this.#svgEl.addEventListener('mousemove', e => {
      if (!this.#dragging) return;
      const m = this.#clientToMin(e.clientX, e.clientY);
      if (m !== null) { this.#value = m; this.#render(); this.#emit('change', m); }
    });
    document.addEventListener('mouseup', () => {
      if (!this.#dragging) return;
      this.#dragging = false;
      this.#handleEl.classList.remove('slider__handle--dragging');
      this.#emit('commit', this.#value);
    });

    // Touch
    this.#handleEl.addEventListener('touchstart', e => { e.preventDefault(); this.#dragging = true; this.#handleEl.classList.add('slider__handle--dragging'); }, { passive: false });
    this.#svgEl.addEventListener('touchmove', e => {
      if (!this.#dragging) return;
      e.preventDefault();
      const t = e.touches[0];
      const m = this.#clientToMin(t.clientX, t.clientY);
      if (m !== null) { this.#value = m; this.#render(); this.#emit('change', m); }
    }, { passive: false });
    document.addEventListener('touchend', () => {
      if (!this.#dragging) return;
      this.#dragging = false;
      this.#handleEl.classList.remove('slider__handle--dragging');
      this.#emit('commit', this.#value);
    });

    // Track click
    this.#trackEl.addEventListener('click', e => {
      const m = this.#clientToMin(e.clientX, e.clientY);
      if (m !== null) { this.#value = m; this.#render(); this.#emit('change', m); this.#emit('commit', m); }
    });

    // Keyboard
    this.#handleEl.addEventListener('keydown', e => {
      const step = e.shiftKey ? 5 : 1;
      let changed = false;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp')   { this.#value = Math.min(this.#max, this.#value + step); changed = true; }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown') { this.#value = Math.max(this.#min, this.#value - step); changed = true; }
      if (e.key === 'Home') { this.#value = this.#min; changed = true; }
      if (e.key === 'End')  { this.#value = this.#max; changed = true; }
      if (changed) { e.preventDefault(); this.#render(); this.#emit('change', this.#value); this.#emit('commit', this.#value); }
    });

    this.#handleEl.addEventListener('dragstart', e => e.preventDefault());
  }

  #clientToMin(cx, cy) {
    const rect = this.#svgEl.getBoundingClientRect();
    const sx = (cx - rect.left) * (400 / rect.width);
    const sy = (cy - rect.top)  * (400 / rect.height);

    let ang = Math.atan2(sy - this.#cy, sx - this.#cx) * 180 / Math.PI;
    if (ang < 0) ang += 360;

    let rel = ang - this.#startAngle;
    if (rel < 0) rel += 360;
    if (rel > this.#sweep) {
      rel = rel < this.#sweep + (360 - this.#sweep) / 2 ? this.#sweep : 0;
    }

    return Math.round(clamp((rel / this.#sweep) * this.#max, this.#min, this.#max));
  }

  #minToAngle(m) { return this.#startAngle + ((m - this.#min) / (this.#max - this.#min)) * this.#sweep; }

  #polar(radius, deg) {
    const rad = deg * Math.PI / 180;
    return { x: this.#cx + radius * Math.cos(rad), y: this.#cy + radius * Math.sin(rad) };
  }

  #arcPath(from, to) {
    const s = this.#polar(this.#r, from);
    const e = this.#polar(this.#r, to);
    const la = (to - from) % 360 > 180 ? 1 : 0;
    return `M ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${this.#r} ${this.#r} 0 ${la} 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`;
  }

  #emit(ev, d) { (this.#cbs[ev] || []).forEach(cb => cb(d)); }
}

/* ═══════════════════════════════════════════════
   AUDIO MANAGER
   ═══════════════════════════════════════════════ */
class AudioManager {
  #ctx = null;
  #muted = false;

  init() {
    if (this.#ctx) return;
    this.#ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  setMuted(m) { this.#muted = m; }

  click() { this.#tone(440, 0.08, 0.1); }
  tick()  { this.#tone(800, 0.04, 0.05); }

  complete() {
    if (this.#muted || !this.#ctx) return;
    [0, 0.35, 0.7].forEach(delay => {
      const osc  = this.#ctx.createOscillator();
      const gain = this.#ctx.createGain();
      osc.connect(gain); gain.connect(this.#ctx.destination);
      osc.type = 'sine'; osc.frequency.value = 660;
      const t = this.#ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.start(t); osc.stop(t + 0.65);
    });
  }

  #tone(freq, vol, dur) {
    if (this.#muted || !this.#ctx) return;
    const osc  = this.#ctx.createOscillator();
    const gain = this.#ctx.createGain();
    osc.connect(gain); gain.connect(this.#ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.#ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.#ctx.currentTime + dur);
    osc.start(); osc.stop(this.#ctx.currentTime + dur);
  }
}

/* ═══════════════════════════════════════════════
   MODE MANAGER
   ═══════════════════════════════════════════════ */
class ModeManager {
  #modes = {
    'work':        { label: 'WORK SESSION',   duration: 25, color: 'work' },
    'short-break': { label: 'SHORT BREAK',    duration: 5,  color: 'short-break' },
    'long-break':  { label: 'LONG BREAK',     duration: 20, color: 'long-break' },
  };
  #order    = ['work', 'short-break', 'work', 'long-break'];
  #idx      = 0;
  #current  = 'work';
  #timer; #slider; #audio; #settings;
  #onComplete = null;

  constructor({ timer, slider, audio, settings, onSessionComplete }) {
    this.#timer    = timer;
    this.#slider   = slider;
    this.#audio    = audio;
    this.#settings = settings;
    this.#onComplete = onSessionComplete;

    // Apply durations from settings
    this.#modes.work['duration']        = settings.workDuration;
    this.#modes['short-break'].duration = settings.shortBreakDuration;
    this.#modes['long-break'].duration  = settings.longBreakDuration;

    this.#applyMode('work');
    this.#bindButtons();
  }

  #bindButtons() {
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.#timer.reset();
        this.#applyMode(btn.dataset.mode);
      });
    });
  }

  #applyMode(mode) {
    this.#current = mode;
    const cfg = this.#modes[mode];

    // Update badge
    document.getElementById('mode-badge').textContent = cfg.label;

    // Update mode buttons
    document.querySelectorAll('[data-mode]').forEach(btn => {
      const sel = btn.dataset.mode === mode;
      btn.classList.toggle('mode-btn--active', sel);
      btn.setAttribute('aria-selected', sel);
    });

    // Update timer & slider
    this.#timer.setDuration(cfg.duration * 60);
    this.#slider.setValue(cfg.duration);

    // Update body attr for CSS theming
    document.body.setAttribute('data-mode', mode);
  }

  handleComplete() {
    this.#audio.complete();
    if (this.#onComplete) this.#onComplete();

    if (this.#settings.autoStart) {
      this.#idx = (this.#idx + 1) % this.#order.length;
      setTimeout(() => {
        this.#applyMode(this.#order[this.#idx]);
        this.#timer.start();
      }, 1500);
    }
  }

  nextMode() {
    this.#idx = (this.#idx + 1) % this.#order.length;
    this.#applyMode(this.#order[this.#idx]);
  }
}

/* ═══════════════════════════════════════════════
   GEO BLOCK
   ═══════════════════════════════════════════════ */
// async function initGeoBlock() {
//   const app         = document.getElementById('app');
//   const blockScreen = document.getElementById('block-screen');
//   const loader      = document.getElementById('geo-loader');

//   try {
//     const ctrl = new AbortController();
//     const tid  = setTimeout(() => ctrl.abort(), 5000);
//     const res  = await fetch('https://ip-api.com/json/?fields=countryCode,status', { signal: ctrl.signal });
//     clearTimeout(tid);

//     if (!res.ok) throw new Error('geo fail');
//     const data = await res.json();

//     if (data.status === 'success' && data.countryCode === 'RU') {
//       // Block
//       loader.style.display = 'none';
//       blockScreen.removeAttribute('hidden');
//       blockScreen.style.display = 'flex';
//       app.setAttribute('hidden', '');

//       const container = document.getElementById('block-video-container');
//       const iframe = document.createElement('iframe');
//       iframe.src    = 'https://www.youtube.com/embed/l2i3oOHYsX0?autoplay=1';
//       iframe.width  = '100%'; iframe.height = '100%';
//       iframe.allow  = 'autoplay; encrypted-media; fullscreen';
//       iframe.setAttribute('allowfullscreen', '');
//       iframe.setAttribute('frameborder', '0');
//       container.appendChild(iframe);

//       document.body.style.overflow = 'hidden';
//       return false;
//     }
//   } catch {
//     // fail-open
//   }

//   loader.style.display = 'none';
//   app.removeAttribute('hidden');
//   return true;
// }

/* ═══════════════════════════════════════════════
   SESSION UI
   ═══════════════════════════════════════════════ */
function updateSessionUI(count) {
  document.getElementById('session-count').textContent = count;

  const sessionInCycle = ((count - 1) % 4) + 1;
  document.getElementById('session-display').textContent = `— ${sessionInCycle} —`;

  const dots = document.querySelectorAll('#session-dots .dot');
  dots.forEach((d, i) => {
    d.classList.toggle('dot--done', i < sessionInCycle);
  });
}

/* ═══════════════════════════════════════════════
   BIND SYNC (Timer ↔ Slider ↔ DOM)
   ═══════════════════════════════════════════════ */
function bindSync({ timer, slider, audio, modeManager, settings }) {
  const outputEl  = document.getElementById('timer-output');
  const startBtn  = document.getElementById('btn-start');
  const resetBtn  = document.getElementById('btn-reset');
  const skipBtn   = document.getElementById('btn-skip');

  // Timer → DOM
  timer.on('tick', s => {
    outputEl.textContent = formatTime(s);
    outputEl.setAttribute('aria-label', `Залишилось ${formatTime(s)}`);
    document.title = `${formatTime(s)} · 🍅 Помідор`;
    if (timer.state === 'running') slider.setValue(s / 60);
  });

  timer.on('stateChange', state => {
    document.body.setAttribute('data-timer-state', state);
    const map = {
      idle:      ['▶ Start',   'primary'],
      running:   ['⏸ Pause',   'warning'],
      paused:    ['▶ Resume',  'primary'],
      completed: ['↺ Again',   'success'],
    };
    const [text, variant] = map[state] || map.idle;
    startBtn.textContent = text;
    startBtn.setAttribute('data-variant', variant);
    startBtn.setAttribute('aria-label', text);
  });

  timer.on('complete', () => {
    const count = Storage.incSession();
    updateSessionUI(count);
    modeManager.handleComplete();
  });

  // Slider → Timer
  slider.on('change', m => { outputEl.textContent = formatTime(Math.round(m * 60)); });
  slider.on('commit', m => {
    const s = Math.round(m * 60);
    timer.setDuration(s);
    outputEl.textContent = formatTime(s);
  });

  // Buttons
  startBtn.addEventListener('click', () => {
    audio.init();
    audio.click();
    if (timer.state === 'running') timer.pause();
    else timer.start();
  });
  resetBtn.addEventListener('click', () => {
    audio.click();
    timer.reset();
    slider.setValue(timer.duration / 60);
  });
  skipBtn.addEventListener('click', () => {
    audio.click();
    timer.reset();
    modeManager.nextMode();
  });

  // +/- on display click (desktop hint — hold ctrl to adjust)
  outputEl.addEventListener('dblclick', () => {
    if (timer.state !== 'idle' && timer.state !== 'paused') return;
    const cur = timer.duration;
    const newD = clamp(cur + 60, 60, 3600);
    timer.setDuration(newD);
    slider.setValue(newD / 60);
  });

  // Settings
  const soundToggle     = document.getElementById('opt-sound');
  const autostartToggle = document.getElementById('opt-autostart');
  const darkToggle      = document.getElementById('opt-dark');

  soundToggle.checked     = settings.soundEnabled;
  autostartToggle.checked = settings.autoStart;
  darkToggle.checked      = settings.darkMode;
  if (settings.darkMode) document.documentElement.setAttribute('data-dark', 'true');

  soundToggle.addEventListener('change', () => {
    audio.setMuted(!soundToggle.checked);
    Storage.update({ soundEnabled: soundToggle.checked });
  });
  autostartToggle.addEventListener('change', () => {
    settings.autoStart = autostartToggle.checked;
    Storage.update({ autoStart: autostartToggle.checked });
  });
  darkToggle.addEventListener('change', () => {
    const dark = darkToggle.checked;
    document.documentElement.setAttribute('data-dark', dark);
    Storage.update({ darkMode: dark });
  });
}

/* ═══════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════ */
async function main() {
  const allowed = await initGeoBlock();
  if (!allowed) return;

  const settings = Storage.load();

  const audio  = new AudioManager();
  audio.setMuted(!settings.soundEnabled);

  const timer  = new Timer();
  const slider = new ArcSlider('arc-slider-svg');

  const modeManager = new ModeManager({
    timer, slider, audio, settings,
    onSessionComplete: () => {},
  });

  bindSync({ timer, slider, audio, modeManager, settings });

  // Init display
  const count = settings.sessionCount;
  updateSessionUI(count === 0 ? 1 : count);
  document.getElementById('session-count').textContent = count;
}

main().catch(console.error);
