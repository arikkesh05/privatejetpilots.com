import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const CinematicHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current || !pinRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Initial resting state setup
      gsap.set('.js-airframe-stage', { yPercent: 120, autoAlpha: 0 });
      gsap.set('.js-sky-overlay', { autoAlpha: 0 });
      gsap.set('.js-blueprint-layer', { autoAlpha: 0 });
      gsap.set('.js-editorial-flanks', { scale: 1, autoAlpha: 1 });
      gsap.set('.js-pjp-watermark', { scale: 1, autoAlpha: 1 });
      gsap.set('.js-window-stage', { scale: 1, autoAlpha: 1, xPercent: 0, z: 0 });

      // Sunshade motorized retraction on load
      gsap.fromTo(
        '.js-sunshade-unit',
        { yPercent: 0 },
        { yPercent: -105, duration: 1.6, ease: 'power3.inOut', delay: 0.2 }
      );

      // Continuous ambient cloud drift
      gsap.to('.js-sky-drift', {
        xPercent: -8,
        duration: 25,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // 2. Master Scroll Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });

      // ── ACT 1: CABIN DIVE (0.00 -> 0.22) ──
      // Typography fades out instantly on scroll so it NEVER lingers as giant text on reverse
      tl.to(
        '.js-editorial-flanks',
        {
          autoAlpha: 0,
          scale: 1.8,
          duration: 0.04,
          ease: 'power2.out',
          immediateRender: false,
        },
        0
      );

      // Watermark scales slightly and clears before clouds appear
      tl.to(
        '.js-pjp-watermark',
        {
          scale: 2.2,
          autoAlpha: 0,
          duration: 0.08,
          ease: 'power1.out',
          immediateRender: false,
        },
        0
      );

      // Window Stage: Scales purely without killing GPU texture memory
      tl.fromTo(
        '.js-window-stage',
        { scale: 1, z: 0, xPercent: 0 },
        {
          scale: 6.5,
          z: 100,
          xPercent: -2,
          duration: 0.22,
          ease: 'none',
          immediateRender: false,
        },
        0
      );

      // Fade out only at the very tail end once aperture already covers the screen
      tl.to(
        '.js-window-stage',
        {
          autoAlpha: 0,
          duration: 0.02,
          ease: 'none',
          immediateRender: false,
        },
        0.21
      );

      // ── ACT 1.5: ATMOSPHERIC SHIFT (0.22 -> 0.35) ──
      tl.fromTo(
        '.js-sky-overlay',
        { autoAlpha: 0 },
        { autoAlpha: 0.65, duration: 0.12, ease: 'none', immediateRender: false },
        0.22
      );

      // ── ACT 2: AIRFRAME ENTRANCE (0.32 -> 0.60) ──
      tl.fromTo(
        '.js-airframe-stage',
        { yPercent: 120, autoAlpha: 0, scale: 0.92 },
        {
          yPercent: 0,
          autoAlpha: 1,
          scale: 1,
          duration: 0.28,
          ease: 'power2.out',
          immediateRender: false,
        },
        0.32
      );

      // ── ACT 3: TECHNICAL BLUEPRINT TRANSITION (0.60 -> 1.00) ──
      tl.fromTo(
        '.js-blueprint-layer',
        { autoAlpha: 0 },
        { autoAlpha: 0.85, duration: 0.25, ease: 'power1.inOut', immediateRender: false },
        0.65
      );

      tl.to(
        '.js-airframe-stage',
        { scale: 1.05, duration: 0.35, ease: 'none', immediateRender: false },
        0.65
      );
    }, pinRef.current);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#090A0D] text-[#ECE7DF]"
      style={{ height: '400vh' }}
    >
      <div
        ref={pinRef}
        className="sticky top-0 h-screen w-full overflow-hidden"
      >
        {/* ── BASE BACKGROUND: Sky & Atmosphere ── */}
        <div className="absolute inset-0 z-0 h-full w-full bg-[#0b131e] overflow-hidden">
          <img
            src="/hero-sky.webp"
            alt=""
            className="js-sky-drift absolute inset-0 h-full w-[115%] min-w-full object-cover object-center select-none"
          />
          <div className="js-sky-overlay pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090A0D]/40 via-[#141210]/60 to-[#090A0D]/90" />
        </div>

        {/* ── LAYER 1: CABIN WINDOW STAGE (Act 1) ── */}
        <div
          className="js-window-stage pointer-events-none absolute inset-0 z-10 h-full w-full will-change-transform"
          style={{ transformOrigin: '50% 50%', backfaceVisibility: 'hidden' }}
        >
          {/* Full-bleed cabin wall backing */}
          <img
            src="/hero-back.webp"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            style={{ zIndex: 1, backfaceVisibility: 'hidden' }}
          />

          {/* Central Porthole Window Unit */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
            <div className="relative h-[68vh] w-[46vh] max-h-[640px] max-w-[440px] overflow-hidden rounded-[50%_/_42%]">
              {/* Retractable Sunshade */}
              <div className="js-sunshade-unit absolute inset-0 bg-[#221c1a] flex items-end justify-center z-10">
                <img src="/window-knob.webp" alt="" className="w-[82%] mb-3 select-none" />
              </div>
              {/* Frosted Glass Watermark */}
              <div className="js-pjp-watermark absolute inset-0 flex items-center justify-center z-0">
                <span className="font-serif text-[10vh] font-light tracking-[0.3em] text-white/20 select-none">
                  P J P
                </span>
              </div>
            </div>
          </div>

          {/* Front Bezel Plates */}
          <img
            src="/hero-front.webp"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            style={{ zIndex: 3, backfaceVisibility: 'hidden' }}
          />
          <img
            src="/hero-front-over.webp"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center mix-blend-screen opacity-90"
            style={{ zIndex: 4, backfaceVisibility: 'hidden' }}
          />
        </div>

        {/* ── LAYER 2: FLANKING EDITORIAL HEADLINES ── */}
        <div
          className="js-editorial-flanks pointer-events-none absolute inset-0 z-20 will-change-transform"
          style={{ transformOrigin: '50% 50%' }}
        >
          {/* Left Flank */}
          <div className="absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 max-w-[280px] lg:max-w-[340px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#C5A880]/80 mb-2">
              Operational Network
            </p>
            <h1 className="font-sans text-3xl lg:text-5xl font-light uppercase tracking-tight text-white leading-[1.05]">
              A Network <br /> in Motion
            </h1>
          </div>

          {/* Right Flank */}
          <div className="absolute right-8 lg:right-16 top-1/2 -translate-y-1/2 max-w-[280px] lg:max-w-[340px] text-right">
            <h2 className="font-sans text-3xl lg:text-5xl font-light uppercase tracking-tight text-[#C5A880] leading-[1.05] mb-2">
              Verified <br /> Excellence
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              Pilots • Crew • Operators • Charter
            </p>
          </div>
        </div>

        {/* ── LAYER 3: AIRFRAME STAGE (Acts 2 & 3) ── */}
        <div className="js-airframe-stage pointer-events-none absolute inset-0 z-15 flex items-center justify-center will-change-transform">
          <div className="relative h-[85vh] w-[85vw] max-w-[1100px] flex items-center justify-center">
            <img
              src="/jet-exterior.png"
              alt="PJP Executive Jet"
              className="absolute inset-0 h-full w-full object-contain select-none"
            />
            <img
              src="/jet-blueprint.png"
              alt="Airframe Blueprint"
              className="js-blueprint-layer absolute inset-0 h-full w-full object-contain select-none"
            />
          </div>
        </div>

        {/* ── LAYER 4: TELEMETRY HUD OVERLAYS ── */}
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-6 pt-24 font-mono text-[10px] uppercase tracking-[0.2em] text-[#C5A880]/70 sm:p-10 sm:pt-28">
          <div className="flex items-start justify-between">
            <div>
              PJP // PRIVATE JET PILOTS
              <br />
              <span className="text-white/40">GLOBAL CORRIDORS</span>
            </div>
            <div className="text-right">
              LAT 40.8501° N // LON 74.0608° W
              <br />
              <span className="text-white/40">CRUISING FL410</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              AIRFRAME // G650ER CLASS
              <br />
              <span className="text-white/40">STATUS // ACTIVE TRANSIT</span>
            </div>
            <div className="text-right text-white/30">
              SCROLL TO EXPLORE
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CinematicHero;