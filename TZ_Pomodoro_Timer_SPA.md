# Технічне завдання: Pomodoro Timer SPA
> Версія 1.0 · Дата: 2026-06-09

---

## Зміст

1. [Загальний опис проекту](#1-загальний-опис-проекту)
2. [Стек технологій](#2-стек-технологій)
3. [Структура проекту](#3-структура-проекту)
4. [Геоблокування (Росія)](#4-геоблокування-росія)
5. [UI / Дизайн-система](#5-ui--дизайн-система)
6. [Компоненти інтерфейсу](#6-компоненти-інтерфейсу)
7. [Логіка таймера](#7-логіка-таймера)
8. [SVG-слайдер — детальна специфікація + код](#8-svg-слайдер--детальна-специфікація--код)
9. [Синхронізація слайдера й таймера](#9-синхронізація-слайдера-й-таймера)
10. [Стани застосунку](#10-стани-застосунку)
11. [Звукові сповіщення](#11-звукові-сповіщення)
12. [localStorage — збереження налаштувань](#12-localstorage--збереження-налаштувань)
13. [Доступність (a11y)](#13-доступність-a11y)
14. [Адаптивна верстка](#14-адаптивна-верстка)
15. [Вимоги до продуктивності](#15-вимоги-до-продуктивності)
16. [Тестування](#16-тестування)
17. [Чеклист релізу](#17-чеклист-релізу)

---

## 1. Загальний опис проекту

| Параметр | Значення |
|---|---|
| Назва | Pomodoro Timer SPA |
| Тип | Single-Page Application |
| Мова інтерфейсу | Українська / Англійська (перемикач) |
| Браузери | Chrome 110+, Firefox 110+, Safari 16+, Edge 110+ |
| Мобільна підтримка | Обов'язково (320 px → 1920 px) |
| Залежності | Нуль зовнішніх бібліотек (Vanilla JS + SVG) |

### 1.1 Мета

Зручний, візуально виразний Pomodoro-таймер у стилі ілюстрованого постера. Головний елемент — велика томатна SVG-ілюстрація з круговим дуговим слайдером. Застосунок дозволяє планувати робочі сесії та перерви, зберігає налаштування між сесіями та блокує доступ для відвідувачів із Росії.

---

## 2. Стек технологій

```
pomodoro-spa/
├── HTML5          семантична розмітка, без фреймворків
├── CSS3           Custom Properties, Grid, Flexbox, @keyframes
├── JavaScript ES6+ модулі (type="module"), без збирача
└── SVG            вбудований у HTML, для слайдера й ілюстрацій
```

**Заборонено використовувати:**
- React / Vue / Angular або будь-який JS-фреймворк
- Bootstrap, Tailwind або будь-який CSS-фреймворк
- jQuery або сторонні бібліотеки

**Дозволено:**
- Google Fonts (підключення через `<link>`)
- Web Audio API (вбудований браузерний API)
- Fetch API (для геолокації)

---

## 3. Структура проекту

```
pomodoro-spa/
│
├── index.html                  # єдина HTML-сторінка
│
├── assets/
│   ├── fonts/                  # якщо шрифти локальні
│   ├── audio/
│   │   ├── bell.mp3            # сигнал завершення сесії
│   │   ├── tick.mp3            # тікання (опційно)
│   │   └── jerry_heil_get.mp3  # трек для блок-екрану (РФ)
│   └── images/
│       ├── tomato-body.svg     # тіло томату (статика)
│       └── favicon.png
│
├── css/
│   ├── reset.css               # мінімальний CSS reset
│   ├── tokens.css              # CSS Custom Properties (дизайн-токени)
│   ├── layout.css              # глобальний лейаут, grid-зони
│   ├── tomato.css              # стилі томату й декоративних елементів
│   ├── slider.css              # стилі SVG-слайдера
│   ├── timer.css               # цифровий таймер, кнопки
│   ├── modes.css               # перемикачі Work/Break
│   ├── block-screen.css        # екран геоблокування (РФ)
│   └── responsive.css          # медіа-запити
│
├── js/
│   ├── main.js                 # точка входу, ініціалізація
│   ├── geo-block.js            # геоперевірка + блок-екран
│   ├── timer.js                # клас Timer (логіка відліку)
│   ├── slider.js               # клас ArcSlider (SVG-слайдер)
│   ├── sync.js                 # синхронізація слайдера ↔ таймера
│   ├── modes.js                # Work / Short Break / Long Break
│   ├── audio.js                # Web Audio API + звукові ефекти
│   ├── storage.js              # localStorage CRUD
│   └── utils.js                # допоміжні функції
│
└── README.md
```

---

## 4. Геоблокування (Росія)

### 4.1 Логіка перевірки

Перевірка відбувається **на стороні клієнта** одразу після завантаження сторінки, ще до рендерингу таймера.

**Послідовність:**

```
Завантаження → geo-block.js → запит до IP API
        ↓
   country === "RU"?
     ДА  → показати block-screen, заблокувати app
     НІ  → ховати block-screen, показати app
```

**Файл: `js/geo-block.js`**

```javascript
/**
 * Геоблокування для відвідувачів із РФ.
 * Використовує публічний API ip-api.com (без ключа, ліміт 45 req/min).
 * Fallback: якщо API недоступний — пропускаємо (fail-open).
 */

const GEO_API = 'https://ip-api.com/json/?fields=countryCode,status';
const BLOCKED_COUNTRIES = ['RU'];

// URL відеокліпу Jerry Heil — офіційний YouTube
const BLOCK_VIDEO_URL = 'https://www.youtube.com/embed/l2i3oOHYsX0?autoplay=1&mute=0';
// URL аудіо для автовідтворення (якщо відео заблоковано)
const BLOCK_AUDIO_SRC = './assets/audio/jerry_heil_get.mp3';

export async function initGeoBlock() {
  // Одразу ховаємо основний застосунок
  const app = document.getElementById('app');
  const blockScreen = document.getElementById('block-screen');

  // Показуємо лоадер поки чекаємо відповідь
  showLoader(true);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // таймаут 5с

    const response = await fetch(GEO_API, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('Geo API error');

    const data = await response.json();

    if (data.status === 'success' && BLOCKED_COUNTRIES.includes(data.countryCode)) {
      activateBlockScreen(blockScreen, app);
    } else {
      // Доступ дозволений
      app.removeAttribute('hidden');
      blockScreen.setAttribute('hidden', '');
    }
  } catch (err) {
    // Помилка мережі або таймаут — fail-open (пропускаємо)
    console.warn('Geo check failed, allowing access:', err.message);
    app.removeAttribute('hidden');
    blockScreen.setAttribute('hidden', '');
  } finally {
    showLoader(false);
  }
}

function activateBlockScreen(blockScreen, app) {
  // Ховаємо застосунок назавжди
  app.setAttribute('hidden', '');
  app.style.display = 'none';

  // Показуємо блок-екран
  blockScreen.removeAttribute('hidden');
  blockScreen.style.display = 'flex';

  // Вставляємо iframe з відео
  injectBlockVideo();

  // Блокуємо скролл і клавіші
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', preventKeys, true);

  // Блокуємо правий клік і DevTools-хоткеї
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('keydown', preventDevTools, true);
}

function injectBlockVideo() {
  const container = document.getElementById('block-video-container');
  if (!container) return;

  const iframe = document.createElement('iframe');
  iframe.src = BLOCK_VIDEO_URL;
  iframe.width = '100%';
  iframe.height = '100%';
  iframe.allow = 'autoplay; encrypted-media; fullscreen';
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('title', 'Геть з України');

  // Fallback аудіо якщо iframe заблоковано
  iframe.onerror = () => injectFallbackAudio(container);

  container.appendChild(iframe);
}

function injectFallbackAudio(container) {
  const audio = document.createElement('audio');
  audio.src = BLOCK_AUDIO_SRC;
  audio.autoplay = true;
  audio.loop = true;
  audio.controls = false;
  container.appendChild(audio);
  // Відеоплейсхолдер
  container.innerHTML += `<div class="block-audio-fallback">🎵 JERRY HEIL — Геть з України</div>`;
}

function preventKeys(e) {
  // Блокуємо всі Escape, Tab, і навігаційні клавіші
  const blocked = ['Escape', 'Tab', 'F5'];
  if (blocked.includes(e.key)) {
    e.preventDefault();
    e.stopPropagation();
  }
}

function preventDevTools(e) {
  // F12, Ctrl+Shift+I, Ctrl+U
  if (e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.key === 'u')) {
    e.preventDefault();
    e.stopPropagation();
  }
}

function showLoader(show) {
  const loader = document.getElementById('geo-loader');
  if (!loader) return;
  loader.style.display = show ? 'flex' : 'none';
}
```

### 4.2 HTML-розмітка блок-екрану

```html
<!-- Цей блок видно ДО перевірки (потім або показується, або ховається) -->
<div id="geo-loader" style="display:flex;" aria-label="Завантаження" role="status">
  <span class="loader-spinner"></span>
</div>

<!-- Блок-екран для РФ (спочатку прихований) -->
<div id="block-screen" hidden role="alertdialog" aria-modal="true"
     aria-label="Доступ заблоковано">

  <div class="block-screen__overlay"></div>

  <div class="block-screen__content">
    <!-- Відео / аудіо -->
    <div id="block-video-container" class="block-screen__video">
      <!-- iframe вставляється через JS -->
    </div>

    <!-- Повідомлення -->
    <div class="block-screen__message">
      <p class="block-screen__text" lang="uk">ГЕТЬ ЗВІДСИ</p>
      <p class="block-screen__subtext" lang="uk">
        Цей сайт недоступний з Росії.<br>
        Слава Україні! 🇺🇦
      </p>
    </div>
  </div>
</div>

<!-- Основний застосунок (прихований до перевірки) -->
<div id="app" hidden>
  <!-- ... весь застосунок ... -->
</div>
```

### 4.3 CSS блок-екрану (`block-screen.css`)

```css
#block-screen {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0d0d0d;
  font-family: var(--font-display);
  user-select: none;
  pointer-events: all;
}

.block-screen__overlay {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    rgba(0,87,45,0.1) 0px,
    rgba(0,87,45,0.1) 10px,
    transparent 10px,
    transparent 20px
  );
  /* Діагональна текстура у кольорах прапора */
}

.block-screen__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  width: min(90vw, 800px);
}

.block-screen__video {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid #FFD700;
  box-shadow: 0 0 40px rgba(255,215,0,0.4);
}

.block-screen__message {
  text-align: center;
}

.block-screen__text {
  font-size: clamp(3rem, 10vw, 7rem);
  font-weight: 900;
  color: #FFD700;
  text-shadow:
    0 0 20px rgba(255,215,0,0.8),
    0 0 40px rgba(255,215,0,0.4);
  letter-spacing: 0.05em;
  line-height: 1;
  animation: pulse-glow 2s ease-in-out infinite;
}

.block-screen__subtext {
  font-size: clamp(1rem, 3vw, 1.5rem);
  color: #4FC3F7;
  margin-top: 1rem;
  line-height: 1.6;
}

@keyframes pulse-glow {
  0%, 100% { text-shadow: 0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.4); }
  50%       { text-shadow: 0 0 40px rgba(255,215,0,1),   0 0 80px rgba(255,215,0,0.7); }
}

/* Прелоадер */
#geo-loader {
  position: fixed;
  inset: 0;
  background: var(--color-bg);
  z-index: 99998;
  align-items: center;
  justify-content: center;
}

.loader-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
```

---

## 5. UI / Дизайн-система

### 5.1 Дизайн-токени (`css/tokens.css`)

```css
:root {
  /* ── Кольорова палітра ── */
  --color-bg:           #F5F0E8;   /* тепла кремова основа */
  --color-surface:      #FDF9F2;   /* карточки, панелі */
  --color-tomato:       #D63B2F;   /* основний червоний томат */
  --color-tomato-dark:  #A82A20;   /* тінь томату */
  --color-tomato-light: #E8564A;   /* відблиск */
  --color-stem:         #3A7D2C;   /* зелена ніжка */
  --color-leaf:         #4E9940;   /* листочки */
  --color-accent:       #E8A838;   /* жовтогарячий акцент */
  --color-text:         #2C1810;   /* основний текст */
  --color-text-muted:   #7A6558;   /* допоміжний текст */
  --color-border:       #DDD5C8;   /* обводки */
  --color-track:        #EAE3D6;   /* трек слайдера (неактивна частина) */
  --color-progress:     #D63B2F;   /* трек слайдера (активна частина) */
  --color-handle:       #FDF9F2;   /* маркер слайдера */
  --color-shadow:       rgba(44,24,16,0.15);

  /* ── Типографіка ── */
  --font-display:  'Playfair Display', Georgia, serif;  /* заголовки */
  --font-body:     'Nunito', system-ui, sans-serif;      /* UI-тексти */
  --font-timer:    'Space Mono', 'Courier New', monospace; /* цифри */

  /* ── Шкала розмірів шрифту ── */
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.25rem;
  --text-xl:   1.5rem;
  --text-2xl:  2rem;
  --text-timer: clamp(3.5rem, 8vw, 5rem);  /* великий таймер */
  --text-title: clamp(2rem, 5vw, 3.5rem);  /* заголовок сторінки */

  /* ── Відступи ── */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* ── Радіуси ── */
  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   20px;
  --radius-full: 9999px;

  /* ── Тіні ── */
  --shadow-sm:  0 2px 8px var(--color-shadow);
  --shadow-md:  0 6px 24px var(--color-shadow);
  --shadow-lg:  0 12px 48px var(--color-shadow);
  --shadow-tomato: 0 16px 48px rgba(214,59,47,0.25), 0 4px 12px rgba(44,24,16,0.1);

  /* ── Анімації ── */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast:   150ms;
  --duration-normal: 300ms;
  --duration-slow:   500ms;

  /* ── Геометрія слайдера ── */
  --slider-cx:         200;     /* центр X (у координатах SVG) */
  --slider-cy:         200;     /* центр Y */
  --slider-radius:     155;     /* радіус дуги */
  --slider-track-width: 8;      /* товщина треку */
  --slider-handle-r:   14;      /* радіус маркера */
  --slider-start-angle: 135;    /* початковий кут (°) */
  --slider-end-angle:   405;    /* кінцевий кут = 135+270 (°) */
}

/* ── Темна тема ── */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg:      #1A1410;
    --color-surface: #241C18;
    --color-text:    #F5F0E8;
    --color-text-muted: #A0948A;
    --color-border:  #3A2E28;
    --color-track:   #2E2520;
    --color-shadow:  rgba(0,0,0,0.4);
  }
}
```

### 5.2 Шрифти

Підключення у `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;600;700&family=Space+Mono:wght@700&display=swap" rel="stylesheet">
```

---

## 6. Компоненти інтерфейсу

### 6.1 Загальна HTML-структура `index.html`

```html
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Помідорний таймер 🍅</title>
  <link rel="icon" href="./assets/images/favicon.png">
  <!-- Шрифти -->
  <link href="..." rel="stylesheet">
  <!-- Стилі -->
  <link rel="stylesheet" href="./css/reset.css">
  <link rel="stylesheet" href="./css/tokens.css">
  <link rel="stylesheet" href="./css/layout.css">
  <link rel="stylesheet" href="./css/tomato.css">
  <link rel="stylesheet" href="./css/slider.css">
  <link rel="stylesheet" href="./css/timer.css">
  <link rel="stylesheet" href="./css/modes.css">
  <link rel="stylesheet" href="./css/block-screen.css">
  <link rel="stylesheet" href="./css/responsive.css">
</head>
<body>

  <!-- Прелоадер геоперевірки -->
  <div id="geo-loader" role="status" aria-label="Завантаження">
    <span class="loader-spinner"></span>
  </div>

  <!-- Блок-екран (РФ) -->
  <div id="block-screen" hidden role="alertdialog" aria-modal="true">
    <!-- ... див. розділ 4.2 ... -->
  </div>

  <!-- ══ ОСНОВНИЙ ЗАСТОСУНОК ══ -->
  <div id="app" hidden>

    <!-- Заголовок -->
    <header class="app-header">
      <h1 class="app-title">POMODORO TECHNIQUE</h1>
      <p class="app-subtitle" id="mode-description">Зосередьтесь на роботі, потім відпочиньте.</p>
    </header>

    <!-- Перемикач режимів -->
    <nav class="mode-switcher" role="tablist" aria-label="Режими таймера">
      <button role="tab" aria-selected="true"  data-mode="work"        class="mode-btn mode-btn--active">🍅 Робота</button>
      <button role="tab" aria-selected="false" data-mode="short-break" class="mode-btn">☕ Коротка пауза</button>
      <button role="tab" aria-selected="false" data-mode="long-break"  class="mode-btn">🌿 Довга пауза</button>
    </nav>

    <!-- Центральна секція -->
    <main class="timer-stage" aria-label="Таймер">

      <!-- Цифровий таймер -->
      <div class="timer-display" role="timer" aria-live="off" aria-atomic="true">
        <button class="timer-decrement" aria-label="Зменшити час на 1 хвилину">−</button>
        <output
          id="timer-output"
          class="timer-digits"
          for="timer-range"
          aria-label="Залишилось часу"
        >25:00</output>
        <button class="timer-increment" aria-label="Збільшити час на 1 хвилину">+</button>
      </div>

      <!-- SVG-обгортка: слайдер + томат -->
      <div class="tomato-stage" aria-hidden="true">
        <svg
          id="arc-slider-svg"
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
          role="presentation"
        >
          <!-- Декоративні позначки кожні 5 хвилин -->
          <g id="tick-marks" class="slider__ticks"></g>

          <!-- Неактивна частина треку -->
          <path id="slider-track"   class="slider__track"    fill="none"/>

          <!-- Активна частина треку (прогрес) -->
          <path id="slider-progress" class="slider__progress" fill="none"/>

          <!-- Ілюстрація томату (у центрі) -->
          <g id="tomato-illustration">
            <!-- Тіло -->
            <circle cx="200" cy="215" r="110" class="tomato__body"/>
            <!-- Відблиск -->
            <ellipse cx="170" cy="175" rx="22" ry="14" class="tomato__highlight" transform="rotate(-30 170 175)"/>
            <!-- Ніжка -->
            <path d="M200 105 Q205 85 215 78 Q205 95 212 105" class="tomato__stem"/>
            <!-- Листки -->
            <path d="M200 108 Q185 90 175 95 Q188 105 200 108Z" class="tomato__leaf"/>
            <path d="M200 108 Q215 90 225 95 Q212 105 200 108Z" class="tomato__leaf"/>
            <path d="M200 108 Q195 82 200 75 Q205 82 200 108Z" class="tomato__leaf tomato__leaf--center"/>
          </g>

          <!-- Маркер слайдера (перетягуваний) -->
          <circle
            id="slider-handle"
            class="slider__handle"
            r="14"
            tabindex="0"
            role="slider"
            aria-label="Встановити час"
            aria-valuemin="0"
            aria-valuemax="60"
            aria-valuenow="25"
            aria-valuetext="25 хвилин"
          />

          <!-- Мітки 5-хвилинних позначок -->
          <g id="tick-labels" class="slider__labels"></g>
        </svg>

        <!-- Декоративні маленькі томати -->
        <div class="deco-tomato deco-tomato--tl" aria-hidden="true">🍅</div>
        <div class="deco-tomato deco-tomato--tr" aria-hidden="true">🍅</div>
      </div>

      <!-- Підказка режиму під томатом -->
      <p class="mode-badge" id="mode-badge" aria-live="polite">
        <span class="mode-badge__dot"></span>
        <span id="mode-badge-text">Робота · 25 хвилин</span>
      </p>

    </main>

    <!-- Кнопки керування -->
    <div class="controls" role="group" aria-label="Керування таймером">
      <button id="btn-reset"      class="btn btn--ghost" aria-label="Скинути таймер">↺ Скинути</button>
      <button id="btn-start"      class="btn btn--primary" aria-label="Запустити таймер">▶ Старт</button>
      <button id="btn-skip"       class="btn btn--ghost" aria-label="Пропустити до наступного режиму">⏭ Далі</button>
    </div>

    <!-- Опції -->
    <footer class="settings" role="region" aria-label="Налаштування">
      <label class="settings__toggle">
        <input type="checkbox" id="opt-sound"     checked> 🔔 Звук
      </label>
      <label class="settings__toggle">
        <input type="checkbox" id="opt-autostart">         ⏱ Авто-старт
      </label>
      <label class="settings__toggle">
        <input type="checkbox" id="opt-dark">              🌙 Темна тема
      </label>
      <!-- Лічильник сесій -->
      <div class="session-counter" aria-live="polite">
        Сесій сьогодні: <strong id="session-count">0</strong>
      </div>
    </footer>

  </div><!-- /#app -->

  <!-- JS модулі -->
  <script type="module" src="./js/main.js"></script>
</body>
</html>
```

---

## 7. Логіка таймера

**Файл: `js/timer.js`**

```javascript
/**
 * Клас Timer — керує відліком часу.
 * Використовує performance.now() для точності замість setInterval drift.
 */
export class Timer {
  #duration    = 25 * 60;  // секунди
  #remaining   = 25 * 60;
  #state       = 'idle';   // 'idle' | 'running' | 'paused' | 'completed'
  #startTime   = null;
  #rafId       = null;
  #callbacks   = { tick: [], complete: [], stateChange: [] };

  /** Встановити тривалість (у секундах) */
  setDuration(seconds) {
    const s = Math.max(0, Math.min(3600, Math.round(seconds)));
    this.#duration  = s;
    this.#remaining = s;
    this.#emit('tick', this.#remaining);
  }

  /** Встановити залишок (корекція зовні, напр. від слайдера) */
  setRemaining(seconds) {
    if (this.#state === 'running') return; // не дозволяємо під час роботи
    const s = Math.max(0, Math.min(this.#duration, Math.round(seconds)));
    this.#remaining = s;
    this.#emit('tick', s);
  }

  start() {
    if (this.#state === 'running') return;
    if (this.#remaining <= 0) return;

    this.#startTime = performance.now() - (this.#duration - this.#remaining) * 1000;
    this.#state = 'running';
    this.#emit('stateChange', 'running');
    this.#tick();
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

  get remaining()  { return this.#remaining; }
  get duration()   { return this.#duration; }
  get state()      { return this.#state; }
  get progress()   { return 1 - this.#remaining / this.#duration; } // 0..1

  on(event, cb) {
    if (this.#callbacks[event]) this.#callbacks[event].push(cb);
    return this; // chaining
  }

  // ── Внутрішні ──

  #tick() {
    this.#rafId = requestAnimationFrame(() => {
      const elapsed  = (performance.now() - this.#startTime) / 1000;
      const newRem   = Math.max(0, this.#duration - elapsed);
      const prevSec  = Math.ceil(this.#remaining);
      const currSec  = Math.ceil(newRem);

      this.#remaining = newRem;

      // Emit тільки при зміні цілої секунди (щоб не перевантажувати DOM)
      if (currSec !== prevSec) {
        this.#emit('tick', currSec);
      }

      if (newRem <= 0) {
        this.#remaining = 0;
        this.#state = 'completed';
        this.#emit('tick', 0);
        this.#emit('complete');
        this.#emit('stateChange', 'completed');
        return;
      }

      this.#tick();
    });
  }

  #emit(event, data) {
    this.#callbacks[event]?.forEach(cb => cb(data));
  }
}
```

---

## 8. SVG-слайдер — детальна специфікація + код

### 8.1 Геометрія дуги

```
Центр:       (cx=200, cy=200)
Радіус:      155 пікселів SVG
Початок:     135° (нижній лівий)
Кінець:      405° (= 135° + 270°, нижній правий)
Охоплення:   270° дуги
Діапазон:    0..60 хвилин → 0..270°

Формула кута: angle = 135 + (minutes / 60) * 270

Формула координат точки на дузі:
  x = cx + radius * cos(angle_rad)
  y = cy + radius * sin(angle_rad)
  де angle_rad = angle * π / 180
```

### 8.2 Повний клас `ArcSlider` (файл `js/slider.js`)

```javascript
/**
 * ArcSlider — SVG-слайдер у формі дуги навколо томату.
 *
 * Параметри дуги:
 *   startAngle = 135°  (нижній лівий)
 *   endAngle   = 405°  (нижній правий, після повного кола)
 *   sweep      = 270°
 *   radius     = 155   (у SVG-одиницях)
 *   cx, cy     = 200, 200
 *
 * Значення: 0..60 хвилин
 */

export class ArcSlider {
  #cx = 200;
  #cy = 200;
  #r  = 155;
  #startAngle = 135;  // градуси
  #sweepAngle = 270;
  #minVal = 0;
  #maxVal = 60;

  #value    = 25;   // поточне значення у хвилинах
  #dragging = false;

  #svgEl      = null;
  #trackEl    = null;
  #progressEl = null;
  #handleEl   = null;
  #ticksEl    = null;
  #labelsEl   = null;

  #callbacks = { change: [], commit: [] };

  constructor(svgId) {
    this.#svgEl      = document.getElementById(svgId);
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

  // ─────────────────────────────────────────
  //   Публічне API
  // ─────────────────────────────────────────

  /** Встановити значення (хвилини) без генерації події */
  setValue(minutes) {
    this.#value = Math.max(this.#minVal, Math.min(this.#maxVal, minutes));
    this.#render();
  }

  /** Встановити прогрес (0..1) */
  setProgress(ratio) {
    this.setValue(ratio * this.#maxVal);
  }

  get value() { return this.#value; }

  on(event, cb) {
    if (this.#callbacks[event]) this.#callbacks[event].push(cb);
    return this;
  }

  // ─────────────────────────────────────────
  //   Побудова статичних SVG-елементів
  // ─────────────────────────────────────────

  /** Будує повну дугу треку */
  #buildTrack() {
    const fullPath = this.#arcPath(this.#startAngle, this.#startAngle + this.#sweepAngle);
    this.#trackEl.setAttribute('d', fullPath);
    this.#trackEl.setAttribute('stroke-width', '8');
    this.#trackEl.setAttribute('stroke-linecap', 'round');
  }

  /** Будує позначки через кожні 5 хвилин */
  #buildTicks() {
    this.#ticksEl.innerHTML  = '';
    this.#labelsEl.innerHTML = '';

    for (let min = 0; min <= this.#maxVal; min += 5) {
      const angle = this.#minutesToAngle(min);
      const outer = this.#polarToCart(this.#r + 14, angle);
      const inner = this.#polarToCart(this.#r - 14, angle);

      const isMajor = (min % 25 === 0); // яскравіші на 0 і 25

      // Лінія-засічка
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', outer.x);
      line.setAttribute('y1', outer.y);
      line.setAttribute('x2', inner.x);
      line.setAttribute('y2', inner.y);
      line.setAttribute('stroke', isMajor ? 'var(--color-tomato)' : 'var(--color-border)');
      line.setAttribute('stroke-width', isMajor ? '2.5' : '1.5');
      line.setAttribute('stroke-linecap', 'round');
      this.#ticksEl.appendChild(line);

      // Підпис (тільки для 0, 15, 25, 30, 45, 60)
      const labelMins = [0, 15, 25, 30, 45, 60];
      if (labelMins.includes(min)) {
        const labelPos = this.#polarToCart(this.#r + 28, angle);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', labelPos.x);
        text.setAttribute('y', labelPos.y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('class', 'slider__label-text');
        text.textContent = min;
        this.#labelsEl.appendChild(text);
      }
    }
  }

  // ─────────────────────────────────────────
  //   Рендеринг (оновлення при кожній зміні)
  // ─────────────────────────────────────────

  #render() {
    const angle = this.#minutesToAngle(this.#value);

    // Прогрес-дуга (від startAngle до поточного кута)
    const progressPath = this.#value > 0
      ? this.#arcPath(this.#startAngle, angle)
      : '';
    this.#progressEl.setAttribute('d', progressPath || 'M0 0'); // fallback

    // Маркер
    const handlePos = this.#polarToCart(this.#r, angle);
    this.#handleEl.setAttribute('cx', handlePos.x);
    this.#handleEl.setAttribute('cy', handlePos.y);

    // ARIA
    this.#handleEl.setAttribute('aria-valuenow', Math.round(this.#value));
    this.#handleEl.setAttribute('aria-valuetext', `${Math.round(this.#value)} хвилин`);
  }

  // ─────────────────────────────────────────
  //   Події: drag (мишка + тач) + клавіатура
  // ─────────────────────────────────────────

  #bindEvents() {
    // Мишка
    this.#handleEl.addEventListener('mousedown',  this.#onDragStart.bind(this));
    this.#svgEl.addEventListener('mousemove',     this.#onDragMove.bind(this));
    document.addEventListener('mouseup',          this.#onDragEnd.bind(this));

    // Тач
    this.#handleEl.addEventListener('touchstart', this.#onDragStart.bind(this), { passive: false });
    this.#svgEl.addEventListener('touchmove',     this.#onDragMove.bind(this),  { passive: false });
    document.addEventListener('touchend',         this.#onDragEnd.bind(this));

    // Клік на треку (миттєве переміщення)
    this.#trackEl.addEventListener('click',  this.#onTrackClick.bind(this));

    // Клавіатура
    this.#handleEl.addEventListener('keydown', this.#onKeyDown.bind(this));

    // Превент стандартного drag-поведінки браузера
    this.#handleEl.addEventListener('dragstart', e => e.preventDefault());
  }

  #onDragStart(e) {
    e.preventDefault();
    this.#dragging = true;
    this.#handleEl.classList.add('slider__handle--dragging');
  }

  #onDragMove(e) {
    if (!this.#dragging) return;
    e.preventDefault();

    const clientPos = e.touches ? e.touches[0] : e;
    const minutes   = this.#clientToMinutes(clientPos.clientX, clientPos.clientY);
    if (minutes === null) return;

    this.#value = minutes;
    this.#render();
    this.#emit('change', this.#value);
  }

  #onDragEnd() {
    if (!this.#dragging) return;
    this.#dragging = false;
    this.#handleEl.classList.remove('slider__handle--dragging');
    this.#emit('commit', this.#value);
  }

  #onTrackClick(e) {
    const minutes = this.#clientToMinutes(e.clientX, e.clientY);
    if (minutes === null) return;
    this.#value = minutes;
    this.#render();
    this.#emit('change', this.#value);
    this.#emit('commit', this.#value);
  }

  #onKeyDown(e) {
    const STEP = e.shiftKey ? 5 : 1;
    let changed = false;

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      this.#value = Math.min(this.#maxVal, this.#value + STEP);
      changed = true;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      this.#value = Math.max(this.#minVal, this.#value - STEP);
      changed = true;
    } else if (e.key === 'Home') {
      this.#value = this.#minVal;
      changed = true;
    } else if (e.key === 'End') {
      this.#value = this.#maxVal;
      changed = true;
    }

    if (changed) {
      e.preventDefault();
      this.#render();
      this.#emit('change', this.#value);
      this.#emit('commit', this.#value);
    }
  }

  // ─────────────────────────────────────────
  //   Математика
  // ─────────────────────────────────────────

  /**
   * Конвертує клієнтські координати в хвилини (0..60).
   * Обчислює кут від центру SVG до курсору,
   * потім нормалізує його відносно startAngle і sweep.
   * Повертає null якщо курсор поза допустимою зоною.
   */
  #clientToMinutes(clientX, clientY) {
    const rect  = this.#svgEl.getBoundingClientRect();
    // Масштабний коефіцієнт (SVG може бути стиснутий CSS)
    const scaleX = 400 / rect.width;
    const scaleY = 400 / rect.height;

    const svgX = (clientX - rect.left) * scaleX;
    const svgY = (clientY - rect.top)  * scaleY;

    // Кут від центру (в градусах, 0 = права сторона, за годинниковою стрілкою)
    let angle = Math.atan2(svgY - this.#cy, svgX - this.#cx) * 180 / Math.PI;
    // atan2 повертає -180..180, нормалізуємо до 0..360
    if (angle < 0) angle += 360;

    // Перетворюємо у відносний кут від startAngle
    let relative = angle - this.#startAngle;
    if (relative < 0) relative += 360;

    // Якщо поза sweep-зоною — знаходимо найближчий кінець
    if (relative > this.#sweepAngle) {
      relative = relative < (this.#sweepAngle + (360 - this.#sweepAngle) / 2)
        ? this.#sweepAngle
        : 0;
    }

    const minutes = (relative / this.#sweepAngle) * this.#maxVal;
    return Math.round(Math.max(this.#minVal, Math.min(this.#maxVal, minutes)));
  }

  /** Хвилини → кут у градусах (абсолютний) */
  #minutesToAngle(minutes) {
    const ratio = (minutes - this.#minVal) / (this.#maxVal - this.#minVal);
    return this.#startAngle + ratio * this.#sweepAngle;
  }

  /** Полярні координати → декартові (відносно центру SVG) */
  #polarToCart(radius, angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    return {
      x: this.#cx + radius * Math.cos(rad),
      y: this.#cy + radius * Math.sin(rad),
    };
  }

  /**
   * Генерує SVG path рядок для дуги.
   * @param {number} fromAngle - початковий кут (°)
   * @param {number} toAngle   - кінцевий кут (°)
   */
  #arcPath(fromAngle, toAngle) {
    const start   = this.#polarToCart(this.#r, fromAngle);
    const end     = this.#polarToCart(this.#r, toAngle);
    const delta   = toAngle - fromAngle;
    const largeArc = delta % 360 > 180 ? 1 : 0;

    // SVG arc: M sx sy A rx ry x-rotation large-arc-flag sweep-flag ex ey
    return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} ` +
           `A ${this.#r} ${this.#r} 0 ${largeArc} 1 ` +
           `${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
  }

  #emit(event, data) {
    this.#callbacks[event]?.forEach(cb => cb(data));
  }
}
```

---

## 9. Синхронізація слайдера й таймера

**Файл: `js/sync.js`**

```javascript
/**
 * Синхронізація між Timer, ArcSlider і DOM-елементами.
 * Єдиний "координатор" — усі інші модулі не знають одне про одного.
 */

import { formatTime } from './utils.js';

export function bindSync({ timer, slider, outputEl, startBtn, resetBtn, skipBtn, modeManager }) {

  // ── Таймер → UI ──────────────────────────────────────────────────────────

  timer.on('tick', (seconds) => {
    // Оновити цифровий дисплей
    outputEl.textContent = formatTime(seconds);

    // Оновити ARIA
    outputEl.setAttribute('aria-label', `Залишилось ${formatTime(seconds)}`);

    // Оновити слайдер (тільки під час відліку, щоб не конфліктувати з drag)
    if (timer.state === 'running') {
      const minutesLeft = seconds / 60;
      slider.setValue(minutesLeft);
    }

    // Оновити title вкладки (зручно коли вкладка згорнута)
    document.title = `${formatTime(seconds)} · 🍅 Помідор`;
  });

  timer.on('stateChange', (state) => {
    updateButtonState(state, startBtn);
    document.body.setAttribute('data-timer-state', state);
  });

  timer.on('complete', () => {
    modeManager.handleComplete();
  });

  // ── Слайдер → Таймер і UI ────────────────────────────────────────────────

  slider.on('change', (minutes) => {
    // Попередній перегляд (без зміни тривалості таймера)
    outputEl.textContent = formatTime(Math.round(minutes * 60));
  });

  slider.on('commit', (minutes) => {
    // Фіксуємо нове значення
    const seconds = Math.round(minutes * 60);
    timer.setDuration(seconds);
    outputEl.textContent = formatTime(seconds);
  });

  // ── Кнопки ───────────────────────────────────────────────────────────────

  startBtn.addEventListener('click', () => {
    if (timer.state === 'running') {
      timer.pause();
    } else {
      timer.start();
    }
  });

  resetBtn.addEventListener('click', () => {
    timer.reset();
    slider.setValue(timer.duration / 60);
  });

  skipBtn.addEventListener('click', () => {
    timer.reset();
    modeManager.nextMode();
  });

  // ── +/− кнопки цифрового таймера ─────────────────────────────────────────

  document.getElementById('timer-decrement')?.addEventListener('click', () => {
    if (timer.state === 'running') return;
    const newSec = Math.max(60, timer.duration - 60);
    timer.setDuration(newSec);
    slider.setValue(newSec / 60);
  });

  document.getElementById('timer-increment')?.addEventListener('click', () => {
    if (timer.state === 'running') return;
    const newSec = Math.min(3600, timer.duration + 60);
    timer.setDuration(newSec);
    slider.setValue(newSec / 60);
  });
}

function updateButtonState(state, btn) {
  const labels = {
    idle:      { text: '▶ Старт',  variant: 'primary' },
    running:   { text: '⏸ Пауза',  variant: 'warning' },
    paused:    { text: '▶ Продовж', variant: 'primary' },
    completed: { text: '↺ Знову',  variant: 'success' },
  };
  const { text, variant } = labels[state] ?? labels.idle;
  btn.textContent = text;
  btn.setAttribute('data-variant', variant);
  btn.setAttribute('aria-label', text);
}
```

---

## 10. Стани застосунку

| Стан | Опис | Слайдер | Кнопка Start | Ефекти |
|---|---|---|---|---|
| `idle` | Таймер встановлено, не запущено | Перетягується | "▶ Старт" | — |
| `running` | Відлік активний | Рухається автоматично | "⏸ Пауза" | Анімація томату |
| `paused` | Зупинено тимчасово | Зафіксований | "▶ Продовж" | Блимання дисплею |
| `completed` | Дійшло до нуля | На нулі | "↺ Знову" | Звук + анімація |

### Анімації станів

```css
/* Томат пульсує під час роботи */
[data-timer-state="running"] #tomato-illustration {
  animation: tomato-pulse 4s ease-in-out infinite;
}

@keyframes tomato-pulse {
  0%, 100% { filter: drop-shadow(0 8px 24px rgba(214,59,47,0.3)); }
  50%       { filter: drop-shadow(0 12px 36px rgba(214,59,47,0.6)); }
}

/* Блимання при паузі */
[data-timer-state="paused"] .timer-digits {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* Вибух при завершенні */
[data-timer-state="completed"] #tomato-illustration {
  animation: complete-bounce 0.6s var(--ease-spring);
}

@keyframes complete-bounce {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.15); }
  70%  { transform: scale(0.95); }
  100% { transform: scale(1); }
}
```

---

## 11. Звукові сповіщення

**Файл: `js/audio.js`**

```javascript
/**
 * Використовує Web Audio API для генерації звуків (без зовнішніх файлів).
 * Додатково підтримує завантаження mp3 (дзвінок завершення).
 */
export class AudioManager {
  #ctx    = null;
  #muted  = false;

  init() {
    // AudioContext треба ініціалізувати після взаємодії з сторінкою
    this.#ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  setMuted(muted) { this.#muted = muted; }

  /** Короткий тік (кожну секунду, опційно) */
  tick() {
    if (this.#muted || !this.#ctx) return;
    const osc  = this.#ctx.createOscillator();
    const gain = this.#ctx.createGain();
    osc.connect(gain);
    gain.connect(this.#ctx.destination);
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.05, this.#ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.#ctx.currentTime + 0.05);
    osc.start(this.#ctx.currentTime);
    osc.stop(this.#ctx.currentTime + 0.05);
  }

  /** Сигнал завершення сесії (3 дзвони) */
  complete() {
    if (this.#muted || !this.#ctx) return;
    [0, 0.35, 0.7].forEach(delay => {
      const osc  = this.#ctx.createOscillator();
      const gain = this.#ctx.createGain();
      osc.connect(gain);
      gain.connect(this.#ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 660;
      const t = this.#ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.start(t);
      osc.stop(t + 0.65);
    });
  }

  /** Тихий підтверджувальний звук (при натисканні кнопок) */
  click() {
    if (this.#muted || !this.#ctx) return;
    const osc  = this.#ctx.createOscillator();
    const gain = this.#ctx.createGain();
    osc.connect(gain);
    gain.connect(this.#ctx.destination);
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.1, this.#ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.#ctx.currentTime + 0.1);
    osc.start();
    osc.stop(this.#ctx.currentTime + 0.1);
  }
}
```

---

## 12. localStorage — збереження налаштувань

**Файл: `js/storage.js`**

```javascript
const KEY = 'pomodoro_settings_v1';

const DEFAULTS = {
  workDuration:       25,   // хвилини
  shortBreakDuration: 5,
  longBreakDuration:  20,
  soundEnabled:       true,
  autoStart:          false,
  darkMode:           false,
  sessionCount:       0,
  language:           'uk',
};

export const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    } catch {
      return { ...DEFAULTS };
    }
  },
  save(settings) {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  },
  update(patch) {
    const current = this.load();
    this.save({ ...current, ...patch });
  },
  incrementSession() {
    const s = this.load();
    this.save({ ...s, sessionCount: s.sessionCount + 1 });
    return s.sessionCount + 1;
  },
};
```

---

## 13. Доступність (a11y)

| Вимога | Реалізація |
|---|---|
| Клавіатура | Слайдер — `tabindex="0"`, `role="slider"`, стрілки ← → ↑ ↓, Shift+стрілка = крок 5хв |
| ARIA live | `<output aria-live="off">` — не перебиває скрінрідер кожну секунду |
| Стани | `aria-valuenow`, `aria-valuetext`, `aria-selected` для табів режимів |
| Контраст | Мінімум WCAG AA (4.5:1 для тексту, 3:1 для UI) |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` — вимикаються всі анімації |
| Focus visible | Явний `:focus-visible` outline для всіх інтерактивних елементів |
| Семантика | `<main>`, `<header>`, `<nav>`, `<footer>`, `role="timer"` |

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}
```

---

## 14. Адаптивна верстка

```css
/* Mobile first */
.timer-stage {
  display: grid;
  grid-template-rows: auto 1fr auto;
  place-items: center;
  gap: var(--space-4);
}

.tomato-stage svg {
  width: min(90vw, 400px);
  height: auto;
}

/* Tablet */
@media (min-width: 600px) {
  .app-header { padding: var(--space-8) var(--space-6); }
  .controls   { gap: var(--space-6); }
}

/* Desktop */
@media (min-width: 900px) {
  #app {
    display: grid;
    grid-template-columns: 1fr 400px 1fr;
    grid-template-areas:
      ".       header   ."
      ".       modes    ."
      "sidebar center   sidebar-r"
      ".       controls ."
      ".       settings .";
  }
}
```

---

## 15. Вимоги до продуктивності

| Метрика | Ціль |
|---|---|
| FCP (First Contentful Paint) | < 1.5 с |
| TTI (Time to Interactive) | < 2.5 с |
| Розмір JS (усі модулі, gzip) | < 30 КБ |
| Розмір CSS (gzip) | < 15 КБ |
| JS-модулі | Тільки нативні ES modules, без бандлера |
| requestAnimationFrame | Один rAF-цикл на таймер (не setInterval) |
| SVG-рендеринг | Тільки setAttribute, без innerHTML у циклі |

---

## 16. Тестування

### 16.1 Ручне тестування

- [ ] Слайдер перетягується мишкою і тачем
- [ ] Клавіатура: фокус → стрілки змінюють значення
- [ ] Таймер і слайдер завжди синхронні
- [ ] Кнопка +/- змінює тривалість крок 1 хв
- [ ] Start → Pause → Continue → Reset — всі переходи коректні
- [ ] Після досягнення 0 — звук грає, стан = completed
- [ ] Зміна режиму (Work / Short Break / Long Break) — час скидається
- [ ] localStorage зберігає налаштування між перезавантаженнями
- [ ] Темна тема перемикається коректно
- [ ] Геоблокування: VPN → РФ — блок-екран показується, відео завантажується
- [ ] Геоблокування: без VPN — застосунок доступний

### 16.2 Браузерне тестування

| Браузер | Версія | SVG arc | Web Audio | Touch events |
|---|---|---|---|---|
| Chrome | 110+ | ✅ | ✅ | ✅ |
| Firefox | 110+ | ✅ | ✅ | ✅ |
| Safari | 16+ | ✅ | ✅ | ✅ |
| Edge | 110+ | ✅ | ✅ | ✅ |
| iOS Safari | 15+ | ✅ | ⚠️ Потребує user gesture | ✅ |

---

## 17. Чеклист релізу

- [ ] Усі JS-модулі без синтаксичних помилок (`eslint`)
- [ ] CSS Custom Properties задані у `tokens.css`
- [ ] Шрифти завантажуються через `<link rel="preconnect">`
- [ ] `favicon.png` підключено
- [ ] `robots.txt` та `sitemap.xml` (опційно)
- [ ] HTTPS (геолокаційний API потребує захищеного протоколу)
- [ ] `<meta name="description">` заповнено
- [ ] `lang="uk"` у `<html>`
- [ ] Перевірено на мобільному (iOS + Android)
- [ ] Перевірено Lighthouse: Performance > 90, Accessibility > 95
- [ ] Тест з увімкненим screen reader (NVDA / VoiceOver)
- [ ] Геоблок протестовано через VPN (RU endpoint)

---

## Додаток A — Утиліти (`js/utils.js`)

```javascript
/**
 * Форматує секунди у рядок "MM:SS"
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(s / 60).toString().padStart(2, '0');
  const seconds = (s % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

/**
 * Обмежує число в діапазоні [min, max]
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Дебаунс — затримка виклику функції
 */
export function debounce(fn, delay = 100) {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), delay);
  };
}
```

---

## Додаток B — Точка входу (`js/main.js`)

```javascript
import { initGeoBlock }  from './geo-block.js';
import { Timer }         from './timer.js';
import { ArcSlider }     from './slider.js';
import { bindSync }      from './sync.js';
import { ModeManager }   from './modes.js';
import { AudioManager }  from './audio.js';
import { Storage }       from './storage.js';

async function main() {
  // 1. Геоперевірка (блокує або пропускає)
  await initGeoBlock();

  // Якщо блок-екран активний — нічого більше не ініціалізуємо
  if (!document.getElementById('app').hasAttribute('hidden') === false) return;

  // 2. Завантажити налаштування
  const settings = Storage.load();

  // 3. Ініціалізація підсистем
  const audio  = new AudioManager();
  const timer  = new Timer();
  const slider = new ArcSlider('arc-slider-svg');
  const modes  = new ModeManager({ timer, slider, settings, audio });

  // 4. Прив'язка синхронізації
  bindSync({
    timer,
    slider,
    outputEl: document.getElementById('timer-output'),
    startBtn: document.getElementById('btn-start'),
    resetBtn: document.getElementById('btn-reset'),
    skipBtn:  document.getElementById('btn-skip'),
    modeManager: modes,
  });

  // 5. Ініціалізувати стан із налаштувань
  timer.setDuration(settings.workDuration * 60);
  slider.setValue(settings.workDuration);

  // 6. Прив'язати опції
  const soundToggle = document.getElementById('opt-sound');
  soundToggle.checked = settings.soundEnabled;
  soundToggle.addEventListener('change', () => {
    audio.setMuted(!soundToggle.checked);
    Storage.update({ soundEnabled: soundToggle.checked });
  });

  // Ініціалізувати Audio після першого кліку (браузерна вимога)
  document.getElementById('btn-start').addEventListener('click', () => {
    audio.init?.();
  }, { once: true });

  // 7. Показати кількість сесій
  document.getElementById('session-count').textContent = settings.sessionCount;
}

main().catch(console.error);
```

---

*Технічне завдання складено для версії 1.0. Розширення (статистика, хмарна синхронізація, PWA) виносяться у версію 2.0.*
