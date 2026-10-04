/**
 * Cockpit portal — WebGL canopy.
 *
 * The scene runs inside a same-origin `srcdoc` iframe for two reasons that are
 * engineering concerns, not aesthetics:
 *
 *   1. a WebGL context is contained by a document that can be torn down
 *      independently of the React tree, and
 *   2. the scene then has a *measurable* contract — a `postMessage` bridge whose
 *      handshake the visual audit can interrogate through
 *      `iframe.contentWindow.__pjpPortal`.
 *
 * The protocol is idempotent per message: the deck never depends on the canopy
 * having seen a previous frame, so a dropped message costs at most one frame and
 * never the sequence. The canopy renders on demand — it eases toward the last
 * progress it was handed and then stops asking for frames. When the deck is
 * still, the GPU is still.
 */

/** Commands the deck sends into the canopy. */
export type PortalSceneCommand =
  | { type: 'pjp:hello' }
  | { type: 'pjp:config'; dpr: number; width: number; height: number }
  | { type: 'pjp:resize'; width: number; height: number }
  | { type: 'pjp:progress'; p: number }
  | { type: 'pjp:mode'; motion: 'full' | 'reduced' };

/** The canopy's self-report, read back through `iframe.contentWindow`. */
export interface PortalSceneReport {
  hello: string | null;
  state: 'booting' | 'ready' | 'error' | 'fallback';
  mode: 'webgl' | 'fallback';
  sent: number;
  dropped: number;
  error: string | null;
  lastP: number | null;
  lastFrame: number | null;
  dpr: number | null;
  canvas: { width: number; height: number };
}

const VERTEX_SHADER = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

/**
 * Twilight stratosphere seen through a windscreen post.
 *
 * Every colour is written so red stays above blue: the deck's rule is that its
 * only chroma is champagne on obsidian, and the audit re-tests that rule against
 * the pixels this shader produces.
 */
const FRAGMENT_SHADER = `
precision mediump float;
uniform vec2 uRes;
uniform float uP;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv - 0.5;
  p.x *= uRes.x / uRes.y;

  float horizon = 0.30 + uP * 0.22;
  float above = max(uv.y - horizon, 0.0);

  vec3 zenith = vec3(0.031, 0.030, 0.029);
  vec3 lower = vec3(0.075, 0.066, 0.052);
  vec3 sky = mix(lower, zenith, smoothstep(0.0, 1.0, above * 1.6));

  float band = exp(-abs(uv.y - horizon) * (7.5 - 3.5 * uP));
  vec3 champagne = vec3(0.72, 0.58, 0.34);
  vec3 glow = champagne * band * (0.10 + 0.28 * uP);

  float core = exp(-pow(length(p - vec2(0.0, horizon - 0.02)) * 2.2, 2.0));
  glow += champagne * core * 0.07 * uP;

  float mullion = smoothstep(0.007, 0.0, abs(p.x)) * step(p.y, -0.14);
  float post = smoothstep(0.010, 0.0, abs(p.y + 0.20)) * step(0.60, abs(p.x));
  float frame = max(mullion, post);

  float vig = smoothstep(1.22, 0.22, length(p * vec2(1.10, 1.30)));
  vec3 colour = (sky + glow) * mix(0.30, 1.0, vig);
  colour = mix(colour, vec3(0.012, 0.012, 0.012), frame * 0.88);

  float grain = fract(sin(dot(uv * uRes, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  colour += grain * 0.010;

  gl_FragColor = vec4(max(colour, vec3(0.0)), 1.0);
}
`;

