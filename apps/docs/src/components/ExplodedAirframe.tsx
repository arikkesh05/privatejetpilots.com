// apps/docs/src/components/ExplodedAirframe.tsx
import React, { useState, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

export interface AirframeService {
  id: string;
  partName: string;
  serviceCode: string;
  title: string;
  stat: string;
  description: string;
  flank: 'left' | 'right';
}

export const AIRFRAME_SERVICES: Record<string, AirframeService> = {
  cockpit: {
    id: 'cockpit',
    partName: 'COCKPIT & AVIONICS',
    serviceCode: 'SYS 01',
    title: 'Verified Flight Deck',
    stat: '26,500+ Type-Rated Aviators',
    description: 'Direct flight deck connectivity. Part 91 & 135 commanders dispatched on demand.',
    flank: 'left',
  },
  portWing: {
    id: 'portWing',
    partName: 'PORT AEROFOIL',
    serviceCode: 'SYS 08',
    title: 'Instant 3D Charter',
    stat: 'Zero Broker Markup',
    description: 'Real-time multi-leg corridor routing with live atmospheric winds and wholesale quotes.',
    flank: 'left',
  },
  leftEngine: {
    id: 'leftEngine',
    partName: 'PORT TURBOFAN',
    serviceCode: 'SYS 04',
    title: 'Live Fuel Dispatch',
    stat: '163 Active Terminals',
    description: 'Real-time retail vs. negotiated contract fuel index refreshed every hour.',
    flank: 'left',
  },
  cabin: {
    id: 'cabin',
    partName: 'FUSELAGE CABIN TUBE',
    serviceCode: 'SYS 05',
    title: 'Pilot Vault & PHF',
    stat: '591K+ FAA Cross-Checks',
    description: 'Automated Pilot History Forms (PHF) with cryptographically verified logbooks.',
    flank: 'right',
  },
  starboardWing: {
    id: 'starboardWing',
    partName: 'STARBOARD AEROFOIL',
    serviceCode: 'SYS 07',
    title: 'Airframe Marketplace',
    stat: '6 Pre-Market Tail Numbers',
    description: 'Direct aircraft acquisitions with pre-buy inspection records signed by licensed A&Ps.',
    flank: 'right',
  },
  empennage: {
    id: 'empennage',
    partName: 'T-TAIL & EMPENNAGE',
    serviceCode: 'SYS 09',
    title: 'JumpSeat & FBO Unicom',
    stat: '2,500+ Active Corridors',
    description: 'Complimentary crew repositioning transit and direct ramp dispatch by tail number.',
    flank: 'right',
  },
};

interface ExplodedAirframeProps {
  onSelectService?: (service: AirframeService) => void;
  activeServiceId?: string | null;
}

export const ExplodedAirframe: React.FC<ExplodedAirframeProps> = ({
  onSelectService,
  activeServiceId,
}) => {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const leftServices = Object.values(AIRFRAME_SERVICES).filter((s) => s.flank === 'left');
  const rightServices = Object.values(AIRFRAME_SERVICES).filter((s) => s.flank === 'right');

  // ── Jitter-Style Ambient Zero-Gravity Micro-Floating Physics ──
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Organic asynchronous card floating drift
      const cards = containerRef.current?.querySelectorAll('.js-floating-card');
      cards?.forEach((card, i) => {
        gsap.to(card, {
          y: i % 2 === 0 ? -7 : 7,
          x: i % 3 === 0 ? 3 : -3,
          duration: 3.8 + i * 0.45,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: i * 0.2,
        });
      });

      // 2. Liquid Ambient Bubbles breathing motion
      gsap.to('.js-ambient-bubble-left', {
        x: 25,
        y: -20,
        scale: 1.15,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.js-ambient-bubble-right', {
        x: -25,
        y: 20,
        scale: 1.12,
        duration: 9,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, containerRef.current);

    return () => ctx.revert();
  }, []);

  const getPartHighlight = (partId: string) => {
    const isSelected = hoveredPart === partId || activeServiceId === partId;
    return {
      filter: isSelected
        ? 'drop-shadow(0 0 22px rgba(255, 215, 0, 0.9)) drop-shadow(0 0 50px rgba(212, 175, 55, 0.45))'
        : 'none',
      transition: 'filter 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
      opacity: hoveredPart && !isSelected ? 0.85 : 1,
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-between px-3 sm:px-6 lg:px-14 select-none overflow-visible"
    >
      {/* ── JITTER AMBIENT BUBBLE 1 (Left Liquid Glow) ── */}
      <div className="js-ambient-bubble-left pointer-events-none absolute -left-10 top-1/4 w-80 h-80 rounded-full bg-gradient-to-tr from-[#FFD700]/14 via-[#D4AF37]/10 to-transparent blur-[90px] will-change-transform" />

      {/* ── JITTER AMBIENT BUBBLE 2 (Right Liquid Glow) ── */}
      <div className="js-ambient-bubble-right pointer-events-none absolute -right-10 top-1/3 w-80 h-80 rounded-full bg-gradient-to-bl from-[#D4AF37]/14 via-[#FFD700]/10 to-transparent blur-[90px] will-change-transform" />

      {/* ── LEFT FLANK: LUXURY GOLDEN SMOKED-GLASS PODS ── */}
      <div className="js-flank-left z-40 flex flex-col justify-center gap-2.5 sm:gap-4 lg:gap-5 w-[47%] sm:w-[260px] lg:w-auto lg:max-w-[315px] pointer-events-auto">
        {leftServices.map((service, idx) => {
          const isSelected = hoveredPart === service.id || activeServiceId === service.id;
          return (
            <div
              key={service.id}
              data-actionable
              role="button"
              className={`js-floating-card relative group cursor-pointer transition-all duration-500 ease-out p-2.5 sm:p-4 lg:p-4.5 rounded-xl sm:rounded-2xl will-change-transform overflow-hidden ${
                isSelected
                  ? 'smoked-gold-pod-active scale-[1.02] sm:scale-[1.03]'
                  : 'smoked-gold-pod hover:scale-[1.015] hover:border-[#D4AF37]/45'
              }`}
              onMouseEnter={() => setHoveredPart(service.id)}
              onMouseLeave={() => setHoveredPart(null)}
              onClick={() => onSelectService?.(service)}
            >
              {/* Brushed Metallic Gold Specular Glint */}
              <div className="smoked-gold-glint" />

              {/* Ambient Hover Gradient Sheen */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FFD700]/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Header Telemetry Pill */}
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <span
                  className={`px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full font-mono text-[8px] sm:text-[9px] font-semibold tracking-wider transition-all duration-300 ${
                    isSelected
                      ? 'bg-[#FFD700]/25 text-[#FFD700] border border-[#FFD700]/60 shadow-[0_0_12px_rgba(255,215,0,0.3)]'
                      : 'bg-white/[0.04] text-[#E0CCA0]/70 border border-[#D4AF37]/20 group-hover:border-[#D4AF37]/40'
                  }`}
                >
                  {service.serviceCode}
                </span>

                <div className="flex items-center gap-1 sm:gap-1.5 font-mono text-[8px] sm:text-[9px] text-[#E0CCA0]/50">
                  <span
                    className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#FFD700] shadow-[0_0_10px_#FFD700] scale-125'
                        : 'bg-[#D4AF37]/60 shadow-[0_0_6px_rgba(212,175,55,0.4)]'
                    }`}
                  />
                  0{idx + 1}
                </div>
              </div>

              {/* Title */}
              <h4 className="font-luxyna text-xs sm:text-sm lg:text-[15px] font-semibold text-white tracking-wide uppercase mb-0.5 sm:mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-1 sm:line-clamp-none">
                {service.title}
              </h4>

              {/* Stat Metric */}
              <p className="font-mono text-[8.5px] sm:text-[10px] lg:text-[10.5px] text-[#E0CCA0] font-medium tracking-wide mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="inline-block w-1 h-1 rounded-full bg-[#FFD700] shadow-[0_0_6px_#FFD700] shrink-0" />
                <span className="truncate">{service.stat}</span>
              </p>

              {/* Description */}
              <p className="font-sans text-[9px] sm:text-[11px] lg:text-xs text-white/75 leading-tight sm:leading-relaxed font-light line-clamp-2 sm:line-clamp-none">
                {service.description}
              </p>

              {/* Dynamic Laser Tether (Desktop only) */}
              <div
                className={`hidden lg:block absolute top-1/2 -right-8 h-[1px] pointer-events-none transition-all duration-500 ${
                  isSelected
                    ? 'w-14 bg-gradient-to-r from-[#FFD700] to-transparent shadow-[0_0_12px_#FFD700] opacity-100'
                    : 'w-8 bg-gradient-to-r from-[#D4AF37]/30 to-transparent opacity-40'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* ── CENTER AIRFRAME STAGE ── */}
      <div className="absolute lg:relative inset-0 lg:inset-auto z-20 flex-1 h-full lg:h-[85vh] max-h-[920px] max-w-[850px] mx-auto flex items-center justify-center scale-[0.80] sm:scale-90 lg:scale-100 transition-transform pointer-events-none lg:pointer-events-auto">
        {/* Dynamic Contact Ground Shadow */}
        <div
          className="js-jet-shadow pointer-events-none absolute inset-0 scale-90 translate-y-12 rounded-full"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, transparent 75%)',
          }}
        />

        {/* Interior Cabin Blueprint */}
        <img
          src="/jet-blueprint.png"
          alt="Cabin Architecture Blueprint"
          className="js-blueprint-layer absolute inset-0 z-10 h-full w-full object-contain pointer-events-none opacity-0"
        />

        {/* Solid Intact Jet */}
        <img
          src="/jet-exterior.png"
          alt="PJP Executive Jet Solid Shell"
          className="js-solid-jet absolute inset-0 z-20 h-full w-full object-contain pointer-events-none opacity-100 select-none"
        />

        {/* ── COMPONENT 1: Cockpit Radome Bulkhead ── */}
        <div
          className="js-part-cockpit absolute inset-0 z-30 cursor-pointer pointer-events-none"
          style={getPartHighlight('cockpit')}
          onMouseEnter={() => setHoveredPart('cockpit')}
          onMouseLeave={() => setHoveredPart(null)}
          onClick={() => onSelectService?.(AIRFRAME_SERVICES.cockpit)}
        >
          <img
            src="/jet-exterior.png"
            alt="Cockpit"
            className="w-full h-full object-contain pointer-events-none"
            style={{
              clipPath: 'polygon(42% 0%, 58% 0%, 58% 28%, 42% 28%)',
            }}
          />
        </div>

        {/* ── COMPONENT 2: Port Swept Aerofoil ── */}
        <div
          className="js-part-wing-left absolute inset-0 z-25 cursor-pointer pointer-events-none"
          style={getPartHighlight('portWing')}
          onMouseEnter={() => setHoveredPart('portWing')}
          onMouseLeave={() => setHoveredPart(null)}
          onClick={() => onSelectService?.(AIRFRAME_SERVICES.portWing)}
        >
          <img
            src="/jet-exterior.png"
            alt="Port Wing"
            className="w-full h-full object-contain pointer-events-none"
            style={{
              clipPath: 'polygon(0% 32%, 44% 32%, 44% 78%, 0% 78%)',
            }}
          />
        </div>

        {/* ── COMPONENT 3: Starboard Swept Aerofoil ── */}
        <div
          className="js-part-wing-right absolute inset-0 z-25 cursor-pointer pointer-events-none"
          style={getPartHighlight('starboardWing')}
          onMouseEnter={() => setHoveredPart('starboardWing')}
          onMouseLeave={() => setHoveredPart(null)}
          onClick={() => onSelectService?.(AIRFRAME_SERVICES.starboardWing)}
        >
          <img
            src="/jet-exterior.png"
            alt="Starboard Wing"
            className="w-full h-full object-contain pointer-events-none"
            style={{
              clipPath: 'polygon(56% 32%, 100% 32%, 100% 78%, 56% 78%)',
            }}
          />
        </div>

        {/* ── COMPONENT 4: Port Turbofan Engine ── */}
        <div
          className="js-part-engine-left absolute inset-0 z-28 cursor-pointer pointer-events-none"
          style={getPartHighlight('leftEngine')}
          onMouseEnter={() => setHoveredPart('leftEngine')}
          onMouseLeave={() => setHoveredPart(null)}
          onClick={() => onSelectService?.(AIRFRAME_SERVICES.leftEngine)}
        >
          <img
            src="/jet-exterior.png"
            alt="Port Engine"
            className="w-full h-full object-contain pointer-events-none"
            style={{
              clipPath: 'polygon(37% 65%, 48% 65%, 48% 82%, 37% 82%)',
            }}
          />
        </div>

        {/* ── COMPONENT 5: Starboard Turbofan Engine ── */}
        <div
          className="js-part-engine-right absolute inset-0 z-28 cursor-pointer pointer-events-none"
          style={getPartHighlight('starboardWing')}
          onMouseEnter={() => setHoveredPart('starboardWing')}
          onMouseLeave={() => setHoveredPart(null)}
          onClick={() => onSelectService?.(AIRFRAME_SERVICES.starboardWing)}
        >
          <img
            src="/jet-exterior.png"
            alt="Starboard Engine"
            className="w-full h-full object-contain pointer-events-none"
            style={{
              clipPath: 'polygon(52% 65%, 63% 65%, 63% 82%, 52% 82%)',
            }}
          />
        </div>

        {/* ── COMPONENT 6: Empennage T-Tail ── */}
        <div
          className="js-part-tail absolute inset-0 z-25 cursor-pointer pointer-events-none"
          style={getPartHighlight('empennage')}
          onMouseEnter={() => setHoveredPart('empennage')}
          onMouseLeave={() => setHoveredPart(null)}
          onClick={() => onSelectService?.(AIRFRAME_SERVICES.empennage)}
        >
          <img
            src="/jet-exterior.png"
            alt="Empennage"
            className="w-full h-full object-contain pointer-events-none"
            style={{
              clipPath: 'polygon(30% 78%, 70% 78%, 70% 100%, 30% 100%)',
            }}
          />
        </div>

        {/* ── COMPONENT 7: Central Fuselage Cabin Tube ── */}
        <div
          className="js-part-cabin absolute inset-0 z-22 cursor-pointer pointer-events-none"
          style={getPartHighlight('cabin')}
          onMouseEnter={() => setHoveredPart('cabin')}
          onMouseLeave={() => setHoveredPart(null)}
          onClick={() => onSelectService?.(AIRFRAME_SERVICES.cabin)}
        >
          <img
            src="/jet-exterior.png"
            alt="Cabin Fuselage"
            className="w-full h-full object-contain pointer-events-none"
            style={{
              clipPath: 'polygon(43% 28%, 57% 28%, 57% 78%, 43% 78%)',
            }}
          />
        </div>
      </div>

      {/* ── RIGHT FLANK: LUXURY GOLDEN SMOKED-GLASS PODS ── */}
      <div className="js-flank-right z-40 flex flex-col justify-center gap-2.5 sm:gap-4 lg:gap-5 w-[47%] sm:w-[260px] lg:w-auto lg:max-w-[315px] pointer-events-auto text-right">
        {rightServices.map((service, idx) => {
          const isSelected = hoveredPart === service.id || activeServiceId === service.id;
          return (
            <div
              key={service.id}
              data-actionable
              role="button"
              className={`js-floating-card relative group cursor-pointer transition-all duration-500 ease-out p-2.5 sm:p-4 lg:p-4.5 rounded-xl sm:rounded-2xl will-change-transform overflow-hidden ${
                isSelected
                  ? 'smoked-gold-pod-active scale-[1.02] sm:scale-[1.03]'
                  : 'smoked-gold-pod hover:scale-[1.015] hover:border-[#D4AF37]/45'
              }`}
              onMouseEnter={() => setHoveredPart(service.id)}
              onMouseLeave={() => setHoveredPart(null)}
              onClick={() => onSelectService?.(service)}
            >
              {/* Brushed Metallic Gold Specular Glint */}
              <div className="smoked-gold-glint" />

              {/* Ambient Hover Gradient Sheen */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FFD700]/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Dynamic Laser Tether (Desktop only) */}
              <div
                className={`hidden lg:block absolute top-1/2 -left-8 h-[1px] pointer-events-none transition-all duration-500 ${
                  isSelected
                    ? 'w-14 bg-gradient-to-l from-[#FFD700] to-transparent shadow-[0_0_12px_#FFD700] opacity-100'
                    : 'w-8 bg-gradient-to-l from-[#D4AF37]/30 to-transparent opacity-40'
                }`}
              />

              {/* Header Telemetry Pill */}
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="flex items-center gap-1 sm:gap-1.5 font-mono text-[8px] sm:text-[9px] text-[#E0CCA0]/50">
                  0{idx + 4}
                  <span
                    className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#FFD700] shadow-[0_0_10px_#FFD700] scale-125'
                        : 'bg-[#D4AF37]/60 shadow-[0_0_6px_rgba(212,175,55,0.4)]'
                    }`}
                  />
                </div>

                <span
                  className={`px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full font-mono text-[8px] sm:text-[9px] font-semibold tracking-wider transition-all duration-300 ${
                    isSelected
                      ? 'bg-[#FFD700]/25 text-[#FFD700] border border-[#FFD700]/60 shadow-[0_0_12px_rgba(255,215,0,0.3)]'
                      : 'bg-white/[0.04] text-[#E0CCA0]/70 border border-[#D4AF37]/20 group-hover:border-[#D4AF37]/40'
                  }`}
                >
                  {service.serviceCode}
                </span>
              </div>

              {/* Title */}
              <h4 className="font-luxyna text-xs sm:text-sm lg:text-[15px] font-semibold text-white tracking-wide uppercase mb-0.5 sm:mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-1 sm:line-clamp-none">
                {service.title}
              </h4>

              {/* Stat Metric */}
              <p className="font-mono text-[8.5px] sm:text-[10px] lg:text-[10.5px] text-[#E0CCA0] font-medium tracking-wide mb-1 sm:mb-1.5 flex items-center justify-end gap-1 sm:gap-1.5 truncate">
                <span className="truncate">{service.stat}</span>
                <span className="inline-block w-1 h-1 rounded-full bg-[#FFD700] shadow-[0_0_6px_#FFD700] shrink-0" />
              </p>

              {/* Description */}
              <p className="font-sans text-[9px] sm:text-[11px] lg:text-xs text-white/75 leading-tight sm:leading-relaxed font-light line-clamp-2 sm:line-clamp-none">
                {service.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExplodedAirframe;