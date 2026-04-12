// HTTP web server -- multi-page portfolio with blog
// Usage: npm run web (listens on port 3000)

import express from 'express';
import compression from 'compression';
import { getContact, getAbout, getSkills, getProjects, getExperience, getData, saveData, DATA_PATH } from './data.js';

const app = express();
const PORT = parseInt(process.env.WEB_PORT || '3000', 10);
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme';
const IMMICH_URL = process.env.IMMICH_URL || 'https://photos.r-that.com';
const IMMICH_SHARE_KEY = process.env.IMMICH_SHARE_KEY || '';
const IMMICH_ALBUM_ID = process.env.IMMICH_ALBUM_ID || '';
const PHOTO_CACHE_TTL = 10 * 60 * 1000; // 10 min

app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // CSP commented out until fully tested -- other headers still active
  // res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'");
  next();
});

// Helper to get body field as string
function b(req: express.Request, field: string): string {
  const val = req.body[field];
  return typeof val === 'string' ? val : Array.isArray(val) ? val[0] || '' : '';
}

// Safe array index from params -- returns -1 if out of bounds
function safeIdx(params: Record<string, any>, key: string, arr: any[]): number {
  const i = parseInt(params[key] as string);
  return (isNaN(i) || i < 0 || i >= arr.length) ? -1 : i;
}

// HTML escape to prevent XSS
function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Shared layout wrapper
interface PageMeta { description?: string; path?: string; }

