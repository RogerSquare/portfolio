// HTTP web server -- multi-page portfolio with blog
// Usage: npm run web (listens on port 3000)

import express from 'express';
import { contact, about, skills, projects, experience } from './data.js';

const app = express();
const PORT = parseInt(process.env.WEB_PORT || '3000', 10);
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme';
const IMMICH_URL = process.env.IMMICH_URL || 'https://photos.r-that.com';
const IMMICH_SHARE_KEY = process.env.IMMICH_SHARE_KEY || '';
const IMMICH_ALBUM_ID = process.env.IMMICH_ALBUM_ID || '';
const PHOTO_CACHE_TTL = 10 * 60 * 1000; // 10 min

app.use(express.urlencoded({ extended: true }));

// Shared layout wrapper
function layout(title: string, nav: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
      --text-muted: #666;
      --border: rgba(136, 136, 136, 0.15);
      --font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --mono: 'DM Mono', 'Fira Code', monospace;
    }
    html { scroll-behavior: smooth; }
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
    ::-webkit-scrollbar-track { background: #111; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #555; }
    main {
      position: relative;
      z-index: 1;
      max-width: 640px;
      margin: 0 auto;
      padding: 0 24px;
    }
    a { color: var(--text-strong); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.2s, opacity 0.2s; }
    a:hover { border-bottom-color: rgba(255,255,255,0.3); }
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
    header { padding: 80px 0 0; position: relative; }
    nav { position: absolute; top: 32px; right: 0; display: flex; gap: 20px; }
    nav a { font-size: 14px; color: var(--text); opacity: 0.5; border-bottom: none; transition: opacity 0.2s; }
    nav a:hover { opacity: 1; border-bottom: none; }
    nav a.active { opacity: 0.9; }
    .logo { margin-bottom: 16px; }
    .logo a { border-bottom: none; display: inline-block; opacity: 0.4; transition: opacity 0.3s; }
    .logo a:hover { opacity: 0.9; border-bottom: none; }
    .logo svg { width: 40px; height: 40px; }
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
    .prose code { font-family: var(--mono); font-size: 0.88em; background: #0e0e0e; padding: 2px 6px; border-radius: 3px; color: var(--text-strong); }
    .prose pre { background: #0e0e0e; padding: 16px; border-radius: 6px; overflow-x: auto; margin: 1.5em 0; }
    .prose pre code { background: none; padding: 0; font-size: 0.85rem; line-height: 1.6; }
    .prose blockquote { border-left: 3px solid var(--border); padding: 0.5em 1em; margin: 1.2em 0; opacity: 0.7; font-style: italic; }
    .prose a { border-bottom-color: rgba(255,255,255,0.2); }
    .prose a:hover { border-bottom-color: rgba(255,255,255,0.5); }
    .prose img { max-width: 100%; border-radius: 6px; margin: 1.5em 0; }
    .prose hr { width: 50px; margin: 2em auto; }
    /* Gallery */
    .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
    .photo-grid img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px; cursor: pointer; opacity: 0.85; transition: opacity 0.2s; }
    .photo-grid img:hover { opacity: 1; }
    .lightbox { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 100; align-items: center; justify-content: center; cursor: pointer; }
    .lightbox.open { display: flex; }
    .lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 6px; }
    @media (max-width: 640px) {
      main { padding: 0 20px; }
      header { padding-top: 60px; }
      nav { position: static; margin-bottom: 32px; }
      .name { font-size: 1.5rem; }
    }
  </style>
</head>
<body>
  <div class="bg-canvas-wrap"><canvas id="bg-canvas"></canvas></div>
  <div class="terminal-hint si si1">try it in your terminal &mdash; <code>ssh r-that.com</code></div>
  <main>
    <header class="si si2">
      <div class="logo"><a href="/" aria-label="Home">
        <svg viewBox="0 0 757.89 790.52" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><g><path d="M405.11,350.18c7.29,1.46,13.5,3.38,17.53,9.98,9.63,15.81-2.22,29.34-11.56,41.5-66.03,85.97-136.94,163.1-186.52,261.48-12.34,24.48-24.37,51.92-28.45,79.04,2.28,2.45,33.75-18.15,37.72-20.77,110.66-73.06,223.76-169.69,322.29-258.71,11.34-10.25,26.29-27.89,38.05-35.95,17.17-11.77,35.92,5.29,25.79,22.79-4.07,7.03-24.6,23.74-31.84,30.16-66.8,59.34-138.67,117.65-208.54,173.46-51.67,41.27-106.86,86.21-162.95,121.05-15.5,9.62-37.07,23.24-55.21,12.17-25.43-15.51-5.1-67.5,3.51-88.87,28.04-69.59,77.65-140.6,121.79-201.21,23.72-32.57,51.87-63.98,74.79-96.21.64-.9,3.37-4.15,2.59-4.9-38.61,11.34-74.64,29.73-111.93,44.56-14.04,14.67-26.33,31.23-38.46,47.54-7.13,9.58-25.8,40.56-34.29,44.71-13.32,6.52-28.75-1.7-26.25-17.26,1.29-8.03,20.36-32.79,26.12-40.87,10.05-14.13,21.06-27.72,31.23-41.77,27.94-38.58,55.9-77.16,83.59-115.9-43.17,17.07-86.09,37.28-126.67,59.82-33.8,18.77-65.84,39.45-97.64,61.36-11.51,7.93-33.81,27.28-45,32-18.69,7.89-33.64-12.67-18.71-27.71s51.08-36.76,70.71-49.29c82.04-52.42,169.7-94.04,259.63-131.12,13.15-19.23,25.65-44.14,40.27-61.98,7.13-8.71,17.23-14.37,27.75-6.92,14.95,10.58,1.71,25.12-5.33,35.34-.52.75-2.08,1.64-.51,2.49,21.54-10.78,44.2-19.03,66.18-28.82,43.79-19.5,85.91-40.17,131.07-56.93,22.39-8.31,50.24-19.5,74.49-15.99,14.37,2.08,19.02,13.56,15.26,26.74-7.18,25.2-71.93,69.77-94.98,85.02-59.09,39.09-123.28,70.19-183.22,107.78-.62.39-2.81,1.53-2.3,2.19ZM637.11,164.2c-1.97-.27-3.71.39-5.55.94-15.99,4.88-37.21,15.07-53.13,21.87-73.89,31.55-146.04,67.14-219.65,99.35-4.26,3.36-7.2,8.24-10.48,12.52-21.85,28.44-41.93,58.42-63.18,87.31l49.3-28.19c73.04-48.05,150.61-88.95,224.61-135.39,27.37-17.17,55.54-35.15,78.08-58.41Z"/><path d="M713.11,69.18c11.91-3.29,31.5-9.65,41.4,1.11s-5.35,19.73-14.62,23.19c-7.87,2.94-44.66,13.32-51.17,12.66-10.62-1.08-15.43-11.76-12.67-21.49,3.14-11.04,15.71-28.44,20.91-40.09,1.49-3.34,5.14-11.55,5.08-14.8-.13-7-14.37-7.59-13.81.74,18.79,18.45-10.54,36.55-21.69,14.76-6.7-13.09-4.4-32.18,9.03-40.08,12.01-7.07,35.81-7.62,46.06,2.99,17.11,17.72.22,43.62-8.53,61.02Z"/></g></svg>
      </a></div>
      <nav>${nav}</nav>
      <div class="name"><a href="/">${contact.name}</a></div>
      <div class="title">${contact.title}</div>
      <div class="location">${contact.location}</div>
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
      const traceColor = '#88888818';
      const padColor = '#88888812';
      const viaColor = '#88888825';
      const MIN_BRANCH = 45;
      const FPS = 40;
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
          if (random() < 0.5) steps.push(fn);
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
  return `${IMMICH_URL}/api/assets/${id}/thumbnail?key=${IMMICH_SHARE_KEY}&size=preview`;
}

