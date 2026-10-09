import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

/* -------------------------------------------------------------------------- *
 * Jesko Jets airframe architecture — a pinned 400vh architectural stage
 * (`pinSpacing: true`, `anticipatePin: 1`, `scrub: 0.8`) with three
 * synchronized layers:
 *
 *   Layer 0  Atmospheric field (z-0): deep `bg-[#090A0D]` base plus a soft
 *            champagne radial glow centred behind the airframe
 *            (`rgba(197,168,128,0.08)` → transparent at 60%); the margin
 *            vignette lives at z-10 with the rest of the preserved overlays.
 *   Layer 1  Dual airframe stage (z-1): both 4096px transparent renders —
 *            `jet-exterior.png` (luxury aircraft) and `jet-blueprint.png`
 *            (technical linework, absolutely aligned over it, both
 *            `object-contain`) — inside one centred container that GSAP
 *            transforms (x / y / scale / rotation) across four acts:
 *              Act 1 (0–20%)   dead-centre baseline, blueprint `autoAlpha 0`
 *              Act 2 (22–48%)  right flank `x: 18vw, scale: 1.25,
 *                              rotation: -1.5deg`; blueprint → 0.4 (X-ray)
 *              Act 3 (50–76%)  left flank `x: -18vw, scale: 1.2,
 *                              rotation: 1.5deg`; blueprint → 0.25
 *              Act 4 (80–100%) centre baseline `scale: 1.08`, blueprint →
 *                              0.15 (technical background aura)
 *   Layer 2  Overlays (z-10/20/30): radial vignette, corner telemetry HUD,
 *            flank-anchored chapter editorial typography and the five role
 *            pins anchored over the aircraft structure in Act 4.
 *
 * The master spacer tween spans duration 1, fixing the timeline's total
 * duration so every position below is an exact scroll-progress fraction.
 * All opacity transitions use `autoAlpha` (opacity + visibility) so
 * Tailwind's `pulse` animation on the scroll cue can never outrank them.
 * -------------------------------------------------------------------------- */

/**
 * Synchronous `prefers-reduced-motion` probe. `useReducedMotion` only syncs
 * after mount, so without this the pin would be created (and immediately
 * reverted) for reduced-motion operators on the first paint — the gate keeps
 * the static fallback screen completely free of ScrollTrigger work.
 */
const prefersReducedMotionSync = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface NetworkRole {
  id: string;
  name: string;
  title: string;
  desc: string;
  top: string;
  left: string;
  href: string;
}

const ROLES: NetworkRole[] = [
  {
    id: 'pilots',
    name: 'Command',
    title: 'Pilots & Flight Crew',
    desc: 'Verified type ratings, recurrent currency & flight deck opportunities.',
    top: '46%',
    left: '38%',
    href: '#roles-pilots',
  },
  {
    id: 'operators',
    name: 'Operations',
    title: 'Fleet Operators',
    desc: 'Direct crew dispatch, flight coordination & operational readiness.',
    top: '52%',
    left: '68%',
    href: '#roles-operators',
  },
  {
    id: 'crew',
    name: 'Cabin',
    title: 'Flight Attendants & Service',
    desc: 'VIP corporate protocol, culinary excellence & safety currency.',
    top: '48%',
    left: '50%',
    href: '#roles-crew',
  },
  {
    id: 'fbos',
    name: 'Ground',
    title: 'FBOs & Ramp Support',
    desc: 'Airfield handling, priority fueling, hangarage & line services.',
    top: '64%',
    left: '56%',
    href: '#roles-fbos',
  },
  {
    id: 'charter',
    name: 'Charter',
    title: 'Brokers & Empty Legs',
    desc: 'Access verified charter demand, transient tails & empty-leg availability.',
    top: '38%',
    left: '76%',
    href: '#roles-charter',
  },
];