function layout(title: string, nav: string, content: string, showHero = false, meta: PageMeta = {}): string {
  const contact = getContact();
  const about = getAbout();
  const desc = esc(meta.description || about.slice(0, 155));
  const url = `https://r-that.com${meta.path || ''}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="author" content="${esc(contact.name)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(contact.name)}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${desc}">
  <link rel="canonical" href="${url}">
  ${showHero ? `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Person","name":"${esc(contact.name)}","jobTitle":"${esc(contact.title)}","url":"https://r-that.com","email":"${esc(contact.email)}","address":{"@type":"PostalAddress","addressLocality":"${esc(contact.location)}"},"sameAs":["https://${esc(contact.github)}","https://${esc(contact.website)}"]}</script>` : ''}
  <script>
    (function(){var t=localStorage.getItem('theme');if(t==='light'||(t!=='dark'&&window.matchMedia('(prefers-color-scheme:light)').matches)){document.documentElement.classList.add('light')}})();
  </script>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: #050505;
      --text: #bbb;
      --text-strong: #ddd;
      --text-deep: #fff;
      --text-muted: #888;
      --border: rgba(136, 136, 136, 0.15);
      --font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --mono: 'DM Mono', 'Fira Code', monospace;
    }
    html.light {
      --bg: #fafafa;
      --text: #444;
      --text-strong: #222;
      --text-deep: #111;
      --text-muted: #777;
      --border: rgba(0, 0, 0, 0.1);
    }
    html { scroll-behavior: smooth; }
    .skip-link { position: absolute; top: -100px; left: 16px; background: var(--accent); color: #000; padding: 8px 16px; border-radius: 4px; z-index: 9999; font-size: 14px; text-decoration: none; }
    .skip-link:focus { top: 16px; }
    :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    body {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      line-height: 1.75;
      font-size: 16px;
      -webkit-font-smoothing: antialiased;
    }
    .bg-canvas-wrap {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: -1;
      pointer-events: none;
      mask-image: radial-gradient(circle, transparent 20%, black 80%);
      -webkit-mask-image: radial-gradient(circle, transparent 20%, black 80%);
    }
    .bg-canvas-wrap canvas {
      width: 100%;
      height: 100%;
    }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
    main {
      position: relative;
      z-index: 1;
      max-width: 640px;
      margin: 0 auto;
      padding: 0 24px;
    }
    a { color: var(--text-strong); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.2s, opacity 0.2s; }
    a:hover { border-bottom-color: var(--border); }
    @keyframes slide-enter {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .si { animation: slide-enter 0.6s ease both; }
    .si1 { animation-delay: 80ms; } .si2 { animation-delay: 160ms; }
    .si3 { animation-delay: 240ms; } .si4 { animation-delay: 320ms; }
    .si5 { animation-delay: 400ms; } .si6 { animation-delay: 480ms; }
    .si7 { animation-delay: 560ms; } .si8 { animation-delay: 640ms; }
    .si9 { animation-delay: 720ms; } .si10 { animation-delay: 800ms; }
    .si11 { animation-delay: 880ms; } .si12 { animation-delay: 960ms; }
    .terminal-hint {
      text-align: center; padding: 12px 0; font-family: var(--mono);
      font-size: 12px; color: var(--text-muted); opacity: 0.5;
    }
    .terminal-hint code { color: var(--text-strong); opacity: 0.8; }
    header { padding: 0; }
    .header-top { display: flex; align-items: center; justify-content: space-between; padding: 32px 0; }
    nav { display: flex; align-items: center; gap: 20px; }
    nav a { font-size: 14px; color: var(--text); opacity: 0.5; border-bottom: none; transition: opacity 0.2s; }
    nav a:hover { opacity: 1; border-bottom: none; }
    nav a.active { opacity: 0.9; }
    nav .nav-spacer { flex: 1; }
    nav .nav-icon { display: inline-flex; align-items: center; justify-content: center; opacity: 0.4; transition: opacity 0.2s; }
    nav .nav-icon:hover { opacity: 1; }
    nav .nav-icon svg { width: 18px; height: 18px; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    nav a:hover { opacity: 1; border-bottom: none; }
    nav a.active { opacity: 0.9; }
    .logo a { border-bottom: none; display: flex; opacity: 0.4; transition: opacity 0.3s; }
    .logo a:hover { opacity: 0.9; border-bottom: none; }
    .logo svg { width: 36px; height: 36px; }
    .header-info { padding-top: 24px; }
    .name { font-size: 1.8rem; font-weight: 700; color: var(--text-deep); letter-spacing: -0.02em; }
    .name a { border-bottom: none; color: var(--text-deep); }
    .name a:hover { border-bottom: none; opacity: 0.8; }
    .title { color: var(--text-muted); font-size: 1rem; margin-top: 2px; }
    .location { color: var(--text-muted); font-size: 0.85rem; opacity: 0.6; margin-top: 2px; }
    section { padding: 40px 0; }
    h2 { font-size: 1.1rem; font-weight: 600; color: var(--text-strong); margin-bottom: 20px; letter-spacing: -0.01em; }
    hr { border: none; border-top: 1px solid var(--border); width: 50px; margin: 0 auto; }
    .about { color: var(--text); font-size: 0.95rem; line-height: 1.8; }
    .skill-category { margin-bottom: 16px; }
    .skill-category-name { font-family: var(--mono); font-size: 0.8rem; color: var(--text-muted); text-transform: lowercase; margin-bottom: 4px; }
    .skill-list { color: var(--text); font-size: 0.9rem; }
    .skill-list span { opacity: 0.7; } .skill-list span:hover { opacity: 1; }
    .skill-sep { color: var(--text-muted); opacity: 0.3; margin: 0 6px; }
    .project { margin-bottom: 16px; }
    .project-link { font-size: 0.95rem; color: var(--text-strong); opacity: 0.7; transition: opacity 0.2s; border-bottom: none; }
    .project-link:hover { opacity: 1; }
    .project-desc { color: var(--text-muted); font-size: 0.85rem; margin-top: 2px; line-height: 1.5; }
    .project-tech { font-family: var(--mono); font-size: 0.72rem; color: var(--text-muted); opacity: 0.5; margin-top: 3px; }
    .exp-item { margin-bottom: 24px; }
    .exp-role { font-size: 0.95rem; font-weight: 600; color: var(--text-strong); }
    .exp-meta { font-size: 0.82rem; color: var(--text-muted); margin-top: 1px; }
    .exp-meta .period { font-family: var(--mono); font-size: 0.75rem; opacity: 0.6; }
    .exp-desc { margin-top: 6px; padding-left: 16px; list-style: none; }
    .exp-desc li { font-size: 0.85rem; color: var(--text); opacity: 0.6; line-height: 1.6; position: relative; padding-left: 12px; }
    .exp-desc li::before { content: '-'; position: absolute; left: 0; color: var(--text-muted); opacity: 0.4; }
    .contact-item { margin-bottom: 6px; font-size: 0.9rem; }
    .contact-item .label { font-family: var(--mono); font-size: 0.78rem; color: var(--text-muted); opacity: 0.5; display: inline-block; width: 70px; }
    .contact-item a { opacity: 0.7; } .contact-item a:hover { opacity: 1; }
    .view-all { font-size: 0.85rem; opacity: 0.5; margin-top: 12px; display: inline-block; }
    .view-all:hover { opacity: 1; }
    .back-link { font-size: 0.85rem; opacity: 0.5; margin-bottom: 24px; display: inline-block; border-bottom: none; }
    .back-link:hover { opacity: 1; }
    .page-title { font-size: 1.4rem; font-weight: 700; color: var(--text-deep); margin-bottom: 32px; letter-spacing: -0.02em; }
    footer { padding: 40px 0; text-align: center; font-size: 0.8rem; color: var(--text-muted); opacity: 0.4; }
    footer code { font-family: var(--mono); font-size: 0.75rem; opacity: 0.8; }
    .to-top {
      position: fixed; bottom: 16px; right: 16px; width: 36px; height: 36px;
      border-radius: 50%; border: 1px solid var(--border); background: transparent;
      color: var(--text-muted); cursor: pointer; opacity: 0; transition: opacity 0.3s, background 0.2s;
      display: flex; align-items: center; justify-content: center; font-size: 14px; z-index: 10;
    }
    .to-top:hover { background: rgba(136,136,136,0.1); opacity: 1; }
    /* Blog styles */
    .post-item { margin-bottom: 20px; }
    .post-title { font-size: 0.95rem; color: var(--text-strong); opacity: 0.7; border-bottom: none; transition: opacity 0.2s; }
    .post-title:hover { opacity: 1; }
    .post-meta { font-family: var(--mono); font-size: 0.72rem; color: var(--text-muted); opacity: 0.5; margin-top: 2px; }
    .post-excerpt { font-size: 0.85rem; color: var(--text-muted); margin-top: 3px; line-height: 1.5; }
    .post-tags { margin-top: 3px; }
    .post-tags a { font-family: var(--mono); font-size: 0.7rem; color: var(--text-muted); opacity: 0.4; margin-right: 8px; border-bottom: none; }
    .post-tags a:hover { opacity: 0.8; }
    /* Prose */
    .prose h1 { font-size: 1.5rem; font-weight: 700; color: var(--text-deep); margin: 2em 0 0.8em; }
    .prose h2 { font-size: 1.2rem; margin: 1.8em 0 0.6em; }
    .prose h3 { font-size: 1.05rem; margin: 1.5em 0 0.5em; }
    .prose p { margin: 1.2em 0; font-size: 0.95rem; line-height: 1.8; }
    .prose ul, .prose ol { padding-left: 20px; margin: 1em 0; }
    .prose li { font-size: 0.9rem; line-height: 1.7; margin-bottom: 4px; color: var(--text); }
    .prose code { font-family: var(--mono); font-size: 0.88em; background: color-mix(in srgb, var(--text-muted) 10%, var(--bg)); padding: 2px 6px; border-radius: 3px; color: var(--text-strong); }
    .prose pre { background: color-mix(in srgb, var(--text-muted) 10%, var(--bg)); padding: 16px; border-radius: 6px; overflow-x: auto; margin: 1.5em 0; }
    .prose pre code { background: none; padding: 0; font-size: 0.85rem; line-height: 1.6; }
    .prose blockquote { border-left: 3px solid var(--border); padding: 0.5em 1em; margin: 1.2em 0; opacity: 0.7; font-style: italic; }
    .prose a { border-bottom-color: var(--border); }
    .prose a:hover { border-bottom-color: var(--text-muted); }
    .prose img { max-width: 100%; border-radius: 6px; margin: 1.5em 0; }
    .prose hr { width: 50px; margin: 2em auto; }
    /* Gallery */
    .photo-grid-wrap { max-width: 100vw; margin: 0 -24px; padding: 0 24px; }
    @media (min-width: 700px) { .photo-grid-wrap { max-width: 90vw; margin: 0 calc((640px - 90vw) / 2); padding: 0; } }
    .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
    @media (min-width: 600px) { .photo-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 900px) { .photo-grid { grid-template-columns: repeat(4, 1fr); } }
    .photo-grid img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 3px; cursor: pointer; opacity: 0.8; transition: opacity 0.2s, transform 0.2s; }
    .photo-grid img:hover { opacity: 1; transform: scale(1.02); }
    .lightbox { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 1000; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.25s; }
    .lightbox.open { display: flex; opacity: 1; }
    .lightbox img { max-width: 85vw; max-height: 85vh; border-radius: 4px; cursor: default; transition: opacity 0.2s; }
    .lightbox img.loading { opacity: 0.3; }
    .lightbox-nav { position: fixed; top: 50%; transform: translateY(-50%); font-size: 32px; color: rgba(255,255,255,0.3); cursor: pointer; padding: 20px; z-index: 1001; transition: color 0.2s; border: none; background: none; user-select: none; }
    .lightbox-nav:hover { color: rgba(255,255,255,0.8); }
    .lightbox-prev { left: 8px; }
    .lightbox-next { right: 8px; }
    .lightbox-close { position: fixed; top: 12px; right: 16px; font-size: 28px; color: rgba(255,255,255,0.3); cursor: pointer; z-index: 1001; border: none; background: none; transition: color 0.2s; }
    .lightbox-close:hover { color: rgba(255,255,255,0.8); }
    .lightbox-counter { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); font-size: 13px; color: rgba(255,255,255,0.4); font-family: var(--mono); z-index: 1001; }
    html, body, main, nav, nav a, a, .name, .title, .location, h2, .about, .skill-list, .project-link, .project-desc, .project-tech, .exp-role, .exp-meta, .exp-desc li, .contact-item, .prose p, .prose li, .prose code, .prose pre, .prose blockquote, .post-title, .post-meta, .post-excerpt, footer {
      transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease;
    }
    .theme-toggle { background: none; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; opacity: 0.4; transition: opacity 0.2s; color: var(--text); padding: 0; }
    .theme-toggle:hover { opacity: 1; }
    .theme-toggle svg { width: 18px; height: 18px; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    html.light .theme-toggle .icon-moon { display: none; }
    html:not(.light) .theme-toggle .icon-sun { display: none; }
    html.light .lightbox { background: rgba(255,255,255,0.95); }
    html.light .lightbox-nav, html.light .lightbox-close { color: rgba(0,0,0,0.3); }
    html.light .lightbox-nav:hover, html.light .lightbox-close:hover { color: rgba(0,0,0,0.8); }
    html.light .lightbox-counter { color: rgba(0,0,0,0.4); }
    html.light .to-top:hover { background: rgba(0,0,0,0.05); }
    @media (max-width: 640px) {
      main { padding: 0 20px; }
      .header-top { padding: 20px 0; }
      nav { gap: 14px; }
      .name { font-size: 1.5rem; }
    }
  </style>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to content</a>
  <div class="bg-canvas-wrap"><canvas id="bg-canvas"></canvas></div>
  <div class="terminal-hint si si1">try it in your terminal &mdash; <code>ssh r-that.com</code></div>
  <main id="main-content">
    <header class="si si2">
      <div class="header-top">
      <div class="logo"><a href="/" aria-label="Home">
        <svg viewBox="0 0 757.89 790.52" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><g><path d="M405.11,350.18c7.29,1.46,13.5,3.38,17.53,9.98,9.63,15.81-2.22,29.34-11.56,41.5-66.03,85.97-136.94,163.1-186.52,261.48-12.34,24.48-24.37,51.92-28.45,79.04,2.28,2.45,33.75-18.15,37.72-20.77,110.66-73.06,223.76-169.69,322.29-258.71,11.34-10.25,26.29-27.89,38.05-35.95,17.17-11.77,35.92,5.29,25.79,22.79-4.07,7.03-24.6,23.74-31.84,30.16-66.8,59.34-138.67,117.65-208.54,173.46-51.67,41.27-106.86,86.21-162.95,121.05-15.5,9.62-37.07,23.24-55.21,12.17-25.43-15.51-5.1-67.5,3.51-88.87,28.04-69.59,77.65-140.6,121.79-201.21,23.72-32.57,51.87-63.98,74.79-96.21.64-.9,3.37-4.15,2.59-4.9-38.61,11.34-74.64,29.73-111.93,44.56-14.04,14.67-26.33,31.23-38.46,47.54-7.13,9.58-25.8,40.56-34.29,44.71-13.32,6.52-28.75-1.7-26.25-17.26,1.29-8.03,20.36-32.79,26.12-40.87,10.05-14.13,21.06-27.72,31.23-41.77,27.94-38.58,55.9-77.16,83.59-115.9-43.17,17.07-86.09,37.28-126.67,59.82-33.8,18.77-65.84,39.45-97.64,61.36-11.51,7.93-33.81,27.28-45,32-18.69,7.89-33.64-12.67-18.71-27.71s51.08-36.76,70.71-49.29c82.04-52.42,169.7-94.04,259.63-131.12,13.15-19.23,25.65-44.14,40.27-61.98,7.13-8.71,17.23-14.37,27.75-6.92,14.95,10.58,1.71,25.12-5.33,35.34-.52.75-2.08,1.64-.51,2.49,21.54-10.78,44.2-19.03,66.18-28.82,43.79-19.5,85.91-40.17,131.07-56.93,22.39-8.31,50.24-19.5,74.49-15.99,14.37,2.08,19.02,13.56,15.26,26.74-7.18,25.2-71.93,69.77-94.98,85.02-59.09,39.09-123.28,70.19-183.22,107.78-.62.39-2.81,1.53-2.3,2.19ZM637.11,164.2c-1.97-.27-3.71.39-5.55.94-15.99,4.88-37.21,15.07-53.13,21.87-73.89,31.55-146.04,67.14-219.65,99.35-4.26,3.36-7.2,8.24-10.48,12.52-21.85,28.44-41.93,58.42-63.18,87.31l49.3-28.19c73.04-48.05,150.61-88.95,224.61-135.39,27.37-17.17,55.54-35.15,78.08-58.41Z"/><path d="M713.11,69.18c11.91-3.29,31.5-9.65,41.4,1.11s-5.35,19.73-14.62,23.19c-7.87,2.94-44.66,13.32-51.17,12.66-10.62-1.08-15.43-11.76-12.67-21.49,3.14-11.04,15.71-28.44,20.91-40.09,1.49-3.34,5.14-11.55,5.08-14.8-.13-7-14.37-7.59-13.81.74,18.79,18.45-10.54,36.55-21.69,14.76-6.7-13.09-4.4-32.18,9.03-40.08,12.01-7.07,35.81-7.62,46.06,2.99,17.11,17.72.22,43.62-8.53,61.02Z"/></g></svg>
      </a></div>
      <nav>${nav}</nav>
      </div>
      ${showHero ? `<div class="header-info">
      <div class="name"><a href="/">${contact.name}</a></div>
      <div class="title">${contact.title}</div>
      <div class="location">${contact.location}</div>
      </div>` : ''}
    </header>
    ${content}
  </main>
  <footer class="si si12">&copy; ${new Date().getFullYear()} ${contact.name} &mdash; also available via <code>ssh r-that.com</code></footer>
  <button class="to-top" onclick="window.scrollTo({top:0})" aria-label="Scroll to top">&uarr;</button>
  <script>
    const btn = document.querySelector('.to-top');
    window.addEventListener('scroll', () => { btn.style.opacity = window.scrollY > 300 ? '0.5' : '0'; });

    // PCB trace generative background
    (function() {
      const canvas = document.getElementById('bg-canvas');
      const ctx = canvas.getContext('2d');
      const { random, floor, PI } = Math;
      var isLight = document.documentElement.classList.contains('light');
      var traceColor = isLight ? '#00000018' : '#88888818';
      var padColor = isLight ? '#00000012' : '#88888812';
      var viaColor = isLight ? '#00000025' : '#88888825';
      const MIN_BRANCH = 45;
      const FPS = 20;
      const interval = 1000 / FPS;
      // PCB traces only move in 0, 45, 90, 135, 180, 225, 270, 315 degrees
      const ANGLES = [0, PI/4, PI/2, 3*PI/4, PI, 5*PI/4, 3*PI/2, 7*PI/4];

      let W, H, steps, prevSteps, rafId, lastTime;

      function initCanvas() {
        const dpr = window.devicePixelRatio || 1;
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);
      }

      function nearestAngle(rad) {
        // Snap to nearest 45-degree increment
        var best = 0, bestDiff = 99;
        for (var i = 0; i < ANGLES.length; i++) {
          var diff = Math.abs(rad - ANGLES[i]);
          if (diff > PI) diff = 2 * PI - diff;
          if (diff < bestDiff) { bestDiff = diff; best = ANGLES[i]; }
        }
        return best;
      }

      function pickTurn(rad) {
        // PCB traces: go straight (60%), 45-degree turn (30%), or 90-degree turn (10%)
        var r = random();
        if (r < 0.6) return rad;
        if (r < 0.9) return nearestAngle(rad + (random() < 0.5 ? PI/4 : -PI/4));
        return nearestAngle(rad + (random() < 0.5 ? PI/2 : -PI/2));
      }

      function trace(x, y, rad, counter) {
        // Trace segment length: 8-20px (longer than organic branches)
        var len = 8 + random() * 12;
        counter.v++;

        var nx = x + Math.cos(rad) * len;
        var ny = y + Math.sin(rad) * len;

        // Draw the trace
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        // Out of bounds check
        if (nx < -100 || nx > W + 100 || ny < -100 || ny > H + 100) return;

        // Draw a via (small circle) at branch points
        if (counter.v > 1 && random() < 0.12) {
          ctx.beginPath();
          ctx.arc(nx, ny, 2.5, 0, 2 * PI);
          ctx.strokeStyle = viaColor;
          ctx.stroke();
          ctx.strokeStyle = traceColor;
        }

        // Draw a pad (filled circle) occasionally
        if (random() < 0.04) {
          ctx.fillStyle = padColor;
          ctx.beginPath();
          ctx.arc(nx, ny, 3.5, 0, 2 * PI);
          ctx.fill();
        }

        var rate = counter.v <= MIN_BRANCH ? 0.85 : 0.5;

        // Main trace continues with a turn
        var newRad = pickTurn(rad);
        if (random() < rate) {
          steps.push(function() { trace(nx, ny, newRad, counter); });
        }

        // Branch: T-junction (perpendicular split) with lower probability
        if (random() < (counter.v <= MIN_BRANCH ? 0.2 : 0.08)) {
          var branchRad = nearestAngle(rad + (random() < 0.5 ? PI/2 : -PI/2));
          steps.push(function() { trace(nx, ny, branchRad, {v: counter.v}); });
        }
      }

      function frame() {
        var now = performance.now();
        if (now - lastTime < interval) { rafId = requestAnimationFrame(frame); return; }
        lastTime = now;

        prevSteps = steps;
        steps = [];

        if (!prevSteps.length) return;

        // Stagger: 50% of steps deferred to next frame for organic timing
        prevSteps.forEach(function(fn) {
          if (random() < 0.65) steps.push(fn);
          else fn();
        });

        rafId = requestAnimationFrame(frame);
      }

      function start() {
        if (rafId) cancelAnimationFrame(rafId);
        initCanvas();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 1;
        ctx.strokeStyle = traceColor;
        ctx.lineCap = 'square';
        prevSteps = [];
        lastTime = performance.now();

        var mid = function() { return random() * 0.6 + 0.2; };
        var r90 = PI / 2;

        // Start traces from all four edges
        steps = [
          function() { trace(mid() * W, -5, r90, {v:0}); },
          function() { trace(mid() * W, -5, r90, {v:0}); },
          function() { trace(mid() * W, -5, r90, {v:0}); },
          function() { trace(mid() * W, H + 5, -r90, {v:0}); },
          function() { trace(mid() * W, H + 5, -r90, {v:0}); },
          function() { trace(mid() * W, H + 5, -r90, {v:0}); },
          function() { trace(-5, mid() * H, 0, {v:0}); },
          function() { trace(-5, mid() * H, 0, {v:0}); },
          function() { trace(W + 5, mid() * H, PI, {v:0}); },
          function() { trace(W + 5, mid() * H, PI, {v:0}); },
        ];

        if (W < 500) steps = steps.slice(0, 4);

        rafId = requestAnimationFrame(frame);
      }

      window.addEventListener('resize', start);
      window._restartBg = function() {
        isLight = document.documentElement.classList.contains('light');
        traceColor = isLight ? '#00000018' : '#88888818';
        padColor = isLight ? '#00000012' : '#88888812';
        viaColor = isLight ? '#00000025' : '#88888825';
        start();
      };
      start();
    })();
  </script>
</body>
</html>`;
}

// Immich photo fetching with cache
interface PhotoAsset { id: string; originalFileName: string; type: string; }
let photoCache: { data: PhotoAsset[]; time: number } | null = null;

async function fetchPhotos(): Promise<PhotoAsset[]> {
  if (!IMMICH_SHARE_KEY || !IMMICH_ALBUM_ID) return [];
  if (photoCache && Date.now() - photoCache.time < PHOTO_CACHE_TTL) return photoCache.data;
  try {
    const res = await fetch(`${IMMICH_URL}/api/albums/${IMMICH_ALBUM_ID}?key=${IMMICH_SHARE_KEY}`);
    const data = await res.json() as any;
    const assets = (data.assets || []).filter((a: any) => a.type === 'IMAGE').map((a: any) => ({
      id: a.id, originalFileName: a.originalFileName, type: a.type
    }));
    photoCache = { data: assets, time: Date.now() };
    return assets;
  } catch { return photoCache?.data || []; }
}

function photoThumbUrl(id: string): string {
  return `/api/photo/${id}/thumb`;
}

function photoFullUrl(id: string): string {
  return `/api/photo/${id}/full`;
}

function navLinks(active: string): string {
  const contact = getContact();

  // Text links (left side)
  const textLinks = [
    { href: '/blog', label: 'Blog' },
    { href: '/projects', label: 'Projects' },
    { href: '/experience', label: 'Experience' },
  ];

  // Icon-only links (right side) -- all outlined stroke-based for consistency
  const iconLinks = [
    ...(IMMICH_SHARE_KEY ? [{ href: '/photos', label: 'photos', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>' }] : []),
    { href: `https://${contact.github}`, label: 'github', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>' },
  ];

  const left = textLinks.map(l => `<a href="${l.href}"${l.label.toLowerCase() === active ? ' class="active"' : ''}>${l.label}</a>`).join('');
  const right = iconLinks.map(l => `<a href="${l.href}" class="nav-icon" title="${l.label}">${l.icon}</a>`).join('');

  const themeToggle = `<button class="theme-toggle" title="Toggle theme" onclick="(function(){var h=document.documentElement,l=h.classList.toggle('light');localStorage.setItem('theme',l?'light':'dark');if(window._restartBg)window._restartBg()})()"><svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg><svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></button>`;

  return left + '<span class="nav-spacer"></span>' + right + themeToggle;
}