function photoFullUrl(id: string): string {
  return `${IMMICH_URL}/api/assets/${id}/original?key=${IMMICH_SHARE_KEY}`;
}

function navLinks(active: string): string {
  const links = [
    { href: '/projects', label: 'projects' },
    { href: '/experience', label: 'experience' },
    { href: '/blog', label: 'blog' },
    ...(IMMICH_SHARE_KEY ? [{ href: '/photos', label: 'photos' }] : []),
    { href: `https://${contact.github}`, label: 'github' },
  ];
  return links.map(l => `<a href="${l.href}"${l.label === active ? ' class="active"' : ''}>${l.label}</a>`).join('');
}

// ---- HOME ----
app.get('/', (_req, res) => {
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

  res.send(layout(contact.name, navLinks(''), content));
});

// ---- PROJECTS ----
app.get('/projects', (_req, res) => {
  const content = `
    <section class="si si3" style="padding-top:48px">
      <a href="/" class="back-link">&larr; home</a>
      <div class="page-title">projects</div>
      ${projects.map((p, i) => `
        <div class="project si si${Math.min(i + 4, 12)}">
          ${p.link ? `<a href="https://${p.link}" class="project-link">${p.name}</a>` : `<span class="project-link">${p.name}</span>`}
          <div class="project-desc">${p.desc}</div>
          <div class="project-tech">${p.tech.join(' / ')}</div>
        </div>
      `).join('')}
    </section>`;

  res.send(layout(`Projects - ${contact.name}`, navLinks('projects'), content));
});

