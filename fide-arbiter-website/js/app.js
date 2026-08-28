/**
 * app.js — Shared utilities for FIDE Arbiter's Manual website
 */

'use strict';

// ─── Navigation active link ──────────────────────────────────────────────────
(function highlightNav() {
  const links = document.querySelectorAll('.nav-links a');
  const current = location.pathname.split('/').pop() || 'index.html';
  links.forEach(a => {
    if (a.getAttribute('href') === current) a.classList.add('active');
  });
})();

// ─── Mobile hamburger toggle ─────────────────────────────────────────────────
const navToggle = document.querySelector('.nav-toggle');
const navLinks  = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
}

// ─── Generic fetch with spinner ──────────────────────────────────────────────
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return res.json();
}

// ─── Shuffle array (Fisher-Yates) ────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Show loading spinner inside element ─────────────────────────────────────
function showLoading(el, message = 'Loading…') {
  el.innerHTML = `
    <div class="loading-wrap">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>`;
}

// ─── Toast notification ───────────────────────────────────────────────────────
function showToast(msg, duration = 3000) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ─── Persist exam state to sessionStorage ────────────────────────────────────
function saveExamState(key, data) {
  try { sessionStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
}

function loadExamState(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

// ─── Utility: escape HTML ─────────────────────────────────────────────────────
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Export for use in other scripts (works without a bundler via global scope)
window.FideApp = { fetchJSON, shuffle, showLoading, showToast, saveExamState, loadExamState, escHtml };
