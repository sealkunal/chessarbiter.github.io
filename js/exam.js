/**
 * exam.js — Mock exam engine
 * Reads questions from a JSON file, conducts the exam, and redirects to results.
 */

'use strict';

// ─── DOM refs ────────────────────────────────────────────────────────────────
// Resolved lazily inside init() so app.js is guaranteed to have run first.
let examWrap  = null;
let examTitle = null;

// ─── State ───────────────────────────────────────────────────────────────────
let questions  = [];
let current    = 0;
let answers    = {};   // { questionId: chosenOptionId }
let startTime  = null;
let timerInterval = null;

// ─── Timer helpers ────────────────────────────────────────────────────────────
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startTimer() {
  timerInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const el = document.getElementById('exam-timer');
    if (el) el.textContent = formatTime(elapsed);
  }, 1000);
}

// ─── Boot ────────────────────────────────────────────────────────────────────
async function init() {
  // Resolve helpers and DOM refs here — after app.js has definitely run
  const { fetchJSON, shuffle, showLoading, saveExamState, escHtml } = window.FideApp;
  examWrap  = document.getElementById('exam-wrap');
  examTitle = document.getElementById('exam-title');

  const params = new URLSearchParams(location.search);
  const file   = params.get('file');

  // No file param means the selector is being shown — do not start an exam
  if (!file) return;

  const title = params.get('title') || 'Mock Exam';
  const maxQ  = parseInt(params.get('max') || '0', 10);  // 0 = all

  showLoading(examWrap, 'Loading exam…');

  const examData = await fetchJSON(file);
  examTitle.textContent = examData.title || title;

  // Shuffle and optionally limit
  questions = shuffle(examData.questions);
  if (maxQ > 0) questions = questions.slice(0, maxQ);

  startTime = Date.now();
  startTimer();
  renderQuestion();
}

// ─── Render current question ─────────────────────────────────────────────────
function renderQuestion() {
  const { escHtml } = window.FideApp;
  const q   = questions[current];
  const num = current + 1;
  const pct = Math.round((num / questions.length) * 100);

  examWrap.innerHTML = `
    <div class="exam-header">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <h2 id="exam-title" style="flex:1;">${escHtml(examTitle.textContent)}</h2>
        <div style="font-size:.85rem;font-weight:600;background:rgba(255,255,255,.15);
                    padding:4px 12px;border-radius:20px;white-space:nowrap;">
          ⏱ <span id="exam-timer">00:00</span>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:.82rem;opacity:.85;margin-top:8px;">
        <span>Question ${num} of ${questions.length}</span>
        <span>${pct}% complete</span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:${pct}%"></div>
      </div>
    </div>

    <div class="question-block">
      <div class="question-count">
        <span class="badge badge-${q.difficulty}">${q.difficulty}</span>
        &nbsp; Article ${escHtml(q.article)}
      </div>
      <div class="question-text">${escHtml(q.text)}</div>

      <ul class="options-list">
        ${q.options.map(opt => `
          <li class="option-item">
            <input type="radio" name="option" id="opt-${opt.id}" value="${opt.id}"
              ${answers[q.id] === opt.id ? 'checked' : ''}>
            <label class="option-label" for="opt-${opt.id}">
              <span class="option-key">${opt.id}</span>
              ${escHtml(opt.text)}
            </label>
          </li>
        `).join('')}
      </ul>

      <div class="exam-nav">
        <button class="btn btn-secondary" id="btn-prev" ${current === 0 ? 'disabled' : ''}>
          ← Previous
        </button>
        <span style="font-size:.85rem;color:var(--muted)">
          ${Object.keys(answers).length} of ${questions.length} answered
        </span>
        ${current < questions.length - 1
          ? `<button class="btn btn-primary" id="btn-next">Next →</button>`
          : `<button class="btn btn-success" id="btn-submit">Submit Exam</button>`
        }
      </div>
    </div>`;

  // Wire radio buttons — save answer immediately on change
  examWrap.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      answers[q.id] = radio.value;
    });
  });

  document.getElementById('btn-prev')?.addEventListener('click', () => { current--; renderQuestion(); });
  document.getElementById('btn-next')?.addEventListener('click', () => {
    saveCurrentAnswer();
    current++;
    renderQuestion();
  });
  document.getElementById('btn-submit')?.addEventListener('click', () => {
    saveCurrentAnswer();
    submitExam();
  });
}

// ─── Save current radio selection ────────────────────────────────────────────
function saveCurrentAnswer() {
  const checked = examWrap.querySelector('input[type="radio"]:checked');
  if (checked) answers[questions[current].id] = checked.value;
}

// ─── Submit & redirect to results ────────────────────────────────────────────
function submitExam() {
  const { saveExamState } = window.FideApp;
  clearInterval(timerInterval);
  const timeTaken = Math.round((Date.now() - startTime) / 1000);
  // Build an examKey from the file path for progress tracking (e.g. "exam-chapter-03")
  const params  = new URLSearchParams(location.search);
  const fileStr = params.get('file') || '';
  const examKey = fileStr.replace(/^.*\//, '').replace(/\.json$/, '');
  const resultData = {
    title:     examTitle.textContent,
    questions: questions,
    answers:   answers,
    timeTaken: timeTaken,
    examKey:   examKey
  };
  saveExamState('examResult', resultData);
  location.href = 'results.html';
}

// ─── Start ───────────────────────────────────────────────────────────────────
init().catch(err => {
  const wrap = document.getElementById('exam-wrap');
  if (wrap) wrap.innerHTML = `<p style="color:var(--danger);padding:24px">Error: ${err.message}</p>`;
});