/** Canopy document, part one: shell, self-report, GL boot, painting. */
const SCENE_HEAD = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Cockpit portal canopy</title>
<style>
  html, body { margin: 0; height: 100%; background: #0a0a0a; overflow: hidden; }
  canvas { display: block; width: 100%; height: 100%; }
</style>
</head>
<body>
<canvas id="scene" aria-hidden="true"></canvas>
<script>
(function () {
  'use strict';
  var VERTEX = __VERTEX__;
  var FRAGMENT = __FRAGMENT__;
  var canvas = document.getElementById('scene');
  var report = {
    hello: null, state: 'booting', mode: 'webgl', sent: 0, dropped: 0,
    error: null, lastP: null, lastFrame: null, dpr: null,
    canvas: { width: 0, height: 0 }
  };
  window.__pjpPortal = report;

  var gl = null;
  var program = null;
  var uniforms = null;
  var painter = null;
  var dpr = 1;
  var target = 0;
  var current = 0;
  var raf = null;
  var frames = 0;
  var motion = 'full';

  function compile(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || 'shader compile failed');
    }
    return shader;
  }

  function resize() {
    var width = Math.max(1, window.innerWidth);
    var height = Math.max(1, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    report.dpr = dpr;
    report.canvas.width = canvas.width;
    report.canvas.height = canvas.height;
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function paintFallback(p) {
    if (!painter) painter = canvas.getContext('2d');
    if (!painter) return;
    var w = canvas.width;
    var h = canvas.height;
    var horizon = h * (1 - (0.30 + p * 0.22));
    var sky = painter.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, 'rgb(8,8,7)');
    sky.addColorStop(Math.max(0.02, Math.min(0.98, horizon / h)), 'rgb(19,17,13)');
    sky.addColorStop(1, 'rgb(10,10,10)');
    painter.fillStyle = sky;
    painter.fillRect(0, 0, w, h);
    var glow = painter.createRadialGradient(w / 2, horizon, 0, w / 2, horizon, w * (0.30 + p * 0.22));
    glow.addColorStop(0, 'rgba(203,176,121,' + (0.16 + p * 0.26).toFixed(3) + ')');
    glow.addColorStop(1, 'rgba(203,176,121,0)');
    painter.fillStyle = glow;
    painter.fillRect(0, 0, w, h);
  }

  function render() {
    frames += 1;
    report.lastFrame = frames;
    report.lastP = Number(current.toFixed(4));
    if (gl && program) {
      gl.uniform2f(uniforms.res, canvas.width, canvas.height);
      gl.uniform1f(uniforms.p, current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      paintFallback(current);
    }
  }

  function ease() {
    var delta = target - current;
    if (Math.abs(delta) < 0.0004) {
      current = target;
      render();
      raf = null;
      return;
    }
    current += delta * 0.3;
    render();
    raf = window.requestAnimationFrame(ease);
  }


  function boot() {
    try {
      gl = canvas.getContext('webgl', { alpha: false, antialias: true, preserveDrawingBuffer: true });
      if (!gl) throw new Error('webgl unavailable');
      var linked = gl.createProgram();
      gl.attachShader(linked, compile(gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(linked, compile(gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(linked);
      if (!gl.getProgramParameter(linked, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(linked) || 'program link failed');
      }
      program = linked;
      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var attribute = gl.getAttribLocation(program, 'aPos');
      gl.enableVertexAttribArray(attribute);
      gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
      gl.useProgram(program);
      uniforms = {
        res: gl.getUniformLocation(program, 'uRes'),
        p: gl.getUniformLocation(program, 'uP')
      };
    } catch (error) {
      gl = null;
      report.mode = 'fallback';
      report.error = String((error && error.message) || error);
    }
    resize();
    render();
    report.state = 'ready';
    report.hello = 'pjp:canopy-ready';
  }

  function setProgress(p) {
    var next = Number(p);
    if (!isFinite(next)) return;
    target = Math.max(0, Math.min(1, next));
    report.sent += 1;
    if (motion === 'reduced') {
      current = target;
      render();
      return;
    }
    if (raf === null) raf = window.requestAnimationFrame(ease);
  }

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || typeof data.type !== 'string' || data.type.indexOf('pjp:') !== 0) return;

    if (data.type === 'pjp:hello') {
      if (event.source && report.hello) {
        event.source.postMessage({ type: 'pjp:hello', hello: report.hello, mode: report.mode }, '*');
      }
      return;
    }
    if (report.state !== 'ready') {
      report.dropped += 1;
      return;
    }
    if (data.type === 'pjp:resize') {
      resize();
      render();
    } else if (data.type === 'pjp:mode') {
      motion = data.motion === 'reduced' ? 'reduced' : 'full';
      if (motion === 'reduced') {
        if (raf !== null) { window.cancelAnimationFrame(raf); raf = null; }
        current = target;
        render();
      }
    } else if (data.type === 'pjp:config') {
      if (typeof data.dpr === 'number' && data.dpr > 0 && data.dpr !== dpr) resize();
      render();
    } else if (data.type === 'pjp:progress') {
      setProgress(data.p);
    }
  });

  window.addEventListener('resize', function () {
    resize();
    render();
  });

  boot();
})();
</script>
</body>
</html>
`;

/** The canopy document the deck mounts, with the shader sources injected. */
export const PORTAL_SCENE_SRCDOC = SCENE_HEAD
  .replace('__VERTEX__', JSON.stringify(VERTEX_SHADER))
  .replace('__FRAGMENT__', JSON.stringify(FRAGMENT_SHADER));

