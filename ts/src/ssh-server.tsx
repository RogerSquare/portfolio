// SSH server entry point -- serves the portfolio to remote terminal clients
// Usage: npm run serve (listens on port 2222)

import React from 'react';
import { render } from 'ink';
import { Server, type Connection, type Session } from 'ssh2';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateKeyPairSync } from 'crypto';
import { Duplex } from 'stream';
import Portfolio from './Portfolio.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.SSH_PORT || '2222', 10);
const HOST_KEY_PATH = join(__dirname, '..', 'host_key');
const MAX_CONNECTIONS = 20;

let activeConnections = 0;

// Generate or load host key
function getHostKey(): string {
  if (existsSync(HOST_KEY_PATH)) {
    return readFileSync(HOST_KEY_PATH, 'utf8');
  }

  console.log('Generating new SSH host key...');
  const { privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  writeFileSync(HOST_KEY_PATH, privateKey, { mode: 0o600 });
  console.log(`Host key saved to ${HOST_KEY_PATH}`);
  return privateKey;
}

const hostKey = getHostKey();

const server = new Server({ hostKeys: [hostKey] }, (client: Connection) => {
  const clientIp = (client as any)._sock?.remoteAddress || 'unknown';
  activeConnections++;
  console.log(`[${new Date().toISOString()}] Client connected: ${clientIp} (${activeConnections}/${MAX_CONNECTIONS})`);

  if (activeConnections > MAX_CONNECTIONS) {
    console.log(`[${new Date().toISOString()}] Rejecting connection: max connections reached`);
    client.end();
    activeConnections--;
    return;
  }

  client.on('authentication', (ctx) => {
    // Accept all authentication -- this is a public portfolio
    ctx.accept();
  });

  client.on('ready', () => {
    client.on('session', (accept: () => Session) => {
      const session = accept();

      session.on('pty', (accept, _reject, info) => {
        accept?.();
      });

      session.on('shell', (accept) => {
        const channel = accept();

        // Create a Duplex stream wrapper that Ink can use
        // Ink needs stdout (Writable) and stdin (Readable)
        const stdout = new Duplex({
          read() {},
          write(chunk, encoding, callback) {
            if (channel.writable) {
              channel.write(chunk, encoding, callback);
            } else {
              callback();
            }
          },
        }) as any;

        // Copy terminal dimensions
        stdout.columns = 80;
        stdout.rows = 24;
        stdout.isTTY = true;

        // Make stdin from channel
        const stdin = new Duplex({
          read() {},
          write(chunk, encoding, callback) {
            callback();
          },
        }) as any;

        stdin.isTTY = true;
        stdin.setRawMode = () => stdin;

        // Forward channel data to stdin
        channel.on('data', (data: Buffer) => {
          stdin.push(data);
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
            alternateScreen: true,
          });

          inkInstance.waitUntilExit().then(() => {
            channel.end();
          }).catch(() => {
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

  client.on('error', (err) => {
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
