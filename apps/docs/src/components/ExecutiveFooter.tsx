import  { useEffect, useState } from 'react';

// Swap to your exact direct phone number here anytime
const CONTACT_PHONE = '+1 (561) 719-9692';

interface ManifestItem {
  readonly title: string;
  readonly meta: string;
  readonly href: string;
}

interface ManifestSector {
  readonly index: string;
  readonly title: string;
  readonly subtitle: string;
  readonly items: readonly ManifestItem[];
}

const MANIFEST_SECTORS: readonly ManifestSector[] = [
  {
    index: '01',
    title: 'Fleet & Airframes',
    subtitle: 'CAPITAL & ASSET DISPATCH',
    items: [
      { title: 'Gulfstream G700 Specs', meta: 'FLAGSHIP // FL450', href: '#fleet' },
      { title: 'Global Aircraft Sales', meta: 'VERIFIED OFF-MARKET', href: '#sales' },
      { title: 'AOG Rapid Response', meta: 'PRIORITY RUNWAY DISPATCH', href: '#aog' },
      { title: 'Jet-A1 Fuel Direct', meta: 'WHOLESALE UPLINK', href: '#fuel' },
    ],
  },
  {
    index: '02',
    title: 'Flight Operations',
    subtitle: 'CREW & NETWORK INFRASTRUCTURE',
    items: [
      { title: 'Pilot & Crew Registry', meta: '26,500+ CREDENTIALED', href: '#crew' },
      { title: 'Verified Jumpseat', meta: 'PART 135 CREW ACCESS', href: '#jumpseat' },
      { title: 'Mission Dashboard', meta: 'LIVE AIRSPACE TELEMETRY', href: '#dashboard' },
      { title: 'Flight Attendants & Ops', meta: 'VIP CABIN CREW', href: '#directory' },
    ],
  },
  {
    index: '03',
    title: 'Concierge & Protocols',
    subtitle: 'GOVERNANCE & CLIENT ACCORD',
    items: [
      { title: 'Charter Protocols', meta: 'ESCROW & DELEGATION', href: '#charter' },
      { title: 'Confidentiality & NDA', meta: 'ENCRYPTED MANIFESTS', href: '#privacy' },
      { title: 'Terms of Operation', meta: 'ICAO / FAA REVISED', href: '#terms' },
      { title: 'Executive FBO Desk', meta: 'CONCIERGE ON 121.5', href: `tel:${CONTACT_PHONE.replace(/[^0-9+]/g, '')}` },
    ],
  },
];