// ---- ROBOTS.TXT ----
app.get('/robots.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: https://r-that.com/sitemap.xml\n`);
});

// ---- SITEMAP ----
app.get('/sitemap.xml', (_req, res) => {
  const posts = loadPosts();
  const pages = ['/', '/projects', '/experience', '/blog', '/photos'];
  const urls = pages.map(p => `  <url><loc>https://r-that.com${p}</loc></url>`);
  posts.forEach(p => urls.push(`  <url><loc>https://r-that.com/blog/${esc(p.slug)}</loc>${p.date ? `<lastmod>${p.date}</lastmod>` : ''}</url>`));
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`);
});

// ---- RSS FEED ----
app.get('/blog/feed.xml', (_req, res) => {
  const contact = getContact();
  const posts = loadPosts();
  const items = posts.map(p => `  <item>
    <title>${esc(p.title)}</title>
    <link>https://r-that.com/blog/${esc(p.slug)}</link>
    <description>${esc(p.description || p.title)}</description>
    <pubDate>${p.date ? new Date(p.date).toUTCString() : ''}</pubDate>
    <guid>https://r-that.com/blog/${esc(p.slug)}</guid>
  </item>`).join('\n');
  res.setHeader('Content-Type', 'application/rss+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(contact.name)} - Blog</title>
    <link>https://r-that.com/blog</link>
    <description>Blog posts by ${esc(contact.name)}</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`);
});

