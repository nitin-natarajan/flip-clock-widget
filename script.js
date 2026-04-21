/* ── State ─────────────────────────────────────────── */
let mode = 'clock', timerSeconds = 300, timerRunning = false;
let timerInterval = null, clockInterval = null, colonBlink = true;
let curLeft = null, curRight = null;

/* ── Helpers ───────────────────────────────────────── */
function pad(n) { return String(n).padStart(2, '0'); }

function setStatic(side, val) {
  document.getElementById('upper-' + side + '-num').textContent = val;
  document.getElementById('lower-' + side + '-num').textContent = val;
}

/* ── Flip animation ────────────────────────────────── */
// Dynamically creates & injects flap/reveal elements so CSS animation
// always fires fresh — no class-reset issues.
function doFlip(side, oldVal, newVal) {
  const card = document.getElementById('fc-' + side);

  // Static lower half pre-loads the new number (hidden behind reveal)
  document.getElementById('upper-' + side + '-num').textContent = oldVal;
  document.getElementById('lower-' + side + '-num').textContent = newVal;

  // Flap: old top half that folds down
  const flap = document.createElement('div');
  flap.className = 'flap';
  flap.innerHTML = '<span class="card-num">' + oldVal + '</span>';

  // Reveal: new bottom half that swings into view
  const reveal = document.createElement('div');
  reveal.className = 'reveal';
  reveal.innerHTML = '<span class="card-num">' + newVal + '</span>';

  card.appendChild(flap);
  card.appendChild(reveal);

  // Double rAF ensures elements are painted before animation class is added
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flap.classList.add('go');
      reveal.classList.add('go');
    });
  });

  // After both halves finish, sync static upper and remove temp elements
  setTimeout(() => {
    document.getElementById('upper-' + side + '-num').textContent = newVal;
    flap.remove();
    reveal.remove();
  }, 450);
}

/* ── Clock mode ────────────────────────────────────── */
function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const newLeft = String(h), newRight = pad(m);

  document.getElementById('ampm-label').textContent = ampm;

  if (curLeft === null)        setStatic('left', newLeft);
  else if (curLeft !== newLeft) doFlip('left', curLeft, newLeft);

  if (curRight === null)         setStatic('right', newRight);
  else if (curRight !== newRight) doFlip('right', curRight, newRight);

  curLeft = newLeft; curRight = newRight;

  colonBlink = !colonBlink;
  const op = colonBlink ? '1' : '0.2';
  document.getElementById('dot1').style.opacity = op;
  document.getElementById('dot2').style.opacity = op;
}

function startClockInterval() {
  if (clockInterval) clearInterval(clockInterval);
  curLeft = null; curRight = null;
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

/* ── Timer mode ────────────────────────────────────── */
function updateTimerDisplay(animate) {
  const m = Math.floor(timerSeconds / 60), s = timerSeconds % 60;
  const newLeft = pad(m), newRight = pad(s);
  if (animate) {
    if (curLeft  !== newLeft)  doFlip('left',  curLeft,  newLeft);
    else setStatic('left', newLeft);
    if (curRight !== newRight) doFlip('right', curRight, newRight);
    else setStatic('right', newRight);
  } else {
    setStatic('left', newLeft);
    setStatic('right', newRight);
  }
  curLeft = newLeft; curRight = newRight;
}

/* ── Mode switching ────────────────────────────────── */
function setMode(m) {
  mode = m;
  const isTimer = m === 'timer';
  document.getElementById('toggle-track').className = 'toggle-track' + (isTimer ? ' on' : '');
  document.getElementById('label-time').className   = 'toggle-label' + (!isTimer ? ' active' : '');
  document.getElementById('label-timer').className  = 'toggle-label' + (isTimer  ? ' active' : '');
  document.getElementById('timer-panel').style.display = isTimer ? 'flex' : 'none';
  document.getElementById('ampm-label').style.display  = isTimer ? 'none' : '';
  document.getElementById('dot1').style.opacity = '1';
  document.getElementById('dot2').style.opacity = '1';

  if (!isTimer) {
    if (timerInterval) clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('start-btn').textContent = '▶';
    setRunningUI(false);
    startClockInterval();
  } else {
    if (clockInterval) clearInterval(clockInterval);
    timerSeconds = (parseInt(document.getElementById('duration-input').value) || 5) * 60;
    curLeft = null; curRight = null;
    updateTimerDisplay(false);
  }
}

function toggleMode() { setMode(mode === 'clock' ? 'timer' : 'clock'); }

/* ── Timer controls ────────────────────────────────── */
function setRunningUI(running) {
  const minus  = document.getElementById('wrap-minus');
  const plus   = document.getElementById('wrap-plus');
  const reset  = document.getElementById('wrap-reset');
  const durRow = document.getElementById('duration-row');

  if (running) {
    minus.classList.add('hidden');
    plus.classList.add('hidden');
    reset.classList.remove('hidden');
    durRow.style.opacity = '0';
    durRow.style.pointerEvents = 'none';
  } else {
    minus.classList.remove('hidden');
    plus.classList.remove('hidden');
    reset.classList.add('hidden');
    durRow.style.opacity = '1';
    durRow.style.pointerEvents = '';
  }
}

function toggleTimer() {
  if (timerSeconds <= 0) { resetTimer(); return; }
  timerRunning = !timerRunning;
  document.getElementById('start-btn').textContent = timerRunning ? '⏸' : '▶';
  setRunningUI(timerRunning);
  if (timerRunning) {
    timerInterval = setInterval(() => {
      timerSeconds--;
      updateTimerDisplay(true);
      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        document.getElementById('start-btn').textContent = '▶';
        setRunningUI(false);
      }
    }, 1000);
  } else {
    clearInterval(timerInterval);
  }
}

function adjustTimer(delta) {
  if (timerRunning) return;
  timerSeconds = Math.max(0, timerSeconds + delta);
  document.getElementById('duration-input').value = Math.ceil(timerSeconds / 60);
  curLeft = null; curRight = null;
  updateTimerDisplay(false);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById('start-btn').textContent = '▶';
  setRunningUI(false);
  timerSeconds = (parseInt(document.getElementById('duration-input').value) || 1) * 60;
  curLeft = null; curRight = null;
  updateTimerDisplay(false);
}

document.getElementById('duration-input').addEventListener('change', function () {
  if (!timerRunning) {
    timerSeconds = (parseInt(this.value) || 1) * 60;
    curLeft = null; curRight = null;
    updateTimerDisplay(false);
  }
});

/* ── Boot ──────────────────────────────────────────── */
startClockInterval();
