/**
 * chapters.js — Chapter viewer logic
 */

'use strict';

// All DOM refs and FideApp helpers resolved lazily inside init()
// to guarantee app.js has run first.

async function init() {
  const { fetchJSON, showLoading, escHtml } = window.FideApp;
  const sidebar   = document.getElementById('chapter-sidebar');
  const content   = document.getElementById('chapter-content');
  const pageTitle = document.getElementById('page-title'); // may be null — handled safely

  if (!sidebar || !content) return; // required elements missing

  showLoading(content, 'Loading chapters…');

  const index = await fetchJSON('data/index.json');

  // Build sidebar nav
  sidebar.innerHTML = `<h4>Chapters</h4>` +
    index.chapters.map(ch =>
      `<a href="#" data-id="${ch.id}" data-file="${ch.file}" data-exam="${ch.exam}">
         ${ch.id}. ${ch.title}
       </a>`
    ).join('');

  // Load first chapter by default
  const firstLink = sidebar.querySelector('a');
  if (firstLink) {
    firstLink.classList.add('active');
    loadChapter(firstLink);
  }

  // Sidebar click
  sidebar.addEventListener('click', e => {
    const link = e.target.closest('a[data-file]');
    if (!link) return;
    e.preventDefault();
    sidebar.querySelectorAll('a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
    loadChapter(link);
  });

  async function loadChapter(link) {
    const { fetchJSON, showLoading, escHtml } = window.FideApp;
    showLoading(content, 'Loading chapter…');
    const chapter  = await fetchJSON(link.dataset.file);
    const examFile = link.dataset.exam;

    // Update heading only if the element exists on this page
    if (pageTitle) pageTitle.textContent = `Chapter ${chapter.chapter}: ${chapter.title}`;

    content.innerHTML = `
      <div class="section-header">
        <h2>Chapter ${chapter.chapter}: ${escHtml(chapter.title)}</h2>
        <p style="margin-top:12px;">
          <a href="exam.html?file=${encodeURIComponent(examFile)}&title=${encodeURIComponent(chapter.title)}"
             class="btn btn-primary btn-sm">Take Chapter ${chapter.chapter} Exam →</a>
        </p>
      </div>
      <ul class="article-list">
        ${chapter.articles.map(art => `
          <li class="article-item" id="art-${art.article.replace(/\./g, '-')}">
            <div class="article-num">Article ${escHtml(art.article)}</div>
            <div class="article-heading">${escHtml(art.heading)}</div>
            <div class="article-content">${escHtml(art.content)}</div>
          </li>
        `).join('')}
      </ul>`;
  }
}

init().catch(err => {
  const content = document.getElementById('chapter-content');
  if (content) content.innerHTML = `<p style="color:var(--danger);padding:20px">Error: ${err.message}</p>`;
});
