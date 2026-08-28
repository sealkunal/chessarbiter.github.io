# FIDE Arbiter's Manual – Study & Mock Exam Portal

A free, fully static website for studying the FIDE Arbiter's Manual and practicing with mock exams. No backend server or database required — all data is stored in JSON files and served directly from the host.

## 🌐 Live Hosting

**Recommended: [Netlify](https://netlify.com)** (free tier)

1. Push this repository to GitHub
2. Log in to Netlify → **Add new site → Import from Git**
3. Select your GitHub repo — leave all build settings blank
4. Click **Deploy site**

Your site will be live at `https://your-site-name.netlify.app` within seconds.

---

## 📁 Project Structure

```
fide-arbiter-website/
├── index.html              ← Homepage
├── chapters.html           ← Chapter viewer (manual)
├── exam.html               ← Mock exam page
├── results.html            ← Exam results with explanations
├── search.html             ← Full-text search
├── feedback.html           ← Feedback form (Netlify Forms)
│
├── css/
│   └── style.css           ← All styles
│
├── js/
│   ├── app.js              ← Shared utilities
│   ├── chapters.js         ← Chapter viewer logic
│   ├── exam.js             ← Exam engine
│   └── search.js           ← Lunr.js search
│
└── data/
    ├── index.json          ← Master chapter/exam index
    ├── chapters/
    │   ├── chapter-01.json ← Laws of Chess
    │   ├── chapter-02.json ← Conduct of Players
    │   └── chapter-03.json ← Role of the Arbiter
    └── exams/
        ├── exam-chapter-01.json
        ├── exam-chapter-02.json
        ├── exam-chapter-03.json
        └── exam-full.json  ← Combined exam
```

---

## ✨ Features

| Feature | Implementation |
|---|---|
| Chapter-wise manual | `data/chapters/*.json` → rendered by `chapters.js` |
| Mock exams | `data/exams/*.json` → loaded at runtime by `exam.js` |
| Random question order | Fisher-Yates shuffle on every exam attempt |
| Results with explanations | Each question has an `explanation` field |
| Pass/fail scoring | 75% pass mark, score shown as percentage |
| Full-text search | [Lunr.js](https://lunrjs.com) — no backend needed |
| Feedback form | Netlify Forms — submissions appear in Netlify dashboard |
| Mobile responsive | CSS Grid + media queries |

---

## ➕ Adding More Questions

Edit any file in `data/exams/`. Each question follows this schema:

```json
{
  "id": "unique-id",
  "text": "Question text here?",
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

Push the updated JSON file to GitHub — Netlify will auto-deploy within seconds.

---

## ➕ Adding More Chapters

1. Create `data/chapters/chapter-04.json` following the same schema as existing chapters
2. Create `data/exams/exam-chapter-04.json` with questions
3. Add an entry to `data/index.json` under the `chapters` array:

```json
{
  "id": 4,
  "title": "Chapter Title",
  "description": "Short description",
  "file": "data/chapters/chapter-04.json",
  "exam": "data/exams/exam-chapter-04.json"
}
```

No code changes needed — the site builds itself from `index.json`.

---

## 🔧 Local Development

Open `index.html` directly in a browser **or** run a local server to avoid CORS issues with `fetch()`:

```bash
# Python (easiest)
python -m http.server 8080

# Node.js
npx serve .
```

Then open `http://localhost:8080`.

---

## 📋 Netlify Forms Setup

The feedback form works automatically on Netlify with zero configuration.  
To receive email notifications:

1. Go to your Netlify site dashboard
2. **Forms** → click the `feedback` form
3. **Settings** → **Form notifications** → Add email notification

---

## 📄 Disclaimer

This is an unofficial educational resource. Content is based on publicly available FIDE Laws of Chess and Arbiter's Manual. Always refer to the official [FIDE Handbook](https://www.fide.com/fide/handbook.html) for authoritative rules.
