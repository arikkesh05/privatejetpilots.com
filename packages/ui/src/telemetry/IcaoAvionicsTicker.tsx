'use client';

import React, { useState } from 'react';
import { ICAO_AIRPORTS, type AirportTelemetry } from '../data/telemetry-airports.js';

const STATUS_CONFIG = {
  VFR: {
    color: 'text-emerald-400',
    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
    badge: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/40',
    label: 'VFR · OPTIMAL',
  },
  MVFR: {
    color: 'text-amber-400',
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]',
    badge: 'border-amber-500/30 text-amber-400 bg-amber-950/40',
    label: 'MVFR · ADVISORY',
  },
  IFR: {
    color: 'text-rose-400',
    dot: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.9)]',
    badge: 'border-rose-500/30 text-rose-400 bg-rose-950/40',
    label: 'IFR · INSTRUMENT',
  },
  HOLD: {
    color: 'text-purple-400',
    dot: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.9)]',
    badge: 'border-purple-500/30 text-purple-400 bg-purple-950/40',
    label: 'RAMP HOLD',
  },
} as const;

export function IcaoAvionicsTicker() {
  const [activeAirport, setActiveAirport] = useState<AirportTelemetry | null>(null);

  // Triple duplicated dataset to guarantee a seamless looping marquee rail
  const loopStream = [...ICAO_AIRPORTS, ...ICAO_AIRPORTS, ...ICAO_AIRPORTS];

  return (
    <div className="relative w-full z-40 select-none overflow-hidden border-y border-white/10 bg-[#040405]/95 backdrop-blur-md">
      {/* Laser HUD Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Optical Edge Gradients for Smooth In/Out Fades */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#040405] via-[#040405]/80 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#040405] via-[#040405]/80 to-transparent z-10" />

      {/* Main Bar Frame */}
      <div className="relative flex items-center h-10 px-4">
        {/* Left Telemetry Anchor Pill */}
        <div className="shrink-0 flex items-center gap-2.5 pr-4 mr-2 border-r border-white/10 z-20 bg-[#040405]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          </span>
          <span className="font-mono text-[10px] tracking-[0.24em] font-semibold text-white/80 uppercase">
            PJP·OPS
          </span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 tracking-wider">
            163 STNS
          </span>
        </div>

        {/* Scrolling Telemetry Rail */}
        <div className="flex overflow-hidden flex-1 group">
          <div className="flex shrink-0 items-center gap-6 animate-pjp-ticker group-hover:[animation-play-state:paused] whitespace-nowrap">
            {loopStream.map((apt, idx) => {
              const cfg = STATUS_CONFIG[apt.status];
              return (
                <div
                  key={`${apt.icao}-${idx}`}
                  onMouseEnter={() => setActiveAirport(apt)}
                  onMouseLeave={() => setActiveAirport(null)}
                  className="relative flex items-center gap-2 py-1 px-2.5 rounded hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
                >
                  <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                  <span className="font-mono text-xs font-bold tracking-widest text-white/90 group-hover:text-white transition-colors">
                    {apt.icao}
                  </span>
                  <span className="font-mono text-[11px] text-white/40 tracking-wider">
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

        {/* Right System Zulu Telemetry Status */}
        <div className="hidden lg:flex shrink-0 items-center gap-3 pl-4 ml-2 border-l border-white/10 z-20 bg-[#040405]">
          <span className="font-mono text-[10px] tracking-widest text-emerald-400 uppercase flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SAT-FEED ACTIVE
          </span>
        </div>
      </div>

      {/* Floating Tactical Avionics Telemetry Card on Hover */}
      {activeAirport && (
        <div className="absolute left-1/2 -translate-x-1/2 top-11 z-50 pointer-events-none transition-all duration-200 animate-in fade-in slide-in-from-top-1">
          <div className="w-80 rounded-lg bg-[#0A0B0E]/95 backdrop-blur-2xl border border-white/15 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_20px_rgba(203,176,121,0.15)] text-white">
            <div className="flex items-start justify-between border-b border-white/10 pb-2.5 mb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold tracking-widest text-[#FFD700]">
                    {activeAirport.icao}
                  </span>
                  <span
                    className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
                      STATUS_CONFIG[activeAirport.status].badge
                    } font-semibold`}
                  >
                    {STATUS_CONFIG[activeAirport.status].label}
                  </span>
                </div>
                <p className="text-xs text-white/90 font-medium mt-0.5">{activeAirport.name}</p>
                <p className="text-[10px] text-white/50">{activeAirport.city}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              <div className="rounded bg-white/[0.03] border border-white/5 p-1.5">
                <span className="block text-[9px] text-white/40 tracking-wider uppercase">WIND</span>
                <span className="text-xs font-semibold text-white/90">{activeAirport.wind}</span>
              </div>
              <div className="rounded bg-white/[0.03] border border-white/5 p-1.5">
                <span className="block text-[9px] text-white/40 tracking-wider uppercase">TEMP</span>
                <span className="text-xs font-semibold text-white/90">{activeAirport.temp}</span>
              </div>
              <div className="rounded bg-white/[0.03] border border-white/5 p-1.5">
                <span className="block text-[9px] text-white/40 tracking-wider uppercase">ALTIM</span>
                <span className="text-xs font-semibold text-cyan-300">{activeAirport.altimeter}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/10 text-[10px] font-mono text-white/50">
              <span>
                ACTIVE: <strong className="text-white/80">{activeAirport.runwayActive}</strong>
              </span>
              <span className="text-[#CB9B59]">PJP RAMP LINK OK</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}