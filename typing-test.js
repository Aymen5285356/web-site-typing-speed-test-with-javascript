const texts = {
  easy: [
    "the cat sat on the mat and looked at the dog",
    "she sells sea shells by the sea shore every day",
    "a big red fox ran fast over the old brown log",
    "the sun sets over the hills and the sky turns red",
    "we went to the park and fed the ducks by the lake",
  ],
  medium: [
    "JavaScript is a lightweight programming language with first class functions.",
    "Learning to code is one of the best investments you can make in your future.",
    "Practice makes perfect and consistency is the key to mastering any new skill.",
    "The browser renders HTML and CSS into a visual interface for users to interact with.",
    "Version control with Git allows teams to collaborate on code without conflicts.",
  ],
  hard: [
    "Asynchronous programming with promises and async-await enables non-blocking execution.",
    "Object-oriented programming encapsulates data and behavior into reusable structures.",
    "The Document Object Model provides a structured representation of HTML for manipulation.",
    "Memoization is an optimization technique that caches expensive function call results.",
    "Polymorphism allows different types to be treated as instances of the same base type.",
  ],
  code: [
    "const sum = (a, b) => a + b; console.log(sum(3, 7));",
    "function debounce(fn, delay) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); }; }",
    "const unique = arr => [...new Set(arr)]; const flat = arr => arr.reduce((a, b) => a.concat(b), []);",
    "fetch('/api/data').then(r => r.json()).then(data => console.log(data)).catch(console.error);",
    "const memoize = fn => { const cache = {}; return (...args) => { const k = JSON.stringify(args); return cache[k] ?? (cache[k] = fn(...args)); }; };",
  ],
  darija: [
    "zwina bzzaf had lvida dyal javascript",
    "khassk t9ra mezyan bach t9der tkhdem mzyan",
    "coding machi sa3ba ila kan 3andek sabr",
    "had lbrograma kaytkhdem bla ay mochkil",
    "t3lem programming w dir lmostakbal dyalek",
  ]
};

const TIMER_OPTIONS = [60, 30, 15];

const state = {
  currentText: "",
  typed: "",
  timeLeft: 60,
  totalTime: 60,
  timer: null,
  started: false,
  finished: false,
  correctChars: 0,
  totalTyped: 0,
  currentStreak: 0,
  bestStreak: 0,
  errorCount: 0,
  wpmHistory: [],
  wpmSnapshotTimer: null,
};

const quoteBox      = document.getElementById("quote-box");
const inputArea     = document.getElementById("input-area");
const wpmDisplay    = document.getElementById("wpm");
const accDisplay    = document.getElementById("accuracy");
const timeDisplay   = document.getElementById("time");
const streakDisplay = document.getElementById("streak");
const errDisplay    = document.getElementById("errors");
const progressBar   = document.getElementById("progress-bar");
const progressLabel = document.getElementById("progress-label");
const resultOverlay = document.getElementById("result-overlay");
const diffSelect    = document.getElementById("difficulty");
const inputStatus   = document.getElementById("input-status");
const quoteHint     = document.getElementById("quote-hint");
const hsBadge       = document.getElementById("high-score-badge");
const timerRing     = document.getElementById("timer-ring-fill");
const RING_CIRC     = 213.6;

function pickText() {
  const pool = texts[diffSelect.value];
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderQuote() {
  quoteBox.innerHTML = "";
  [...state.currentText].forEach((char, i) => {
    const span = document.createElement("span");
    span.textContent = char;
    span.className   = "char";
    if (i === 0) span.classList.add("cursor");
    quoteBox.appendChild(span);
  });
}

function updateDisplay() {
  const chars   = quoteBox.querySelectorAll(".char");
  let errorsNow = 0;

  [...state.currentText].forEach((char, i) => {
    const span = chars[i];
    span.className = "char";
    if (i < state.typed.length) {
      if (state.typed[i] === char) span.classList.add("correct");
      else { span.classList.add("wrong"); errorsNow++; }
    } else if (i === state.typed.length) {
      span.classList.add("cursor");
    }
  });

  state.errorCount = errorsNow;
  const elapsed  = state.totalTime - state.timeLeft;
  const wpm      = elapsed > 0 ? Math.round((state.correctChars / 5) / (elapsed / 60)) : 0;
  const accuracy = state.totalTyped > 0 ? Math.round((state.correctChars / state.totalTyped) * 100) : 100;
  const progress = Math.round((state.typed.length / state.currentText.length) * 100);

  wpmDisplay.textContent    = wpm;
  accDisplay.textContent    = accuracy;
  streakDisplay.textContent = state.bestStreak;
  errDisplay.textContent    = errorsNow;
  progressBar.style.width   = progress + "%";
  progressLabel.textContent = progress + "%";

  document.getElementById("wpm-bar").style.width    = Math.min(wpm / 1.5, 100) + "%";
  document.getElementById("acc-bar").style.width    = accuracy + "%";
  document.getElementById("streak-bar").style.width = Math.min(state.bestStreak * 5, 100) + "%";
  document.getElementById("err-bar").style.width    = Math.min(errorsNow * 10, 100) + "%";

  if (accuracy < 80) accDisplay.style.color = "var(--red)";
  else if (accuracy < 95) accDisplay.style.color = "var(--amber)";
  else accDisplay.style.color = "var(--green)";

  inputStatus.textContent = state.started ? `${state.typed.length}/${state.currentText.length}` : "";
}

function updateTimerRing() {
  const pct = state.timeLeft / state.totalTime;
  const offset = RING_CIRC * (1 - pct);
  timerRing.style.strokeDashoffset = offset;
  if (pct < 0.25) timerRing.style.stroke = "var(--red)";
  else if (pct < 0.5) timerRing.style.stroke = "var(--amber)";
  else timerRing.style.stroke = "var(--primary)";
}

function startTimer() {
  if (state.started) return;
  state.started = true;
  quoteHint.classList.add("hidden");
  quoteBox.classList.add("active");

  state.wpmSnapshotTimer = setInterval(() => {
    const elapsed = state.totalTime - state.timeLeft;
    if (elapsed > 0) {
      const wpm = Math.round((state.correctChars / 5) / (elapsed / 60));
      state.wpmHistory.push(wpm);
    }
  }, 1000);

  state.timer = setInterval(() => {
    state.timeLeft--;
    timeDisplay.textContent = state.timeLeft;
    updateTimerRing();
    if (state.timeLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  clearInterval(state.timer);
  clearInterval(state.wpmSnapshotTimer);
  state.finished  = true;
  inputArea.disabled = true;

  const elapsed  = state.totalTime - state.timeLeft;
  const minutes  = elapsed > 0 ? elapsed / 60 : 1;
  const finalWpm = Math.round((state.correctChars / 5) / minutes);
  const finalAcc = state.totalTyped > 0 ? Math.round((state.correctChars / state.totalTyped) * 100) : 100;

  document.getElementById("r-wpm").textContent    = finalWpm;
  document.getElementById("r-acc").textContent    = finalAcc + "%";
  document.getElementById("r-streak").textContent = state.bestStreak;
  document.getElementById("r-time").textContent   = (state.totalTime - state.timeLeft) + "s";

  let badge, title;
  if (finalWpm >= 100)     { badge = "🚀"; title = "Blazing Fast!"; }
  else if (finalWpm >= 80) { badge = "🏆"; title = "Typing Pro!"; }
  else if (finalWpm >= 60) { badge = "⚡"; title = "Great Speed!"; }
  else if (finalWpm >= 40) { badge = "💪"; title = "Keep it up!"; }
  else if (finalWpm >= 20) { badge = "🌱"; title = "Good Start!"; }
  else                     { badge = "🎯"; title = "Practice Daily!"; }

  document.getElementById("result-badge").textContent = badge;
  document.getElementById("result-title").textContent = title;

  drawWpmChart();
  saveHighScore(finalWpm);

  resultOverlay.classList.add("open");
}

function drawWpmChart() {
  const canvas  = document.getElementById("wpm-chart");
  const ctx     = canvas.getContext("2d");
  const W       = canvas.offsetWidth || 400;
  const H       = 60;
  canvas.width  = W;
  canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const data = state.wpmHistory.length > 1 ? state.wpmHistory : [0, 0];
  const max  = Math.max(...data, 1);
  const step = W / (data.length - 1);

  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, "#6c63ff");
  grad.addColorStop(1, "#2affa3");

  ctx.beginPath();
  ctx.moveTo(0, H - (data[0] / max) * (H - 6));
  data.forEach((v, i) => {
    ctx.lineTo(i * step, H - (v / max) * (H - 6));
  });
  ctx.strokeStyle = grad;
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = "round";
  ctx.lineCap     = "round";
  ctx.stroke();

  ctx.lineTo((data.length - 1) * step, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, 0, 0, H);
  fill.addColorStop(0, "rgba(108,99,255,0.25)");
  fill.addColorStop(1, "rgba(42,255,163,0.0)");
  ctx.fillStyle = fill;
  ctx.fill();
}

function saveHighScore(wpm) {
  const key  = "kf_best_" + state.totalTime;
  const best = parseInt(localStorage.getItem(key)) || 0;
  if (wpm > best) {
    localStorage.setItem(key, wpm);
    document.getElementById("result-hs-msg").textContent = "🎉 New personal best for " + state.totalTime + "s!";
    loadHighScore();
  } else {
    document.getElementById("result-hs-msg").textContent = "Your best: " + best + " WPM";
  }
}

function loadHighScore() {
  const key  = "kf_best_" + state.totalTime;
  const best = localStorage.getItem(key);
  if (best) {
    hsBadge.textContent = "🏅 PB: " + best + " WPM";
    hsBadge.classList.add("visible");
  } else {
    hsBadge.classList.remove("visible");
  }
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function shareResult() {
  const wpm = document.getElementById("r-wpm").textContent;
  const acc = document.getElementById("r-acc").textContent;
  const text = `⌨️ I just scored ${wpm} WPM with ${acc} accuracy on KEYFLOW! Can you beat me?\nhttps://github.com/`;
  navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard!"));
}

function resetGame(loadNew = false) {
  clearInterval(state.timer);
  clearInterval(state.wpmSnapshotTimer);

  Object.assign(state, {
    typed: "", timeLeft: state.totalTime, timer: null,
    started: false, finished: false,
    correctChars: 0, totalTyped: 0,
    currentStreak: 0, bestStreak: 0,
    errorCount: 0, wpmHistory: [],
    wpmSnapshotTimer: null,
  });

  if (loadNew) state.currentText = pickText();

  wpmDisplay.textContent    = "0";
  accDisplay.textContent    = "100";
  accDisplay.style.color    = "";
  timeDisplay.textContent   = state.totalTime;
  streakDisplay.textContent = "0";
  errDisplay.textContent    = "0";
  progressBar.style.width   = "0%";
  progressLabel.textContent = "0%";
  inputStatus.textContent   = "";

  ["wpm-bar","acc-bar","streak-bar","err-bar"].forEach(id => {
    document.getElementById(id).style.width = "0%";
  });

  timerRing.style.strokeDashoffset = 0;
  timerRing.style.stroke = "var(--primary)";

  resultOverlay.classList.remove("open");
  inputArea.value    = "";
  inputArea.disabled = false;
  quoteHint.classList.remove("hidden");
  quoteBox.classList.remove("active");

  renderQuote();
  loadHighScore();
  inputArea.focus();
}

inputArea.addEventListener("input", () => {
  if (state.finished) return;
  startTimer();

  state.typed      = inputArea.value;
  state.totalTyped = state.typed.length;
  state.correctChars  = 0;
  state.currentStreak = 0;

  [...state.typed].forEach((char, i) => {
    if (char === state.currentText[i]) {
      state.correctChars++;
      state.currentStreak++;
      if (state.currentStreak > state.bestStreak) state.bestStreak = state.currentStreak;
    } else {
      state.currentStreak = 0;
    }
  });

  updateDisplay();
  if (state.typed.length >= state.currentText.length) endGame();
});

inputArea.addEventListener("keydown", (e) => {
  if (e.key === "Tab")    { e.preventDefault(); resetGame(true); }
  if (e.key === "Escape") { resetGame(false); }
});

document.querySelectorAll(".mode-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.totalTime = parseInt(btn.dataset.time);
    resetGame(false);
  });
});

document.getElementById("restart-btn").addEventListener("click", () => resetGame(false));
document.getElementById("new-btn").addEventListener("click",     () => resetGame(true));
document.getElementById("share-btn").addEventListener("click",   shareResult);
diffSelect.addEventListener("change", () => resetGame(true));

(function initCanvas() {
  const canvas = document.getElementById("bg-canvas");
  const ctx    = canvas.getContext("2d");
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function spawnParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.3,
      dx: (Math.random() - 0.5) * 0.25,
      dy: -Math.random() * 0.4 - 0.1,
      o: Math.random() * 0.5 + 0.15,
    };
  }

  resize();
  for (let i = 0; i < 80; i++) particles.push(spawnParticle());
  window.addEventListener("resize", resize);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p, i) => {
      p.x += p.dx;
      p.y += p.dy;
      if (p.y < -4) particles[i] = { ...spawnParticle(), y: H + 4 };
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(108,99,255,${p.o})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

state.currentText = pickText();
renderQuote();
loadHighScore();
inputArea.focus();
