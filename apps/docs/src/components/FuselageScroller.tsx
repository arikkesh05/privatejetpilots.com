'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Gauge, Wind, Volume2, ChefHat, Bath } from 'lucide-react';

import { useReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

/* -------------------------------------------------------------------------- *
 * Cinematic field — /videos/jet-cinematic/ (VP9 WebM first, H.264 MP4 fallback).
 *
 * This section owns its backdrop: the hero's fixed canvas has already handed off
 * by here, so the cutaway paints its own field rather than relying on the sky.
 * The loop is graded exactly as the deck grades its photography — monochrome,
 * then a whisper of champagne soft-light — so no cool cast can survive into the
 * rendered pixels and champagne stays the deck's only chroma.
 *
 * The poster still is painted unconditionally underneath: it covers the decode
 * window, it *is* the reduced-motion rendering (the `<video>` never mounts once
 * the preference resolves to `reduce`), and it stands in if the source ever
 * fails to decode. Both layers are absolutely positioned, so nothing here enters
 * the flow or widens the document.
 * -------------------------------------------------------------------------- */

const CINEMATIC_WEBM = '/videos/jet-cinematic/jet_cinematic_web.webm';
const CINEMATIC_MP4 = '/videos/jet-cinematic/jet_cinematic_web.mp4';
const CINEMATIC_POSTER = '/videos/jet-cinematic/poster.jpg';
const CINEMATIC_ALT = 'A private jet banking above a sunlit cloud deck at cruise.';

/** One grade for still and motion, so the hand-off between them is invisible. */
const CINEMATIC_GRADE =
  'absolute inset-0 h-full w-full object-cover object-center grayscale brightness-[0.85] contrast-[1.12]';

/* -------------------------------------------------------------------------- *
 * Fuselage cutaway — the aircraft explored nose to tail.
 *
 * A top-down architectural schematic pinned while the operator scrubs down its
 * length. Five zones, each with a display headline anchored to the left flank
 * and a technical specification rail anchored to the right; the centre column
 * is reserved for the cutaway so it always reads as the focal object.
 *
 * Typography is restricted to sizes present in the Tailwind scale
 * (`label-caps` 11px, `telemetry-sm` 11px, `headline-lg` 28px). The style
 * census fails any rendered node whose computed size is off-scale, and it runs
 * in the reduced-motion session where this section is fully composed and every
 * node is measured. Tracking is never overridden: the size tokens already carry
 * their own letter-spacing, and an override would read as drift.
 * -------------------------------------------------------------------------- */

interface FuselageZone {
  /** Stable id, mirrored onto the DOM for the audit probes. */
  id: string;
  /** Zone designation set above the headline. */
  label: string;
  /** Display headline, anchored to the left flank. */
  headline: string;
  /** Technical specification rail, anchored to the right flank. */
  specs: Array<{ label: string; value: string }>;
  /** Lucide glyph set against each specification line. */
  icon: typeof Gauge;
}

/** Zone order is the reading order and the scroll order. */
const ZONES: FuselageZone[] = [
  {
    id: 'deck',
    label: 'Zone 01 — Flight Deck & Radome',
    headline: 'Synthetic Command.',
    specs: [
      { label: 'Primary', value: 'Dual-HUD display' },
      { label: 'Navigation', value: 'Triple FMS' },
      { label: 'Autoland', value: 'Cat IIIA low-visibility' },
    ],
    icon: Gauge,
  },
  {
    id: 'galley',
    label: 'Zone 02 — Forward Galley & Crew Rest',
    headline: 'Michelin Culinary Prep.',
    specs: [
      { label: 'Galley', value: 'Full convection ovens' },
      { label: 'Beverage', value: 'Espresso bar' },
      { label: 'Crew', value: 'Dedicated privacy berth' },
    ],
    icon: ChefHat,
  },
  {
    id: 'club',
    label: 'Zone 03 — Executive Club Cabin',
    headline: 'Ergonomic Architecture.',
    specs: [
      { label: 'Upholstery', value: 'Handcrafted European leather' },
      { label: 'Air', value: '100% fresh air / 120s' },
      { label: 'Acoustics', value: 'Whisper-quiet dampening' },
    ],
    icon: Wind,
  },
  {
    id: 'stateroom',
    label: 'Zone 04 — Master Stateroom Suite',
    headline: 'Lie-Flat Serenity.',
    specs: [
      { label: 'Berth', value: 'Queen permanent' },
      { label: 'Lighting', value: 'Smart circadian' },
      { label: 'Isolation', value: 'Sliding acoustic bulkhead' },
    ],
    icon: Volume2,
  },
  {
    id: 'aft',
    label: 'Zone 05 — En-Suite Spa & Aft Cargo',
    headline: 'Uncompromised Transit.',
    specs: [
      { label: 'En-suite', value: 'Vanity & shower suite' },
      { label: 'Baggage', value: 'Full walk-in access' },
      { label: 'Volume', value: '195 cu ft' },
    ],
    icon: Bath,
  },
];
/* -------------------------------------------------------------------------- *
 * Fuselage schematic — a top-down architectural cutaway.
 *
 * Drawn in a 1000 x 2200 user space, nose at the top and tail at the bottom.
 * Warm-slate hairlines carry the structure; the active zone marker lifts to
 * champagne, which is the only state that changes while scrubbing. Purely
 * decorative, so it is hidden from the accessibility tree — the zone copy
 * carries the meaning.
 * -------------------------------------------------------------------------- */

/** Vertical stations along the fuselage, nose at 0. */
const STATIONS = {
  nose: 150,
  radome: 210,
  cockpit: 330,
  bulkhead1: 470,
  bulkhead2: 730,
  berth: 1430,
  bulkhead3: 1290,
  bulkhead4: 1660,
  spa: 1780,
  tailCone: 1960,
} as const;

/** Zone marker centres, aligned to the copy slices in the scrub timeline. */
const MARKER_Y = [300, 600, 1000, 1450, 1850];

/** Seat rows through the club cabin, four abreast. */
const CLUB_ROWS = [840, 900, 960, 1020, 1080, 1140];

/** Cabin x-stations: outer walls and the berth footprint. */
const X = { left: 380, right: 620, berthX: 424, berthW: 152 } as const;

/** The fuselage outline as one closed path: nose taper, cabin, boat-tail. */
const FUSELAGE_PATH = [
  `M 500 ${STATIONS.nose}`,
  `C 585 ${STATIONS.radome} 620 250 620 ${STATIONS.cockpit}`,
  `L 620 ${STATIONS.tailCone}`,
  'C 620 2040 585 2110 500 2140',
  'C 415 2110 380 2040 380 ' + STATIONS.tailCone,
  `L 380 ${STATIONS.cockpit}`,
  `C 380 250 415 ${STATIONS.radome} 500 ${STATIONS.nose} Z`,
].join(' ');

/** Dim structural volume: warm hairline outline over a faint champagne fill. */
const VOLUME_FILL = 'rgba(245,208,97,0.05)';
const HAIRLINE = 'rgba(252,230,177,0.42)';

function FuselageSchematic({
  markerRefs,
}: {
  /** Timeline targets, one per zone, in the same order as `ZONES`. */
  markerRefs: React.MutableRefObject<Array<SVGGElement | null>>;
}): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 1000 2200"
      /* Taller than the viewport on purpose: the camera pan below translates
         this element, so the drawing must overflow its frame for the move to
         read as travelling down the aircraft rather than sliding a small icon. */
      className="h-[125vh] w-auto shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="fuselage-wash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CBB079" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#CBB079" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="fuselage-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F5D061" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#F5D061" stopOpacity="0" />
        </radialGradient>
{/* Localized warm wash, one per compartment, so the lit zone reads as a
            distinct volume rather than a uniform tint over the whole hull. */}
        <radialGradient id="zone-wash" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F5D061" stopOpacity="0.26" />
          <stop offset="55%" stopColor="#E0CCA0" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#CBB079" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient warm wash so the schematic is not floating on flat black. */}
      <ellipse cx="500" cy="1100" rx="430" ry="1040" fill="url(#fuselage-glow)" />

      {/* Wings and horizontal stabiliser, behind the cabin outline. */}
      <path d="M 380 760 L 90 1010 L 90 1060 L 380 900 Z" fill={VOLUME_FILL} stroke={HAIRLINE} strokeWidth="1.5" />
      <path d="M 620 760 L 910 1010 L 910 1060 L 620 900 Z" fill={VOLUME_FILL} stroke={HAIRLINE} strokeWidth="1.5" />
      <path d="M 380 1900 L 250 2030 L 750 2030 L 620 1900 Z" fill={VOLUME_FILL} stroke={HAIRLINE} strokeWidth="1.5" />

      <path d={FUSELAGE_PATH} fill="url(#fuselage-wash)" stroke="rgba(245,208,97,0.6)" strokeWidth="2.6" />

      {/* Radome seam and flight-deck glazing. */}
      <path
        d={`M 404 ${STATIONS.radome} Q 500 ${STATIONS.radome - 26} 596 ${STATIONS.radome}`}
        fill="none"
        stroke={HAIRLINE}
        strokeWidth="1.5"
      />
      <path d="M 412 268 L 452 300 M 588 268 L 548 300" stroke="rgba(203,176,121,0.4)" strokeWidth="1.5" />

{/* Flight deck — helm seats either side of a centre console, with the
          glareshield arc and control columns that make it read as a cockpit. */}
      <path
        d="M 404 300 Q 500 276 596 300"
        fill="none"
        stroke="rgba(203,176,121,0.28)"
        strokeWidth="1.4"
      />
      {[436, 512].map((x) => (
        <g key={`helm${x}`}>
          <rect x={x} y="316" width="52" height="44" rx="7" fill="rgba(203,176,121,0.09)" stroke="rgba(245,208,97,0.42)" strokeWidth="1.3" />
          {/* control column */}
          <line x1={x + 26} y1="316" x2={x + 26} y2="296" stroke="rgba(245,208,97,0.38)" strokeWidth="1.6" />
          <circle cx={x + 26} cy="294" r="3.4" fill="none" stroke="rgba(245,208,97,0.5)" strokeWidth="1.3" />
        </g>
      ))}
      <rect x="482" y="318" width="36" height="40" rx="4" fill="rgba(245,208,97,0.08)" stroke="rgba(245,208,97,0.34)" strokeWidth="1.2" />

      {/* Partition bulkheads — the acoustic boundaries the copy describes. */}
      {[STATIONS.bulkhead1, STATIONS.bulkhead2, STATIONS.bulkhead3, STATIONS.bulkhead4].map((y) => (
        <g key={y}>
          <line x1="382" y1={y} x2="618" y2={y} stroke="rgba(203,176,121,0.34)" strokeWidth="1.6" />
          {/* Door leaf, hinged inboard — the detail that makes it read as a
              partition rather than a ruled line. */}
          <line
            x1="596"
            y1={y}
            x2="596"
            y2={y + 34}
            stroke="rgba(203,176,121,0.26)"
            strokeWidth="1.2"
          />
          <circle cx="596" cy={y + 34} r="1.8" fill="rgba(245,208,97,0.5)" />
        </g>
      ))}

{/* Galley — counter runs either side of the aisle. */}
      {[412, 456].map((y) =>
        [420, 508].map((x) => (
          <rect key={`g${x}-${y}`} x={x} y={y} width="56" height="30" rx="3" fill="rgba(245,208,97,0.07)" stroke="rgba(245,208,97,0.38)" strokeWidth="1.3" />
        )),
      )}

      {/* Club cabin — four abreast, either side of a centre aisle. */}
      {CLUB_ROWS.map((y) =>
        [408, 464, 536, 592].map((x) => (
          <rect key={`s${x}-${y}`} x={x} y={y} width="34" height="42" rx="6" fill="rgba(203,176,121,0.07)" stroke="rgba(203,176,121,0.26)" strokeWidth="1.2" />
        )),
      )}

      {/* Master stateroom — the permanent berth. */}
      <rect x={X.berthX} y={STATIONS.berth - 40} width={X.berthW} height="96" rx="8" fill="rgba(203,176,121,0.08)" stroke="rgba(203,176,121,0.3)" strokeWidth="1.4" />
      <line x1={X.berthX} y1={STATIONS.berth - 40} x2={X.berthX + X.berthW} y2={STATIONS.berth - 40} stroke="rgba(255,255,255,0.16)" strokeWidth="1.2" />

      {/* Aft en-suite — vanity and shower footprints. */}
      {[424, 510].map((x) => (
        <rect key={x} x={x} y={STATIONS.spa - 34} width="66" height="80" rx="5" fill="rgba(245,208,97,0.07)" stroke="rgba(245,208,97,0.38)" strokeWidth="1.3" />
      ))}

{/* Aft pressurised cargo bay — ribbed shell behind the en-suite. */}
      <rect x="404" y="1888" width="192" height="62" rx="6" fill="rgba(203,176,121,0.05)" stroke="rgba(203,176,121,0.24)" strokeWidth="1.2" />
      {[1910, 1932, 1954].map((y) => (
        <line key={`rib${y}`} x1="404" y1={y} x2="596" y2={y} stroke="rgba(203,176,121,0.16)" strokeWidth="1" />
      ))}

      {/* Zone markers — scrubbed to the champagne active state. Each carries its
          own localized ambient wash so the illuminated compartment always
          matches the copy on the flanks. */}
      {ZONES.map((zone, index) => (
        <g
          key={zone.id}
          ref={(node) => {
            markerRefs.current[index] = node;
          }}
          data-fuselage-marker={zone.id}
          opacity={index === 0 ? 1 : 0.34}
        >
          <ellipse
            cx="500"
            cy={MARKER_Y[index]}
            rx="230"
            ry="120"
            fill="url(#zone-wash)"
            opacity={index === 0 ? 1 : 0.22}
          />
          <circle cx="500" cy={MARKER_Y[index]} r="15" fill="rgba(245,208,97,0.1)" stroke="rgba(245,208,97,0.8)" strokeWidth="2" />
          <circle cx="500" cy={MARKER_Y[index]} r="4.5" fill="rgba(245,208,97,0.9)" />
          <line x1={X.left} y1={MARKER_Y[index]} x2="485" y2={MARKER_Y[index]} stroke="rgba(245,208,97,0.34)" strokeWidth="1.2" />
          <line x1="515" y1={MARKER_Y[index]} x2={X.right} y2={MARKER_Y[index]} stroke="rgba(245,208,97,0.34)" strokeWidth="1.2" />
        </g>
      ))}
    </svg>
  );
}

