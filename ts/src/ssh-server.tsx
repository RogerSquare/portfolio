// SSH server entry point -- serves the portfolio to remote terminal clients
// Usage: npm run serve (listens on port 2222)

// Force color support BEFORE chalk/ink are imported
process.env.FORCE_COLOR = '3';
process.env.COLORTERM = 'truecolor';
process.env.TERM = 'xterm-256color';

import React from 'react';
import { render } from 'ink';
import chalk from 'chalk';
// Force chalk to use truecolor (level 3) regardless of stream detection
chalk.level = 3;

import ssh2 from 'ssh2';
const { Server } = ssh2;
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { Duplex, PassThrough } from 'stream';
import Portfolio from './Portfolio.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.SSH_PORT || '2222', 10);
const HOST_KEY_PATH = join(__dirname, '..', 'host_key');
const MAX_CONNECTIONS = 20;

let activeConnections = 0;

// Generate or load host key using ssh-keygen for OpenSSH format
function getHostKey(): string {
  if (existsSync(HOST_KEY_PATH)) {
    return readFileSync(HOST_KEY_PATH, 'utf8');
  }

  console.log('Generating new SSH host key...');
  execSync(`ssh-keygen -t ed25519 -f "${HOST_KEY_PATH}" -N "" -q`);
  try { unlinkSync(`${HOST_KEY_PATH}.pub`); } catch {}
  console.log(`Host key saved to ${HOST_KEY_PATH}`);
  return readFileSync(HOST_KEY_PATH, 'utf8');
}

const hostKey = getHostKey();

const server = new Server({ hostKeys: [hostKey] }, (client: any) => {
  const clientIp = (client as any)._sock?.remoteAddress || 'unknown';
  activeConnections++;
  console.log(`[${new Date().toISOString()}] Client connected: ${clientIp} (${activeConnections}/${MAX_CONNECTIONS})`);

  if (activeConnections > MAX_CONNECTIONS) {
    console.log(`[${new Date().toISOString()}] Rejecting connection: max connections reached`);
    client.end();
    activeConnections--;
    return;
  }

  client.on('authentication', (ctx: any) => {
    // Accept all authentication -- this is a public portfolio
    ctx.accept();
  });

  client.on('ready', () => {
    client.on('session', (accept: () => any) => {
      const session = accept();

      let ptyInfo = { cols: 80, rows: 24 };

      session.on('pty', (accept: any, _reject: any, info: any) => {
        ptyInfo = { cols: info.cols || 80, rows: info.rows || 24 };
        accept?.();
      });

      session.on('shell', (accept: any) => {
        const channel = accept();

        // Enter alternate screen buffer and hide cursor
        channel.write('\x1b[?1049h\x1b[H\x1b[2J\x1b[?25l');

        // Create writable stream that pipes to the SSH channel

        const stdout = new PassThrough() as any;
        stdout.columns = ptyInfo.cols;
        stdout.rows = ptyInfo.rows;
        stdout.isTTY = true;
        stdout.hasColors = () => true;
        stdout.getColorDepth = () => 24;
        stdout.cursorTo = (x: number, y?: number) => {
          if (y !== undefined) stdout.write(`\x1b[${y + 1};${x + 1}H`);
          else stdout.write(`\x1b[${x + 1}G`);
          return true;
        };
        stdout.clearLine = (dir: number) => {
          if (dir === -1) stdout.write('\x1b[1K');
          else if (dir === 1) stdout.write('\x1b[0K');
          else stdout.write('\x1b[2K');
          return true;
        };
        stdout.moveCursor = (dx: number, dy: number) => {
          if (dx > 0) stdout.write(`\x1b[${dx}C`);
          else if (dx < 0) stdout.write(`\x1b[${-dx}D`);
          if (dy > 0) stdout.write(`\x1b[${dy}B`);
          else if (dy < 0) stdout.write(`\x1b[${-dy}A`);
          return true;
        };
        stdout.clearScreenDown = () => { stdout.write('\x1b[J'); return true; };
        stdout.getWindowSize = () => [stdout.columns, stdout.rows];

        // Pipe stdout to the SSH channel, converting \n to \r\n for SSH terminals
        stdout.on('data', (chunk: Buffer) => {
          if (!channel.writable) return;
          // Replace bare \n (not preceded by \r) with \r\n
          const str = chunk.toString('binary');
          const fixed = str.replace(/(?<!\r)\n/g, '\r\n');
          channel.write(Buffer.from(fixed, 'binary'));
        });

        // Create readable stream for input
        const stdin = Object.assign(new PassThrough(), {
          isTTY: true,
          isRaw: true,
          setRawMode() { return this; },
          ref() { return this; },
          unref() { return this; },
        }) as any;

        // Forward SSH channel data to stdin
        channel.on('data', (data: Buffer) => {
          stdin.write(data);
        });

        // Handle window resize
        session.on('window-change', (_accept: any, _reject: any, info: any) => {
          stdout.columns = info.cols;
          stdout.rows = info.rows;
          stdout.emit('resize');
        });

        // Render the portfolio
        let inkInstance: ReturnType<typeof render> | null = null;

        try {
          inkInstance = render(<Portfolio />, {
            stdout,
            stdin,
            exitOnCtrlC: false,
            patchConsole: false,
            interactive: true,
          });

          inkInstance.waitUntilExit().then(() => {
            // Restore alternate screen, show cursor
            if (channel.writable) channel.write('\x1b[?25h\x1b[?1049l');
            channel.end();
          }).catch(() => {
            if (channel.writable) channel.write('\x1b[?25h\x1b[?1049l');
            channel.end();
          });
        } catch (err) {
          console.error(`[${new Date().toISOString()}] Render error for ${clientIp}:`, err);
          channel.end();
        }

        channel.on('close', () => {
          if (inkInstance) {
            try { inkInstance.unmount(); } catch {}
            inkInstance = null;
          }
        });
      });
    });
  });

  client.on('close', () => {
    activeConnections--;
    console.log(`[${new Date().toISOString()}] Client disconnected: ${clientIp} (${activeConnections}/${MAX_CONNECTIONS})`);
  });

  client.on('error', (err: any) => {
    if (err.message !== 'read ECONNRESET') {
      console.error(`[${new Date().toISOString()}] Client error ${clientIp}:`, err.message);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio SSH server listening on port ${PORT}`);
  console.log(`Connect with: ssh -p ${PORT} localhost`);
  console.log(`Active connections: ${activeConnections}/${MAX_CONNECTIONS}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try SSH_PORT=2223 npm run serve`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
