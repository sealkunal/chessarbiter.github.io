/**
 * search.js — Dual-mode search:
 *   Mode A: PDF full-text search  — extracts text from Arbiters_Manual_2025.pdf via PDF.js
 *   Mode B: JSON article search   — indexes chapter JSON files via lunr.js
 */

'use strict';

const { fetchJSON, showLoading, escHtml } = window.FideApp;

// ─── DOM refs ────────────────────────────────────────────────────────────────
const searchInput   = document.getElementById('search-input');
const searchBtn     = document.getElementById('search-btn');
const resultsWrap   = document.getElementById('search-results');
const chapterFilter = document.getElementById('chapter-filter');
const tabPdf        = document.getElementById('tab-pdf');
const tabJson       = document.getElementById('tab-json');
const filterRow     = document.getElementById('filter-row');

// ─── State ───────────────────────────────────────────────────────────────────
const PDF_PATH  = 'data/Arbiters_Manual_2025.pdf';
let   mode      = 'pdf';          // 'pdf' | 'json'

// PDF mode state
let pdfPages    = [];             // [{ page: N, text: string }]
let pdfLunr     = null;
let pdfReady    = false;
let pdfLoading  = false;

// JSON mode state
let jsonLunr    = null;
let docStore    = {};
let jsonReady   = false;

// ─── Tab switching ────────────────────────────────────────────────────────────
function setMode(m) {
  mode = m;
  tabPdf.classList.toggle('tab-active',  m === 'pdf');
  tabJson.classList.toggle('tab-active', m === 'json');
  filterRow.style.display = m === 'json' ? 'flex' : 'none';

  if (m === 'pdf' && !pdfReady && !pdfLoading) {
    buildPdfIndex();
  } else if (m === 'json' && !jsonReady) {
    buildJsonIndex();
  } else {
    resultsWrap.innerHTML = `<p class="no-results" style="color:var(--muted)">
      Index ready — enter a term above and press Search.
    </p>`;
  }
}

tabPdf.addEventListener('click',  () => setMode('pdf'));
tabJson.addEventListener('click', () => setMode('json'));

// ─── PDF Index ───────────────────────────────────────────────────────────────
async function buildPdfIndex() {
  pdfLoading = true;
  showLoading(resultsWrap, 'Loading PDF and building search index… this may take a moment.');

  try {
    // PDF.js is loaded globally as pdfjsLib from CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const loadingTask = pdfjsLib.getDocument(PDF_PATH);
    const pdf         = await loadingTask.promise;
    const numPages    = pdf.numPages;

    pdfPages = [];

    // Extract text from every page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page    = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const text    = content.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
      if (text.length > 10) {           // skip blank / image-only pages
        pdfPages.push({ id: `p${pageNum}`, page: pageNum, text });
      }
    }

    // Build lunr index over pages
    pdfLunr = lunr(function () {
      this.ref('id');
      this.field('text');
      pdfPages.forEach(p => this.add(p));
    });

    pdfReady  = true;
    pdfLoading = false;

    resultsWrap.innerHTML = `<p class="no-results" style="color:var(--muted)">
      PDF indexed (${numPages} pages) — enter a term above and press Search.
    </p>`;
  } catch (err) {
    pdfLoading = false;
    resultsWrap.innerHTML = `
      <div class="no-results">
        <p style="color:var(--danger)">Could not load PDF: <strong>${escHtml(err.message)}</strong></p>
        <p style="font-size:.85rem;margin-top:8px;color:var(--muted)">
          Make sure <code>data/Arbiters_Manual_2025.pdf</code> is present and you are running
          the site via a local server (not <code>file://</code>).
        </p>
      </div>`;
  }
}

// ─── JSON Index ───────────────────────────────────────────────────────────────
async function buildJsonIndex() {
  showLoading(resultsWrap, 'Building article index…');
  try {
    const index       = await fetchJSON('data/index.json');
    const allChapters = await Promise.all(index.chapters.map(ch => fetchJSON(ch.file)));

    // Populate chapter filter dropdown
    chapterFilter.innerHTML =
      `<option value="">All Chapters</option>` +
      index.chapters.map(ch =>
        `<option value="${ch.id}">Chapter ${ch.id}: ${escHtml(ch.title)}</option>`
      ).join('');

    docStore = {};
    allChapters.forEach(chapter => {
      chapter.articles.forEach(art => {
        const id = `${chapter.chapter}-${art.article}`;
        docStore[id] = {
          id,
          chapterNum:   chapter.chapter,
          chapterTitle: chapter.title,
          article:      art.article,
          heading:      art.heading,
          content:      art.content
        };
      });
    });

    jsonLunr = lunr(function () {
      this.ref('id');
      this.field('heading', { boost: 10 });
      this.field('content', { boost: 5  });
      this.field('article', { boost: 8  });
      Object.values(docStore).forEach(doc => this.add(doc));
    });

    jsonReady = true;
    resultsWrap.innerHTML = `<p class="no-results" style="color:var(--muted)">
      Article index ready — enter a term above and press Search.
    </p>`;
  } catch (err) {
    resultsWrap.innerHTML = `<p style="color:var(--danger);padding:20px">
      Failed to build index: ${escHtml(err.message)}
    </p>`;
  }
}