// ---- EXPERIENCE ----
app.get('/experience', (_req, res) => {
  const content = `
    <section class="si si3" style="padding-top:48px">
      <a href="/" class="back-link">&larr; home</a>
      <div class="page-title">experience</div>
      ${experience.map((exp, i) => `
        <div class="exp-item si si${Math.min(i + 4, 12)}">
          <div class="exp-role">${exp.role}</div>
          <div class="exp-meta">${exp.company} <span class="period">${exp.period}</span></div>
          <ul class="exp-desc">${exp.desc.map(d => `<li>${d}</li>`).join('')}</ul>
        </div>
      `).join('')}
    </section>`;

  res.send(layout(`Experience - ${contact.name}`, navLinks('experience'), content));
});

// ---- BLOG ----
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(__dirname, '..', 'posts');

// Ensure posts directory exists
if (!existsSync(POSTS_DIR)) mkdirSync(POSTS_DIR, { recursive: true });

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
  const tag = req.query.tag as string | undefined;
  const posts = loadPosts(tag);

  const content = `
    <section class="si si3" style="padding-top:48px">
      <a href="/" class="back-link">&larr; home</a>
      <div class="page-title">blog${tag ? ` <span style="font-weight:400;font-size:0.9rem;color:var(--text-muted)">tagged: ${tag}</span>` : ''}</div>
      ${posts.length === 0
        ? '<p style="color:var(--text-muted);opacity:0.5">no posts yet.</p>'
        : posts.map((p, i) => `
          <div class="post-item si si${Math.min(i + 4, 12)}">
            <a href="/blog/${p.slug}" class="post-title">${p.title}</a>
            <div class="post-meta">${p.date}</div>
            ${p.description ? `<div class="post-excerpt">${p.description}</div>` : ''}
            ${p.tags.length > 0 ? `<div class="post-tags">${p.tags.map(t => `<a href="/blog?tag=${t}">#${t}</a>`).join('')}</div>` : ''}
          </div>
        `).join('')
      }
    </section>`;

  res.send(layout(`Blog - ${contact.name}`, navLinks('blog'), content));
});

