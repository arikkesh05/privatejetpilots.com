import { useEffect, useState } from 'react';

interface HudNavDockProps {
  /** Interaction-sound state; drives the toggle icon and accessible label. */
  audioActive: boolean;
  onOpenCockpit: () => void;
  onToggleAudio: () => void;
}

const NAV_LINKS = [
  { href: '#find-crew', label: 'Find Crew' },
  { href: '#operators', label: 'Operators' },
  { href: '#jumpseat', label: 'JumpSeat' },
  { href: '#directory', label: 'Directory' },
  { href: '#aerointel', label: 'AeroIntel' },
  { href: '#job-board', label: 'Job Board' },
] as const;

const LINK_BASE =
  'relative px-2.5 py-1.5 rounded-[9999px] uppercase font-label-caps text-label-caps whitespace-nowrap transition-colors duration-300';

/** Viewport fraction that marks an anchored section as the current route. */
const ROUTE_ACTIVE_LINE = 0.4;

interface NavTarget {
  readonly href: string;
  readonly element: HTMLElement;
}

const ICON_CONTROL =
  'inline-flex size-9 items-center justify-center rounded-sm border border-white/15 text-white/70 hover:text-white hover:border-white/40 transition-all duration-300 active:scale-95 cursor-pointer whitespace-nowrap';

/** Floating glass capsule — borderless, blurred, floating over the frame so
 *  the cabin ceiling shows through with no dark banding or cutoff. */