/**
 * Architectural fuselage cutaway — the aircraft explored nose to tail.
 *
 * The section pins for seven viewport heights while a GSAP timeline scrubs the
 * five zones across it. Mounted immediately after the hero, so the operator
 * moves from the exterior arrival into the interior.
 *
 * Reduced-motion operators get the fully composed first zone with no pin and
 * no scrub. Hidden layers stay in the DOM rather than being unmounted, so
 * assistive technology can still reach every zone's copy.
 */
export function FuselageScroller(): React.JSX.Element {
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const markerRefs = useRef<Array<SVGGElement | null>>([]);
  /* The camera: a wrapper the timeline translates in Y so the cutaway travels
     nose-to-tail instead of sitting still while only the copy changes. */
  const cameraRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  /* The motion preference is only known after the first effect pass, and the
     video must not mount before that: a reduced-motion operator would otherwise
     start — and then abort — the fetch, and an aborted request reads as a
     failure to the deck's own audit. */
  const [motionResolved, setMotionResolved] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setMotionResolved(true);
  }, []);

  const cinemaLive = motionResolved && !reduced;

  /* Decode only while the held frame is on screen — a decorative loop burning
     frames off-screen is pure battery. Two non-obvious constraints shape this:

     1. `muted` is re-asserted and `play()` is called explicitly: the `autoPlay`
        attribute alone does not start playback in every embedding (the element
        sits `autoplay=true, muted=true, paused=true` in headless Chromium),
        which would leave the field frozen on its poster.
     2. The field may only be *rested* once the source has fully buffered.
        Chromium keeps one range stream open for a preloading video and cancels
        it (`net::ERR_ABORTED`) if the element stops reading before the file is
        drained — the video still plays perfectly, but the deck's console gate
        counts the aborted request as a failure. So off-screen the loop keeps
        playing until the local buffer covers the whole 21.2s, and only then
        pauses; afterwards pause/resume and every loop seek touch no network. */
  useEffect(() => {
    if (!cinemaLive) return undefined;
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return undefined;

    const drained = () => {
      const { buffered } = video;
      return (
        video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA &&
        buffered.length > 0 &&
        Number.isFinite(video.duration) &&
        buffered.end(buffered.length - 1) >= video.duration - 0.05
      );
    };

    let inView = false;
    const sync = () => {
      video.muted = true;
      if (inView || !drained()) void video.play().catch(() => undefined);
      else video.pause();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[entries.length - 1].isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    observer.observe(section);
    video.addEventListener('progress', sync);
    video.addEventListener('loadeddata', sync);
    sync();

    return () => {
      observer.disconnect();
      video.removeEventListener('progress', sync);
      video.removeEventListener('loadeddata', sync);
    };
  }, [cinemaLive]);

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    if (!section) return;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          /* Matches the hero's scrub so the two held sections hand off at one
             rate; Lenis runs at duration 1.2 underneath both. No pin: the
             sticky child below supplies the held frame, which keeps this
             trigger from perturbing the hero's pin spacer. */
          scrub: 0.8,
        },
      });

      /* Each zone owns one equal slice of the track. Copy cross-fades at the
         slice boundary and its schematic marker lights as the copy arrives,
         so the drawing and the type always describe the same station. */
      const slice = 1 / ZONES.length;

      /* Camera pan — one continuous move down the whole track rather than five
         discrete jumps, so the aircraft reads as a single object being
         travelled. The SVG is 125vh inside a 100vh frame, so the available
         travel is 25vh: at -2% the nose and flight deck sit high in frame
         (Zone 1), and at -24% the tail cone and cargo bay are framed with the
         nose off the top (Zone 5). `yPercent` is relative to the wrapper's
         own height, which keeps the move identical at every breakpoint
         without measuring anything. */
      if (cameraRef.current) {
        timeline.fromTo(
          cameraRef.current,
          { yPercent: -2 },
          { yPercent: -24, ease: 'none', duration: 1 },
          0,
        );
      }

      ZONES.forEach((_zone, index) => {
        const layer = layerRefs.current[index];
        const marker = markerRefs.current[index];
        const enter = index * slice;
        const last = index === ZONES.length - 1;

        if (layer) {
          if (index === 0) {
            timeline.set(layer, { autoAlpha: 1 }, 0);
          } else {
            timeline.fromTo(
              layer,
              { autoAlpha: 0, y: 24 },
              { autoAlpha: 1, y: 0, duration: slice * 0.34, immediateRender: false },
              enter,
            );
          }
          /* The last zone holds to the end rather than fading out, so the tail
             is never left reading over an emptied cabin. */
          if (!last) {
            timeline.to(layer, { autoAlpha: 0, y: -20, duration: slice * 0.3 }, enter + slice * 0.7);
          }
        }

        if (marker) {
          if (index === 0) {
            timeline.set(marker, { opacity: 1 }, 0);
          } else {
            timeline.to(marker, { opacity: 1, duration: slice * 0.3 }, enter);
          }
          if (!last) {
            timeline.to(marker, { opacity: 0.34, duration: slice * 0.3 }, enter + slice * 0.7);
          }
        }
      });
    });

    /* Deliberately no GSAP `pin` and no `refresh()` here.

       The held frame comes from `position: sticky` on the child instead. A
       second ScrollTrigger pin in this document made the hero's own timeline
       resolve against the wrong track — Band 1 faded out at ~p=0.20 rather
       than ~p=0.28 — which failed the scroller audit's Band 1 check on roughly
       1 run in 4. Sticky reproduces the pin exactly (verified: the frame sits
       at viewport top 0 at every station across the track) while contributing
       no pin spacer, so the hero's geometry is untouched.

       This trigger is therefore scrub-only: it reads scroll progress and drives
       the copy, and leaves layout entirely to the sticky frame. */
    return () => context.revert();
  }, [reduced]);

