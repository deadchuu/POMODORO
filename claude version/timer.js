/* ── Конфігурація слайдера ── */
const ARC = {
  cx: 200,
  cy: 215,   // центр помідора трохи нижче
  r: 108,    // радіус прямо по "ободку" помідора
  startAngle: 135,  // знизу-ліво (як на аналоговому годиннику)
  sweep: 270,       // 270° дуга
  minVal: 1,
  maxVal: 60,
};

/* ── Стан ── */
const state = {
  minutes: 25,
  seconds: 25 * 60,
  timerState: 'idle', // idle | running | paused | completed
  mode: 'work',
  sessions: 0,
  intervalId: null,
  startTs: null,
  remainingAtPause: 25 * 60,
  soundOn: true,
  autostart: false,
};

const MODES = {
  work:        { label: '🍅 Робота',      minutes: 25 },
  'short-break': { label: '☕ Пауза',    minutes: 5  },
  'long-break':  { label: '🌿 Відпочинок', minutes: 15 },
};

/* ── DOM ── */
const svg       = document.getElementById('arc-svg');
const trackEl   = document.getElementById('slider-track');
const progressEl = document.getElementById('slider-progress');
const ticksEl   = document.getElementById('tick-marks');
const labelsEl  = document.getElementById('tick-labels');
const handleEl  = document.getElementById('slider-handle');
const arrowEl   = document.getElementById('handle-arrow');
const handleGrp = document.getElementById('slider-handle-group');
const outputEl  = document.getElementById('timer-output');
const centerMin = document.getElementById('center-minutes');
const startBtn  = document.getElementById('btn-start');
const resetBtn  = document.getElementById('btn-reset');
const skipBtn   = document.getElementById('btn-skip');
const decBtn    = document.getElementById('btn-dec');
const incBtn    = document.getElementById('btn-inc');
const sessionEl = document.getElementById('session-count');
const soundChk  = document.getElementById('opt-sound');
const autoChk   = document.getElementById('opt-autostart');

/* ════════════════════════════════════════════
   МАТЕМАТИКА СЛАЙДЕРА
   ════════════════════════════════════════════ */
function minutesToAngle(min) {
  const ratio = (min - ARC.minVal) / (ARC.maxVal - ARC.minVal);
  return ARC.startAngle + ratio * ARC.sweep;
}

function polarToCart(r, angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  return { x: ARC.cx + r * Math.cos(rad), y: ARC.cy + r * Math.sin(rad) };
}

