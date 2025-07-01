// --- State ---
let session = {
  duration: 0, // ms
  remaining: 0, // ms
  timer: null,
  fadeTimeout: null,
  fadeInterval: null,
  started: false,
  ended: false,
  fadeDelay: 1000, // ms before fading starts
  fadeDuration: 2500, // ms for fade out
  writingArea: null,
  progressBar: null,
  downloadBtn: null,
  newSessionBtn: null,
  startBtn: null,
  timerBtns: [],
  selectedMinutes: 0,
  lastContent: '',
  pausedBecauseEmpty: false,
  copyBtn: null,
};

// --- DOM ---
function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

function setTimerSelection(mins) {
  session.selectedMinutes = mins;
  session.timerBtns.forEach(btn => btn.classList.remove('selected'));
  session.timerBtns.find(btn => btn.dataset.minutes == mins).classList.add('selected');
  session.startBtn.classList.add('active');
}

function resetUI() {
  session.writingArea.innerHTML = '';
  session.writingArea.contentEditable = true;
  session.writingArea.classList.remove('fading');
  session.downloadBtn.style.display = 'none';
  session.newSessionBtn.style.display = 'none';
  session.progressBar.style.width = '100%';
  session.progressBar.style.background = 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)';
  session.ended = false;
  session.started = false;
  session.lastContent = '';
  session.selectedMinutes = 0;
  session.pausedBecauseEmpty = false;
  session.timerBtns.forEach(btn => btn.classList.remove('selected'));
  session.startBtn.classList.remove('active');
  session.startBtn.textContent = 'Start';
  session.copyBtn.style.display = 'none';
}

function startSession() {
  if (!session.selectedMinutes) return;
  session.duration = session.selectedMinutes * 60 * 1000;
  session.remaining = session.duration;
  session.started = true;
  session.ended = false;
  session.pausedBecauseEmpty = false;
  session.writingArea.innerHTML = '';
  session.writingArea.contentEditable = true;
  session.writingArea.focus();
  session.downloadBtn.style.display = 'none';
  session.newSessionBtn.style.display = 'none';
  session.progressBar.style.width = '100%';
  session.progressBar.style.background = 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)';
  clearTimeout(session.fadeTimeout);
  clearInterval(session.fadeInterval);
  if (session.timer) clearInterval(session.timer);
  session.timer = setInterval(tick, 100);
  resetFadeTimer();
  session.startBtn.textContent = 'Restart';
}

function endSession() {
  session.ended = true;
  session.started = false;
  clearInterval(session.timer);
  clearTimeout(session.fadeTimeout);
  clearInterval(session.fadeInterval);
  session.writingArea.classList.remove('fading');
  session.writingArea.contentEditable = false;
  session.downloadBtn.style.display = 'inline-block';
  session.newSessionBtn.style.display = 'inline-block';
  session.progressBar.style.width = '0%';
  session.copyBtn.style.display = 'inline-block';
}

function tick() {
  session.remaining -= 100;
  if (session.remaining < 0) session.remaining = 0;
  updateProgressBar();
  if (session.remaining === 0) {
    endSession();
  }
}

function updateProgressBar() {
  const percent = session.remaining / session.duration;
  session.progressBar.style.width = (percent * 100) + '%';
  // Optional: change color as time runs low
  if (percent < 0.15) {
    session.progressBar.style.background = 'linear-gradient(90deg, #ff5858 0%, #f09819 100%)';
  } else if (percent < 0.4) {
    session.progressBar.style.background = 'linear-gradient(90deg, #f09819 0%, #ff5858 100%)';
  } else {
    session.progressBar.style.background = 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)';
  }
}

function resetFadeTimer() {
  clearTimeout(session.fadeTimeout);
  clearInterval(session.fadeInterval);
  session.writingArea.classList.remove('fading');
  session.fadeTimeout = setTimeout(() => {
    if (!session.started || session.ended) return;
    fadeOutText();
  }, session.fadeDelay);
}

function fadeOutText() {
  session.writingArea.classList.add('fading');
  // After fadeDuration, remove all text
  session.fadeInterval = setTimeout(() => {
    if (!session.started || session.ended) return;
    session.writingArea.innerHTML = '';
    session.writingArea.classList.remove('fading');
    // PAUSE the timer when text disappears
    if (session.timer) {
      clearInterval(session.timer);
      session.timer = null;
    }
    session.pausedBecauseEmpty = true;
  }, session.fadeDuration);
}

function handleInput(e) {
  if (!session.started || session.ended) return;
  // If writing area was empty and now has text, resume timer
  if (session.pausedBecauseEmpty && session.writingArea.innerText.trim().length > 0) {
    if (!session.timer) {
      session.timer = setInterval(tick, 100);
    }
    session.pausedBecauseEmpty = false;
    resetFadeTimer();
    return;
  }
  resetFadeTimer();
}

function handleKeydown(e) {
  if (!session.started || session.ended) return;
  // If writing area was empty and now has text, resume timer
  if (session.pausedBecauseEmpty && session.writingArea.innerText.trim().length > 0) {
    if (!session.timer) {
      session.timer = setInterval(tick, 100);
    }
    session.pausedBecauseEmpty = false;
    resetFadeTimer();
    return;
  }
  resetFadeTimer();
}

function handlePaste(e) {
  // Prevent pasting during session
  if (session.started && !session.ended) {
    e.preventDefault();
  }
}

function downloadMarkdown() {
  const text = session.writingArea.innerText;
  const md = text;
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const filename = `writing-session-${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}.md`;
  const blob = new Blob([md], {type: 'text/markdown'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function newSession() {
  resetUI();
}

function copyToClipboard() {
  const text = session.writingArea.innerText;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    // fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  session.writingArea = $('#writing-area');
  session.progressBar = $('#progress-bar');
  session.downloadBtn = $('#download-btn');
  session.newSessionBtn = $('#new-session-btn');
  session.startBtn = $('#start-btn');
  session.timerBtns = $all('.timer-btn');
  session.copyBtn = $('#copy-btn');

  session.timerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setTimerSelection(Number(btn.dataset.minutes));
    });
  });

  session.startBtn.addEventListener('click', () => {
    if (session.selectedMinutes) {
      startSession();
    }
  });

  session.writingArea.addEventListener('input', handleInput);
  session.writingArea.addEventListener('keydown', handleKeydown);
  session.writingArea.addEventListener('paste', handlePaste);

  session.downloadBtn.addEventListener('click', downloadMarkdown);
  session.newSessionBtn.addEventListener('click', newSession);
  session.copyBtn.addEventListener('click', copyToClipboard);

  resetUI();
}); 