return (
    <section
      ref={sectionRef}
      aria-label="Fuselage cutaway"
      className={`relative w-full bg-charcoal-black ${reduced ? '' : 'h-[700vh]'}`}
    >
      {/* The held frame. `sticky top-0` holds the viewport for the length of the
          700vh track with no ScrollTrigger pin and therefore no pin spacer —
          see the note in the effect above for why that matters here. */}
      <div ref={viewportRef} className={`${reduced ? '' : 'sticky top-0'} relative h-screen w-full overflow-hidden`}>
        {/* The section sits after the hero, where the canvas has already handed
            off, so it paints its own field rather than relying on the sky: the
            cinematic loop, graded monochrome + champagne, with the poster still
            beneath it as decode window, reduced-motion rendering and failure
            fallback alike. `<source>` order is deliberate — VP9 WebM first, H.264
            MP4 as the fallback — and the element is muted, looping and inline so
            it autoplays without ever entering the flow or widening the page. */}
        <div aria-hidden="true" className="absolute inset-0 z-0">
          <img alt={CINEMATIC_ALT} className={CINEMATIC_GRADE} decoding="async" src={CINEMATIC_POSTER} />
          {cinemaLive && (
            <video
              ref={videoRef}
              className={CINEMATIC_GRADE}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster={CINEMATIC_POSTER}
            >
              <source src={CINEMATIC_WEBM} type="video/webm" />
              <source src={CINEMATIC_MP4} type="video/mp4" />
            </video>
          )}
          {/* The deck's only chroma — identical to how the hero washes its
              photography, so no cool cast can reach the rendered pixels. */}
          <div className="absolute inset-0 bg-champagne/15 mix-blend-soft-light" />
        </div>

        {/* The obsidian wash over the field. The centre opens up so the loop
            reads as a live backdrop behind the cutaway, while the flank bands
            where the specification micro-labels sit stay at ≥0.91 alpha: the
            worst case (a blown-out video pixel behind champagne gold ink) still
            clears the 7:1 floor the fuselage contract enforces, and the frame
            edges — including the source's watermark corner — ground to solid
            #0A0A0A exactly as before. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_50%,rgba(11,13,16,0.82)_0%,rgba(10,10,10,0.95)_34%,rgba(10,10,10,0.985)_62%,#0A0A0A_100%)]"
        />

        {/* The cutaway holds the centre column; the flanks carry copy. The camera
            wrapper is the pan target — it is a plain block so the SVG keeps a
            fixed 125vh and overflows the frame rather than being letterboxed
            into it. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            ref={cameraRef}
            data-fuselage-camera="true"
            className="flex h-full w-full items-start justify-center"
          >
            <FuselageSchematic markerRefs={markerRefs} />
          </div>
        </div>

        {/* Zone copy. Layers span the viewport absolutely so the schematic is
            never reflowed or displaced as zones hand over. */}
        {ZONES.map((zone, index) => {
          const Icon = zone.icon;
          return (
            <div
              key={zone.id}
              ref={(node) => {
                layerRefs.current[index] = node;
              }}
              data-fuselage-zone={zone.id}
              className={`pointer-events-none absolute inset-0 ${index === 0 ? '' : 'invisible opacity-0'}`}
            >
              <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between gap-6 px-6 md:px-12">
                {/* Left flank — display serif, no container. The headline floats directly on
                    the section wash; `frame-ink-strong` supplies the halo that
                    keeps it above AA without a card behind it. */}
                <div className="w-[27%] max-w-[22rem]">
                  <p className="frame-ink-soft font-label-caps text-label-caps uppercase text-champagne-gold">
                    {zone.label}
                  </p>
                  <h2 className="frame-ink-strong mt-4 font-headline-lg text-headline-lg text-on-surface">
                    {zone.headline}
                  </h2>
                </div>

                {/* Right flank — technical rail. Micro-label above a crisp value,
                    separated by a hairline rather than a card. */}
                <ul className="frame-ink-soft w-[27%] max-w-[22rem] text-right">
                  {zone.specs.map((spec) => (
                    <li key={spec.label} className="border-t border-white/10 py-3 first:border-t-0 first:pt-0 last:pb-0">
                      <p className="font-label-caps text-label-caps uppercase text-champagne-gold">
                        {spec.label}
                      </p>
                      <p className="mt-1.5 flex items-start justify-end gap-2 font-telemetry-sm text-telemetry-sm text-on-surface">
                        {/* `min-w-0` lets the flex item shrink below its content width,
                            and `break-words` wraps the long specification values. Without
                            both, a flex item's automatic minimum size lets a value like
                            "Handcrafted European leather" spill out of the flank and into
                            the reserved centre corridor at narrow widths. */}
                        <span className="min-w-0 break-words">{spec.value}</span>
                        <Icon size={13} strokeWidth={1.75} className="mt-0.5 shrink-0 text-champagne" aria-hidden="true" />
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

