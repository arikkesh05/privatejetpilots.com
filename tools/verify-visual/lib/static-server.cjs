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
  /* Media the deck serves for the cinematic field — a wrong (or missing) type
     here makes Chromium refuse the stream and log a console error. */
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
};

function startStaticServer(rootDir, { port = 0, host = '127.0.0.1' } = {}) {
  /* Range support is load-bearing for media: a server that answers 200 with no
     `Accept-Ranges` makes Chromium treat the resource as unseekable, so it
     re-requests `bytes=0-` on every loop and aborts the still-open connection —
     an `ERR_ABORTED` the console gate (rightly) reports as a failure. */
  function parseRange(header, size) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(String(header || '').trim());
    if (!match) return null;
    const [, rawStart, rawEnd] = match;
    if (rawStart === '' && rawEnd === '') return null;
    let start;
    let end;
    if (rawStart === '') {
      const suffix = Number(rawEnd);
      if (!suffix) return null;
      start = Math.max(0, size - suffix);
      end = size - 1;
    } else {
      start = Number(rawStart);
      end = rawEnd === '' ? size - 1 : Number(rawEnd);
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) return null;
    return { start, end: Math.min(end, size - 1) };
  }

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

      const size = fs.statSync(file).size;
      const type = TYPES[path.extname(file)] || 'application/octet-stream';
      const range = parseRange(request.headers.range, size);

      if (range) {
        response.writeHead(206, {
          'content-type': type,
          'content-length': String(range.end - range.start + 1),
          'content-range': `bytes ${range.start}-${range.end}/${size}`,
          'accept-ranges': 'bytes',
          'cache-control': 'no-store',
        });
        fs.createReadStream(file, { start: range.start, end: range.end }).pipe(response);
        return;
      }

      response.writeHead(200, {
        'content-type': type,
        'content-length': String(size),
        'accept-ranges': 'bytes',
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