function arcPath(fromDeg, toDeg) {
  const s = polarToCart(ARC.r, fromDeg);
  const e = polarToCart(ARC.r, toDeg);
  const delta = ((toDeg - fromDeg) + 720) % 360;
  const large = delta > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${ARC.r} ${ARC.r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function clientToMinutes(clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  const sx = 400 / rect.width;
  const sy = 400 / rect.height;
  const svgX = (clientX - rect.left) * sx;
  const svgY = (clientY - rect.top) * sy;
  let angle = Math.atan2(svgY - ARC.cy, svgX - ARC.cx) * 180 / Math.PI;
  if (angle < 0) angle += 360;
  let rel = angle - ARC.startAngle;
  if (rel < 0) rel += 360;
  if (rel > ARC.sweep) {
    rel = rel < (ARC.sweep + (360 - ARC.sweep) / 2) ? ARC.sweep : 0;
  }
  const m = ARC.minVal + (rel / ARC.sweep) * (ARC.maxVal - ARC.minVal);
  return Math.max(ARC.minVal, Math.min(ARC.maxVal, Math.round(m)));
}

/* ════════════════════════════════════════════
   ПОБУДОВА СТАТИЧНИХ ЕЛЕМЕНТІВ
   ════════════════════════════════════════════ */
function buildTrack() {
  const full = arcPath(ARC.startAngle, ARC.startAngle + ARC.sweep);
  trackEl.setAttribute('d', full);
}

function buildTicks() {
  ticksEl.innerHTML = '';
  labelsEl.innerHTML = '';
  const ns = 'http://www.w3.org/2000/svg';
  const labelSet = new Set([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]);

  for (let m = 0; m <= ARC.maxVal; m += 1) {
    const angle = minutesToAngle(m);
    const isFive  = m % 5 === 0;
    const isMajor = m % 25 === 0;
    if (!isFive) continue; // тільки кожні 5 хвилин

    // Тіки всередині та зовні кола
    const outerR = ARC.r + (isMajor ? 14 : 9);
    const innerR = ARC.r - (isMajor ? 14 : 9);
    const o = polarToCart(outerR, angle);
    const i = polarToCart(innerR, angle);

    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', o.x); line.setAttribute('y1', o.y);
    line.setAttribute('x2', i.x); line.setAttribute('y2', i.y);
    line.setAttribute('class', isMajor ? 'tick-line-major' : 'tick-line-minor');
    ticksEl.appendChild(line);

    // Підписи кожні 5 хвилин
    if (labelSet.has(m)) {
      const labelR = ARC.r + 26;
      const lp = polarToCart(labelR, angle);
      const txt = document.createElementNS(ns, 'text');
      txt.setAttribute('x', lp.x);
      txt.setAttribute('y', lp.y);
      txt.setAttribute('class', 'tick-label');
      txt.textContent = m;
      labelsEl.appendChild(txt);
    }
  }
}

/* ════════════════════════════════════════════
   РЕНДЕРИНГ
   ════════════════════════════════════════════ */
function renderSlider(minutes) {
  const angle = minutesToAngle(minutes);

  // Прогрес-дуга
  if (minutes > ARC.minVal) {
    progressEl.setAttribute('d', arcPath(ARC.startAngle, angle));
  } else {
    progressEl.setAttribute('d', 'M 0 0');
  }

  // Позиція маркера
  const hp = polarToCart(ARC.r, angle);
  handleEl.setAttribute('cx', hp.x);
  handleEl.setAttribute('cy', hp.y);
  handleEl.setAttribute('aria-valuenow', minutes);
  handleEl.setAttribute('aria-valuetext', `${minutes} хвилин`);

  // Стрілка над маркером — вертикально повернена за напрямком дуги
  arrowEl.setAttribute('transform',
    `translate(${hp.x.toFixed(2)}, ${hp.y.toFixed(2)}) rotate(${angle + 90})`
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateDisplay(seconds) {
  outputEl.textContent = formatTime(seconds);
  const mLeft = Math.ceil(seconds / 60);
  centerMin.textContent = Math.floor(seconds / 60);

  if (state.timerState === 'running') {
    // Під час роботи слайдер відображає залишок хвилин
    const minFrac = seconds / 60;
    renderSlider(Math.max(ARC.minVal, minFrac));
  }
}

/* ════════════════════════════════════════════
   ТАЙМЕР
   ════════════════════════════════════════════ */
function startTimer() {
  if (state.timerState === 'running') return;
  state.startTs = Date.now();
  state.timerState = 'running';
  document.body.setAttribute('data-timer-state', 'running');
  updateStartBtn();

  state.intervalId = setInterval(() => {
    const elapsed = Math.floor((Date.now() - state.startTs) / 1000);
    const remaining = Math.max(0, state.remainingAtPause - elapsed);
    updateDisplay(remaining);

    if (remaining <= 0) {
      clearInterval(state.intervalId);
      state.timerState = 'completed';
      document.body.setAttribute('data-timer-state', 'completed');
      state.sessions++;
      sessionEl.textContent = state.sessions;
      updateStartBtn();
      playComplete();
      renderSlider(ARC.minVal);
      centerMin.textContent = '0';
      outputEl.textContent = '00:00';

      if (state.autostart) {
        setTimeout(() => {
          nextMode();
        }, 1500);
      }
    }
  }, 250);
}

function pauseTimer() {
  if (state.timerState !== 'running') return;
  clearInterval(state.intervalId);
  const elapsed = Math.floor((Date.now() - state.startTs) / 1000);
  state.remainingAtPause = Math.max(0, state.remainingAtPause - elapsed);
  state.timerState = 'paused';
  document.body.setAttribute('data-timer-state', 'paused');
  updateStartBtn();
}

function resetTimer() {
  clearInterval(state.intervalId);
  state.timerState = 'idle';
  state.remainingAtPause = state.minutes * 60;
  document.body.setAttribute('data-timer-state', 'idle');
  updateDisplay(state.remainingAtPause);
  renderSlider(state.minutes);
  updateStartBtn();
}

function setMinutes(m) {
  state.minutes = Math.max(ARC.minVal, Math.min(ARC.maxVal, m));
  state.remainingAtPause = state.minutes * 60;
  updateDisplay(state.remainingAtPause);
  renderSlider(state.minutes);
}

function nextMode() {
  const order = ['work', 'short-break', 'long-break'];
  const idx = order.indexOf(state.mode);
  state.mode = order[(idx + 1) % order.length];
  applyMode(state.mode);
}

function applyMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('mode-btn--active', b.dataset.mode === mode);
  });
  resetTimer();
  setMinutes(MODES[mode].minutes);
}

function updateStartBtn() {
  const labels = {
    idle:      '▶ Старт',
    running:   '⏸ Пауза',
    paused:    '▶ Продовж',
    completed: '↺ Знову',
  };
  startBtn.textContent = labels[state.timerState] || '▶ Старт';
}

/* ════════════════════════════════════════════
   АУДІО
   ════════════════════════════════════════════ */
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playComplete() {
  if (!state.soundOn) return;
  try {
    const ctx = getAudioCtx();
    [0, 0.35, 0.7].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = 660;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.start(t); osc.stop(t + 0.65);
    });
  } catch(e) {}
}

