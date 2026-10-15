'use client';

import React, { useState } from 'react';
import { ICAO_AIRPORTS, type AirportTelemetry } from '../data/telemetry-airports.js';

const STATUS_CONFIG = {
  VFR: {
    color: 'text-emerald-400',
    dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]',
    badge: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40',
    label: 'VFR',
  },
  MVFR: {
    color: 'text-amber-400',
    dot: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]',
    badge: 'border-amber-500/40 text-amber-400 bg-amber-950/40',
    label: 'MVFR',
  },
  IFR: {
    color: 'text-rose-400',
    dot: 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.9)]',
    badge: 'border-rose-500/40 text-rose-400 bg-rose-950/40',
    label: 'IFR',
  },
  HOLD: {
    color: 'text-purple-400',
    dot: 'bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.9)]',
    badge: 'border-purple-500/40 text-purple-400 bg-purple-950/40',
    label: 'HOLD',
  },
} as const;

export function IcaoAvionicsTicker() {
  const [activeAirport, setActiveAirport] = useState<AirportTelemetry | null>(null);

  // Exact 2x duplication for 100% mathematically seamless 0% -> -50% marquee looping
  const loopStream = [...ICAO_AIRPORTS, ...ICAO_AIRPORTS];

  return (
    <div className="relative w-full z-40 select-none border-y border-white/10 bg-[#05070a]/95 backdrop-blur-md">
      
      {/* ── Direct Hardware-Accelerated Marquee Engine ── */}
      <style>{`
        @keyframes pjp-infinite-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .pjp-ticker-rail {
          display: flex;
          width: max-content;
          will-change: transform;
          animation: pjp-infinite-scroll 110s linear infinite;
        }
        .pjp-ticker-rail:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Laser HUD Grid Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Optical Edge Gradients for Smooth In/Out Fades */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-28 bg-gradient-to-r from-[#05070a] via-[#05070a]/90 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-28 bg-gradient-to-l from-[#05070a] via-[#05070a]/90 to-transparent z-10" />

      {/* Main Bar Frame */}
      <div className="relative flex items-center h-10 px-4">
        {/* Left Telemetry Anchor Pill */}
        <div className="shrink-0 flex items-center gap-2.5 pr-4 mr-2 border-r border-white/10 z-20 bg-[#05070a]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CBB079] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#CBB079] shadow-[0_0_8px_#CBB079]" />
          </span>
          <span className="font-mono text-[10px] tracking-[0.24em] font-bold text-[#CBB079] uppercase">
            PJP·OPS
          </span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 tracking-wider">
            163 STNS
          </span>
        </div>

        {/* Scrolling Telemetry Rail */}
        <div className="flex overflow-hidden flex-1 group">
          <div className="pjp-ticker-rail items-center gap-6 whitespace-nowrap">
            {loopStream.map((apt, idx) => {
              const cfg = STATUS_CONFIG[apt.status];
              const isSelected = activeAirport?.icao === apt.icao;

              return (
                <div
                  key={`${apt.icao}-${idx}`}
                  onMouseEnter={() => setActiveAirport(apt)}
                  onMouseLeave={() => setActiveAirport(null)}
                  className={`relative flex items-center gap-2 py-1 px-3 rounded-full transition-all duration-200 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#CBB079]/15 border-[#CBB079]/60 shadow-[0_0_10px_rgba(203,176,121,0.3)]'
                      : 'border-transparent hover:bg-white/[0.06]'
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                  <span
                    className={`font-mono text-xs font-bold tracking-widest transition-colors ${
                      isSelected ? 'text-[#CBB079]' : 'text-white/90'
                    }`}
                  >
                    {apt.icao}
                  </span>
                  <span className="font-mono text-[11px] text-white/50 tracking-wider">
                    {apt.temp}
                  </span>
                  <span className="font-mono text-[10px] text-white/30 hidden sm:inline">
                    {apt.wind}
                  </span>
                  <span className="text-white/10 ml-2 font-mono text-[10px]">/</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Zulu Telemetry Status */}
        <div className="hidden lg:flex shrink-0 items-center gap-3 pl-4 ml-2 border-l border-white/10 z-20 bg-[#05070a]">
          <span className="font-mono text-[10px] tracking-widest text-[#22c55e] uppercase flex items-center gap-1.5 font-bold">
            <span className="size-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            SAT-FEED ACTIVE
          </span>
        </div>
      </div>

      {/* ── Aerodynamic Tactical Capsule / Pill HUD ── */}
      {activeAirport && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 z-50 pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3 sm:gap-4 px-4 py-1.5 rounded-full bg-[#070b12]/95 backdrop-blur-2xl border border-[#CBB079]/60 shadow-[0_12px_36px_rgba(0,0,0,0.95),0_0_20px_rgba(203,176,121,0.25)] text-white text-xs font-mono whitespace-nowrap">
            
            {/* Airport ID Pill */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-black tracking-widest text-[#CBB079] bg-[#CBB079]/15 px-2 py-0.5 rounded-full border border-[#CBB079]/40">
                {activeAirport.icao}
              </span>
              <span
                className={`text-[8.5px] px-1.5 py-0.2 rounded-full border ${
                  STATUS_CONFIG[activeAirport.status].badge
                } font-bold uppercase tracking-wider`}
              >
                {STATUS_CONFIG[activeAirport.status].label}
              </span>
            </div>

            {/* Station Identity */}
            <div className="hidden md:flex items-center gap-1 text-[11px] text-white/80">
              <span className="font-semibold text-white">{activeAirport.name}</span>
              <span className="text-white/30 font-light">({activeAirport.city})</span>
            </div>

            <span className="text-white/15">|</span>

            {/* Tactical Readings */}
            <div className="flex items-center gap-3 text-[10px]">
              <div>
                <span className="text-white/40 mr-1 uppercase">WND</span>
                <span className="text-white font-semibold">{activeAirport.wind}</span>
              </div>
              <div>
                <span className="text-white/40 mr-1 uppercase">TMP</span>
                <span className="text-white font-semibold">{activeAirport.temp}</span>
              </div>
              <div>
                <span className="text-white/40 mr-1 uppercase">QNH</span>
                <span className="text-[#CBB079] font-bold">{activeAirport.altimeter}</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-white/40 mr-1 uppercase">RWY</span>
                <span className="text-white font-semibold">{activeAirport.runwayActive}</span>
              </div>
            </div>

            <span className="text-white/15">|</span>

            {/* Link Beacon */}
            <div className="flex items-center gap-1.5 text-[9px] text-[#22c55e] font-semibold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e]" />
              <span className="hidden sm:inline">PJP LINK</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default IcaoAvionicsTicker;