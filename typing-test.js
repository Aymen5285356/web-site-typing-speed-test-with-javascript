const texts = {
  easy: [
    "the cat sat on the mat and looked at the dog",
    "she sells sea shells by the sea shore every day",
    "a big red fox ran fast over the old brown log",
  ],
  medium: [
    "JavaScript is a lightweight programming language with first class functions.",
    "Learning to code is one of the best investments you can make in your future.",
    "Practice makes perfect and consistency is the key to mastering any new skill.",
  ],
  hard: [
    "Asynchronous programming with promises and async-await enables non-blocking execution.",
    "Object-oriented programming encapsulates data and behavior into reusable structures.",
    "The Document Object Model provides a structured representation of HTML for manipulation.",
  ],
  darija: [
    "zwina bzzaf had lvida dyal javascript",
    "khassk t9ra mezyan bach t9der tkhdem mzyan",
    "coding machi sa3ba ila kan 3andek sabr",
  ]
};

const state = {
  currentText: "",
  typed: "",
  timeLeft: 60,
  timer: null,
  started: false,
  finished: false,
  correctChars: 0,
  totalTyped: 0,
  currentStreak: 0,
  bestStreak: 0,
};

const quoteBox     = document.getElementById("quote-box");
const inputArea    = document.getElementById("input-area");
const wpmDisplay   = document.getElementById("wpm");
const accDisplay   = document.getElementById("accuracy");
const timeDisplay  = document.getElementById("time");
const streakDisplay = document.getElementById("streak");
const progressBar  = document.getElementById("progress-bar");
const resultBox    = document.getElementById("result");
const diffSelect   = document.getElementById("difficulty");

function pickText() {
  const pool = texts[diffSelect.value];
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderQuote() {
  quoteBox.innerHTML = "";
  [...state.currentText].forEach((char, index) => {
    const span = document.createElement("span");
    span.textContent = char;
    span.className = "char";
    if (index === 0) span.classList.add("cursor");
    quoteBox.appendChild(span);
  });
}

function updateDisplay() {
  const chars = quoteBox.querySelectorAll(".char");
  [...state.currentText].forEach((char, index) => {
    const span = chars[index];
    span.className = "char";
    if (index < state.typed.length) {
      span.classList.add(state.typed[index] === char ? "correct" : "wrong");
    } else if (index === state.typed.length) {
      span.classList.add("cursor");
    }
  });

  const elapsed = 60 - state.timeLeft;
  const wpm = elapsed > 0 ? Math.round((state.correctChars / 5) / (elapsed / 60)) : 0;
  const accuracy = state.totalTyped > 0 ? Math.round((state.correctChars / state.totalTyped) * 100) : 100;
  const progress = Math.round((state.typed.length / state.currentText.length) * 100);

  wpmDisplay.textContent    = wpm;
  accDisplay.textContent    = accuracy + "%";
  streakDisplay.textContent = state.bestStreak;
  progressBar.style.width   = progress + "%";
}

function startTimer() {
  if (state.started) return;
  state.started = true;
  state.timer = setInterval(() => {
    state.timeLeft--;
    timeDisplay.textContent = state.timeLeft;
    if (state.timeLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  clearInterval(state.timer);
  state.finished = true;
  inputArea.disabled = true;

  const elapsed = 60 - state.timeLeft;
  const minutes = elapsed > 0 ? elapsed / 60 : 1;
  const finalWpm = Math.round((state.correctChars / 5) / minutes);
  const finalAcc = state.totalTyped > 0 ? Math.round((state.correctChars / state.totalTyped) * 100) : 100;

  let message;
  if (finalWpm >= 80)      message = "You type like a pro!";
  else if (finalWpm >= 50) message = "Great job! Keep practising.";
  else if (finalWpm >= 30) message = "Good start — keep going!";
  else                     message = "Don't give up, practice daily!";

  resultBox.style.display = "block";
  resultBox.innerHTML = `
    <h2>${message}</h2>
    <p>${finalWpm} WPM · ${finalAcc}% accuracy · ${state.bestStreak} best streak</p>
    <button class="btn" onclick="resetGame(false)">Play again</button>
  `;

  saveHighScore(finalWpm);
}

function saveHighScore(wpm) {
  const best = localStorage.getItem("typingBestWpm") || 0;
  if (wpm > best) {
    localStorage.setItem("typingBestWpm", wpm);
    document.getElementById("high-score").textContent = "New record: " + wpm + " WPM!";
  } else {
    document.getElementById("high-score").textContent = "Your best: " + best + " WPM";
  }
}

function loadHighScore() {
  const best = localStorage.getItem("typingBestWpm");
  if (best) document.getElementById("high-score").textContent = "Your best: " + best + " WPM";
}

function shareResult() {
  const text = `I just scored ${wpmDisplay.textContent} WPM with ${accDisplay.textContent} accuracy! Can you beat me? 🔥`;
  navigator.clipboard.writeText(text).then(() => alert("Copied! Paste it on WhatsApp."));
}

function resetGame(loadNew = false) {
  clearInterval(state.timer);
  Object.assign(state, {
    typed: "", timeLeft: 60, timer: null,
    started: false, finished: false,
    correctChars: 0, totalTyped: 0,
    currentStreak: 0, bestStreak: 0,
  });
  if (loadNew) state.currentText = pickText();

  wpmDisplay.textContent    = "0";
  accDisplay.textContent    = "100%";
  timeDisplay.textContent   = "60";
  streakDisplay.textContent = "0";
  progressBar.style.width   = "0%";
  resultBox.style.display   = "none";
  inputArea.value           = "";
  inputArea.disabled        = false;

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

  [...state.typed].forEach((char, index) => {
    if (char === state.currentText[index]) {
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

document.getElementById("restart-btn").addEventListener("click", () => resetGame(false));
document.getElementById("new-btn").addEventListener("click",     () => resetGame(true));
document.getElementById("share-btn").addEventListener("click",   shareResult);
diffSelect.addEventListener("change", () => resetGame(true));

state.currentText = pickText();
renderQuote();
loadHighScore();
inputArea.focus();
