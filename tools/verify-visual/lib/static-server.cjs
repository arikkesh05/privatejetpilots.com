'use strict';

/**
 * Zero-dependency static file server for the built `apps/docs/dist`.
 *
 * The suite owns its own origin instead of attaching to a developer's `vite
 * preview`: the audited bundle is always the one that was just built, the port
 * is always free, and shutdown cannot leave a stray watcher behind.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

function startStaticServer(rootDir, { port = 0, host = '127.0.0.1' } = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const requestPath = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
      const candidate = path.join(rootDir, requestPath === '/' ? 'index.html' : requestPath);
      const withinRoot = candidate === rootDir || candidate.startsWith(rootDir + path.sep);
      const file = withinRoot && fs.existsSync(candidate) && fs.statSync(candidate).isFile()
        ? candidate
        : path.join(rootDir, 'index.html');

      if (!fs.existsSync(file)) {
        response.writeHead(404, { 'content-type': 'text/plain' });
        response.end('not found');
        return;
      }
      response.writeHead(200, {
        'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      fs.createReadStream(file).pipe(response);
    });

    server.once('error', reject);
    server.listen(port, host, () => {
      const address = server.address();
      resolve({
        url: `http://${host}:${address.port}/`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

module.exports = { startStaticServer };
