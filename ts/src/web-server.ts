// HTTP web server -- multi-page portfolio with blog
// Usage: npm run web (listens on port 3000)

import express from 'express';
import { contact, about, skills, projects, experience } from './data.js';

const app = express();
const PORT = parseInt(process.env.WEB_PORT || '3000', 10);
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme';

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
    #circuit-bg {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
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
    @media (max-width: 640px) {
      main { padding: 0 20px; }
      header { padding-top: 60px; }
      nav { position: static; margin-bottom: 32px; }
      .name { font-size: 1.5rem; }
    }
  </style>
</head>
<body>
  <canvas id="circuit-bg"></canvas>
  <div class="terminal-hint si si1">try it in your terminal &mdash; <code>ssh r-that.com</code></div>
  <main>
    <header class="si si2">
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

    // Circuit Flow background animation
    (function() {
      const canvas = document.getElementById('circuit-bg');
      const ctx = canvas.getContext('2d');
      let W, H, nodes, edges, particles;
      const SPACING = 60;
      const NODE_OPACITY = 0.04;
      const EDGE_OPACITY = 0.025;
      const PARTICLE_COLOR = 'rgba(253, 179, 42, ';
      const MAX_PARTICLES = 8;
      const isMobile = window.innerWidth < 640;

      function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        buildGrid();
      }

      function buildGrid() {
        nodes = [];
        edges = [];
        const cols = Math.ceil(W / SPACING) + 1;
        const rows = Math.ceil(H / SPACING) + 1;
        const grid = [];

        for (let r = 0; r < rows; r++) {
          grid[r] = [];
          for (let c = 0; c < cols; c++) {
            // Offset some nodes slightly for organic feel
            const jx = (Math.random() - 0.5) * 8;
            const jy = (Math.random() - 0.5) * 8;
            const node = {
              x: c * SPACING + jx,
              y: r * SPACING + jy,
              pulse: Math.random() * Math.PI * 2,
              speed: 0.005 + Math.random() * 0.01,
              active: Math.random() > 0.3, // 70% of nodes exist
            };
            grid[r][c] = node;
            if (node.active) nodes.push(node);
          }
        }

        // Create edges between adjacent active nodes
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (!grid[r][c].active) continue;
            // Right neighbor
            if (c + 1 < cols && grid[r][c + 1].active && Math.random() > 0.3) {
              edges.push([grid[r][c], grid[r][c + 1]]);
            }
            // Down neighbor
            if (r + 1 < rows && grid[r + 1][c].active && Math.random() > 0.3) {
              edges.push([grid[r][c], grid[r + 1][c]]);
            }
          }
        }

        // Initialize particles
        particles = [];
      }

      function spawnParticle() {
        if (particles.length >= (isMobile ? 3 : MAX_PARTICLES) || edges.length === 0) return;
        const edge = edges[Math.floor(Math.random() * edges.length)];
        particles.push({
          from: edge[0],
          to: edge[1],
          progress: 0,
          speed: 0.008 + Math.random() * 0.012,
          trail: [],
        });
      }

      function draw() {
        ctx.clearRect(0, 0, W, H);

        // Draw edges
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + EDGE_OPACITY + ')';
        ctx.lineWidth = 0.5;
        for (const [a, b] of edges) {
          ctx.beginPath();
          // Draw L-shaped circuit paths instead of straight lines
          if (Math.abs(a.x - b.x) > Math.abs(a.y - b.y)) {
            const midX = (a.x + b.x) / 2;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(midX, a.y);
            ctx.lineTo(midX, b.y);
            ctx.lineTo(b.x, b.y);
          } else {
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
          }
          ctx.stroke();
        }

        // Draw nodes with pulse
        for (const node of nodes) {
          node.pulse += node.speed;
          const opacity = NODE_OPACITY + Math.sin(node.pulse) * 0.015;
          ctx.fillStyle = 'rgba(255, 255, 255, ' + Math.max(0.01, opacity) + ')';
          ctx.fillRect(node.x - 1, node.y - 1, 2, 2);
        }

        // Update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.progress += p.speed;

          if (p.progress >= 1) {
            particles.splice(i, 1);
            continue;
          }

          // Calculate position along the path
          const { from, to } = p;
          let px, py;
          if (Math.abs(from.x - to.x) > Math.abs(from.y - to.y)) {
            const midX = (from.x + to.x) / 2;
            if (p.progress < 0.33) {
              const t = p.progress / 0.33;
              px = from.x + (midX - from.x) * t;
              py = from.y;
            } else if (p.progress < 0.66) {
              const t = (p.progress - 0.33) / 0.33;
              px = midX;
              py = from.y + (to.y - from.y) * t;
            } else {
              const t = (p.progress - 0.66) / 0.34;
              px = midX + (to.x - midX) * t;
              py = to.y;
            }
          } else {
            px = from.x + (to.x - from.x) * p.progress;
            py = from.y + (to.y - from.y) * p.progress;
          }

          // Store trail positions
          p.trail.push({ x: px, y: py });
          if (p.trail.length > 8) p.trail.shift();

          // Draw trail
          for (let t = 0; t < p.trail.length; t++) {
            const alpha = (t / p.trail.length) * 0.15;
            const size = 1 + (t / p.trail.length);
            ctx.fillStyle = PARTICLE_COLOR + alpha + ')';
            ctx.fillRect(p.trail[t].x - size/2, p.trail[t].y - size/2, size, size);
          }

          // Draw particle head with glow
          ctx.fillStyle = PARTICLE_COLOR + '0.25)';
          ctx.fillRect(px - 1.5, py - 1.5, 3, 3);

          // Subtle glow
          ctx.fillStyle = PARTICLE_COLOR + '0.06)';
          ctx.fillRect(px - 4, py - 4, 8, 8);
        }

        // Spawn new particles periodically
        if (Math.random() < 0.02) spawnParticle();

        requestAnimationFrame(draw);
      }

      window.addEventListener('resize', resize);
      resize();
      // Spawn a few initial particles
      for (let i = 0; i < 3; i++) spawnParticle();
      draw();
    })();
  </script>
</body>
</html>`;
}

function navLinks(active: string): string {
  const links = [
    { href: '/projects', label: 'projects' },
    { href: '/experience', label: 'experience' },
    { href: '/blog', label: 'blog' },
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
