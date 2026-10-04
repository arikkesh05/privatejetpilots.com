'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Gauge, Wind, Volume2, ChefHat, Bath } from 'lucide-react';

import { useReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

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
  specs: string[];
  /** Lucide glyph set against each specification line. */
  icon: typeof Gauge;
}

/** Zone order is the reading order and the scroll order. */
const ZONES: FuselageZone[] = [
  {
    id: 'deck',
    label: 'Zone 01 — Flight Deck & Radome',
    headline: 'Synthetic Command.',
    specs: ['Dual-HUD display', 'Triple FMS', 'Cat IIIA low-visibility autoland'],
    icon: Gauge,
  },
  {
    id: 'galley',
    label: 'Zone 02 — Forward Galley & Crew Rest',
    headline: 'Michelin Culinary Prep.',
    specs: ['Full convection ovens', 'Espresso bar', 'Dedicated crew privacy berth'],
    icon: ChefHat,
  },
  {
    id: 'club',
    label: 'Zone 03 — Executive Club Cabin',
    headline: 'Ergonomic Architecture.',
    specs: [
      'Handcrafted European leather',
      '100% fresh air replenishment every 120s',
      'Whisper-quiet acoustic dampening',
    ],
    icon: Wind,
  },
  {
    id: 'stateroom',
    label: 'Zone 04 — Master Stateroom Suite',
    headline: 'Lie-Flat Serenity.',
    specs: [
      'Queen permanent berth',
      'Smart circadian lighting',
      'Sound-isolated sliding acoustic bulkhead',
    ],
    icon: Volume2,
  },
  {
    id: 'aft',
    label: 'Zone 05 — En-Suite Spa & Aft Cargo',
    headline: 'Uncompromised Transit.',
    specs: [
      'Stand-up vanity & shower suite',
      'Full in-flight walk-in baggage access',
      '195 cu ft volume',
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

/** Dim structural volume: hairline outline over a faint warm fill. */
const VOLUME_FILL = 'rgba(255,255,255,0.045)';
const HAIRLINE = 'rgba(255,255,255,0.2)';

function FuselageSchematic({
  markerRefs,
}: {
  /** Timeline targets, one per zone, in the same order as `ZONES`. */
  markerRefs: React.MutableRefObject<Array<SVGGElement | null>>;
}): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 1000 2200"
      className="h-full max-h-[86vh] w-auto"
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
      </defs>

      {/* Ambient warm wash so the schematic is not floating on flat black. */}
      <ellipse cx="500" cy="1100" rx="430" ry="1040" fill="url(#fuselage-glow)" />

      {/* Wings and horizontal stabiliser, behind the cabin outline. */}
      <path d="M 380 760 L 90 1010 L 90 1060 L 380 900 Z" fill={VOLUME_FILL} stroke={HAIRLINE} strokeWidth="1.5" />
      <path d="M 620 760 L 910 1010 L 910 1060 L 620 900 Z" fill={VOLUME_FILL} stroke={HAIRLINE} strokeWidth="1.5" />
      <path d="M 380 1900 L 250 2030 L 750 2030 L 620 1900 Z" fill={VOLUME_FILL} stroke={HAIRLINE} strokeWidth="1.5" />

      <path d={FUSELAGE_PATH} fill="url(#fuselage-wash)" stroke={HAIRLINE} strokeWidth="2" />

      {/* Radome seam and flight-deck glazing. */}
      <path
        d={`M 404 ${STATIONS.radome} Q 500 ${STATIONS.radome - 26} 596 ${STATIONS.radome}`}
        fill="none"
        stroke={HAIRLINE}
        strokeWidth="1.5"
      />
      <path d="M 412 268 L 452 300 M 588 268 L 548 300" stroke="rgba(203,176,121,0.4)" strokeWidth="1.5" />

      {/* Partition bulkheads — the acoustic boundaries the copy describes. */}
      {[STATIONS.bulkhead1, STATIONS.bulkhead2, STATIONS.bulkhead3, STATIONS.bulkhead4].map((y) => (
        <line key={y} x1="382" y1={y} x2="618" y2={y} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="7 9" />
      ))}

{/* Galley — counter runs either side of the aisle. */}
      {[412, 456].map((y) =>
        [420, 508].map((x) => (
          <rect key={`g${x}-${y}`} x={x} y={y} width="56" height="30" rx="3" fill="rgba(255,255,255,0.05)" stroke={HAIRLINE} strokeWidth="1.2" />
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
        <rect key={x} x={x} y={STATIONS.spa - 34} width="66" height="80" rx="5" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
      ))}

      {/* Zone markers — scrubbed to the champagne active state. */}
      {ZONES.map((zone, index) => (
        <g
          key={zone.id}
          ref={(node) => {
            markerRefs.current[index] = node;
          }}
          opacity={index === 0 ? 1 : 0.34}
        >
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
  const reduced = useReducedMotion();

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
            off, so it paints its own field rather than relying on the sky. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_50%,rgba(11,13,16,0.92)_0%,rgba(10,10,10,0.98)_60%,#0A0A0A_100%)]"
        />

        {/* The cutaway holds the centre column; the flanks carry copy. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <FuselageSchematic markerRefs={markerRefs} />
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
                {/* Left flank — display headline */}
                <div className="w-[26%] max-w-[21rem]">
                  <div className="frame-ink-strong rounded-2xl bg-gradient-to-t from-black/90 via-black/75 to-black/45 px-5 py-4 backdrop-blur-sm">
                    <p className="font-label-caps text-label-caps uppercase text-champagne-gold">
                      {zone.label}
                    </p>
                    <h2 className="mt-3 font-headline-lg text-headline-lg text-on-surface">
                      {zone.headline}
                    </h2>
                  </div>
                </div>

                {/* Right flank — technical specification rail */}
                <ul className="frame-ink-soft w-[26%] max-w-[21rem] space-y-2 rounded-2xl bg-gradient-to-t from-black/90 via-black/75 to-black/45 px-5 py-4 text-right backdrop-blur-sm">
                  {zone.specs.map((spec) => (
                    <li key={spec} className="flex items-start justify-end gap-2 font-telemetry-sm text-telemetry-sm text-on-surface">
                      <span>{spec}</span>
                      <Icon size={13} strokeWidth={1.75} className="mt-0.5 shrink-0 text-champagne-dim" aria-hidden="true" />
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

