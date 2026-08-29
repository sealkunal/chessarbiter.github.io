# Chess Arbiter – Study & Mock Exam Portal

A free, fully static website for studying the FIDE Arbiter's Manual and practising with mock exams. No backend or database required — all data is stored in JSON files and served directly from the hosting platform.

## 🌐 Live Hosting (Free)

**Recommended: [Netlify](https://netlify.com)** (free tier)

1. Push this entire folder to a GitHub repository
2. Log in to Netlify → **Add new site → Import from Git**
3. Select your GitHub repo — leave all build settings blank (no build command needed)
4. Click **Deploy site**

Your site will be live at `https://your-site-name.netlify.app` within seconds.

**Alternative: [GitHub Pages](https://pages.github.com)**

1. Push to GitHub in a repo named `your-username.github.io` (or any repo with Pages enabled)
2. Go to repo Settings → Pages → Source: Deploy from branch (main)
3. Site is live at `https://your-username.github.io`

---

## 📁 Project Structure

```
fide-arbiter-website/
├── index.html              ← Homepage; chapter grid with study progress badges
├── manual.html             ← Chapter reader (sidebar nav, ?chapter=N deep links)
├── exam.html               ← Exam selector + question engine with live timer
├── results.html            ← Exam results: score, pass/fail, per-question explanations
├── search.html             ← Full-text search across all 12 chapters
├── feedback.html           ← Feedback form (Netlify Forms)
│
├── css/
│   └── style.css           ← Global responsive stylesheet
│
├── js/
│   ├── app.js              ← Shared utilities + localStorage progress tracker
│   ├── exam.js             ← Exam engine (live timer, shuffle, submit)
│   ├── chapters.js         ← Legacy chapter viewer (kept for reference)
│   └── search.js           ← Legacy search logic (kept for reference)
│
├── start-server.py         ← Python local HTTP server (port 8080)
├── Start Website.bat       ← Double-click to start server and open browser
│
└── data/
    ├── index.json          ← Master index: 12 chapters, full exam reference
    ├── Arbiters_Manual_2025.pdf  ← Source PDF (available for download)
    │
    ├── chapters/
    │   ├── chapter-01.json ← Role of Arbiters & Duties (verbatim from PDF)
    │   ├── chapter-02.json ← FIDE Laws of Chess E01 (verbatim)
    │   ├── chapter-03.json ← Anti-Cheating Regulations A09
    │   ├── chapter-04.json ← Types of Tournaments
    │   ├── chapter-05.json ← Swiss Rules C04
    │   ├── chapter-06.json ← Rating Regulations B02
    │   ├── chapter-07.json ← Title Regulations B01
    │   ├── chapter-08.json ← Technical Recommendations C01/C02
    │   ├── chapter-09.json ← Competition Regulations C05–C07
    │   ├── chapter-10.json ← Arbiter Regulations B06
    │   ├── chapter-11.json ← Online Chess Regulations E04
    │   └── chapter-12.json ← Sample Exam Questions
    │
    └── exams/
        ├── exam-chapter-01.json  ← 10 questions — Chapter 1
        ├── exam-chapter-02.json  ← 10 questions — Chapter 2
        ├── exam-chapter-03.json  ← 10 questions — Chapter 3
        ├── exam-chapter-04.json  ← 10 questions — Chapter 4
        ├── exam-chapter-05.json  ← 10 questions — Chapter 5
        ├── exam-chapter-06.json  ← 10 questions — Chapter 6
        ├── exam-chapter-07.json  ← 10 questions — Chapter 7
        ├── exam-chapter-08.json  ← 10 questions — Chapter 8
        ├── exam-chapter-09.json  ← 10 questions — Chapter 9
        ├── exam-chapter-10.json  ← 10 questions — Chapter 10
        ├── exam-chapter-11.json  ← 10 questions — Chapter 11
        ├── exam-chapter-12.json  ← 10 questions — Chapter 12
        └── exam-full.json        ← 25 questions — All chapters combined
```

---

## ✨ Features

| Feature | Details |
|---|---|
| Chapter-wise manual | 12 chapters, all articles, sidebar navigation |
| Deep-link reading | `manual.html?chapter=5` opens Chapter 5 directly |
| Article anchors | `manual.html?chapter=5#art-C04-1` from search results |
| Mock exams (120 Qs) | 10 questions per chapter × 12 chapters |
| Full mock exam | 25 questions across all 12 chapters |
| Live exam timer | Stopwatch displayed during exam |
| Shuffled questions | Fisher-Yates shuffle on every attempt |
| Results + explanations | Score, pass/fail, per-question breakdown |
| Study progress tracker | localStorage — badges on chapter cards, stats panel |
| Full-text search | Number-aware multi-word search, no external libraries |
| Feedback form | Netlify Forms — zero configuration needed |
| Mobile responsive | CSS Grid + media queries |

---

## 🔧 Local Development

Run via a local HTTP server to avoid `fetch()` CORS restrictions:

```bash
# Python (built-in, easiest)
python -m http.server 8080
# Then open http://localhost:8080

# Or use the included helper scripts:
python start-server.py        # Python
Start Website.bat             # Windows — starts server and opens browser
```

**Do NOT open HTML files directly** (via `file://`) — `fetch()` is blocked by browser security.

---

## ➕ Adding More Questions

Edit any file in `data/exams/`. Each question uses this schema:

```json
{
  "id": "unique-id",
  "text": "Question text?",
  "difficulty": "easy | medium | hard",
  "article": "12.2",
  "options": [
    { "id": "a", "text": "Option A" },
    { "id": "b", "text": "Option B" },
    { "id": "c", "text": "Option C" },
    { "id": "d", "text": "Option D" }
  ],
  "correct": "b",
  "explanation": "Explanation shown after exam submission."
}
```

Push to GitHub → Netlify auto-deploys in seconds.

---

## 📋 Netlify Forms Setup

The feedback form works automatically on Netlify with zero configuration.

To receive email notifications:
1. Netlify dashboard → **Forms** → click the `feedback` form
2. **Settings** → **Form notifications** → Add email notification

---

## 📄 Disclaimer

This is an unofficial educational resource. Content is based on publicly available FIDE Laws of Chess and the Arbiter's Manual 2025. Always refer to the official [FIDE Handbook](https://www.fide.com/fide/handbook.html) for authoritative rules.
