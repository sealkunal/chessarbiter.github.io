/**
 * search.js — Client-side full-text search using lunr.js
 * Indexes all chapter articles and searches at runtime.
 */

'use strict';

const { fetchJSON, showLoading, escHtml } = window.FideApp;

const searchInput   = document.getElementById('search-input');
const searchBtn     = document.getElementById('search-btn');
const resultsWrap   = document.getElementById('search-results');
const chapterFilter = document.getElementById('chapter-filter');

let lunrIndex   = null;
let docStore    = {};   // id -> article object

// ─── Load & index all chapters ───────────────────────────────────────────────
async function buildIndex() {
  showLoading(resultsWrap, 'Building search index…');

  const index = await fetchJSON('data/index.json');
  const allChapters = await Promise.all(
    index.chapters.map(ch => fetchJSON(ch.file))
  );

  // Populate chapter filter dropdown
  chapterFilter.innerHTML =
    `<option value="">All Chapters</option>` +
    index.chapters.map(ch =>
      `<option value="${ch.id}">Chapter ${ch.id}: ${escHtml(ch.title)}</option>`
    ).join('');

  // Flatten articles into a document store
  let docId = 0;
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
      docId++;
    });
  });

  // Build lunr index
  lunrIndex = lunr(function () {
    this.ref('id');
    this.field('heading',  { boost: 10 });
    this.field('content',  { boost: 5 });
    this.field('article',  { boost: 8 });

    Object.values(docStore).forEach(doc => this.add(doc));
  });

  resultsWrap.innerHTML = `<p class="no-results" style="color:var(--muted)">
    Search index ready — enter a term above to begin.
  </p>`;
}

// ─── Perform search ───────────────────────────────────────────────────────────
function doSearch() {
  const query  = searchInput.value.trim();
  const filter = chapterFilter.value;

  if (!query) {
    resultsWrap.innerHTML = `<p class="no-results">Please enter a search term.</p>`;
    return;
  }
  if (!lunrIndex) {
    resultsWrap.innerHTML = `<p class="no-results">Index not ready yet. Please wait.</p>`;
    return;
  }

  let results;
  try {
    // lunr wildcard suffix for partial matching
    results = lunrIndex.search(`${query}*`);
  } catch (e) {
    results = lunrIndex.search(query);
  }

  // Apply chapter filter
  if (filter) {
    results = results.filter(r => docStore[r.ref]?.chapterNum === parseInt(filter, 10));
  }

  if (results.length === 0) {
    resultsWrap.innerHTML = `<div class="no-results">
      <p>No results found for "<strong>${escHtml(query)}</strong>".</p>
      <p style="font-size:.88rem;margin-top:8px;color:var(--muted)">
        Try different keywords or check spelling.
      </p>
    </div>`;
    return;
  }

  const highlight = (text, q) => {
    // Simple keyword highlight
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    return escHtml(text).replace(re, '<mark>$1</mark>');
  };

  resultsWrap.innerHTML = `
    <p style="font-size:.85rem;color:var(--muted);margin-bottom:16px">
      ${results.length} result${results.length !== 1 ? 's' : ''} for "<strong>${escHtml(query)}</strong>"
    </p>
    ${results.map(r => {
      const doc = docStore[r.ref];
      const snippet = doc.content.length > 200
        ? doc.content.slice(0, 200) + '…'
        : doc.content;
      return `
        <div class="search-result">
          <h4>Article ${escHtml(doc.article)} — ${escHtml(doc.heading)}</h4>
          <p style="font-size:.78rem;color:var(--accent);margin-bottom:6px">
            Chapter ${doc.chapterNum}: ${escHtml(doc.chapterTitle)}
          </p>
          <p>${highlight(snippet, query)}</p>
          <a href="chapters.html#art-${doc.article.replace('.', '-')}"
             class="btn btn-sm btn-outline" style="margin-top:10px">
            View in Manual →
          </a>
        </div>`;
    }).join('')}`;
}

// ─── Event listeners ─────────────────────────────────────────────────────────
searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

// Auto-fill query from URL param (e.g., ?q=stalemate)
const urlQ = new URLSearchParams(location.search).get('q');
if (urlQ) {
  searchInput.value = urlQ;
}

buildIndex().then(() => {
  if (urlQ) doSearch();
});