export function HudNavDock({ audioActive, onOpenCockpit, onToggleAudio }: HudNavDockProps) {
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const targets: NavTarget[] = [];

    for (const link of NAV_LINKS) {
      const element = document.querySelector<HTMLElement>(link.href);
      if (element) targets.push({ href: link.href, element });
    }

    if (targets.length === 0) return;

    let frame = 0;

    const sync = (): void => {
      frame = 0;
      const line = window.innerHeight * ROUTE_ACTIVE_LINE;
      let next: string | null = null;

      for (const target of targets) {
        if (target.element.getBoundingClientRect().top <= line) {
          next = target.href;
        }
      }

      setActiveHref((previous) => (previous === next ? previous : next));
    };

    const request = (): void => {
      if (frame === 0) frame = window.requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
    };
  }, []);

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pl-2.5 sm:pl-3.5 pr-6 sm:pr-7 py-2 rounded-[9999px] bg-black/65 backdrop-blur-xl border border-white/15 text-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)] max-w-[calc(100%-1.5rem)]">
      <div className="flex flex-nowrap justify-between items-center gap-3 sm:gap-6 w-full">
        {/* 3D Tactile Aviation Brand Emblem — Pushed Left into Curve */}
        <a
          className="flex flex-nowrap items-center gap-3 sm:gap-3.5 min-h-[44px] shrink-0 group select-none"
          href="#top"
        >
          {/* Popping 3D Medallion Disc */}
          <div className="relative size-11 sm:size-12 shrink-0 transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-0.5 drop-shadow-[0_8px_18px_rgba(0,0,0,0.95)]">
            <svg
              className="w-full h-full"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* 3D Radial Bevel Depth on Outer Bezel */}
                <radialGradient
                  id="bezelBevel"
                  cx="35%"
                  cy="25%"
                  r="75%"
                >
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                  <stop offset="40%" stopColor="#2A2A30" stopOpacity="0.8" />
                  <stop offset="80%" stopColor="#111217" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#050608" stopOpacity="1" />
                </radialGradient>

                {/* Sunken Dial Core Face */}
                <radialGradient
                  id="coreDialShadow"
                  cx="50%"
                  cy="40%"
                  r="60%"
                >
                  <stop offset="0%" stopColor="#171821" />
                  <stop offset="70%" stopColor="#0A0B0E" />
                  <stop offset="100%" stopColor="#040405" />
                </radialGradient>

                {/* Multi-stop 24K Gold Foil Shader */}
                <linearGradient
                  id="navPjpGold"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="25%" stopColor="#FFE57F" />
                  <stop offset="55%" stopColor="#FFD700" />
                  <stop offset="85%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>

                {/* Extruded Cast Shadow */}
                <filter
                  id="extrude3D"
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feDropShadow
                    dx="0"
                    dy="3"
                    stdDeviation="2"
                    floodColor="#000000"
                    floodOpacity="0.95"
                  />
                  <feDropShadow
                    dx="0"
                    dy="6"
                    stdDeviation="8"
                    floodColor="#F59E0B"
                    floodOpacity="0.45"
                  />
                </filter>
              </defs>

              {/* Underlying 3D Disc Shadow Floor */}
              <circle
                cx="100"
                cy="104"
                r="92"
                fill="#000000"
                opacity="0.8"
              />

              {/* 3D Beveled Outer Metal Rim */}
              <circle
                cx="100"
                cy="100"
                r="92"
                fill="url(#bezelBevel)"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.25"
              />

              {/* Inner Recessed Channel Ring */}
              <circle
                cx="100"
                cy="100"
                r="82"
                fill="none"
                stroke="#000000"
                strokeWidth="5"
                opacity="0.75"
              />
              <circle
                cx="100"
                cy="100"
                r="79"
                fill="url(#coreDialShadow)"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeOpacity="0.3"
              />

              {/* Specular Highlight Arc on Upper Lip */}
              <path
                d="M38 78C48 48 72 32 100 32C128 32 152 48 162 78"
                stroke="#FFFFFF"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.35"
              />

              {/* Raised 3D Gold PJP Letters */}
              <g filter="url(#extrude3D)">
                <text
                  x="100"
                  y="120"
                  textAnchor="middle"
                  fill="#000000"
                  fontFamily="'Playfair Display', Georgia, serif"
                  fontWeight="900"
                  fontSize="52"
                  letterSpacing="4"
                  opacity="0.9"
                >
                  PJP
                </text>
                <text
                  x="100"
                  y="117"
                  textAnchor="middle"
                  fill="url(#navPjpGold)"
                  fontFamily="'Playfair Display', Georgia, serif"
                  fontWeight="900"
                  fontSize="52"
                  letterSpacing="4"
                >
                  PJP
                </text>
              </g>
            </svg>
          </div>

          {/* Unified Horizontal Brand Lockup */}
          <span className="font-mono text-xs sm:text-[13px] tracking-[0.28em] text-white/90 font-bold uppercase whitespace-nowrap transition-colors duration-300 group-hover:text-[#FFD700]">
            PRIVATE JET PILOTS
          </span>
        </a>

        {/* Dynamic Route Navigation */}
        <nav className="hidden xl:flex flex-nowrap items-center gap-1.5 2xl:gap-2.5">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === activeHref;

            return (
              <a
                aria-current={isActive ? 'true' : undefined}
                className={`${LINK_BASE} ${isActive ? 'text-white' : 'text-white/70 hover:text-white'}`}
                href={link.href}
                key={link.href}
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-0 rounded-[9999px] bg-champagne/10 ring-1 ring-champagne/25 shadow-[0_0_14px_rgba(203,176,121,0.28)] transition-opacity duration-500 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <span className="relative">{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex flex-nowrap items-center gap-2.5 shrink-0">
          <span
            aria-hidden="true"
            className="hud-beacon"
            data-live={audioActive ? 'true' : 'false'}
          >
            <span />
            <span />
            <span />
          </span>

          <button
            aria-label={audioActive ? 'Turn interaction sound off' : 'Turn interaction sound on'}
            aria-pressed={audioActive}
            className={`${ICON_CONTROL}${audioActive ? ' text-champagne' : ''}`}
            onClick={onToggleAudio}
            title={audioActive ? 'Interaction sound on (Press M)' : 'Interaction sound off (Press M)'}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              {audioActive ? 'volume_up' : 'volume_off'}
            </span>
          </button>

          <button
            aria-label="Open the cockpit view"
            className={ICON_CONTROL}
            onClick={onOpenCockpit}
            title="Open the cockpit view (Press O)"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">flight</span>
          </button>

          <a
            className="champagne-btn-solid rounded-sm px-5 py-2 font-label-caps text-label-caps uppercase whitespace-nowrap active:scale-[0.97] transition-all"
            href="#instant-quote"
          >
            Request Flight
          </a>
        </div>
      </div>
    </header>
  );
}