// ---- FAVICON ----
app.get('/favicon.svg', (_req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 757.89 790.52"><path fill="#fff" d="M405.11,350.18c7.29,1.46,13.5,3.38,17.53,9.98,9.63,15.81-2.22,29.34-11.56,41.5-66.03,85.97-136.94,163.1-186.52,261.48-12.34,24.48-24.37,51.92-28.45,79.04,2.28,2.45,33.75-18.15,37.72-20.77,110.66-73.06,223.76-169.69,322.29-258.71,11.34-10.25,26.29-27.89,38.05-35.95,17.17-11.77,35.92,5.29,25.79,22.79-4.07,7.03-24.6,23.74-31.84,30.16-66.8,59.34-138.67,117.65-208.54,173.46-51.67,41.27-106.86,86.21-162.95,121.05-15.5,9.62-37.07,23.24-55.21,12.17-25.43-15.51-5.1-67.5,3.51-88.87,28.04-69.59,77.65-140.6,121.79-201.21,23.72-32.57,51.87-63.98,74.79-96.21.64-.9,3.37-4.15,2.59-4.9-38.61,11.34-74.64,29.73-111.93,44.56-14.04,14.67-26.33,31.23-38.46,47.54-7.13,9.58-25.8,40.56-34.29,44.71-13.32,6.52-28.75-1.7-26.25-17.26,1.29-8.03,20.36-32.79,26.12-40.87,10.05-14.13,21.06-27.72,31.23-41.77,27.94-38.58,55.9-77.16,83.59-115.9-43.17,17.07-86.09,37.28-126.67,59.82-33.8,18.77-65.84,39.45-97.64,61.36-11.51,7.93-33.81,27.28-45,32-18.69,7.89-33.64-12.67-18.71-27.71s51.08-36.76,70.71-49.29c82.04-52.42,169.7-94.04,259.63-131.12,13.15-19.23,25.65-44.14,40.27-61.98,7.13-8.71,17.23-14.37,27.75-6.92,14.95,10.58,1.71,25.12-5.33,35.34-.52.75-2.08,1.64-.51,2.49,21.54-10.78,44.2-19.03,66.18-28.82,43.79-19.5,85.91-40.17,131.07-56.93,22.39-8.31,50.24-19.5,74.49-15.99,14.37,2.08,19.02,13.56,15.26,26.74-7.18,25.2-71.93,69.77-94.98,85.02-59.09,39.09-123.28,70.19-183.22,107.78-.62.39-2.81,1.53-2.3,2.19ZM637.11,164.2c-1.97-.27-3.71.39-5.55.94-15.99,4.88-37.21,15.07-53.13,21.87-73.89,31.55-146.04,67.14-219.65,99.35-4.26,3.36-7.2,8.24-10.48,12.52-21.85,28.44-41.93,58.42-63.18,87.31l49.3-28.19c73.04-48.05,150.61-88.95,224.61-135.39,27.37-17.17,55.54-35.15,78.08-58.41Z"/><path fill="#fff" d="M713.11,69.18c11.91-3.29,31.5-9.65,41.4,1.11s-5.35,19.73-14.62,23.19c-7.87,2.94-44.66,13.32-51.17,12.66-10.62-1.08-15.43-11.76-12.67-21.49,3.14-11.04,15.71-28.44,20.91-40.09,1.49-3.34,5.14-11.55,5.08-14.8-.13-7-14.37-7.59-13.81.74,18.79,18.45-10.54,36.55-21.69,14.76-6.7-13.09-4.4-32.18,9.03-40.08,12.01-7.07,35.81-7.62,46.06,2.99,17.11,17.72.22,43.62-8.53,61.02Z"/></svg>`);
});

// ---- HOME ----
app.get('/', (_req, res) => {
  const contact = getContact();
  const about = getAbout();
  const skills = getSkills();
  const projects = getProjects();
  const experience = getExperience();
  const content = `
    <section class="si si3">
      <p class="about">${about}</p>
    </section>
    <hr class="si si4">
    <section class="si si5">
      <h2>skills</h2>
      ${skills.map(cat => `
        <div class="skill-category">
          <div class="skill-category-name">${cat.name.toLowerCase()}</div>
          <div class="skill-list">${cat.items.map(s => `<span>${s}</span>`).join('<span class="skill-sep">/</span>')}</div>
        </div>
      `).join('')}
    </section>
    <hr class="si si6">
    <section class="si si7">
      <h2>projects</h2>
      ${projects.slice(0, 3).map(p => `
        <div class="project">
          ${p.link ? `<a href="https://${p.link}" class="project-link">${p.name}</a>` : `<span class="project-link">${p.name}</span>`}
          <div class="project-desc">${p.desc}</div>
          <div class="project-tech">${p.tech.join(' / ')}</div>
        </div>
      `).join('')}
      <a href="/projects" class="view-all">view all projects &rarr;</a>
    </section>
    <hr class="si si8">
    <section class="si si9">
      <h2>experience</h2>
      <div class="exp-item">
        <div class="exp-role">${experience[0].role}</div>
        <div class="exp-meta">${experience[0].company} <span class="period">${experience[0].period}</span></div>
        <ul class="exp-desc">${experience[0].desc.map(d => `<li>${d}</li>`).join('')}</ul>
      </div>
      <a href="/experience" class="view-all">full history &rarr;</a>
    </section>
    <hr class="si si10">
    <section class="si si11">
      <h2>contact</h2>
      <div class="contact-item"><span class="label">email</span> <a href="mailto:${contact.email}">${contact.email}</a></div>
      <div class="contact-item"><span class="label">github</span> <a href="https://${contact.github}">${contact.github.replace('github.com/', '')}</a></div>
      <div class="contact-item"><span class="label">web</span> <a href="https://${contact.website}">${contact.website}</a></div>
      <div class="contact-item"><span class="label">location</span> <span style="opacity:0.7">${contact.location}</span></div>
    </section>`;

  res.send(layout(contact.name, navLinks(''), content, true, { path: '/' }));
});

// ---- PROJECTS ----
app.get('/projects', (_req, res) => {
  const contact = getContact();
  const projects = getProjects();
  const content = `
    <section class="si si3" style="padding-top:48px">

      <div class="page-title">projects</div>
      ${projects.map((p, i) => `
        <div class="project si si${Math.min(i + 4, 12)}">
          ${p.link ? `<a href="https://${p.link}" class="project-link">${p.name}</a>` : `<span class="project-link">${p.name}</span>`}
          <div class="project-desc">${p.desc}</div>
          <div class="project-tech">${p.tech.join(' / ')}</div>
        </div>
      `).join('')}
    </section>`;

  res.send(layout(`Projects - ${contact.name}`, navLinks('projects'), content, false, { description: 'Projects built by ' + contact.name, path: '/projects' }));
});

// ---- EXPERIENCE ----
app.get('/experience', (_req, res) => {
  const contact = getContact();
  const experience = getExperience();
  const content = `
    <section class="si si3" style="padding-top:48px">

      <div class="page-title">experience</div>
      ${experience.map((exp, i) => `
        <div class="exp-item si si${Math.min(i + 4, 12)}">
          <div class="exp-role">${exp.role}</div>
          <div class="exp-meta">${exp.company} <span class="period">${exp.period}</span></div>
          <ul class="exp-desc">${exp.desc.map(d => `<li>${d}</li>`).join('')}</ul>
        </div>
      `).join('')}
    </section>`;

  res.send(layout(`Experience - ${contact.name}`, navLinks('experience'), content, false, { description: 'Work experience and career history of ' + contact.name, path: '/experience' }));
});

// ---- BLOG ----
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { marked } from 'marked';

// Disable raw HTML in markdown to prevent XSS
marked.use({ renderer: { html: () => '', } });

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_TS_DIR = join(__dirname, '..');
const DATA_DIR = process.env.CAIRN_DATA_DIR || REPO_TS_DIR;
const POSTS_DIR = join(DATA_DIR, 'posts');
const POSTS_SEED_DIR = join(REPO_TS_DIR, 'posts.example');

// Ensure posts directory exists; seed from posts.example/ if empty and seed exists.
if (!existsSync(POSTS_DIR)) mkdirSync(POSTS_DIR, { recursive: true });
if (existsSync(POSTS_SEED_DIR) && readdirSync(POSTS_DIR).filter(f => f.endsWith('.md')).length === 0) {
  for (const f of readdirSync(POSTS_SEED_DIR).filter(f => f.endsWith('.md'))) {
    writeFileSync(join(POSTS_DIR, f), readFileSync(join(POSTS_SEED_DIR, f), 'utf8'), 'utf8');
  }
  console.log(`[blog] Seeded ${POSTS_DIR} from ${POSTS_SEED_DIR}`);
}

