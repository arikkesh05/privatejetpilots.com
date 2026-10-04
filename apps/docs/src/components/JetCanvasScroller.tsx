import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { useReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

/* -------------------------------------------------------------------------- *
 * Frame sequence — /public/frames/frame_0001.jpg … frame_0179.jpg (1440×1440).
 *
 * A 1:1 source drawn `cover` into a 16:9 viewport scales to the viewport width
 * and is cropped symmetrically top and bottom, so the camera move keeps its
 * horizontal framing while the vertical crop centres on the cabin aisle.
 * -------------------------------------------------------------------------- */

/** Total frames in the continuous high-altitude-to-cabin sequence. */
const TOTAL_FRAMES = 179;
/** Sequence bounds. Frames are addressed 0-based: 0 → frame_0001.jpg. */
const FIRST_FRAME = 0;
const LAST_FRAME = TOTAL_FRAMES - 1;
/** Frames fetched immediately so the first viewport paints with zero delay. */
const EAGER_FRAMES = 30;
/** Background-buffer batch size and cadence (frames per tick / ms between). */
const LAZY_BATCH_SIZE = 10;
const LAZY_START_DELAY_MS = 120;
const LAZY_BATCH_INTERVAL_MS = 60;
/** Device-pixel-ratio cap — retina crispness without a 3× backing store. */
const MAX_DPR = 2;

/* -------------------------------------------------------------------------- *
 * Editorial bands — exact fractions of the pinned track's scroll progress.
 *
 *   0%  – 25%   cabin interior
 *   40% – 65%   cockpit entry & avionics
 *   75% – 95%   sunset clouds punch-through
 *   95% – 100%  smooth fade-down into #fleet
 * -------------------------------------------------------------------------- */

const H1_FADE_OUT_START = 0.2; // ends 0.25
const H2_FADE_IN_START = 0.4; // ends 0.45
const H2_FADE_OUT_START = 0.6; // ends 0.65
const H3_FADE_IN_START = 0.75; // ends 0.81
const H3_FADE_DOWN_START = 0.95; // ends 1.00 — the fade-down into #fleet
const FADE_STEP = 0.05;
const H3_IN_STEP = 0.06;
const H3_DOWN_STEP = 0.05;
/** The last frame lands at 85% of the pin; the final 15% rests on it. */
const FRAME_RUN_END = 0.85;

/* -------------------------------------------------------------------------- *
 * Idle cursor parallax — organic depth on the sky (desktop, motion-safe only).
 * -------------------------------------------------------------------------- */

/** Peak drift: ±10px across X, ±6px across Y, eased toward the pointer. */
const PARALLAX_MAX_X = 10;
const PARALLAX_MAX_Y = 6;
/** Slight overscan so the drift never exposes the field behind the frame. */
const PARALLAX_SCALE = 1.03;
/** quickTo follow-through — slow enough to read as atmosphere, not a cursor. */
const PARALLAX_DURATION_S = 0.9;

/** Path of a single frame in the sequence (0-based index → 1-based filename). */
const frameSrc = (index: number): string =>
  `/frames/frame_${String(index + 1).padStart(4, '0')}.jpg`;

const clampFrame = (value: number): number =>
  Math.min(LAST_FRAME, Math.max(FIRST_FRAME, Math.round(value)));

interface JetCanvasScrollerProps {
  className?: string;
}

/**
 * Jesko Jets / Apple-style scroll scrubber.
 *
 * The 179-frame high-altitude-to-cabin sequence is drawn to one full-bleed HTML5
 * `<canvas>` while a GSAP ScrollTrigger pins the viewport of the
 * `min-h-[500vh]` hero track (`pinSpacing: true`) and scrubs a `{ frame }`
 * index object from 0 → 178 with `scrub: 0.8` and `snap: 'frame'` (GSAP's
 * core snap modifier, which rounds the `frame` property to a whole number on
 * every render). Editorial type is anchored to the flanks — micro-tags, serif
 * titles and narrative snippets hug the edges so the centre aisle, avionics
 * and sky stay clear — and fades in and out at exact progress intervals; the
 * scene then fades down into the Fleet Showcase.
 *
 * The canvas and its radial vignette are page-fixed with a negative z-index so
 * they paint below the static sections inside `main` while the track's
 * typography floats above them. Under `prefers-reduced-motion` nothing pins or
 * scrubs: the hero is a static, fully composed first screen showing frame 1.
 */
export function JetCanvasScroller({ className }: JetCanvasScrollerProps = {}) {
  const reduced = useReducedMotion();

  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vignetteRef = useRef<HTMLDivElement | null>(null);
  const tintRef = useRef<HTMLDivElement | null>(null);
  const band1Ref = useRef<HTMLDivElement | null>(null);
  const band2Ref = useRef<HTMLDivElement | null>(null);
  const band3Ref = useRef<HTMLDivElement | null>(null);

  /** The active frame index scrubbed by ScrollTrigger ({ frame: 0 → 178 }). */
  const frameState = useRef<{ frame: number }>({ frame: FIRST_FRAME });
  /** Every frame created so far, keyed by its 0-based index. */
  const imagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  /** Frames decoded so far, mirrored onto the track for readiness probes. */
  const loadedRef = useRef(0);
  /** Last successfully painted image — a stale-but-never-blank fallback. */
  const paintedRef = useRef<HTMLImageElement | null>(null);
  /** Canvas bitmap size in CSS pixels, refreshed on resize. */
  const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const isDrawable = (img: HTMLImageElement | null | undefined): img is HTMLImageElement =>
    Boolean(img && img.complete && img.naturalWidth > 0);

  /** Exact frame if it is ready, otherwise the nearest ready neighbour. */
  const resolveDrawable = (target: number): HTMLImageElement | null => {
    const exact = imagesRef.current.get(target);
    if (isDrawable(exact)) return exact;

    for (let delta = 1; delta <= TOTAL_FRAMES; delta += 1) {
      const before = imagesRef.current.get(target - delta);
      if (isDrawable(before)) return before;
      const after = imagesRef.current.get(target + delta);
      if (isDrawable(after)) return after;
    }

    return isDrawable(paintedRef.current) ? paintedRef.current : null;
  };

  /** Draw the current (interpolated, snapped) frame with `cover` math. */
  const draw = (): void => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { width, height } = sizeRef.current;
    if (width <= 0 || height <= 0) return;

    const img = resolveDrawable(clampFrame(frameState.current.frame));
    if (!img) return;

    const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;

    ctx.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    paintedRef.current = img;
  };

  /** Resize the backing store to the viewport (DPR-capped) and repaint. */
  const sizeCanvas = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width || window.innerWidth);
    const cssHeight = Math.max(1, rect.height || window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    sizeRef.current = { width: canvas.width / dpr, height: canvas.height / dpr };
    canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);

    draw();
  };

  /**
   * Mirror preload progress onto the pinned track as data attributes rather than
   * rendered nodes: a visible progress element would reflow the 500vh track and
   * break the pin, so the contract is attribute-only — `data-frames-loaded`
   * counts decoded frames and `data-frames-ready` flips true on the last one.
   */
  const publishPreloadState = (): void => {
    const section = sectionRef.current;
    if (!section) return;
    section.dataset.framesLoaded = String(loadedRef.current);
    section.dataset.framesReady = loadedRef.current >= TOTAL_FRAMES ? 'true' : 'false';
  };

  /** Create (once) the `Image` for a frame and register its redraw hook. */
  const loadFrame = (index: number): void => {
    if (imagesRef.current.has(index)) return;

    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      loadedRef.current += 1;
      publishPreloadState();
      // Repaint the moment a frame lands, so a scrub that raced ahead of the
      // loader settles onto the right image as soon as it is available.
      if (typeof img.decode === 'function') {
        img.decode().then(draw, draw);
      } else {
        draw();
      }
    };
    imagesRef.current.set(index, img);
    img.src = frameSrc(index);
  };

  /* 1. Backing-store sizing + repaint on viewport changes. */
  useEffect(() => {
    sizeCanvas();

    const handleResize = () => {
      sizeCanvas();
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
    // sizeCanvas/draw only read refs, so the instance captured here stays valid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 2. Eager preload of the first 30 frames, then a lazy background drain that
        retains the whole sequence. The eager burst keeps the first viewport's
        paint instant; the drain continues until every frame is resident, so a
        scrub anywhere in the track never waits on the network. */
  useEffect(() => {
    publishPreloadState();

    const eagerEnd = Math.min(FIRST_FRAME + EAGER_FRAMES - 1, LAST_FRAME);
    for (let index = FIRST_FRAME; index <= eagerEnd; index += 1) {
      loadFrame(index);
    }

    let cancelled = false;
    let next = eagerEnd + 1;
    let timerId: number | undefined;

    const bufferBatch = () => {
      if (cancelled || next > LAST_FRAME) return;

      const batchEnd = Math.min(next + LAZY_BATCH_SIZE - 1, LAST_FRAME);
      for (; next <= batchEnd; next += 1) {
        loadFrame(next);
      }

      timerId = window.setTimeout(bufferBatch, LAZY_BATCH_INTERVAL_MS);
    };

    timerId = window.setTimeout(bufferBatch, LAZY_START_DELAY_MS);

    return () => {
      cancelled = true;
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 3. GSAP context — pin, frame scrub, band choreography, fleet hand-off. */
  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    const vignette = vignetteRef.current;
    const tint = tintRef.current;
    const band1 = band1Ref.current;
    const band2 = band2Ref.current;
    const band3 = band3Ref.current;
    if (!section || !viewport || !canvas || !vignette || !tint || !band1 || !band2 || !band3) return;

    // Deterministic start: StrictMode remounts and reduced-motion flips both
    // rebuild this context, and the scrub must always begin at the first frame.
    frameState.current.frame = FIRST_FRAME;
    sizeCanvas();
    draw();

    if (reduced) return;

    const context = gsap.context(() => {
      /* One scrubbed timeline owns the whole track: the frame index, the
         headline bands, and the pin that holds the viewport while they play.
         The frame child spans duration 1, so every position below is an exact
         progress value. `snap: 'frame'` is GSAP's core snap modifier, which
         rounds the `frame` property to a whole number on every render;
         `onUpdate` repaints the canvas on each scrubbed tick. */
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom', // pin distance = track height − viewport
          scrub: 0.8,
          pin: viewport,
          // pinSpacing: true reserves the pin distance inside the min-h track,
          // so the viewport stays pinned for the full 500vh (100vh content +
          // 400vh reserved = exactly min-h-[500vh]) and the section cannot
          // release prematurely or leave a dead zone before #fleet.
          pinSpacing: true,
          anticipatePin: 1,
        },
      });

      // The frame child ends at 0.85, so the final frame holds for the last 15%
      // of the pin — the operator rests at the cabin threshold before #fleet.
      timeline.to(
        frameState.current,
        { frame: LAST_FRAME, duration: FRAME_RUN_END, snap: 'frame', onUpdate: draw },
        0,
      );

      /* Editorial band layers — exact progress fractions of the pinned track.
         Each band is one flank-anchored layer, so a single autoAlpha tween
         choreographs its micro-tag, title and narrative together. */
      timeline.to(
        band1,
        { autoAlpha: 0, duration: FADE_STEP, ease: 'power2.in' },
        H1_FADE_OUT_START,
      );
      timeline.to(
        band2,
        { autoAlpha: 1, duration: FADE_STEP, ease: 'power2.out' },
        H2_FADE_IN_START,
      );
      timeline.to(
        band2,
        { autoAlpha: 0, duration: FADE_STEP, ease: 'power2.in' },
        H2_FADE_OUT_START,
      );
      timeline.fromTo(
        band3,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: H3_IN_STEP,
          ease: 'power2.out',
          immediateRender: false,
        },
        H3_FADE_IN_START,
      );
      timeline.to(
        band3,
        { autoAlpha: 0, y: 72, duration: H3_DOWN_STEP, ease: 'power2.in' },
        H3_FADE_DOWN_START,
      );

      /* Sky exit — as #fleet enters, the sky cross-fades 1 → 0.15 → 0 while
         a dusk tint (transparent → #0B0D10) breathes in behind the arriving
         glass cards and then out again. The hand-off reads as a descent
         through dusk atmosphere into twilight, never a cut to black. */
      const skyExit = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: '#fleet',
          start: 'top bottom',
          end: 'top 30%',
          scrub: 0.8,
        },
      });
      skyExit.to([canvas, vignette], { autoAlpha: 0.15, duration: 0.5 }, 0);
      skyExit.to([canvas, vignette], { autoAlpha: 0, duration: 0.35 }, 0.5);
      skyExit.fromTo(
        tint,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.5, immediateRender: false },
        0.1,
      );
      skyExit.to(tint, { autoAlpha: 0, duration: 0.15 }, 0.85);

      /* Opening statement entrance — only when the deck boots at the top; a
         reload restored mid-track must honour the scrub, not replay it. */
      if (band1 && window.scrollY < window.innerHeight * 0.25) {
        gsap.from(band1, {
          autoAlpha: 0,
          y: 18,
          duration: 1.05,
          ease: 'power3.out',
          delay: 0.12,
        });
      }
    });

    // Catch any layout that settled after mount (dev HMR fires no `load`).
    ScrollTrigger.refresh();

    return () => context.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  /* Idle cursor parallax — the sky drifts a few pixels against the pointer so
     the pinned frame reads as a window with depth rather than a flat plate.
     Desktop and motion-safe only: coarse pointers and reduced-motion operators
     never attach a listener. Nothing here touches React state — the canvas ref
     plus `gsap.quickTo` means one transform write per pointer move and zero
     re-renders. A 3% overscan keeps the ±10px / ±6px drift from ever exposing
     the field behind the frame. */
  useEffect(() => {
    if (reduced) return;

    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia('(pointer: coarse)').matches) return;

    gsap.set(canvas, { scale: PARALLAX_SCALE });
    const driftX = gsap.quickTo(canvas, 'x', {
      duration: PARALLAX_DURATION_S,
      ease: 'power3.out',
    });
    const driftY = gsap.quickTo(canvas, 'y', {
      duration: PARALLAX_DURATION_S,
      ease: 'power3.out',
    });

    const handlePointerMove = (event: PointerEvent): void => {
      driftX((event.clientX / window.innerWidth - 0.5) * (PARALLAX_MAX_X * 2));
      driftY((event.clientY / window.innerHeight - 0.5) * (PARALLAX_MAX_Y * 2));
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      gsap.killTweensOf(canvas, 'x,y');
      gsap.set(canvas, { x: 0, y: 0, scale: 1 });
    };
  }, [reduced]);

  const layerClass = reduced ? 'absolute' : 'fixed';

  return (
    <>
      {/* Frame scrubber — fills the pinned viewport. The negative z-index keeps
          it below the static sections inside `main`; the radial vignette
          darkens only the edges so flank type stays legible while the central
          camera path stays vivid. */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`${layerClass} inset-0 -z-10 w-full h-screen object-cover`}
      />
      <div
        ref={vignetteRef}
        aria-hidden="true"
        className={`${layerClass} inset-0 -z-[5] pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]`}
      />
      {/* Dusk tint — breathes in behind the glass fleet cards as the sky
          exits, then out, so the hand-off lands on the deck's own obsidian
          with no background-color jump. */}
      <div
        ref={tintRef}
        aria-hidden="true"
        className={`${layerClass} inset-0 -z-[5] pointer-events-none opacity-0 invisible bg-gradient-to-b from-transparent via-[#0B0D10]/80 to-[#0B0D10]`}
      />

      {/* Pinned hero track — 500vh of scroll scrubs the 179-frame sequence. */}
      <section
        ref={sectionRef}
        className={`relative w-full ${reduced ? '' : 'min-h-[500vh]'} ${className ?? ''}`}
      >
        <div ref={viewportRef} className="relative h-screen w-full">
          {/* Band 1 — 0–25% · cabin push: bottom-left editorial stack,
              narrative snippet opposite on the bottom-right flank. */}
          <div data-band="1" ref={band1Ref} className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 px-6 md:px-12 pb-8 md:pb-10">
              <div>
                <h2 className="font-serif tracking-tight text-4xl md:text-5xl font-light text-white frame-ink-strong">
                  Bespoke Cabins
                </h2>
                <p className="mt-3 tracking-[0.25em] text-xs font-medium text-on-surface bg-gradient-to-t from-black/90 via-black/65 to-black/45 px-3 py-1.5 rounded-xl backdrop-blur-sm drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] frame-ink-soft">
                  PHASE 01 // PJP CABIN ARCHITECTURE
                </p>
              </div>
              {/* Flank copy rides a localized gradient backplate — the same
                  treatment Band 2 uses. Raw `text-white/80` over the sunlit
                  cabin measured 2.8:1 at its worst pixel; the scrim pulls the
                  nominal surface down far enough for the AA 4.5:1 profile
                  without greying the aisle or lifting the whole frame. Ink is
                  `on-surface`, not `#fff` — the deck's brightest tone is
                  champagne and pure white also trips the grade ceiling. */}
              <p className="max-w-[11rem] md:max-w-xs text-right text-xs md:text-sm leading-relaxed text-on-surface bg-gradient-to-t from-black/90 via-black/65 to-black/45 p-4 rounded-2xl backdrop-blur-sm drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] frame-ink-soft">
                Hand-stitched European leather. Whispered acoustics.
              </p>
            </div>
          </div>

          {/* Band 2 — 40–65% · flight deck: the stack is anchored low so the
              type rests over the dark instrument deck and lower console rather
              than the washed-out windshield clouds. A localized gradient
              backplate keeps it razor-sharp over vivid sunset frames. */}
          <div
            data-band="2"
            ref={band2Ref}
            className="absolute inset-0 pointer-events-none opacity-0 invisible"
          >
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 px-6 md:px-12 pb-8 md:pb-10">
              <div className="bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 rounded-2xl backdrop-blur-sm drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                <p className="text-xs tracking-[0.25em] text-amber-400">
                  PHASE 02 // PJP FLIGHT DECK
                </p>
                <h2 className="mt-3 max-w-md font-serif text-4xl md:text-5xl text-white">
                  PJP Avionics
                </h2>
              </div>
              <p className="max-w-[12rem] md:max-w-xs text-right text-xs md:text-sm leading-relaxed text-white/80 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 rounded-2xl backdrop-blur-sm drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                Continuous synthetic vision with heads-up command.
              </p>
            </div>
          </div>

          {/* Band 3 — 75–95% · sky punch-through: centre-bottom, lowered so
              the horizon stays open. */}
          <div
            data-band="3"
            ref={band3Ref}
            className="absolute inset-0 pointer-events-none opacity-0 invisible"
          >
            <div className="absolute inset-x-0 bottom-[12%] flex flex-col items-center gap-3 md:gap-4 px-6 text-center">
              {/* Band 3 rides the deck's established backplate language — the same
                  frosted dark-glass scrim Bands 1 and 2 use. Against the
                  high-key cabin interior the 179-frame sequence leaves under the
                  centre-bottom, bare ink measured 2.12:1 on the title and 2.54:1
                  on the subtitle; the gradient pulls the nominal surface down
                  without touching the frames themselves or the horizon the band
                  exists to reveal. `w-fit` keeps the plate tight to the type
                  rather than washing a band across the full viewport. */}
              <div className="w-fit max-w-full flex flex-col items-center gap-3 md:gap-4 bg-gradient-to-t from-black/90 via-black/70 to-black/50 px-8 py-6 rounded-2xl backdrop-blur-sm drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                <h2 className="text-5xl md:text-7xl font-extralight tracking-[0.15em] text-white frame-ink-strong">
                  THE HORIZON AWAITS
                </h2>
                <p className="text-xs md:text-sm tracking-[0.2em] font-medium text-amber-200/90 frame-ink-soft">
                  PJP // PRIVATE JET PILOTS // Unrestricted Global Reach
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}



