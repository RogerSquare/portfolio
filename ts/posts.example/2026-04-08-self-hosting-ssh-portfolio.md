---
title: Self-Hosting an SSH Portfolio Server
date: 2026-04-08
tags: [ssh, deployment, node, portfolio]
description: How I made my terminal portfolio accessible to anyone via ssh r-that.com.
project: portfolio
---

I built a terminal portfolio using React and Ink -- animated header, tabbed navigation, streaming bio text, the works. It looked great locally, but the real question was: how do I let other people see it?

## The SSH Approach

The answer: run it as an SSH server. When someone types `ssh r-that.com`, they get connected to a Node.js process that renders a fresh Ink app instance to their terminal. No browser needed, no client to install.

## The Implementation

The server uses the `ssh2` npm package to accept SSH connections:

```typescript
const server = new Server({ hostKeys: [hostKey] }, (client) => {
  client.on('session', (accept) => {
    const session = accept();
    session.on('shell', (accept) => {
      const channel = accept();
      // Render Ink to the SSH channel
      render(<Portfolio />, { stdout, stdin, interactive: true });
    });
  });
});
```

The tricky parts were:
- **Stream bridging**: Ink expects Node.js `WriteStream` objects, but SSH gives you a channel. I had to implement `cursorTo`, `clearLine`, and `moveCursor` using raw ANSI escape sequences.
- **Newline handling**: Terminals expect `\r\n` over SSH, but Ink outputs bare `\n`. A simple regex replacement fixed the stair-stepping.
- **Color support**: Chalk detects color support from `process.stdout`, not the SSH stream. Setting `FORCE_COLOR=3` before imports and `chalk.level = 3` after forces truecolor output.

## Deployment

The server runs on a Hostinger VPS as a systemd service. Admin SSH was moved to port 2200, freeing port 22 for the portfolio. A Cloudflare DNS A record points `r-that.com` to the VPS IP (with proxy disabled -- Cloudflare doesn't proxy SSH).

The result: anyone with a terminal can run `ssh r-that.com` and browse an interactive, animated portfolio.