interface Post {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
  project?: string;
  content: string;
  html: string;
}

function loadPosts(tagFilter?: string): Post[] {
  if (!existsSync(POSTS_DIR)) return [];
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith('.md')).sort().reverse();
  const posts: Post[] = files.map(file => {
    const raw = readFileSync(join(POSTS_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    const html = marked(content) as string;
    return {
      slug: file.replace(/\.md$/, ''),
      title: data.title || file.replace(/\.md$/, ''),
      date: data.date || '',
      tags: data.tags || [],
      description: data.description || '',
      project: data.project || '',
      content,
      html,
    };
  });
  if (tagFilter) return posts.filter(p => p.tags.includes(tagFilter));
  return posts;
}

app.get('/blog', (req, res) => {
  const contact = getContact();
  const tag = req.query.tag as string | undefined;
  const q = (req.query.q as string || '').trim().toLowerCase();
  let posts = loadPosts(tag);

  // Search filter: match title, description, content
  if (q) {
    posts = posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.content || '').toLowerCase().includes(q)
    );
  }

  // Group posts by year-month
  const grouped = new Map<string, typeof posts>();
  for (const p of posts) {
    const d = p.date ? new Date(p.date) : null;
    const key = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : 'undated';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function formatGroup(key: string): string {
    if (key === 'undated') return 'Undated';
    const [y, m] = key.split('-');
    return `${monthNames[parseInt(m) - 1]} ${y}`;
  }

  let postsHtml = '';
  if (posts.length === 0) {
    postsHtml = `<p style="color:var(--text-muted);opacity:0.5">${q ? 'no posts match your search.' : 'no posts yet.'}</p>`;
  } else {
    let idx = 0;
    for (const [key, group] of grouped) {
      postsHtml += `<div style="color:var(--text-muted);font-size:0.8rem;font-family:var(--mono);margin-top:24px;margin-bottom:8px">${formatGroup(key)}</div>`;
      for (const p of group) {
        postsHtml += `
          <div class="post-item si si${Math.min(idx + 4, 12)}">
            <a href="/blog/${esc(p.slug)}" class="post-title">${esc(p.title)}</a>
            <div class="post-meta">${p.date}</div>
            ${p.description ? `<div class="post-excerpt">${p.description}</div>` : ''}
            ${p.tags.length > 0 ? `<div class="post-tags">${p.tags.map(t => `<a href="/blog?tag=${t}">#${t}</a>`).join('')}</div>` : ''}
          </div>`;
        idx++;
      }
    }
  }

  const subtitle = tag ? ` <span style="font-weight:400;font-size:0.9rem;color:var(--text-muted)">tagged: ${esc(tag)}</span>` : q ? ` <span style="font-weight:400;font-size:0.9rem;color:var(--text-muted)">search: ${esc(q)}</span>` : '';
  const content = `
    <section class="si si3" style="padding-top:48px">
      <div class="page-title">blog${subtitle}</div>
      <form method="GET" action="/blog" style="margin-bottom:24px;display:flex;gap:8px">
        <input type="search" name="q" value="${esc(q)}" placeholder="Search posts..." style="flex:1;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:14px;font-family:var(--font);outline:none">
        ${tag ? `<input type="hidden" name="tag" value="${esc(tag)}">` : ''}
        <button type="submit" style="padding:8px 16px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);cursor:pointer;font-size:13px">search</button>
      </form>
      ${postsHtml}
    </section>`;

  res.send(layout(`Blog - ${contact.name}`, navLinks('blog'), content, false, { description: 'Blog posts about software development, terminal UI, and engineering', path: '/blog' }));
});

app.get('/blog/:slug', (req, res) => {
  const contact = getContact();
  const posts = loadPosts();
  const post = posts.find(p => p.slug === req.params.slug);
  if (!post) {
    res.status(404).send(layout('Not Found', navLinks('blog'), '<section style="padding-top:80px"><p style="color:var(--text-muted)">post not found.</p></section>'));
    return;
  }

  const content = `
    <article class="si si3" style="padding-top:48px">

      <div class="page-title">${esc(post.title)}</div>
      <div class="post-meta" style="margin-top:-24px;margin-bottom:32px">${post.date}${post.tags.length > 0 ? ' &mdash; ' + post.tags.map(t => `<a href="/blog?tag=${t}" style="border-bottom:none">#${t}</a>`).join(' ') : ''}</div>
      <div class="prose">${post.html}</div>
    </article>`;

  res.send(layout(`${esc(post.title)} - ${contact.name}`, navLinks('blog'), content, false, { description: post.description || post.title, path: `/blog/${post.slug}` }));
});

// ---- PHOTO PROXY (hides Immich API key from client) ----
app.get('/api/photo/:id/thumb', async (req, res) => {
  if (!IMMICH_SHARE_KEY) { res.status(404).end(); return; }
  try {
    const url = `${IMMICH_URL}/api/assets/${req.params.id}/thumbnail?key=${IMMICH_SHARE_KEY}&size=thumbnail`;
    const resp = await fetch(url);
    if (!resp.ok || !resp.body) { res.status(resp.status).end(); return; }
    res.setHeader('Content-Type', resp.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    const reader = resp.body.getReader();
    const pump = async () => { const { done, value } = await reader.read(); if (done) { res.end(); return; } res.write(value); await pump(); };
    await pump();
  } catch { res.status(500).end(); }
});

app.get('/api/photo/:id/full', async (req, res) => {
  if (!IMMICH_SHARE_KEY) { res.status(404).end(); return; }
  try {
    const url = `${IMMICH_URL}/api/assets/${req.params.id}/thumbnail?key=${IMMICH_SHARE_KEY}&size=preview`;
    const resp = await fetch(url);
    if (!resp.ok || !resp.body) { res.status(resp.status).end(); return; }
    res.setHeader('Content-Type', resp.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    const reader = resp.body.getReader();
    const pump = async () => { const { done, value } = await reader.read(); if (done) { res.end(); return; } res.write(value); await pump(); };
    await pump();
  } catch { res.status(500).end(); }
});

// ---- PHOTOS ----
app.get('/photos', async (_req, res) => {
  const contact = getContact();
  const photos = await fetchPhotos();
  const content = `
    <section class="si si3" style="padding-top:48px">

      ${photos.length === 0
        ? '<p style="color:var(--text-muted);opacity:0.5">no photos available.</p>'
        : `<div class="photo-grid-wrap"><div class="photo-grid">
            ${photos.map((p, i) => `<img src="${photoThumbUrl(p.id)}" data-full="${photoFullUrl(p.id)}" alt="${p.originalFileName}" loading="lazy" onclick="openLightbox(${i})">`).join('')}
          </div></div>`
      }
    </section>`;

  const extra = `
  <div class="lightbox" id="lightbox">
    <button class="lightbox-close" onclick="closeLightbox()" aria-label="Close lightbox">&times;</button>
    <button class="lightbox-nav lightbox-prev" onclick="navLightbox(-1)" aria-label="Previous photo">&lsaquo;</button>
    <img id="lightbox-img" src="" alt="Photo preview">
    <button class="lightbox-nav lightbox-next" onclick="navLightbox(1)" aria-label="Next photo">&rsaquo;</button>
    <div class="lightbox-counter" id="lightbox-counter"></div>
  </div>
  <script>
    var lbIdx = 0;
    var lbImgs = document.querySelectorAll('.photo-grid img');
    var lbEl = document.getElementById('lightbox');
    var lbImg = document.getElementById('lightbox-img');
    var lbCounter = document.getElementById('lightbox-counter');
    var lbTotal = lbImgs.length;

    function showImage(idx) {
      lbIdx = idx;
      lbImg.classList.add('loading');
      var img = new Image();
      img.onload = function() { lbImg.src = img.src; lbImg.classList.remove('loading'); };
      img.src = lbImgs[idx].dataset.full;
      lbCounter.textContent = (idx + 1) + ' / ' + lbTotal;
      // Preload neighbors
      if (lbImgs[(idx+1) % lbTotal]) new Image().src = lbImgs[(idx+1) % lbTotal].dataset.full;
      if (lbImgs[(idx-1+lbTotal) % lbTotal]) new Image().src = lbImgs[(idx-1+lbTotal) % lbTotal].dataset.full;
    }

    function openLightbox(idx) {
      showImage(idx);
      lbEl.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lbEl.classList.remove('open');
      document.body.style.overflow = '';
      lbImg.src = '';
    }

    function navLightbox(dir) {
      showImage((lbIdx + dir + lbTotal) % lbTotal);
    }

    // Click backdrop to close (not image or nav buttons)
    if (lbEl) lbEl.addEventListener('click', function(e) {
      if (e.target === lbEl) closeLightbox();
    });

    // Keyboard
    document.addEventListener('keydown', function(e) {
      if (!lbEl || !lbEl.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') navLightbox(-1);
      else if (e.key === 'ArrowRight') navLightbox(1);
    });

    // Touch swipe
    var touchStartX = 0;
    if (lbEl) {
      lbEl.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; }, {passive: true});
      lbEl.addEventListener('touchend', function(e) {
        var diff = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(diff) > 50) navLightbox(diff > 0 ? -1 : 1);
      });
    }
  </script>`;

  // Inject lightbox script before closing body
  const page = layout(`Photos - ${contact.name}`, navLinks('photos'), content, false, { description: 'Photo gallery', path: '/photos' });
  res.send(page.replace('</body>', extra + '</body>'));
});

// ---- ADMIN ----
function adminLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script>(function(){var t=localStorage.getItem('theme');if(t==='light'||(t!=='dark'&&window.matchMedia('(prefers-color-scheme:light)').matches)){document.documentElement.classList.add('light')}})()</script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root { --bg: #050505; --surface: #0e0e0e; --border: rgba(136,136,136,0.15); --text: #bbb; --text-strong: #ddd; --text-muted: #888; --accent: #fdb32a; --mono: 'DM Mono','Fira Code',monospace; --font: 'Inter',sans-serif; }
    html.light { --bg: #fafafa; --surface: #f0f0f0; --border: rgba(0,0,0,0.1); --text: #444; --text-strong: #222; --text-muted: #777; --accent: #d4940d; }
    body { font-family: var(--font); background: var(--bg); color: var(--text); line-height: 1.6; }
    .admin { max-width: 740px; margin: 0 auto; padding: 32px 24px; }
    h1 { font-size: 1.3rem; color: var(--text-strong); margin-bottom: 24px; font-weight: 600; }
    h2 { font-size: 1rem; color: var(--text-strong); margin-bottom: 16px; font-weight: 600; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { opacity: 0.8; }
    .btn { padding: 8px 18px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--text); transition: all 0.15s; font-family: var(--font); }
    .btn:hover { border-color: var(--accent); color: var(--accent); }
    .btn-primary { background: var(--accent); color: var(--bg); border-color: var(--accent); }
    .btn-primary:hover { opacity: 0.9; }
    .btn-danger { color: #f85149; }
    .btn-danger:hover { border-color: #f85149; background: rgba(248,81,73,0.1); }
    .post-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); }
    .post-row:last-child { border-bottom: none; }
    .post-info { flex: 1; }
    .post-info .title { color: var(--text-strong); font-weight: 500; }
    .post-info .meta { font-size: 0.8rem; color: var(--text-muted); font-family: var(--mono); margin-top: 2px; }
    .actions { display: flex; gap: 8px; }
    label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px; margin-top: 16px; }
    input[type=text], input[type=password], input[type=email], input[type=url] { width: 100%; padding: 8px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 14px; font-family: var(--font); outline: none; }
    input:focus { border-color: var(--accent); }
    textarea { width: 100%; padding: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 14px; font-family: var(--mono); line-height: 1.6; outline: none; resize: vertical; }
    textarea:focus { border-color: var(--accent); }
    .form-actions { margin-top: 20px; display: flex; gap: 10px; }
    .flash { padding: 10px 16px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; }
    .flash-ok { background: rgba(63,185,80,0.1); color: #3fb950; border: 1px solid rgba(63,185,80,0.2); }
    .flash-err { background: rgba(248,81,73,0.1); color: #f85149; border: 1px solid rgba(248,81,73,0.2); }
    .login-box { max-width: 320px; margin: 120px auto; }
    .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .toast { position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 6px; font-size: 13px; z-index: 9999; opacity: 0; transform: translateY(-10px); transition: opacity 0.3s, transform 0.3s; pointer-events: none; }
    .toast.show { opacity: 1; transform: translateY(0); pointer-events: auto; }
    .toast-ok { background: rgba(63,185,80,0.15); color: #3fb950; border: 1px solid rgba(63,185,80,0.3); }
    .toast-err { background: rgba(248,81,73,0.15); color: #f85149; border: 1px solid rgba(248,81,73,0.3); }
  </style>
</head>
<body><div class="admin">${body}</div>
<div class="toast" id="toast"></div>
<script>
(function(){
  var p = new URLSearchParams(location.search);
  var msgs = {saved:'Saved successfully',deleted:'Deleted successfully',created:'Created successfully'};
  var m = p.get('msg');
  if (m && msgs[m]) {
    var t = document.getElementById('toast');
    t.textContent = msgs[m];
    t.className = 'toast toast-ok show';
    setTimeout(function(){ t.classList.remove('show'); }, 3000);
    history.replaceState(null, '', location.pathname);
  }
  document.querySelectorAll('form').forEach(function(f){
    f.addEventListener('submit', function(){
      var btns = f.querySelectorAll('button[type=submit]');
      btns.forEach(function(b){ b.disabled = true; b.style.opacity = '0.5'; });
    });
  });
})();
</script>
</body></html>`;
}

