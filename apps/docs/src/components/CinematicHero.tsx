import React, { useRef, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExplodedAirframe, AirframeService } from './ExplodedAirframe';
import { InteractiveLanyardBadge } from './InteractiveLanyardBadge';
import { usePilotProfile } from '../hooks/usePilotProfile';

gsap.registerPlugin(ScrollTrigger);

export const CinematicHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [activeService, setActiveService] = useState<AirframeService | null>(null);

  // Live Supabase pilot profile telemetry
  const { profile: pilotProfile } = usePilotProfile();

  useLayoutEffect(() => {
    if (!containerRef.current || !pinRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Initial State Setup
      gsap.set('.js-airframe-stage', { yPercent: 130, scale: 1.15, autoAlpha: 0, pointerEvents: 'none' });
      gsap.set('.js-jet-shadow', { scale: 1.3, opacity: 0.05, filter: 'blur(30px)' });
      gsap.set('.js-solid-jet', { opacity: 1 });
      gsap.set('.js-blueprint-layer', { opacity: 0 });
      gsap.set('.js-studio-floor', { opacity: 0 });

      // Airframe Components initial intact resting alignment
      gsap.set('.js-part-cockpit', { x: 0, y: 0 });
      gsap.set('.js-part-wing-left', { x: 0, y: 0 });
      gsap.set('.js-part-wing-right', { x: 0, y: 0 });
      gsap.set('.js-part-engine-left', { x: 0, y: 0 });
      gsap.set('.js-part-engine-right', { x: 0, y: 0 });
      gsap.set('.js-part-tail', { x: 0, y: 0 });
      gsap.set('.js-part-cabin', { opacity: 1 });

      // Parts start non-interactive during arrival
      gsap.set(
        [
          '.js-part-cockpit',
          '.js-part-wing-left',
          '.js-part-wing-right',
          '.js-part-engine-left',
          '.js-part-engine-right',
          '.js-part-tail',
          '.js-part-cabin',
        ],
        { pointerEvents: 'none' }
      );

      // Flank HUD Badges initial hidden positions
      gsap.set('.js-flank-left', { autoAlpha: 0, x: -50 });
      gsap.set('.js-flank-right', { autoAlpha: 0, x: 50 });

      // Sky Narrative master container & HUD Radar Vector initial states
      gsap.set('.js-sky-narrative', { autoAlpha: 0, y: 40 });
      gsap.set('.js-radar-beam', { left: '0%' });
      gsap.set('.js-illuminated-layer', {
        clipPath: 'inset(0% 100% 0% 0%)',
      });

      // Window resting stage & typography (Strictly layered at z-[35])
      gsap.set('.js-editorial-flanks', { autoAlpha: 1 });
      gsap.set('.js-editorial-left', { x: 0, autoAlpha: 1 });
      gsap.set('.js-editorial-right', { x: 0, autoAlpha: 1 });
      gsap.set('.js-scroll-prompt', { autoAlpha: 1, y: 0 });
      gsap.set('.js-bottom-telemetry', { autoAlpha: 1, y: 0 });
      gsap.set('.js-pjp-watermark', { autoAlpha: 1, scale: 1, filter: 'blur(0px)' });
      gsap.set('.js-window-stage', { scale: 1, autoAlpha: 1, xPercent: 0, z: 0 });

      // Act 2: Digital ID Live Specimen Choreography Initial States
      gsap.set('.js-act2-headline', { autoAlpha: 0, pointerEvents: 'none' });
      gsap.set('.js-badge-text', { x: -60, autoAlpha: 0 });
      gsap.set('.js-badge-card', { y: -130, rotateZ: -6, scale: 0.9, autoAlpha: 0 });
      gsap.set('.js-corner-telemetry', { autoAlpha: 1 });

      // Sunshade motorized retraction on load
      gsap.fromTo(
        '.js-sunshade-unit',
        { yPercent: 0 },
        { yPercent: -105, duration: 1.6, ease: 'power3.inOut', delay: 0.2 }
      );

      // Active high-altitude cloud stream
      gsap.to('.js-sky-drift', {
        xPercent: -8,
        yPercent: 2,
        scale: 1.04,
        duration: 9,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // 2. Master Scroll Timeline (Paced across 900vh runway)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
        },
      });

      // ── ACT 1: CABIN WINDOW DIVE (0.00 -> 0.13) ──
      tl.to(
        '.js-editorial-left',
        { x: -110, autoAlpha: 0, duration: 0.08, ease: 'power2.out' },
        0
      );
      tl.to(
        '.js-editorial-right',
        { x: 110, autoAlpha: 0, duration: 0.08, ease: 'power2.out' },
        0
      );
      tl.to(
        '.js-scroll-prompt',
        { autoAlpha: 0, y: 24, duration: 0.05, ease: 'power1.out' },
        0
      );
      tl.to(
        '.js-bottom-telemetry',
        { autoAlpha: 0, y: 20, duration: 0.05, ease: 'power1.out' },
        0
      );

      tl.to(
        '.js-pjp-watermark',
        {
          autoAlpha: 0,
          scale: 1.35,
          filter: 'blur(8px)',
          duration: 0.07,
          ease: 'power1.out',
        },
        0.01
      );

      tl.to(
        '.js-window-stage',
        { scale: 6.5, z: 100, xPercent: -2, duration: 0.13, ease: 'power1.in' },
        0
      );

      tl.to(
        '.js-window-stage',
        { autoAlpha: 0, duration: 0.03, ease: 'power1.in' },
        0.10
      );

      // ── ACT 1.5: HUD RADAR VECTOR SWEEP (0.13 -> 0.30) ──
      tl.fromTo(
        '.js-sky-narrative',
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 0.04, ease: 'power2.out' },
        0.13
      );

      tl.fromTo(
        '.js-radar-beam',
        { left: '0%' },
        { left: '100%', duration: 0.14, ease: 'none' },
        0.14
      );

      tl.fromTo(
        '.js-illuminated-layer',
        { clipPath: 'inset(0% 100% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.14,
          ease: 'none',
        },
        0.14
      );

      // CLEAR SKY NARRATIVE BEFORE DIGITAL ID
      tl.to(
        '.js-sky-narrative',
        { autoAlpha: 0, y: -50, duration: 0.05, ease: 'power2.in' },
        0.28
      );

      // ── ACT 1.8: TRANSITION TO LUXURY STUDIO FLOOR (0.28 -> 0.38) ──
      tl.fromTo(
        '.js-studio-floor',
        { opacity: 0 },
        { opacity: 1, duration: 0.10, ease: 'power1.inOut' },
        0.28
      );

      // ── ACT 2: PJP DIGITAL ID ENTERS WITH LANYARD PHYSICS (0.31 -> 0.38) ──
      tl.to(
        '.js-act2-headline',
        { autoAlpha: 1, pointerEvents: 'auto', duration: 0.02 },
        0.31
      );

      tl.fromTo(
        '.js-badge-text',
        { x: -60, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.07, ease: 'power3.out' },
        0.32
      );

      tl.fromTo(
        '.js-badge-card',
        { y: -130, rotateZ: -6, scale: 0.9, autoAlpha: 0 },
        { y: 0, rotateZ: 0, scale: 1, autoAlpha: 1, duration: 0.09, ease: 'back.out(1.4)' },
        0.32
      );

      // ── ACT 2.3: DIGITAL ID EXITS CLEANLY BEFORE JET ARRIVAL (0.43 -> 0.48) ──
      tl.to(
        '.js-badge-text',
        { x: -80, autoAlpha: 0, duration: 0.05, ease: 'power2.in' },
        0.43
      );

      tl.to(
        '.js-badge-card',
        { y: -120, rotateZ: 4, scale: 0.9, autoAlpha: 0, duration: 0.05, ease: 'power2.in' },
        0.43
      );

      tl.to(
        ['.js-act2-headline', '.js-corner-telemetry', '.js-bottom-telemetry'],
        { autoAlpha: 0, pointerEvents: 'none', duration: 0.03 },
        0.47
      );

      // ── ACT 2.8: UNCLUTTERED JET ARRIVAL & TOUCHDOWN (0.48 -> 0.62) ──
      tl.fromTo(
        '.js-airframe-stage',
        { yPercent: 130, scale: 1.15, autoAlpha: 0, pointerEvents: 'none' },
        {
          yPercent: 0,
          scale: 0.98,
          autoAlpha: 1,
          pointerEvents: 'auto',
          duration: 0.16,
          ease: 'power2.out',
        },
        0.48
      );

      tl.fromTo(
        '.js-jet-shadow',
        { scale: 1.3, opacity: 0.05, filter: 'blur(30px)' },
        {
          scale: 0.96,
          opacity: 0.65,
          filter: 'blur(12px)',
          duration: 0.16,
          ease: 'power2.out',
        },
        0.48
      );

      // ── ACT 3: EXPLODED AIRFRAME SEPARATION (0.64 -> 0.84) ──
      tl.to(
        '.js-solid-jet',
        { opacity: 0, duration: 0.12, ease: 'power1.inOut' },
        0.64
      );

      tl.to(
        '.js-part-cabin',
        { opacity: 0.15, duration: 0.14, ease: 'power1.inOut' },
        0.64
      );

      tl.fromTo(
        '.js-blueprint-layer',
        { opacity: 0 },
        { opacity: 1, duration: 0.14, ease: 'power1.inOut' },
        0.64
      );

      tl.to(
        '.js-part-cockpit',
        { y: -60, duration: 0.16, ease: 'power2.out', immediateRender: false },
        0.66
      );

      tl.to(
        '.js-part-wing-left',
        { x: -110, y: 18, duration: 0.16, ease: 'power2.out' },
        0.66
      );
      tl.to(
        '.js-part-wing-right',
        { x: 110, y: 18, duration: 0.16, ease: 'power2.out' },
        0.66
      );

      tl.to(
        '.js-part-engine-left',
        { x: -65, y: 28, duration: 0.16, ease: 'power2.out' },
        0.68
      );
      tl.to(
        '.js-part-engine-right',
        { x: 65, y: 28, duration: 0.16, ease: 'power2.out' },
        0.68
      );

      tl.to(
        '.js-part-tail',
        { y: 75, duration: 0.16, ease: 'power2.out' },
        0.68
      );

      tl.fromTo(
        '.js-flank-left',
        { autoAlpha: 0, x: -50 },
        { autoAlpha: 1, x: 0, duration: 0.14, ease: 'power2.out' },
        0.72
      );
      tl.fromTo(
        '.js-flank-right',
        { autoAlpha: 0, x: 50 },
        { autoAlpha: 1, x: 0, duration: 0.14, ease: 'power2.out' },
        0.72
      );

      tl.set(
        [
          '.js-part-cockpit',
          '.js-part-wing-left',
          '.js-part-wing-right',
          '.js-part-engine-left',
          '.js-part-engine-right',
          '.js-part-tail',
          '.js-part-cabin',
        ],
        { pointerEvents: 'auto' },
        0.74
      );

      // ── ACT 4: SMOOTH RUNWAY EXIT INTO ECOSYSTEM SECTION (0.88 -> 1.00) ──
      tl.to(
        ['.js-flank-left', '.js-flank-right', '.js-airframe-stage'],
        { autoAlpha: 0, y: -40, pointerEvents: 'none', duration: 0.12, ease: 'power2.in' },
        0.88
      );
    }, pinRef.current);

    return () => ctx.revert();
  }, []);

  const handleScrollToEcosystem = () => {
    setActiveService(null);
    const target = document.getElementById('ecosystem') || document.querySelector('section:nth-of-type(2)');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#090A0D] text-[#ECE7DF]"
      style={{ height: '900vh' }}
    >
      <div
        ref={pinRef}
        className="sticky top-0 h-screen w-full overflow-hidden"
      >
        {/* ── BASE LAYER 0 (z-0): Sky & Studio Floor ── */}
        <div className="absolute inset-0 z-0 h-full w-full bg-[#08090b] overflow-hidden">
          <img
            src="/hero-sky.webp"
            alt=""
            className="js-sky-drift pointer-events-none select-none will-change-transform"
            style={{
              position: 'absolute',
              top: '-10%',
              left: '-25%',
              width: '150%',
              height: '120%',
              maxWidth: 'none',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />

          <div
            className="js-studio-floor pointer-events-none absolute inset-0 opacity-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(245,197,66,0.18) 0%, rgba(32,28,24,0.75) 45%, #090A0D 80%)',
            }}
          />
        </div>

        {/* ── LAYER 1 (z-[15]): THE HUD RADAR VECTOR SKY NARRATIVE ── */}
        <div className="js-sky-narrative pointer-events-none absolute inset-0 z-[15] flex flex-col justify-center px-4 sm:px-8 lg:px-20 max-w-7xl mx-auto overflow-hidden pt-14 sm:pt-0">
          
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />

          {/* 1. Base Ghosted Wireframe Layer */}
          <div className="pointer-events-none w-full opacity-20 filter blur-[0.5px]">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white/50" />
              <p className="font-mono text-xs sm:text-base uppercase tracking-[0.24em] sm:tracking-[0.34em] text-white/60 font-black">
                OPERATIONAL NETWORK
              </p>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl xl:text-[4.2rem] font-bold text-white/40 tracking-[-0.02em] leading-[1.08] max-w-5xl font-playfair">
              We’re not a directory <br />
              We’re the network layer <br />
              of aviation ops
            </h2>
            <p className="text-xs sm:text-base lg:text-xl text-white/30 font-light max-w-3xl mt-2 sm:mt-4 leading-relaxed font-playfair line-clamp-2 sm:line-clamp-none">
              When an operator needs a crew before service, a management company loses a captain, or an aircraft is AOG at 2 a.m. — PJP synchronizes the flight deck in real-time.
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 pt-4 sm:pt-8 mt-3 sm:mt-6 border-t border-white/10">
              <div>
                <p className="font-mono text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.2em] text-white/60 font-black mb-0.5 sm:mb-1.5">
                  DIGITAL LOGBOOK
                </p>
                <h3 className="text-xs sm:text-base font-bold text-white/40 mb-0.5 sm:mb-1 font-playfair">The Crew Profile</h3>
                <p className="text-[10px] sm:text-xs text-white/30 leading-snug sm:leading-relaxed font-light font-playfair">Cross-checked against the FAA Airmen Registry (591k+ pilots).</p>
              </div>
              <div>
                <p className="font-mono text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.2em] text-white/60 font-black mb-0.5 sm:mb-1.5">
                  LIVE DISPATCH
                </p>
                <h3 className="text-xs sm:text-base font-bold text-white/40 mb-0.5 sm:mb-1 font-playfair">Real-Time Gigs</h3>
                <p className="text-[10px] sm:text-xs text-white/30 leading-snug sm:leading-relaxed font-light font-playfair">Routing Part 91 & 135 seats and contract flying directly to profiles.</p>
              </div>
              <div>
                <p className="font-mono text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.2em] text-white/60 font-black mb-0.5 sm:mb-1.5">
                  INSTANT ROSTER
                </p>
                <h3 className="text-xs sm:text-base font-bold text-white/40 mb-0.5 sm:mb-1 font-playfair">Immediate Access</h3>
                <p className="text-[10px] sm:text-xs text-white/30 leading-snug sm:leading-relaxed font-light font-playfair">Direct access to 26,500+ aviators and 78 operators globally.</p>
              </div>
              <div>
                <p className="font-mono text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.2em] text-white/60 font-black mb-0.5 sm:mb-1.5">
                  UNIFIED BADGE
                </p>
                <h3 className="text-xs sm:text-base font-bold text-white/40 mb-0.5 sm:mb-1 font-playfair">Ten Systems, One ID</h3>
                <p className="text-[10px] sm:text-xs text-white/30 leading-snug sm:leading-relaxed font-light font-playfair">Encrypted logbooks, JumpSeat perks, and escrow payouts.</p>
              </div>
            </div>
          </div>

          {/* 2. Illuminated Decoded Layer */}
          <div className="js-illuminated-layer pointer-events-none absolute inset-0 flex flex-col justify-center px-4 sm:px-8 lg:px-20 max-w-7xl mx-auto will-change-transform pt-14 sm:pt-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FFD700] shadow-[0_0_14px_#FFD700] animate-pulse" />
              <p
                className="font-mono text-xs sm:text-base uppercase tracking-[0.24em] sm:tracking-[0.34em] font-black"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE57F 25%, #FFD700 55%, #F59E0B 85%, #D97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 14px rgba(245,158,11,0.55)) drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
                }}
              >
                OPERATIONAL NETWORK
              </p>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl xl:text-[4.2rem] font-bold text-white tracking-[-0.02em] leading-[1.08] max-w-5xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] font-playfair">
              We’re not a directory <br />
              We’re the{' '}
              <span
                className="font-bold inline-block"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE57F 25%, #FFD700 55%, #F59E0B 85%, #D97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 14px rgba(245,158,11,0.55)) drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
                }}
              >
                network layer
              </span>{' '}
              <br />
              of aviation ops
            </h2>

            <p className="text-xs sm:text-base lg:text-xl text-white font-light max-w-3xl mt-2 sm:mt-4 leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] font-playfair line-clamp-2 sm:line-clamp-none">
              When an operator needs a crew before service, a management company loses a captain, or an aircraft is AOG at 2 a.m. — PJP synchronizes the flight deck in{' '}
              <span
                className="italic font-bold text-sm sm:text-xl lg:text-2xl inline-block"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE57F 25%, #FFD700 55%, #F59E0B 85%, #D97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 14px rgba(245,158,11,0.55)) drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
                }}
              >
                real-time
              </span>.
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 pt-4 sm:pt-8 mt-3 sm:mt-6 border-t border-white/30">
              <div>
                <p
                  className="font-mono text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.2em] font-black mb-0.5 sm:mb-1.5"
                  style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE57F 25%, #FFD700 55%, #F59E0B 85%, #D97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 4px 14px rgba(245,158,11,0.55)) drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
                  }}
                >
                  DIGITAL LOGBOOK
                </p>
                <h3 className="text-xs sm:text-base font-bold text-white mb-0.5 sm:mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] font-playfair">The Crew Profile</h3>
                <p className="text-[10px] sm:text-xs text-white/85 leading-snug sm:leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)] font-playfair">Cross-checked against the FAA Airmen Registry (591k+ pilots).</p>
              </div>

              <div>
                <p
                  className="font-mono text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.2em] font-black mb-0.5 sm:mb-1.5"
                  style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE57F 25%, #FFD700 55%, #F59E0B 85%, #D97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 4px 14px rgba(245,158,11,0.55)) drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
                  }}
                >
                  LIVE DISPATCH
                </p>
                <h3 className="text-xs sm:text-base font-bold text-white mb-0.5 sm:mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] font-playfair">Real-Time Gigs</h3>
                <p className="text-[10px] sm:text-xs text-white/85 leading-snug sm:leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)] font-playfair">Routing Part 91 & 135 seats and contract flying directly to profiles.</p>
              </div>

              <div>
                <p
                  className="font-mono text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.2em] font-black mb-0.5 sm:mb-1.5"
                  style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE57F 25%, #FFD700 55%, #F59E0B 85%, #D97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  INSTANT ROSTER
                </p>
                <h3 className="text-xs sm:text-base font-bold text-white mb-0.5 sm:mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] font-playfair">Immediate Access</h3>
                <p className="text-[10px] sm:text-xs text-white/85 leading-snug sm:leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)] font-playfair">Direct access to 26,500+ aviators and 78 operators globally.</p>
              </div>

              <div>
                <p
                  className="font-mono text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.2em] font-black mb-0.5 sm:mb-1.5"
                  style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE57F 25%, #FFD700 55%, #F59E0B 85%, #D97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  UNIFIED BADGE
                </p>
                <h3 className="text-xs sm:text-base font-bold text-white mb-0.5 sm:mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] font-playfair">Ten Systems, One ID</h3>
                <p className="text-[10px] sm:text-xs text-white/85 leading-snug sm:leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)] font-playfair">Encrypted logbooks, JumpSeat perks, and escrow payouts.</p>
              </div>
            </div>
          </div>

          {/* 3. The Glowing Radar Vector Beam */}
          <div
            className="js-radar-beam pointer-events-none absolute top-0 bottom-0 w-[2.5px] z-30 will-change-transform"
            style={{
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg, rgba(56,189,248,0) 0%, rgba(56,189,248,0.9) 15%, #FFD700 45%, #F59E0B 55%, rgba(56,189,248,0.9) 85%, rgba(56,189,248,0) 100%)',
              boxShadow: '0 0 18px 3px rgba(255, 215, 0, 0.95), 0 0 35px 8px rgba(56, 189, 248, 0.55)',
            }}
          >
            <div
              className="absolute top-20 sm:top-24 left-3 whitespace-nowrap font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.25em] font-bold px-2 py-0.5 rounded border backdrop-blur-sm shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
              style={{
                background: 'rgba(10,12,18,0.85)',
                color: '#FFD700',
                borderColor: 'rgba(255,215,0,0.5)',
              }}
            >
              VECTOR SCAN // FL410
            </div>

            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 border rounded-full flex items-center justify-center bg-black/60 backdrop-blur-sm"
              style={{
                borderColor: '#FFD700',
                boxShadow: '0 0 14px rgba(255, 215, 0, 0.8)',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
            </div>

            <div className="absolute bottom-12 sm:bottom-16 left-3 whitespace-nowrap font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-[#38bdf8] bg-black/80 px-2 py-0.5 rounded border border-[#38bdf8]/40 backdrop-blur-sm shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              RADAR ACQUIRED
            </div>
          </div>
        </div>

        {/* ── LAYER 2 (z-20): EXPLODED AIRFRAME ASSEMBLY STAGE ── */}
        <div className="js-airframe-stage pointer-events-none absolute inset-0 z-20 flex items-center justify-center will-change-transform">
          <ExplodedAirframe
            activeServiceId={activeService?.id}
            onSelectService={(service) => setActiveService(service)}
          />
        </div>

        {/* ── LAYER 3 (z-30): CABIN WINDOW STAGE ── */}
        <div
          className="js-window-stage pointer-events-none absolute inset-0 z-30 h-full w-full will-change-transform"
          style={{ transformOrigin: '50% 50%', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <img
            src="/hero-back.webp"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            style={{ zIndex: 1, backfaceVisibility: 'hidden' }}
          />

          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
            <div className="relative h-[50vh] w-[33vh] sm:h-[65vh] sm:w-[44vh] lg:h-[68vh] lg:w-[46vh] max-h-[640px] max-w-[440px] overflow-hidden rounded-[50%_/_42%]">
              <div className="js-sunshade-unit absolute inset-0 bg-[#221c1a] flex items-end justify-center z-10">
                <img src="/window-knob.webp" alt="" className="w-[82%] mb-3 select-none" />
              </div>
              
              {/* Perfectly Centered Crisp White Watermark (Tightly bound inside glass) */}
              <div className="js-pjp-watermark absolute inset-0 flex items-center justify-center z-0 select-none pointer-events-none will-change-transform">
                <span
                  className="font-normal leading-none select-none text-white/90"
                  style={{
                    fontSize: 'clamp(1.8rem, 5.5vh, 3.8rem)',
                    letterSpacing: '0.12em',
                    paddingLeft: '0.12em',
                    textShadow: '0 2px 14px rgba(0, 0, 0, 0.45)',
                  }}
                >
                  P J P
                </span>
              </div>
            </div>
          </div>

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

        {/* ── LAYER 4 (z-[35]): ASYMMETRIC JESKO-STYLE EDITORIAL TYPOGRAPHY & SCROLL PILL ── */}
        <div
          className="js-editorial-flanks pointer-events-none absolute inset-0 z-[35] flex flex-col justify-between p-4 sm:p-8 lg:p-16 select-none"
        >
          {/* Safe Nav Clearance */}
          <div className="h-14 sm:h-16" />

          {/* Asymmetric Columns: Left headline UP, Right headline DOWN */}
          <div className="flex-1 grid grid-cols-2 gap-4 sm:gap-8 w-full pointer-events-none">
            {/* Left Flank: Anchored to Upper Third */}
            <div className="flex flex-col justify-start">
              <div className="js-editorial-left max-w-[200px] sm:max-w-[340px] lg:max-w-[440px] pt-2 sm:pt-4 lg:pt-8 will-change-transform">
                <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold uppercase tracking-tight text-white leading-[0.98] sm:leading-[0.95] drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] font-playfair">
                  Aviation <br />
                  moves at <br />
                  the speed of <br />
                  connection
                </h1>
              </div>
            </div>

            {/* Right Flank: Anchored to Lower Third */}
            <div className="flex flex-col justify-end pb-4 sm:pb-8 lg:pb-12 text-right">
              <div className="js-editorial-right max-w-[200px] sm:max-w-[340px] lg:max-w-[440px] ml-auto will-change-transform">
                <h2 className="text-2xl sm:text-4xl lg:text-6xl font-bold uppercase tracking-tight text-white leading-[0.98] sm:leading-[0.95] drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] font-playfair">
                  We’re the <br />
                  network layer <br />
                  of aviation ops
                </h2>
              </div>
            </div>
          </div>

          {/* Bottom Row: Narrative Description on Left, Scroll Pill on Right */}
          <div className="flex items-end justify-between w-full pt-4 gap-4">
            <div className="js-bottom-telemetry max-w-[240px] sm:max-w-[400px]">
              <p className="text-[11px] sm:text-xs lg:text-sm text-white/75 font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] font-playfair">
                The operating network of private aviation. Pilots, operators, flight departments, mechanics, and brokers — synchronized in real-time.
              </p>
            </div>

            <div className="js-scroll-prompt shrink-0 flex items-center gap-2 sm:gap-3 bg-white/10 border border-white/20 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white font-bold">
                SCROLL DOWN
              </span>
              <div
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #FFE27D 0%, #FFD700 60%, #F59E0B 100%)',
                  boxShadow: '0 0 12px rgba(255,215,0,0.7)',
                }}
              >
                <svg
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ── LAYER 5 (z-[38]): ACT 2 ARRIVAL - PJP DIGITAL ID LIVE SPECIMEN ── */}
        <div className="js-act2-headline pointer-events-none absolute inset-0 z-[38] flex items-center justify-center px-4 sm:px-10 lg:px-16 opacity-0 pt-12 lg:pt-0">
          <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-6 lg:gap-16">
            
            {/* Left Column: Specimen Narrative & Editorial Typography */}
            <div className="js-badge-text pointer-events-auto flex-1 max-w-xl text-left will-change-transform select-none">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#CBB079]/10 border border-[#CBB079]/30 mb-2 sm:mb-6">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#FFD700] animate-pulse" />
                <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#E0CCA0] font-semibold">
                  PJP DIGITAL ID // LIVE SPECIMEN
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-[3.5rem] font-bold tracking-tight text-white leading-[1.08] mb-2 sm:mb-6 font-playfair">
                A verified identity <br />
                you can{' '}
                <span
                  className="inline-block italic"
                  style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE57F 30%, #FFD700 60%, #D4AF37 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textDecoration: 'underline',
                    textDecorationColor: 'rgba(203, 176, 121, 0.4)',
                    textUnderlineOffset: '6px',
                  }}
                >
                  flash on the ramp.
                </span>
              </h2>

              <p className="text-xs sm:text-base text-white/70 leading-relaxed font-normal mb-3 sm:mb-8 max-w-lg font-playfair line-clamp-2 sm:line-clamp-none">
                Every PJP member gets a searchable, NFC-ready Digital ID. Scan the QR at any FBO — the badge goes live for 60 seconds with an illuminated clearance border, animated security hologram, and cryptographically-linked FAA credentials.
              </p>

              {/* Verified Checklist */}
              <div className="space-y-2 sm:space-y-3.5 mb-4 sm:mb-8">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#22c55e]/20 border border-[#22c55e] flex items-center justify-center flex-shrink-0">
                    <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[11px] sm:text-sm text-white/80 font-mono tracking-wide">
                    Cross-checked against 589k pilots in the FAA Airmen Registry
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#CBB079]/20 border border-[#CBB079] flex items-center justify-center flex-shrink-0">
                    <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#CBB079]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[11px] sm:text-sm text-white/80 font-mono tracking-wide">
                    Real-time ramp status — FBOs scan you in and out
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#FFD700]/20 border border-[#FFD700] flex items-center justify-center flex-shrink-0">
                    <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[11px] sm:text-sm text-white/80 font-mono tracking-wide">
                    NFC-ready — tap your phone to any reader
                  </span>
                </div>
              </div>

              {/* Action Buttons styled with PJP design system tokens */}
              <div className="relative z-50 flex flex-wrap items-center gap-3 pointer-events-auto">
                <button
                  type="button"
                  style={{
                    background: 'linear-gradient(135deg, #FFE27D 0%, #FFD700 60%, #F59E0B 100%)',
                    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
                  }}
                  className="px-4 py-2 sm:px-7 sm:py-3 rounded-sm text-black font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer select-none"
                  onClick={() => window.dispatchEvent(new CustomEvent('pjp:open-badge'))}
                >
                  <span className="pointer-events-none select-none">OPEN FULL BADGE ↗</span>
                </button>
                <button
                  type="button"
                  className="px-4 py-2 sm:px-7 sm:py-3 rounded-sm border border-[#CBB079]/30 hover:border-[#CBB079]/70 text-[#E0CCA0] font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all hover:bg-white/[0.04] cursor-pointer select-none"
                >
                  <span className="pointer-events-none select-none">GET YOUR PJP ID</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('pjp:open-fbo-scanner'))}
                  className="px-4 py-2 sm:px-6 sm:py-3 rounded-sm border border-[#CBB079]/50 hover:border-[#FFD700] bg-black/60 text-[#FFD700] font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold transition-all hover:bg-[#FFD700]/10 active:scale-95 cursor-pointer select-none"
                >
                  <span className="pointer-events-none select-none">FBO TERMINAL SIMULATOR ↗</span>
                </button>
              </div>
            </div>

            {/* Right Column: Interactive 3D Lanyard Hanging Ramp Specimen Badge */}
            <div
              className="js-badge-card pointer-events-auto relative z-50 will-change-transform scale-[0.78] sm:scale-90 lg:scale-100 origin-top lg:origin-center mt-2 lg:mt-0"
              style={{ perspective: '1600px' }}
            >
              <InteractiveLanyardBadge mode="hero" pilot={pilotProfile ?? undefined} /> 
            </div>

          </div>
        </div>

        {/* ── LAYER 6 (z-40): CORNER TELEMETRY HOOK (Clean container preserving GSAP targets) ── */}
        <div className="js-corner-telemetry pointer-events-none absolute inset-0 z-40" />

        {/* ── LAYER 7 (z-50): TACTICAL TELEMETRY INSPECTION DRAWER ── */}
        {activeService && (
          <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#0a0c10]/95 border-l border-[#FFD700]/40 backdrop-blur-xl p-8 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFD700] animate-pulse" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#FFD700]">
                    {activeService.serviceCode}
                  </span>
                </div>
                <button
                  onClick={() => setActiveService(null)}
                  className="font-mono text-xs text-white/50 hover:text-white uppercase tracking-wider px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer select-none"
                >
                  [ CLOSE ✕ ]
                </button>
              </div>

              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">
                COMPONENT // {activeService.partName}
              </p>
              <h3 className="text-3xl font-bold text-white mb-2 tracking-tight font-playfair">
                {activeService.title}
              </h3>
              <p className="font-mono text-xs text-[#38bdf8] mb-6">
                ● STATUS // {activeService.stat}
              </p>

              <div className="bg-white/[0.03] border border-white/10 rounded-sm p-4 mb-6">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#FFD700] block mb-2">
                  OPERATIONAL ARCHITECTURE
                </span>
                <p className="text-xs text-white/80 leading-relaxed font-light font-playfair">
                  {activeService.description}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-white/10">
              <button
                onClick={handleScrollToEcosystem}
                className="w-full py-3.5 bg-[#FFD700] hover:bg-[#ffe27d] text-black font-bold text-xs uppercase tracking-[0.2em] transition-all rounded-sm shadow-[0_4px_20px_rgba(255,215,0,0.3)] font-mono cursor-pointer select-none"
              >
                Inspect Ecosystem Matrix ↓
              </button>
              <button
                onClick={() => setActiveService(null)}
                className="w-full py-2.5 bg-transparent hover:bg-white/5 text-white/60 hover:text-white font-mono text-[10px] uppercase tracking-[0.2em] transition-colors rounded-sm cursor-pointer select-none"
              >
                Return to Airframe View
              </button>
            </div>
          </aside>
        )}

      </div>
    </section>
  );
};

export default CinematicHero;