app.get('/blog/:slug', (req, res) => {
  const posts = loadPosts();
  const post = posts.find(p => p.slug === req.params.slug);
  if (!post) {
    res.status(404).send(layout('Not Found', navLinks('blog'), '<section style="padding-top:80px"><p style="color:var(--text-muted)">post not found.</p></section>'));
    return;
  }

  const content = `
    <section class="si si3" style="padding-top:48px">
      <a href="/blog" class="back-link">&larr; blog</a>
      <div class="page-title">${post.title}</div>
      <div class="post-meta" style="margin-top:-24px;margin-bottom:32px">${post.date}${post.tags.length > 0 ? ' &mdash; ' + post.tags.map(t => `<a href="/blog?tag=${t}" style="border-bottom:none">#${t}</a>`).join(' ') : ''}</div>
      <div class="prose">${post.html}</div>
    </section>`;

  res.send(layout(`${post.title} - ${contact.name}`, navLinks('blog'), content));
});

// ---- PHOTOS ----
app.get('/photos', async (_req, res) => {
  const photos = await fetchPhotos();
  const content = `
    <section class="si si3" style="padding-top:48px">
      <a href="/" class="back-link">&larr; home</a>
      <div class="page-title">photos</div>
      ${photos.length === 0
        ? '<p style="color:var(--text-muted);opacity:0.5">no photos available.</p>'
        : `<div class="photo-grid">
            ${photos.map(p => `<img src="${photoThumbUrl(p.id)}" data-full="${photoFullUrl(p.id)}" alt="${p.originalFileName}" loading="lazy" onclick="openLightbox(this)">`).join('')}
          </div>
          <div class="lightbox" id="lightbox" onclick="closeLightbox()">
            <img id="lightbox-img" src="" alt="">
          </div>`
      }
    </section>`;

  const extra = `<script>
    function openLightbox(el) {
      document.getElementById('lightbox-img').src = el.dataset.full;
      document.getElementById('lightbox').classList.add('open');
    }
    function closeLightbox() {
      document.getElementById('lightbox').classList.remove('open');
      document.getElementById('lightbox-img').src = '';
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
  </script>`;

  // Inject lightbox script before closing body
  const page = layout(`Photos - ${contact.name}`, navLinks('photos'), content);
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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root { --bg: #050505; --surface: #0e0e0e; --border: rgba(136,136,136,0.15); --text: #bbb; --text-strong: #ddd; --text-muted: #666; --accent: #fdb32a; --mono: 'DM Mono','Fira Code',monospace; --font: 'Inter',sans-serif; }
    body { font-family: var(--font); background: var(--bg); color: var(--text); line-height: 1.6; }
    .admin { max-width: 740px; margin: 0 auto; padding: 32px 24px; }
    h1 { font-size: 1.3rem; color: var(--text-strong); margin-bottom: 24px; font-weight: 600; }
    h2 { font-size: 1rem; color: var(--text-strong); margin-bottom: 16px; font-weight: 600; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { opacity: 0.8; }
    .btn { padding: 8px 18px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--text); transition: all 0.15s; font-family: var(--font); }
    .btn:hover { border-color: var(--accent); color: var(--accent); }
    .btn-primary { background: var(--accent); color: #050505; border-color: var(--accent); }
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
    input[type=text], input[type=password] { width: 100%; padding: 8px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 14px; font-family: var(--font); outline: none; }
    input:focus { border-color: var(--accent); }
    textarea { width: 100%; padding: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 14px; font-family: var(--mono); line-height: 1.6; outline: none; resize: vertical; }
    textarea:focus { border-color: var(--accent); }
    .form-actions { margin-top: 20px; display: flex; gap: 10px; }
    .flash { padding: 10px 16px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; }
    .flash-ok { background: rgba(63,185,80,0.1); color: #3fb950; border: 1px solid rgba(63,185,80,0.2); }
    .flash-err { background: rgba(248,81,73,0.1); color: #f85149; border: 1px solid rgba(248,81,73,0.2); }
    .login-box { max-width: 320px; margin: 120px auto; }
    .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  </style>
</head>
<body><div class="admin">${body}</div></body></html>`;
}

// Simple session via cookie
const ADMIN_COOKIE = 'portfolio_admin';
function isAuthed(req: express.Request): boolean {
  const cookie = req.headers.cookie || '';
  return cookie.includes(`${ADMIN_COOKIE}=1`);
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!isAuthed(req)) { res.redirect('/admin/login'); return; }
  next();
}

app.get('/admin/login', (req, res) => {
  const err = req.query.err ? '<div class="flash flash-err">Invalid password</div>' : '';
  res.send(adminLayout('Admin Login', `
    <div class="login-box">
      <h1>admin</h1>
      ${err}
      <form method="POST" action="/admin/login">
        <label>password</label>
        <input type="password" name="password" autofocus>
        <div class="form-actions"><button type="submit" class="btn btn-primary">login</button></div>
      </form>
    </div>
  `));
});

app.post('/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASS) {
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

app.get('/admin', requireAdmin, (_req, res) => {
  const posts = loadPosts();
  const msg = '';
  res.send(adminLayout('Blog Admin', `
    <div class="top-bar">
      <h1>blog posts</h1>
      <div class="actions">
        <a href="/admin/new" class="btn btn-primary">new post</a>
        <a href="/admin/logout" class="btn">logout</a>
      </div>
    </div>
    ${posts.length === 0 ? '<p style="color:var(--text-muted)">no posts yet</p>' : posts.map(p => `
      <div class="post-row">
        <div class="post-info">
          <div class="title">${p.title}</div>
          <div class="meta">${p.date} &mdash; ${p.slug}.md</div>
        </div>
        <div class="actions">
          <a href="/blog/${p.slug}" class="btn" target="_blank">view</a>
          <a href="/admin/edit/${p.slug}" class="btn">edit</a>
          <form method="POST" action="/admin/delete/${p.slug}" style="display:inline" onsubmit="return confirm('Delete this post?')">
            <button type="submit" class="btn btn-danger">delete</button>
          </form>
        </div>
      </div>
    `).join('')}
  `));
});

function postForm(action: string, post: { slug: string; title: string; date: string; tags: string; description: string; content: string }, isNew: boolean): string {
  return `
    <a href="/admin" style="font-size:0.85rem;opacity:0.5">&larr; back</a>
    <h1 style="margin-top:12px">${isNew ? 'new post' : 'edit post'}</h1>
    <form method="POST" action="${action}">
      <label>title</label>
      <input type="text" name="title" value="${post.title.replace(/"/g, '&quot;')}" required>
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
  const { slug, title, date, tags, description, content } = req.body;
  const safeSlug = slug.replace(/[^a-z0-9-]/g, '');
  const frontmatter = `---\ntitle: ${title}\ndate: ${date}\ntags: [${(tags || '').split(',').map((t: string) => t.trim()).filter(Boolean).join(', ')}]\ndescription: ${description}\n---\n\n`;
  writeFileSync(join(POSTS_DIR, `${safeSlug}.md`), frontmatter + content, 'utf8');
  res.redirect('/admin');
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
  const { title, date, tags, description, content } = req.body;
  const slug = req.params.slug;
  const frontmatter = `---\ntitle: ${title}\ndate: ${date}\ntags: [${(tags || '').split(',').map((t: string) => t.trim()).filter(Boolean).join(', ')}]\ndescription: ${description}\n---\n\n`;
  writeFileSync(join(POSTS_DIR, `${slug}.md`), frontmatter + content, 'utf8');
  res.redirect('/admin');
});

app.post('/admin/delete/:slug', requireAdmin, (req, res) => {
  const filePath = join(POSTS_DIR, `${req.params.slug}.md`);
  if (existsSync(filePath)) unlinkSync(filePath);
  res.redirect('/admin');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio web server running at http://localhost:${PORT}`);
});
