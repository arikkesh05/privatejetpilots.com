'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PilotCredential, DEFAULT_PILOT_SPECIMEN } from '../types/credential';
import { useAvionicsAudio } from '../hooks/useAvionicsAudio';

export interface InteractiveLanyardBadgeProps {
  mode?: 'hero' | 'modal';
  onOpenFullModal?: () => void;
  pilot?: PilotCredential;
}

export const InteractiveLanyardBadge: React.FC<InteractiveLanyardBadgeProps> = ({
  mode = 'hero',
  pilot,
}) => {
  const data = pilot ?? DEFAULT_PILOT_SPECIMEN;
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 30, opacity: 0 });
  const [, setTick] = useState(0);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const lastCycleRef = useRef<number>(Math.floor(Date.now() / 30000));

  const audio = useAvionicsAudio(false);

  const deriveTokenHash = (cycle: number): string => {
    let hash = 5381;
    const str = String(cycle);
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `0x${hex.slice(0, 4)}...${hex.slice(-4)}`;
  };

  const remainingSeconds = 30 - (Math.floor(Date.now() / 1000) % 30);
  const cycle = Math.floor(Date.now() / 30000);
  const tokenHash = deriveTokenHash(cycle);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      const newCycle = Math.floor(Date.now() / 30000);
      if (newCycle !== lastCycleRef.current) {
        lastCycleRef.current = newCycle;
        setIsFlipped((prev) => !prev);
        if (audio && typeof audio.chirp === 'function') {
          audio.chirp();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [audio]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const rotX = (0.5 - py) * 18;
    const rotY = (px - 0.5) * 20;

    setTilt({ x: rotX, y: rotY });
    setGlare({ x: px * 100, y: py * 100, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  const handleFlip = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-no-flip="true"]')) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    if (audio && typeof audio.chirp === 'function') {
      audio.chirp();
    }
    setIsFlipped((prev) => !prev);
  };

  const handleNfcTap = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isTransmitting) return;
    if (audio && typeof audio.chirp === 'function') {
      audio.chirp();
    }
    setIsTransmitting(true);
    setTimeout(() => {
      setIsTransmitting(false);
    }, 1800);
  };

  const handleQrClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    window.dispatchEvent(
      new CustomEvent('pjp:open-fbo-scanner', {
        detail: { pilot: data, tokenHash, cycle },
      })
    );
  };

  const cardWidth = mode === 'modal' ? '356px' : '332px';
  const cardHeight = mode === 'modal' ? '516px' : '484px';

  return (
    <div
      className="relative flex flex-col items-center select-none"
      style={{ perspective: '2000px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── PHYSICAL SATIN LANYARD RIBBON & SWIVEL CLASP ── */}
      <div
        className="pointer-events-none relative z-30 flex flex-col items-center"
        style={{ marginBottom: '-16px' }}
      >
        <svg
          width={mode === 'modal' ? '88' : '78'}
          height={mode === 'modal' ? '120' : '98'}
          viewBox="0 0 88 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_16px_28px_rgba(0,0,0,0.95)]"
        >
          <defs>
            <linearGradient id="lanyardFabric" x1="26" y1="0" x2="62" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#080A0D" />
              <stop offset="20%" stopColor="#171A21" />
              <stop offset="50%" stopColor="#252A36" />
              <stop offset="80%" stopColor="#171A21" />
              <stop offset="100%" stopColor="#080A0D" />
            </linearGradient>
            <linearGradient id="gunmetalHardware" x1="20" y1="80" x2="68" y2="105" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#20232B" />
              <stop offset="35%" stopColor="#555C6B" />
              <stop offset="50%" stopColor="#8C94A6" />
              <stop offset="70%" stopColor="#3C424E" />
              <stop offset="100%" stopColor="#171920" />
            </linearGradient>
            <linearGradient id="goldStitch" x1="44" y1="0" x2="44" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#CBB079" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#CBB079" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#CBB079" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          <path d="M26 0H54L58 84H30L26 0Z" fill="url(#lanyardFabric)" />
          <path d="M62 0H34L30 84H58L62 0Z" fill="url(#lanyardFabric)" opacity="0.92" />
          <line x1="44" y1="0" x2="44" y2="84" stroke="url(#goldStitch)" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="30" y1="0" x2="30" y2="84" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <line x1="58" y1="0" x2="58" y2="84" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <rect x="23" y="80" width="42" height="12" rx="3" fill="url(#gunmetalHardware)" stroke="#0E1015" strokeWidth="1" />
          <line x1="28" y1="86" x2="60" y2="86" stroke="#0A0B0E" strokeWidth="1.5" opacity="0.8" />
          <path d="M35 91 C35 104, 53 104, 53 91" stroke="url(#gunmetalHardware)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <rect x="37.5" y="98" width="13" height="22" rx="4" fill="url(#gunmetalHardware)" stroke="#0A0B0E" strokeWidth="1" />
          <circle cx="44" cy="112" r="2.5" fill="#0A0C0F" />
        </svg>
      </div>

      {/* ── 3D FLIPPABLE CHASSIS WRAPPER ── */}
      <div
        ref={cardRef}
        onClick={handleFlip}
        className="relative cursor-pointer"
        style={{
          width: cardWidth,
          height: cardHeight,
          transformStyle: 'preserve-3d',
          transition: glare.opacity === 0
            ? 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)'
            : 'transform 0.12s ease-out',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y + (isFlipped ? 180 : 0)}deg)`,
        }}
      >
        {/* Soft Ambient Gold/Cyan Aura */}
        <div
          className="pointer-events-none absolute -inset-4 rounded-[36px] opacity-45 blur-2xl transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle at 50% 30%, rgba(203,176,121,0.22), rgba(110,231,183,0.12) 60%, transparent 75%)',
          }}
        />

        {/* FRONT FACE */}
        <div
          className="absolute inset-0 rounded-[26px] p-6 flex flex-col justify-between overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            pointerEvents: isFlipped ? 'none' : 'auto',
            background: 'linear-gradient(170deg, #131720 0%, #0D0F15 50%, #07090D 100%)',
            boxShadow:
              '0 30px 80px -15px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 0 0 1px rgba(203,176,121,0.22)',
          }}
        >
          {/* Dynamic Aeronautical Chevrons */}
          <div className="pointer-events-none absolute inset-0 z-0 opacity-40">
            <svg className="w-full h-full" viewBox="0 0 356 516" fill="none" preserveAspectRatio="none">
              <path d="M-40 180 L280 40 L390 90 L-40 280 Z" fill="url(#chevronNavy)" />
              <path d="M-40 195 L280 55 L284 57 L-40 197 Z" fill="#CBB079" opacity="0.65" />
              <path d="M-40 310 L390 120 L390 145 L-40 335 Z" fill="url(#chevronCarbon)" />
              <path d="M-40 325 L390 135 L390 137 L-40 327 Z" fill="#CBB079" opacity="0.4" />
              <defs>
                <linearGradient id="chevronNavy" x1="0" y1="0" x2="390" y2="300" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#1B2333" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0E121B" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="chevronCarbon" x1="0" y1="0" x2="390" y2="300" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#181D26" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#0B0E14" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Cursor Glare Sweep */}
          <div
            className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
            style={{
              opacity: glare.opacity,
              background: `radial-gradient(420px circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.14) 0%, rgba(203,176,121,0.08) 35%, transparent 70%)`,
            }}
          />

          {/* Top Slot & Header Bar */}
          <div className="pointer-events-none relative z-20 flex flex-col items-center">
            <div
              className="w-16 h-2.5 rounded-full mb-4"
              style={{
                background: '#050608',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.95), 0 1px 0 rgba(255,255,255,0.12)',
              }}
            />

            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CBB079]" />
                <span className="font-['Inter'] text-[9px] font-bold tracking-[0.22em] text-[#CBB079] uppercase">
                  PJP // FLIGHT CREW
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0D2218] border border-[#6EE7B7]/30">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#4ADE80]" />
                </span>
                <span className="font-['JetBrains_Mono'] text-[8.5px] font-semibold tracking-wider text-[#6EE7B7] uppercase">
                  {data.isActive ? 'ACTIVE' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>

          {/* Centerpiece: Squircle Aviator Portrait with Gold Bezel */}
          <div className="pointer-events-none relative z-20 flex flex-col items-center text-center my-auto py-1">
            <div className="relative mb-4">
              <div
                className="w-36 h-36 rounded-2xl p-[2px] shadow-[0_12px_32px_rgba(0,0,0,0.85)]"
                style={{
                  background: 'linear-gradient(135deg, #CBB079 0%, #4A3E25 45%, #CBB079 70%, #1A1710 100%)',
                }}
              >
                <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#0A0D11] relative">
                  <img
                    src={data.portraitUrl}
                    alt={data.name}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center 15%' }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      boxShadow: 'inset 0 0 16px rgba(0,0,0,0.6)',
                    }}
                  />
                </div>
              </div>

              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-[#0E1117] border border-[#CBB079]/70 flex items-center gap-1 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CBB079]" />
                <span className="font-['JetBrains_Mono'] text-[8px] font-bold text-[#E5D5BA] tracking-wider">
                  FAA • ATP
                </span>
              </div>
            </div>

            <h3 className="font-['Mona_Sans',sans-serif] text-[23px] font-black tracking-[-0.02em] text-[#EDE8DF] uppercase leading-none">
              {data.name}
            </h3>
            <p className="font-['Inter'] text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#CBB079] mt-2">
              {data.role}
            </p>

            {/* Telemetry 3-Column Glass Matrix */}
            <div className="w-full grid grid-cols-3 gap-2 mt-4 text-center font-['JetBrains_Mono']">
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <span className="text-[7.5px] uppercase tracking-wider text-[#8E887E] block">FAA CERT</span>
                <span className="text-[11px] text-[#EDE8DF] font-semibold mt-0.5 block">{data.faaCert}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <span className="text-[7.5px] uppercase tracking-wider text-[#8E887E] block">MEDICAL</span>
                <span className="text-[11px] text-[#6EE7B7] font-semibold mt-0.5 block">{data.medicalClass}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <span className="text-[7.5px] uppercase tracking-wider text-[#8E887E] block">PASS ID</span>
                <span className="text-[11px] text-[#E0CCA0] font-semibold mt-0.5 block">{data.passId}</span>
              </div>
            </div>
          </div>

          {/* Bottom Dock: Dynamic Token & Scannable QR */}
          <div className="relative z-40 flex items-center justify-between w-full pt-2 mt-auto">
            <div
              data-no-flip="true"
              onClick={handleQrClick}
              className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer group"
              title="Click QR code to simulate FBO Ramp Scan"
            >
              <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center shadow-md transition-transform group-hover:scale-105 active:scale-95">
                <svg className="w-full h-full text-black pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h2v2h-2v-2zm-4 0h2v2h-2v-2zm2 4h4v2h-4v-2zm4-2h2v2h-2v-2zm-6 2h2v2h-2v-2zm6-4h2v2h-2v-2z" />
                </svg>
              </div>
              <div className="text-left font-['JetBrains_Mono'] pointer-events-none">
                <div className="text-[8px] uppercase tracking-[0.18em] text-[#8E887E] group-hover:text-[#CBB079] transition-colors">
                  SHA-256 // SCAN ↗
                </div>
                <div className="text-[10px] text-[#EDE8DF] font-semibold">ROTATES IN {remainingSeconds}S</div>
              </div>
            </div>

            <div
              data-no-flip="true"
              className="relative z-50 flex-shrink-0 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {isTransmitting && (
                <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />
              )}
              <button
                type="button"
                data-no-flip="true"
                onClick={handleNfcTap}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNfcTap(e);
                  }
                }}
                className="relative z-10 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-[#0a0d14] border border-[#2a3441] hover:border-emerald-500/60 active:scale-95 transition-all cursor-pointer select-none shadow-md"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pointer-events-none" />
                <span className="text-[10px] tracking-wider font-mono font-semibold text-slate-200 pointer-events-none">
                  {isTransmitting ? 'TRANSMITTING...' : 'NFC READY'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div
          className="absolute inset-0 rounded-[26px] p-6 flex flex-col justify-between overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            pointerEvents: isFlipped ? 'auto' : 'none',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(170deg, #131720 0%, #0D0F15 50%, #07090D 100%)',
            boxShadow:
              '0 30px 80px -15px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 0 0 1px rgba(203,176,121,0.22)',
          }}
        >
          {/* Top Stripe */}
          <div className="pointer-events-none relative z-20">
            <div
              className="w-16 h-2.5 mx-auto rounded-full mb-4"
              style={{
                background: '#050608',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.95), 0 1px 0 rgba(255,255,255,0.12)',
              }}
            />

            <div className="w-full h-8 rounded-lg bg-[#07090D] border border-white/[0.08] flex items-center px-3 justify-between">
              <span className="font-['JetBrains_Mono'] text-[8.5px] uppercase tracking-[0.22em] text-[#8E887E]">
                MAGNETIC FLIGHT STRIPE
              </span>
              <span className="font-['JetBrains_Mono'] text-[8.5px] text-[#CBB079] font-bold">
                PART 91/135
              </span>
            </div>
          </div>

          {/* Telemetry Rows */}
          <div className="pointer-events-none relative z-20 my-auto space-y-3 font-['JetBrains_Mono'] text-left">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.07]">
              <span className="text-[9px] uppercase tracking-wider text-[#8E887E]">TOTAL PIC HOURS</span>
              <span className="text-xs text-[#EDE8DF] font-bold">{data.hours.total.toLocaleString()} HRS</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.07]">
              <span className="text-[9px] uppercase tracking-wider text-[#8E887E]">JET TYPE RATINGS</span>
              <span className="text-xs text-[#E0CCA0] font-bold">{data.typeRatings.join(' • ')}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.07]">
              <span className="text-[9px] uppercase tracking-wider text-[#8E887E]">RAMP CLEARANCE</span>
              <span className="text-xs text-[#6EE7B7] font-bold">{data.clearanceLevel}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.07]">
              <span className="text-[9px] uppercase tracking-wider text-[#8E887E]">HOME BASE ICAO</span>
              <span className="text-xs text-[#EDE8DF] font-semibold">{data.homeBaseIcao}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[9px] uppercase tracking-wider text-[#8E887E]">CRYPTO CHECKSUM</span>
              <span className="text-[10px] text-[#8E887E]">{tokenHash}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-white/[0.05]">
              <span className="text-[9px] uppercase tracking-wider text-[#8E887E]">ROTATES IN</span>
              <span className="text-xs text-[#CBB079] font-bold">{remainingSeconds}S</span>
            </div>
          </div>

          {/* Barcode */}
          <div className="pointer-events-none relative z-20 space-y-2">
            <div className="w-full py-2.5 px-3 rounded-xl bg-black/50 border border-white/[0.08] flex items-center justify-between">
              <div
                className="h-6 flex-1 mr-3 opacity-85"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, #EDE8DF 0px, #EDE8DF 2px, transparent 2px, transparent 4px, #EDE8DF 4px, #EDE8DF 6px, transparent 6px, transparent 9px)',
                }}
              />
              <span className="font-['JetBrains_Mono'] text-[9px] tracking-[0.2em] text-[#CBB079] font-bold">
                ENCRYPTED
              </span>
            </div>

            <div className="text-center font-['Inter'] text-[8px] uppercase tracking-[0.2em] text-[#8E887E]">
              TAP ANYWHERE TO FLIP FRONT
            </div>
          </div>
        </div>
      </div>

      {/* Indicator */}
      <div className="pointer-events-none mt-3 flex items-center gap-2 font-['Inter'] text-[8px] uppercase tracking-[0.22em] text-[#8E887E]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#CBB079] animate-pulse" />
        <span>CLICK BADGE TO FLIP 180°</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
      </div>
    </div>
  );
};