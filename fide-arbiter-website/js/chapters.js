/**
 * chapters.js — Chapter viewer logic
 */

'use strict';

const { fetchJSON, showLoading, escHtml } = window.FideApp;

const sidebar   = document.getElementById('chapter-sidebar');
const content   = document.getElementById('chapter-content');
const pageTitle = document.getElementById('page-title');

async function init() {
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
  if (firstLink) loadChapter(firstLink);

  // Sidebar click
  sidebar.addEventListener('click', e => {
    const link = e.target.closest('a[data-file]');
    if (!link) return;
    e.preventDefault();
    sidebar.querySelectorAll('a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
    loadChapter(link);
  });
}

async function loadChapter(link) {
  showLoading(content, 'Loading chapter…');
  const chapter = await fetchJSON(link.dataset.file);
  const examFile = link.dataset.exam;

  pageTitle.textContent = `Chapter ${chapter.chapter}: ${chapter.title}`;

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
        <li class="article-item" id="art-${art.article.replace('.', '-')}">
          <div class="article-num">Article ${escHtml(art.article)}</div>
          <div class="article-heading">${escHtml(art.heading)}</div>
          <div class="article-content">${escHtml(art.content)}</div>
        </li>
      `).join('')}
    </ul>`;
}

init().catch(err => {
  content.innerHTML = `<p style="color:var(--danger);padding:20px">Error loading data: ${err.message}</p>`;
});