export function ExecutiveFooter() {
  const [jetProgress, setJetProgress] = useState<number>(0);
  const [activeSector, setActiveSector] = useState<number>(-1);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  useEffect(() => {
    const DURATION = 22000;
    let start = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = (now - start) % DURATION;
      const progress = elapsed / DURATION;
      setJetProgress(progress);

      if (progress >= 0.10 && progress < 0.38) {
        setActiveSector(0);
      } else if (progress >= 0.40 && progress < 0.68) {
        setActiveSector(1);
      } else if (progress >= 0.70 && progress < 0.95) {
        setActiveSector(2);
      } else {
        setActiveSector(-1);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const jetLeftPercent = (jetProgress * 140 - 30).toFixed(2);

  return (
    <footer className="relative w-full bg-[#05070a] text-[#ECE7DF] overflow-hidden border-t border-[#CBB079]/30">
      
      {/* ── 1. COMPACT TACTICAL RUNWAY HORIZON ── */}
      <div className="relative w-full h-44 sm:h-52 overflow-hidden select-none border-b border-white/10 bg-[#05070a]">
        
        {/* Stratosphere Gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, #05070a 0%, #070c16 45%, #0e1726 75%, #151d2a 100%)',
          }}
        />

        {/* Restrained Starfield */}
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(1px 1px at 35px 25px, #ffffff, transparent), radial-gradient(1px 1px at 160px 55px, #cbb079, transparent), radial-gradient(1.5px 1.5px at 320px 30px, #ffffff, transparent), radial-gradient(1px 1px at 580px 75px, #38bdf8, transparent), radial-gradient(1.5px 1.5px at 840px 20px, #ffffff, transparent), radial-gradient(1px 1px at 1120px 65px, #ffffff, transparent)',
            backgroundSize: '1150px 160px',
          }}
        />

        {/* Ambient Ground Ramp Fog */}
        <div
          className="absolute bottom-8 left-1/4 w-80 h-20 rounded-full blur-2xl opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-8 right-1/4 w-80 h-20 rounded-full blur-2xl opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #38bdf8 0%, transparent 70%)' }}
        />

        {/* Perimeter Obstruction Strobes */}
        <div className="absolute bottom-10 left-0 right-0 h-6 flex items-end justify-between px-8 sm:px-12 opacity-35 pointer-events-none z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444] animate-pulse" />
            <span className="font-mono text-[7px] uppercase tracking-widest text-white/40">OBST // 340 FT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[7px] uppercase tracking-widest text-white/40">ILS 3.0°</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e] animate-ping" />
          </div>
        </div>

        {/* ── GULFSTREAM G700 WITH WHITE TRAILING CALLOUT BANNER ── */}
        <div
          className="absolute top-7 sm:top-8 left-0 w-full z-15 pointer-events-none"
          style={{
            transform: `translateX(${jetLeftPercent}%)`,
          }}
        >
          <div className="relative inline-flex items-center">
            
            {/* ── White Tow Banner Trailing Tail ── */}
            <div className="relative flex items-center mr-1 select-none pointer-events-auto">
              {/* Fluttering White Callout Banner */}
              <a
                href={`tel:${CONTACT_PHONE.replace(/[^0-9+]/g, '')}`}
                className="relative flex items-center gap-2 px-3 py-1 bg-white text-black font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-sm shadow-[0_4px_16px_rgba(255,255,255,0.25)] border-r-2 border-zinc-300 hover:scale-105 transition-transform"
                style={{
                  animation: 'banner-wave 2.2s infinite ease-in-out',
                  transformOrigin: 'right center',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-ping" />
                <span className="text-zinc-900 font-extrabold whitespace-nowrap">
                  CONTACT US: <span className="text-[#05070a] underline underline-offset-2">{CONTACT_PHONE}</span>
                </span>
                {/* Swallowtail / Ribbon Notch at Left Edge */}
                <span
                  className="absolute -left-1.5 top-0 bottom-0 w-2 bg-[#05070a]"
                  style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 70% 50%)' }}
                />
              </a>

              {/* Tow Cable linking Banner to Aircraft Empennage */}
              <div className="w-8 sm:w-12 h-[1px] bg-gradient-to-r from-white/90 via-white/50 to-transparent" />
            </div>

            {/* Gulfstream Cutout Aircraft */}
            <div className="relative w-44 sm:w-56 drop-shadow-[0_10px_25px_rgba(0,0,0,0.95)]">
              <img
                src="/gulfstream-g700.png"
                alt="Gulfstream G700 Flight Profile"
                className="w-full h-auto select-none pointer-events-none object-contain"
                style={{ filter: 'brightness(1.05) contrast(1.05)' }}
              />

              {/* Wingtip Green Navigation Beacon */}
              <span
                className="absolute top-[38%] left-[10%] w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]"
                style={{ animation: 'night-beacon-pulse 1.1s infinite' }}
              />
            </div>

            {/* Downward Precision Ground Optical Line */}
            <div
              className="absolute left-[70%] top-14 w-[1px] h-24 pointer-events-none"
              style={{
                background: hoveredCode
                  ? 'linear-gradient(180deg, #CBB079 0%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(203,176,121,0.6) 0%, transparent 100%)',
                boxShadow: hoveredCode ? '0 0 6px rgba(203,176,121,0.8)' : 'none',
              }}
            />

          </div>
        </div>

        {/* Compact Tarmac Deck */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#080a0e] via-[#090d14] to-transparent z-15">
          <div className="absolute inset-0 flex items-center justify-center opacity-25">
            <div className="w-full max-w-4xl border-b border-dashed border-[#CBB079]/40 h-0" />
          </div>

          <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-between px-6 sm:px-12 max-w-6xl mx-auto z-20">
            {/* Green Threshold Beacons */}
            <div className="flex items-center gap-2 sm:gap-4">
              {[...Array(5)].map((_, i) => (
                <span
                  key={`thresh-l-${i}`}
                  className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_8px_2px_rgba(34,197,94,0.7)]"
                  style={{ animation: `pulse 2s infinite ease-in-out ${i * 0.15}s` }}
                />
              ))}
            </div>

            {/* Designation Stencil & Radar Coordinate */}
            <div className="flex items-center gap-3">
              <div className="font-mono text-[9px] sm:text-[10px] font-bold tracking-[0.25em] text-[#CBB079]/80 border border-[#CBB079]/30 px-2 py-0.5 rounded-sm bg-black/60 backdrop-blur-sm">
                RWY 22L
              </div>
              <div className="hidden md:flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-widest text-[#CBB079]/70 bg-black/50 px-2 py-0.5 rounded border border-[#CBB079]/20">
                <span className="w-1 h-1 rounded-full bg-[#CBB079] animate-ping" />
                <span>RADAR: {jetLeftPercent}%</span>
              </div>
            </div>

            {/* Amber Edge Beacons */}
            <div className="flex items-center gap-2 sm:gap-4">
              {[...Array(5)].map((_, i) => (
                <span
                  key={`thresh-r-${i}`}
                  className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_2px_rgba(245,158,11,0.6)]"
                  style={{ animation: `pulse 2s infinite ease-in-out ${(4 - i) * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Compact ATIS Telemetry Bar */}
        <div className="absolute top-2.5 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-0.5 rounded-full bg-black/70 border border-[#CBB079]/20 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-ping" />
            <span className="font-mono text-[8.5px] uppercase tracking-[0.25em] text-white/90 font-bold">
              {hoveredCode ? `INTERCEPT // ${hoveredCode}` : 'RUNWAY 22L // ACTIVE CAT III DISPATCH'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 font-mono text-[8.5px] uppercase tracking-[0.2em] text-[#CBB079] bg-black/70 px-3 py-0.5 rounded-full border border-[#CBB079]/30 backdrop-blur-md">
            <span>FL450 MACH 0.88</span>
            <span>•</span>
            <span className="text-white font-bold">RVR 6000FT</span>
          </div>
        </div>
      </div>

      {/* ── 2. COMPACT EDITORIAL FLIGHT MANIFEST MATRIX ── */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-8 text-left">
        
        {/* Compact Brand Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-4 pb-6 border-b border-[#CBB079]/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#CBB079] font-bold">
                PJP // EXECUTIVE OPS NETWORK
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            </div>
            <h2 className="font-playfair text-2xl sm:text-3xl text-white font-light tracking-tight">
              The Sovereign Fleet Registry
            </h2>
          </div>

          <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.2em] text-[#CBB079]/80">
            <div><span className="text-white font-bold">26.5K+</span> CREW</div>
            <span className="text-white/20">•</span>
            <div><span className="text-white font-bold">1,420</span> LEGS</div>
            <span className="text-white/20">•</span>
            <div className="text-[#22c55e] font-bold">PART 135</div>
          </div>
        </div>

        {/* 3 Streamlined Manifest Sectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 pt-6 pb-6 border-b border-[#CBB079]/15">
          {MANIFEST_SECTORS.map((sector, sIdx) => {
            const isSectorActive = activeSector === sIdx;
            return (
              <div key={sector.index} className="relative">
                {/* Sector Overflight Gold Line */}
                <div
                  className={`h-[1px] w-full mb-3 transition-all duration-500 ${
                    isSectorActive
                      ? 'bg-gradient-to-r from-[#CBB079] via-[#ECE7DF] to-transparent shadow-[0_0_10px_rgba(203,176,121,0.7)]'
                      : 'bg-white/10'
                  }`}
                />

                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[9px] font-bold tracking-[0.25em] text-[#CBB079]">
                    SECTOR // {sector.index}
                  </span>
                  {isSectorActive && (
                    <span className="font-mono text-[7px] uppercase tracking-wider text-[#22c55e] bg-[#22c55e]/10 px-1.5 py-0.2 rounded border border-[#22c55e]/30 animate-pulse">
                      OVERFLIGHT
                    </span>
                  )}
                </div>

                <h3 className="font-playfair text-lg text-white font-normal mb-3">
                  {sector.title}
                </h3>

                <ul className="space-y-2">
                  {sector.items.map((item) => {
                    const isHovered = hoveredCode === item.meta;
                    return (
                      <li key={item.title}>
                        <a
                          href={item.href}
                          onMouseEnter={() => setHoveredCode(item.meta)}
                          onMouseLeave={() => setHoveredCode(null)}
                          className={`group flex items-baseline justify-between py-0.5 border-b border-white/[0.03] hover:border-[#CBB079]/40 transition-colors ${
                            isHovered ? 'pl-1' : ''
                          }`}
                        >
                          <span className="font-playfair text-xs sm:text-sm text-white/75 group-hover:text-[#CBB079] transition-colors">
                            {item.title}
                          </span>
                          <span className="font-mono text-[7.5px] uppercase tracking-wider text-white/30 group-hover:text-white/60 transition-colors">
                            {item.meta}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ── 3. COMPACT COMPLIANCE & COPYRIGHT FOOTER ── */}
        <div className="pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
          <div>
            © 2026 PRIVATE JET PILOTS OPERATIONS, LLC. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-4 text-[#CBB079]/75">
            <span>FAA PART 135 AUDITED</span>
            <span className="text-white/20">•</span>
            <span>V1.0 DISPATCH</span>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes banner-wave {
          0%, 100% {
            transform: rotate(0deg) translateY(0px);
          }
          25% {
            transform: rotate(-1.5deg) translateY(-2px);
          }
          75% {
            transform: rotate(1deg) translateY(2px);
          }
        }
        @keyframes night-beacon-pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; filter: drop-shadow(0 0 8px #22c55e); }
        }
      `}</style>
    </footer>
  );
}

export default ExecutiveFooter;