function playClick() {
  if (!state.soundOn) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  } catch(e) {}
}

/* ════════════════════════════════════════════
   ПОДІЇ СЛАЙДЕРА
   ════════════════════════════════════════════ */
let dragging = false;

function onDragStart(e) {
  if (state.timerState === 'running') return;
  e.preventDefault();
  dragging = true;
  handleEl.classList.add('dragging');
}

function onDragMove(e) {
  if (!dragging) return;
  e.preventDefault();
  const pt = e.touches ? e.touches[0] : e;
  const m = clientToMinutes(pt.clientX, pt.clientY);
  setMinutes(m);
}

function onDragEnd() {
  if (!dragging) return;
  dragging = false;
  handleEl.classList.remove('dragging');
}

// Клік прямо по треку
function onTrackClick(e) {
  if (state.timerState === 'running') return;
  const m = clientToMinutes(e.clientX, e.clientY);
  setMinutes(m);
}

handleEl.addEventListener('mousedown', onDragStart);
svg.addEventListener('mousemove', onDragMove);
document.addEventListener('mouseup', onDragEnd);
handleEl.addEventListener('touchstart', onDragStart, { passive: false });
svg.addEventListener('touchmove', onDragMove, { passive: false });
document.addEventListener('touchend', onDragEnd);
trackEl.addEventListener('click', onTrackClick);

// Клавіатура
handleEl.addEventListener('keydown', e => {
  if (state.timerState === 'running') return;
  const step = e.shiftKey ? 5 : 1;
  if (['ArrowRight','ArrowUp'].includes(e.key)) {
    setMinutes(state.minutes + step); e.preventDefault();
  } else if (['ArrowLeft','ArrowDown'].includes(e.key)) {
    setMinutes(state.minutes - step); e.preventDefault();
  } else if (e.key === 'Home') {
    setMinutes(ARC.minVal); e.preventDefault();
  } else if (e.key === 'End') {
    setMinutes(ARC.maxVal); e.preventDefault();
  }
});

/* ════════════════════════════════════════════
   КНОПКИ
   ════════════════════════════════════════════ */
startBtn.addEventListener('click', () => {
  playClick();
  if (state.timerState === 'completed') {
    resetTimer();
  } else if (state.timerState === 'running') {
    pauseTimer();
  } else {
    startTimer();
  }
});

resetBtn.addEventListener('click', () => { playClick(); resetTimer(); });
skipBtn.addEventListener('click', () => { playClick(); resetTimer(); nextMode(); });

decBtn.addEventListener('click', () => {
  if (state.timerState === 'running') return;
  setMinutes(state.minutes - 1);
});
incBtn.addEventListener('click', () => {
  if (state.timerState === 'running') return;
  setMinutes(state.minutes + 1);
});

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    applyMode(btn.dataset.mode);
  });
});

soundChk.addEventListener('change', () => { state.soundOn = soundChk.checked; });
autoChk.addEventListener('change', () => { state.autostart = autoChk.checked; });

/* ════════════════════════════════════════════
   ІНІЦІАЛІЗАЦІЯ
   ════════════════════════════════════════════ */
buildTrack();
buildTicks();
renderSlider(state.minutes);
updateDisplay(state.minutes * 60);
updateStartBtn();
document.body.setAttribute('data-timer-state', 'idle');