export function CinematicHero(): React.JSX.Element {
  const trackRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [, setActiveRole] = useState<NetworkRole | null>(null);

  useLayoutEffect(() => {
    if (reducedMotion || prefersReducedMotionSync()) return;

    const track = trackRef.current;
    const pinEl = pinRef.current;
    if (!track || !pinEl) return;

    const gsapCtx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          pin: pinEl,
          pinSpacing: true,
          anticipatePin: 1,
        },
      });

      /* Master spacer — spans duration 1 so the timeline's total duration is
         exactly 1 and every position below is an exact scroll fraction. */
      tl.to({ p: 0 }, { p: 1, duration: 1, ease: 'none' }, 0);

      /* ── LAYER 1 · Dual airframe stage ───────────────────────────────────
         Act 1 holds the airframe dead-centre. Act 2 eases it to the right
         flank (22% → 34%) with a slight counter-pitch while the blueprint
         X-ray rises to 0.4. Act 3 glides it across to the left flank
         (50% → 64%) at rotation +1.5° with the wireframe modulated to
         0.25. Act 4 settles it back onto the centre baseline (80% → 88%)
         at scale 1.08 with the blueprint as a 0.15 technical aura, holding
         through pin release into #roles. */
      tl.to(
        '.js-airframe-stage',
        { x: '18vw', scale: 1.25, rotation: -1.5, duration: 0.12, ease: 'power1.inOut' },
        0.22
      );
      tl.to('.js-blueprint-layer', { autoAlpha: 0.4, duration: 0.08, ease: 'power1.out' }, 0.22);

      tl.to(
        '.js-airframe-stage',
        { x: '-18vw', scale: 1.2, rotation: 1.5, duration: 0.14, ease: 'power1.inOut' },
        0.5
      );
      tl.to('.js-blueprint-layer', { autoAlpha: 0.25, duration: 0.08, ease: 'none' }, 0.5);

      tl.to(
        '.js-airframe-stage',
        { x: 0, y: 0, scale: 1.08, rotation: 0, duration: 0.08, ease: 'power1.inOut' },
        0.8
      );
      tl.to('.js-blueprint-layer', { autoAlpha: 0.15, duration: 0.08, ease: 'none' }, 0.8);

      /* ACT 1 · Airframe presence — the grand split serif and the scroll cue
         fade out between 4% and 14%. `autoAlpha` is load-bearing on the cue:
         Tailwind's `pulse` animation outranks inline opacity, so only
         `visibility: hidden` can take it off-screen. */
      tl.to('.js-scroll-cue', { autoAlpha: 0, duration: 0.1, ease: 'power1.in' }, 0.04);
      tl.to('.js-ch1-left', { x: -80, autoAlpha: 0, duration: 0.1, ease: 'power2.in' }, 0.04);
      tl.to('.js-ch1-right', { x: 80, autoAlpha: 0, duration: 0.1, ease: 'power2.in' }, 0.04);

      /* ACT 2 · Flight Deck Command — the left-flank editorial enters at 24%
         against the airframe's right-flank position, holds, and exits
         cleanly at 46%. */
      tl.fromTo(
        '.js-ch2-cockpit',
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.06, ease: 'power2.out' },
        0.24
      );
      tl.to('.js-ch2-cockpit', { autoAlpha: 0, duration: 0.06, ease: 'power2.in' }, 0.46);

      /* ACT 3 · Operations & Network Transit — the right-flank editorial
         enters at 52% against the airframe's left flank, out at 72%. */
      tl.fromTo(
        '.js-ch3-cabin',
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.06, ease: 'power2.out' },
        0.52
      );
      tl.to('.js-ch3-cabin', { autoAlpha: 0, duration: 0.06, ease: 'power2.in' }, 0.72);

      /* Arrival beat in the 72–80 seam — sequential to the right-flank
         chapter, clearing just as Act 4 opens. */
      tl.fromTo(
        '.js-ch4-arrival',
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.02, ease: 'power2.out' },
        0.78
      );
      tl.to('.js-ch4-arrival', { autoAlpha: 0, y: -20, duration: 0.03, ease: 'power2.in' }, 0.81);

      /* ACT 4 · Network Operating System — the headline locks in at 80%, the
         five role pins pop outward over the airframe staggered 84% → 88%,
         and the final CTAs land at 90%, holding until the pin releases
         cleanly into #roles. */
      tl.fromTo(
        '.js-ch5-reveal',
        { autoAlpha: 0, y: 25 },
        { autoAlpha: 1, y: 0, duration: 0.06, ease: 'power2.out' },
        0.8
      );
      tl.fromTo(
        '.js-role-node',
        { scale: 0.4, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.04, stagger: 0.01, ease: 'back.out(2)' },
        0.84
      );
      tl.fromTo(
        '.js-final-ctas',
        { autoAlpha: 0, y: 15 },
        { autoAlpha: 1, y: 0, duration: 0.06, ease: 'power2.out' },
        0.9
      );
    }, pinEl);

    const onLoad = (): void => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);

    return () => {
      window.removeEventListener('load', onLoad);
      gsapCtx.revert();
    };
  }, [reducedMotion]);

  // The synchronous probe runs on the *first* render, before
  // `useReducedMotion` syncs — reduced-motion operators therefore see the
  // static fallback from paint one and the four plane <img> tags (and their
  // fetches) never mount. Runtime preference flips still re-render via the
  // hook's state, and the probe re-evaluates against the live media query.
  if (reducedMotion || prefersReducedMotionSync()) {
    return (
      <section
        id="top"
        className="relative flex min-h-screen w-full items-center justify-center bg-[#090A0D] px-6 py-24 text-[#ECE7DF]"
      >
        <div className="w-full max-w-5xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C5A880]">
            PJP // Verified Operational Network
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-light leading-tight sm:text-6xl">
            Behind every private flight is a network in motion.
          </h1>
          <p className="mx-auto mt-3 font-mono text-xs uppercase tracking-widest text-zinc-400">
            Pilots · Crew · Operators · FBOs · Charter
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="top"
      ref={trackRef}
      className="relative w-full bg-[#090A0D] text-[#ECE7DF]"
      style={{ height: '400vh' }}
      aria-label="Cinematic introduction"
    >
      <div ref={pinRef} className="relative h-screen w-full overflow-hidden">
        {/* ── LAYER 0 · Atmospheric field — deep obsidian base with the soft
            champagne radial glow centred behind the airframe. ── */}
        <div aria-hidden="true" className="absolute inset-0 z-0 bg-[#090A0D]">
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(197,168,128,0.08) 0%, transparent 60%)',
            }}
          />
        </div>

        {/* ── LAYER 1 · Dual airframe stage — both 4096px transparent renders
            (luxury exterior + blueprint linework) aligned `object-contain`
            over the same box, so GSAP moving the container moves them as one
            rigid body. The blueprint carries markup `opacity-0`, making
            Act 1's X-ray-off state correct on the very first paint. ── */}
        <div className="js-airframe-stage absolute inset-0 z-[1] will-change-transform">
          <img
            src="/jet-exterior.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            decoding="async"
            className="absolute inset-0 h-full w-full select-none object-contain"
          />
          <img
            src="/jet-blueprint.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            decoding="async"
            className="js-blueprint-layer absolute inset-0 h-full w-full select-none object-contain opacity-0"
          />
        </div>

        {/* Global Dark Vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 35%, rgba(9,10,13,0.4) 75%, rgba(9,10,13,0.85) 100%)',
          }}
        />

        {/* Corner Telemetry HUD */}
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-6 pt-24 font-mono text-[10px] uppercase tracking-[0.2em] text-[#C5A880]/80 sm:p-10 sm:pt-28">
          <div className="flex items-start justify-between">
            <div className="tracking-widest">
              PJP // PRIVATE JET PILOTS
              <br />
              <span className="text-white/50">OPERATIONAL ECOSYSTEM</span>
            </div>
            <div className="text-right">
              LAT 40.8501° N // LON 74.0608° W
              <br />
              <span className="text-white/50">KTEB → EGLL // EN ROUTE</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              AIRFRAME // G650ER CLASS
              <br />
              <span className="text-white/50">STATUS // ACTIVE TRANSIT</span>
            </div>
            <div className="js-scroll-cue text-right text-[#C5A880] animate-pulse">
              SCROLL TO ENTER ↓
            </div>
          </div>
        </div>

        {/* CHAPTER 1: AIRFRAME PRESENCE (0% - 14%) — grand split serif */}
        <div className="js-ch1-title pointer-events-none absolute inset-0 z-20 flex flex-col items-start justify-center gap-8 px-6 pt-16 sm:flex-row sm:items-center sm:justify-between sm:px-16">
          <div className="js-ch1-left text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C5A880]">
              PJP // Operational Network
            </p>
            <h1
              aria-label="Behind every private flight"
              className="mt-3 font-serif text-4xl font-light uppercase leading-[1.08] tracking-[0.12em] text-white sm:text-6xl lg:text-7xl"
            >
              Behind every
            </h1>
            <p className="mt-4 font-sans text-xs font-medium uppercase tracking-[0.25em] text-white/95">
              Pilots · Crew · Operators · FBOs · Charter · Support
            </p>
          </div>
          <div className="js-ch1-right text-right">
            <p
              aria-hidden="true"
              className="font-serif text-4xl font-light uppercase italic leading-[1.08] tracking-[0.12em] text-[#C5A880] sm:text-6xl lg:text-7xl"
            >
              private flight
            </p>
            <p className="mt-4 hidden font-serif text-2xl font-light italic text-white/60 lg:block">
              &quot;is a network in motion.&quot;
            </p>
          </div>
        </div>

        {/* CHAPTER 2: FLIGHT DECK COMMAND (24% - 52%) — left-flank editorial
            in the negative space Act 2's right-flank airframe vacates. Flex
            centring (no translate) keeps GSAP's transform channel clean. */}
        <div className="js-ch2-cockpit pointer-events-none absolute inset-y-0 left-0 z-20 flex w-full max-w-xl flex-col justify-center px-6 opacity-0 sm:px-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C5A880]">
            01 // Command Precision
          </p>
          <h2 className="mt-2 font-serif text-3xl font-light leading-tight text-[#fff8ed] sm:text-5xl">
            Every flight begins with precision.
          </h2>
          <p className="mt-2 max-w-lg font-sans text-xs font-light text-white/60 sm:text-sm">
            A disciplined operating system behind every decision.
          </p>
        </div>

        {/* CHAPTER 3: NETWORK TRANSIT (52% - 78%) — right-flank editorial,
            mirrored into the negative space of Act 3's left-flank airframe. */}
        <div className="js-ch3-cabin pointer-events-none absolute inset-y-0 right-0 z-20 flex w-full max-w-xl flex-col items-end justify-center px-6 text-right opacity-0 sm:px-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C5A880]">
            02 // Operational Excellence
          </p>
          <h2 className="mt-2 font-serif text-3xl font-light leading-tight text-[#fff8ed] sm:text-5xl">
            Coordinating crew, operators, and transient tails.
          </h2>
          <p className="mt-2 max-w-lg font-sans text-xs font-light text-white/60 sm:text-sm">
            From flight deck to runway, every detail depends on verified network execution.
          </p>
        </div>

        {/* CHAPTER 4: ARRIVAL SEAM (78% - 84%) — editorial marginal overlay */}
        <div className="js-ch4-arrival pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#060505]/90 via-[#060505]/40 to-transparent px-6 pb-28 pt-12 opacity-0 sm:px-16 sm:pb-32 sm:pt-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C5A880]">
            Touchdown &amp; Mission Lock
          </p>
          <h2 className="mt-2 font-serif text-3xl font-light leading-tight text-[#fff8ed] sm:text-5xl">
            The journey has arrived.
          </h2>
          <p className="mt-2 max-w-lg font-sans text-xs font-light text-white/60 sm:text-sm">
            The flight is complete. Now reveal the network that made it possible.
          </p>
        </div>

        {/* CHAPTER 4/5: NETWORK OPERATING SYSTEM (80% - 100%) */}
        <div className="js-ch5-reveal pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-6 pt-24 sm:p-12 sm:pt-28 opacity-0">
          <div className="absolute top-32 left-6 max-w-2xl sm:top-36 sm:left-16">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C5A880]">
              The Operating System
            </p>
            <h2 className="mt-2 font-serif text-3xl font-light leading-tight text-[#fff8ed] [text-shadow:0_2px_14px_rgba(6,5,5,0.6)] sm:text-5xl">
              Every flight is a network in motion.
            </h2>
            <p className="mt-2 max-w-lg font-sans text-xs font-light text-white/60 sm:text-sm">
              Connect with verified aviation professionals, operators, and partners—when timing matters.
            </p>
          </div>

          {/* Role Hotspots */}
          <div className="relative mx-auto h-full w-full max-w-6xl">
            {ROLES.map((role, index) => (
              <div
                key={role.id}
                style={{ top: role.top, left: role.left }}
                className="js-role-node group pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                onMouseEnter={() => setActiveRole(role)}
                onMouseLeave={() => setActiveRole(null)}
              >
                <a
                  href={role.href}
                  className="relative flex h-7 w-7 items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110"
                >
                  <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    aria-hidden="true"
                    className="h-[18px] w-[18px] text-white/85 transition-all duration-300 ease-out drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] group-hover:text-[#C5A880] group-hover:drop-shadow-[0_0_6px_rgba(197,168,128,0.5)]"
                  >
                    <circle cx="9" cy="9" r="8.5" stroke="currentColor" strokeWidth="0.75" />
                    <path d="M9 4V14M4 9H14" stroke="currentColor" strokeWidth="0.5" />
                  </svg>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute top-1/2 h-[1px] w-8 -translate-y-1/2 bg-[#C5A880]/40 ${
                      Number.parseInt(role.left, 10) > 50 ? 'left-full' : 'right-full'
                    }`}
                  />
                  <span className="pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 font-mono text-[8px] tracking-widest text-[#C5A880] opacity-70 [text-shadow:0_1px_2px_rgba(0,0,0,0.55)] transition-opacity duration-300 group-hover:opacity-100">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </a>

                <div
                  className={`pointer-events-none absolute top-1/2 w-64 -translate-y-1/2 rounded-sm border border-white/15 bg-[#090A0D]/90 p-4 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
                    Number.parseInt(role.left, 10) > 50 ? 'right-7' : 'left-7'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C5A880]">
                      {role.name}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
                      NODE // VERIFIED
                    </span>
                  </div>
                  <p className="mt-2 font-serif text-sm font-light italic tracking-tight text-white">
                    {role.title}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-[1.55] text-zinc-400">{role.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTAs */}
          <div className="js-final-ctas pointer-events-auto absolute inset-x-0 bottom-20 flex flex-wrap items-center justify-center gap-4 px-6 sm:bottom-24 lg:bottom-10 lg:px-10">
            <a
              href="#roles"
              className="inline-flex min-h-[44px] items-center rounded-full bg-[#C5A880] px-8 py-3 font-sans text-xs font-medium uppercase tracking-[0.25em] text-[#090A0D] shadow-lg transition-all hover:scale-105 hover:bg-white"
            >
              Enter the Network
            </a>
            <a
              href="#roles"
              className="inline-flex min-h-[44px] items-center rounded-full border border-[#C5A880]/60 bg-[#090A0D]/50 px-8 py-3 font-sans text-xs font-medium uppercase tracking-[0.25em] text-[#C5A880] backdrop-blur-sm transition-all hover:scale-105 hover:border-white hover:text-white"
            >
              Explore Roles
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CinematicHero;