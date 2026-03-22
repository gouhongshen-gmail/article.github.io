/**
 * 自定义评论系统
 * Worker:   https://my-github-blog-comments-worker.gouhongshen.workers.dev
 * Turnstile: 填入你的 Turnstile Site Key（可选，留空则不显示验证）
 */
(function () {
  'use strict';

  const WORKER_URL = 'https://my-github-blog-comments-worker.gouhongshen.workers.dev';
  const TURNSTILE_SITE_KEY = '0x4AAAAAACsl_HLrXNrnlNhB';
  const SITE_ROOT = (((window.CONFIG && window.CONFIG.root) || '/').trim() || '/')
    .replace(/\/+$/, '/') || '/';

  const postContent = document.querySelector('.post-content');
  if (!postContent) return;

  const postSlug = stripSiteRoot(window.location.pathname).replace(/\/$/, '');
  const postTitle = (document.querySelector('h1#seo-header') || document.querySelector('h1'))
    ?.textContent?.trim() || postSlug;

  if (!postSlug) return;

  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();

  function init() {
    if (document.getElementById('custom-comments')) return;

    const section = document.createElement('section');
    section.id = 'custom-comments';
    section.innerHTML = buildHTML();

    const articleEl = document.querySelector('#board article') || postContent;
    articleEl.appendChild(section);

    if (TURNSTILE_SITE_KEY) {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true;
      document.head.appendChild(s);
    }

    loadComments();
    document.getElementById('comment-form').addEventListener('submit', handleSubmit);
  }

  function stripSiteRoot(pathname) {
    const rawPath = String(pathname || '');
    if (SITE_ROOT !== '/' && rawPath.startsWith(SITE_ROOT)) {
      return rawPath.slice(SITE_ROOT.length);
    }

    return rawPath.replace(/^\/+/, '');
  }

  function buildHTML() {
    const turnstileWidget = TURNSTILE_SITE_KEY
      ? `<div class="cf-turnstile" data-sitekey="${TURNSTILE_SITE_KEY}" data-theme="auto"></div>`
      : '';

    return `
      <div class="comments-heading">
        <span>评论</span>
        <span class="comments-count" id="comments-count"></span>
      </div>

      <div id="comments-list">
        <div class="comments-loading">加载评论中…</div>
      </div>

      <div class="comment-form-title">留下评论</div>
      <form id="comment-form" autocomplete="off">
        <div class="comment-form-row">
          <input type="text" name="author" placeholder="你的名字（可选）" maxlength="50">
        </div>
        <textarea name="content" placeholder="写点什么…" maxlength="2000" required></textarea>
        <div class="comment-form-footer">
          ${turnstileWidget}
          <button type="submit" id="comment-submit">提交评论</button>
        </div>
        <div id="comment-msg"></div>
      </form>
    `;
  }

  async function loadComments() {
    const list = document.getElementById('comments-list');
    try {
      const res = await fetch(`${WORKER_URL}?slug=${encodeURIComponent(postSlug)}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || '加载失败');

      const comments = data.comments || [];
      const countEl = document.getElementById('comments-count');
      if (countEl) countEl.textContent = comments.length ? `(${comments.length})` : '';

      if (comments.length === 0) {
        list.innerHTML = '<div class="comments-empty">还没有评论，来说点什么吧</div>';
        return;
      }

      list.innerHTML = comments.map(renderComment).join('');
    } catch (e) {
      list.innerHTML = `<div class="comments-empty">评论加载失败：${e.message}</div>`;
    }
  }

  function renderComment(c) {
    const initial = (c.author || '匿').charAt(0).toUpperCase();
    const time = formatTime(c.created_at);
    const text = escapeHtml(c.content || c.body || '').replace(/\n/g, '<br>');

    return `
      <div class="comment-item">
        <div class="comment-avatar" aria-hidden="true">${escapeHtml(initial)}</div>
        <div class="comment-body">
          <div class="comment-meta">
            <span class="comment-author">${escapeHtml(c.author || '匿名访客')}</span>
            <span class="comment-time">${time}</span>
          </div>
          <div class="comment-text">${text}</div>
        </div>
      </div>
    `;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('comment-submit');
    const msg = document.getElementById('comment-msg');

    const content = form.content.value.trim();
    if (!content) return;

    let turnstileToken = '';
    if (TURNSTILE_SITE_KEY) {
      const tokenInput = form.querySelector('[name="cf-turnstile-response"]');
      turnstileToken = tokenInput?.value || '';
      if (!turnstileToken) {
        showMsg(msg, '请完成人机验证', 'error');
        return;
      }
    }

    btn.disabled = true;
    btn.textContent = '提交中…';
    msg.className = 'comment-msg';
    msg.textContent = '';

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: form.author?.value?.trim() || '',
          content,
          postSlug,
          postTitle,
          turnstileToken,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.error || '提交失败');

      showMsg(msg, '评论已提交 🎉', 'success');
      form.reset();

      if (data.comment) {
        const list = document.getElementById('comments-list');
        const emptyEl = list.querySelector('.comments-empty');
        if (emptyEl) emptyEl.remove();

        const div = document.createElement('div');
        div.innerHTML = renderComment(data.comment);
        list.appendChild(div.firstElementChild);

        const countEl = document.getElementById('comments-count');
        if (countEl) {
          const n = (parseInt(countEl.textContent.replace(/\D/g, '')) || 0) + 1;
          countEl.textContent = `(${n})`;
        }
      }

      if (window.turnstile) window.turnstile.reset();
    } catch (err) {
      showMsg(msg, err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '提交评论';
    }
  }

  function showMsg(el, text, type) {
    el.textContent = text;
    el.className = `comment-msg ${type}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function pad(n) { return String(n).padStart(2, '0'); }
})();