// CSRF token generation
import { randomBytes } from 'crypto';
const csrfTokens = new Map<string, number>(); // token -> expiry timestamp

function generateCsrf(): string {
  const token = randomBytes(24).toString('hex');
  csrfTokens.set(token, Date.now() + 3600000); // 1 hour
  // Cleanup old tokens
  for (const [t, exp] of csrfTokens) { if (exp < Date.now()) csrfTokens.delete(t); }
  return token;
}

function validateCsrf(req: express.Request): boolean {
  const token = b(req, '_csrf');
  if (!token || !csrfTokens.has(token)) return false;
  const exp = csrfTokens.get(token)!;
  csrfTokens.delete(token); // single use
  return exp > Date.now();
}

function csrfField(): string {
  const token = generateCsrf();
  return `<input type="hidden" name="_csrf" value="${token}">`;
}

// Rate limiting
const loginAttempts = new Map<string, { count: number; reset: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW = 60000; // 1 minute

function checkLoginRate(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.reset < now) {
    loginAttempts.set(ip, { count: 1, reset: now + LOGIN_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_LOGIN_ATTEMPTS;
}

// Session via cookie
const ADMIN_COOKIE = 'portfolio_admin';
function isAuthed(req: express.Request): boolean {
  const cookie = req.headers.cookie || '';
  return cookie.includes(`${ADMIN_COOKIE}=1`);
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!isAuthed(req)) { res.redirect('/admin/login'); return; }
  next();
}

// CSRF validation middleware for all admin POST routes
function requireCsrf(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.path === '/admin/login') { next(); return; } // login has its own csrf
  if (!validateCsrf(req)) { res.status(403).send(adminLayout('Error', '<p style="color:var(--red)">Invalid or expired form token. Please go back and try again.</p>')); return; }
  next();
}

// CSRF middleware for all admin POST routes (Express 5 compatible)
app.use('/admin', (req, res, next) => {
  if (req.method !== 'POST') { next(); return; }
  if (req.path === '/login') { next(); return; }
  if (!isAuthed(req)) { res.redirect('/admin/login'); return; }
  if (!validateCsrf(req)) { res.status(403).send(adminLayout('Error', '<p style="color:#f85149">Invalid or expired form token. Please go back and try again.</p>')); return; }
  next();
});

app.get('/admin/login', (req, res) => {
  const err = req.query.err ? '<div class="flash flash-err">Invalid password</div>' : '';
  const rate = req.query.rate ? '<div class="flash flash-err">Too many attempts. Wait a minute.</div>' : '';
  res.send(adminLayout('Admin Login', `
    <div class="login-box">
      <h1>admin</h1>
      ${err}${rate}
      <form method="POST" action="/admin/login">
        ${csrfField()}
        <label>password</label>
        <input type="password" name="password" autofocus>
        <div class="form-actions"><button type="submit" class="btn btn-primary">login</button></div>
      </form>
    </div>
  `));
});

app.post('/admin/login', (req, res) => {
  const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  if (!checkLoginRate(ip)) { res.redirect('/admin/login?rate=1'); return; }
  if (!validateCsrf(req)) { res.redirect('/admin/login?err=1'); return; }
  if (b(req, 'password') === ADMIN_PASS) {
    res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=1; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=86400`);
    res.redirect('/admin');
  } else {
    res.redirect('/admin/login?err=1');
  }
});

app.get('/admin/logout', (_req, res) => {
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=; Path=/admin; HttpOnly; Max-Age=0`);
  res.redirect('/admin/login');
});

// Old admin dashboard removed -- new one is below with nav

function postForm(action: string, post: { slug: string; title: string; date: string; tags: string; description: string; content: string }, isNew: boolean): string {
  return `
    <a href="/admin" style="font-size:0.85rem;opacity:0.5">&larr; back</a>
    <h1 style="margin-top:12px">${isNew ? 'new post' : 'edit post'}</h1>
    <form method="POST" action="${action}">${csrfField()}
      <label>title</label>
      <input type="text" name="title" value="${esc(post.title)}" required>
      <label>slug (filename without .md)</label>
      <input type="text" name="slug" value="${post.slug}" ${isNew ? '' : 'readonly style="opacity:0.5"'} required>
      <label>date (YYYY-MM-DD)</label>
      <input type="text" name="date" value="${post.date}" required>
      <label>tags (comma separated)</label>
      <input type="text" name="tags" value="${post.tags}">
      <label>description</label>
      <input type="text" name="description" value="${post.description.replace(/"/g, '&quot;')}">
      <label>content (markdown)</label>
      <textarea name="content" rows="24">${post.content}</textarea>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${isNew ? 'publish' : 'save'}</button>
        <a href="/admin" class="btn">cancel</a>
      </div>
    </form>
  `;
}

app.get('/admin/new', requireAdmin, (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  res.send(adminLayout('New Post', postForm('/admin/new', {
    slug: `${today}-`, title: '', date: today, tags: '', description: '', content: ''
  }, true)));
});

app.post('/admin/new', requireAdmin, (req, res) => {
  const slug = b(req,'slug'), title = b(req,'title'), date = b(req,'date'), tags = b(req,'tags'), description = b(req,'description'), content = b(req,'content');
  const safeSlug = slug.replace(/[^a-z0-9-]/g, '');
  const yamlTitle = title.replace(/"/g, '\\"');
  const yamlDesc = description.replace(/"/g, '\\"');
  const frontmatter = `---\ntitle: "${yamlTitle}"\ndate: ${date}\ntags: [${tags.split(',').map((t: string) => t.trim()).filter(Boolean).join(', ')}]\ndescription: "${yamlDesc}"\n---\n\n`;
  writeFileSync(join(POSTS_DIR, `${safeSlug}.md`), frontmatter + content, 'utf8');
  res.redirect('/admin?msg=created');
});

app.get('/admin/edit/:slug', requireAdmin, (req, res) => {
  const posts = loadPosts();
  const post = posts.find(p => p.slug === req.params.slug);
  if (!post) { res.redirect('/admin'); return; }
  res.send(adminLayout('Edit Post', postForm(`/admin/edit/${post.slug}`, {
    slug: post.slug,
    title: post.title,
    date: post.date,
    tags: post.tags.join(', '),
    description: post.description,
    content: post.content,
  }, false)));
});

app.post('/admin/edit/:slug', requireAdmin, (req, res) => {
  const title = b(req,'title'), date = b(req,'date'), tags = b(req,'tags'), description = b(req,'description'), content = b(req,'content');
  const slug = req.params.slug;
  const yamlTitle = title.replace(/"/g, '\\"');
  const yamlDesc = description.replace(/"/g, '\\"');
  const frontmatter = `---\ntitle: "${yamlTitle}"\ndate: ${date}\ntags: [${tags.split(',').map((t: string) => t.trim()).filter(Boolean).join(', ')}]\ndescription: "${yamlDesc}"\n---\n\n`;
  writeFileSync(join(POSTS_DIR, `${slug}.md`), frontmatter + content, 'utf8');
  res.redirect('/admin?msg=saved');
});

app.post('/admin/delete/:slug', requireAdmin, (req, res) => {
  const filePath = join(POSTS_DIR, `${req.params.slug}.md`);
  if (existsSync(filePath)) unlinkSync(filePath);
  res.redirect('/admin?msg=deleted');
});

// ---- ADMIN: Content Editors ----

// Admin nav helper
function adminNav(active: string): string {
  const items = [
    { href: '/admin', label: 'Posts' },
    { href: '/admin/about', label: 'About' },
    { href: '/admin/skills', label: 'Skills' },
    { href: '/admin/projects', label: 'Projects' },
    { href: '/admin/experience', label: 'Experience' },
    { href: '/admin/contact', label: 'Contact' },
  ];
  return '<div style="display:flex;gap:12px;margin-bottom:24px;padding-bottom:12px;border-bottom:1px solid var(--border)">' +
    items.map(i => `<a href="${i.href}" style="font-size:13px;${i.label.toLowerCase() === active ? 'color:var(--text);font-weight:600' : 'color:var(--text-muted)'}">${i.label}</a>`).join('') +
    '<div style="flex:1"></div><a href="/admin/logout" style="font-size:13px;color:var(--text-muted)">logout</a></div>';
}

// About editor
app.get('/admin/about', requireAdmin, (_req, res) => {
  const data = getData();
  res.send(adminLayout('Edit About', adminNav('about') + `
    <h2>About</h2>
    <form method="POST" action="/admin/about">${csrfField()}
      <label>About text</label>
      <textarea name="about" rows="8">${esc(data.about)}</textarea>
      <div class="form-actions"><button type="submit" class="btn btn-primary">Save</button></div>
    </form>
  `));
});

app.post('/admin/about', requireAdmin, (req, res) => {
  const data = getData();
  data.about = b(req, 'about');
  saveData(data);
  res.redirect('/admin/about?msg=saved');
});

// Contact editor
app.get('/admin/contact', requireAdmin, (_req, res) => {
  const data = getData();
  const c = data.contact;
  res.send(adminLayout('Edit Contact', adminNav('contact') + `
    <h2>Contact Info</h2>
    <form method="POST" action="/admin/contact">${csrfField()}
      <label>Name</label><input type="text" name="name" value="${esc(c.name)}">
      <label>Title</label><input type="text" name="title" value="${esc(c.title)}">
      <label>Email</label><input type="email" name="email" value="${esc(c.email)}">
      <label>GitHub</label><input type="url" name="github" value="${esc(c.github)}">
      <label>Website</label><input type="url" name="website" value="${esc(c.website)}">
      <label>Location</label><input type="text" name="location" value="${esc(c.location)}">
      <div class="form-actions"><button type="submit" class="btn btn-primary">Save</button></div>
    </form>
  `));
});

app.post('/admin/contact', requireAdmin, (req, res) => {
  const data = getData();
  data.contact = { name: b(req,'name'), title: b(req,'title'), email: b(req,'email'), github: b(req,'github'), website: b(req,'website'), location: b(req,'location') };
  saveData(data);
  res.redirect('/admin/contact?msg=saved');
});

// Skills editor
app.get('/admin/skills', requireAdmin, (_req, res) => {
  const data = getData();
  const skillsHtml = data.skills.map((s: any, i: number) => `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:16px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${esc(s.name)}</strong>
        <div style="display:flex;gap:8px">
          <a href="/admin/skills/edit/${i}" class="btn">edit</a>
          <form method="POST" action="/admin/skills/delete/${i}" style="display:inline">${csrfField()}<button type="submit" class="btn btn-danger" onclick="return confirm('Delete?')">delete</button></form>
        </div>
      </div>
      <div style="color:var(--text-muted);font-size:13px;margin-top:4px">${s.items.map(esc).join(', ')}</div>
    </div>
  `).join('');

  res.send(adminLayout('Edit Skills', adminNav('skills') + `
    <div class="top-bar"><h2>Skills</h2></div>
    ${skillsHtml}
    <h2 style="margin-top:24px">Add / Edit Skill Category</h2>
    <form method="POST" action="/admin/skills">${csrfField()}
      <label>Category Name</label><input type="text" name="name" required>
      <label>Skills (comma separated)</label><input type="text" name="items" required>
      <div class="form-actions"><button type="submit" class="btn btn-primary">Add</button></div>
    </form>
  `));
});

app.post('/admin/skills', requireAdmin, (req, res) => {
  const data = getData();
  const items = b(req,'items').split(',').map((s: string) => s.trim()).filter(Boolean);
  data.skills.push({ name: b(req,'name'), items });
  saveData(data);
  res.redirect('/admin/skills?msg=created');
});

app.post('/admin/skills/delete/:idx', requireAdmin, (req, res) => {
  const data = getData();
  const idx = safeIdx(req.params, 'idx', data.skills);
  if (idx < 0) { res.redirect('/admin/skills'); return; }
  data.skills.splice(idx, 1);
  saveData(data);
  res.redirect('/admin/skills?msg=deleted');
});

app.get('/admin/skills/edit/:idx', requireAdmin, (req, res) => {
  const data = getData();
  const idx = safeIdx(req.params, 'idx', data.skills);
  if (idx < 0) { res.redirect('/admin/skills'); return; }
  const s = data.skills[idx];
  res.send(adminLayout('Edit Skill', adminNav('skills') + `
    <a href="/admin/skills" style="font-size:13px;opacity:0.5">&larr; back</a>
    <h2>Edit: ${s.name}</h2>
    <form method="POST" action="/admin/skills/edit/${req.params.idx}">${csrfField()}
      <label>Category Name</label><input type="text" name="name" value="${esc(s.name)}" required>
      <label>Skills (comma separated)</label><input type="text" name="items" value="${esc(s.items.join(', '))}" required>
      <div class="form-actions"><button type="submit" class="btn btn-primary">Save</button></div>
    </form>
  `));
});

app.post('/admin/skills/edit/:idx', requireAdmin, (req, res) => {
  const data = getData();
  const i = safeIdx(req.params, 'idx', data.skills);
  if (i < 0) { res.redirect('/admin/skills'); return; }
  data.skills[i] = { name: b(req,'name'), items: b(req,'items').split(',').map((s: string) => s.trim()).filter(Boolean) };
  saveData(data);
  res.redirect('/admin/skills?msg=saved');
});

// Projects editor
app.get('/admin/projects', requireAdmin, (_req, res) => {
  const data = getData();
  const projectsHtml = data.projects.map((p: any, i: number) => `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:16px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${esc(p.name)}</strong>
        <div style="display:flex;gap:8px">
          <a href="/admin/projects/edit/${i}" class="btn">edit</a>
          <form method="POST" action="/admin/projects/delete/${i}" style="display:inline">${csrfField()}<button type="submit" class="btn btn-danger" onclick="return confirm('Delete?')">delete</button></form>
        </div>
      </div>
      <div style="color:var(--text-muted);font-size:13px;margin-top:4px">${esc(p.desc)}</div>
    </div>
  `).join('');

  res.send(adminLayout('Edit Projects', adminNav('projects') + `
    <div class="top-bar"><h2>Projects</h2><a href="/admin/projects/new" class="btn btn-primary">add project</a></div>
    ${projectsHtml}
  `));
});

app.get('/admin/projects/new', requireAdmin, (_req, res) => {
  res.send(adminLayout('New Project', adminNav('projects') + `
    <a href="/admin/projects" style="font-size:13px;opacity:0.5">&larr; back</a>
    <h2>New Project</h2>
    <form method="POST" action="/admin/projects/new">${csrfField()}
      <label>Name</label><input type="text" name="name" required>
      <label>Description</label><textarea name="desc" rows="3"></textarea>
      <label>Tech (comma separated)</label><input type="text" name="tech">
      <label>Link</label><input type="text" name="link" placeholder="example.com/path (scheme optional)">
      <div class="form-actions"><button type="submit" class="btn btn-primary">Add</button></div>
    </form>
  `));
});

// Display code prepends `https://`, so store links without a scheme.
const normalizeLink = (s: string) => s.replace(/^https?:\/\//i, '').trim();

app.post('/admin/projects/new', requireAdmin, (req, res) => {
  const data = getData();
  data.projects.push({ name: b(req,'name'), desc: b(req,'desc'), tech: b(req,'tech').split(',').map((s: string) => s.trim()).filter(Boolean), link: normalizeLink(b(req,'link')) });
  saveData(data);
  res.redirect('/admin/projects?msg=created');
});

app.get('/admin/projects/edit/:idx', requireAdmin, (req, res) => {
  const data = getData();
  const idx = safeIdx(req.params, 'idx', data.projects);
  if (idx < 0) { res.redirect('/admin/projects'); return; }
  const p = data.projects[idx];
  res.send(adminLayout('Edit Project', adminNav('projects') + `
    <a href="/admin/projects" style="font-size:13px;opacity:0.5">&larr; back</a>
    <h2>Edit: ${p.name}</h2>
    <form method="POST" action="/admin/projects/edit/${req.params.idx}">${csrfField()}
      <label>Name</label><input type="text" name="name" value="${esc(p.name)}" required>
      <label>Description</label><textarea name="desc" rows="3">${esc(p.desc)}</textarea>
      <label>Tech (comma separated)</label><input type="text" name="tech" value="${esc(p.tech.join(', '))}">
      <label>Link</label><input type="text" name="link" value="${esc(p.link)}" placeholder="example.com/path (scheme optional)">
      <div class="form-actions"><button type="submit" class="btn btn-primary">Save</button></div>
    </form>
  `));
});

app.post('/admin/projects/edit/:idx', requireAdmin, (req, res) => {
  const data = getData();
  const i = safeIdx(req.params, 'idx', data.projects);
  if (i < 0) { res.redirect('/admin/projects'); return; }
  data.projects[i] = { name: b(req,'name'), desc: b(req,'desc'), tech: b(req,'tech').split(',').map((s: string) => s.trim()).filter(Boolean), link: normalizeLink(b(req,'link')) };
  saveData(data);
  res.redirect('/admin/projects?msg=saved');
});

app.post('/admin/projects/delete/:idx', requireAdmin, (req, res) => {
  const data = getData();
  const idx = safeIdx(req.params, 'idx', data.projects);
  if (idx < 0) { res.redirect('/admin/projects'); return; }
  data.projects.splice(idx, 1);
  saveData(data);
  res.redirect('/admin/projects?msg=deleted');
});

// Experience editor
app.get('/admin/experience', requireAdmin, (_req, res) => {
  const data = getData();
  const expHtml = data.experience.map((e: any, i: number) => `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:16px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${esc(e.role)}</strong> <span style="color:var(--text-muted);font-size:13px">${esc(e.period)}</span>
        <div style="display:flex;gap:8px">
          <a href="/admin/experience/edit/${i}" class="btn">edit</a>
          <form method="POST" action="/admin/experience/delete/${i}" style="display:inline">${csrfField()}<button type="submit" class="btn btn-danger" onclick="return confirm('Delete?')">delete</button></form>
        </div>
      </div>
      <div style="color:var(--text-muted);font-size:13px;margin-top:4px">${esc(e.company)}</div>
    </div>
  `).join('');

  res.send(adminLayout('Edit Experience', adminNav('experience') + `
    <div class="top-bar"><h2>Experience</h2><a href="/admin/experience/new" class="btn btn-primary">add role</a></div>
    ${expHtml}
  `));
});

app.get('/admin/experience/new', requireAdmin, (_req, res) => {
  res.send(adminLayout('New Role', adminNav('experience') + `
    <a href="/admin/experience" style="font-size:13px;opacity:0.5">&larr; back</a>
    <h2>New Role</h2>
    <form method="POST" action="/admin/experience/new">${csrfField()}
      <label>Role</label><input type="text" name="role" required>
      <label>Company</label><input type="text" name="company" required>
      <label>Period</label><input type="text" name="period" required>
      <label>Descriptions (one per line)</label><textarea name="desc" rows="5"></textarea>
      <div class="form-actions"><button type="submit" class="btn btn-primary">Add</button></div>
    </form>
  `));
});

app.post('/admin/experience/new', requireAdmin, (req, res) => {
  const data = getData();
  data.experience.push({ role: b(req,'role'), company: b(req,'company'), period: b(req,'period'), desc: b(req,'desc').split('\n').map((s: string) => s.trim()).filter(Boolean) });
  saveData(data);
  res.redirect('/admin/experience?msg=created');
});

app.get('/admin/experience/edit/:idx', requireAdmin, (req, res) => {
  const data = getData();
  const idx = safeIdx(req.params, 'idx', data.experience);
  if (idx < 0) { res.redirect('/admin/experience'); return; }
  const e = data.experience[idx];
  res.send(adminLayout('Edit Role', adminNav('experience') + `
    <a href="/admin/experience" style="font-size:13px;opacity:0.5">&larr; back</a>
    <h2>Edit: ${e.role}</h2>
    <form method="POST" action="/admin/experience/edit/${req.params.idx}">${csrfField()}
      <label>Role</label><input type="text" name="role" value="${esc(e.role)}" required>
      <label>Company</label><input type="text" name="company" value="${esc(e.company)}" required>
      <label>Period</label><input type="text" name="period" value="${esc(e.period)}" required>
      <label>Descriptions (one per line)</label><textarea name="desc" rows="5">${esc(e.desc.join('\n'))}</textarea>
      <div class="form-actions"><button type="submit" class="btn btn-primary">Save</button></div>
    </form>
  `));
});

app.post('/admin/experience/edit/:idx', requireAdmin, (req, res) => {
  const data = getData();
  const i = safeIdx(req.params, 'idx', data.experience);
  if (i < 0) { res.redirect('/admin/experience'); return; }
  data.experience[i] = { role: b(req,'role'), company: b(req,'company'), period: b(req,'period'), desc: b(req,'desc').split('\n').map((s: string) => s.trim()).filter(Boolean) };
  saveData(data);
  res.redirect('/admin/experience?msg=saved');
});

app.post('/admin/experience/delete/:idx', requireAdmin, (req, res) => {
  const data = getData();
  const idx = safeIdx(req.params, 'idx', data.experience);
  if (idx < 0) { res.redirect('/admin/experience'); return; }
  data.experience.splice(idx, 1);
  saveData(data);
  res.redirect('/admin/experience?msg=deleted');
});

// Update admin dashboard to show nav
app.get('/admin', requireAdmin, (_req, res) => {
  const posts = loadPosts();
  res.send(adminLayout('Blog Admin', adminNav('posts') + `
    <div class="top-bar">
      <h2>blog posts</h2>
      <div class="actions"><a href="/admin/new" class="btn btn-primary">new post</a></div>
    </div>
    ${posts.length === 0 ? '<p style="color:var(--text-muted)">no posts yet</p>' : posts.map((p: any) => `
      <div class="post-row">
        <div class="post-info">
          <div class="title">${esc(p.title)}</div>
          <div class="meta">${p.date} &mdash; ${p.slug}.md</div>
        </div>
        <div class="actions">
          <a href="/blog/${p.slug}" class="btn" target="_blank">view</a>
          <a href="/admin/edit/${p.slug}" class="btn">edit</a>
          <form method="POST" action="/admin/delete/${p.slug}" style="display:inline" onsubmit="return confirm('Delete this post?')">${csrfField()}
            <button type="submit" class="btn btn-danger">delete</button>
          </form>
        </div>
      </div>
    `).join('')}
  `));
});

// ---- 404 ----
app.use((req, res) => {
  res.status(404).send(layout('404 — Not Found', '', `
    <section class="si" style="text-align:center;padding:4rem 1rem">
      <h1 style="font-size:4rem;font-family:'DM Mono',monospace;color:var(--accent);margin-bottom:1rem">404</h1>
      <p style="color:var(--text-muted);font-size:1.1rem;margin-bottom:2rem">The page <code style="color:var(--text-dim)">${esc(req.path)}</code> doesn't exist.</p>
      <a href="/" style="color:var(--accent);text-decoration:none;border:1px solid var(--border);padding:.5rem 1.5rem;border-radius:6px;font-size:.9rem">back to home</a>
    </section>
  `, false, { description: 'Page not found', path: req.path }));
});

// ---- 500 ----
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).send(layout('500 — Server Error', '', `
    <section class="si" style="text-align:center;padding:4rem 1rem">
      <h1 style="font-size:4rem;font-family:'DM Mono',monospace;color:var(--accent);margin-bottom:1rem">500</h1>
      <p style="color:var(--text-muted);font-size:1.1rem;margin-bottom:2rem">Something went wrong on the server.</p>
      <a href="/" style="color:var(--accent);text-decoration:none;border:1px solid var(--border);padding:.5rem 1.5rem;border-radius:6px;font-size:.9rem">back to home</a>
    </section>
  `, false, { description: 'Server error' }));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio web server running at http://localhost:${PORT}`);
});
