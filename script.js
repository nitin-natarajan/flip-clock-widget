/* ── State ─────────────────────────────────────────── */
let mode          = 'clock';   // 'clock' | 'timer'
let timerSeconds  = 300;
let timerRunning  = false;
let timerInterval = null;
let clockInterval = null;
let colonBlink    = true;
let lastLeft      = null;      // previous displayed value for left card
let lastRight     = null;      // previous displayed value for right card

/* ── Helpers ───────────────────────────────────────── */
function pad(n) {
  return String(n).padStart(2, '0');
}

/* ── Flip animation ────────────────────────────────── */
/**
 * Animates a flip from oldVal → newVal on the given side ('left' | 'right').
 * The top half folds down (showing oldVal), then the bottom half reveals newVal.
 */
function doFlip(side, oldVal, newVal) {
  const ft      = document.getElementById('ft-' + side);
  const fb      = document.getElementById('fb-' + side);
  const ftNum   = document.getElementById('ft-' + side + '-num');
  const fbNum   = document.getElementById('fb-' + side + '-num');
  const staticNum = document.getElementById('num-' + side);

  // Set the numbers on the animation panels
  ftNum.textContent = oldVal;
  fbNum.textContent = newVal;

  // Show panels and reset any leftover animation class
  ft.style.display = '';
  fb.style.display = '';
  ft.classList.remove('animating');
  fb.classList.remove('animating');

  // Force reflow so removing + re-adding the class restarts the animation
  void ft.offsetWidth;

  ft.classList.add('animating');
  fb.classList.add('animating');

  // After both halves finish (22ms + 22ms + small buffer = 500ms),
  // swap the static number and hide the panels
  setTimeout(() => {
    staticNum.textContent = newVal;
    ft.style.display = 'none';
    fb.style.display = 'none';
    ft.classList.remove('animating');
    fb.classList.remove('animating');
  }, 500);
}

/* ── Clock mode ────────────────────────────────────── */
function updateClock() {
  const now  = new Date();
  let   h    = now.getHours();
  const m    = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;

  const newLeft  = String(h);
  const newRight = pad(m);

  document.getElementById('ampm-label').textContent = ampm;

  // Flip only when the value has actually changed
  if (lastLeft !== null && lastLeft !== newLeft) {
    doFlip('left', lastLeft, newLeft);
  } else {
    document.getElementById('num-left').textContent = newLeft;
  }

  if (lastRight !== null && lastRight !== newRight) {
    doFlip('right', lastRight, newRight);
  } else {
    document.getElementById('num-right').textContent = newRight;
  }

  lastLeft  = newLeft;
  lastRight = newRight;

  // Blink the colon dots
  colonBlink = !colonBlink;
  const op = colonBlink ? '1' : '0.2';
  document.getElementById('dot1').style.opacity = op;
  document.getElementById('dot2').style.opacity = op;
}

function startClockInterval() {
  stopClockInterval();
  lastLeft = null;
  lastRight = null;
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

function stopClockInterval() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}

/* ── Timer mode ────────────────────────────────────── */
function updateTimerDisplay(animate) {
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  const newLeft  = pad(m);
  const newRight = pad(s);

  if (animate) {
    if (lastLeft  !== newLeft)  doFlip('left',  lastLeft,  newLeft);
    else document.getElementById('num-left').textContent  = newLeft;

    if (lastRight !== newRight) doFlip('right', lastRight, newRight);
    else document.getElementById('num-right').textContent = newRight;
  } else {
    document.getElementById('num-left').textContent  = newLeft;
    document.getElementById('num-right').textContent = newRight;
  }

  lastLeft  = newLeft;
  lastRight = newRight;
}

function stopTimerInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/* ── Mode switching ────────────────────────────────── */
function setMode(m) {
  mode = m;
  const isTimer = (m === 'timer');

  document.getElementById('toggle-track').className =
    'toggle-track' + (isTimer ? ' on' : '');

  document.getElementById('label-time').className =
    'toggle-label' + (!isTimer ? ' active' : '');

  document.getElementById('label-timer').className =
    'toggle-label' + (isTimer ? ' active' : '');

  document.getElementById('timer-panel').style.display =
    isTimer ? 'flex' : 'none';

  document.getElementById('ampm-label').style.display =
    isTimer ? 'none' : '';

  // Reset colon dots to fully visible when switching
  document.getElementById('dot1').style.opacity = '1';
  document.getElementById('dot2').style.opacity = '1';

  if (!isTimer) {
    stopTimerInterval();
    timerRunning = false;
    document.getElementById('start-btn').textContent = '▶';
    startClockInterval();
  } else {
    stopClockInterval();
    const dur = parseInt(document.getElementById('duration-input').value) || 5;
    timerSeconds = dur * 60;
    lastLeft  = null;
    lastRight = null;
    updateTimerDisplay(false);
  }
}

function toggleMode() {
  setMode(mode === 'clock' ? 'timer' : 'clock');
}

/* ── Timer controls ────────────────────────────────── */
function toggleTimer() {
  if (timerSeconds <= 0) {
    resetTimer();
    return;
  }

  timerRunning = !timerRunning;
  document.getElementById('start-btn').textContent = timerRunning ? '⏸' : '▶';

  if (timerRunning) {
    timerInterval = setInterval(() => {
      timerSeconds--;
      updateTimerDisplay(true);

      if (timerSeconds <= 0) {
        timerSeconds = 0;
        updateTimerDisplay(true);
        timerRunning = false;
        clearInterval(timerInterval);
        document.getElementById('start-btn').textContent = '▶';
      }
    }, 1000);
  } else {
    stopTimerInterval();
  }
}

function adjustTimer(delta) {
  if (timerRunning) return;
  timerSeconds = Math.max(0, timerSeconds + delta);
  document.getElementById('duration-input').value = Math.ceil(timerSeconds / 60);
  lastLeft  = null;
  lastRight = null;
  updateTimerDisplay(false);
}

function resetTimer() {
  stopTimerInterval();
  timerRunning = false;
  document.getElementById('start-btn').textContent = '▶';
  const dur = parseInt(document.getElementById('duration-input').value) || 1;
  timerSeconds = dur * 60;
  lastLeft  = null;
  lastRight = null;
  updateTimerDisplay(false);
}

/* ── Duration input listener ───────────────────────── */
document.getElementById('duration-input').addEventListener('change', function () {
  if (!timerRunning) {
    timerSeconds = (parseInt(this.value) || 1) * 60;
    lastLeft  = null;
    lastRight = null;
    updateTimerDisplay(false);
  }
});

/* ── Boot ──────────────────────────────────────────── */
startClockInterval();