// ─── Highlight helper ─────────────────────────────────────────────────────────
function highlight(text, query) {
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escHtml(text).replace(re, '<mark>$1</mark>');
}

// ─── Extract a snippet around first keyword match ────────────────────────────
function snippet(text, query, radius = 160) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, radius * 2) + (text.length > radius * 2 ? '…' : '');
  const start = Math.max(0, idx - radius);
  const end   = Math.min(text.length, idx + query.length + radius);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

// ─── Search dispatcher ────────────────────────────────────────────────────────
function doSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    resultsWrap.innerHTML = `<p class="no-results">Please enter a search term.</p>`;
    return;
  }
  if (mode === 'pdf') searchPdf(query);
  else                searchJson(query);
}

// ─── PDF search ───────────────────────────────────────────────────────────────
function searchPdf(query) {
  if (!pdfReady) {
    resultsWrap.innerHTML = `<p class="no-results">PDF index not ready yet. Please wait…</p>`;
    return;
  }

  let results;
  try   { results = pdfLunr.search(`${query}*`); }
  catch { results = pdfLunr.search(query);       }

  if (results.length === 0) {
    resultsWrap.innerHTML = `<div class="no-results">
      <p>No results found for "<strong>${escHtml(query)}</strong>" in the PDF.</p>
      <p style="font-size:.88rem;margin-top:8px;color:var(--muted)">Try a different keyword or switch to Article Search.</p>
    </div>`;
    return;
  }

  const pageMap = Object.fromEntries(pdfPages.map(p => [p.id, p]));

  resultsWrap.innerHTML = `
    <p style="font-size:.85rem;color:var(--muted);margin-bottom:16px">
      ${results.length} page${results.length !== 1 ? 's' : ''} matched
      "<strong>${escHtml(query)}</strong>" in the PDF
    </p>
    ${results.map(r => {
      const pg   = pageMap[r.ref];
      const snip = snippet(pg.text, query);
      return `
        <div class="search-result">
          <h4>Page ${pg.page}</h4>
          <p style="margin-bottom:8px">${highlight(snip, query)}</p>
          <a href="${PDF_PATH}#page=${pg.page}" target="_blank" rel="noopener"
             class="btn btn-sm btn-outline">
            Open PDF at Page ${pg.page} ↗
          </a>
        </div>`;
    }).join('')}`;
}

// ─── JSON / article search ────────────────────────────────────────────────────
function searchJson(query) {
  const filter = chapterFilter.value;
  if (!jsonReady) {
    resultsWrap.innerHTML = `<p class="no-results">Article index not ready yet. Please wait…</p>`;
    return;
  }

  let results;
  try   { results = jsonLunr.search(`${query}*`); }
  catch { results = jsonLunr.search(query);        }

  if (filter) {
    results = results.filter(r => docStore[r.ref]?.chapterNum === parseInt(filter, 10));
  }

  if (results.length === 0) {
    resultsWrap.innerHTML = `<div class="no-results">
      <p>No results found for "<strong>${escHtml(query)}</strong>".</p>
      <p style="font-size:.88rem;margin-top:8px;color:var(--muted)">
        Try different keywords or switch to PDF Search.
      </p>
    </div>`;
    return;
  }

  resultsWrap.innerHTML = `
    <p style="font-size:.85rem;color:var(--muted);margin-bottom:16px">
      ${results.length} article${results.length !== 1 ? 's' : ''} matched
      "<strong>${escHtml(query)}</strong>"
    </p>
    ${results.map(r => {
      const doc  = docStore[r.ref];
      const snip = doc.content.length > 220 ? doc.content.slice(0, 220) + '…' : doc.content;
      return `
        <div class="search-result">
          <h4>Article ${escHtml(doc.article)} — ${escHtml(doc.heading)}</h4>
          <p style="font-size:.78rem;color:var(--accent);margin-bottom:6px">
            Chapter ${doc.chapterNum}: ${escHtml(doc.chapterTitle)}
          </p>
          <p>${highlight(snip, query)}</p>
          <a href="manual.html#art-${doc.article.replace('.', '-')}"
             class="btn btn-sm btn-outline" style="margin-top:10px">
            View in Manual →
          </a>
        </div>`;
    }).join('')}`;
}

// ─── Event listeners ─────────────────────────────────────────────────────────
searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

// Auto-fill from URL param e.g. search.html?q=stalemate&mode=pdf
const params = new URLSearchParams(location.search);
const urlQ   = params.get('q');
const urlMode = params.get('mode') === 'json' ? 'json' : 'pdf';

if (urlQ) searchInput.value = urlQ;

// Boot — start with the mode from URL (default: pdf)
setMode(urlMode);
if (urlQ) {
  // Wait for the index to finish before auto-searching
  const waitAndSearch = setInterval(() => {
    if ((mode === 'pdf' && pdfReady) || (mode === 'json' && jsonReady)) {
      clearInterval(waitAndSearch);
      doSearch();
    }
  }, 300);
}
