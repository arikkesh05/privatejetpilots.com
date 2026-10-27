import { useEffect, useState } from 'react';

interface HudNavDockProps {
  /** Interaction-sound state; drives the toggle icon and accessible label. */
  audioActive: boolean;
  onOpenCockpit: () => void;
  onToggleAudio: () => void;
}

interface NavStage {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly targetType: 'hero-stage' | 'selector';
  readonly heroFraction?: number;
  readonly selector?: string;
}

const NAV_STAGES: readonly NavStage[] = [
  { id: 'flight-deck', code: '01', label: 'Flight Deck', targetType: 'hero-stage', heroFraction: 0 },
  { id: 'credentials', code: '02', label: 'Credentials', targetType: 'hero-stage', heroFraction: 0.42 },
  { id: 'systems', code: '03', label: 'Systems', targetType: 'hero-stage', heroFraction: 0.76 },
  { id: 'ecosystem', code: '04', label: 'Ecosystem', targetType: 'selector', selector: '#roles' },
  { id: 'registry', code: '05', label: 'Registry', targetType: 'selector', selector: 'footer' },
];

const LINK_BASE =
  'relative px-3 py-1.5 rounded-[9999px] uppercase font-mono text-[11px] tracking-[0.18em] whitespace-nowrap transition-colors duration-300 cursor-pointer';

const ICON_CONTROL =
  'inline-flex size-8 sm:size-9 items-center justify-center rounded-full sm:rounded-sm border border-white/15 bg-white/[0.03] text-white/75 hover:text-white hover:border-[#CBB079]/50 transition-all duration-300 active:scale-95 cursor-pointer shrink-0';

export function HudNavDock({ audioActive, onOpenCockpit, onToggleAudio }: HudNavDockProps) {
  const [activeId, setActiveId] = useState<string>('flight-deck');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    let frame = 0;

    const sync = (): void => {
      frame = 0;
      const scrollY = window.scrollY;
      const viewportTrigger = scrollY + window.innerHeight * 0.4;

      const footerEl = document.querySelector<HTMLElement>('footer');
      const rolesEl = document.querySelector<HTMLElement>('#roles');
      const mainEl = document.querySelector<HTMLElement>('main');
      const heroEl = mainEl?.firstElementChild as HTMLElement | null;

      let nextId = 'flight-deck';

      if (footerEl && footerEl.getBoundingClientRect().top <= window.innerHeight * 0.55) {
        nextId = 'registry';
      } else if (rolesEl && rolesEl.getBoundingClientRect().top <= window.innerHeight * 0.45) {
        nextId = 'ecosystem';
      } else if (heroEl) {
        const heroHeight = Math.max(heroEl.offsetHeight - window.innerHeight, 1);
        const progress = Math.min(Math.max((viewportTrigger - heroEl.offsetTop) / heroHeight, 0), 1);

        if (progress >= 0.64) {
          nextId = 'systems';
        } else if (progress >= 0.3) {
          nextId = 'credentials';
        } else {
          nextId = 'flight-deck';
        }
      }

      setActiveId((prev) => (prev === nextId ? prev : nextId));
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

  // Close mobile drawer automatically on Escape or desktop resize
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 1280) setMobileMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [mobileMenuOpen]);

  const navigateToStage = (stage: NavStage) => {
    setMobileMenuOpen(false);

    if (stage.targetType === 'selector' && stage.selector) {
      const target = document.querySelector<HTMLElement>(stage.selector);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    const mainEl = document.querySelector<HTMLElement>('main');
    const heroEl = mainEl?.firstElementChild as HTMLElement | null;
    if (!heroEl || stage.heroFraction === undefined) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (stage.heroFraction === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const scrollableHeroSpan = Math.max(heroEl.offsetHeight - window.innerHeight, 0);
    const targetTop = heroEl.offsetTop + scrollableHeroSpan * stage.heroFraction;
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  const handleRequestFlight = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const rolesEl = document.querySelector<HTMLElement>('#roles');
    if (rolesEl) {
      rolesEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] xl:w-auto max-w-6xl">
      {/* Main Floating Obsidian Glass Capsule */}
      <div className="flex flex-nowrap justify-between items-center gap-2 sm:gap-5 pl-2 sm:pl-3.5 pr-2.5 sm:pr-4 xl:pr-5 py-1.5 sm:py-2 rounded-[9999px] bg-black/75 backdrop-blur-xl border border-white/15 text-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)]">
        {/* 3D Tactile Aviation Brand Emblem */}
        <a
          className="flex flex-nowrap items-center gap-2 sm:gap-3.5 min-h-[40px] sm:min-h-[44px] min-w-0 shrink group select-none"
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setMobileMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div className="relative size-9 sm:size-11 shrink-0 transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-0.5 drop-shadow-[0_8px_18px_rgba(0,0,0,0.95)]">
            <svg
              className="w-full h-full"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="bezelBevel" cx="35%" cy="25%" r="75%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                  <stop offset="40%" stopColor="#2A2A30" stopOpacity="0.8" />
                  <stop offset="80%" stopColor="#111217" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#050608" stopOpacity="1" />
                </radialGradient>

                <radialGradient id="coreDialShadow" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#171821" />
                  <stop offset="70%" stopColor="#0A0B0E" />
                  <stop offset="100%" stopColor="#040405" />
                </radialGradient>

                <linearGradient id="navPjpGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="25%" stopColor="#FFE57F" />
                  <stop offset="55%" stopColor="#FFD700" />
                  <stop offset="85%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>

                <filter id="extrude3D" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.95" />
                  <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#F59E0B" floodOpacity="0.45" />
                </filter>
              </defs>

              <circle cx="100" cy="104" r="92" fill="#000000" opacity="0.8" />
              <circle
                cx="100"
                cy="100"
                r="92"
                fill="url(#bezelBevel)"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.25"
              />
              <circle cx="100" cy="100" r="82" fill="none" stroke="#000000" strokeWidth="5" opacity="0.75" />
              <circle
                cx="100"
                cy="100"
                r="79"
                fill="url(#coreDialShadow)"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeOpacity="0.3"
              />
              <path
                d="M38 78C48 48 72 32 100 32C128 32 152 48 162 78"
                stroke="#FFFFFF"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.35"
              />
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

          <span className="font-mono text-[10px] sm:text-xs tracking-[0.16em] sm:tracking-[0.26em] text-white/95 font-bold uppercase whitespace-nowrap truncate transition-colors duration-300 group-hover:text-[#FFD700]">
            PRIVATE JET PILOTS
          </span>
        </a>

        {/* Desktop Dynamic Stage Navigation */}
        <nav aria-label="Primary flight stages" className="hidden xl:flex flex-nowrap items-center gap-1 2xl:gap-2">
          {NAV_STAGES.map((stage) => {
            const isActive = stage.id === activeId;

            return (
              <button
                aria-current={isActive ? 'true' : undefined}
                className={`${LINK_BASE} ${isActive ? 'text-[#FFE57F]' : 'text-white/70 hover:text-white'}`}
                key={stage.id}
                onClick={() => navigateToStage(stage)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-0 rounded-[9999px] bg-[#CBB079]/15 ring-1 ring-[#CBB079]/40 shadow-[0_0_14px_rgba(203,176,121,0.28)] transition-opacity duration-300 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <span className="relative">{stage.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Audio Beacon — hidden on compact mobile so it never reads as ellipsis */}
          <span
            aria-hidden="true"
            className="hud-beacon hidden md:inline-flex"
            data-live={audioActive ? 'true' : 'false'}
          >
            <span />
            <span />
            <span />
          </span>

          <button
            aria-label={audioActive ? 'Turn interaction sound off' : 'Turn interaction sound on'}
            aria-pressed={audioActive}
            className={`${ICON_CONTROL}${audioActive ? ' !text-[#FFD700] !border-[#CBB079]/50' : ''}`}
            onClick={onToggleAudio}
            title={audioActive ? 'Interaction sound on (Press M)' : 'Interaction sound off (Press M)'}
            type="button"
          >
            <span className="material-symbols-outlined text-[17px] sm:text-[18px]">
              {audioActive ? 'volume_up' : 'volume_off'}
            </span>
          </button>

          <button
            aria-label="Open the cockpit view"
            className={ICON_CONTROL}
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenCockpit();
            }}
            title="Open the cockpit view (Press O)"
            type="button"
          >
            <span className="material-symbols-outlined text-[17px] sm:text-[18px]">flight</span>
          </button>

          {/* Desktop / Tablet Primary Action */}
          <a
            className="hidden sm:inline-flex champagne-btn-solid rounded-full px-4 py-2 font-mono text-[10px] tracking-[0.2em] font-bold uppercase whitespace-nowrap active:scale-[0.97] transition-all"
            href="#roles"
            onClick={handleRequestFlight}
          >
            Request Flight
          </a>

          {/* Mobile & Tablet Navigation Drawer Toggle */}
          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className={`${ICON_CONTROL} xl:hidden ${
              mobileMenuOpen ? '!border-[#FFD700]/60 !text-[#FFD700] bg-[#CBB079]/10' : ''
            }`}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Dropdown Flight Deck Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden mt-2.5 rounded-2xl bg-[#090B10]/95 backdrop-blur-2xl border border-[#CBB079]/30 p-4 shadow-[0_24px_50px_rgba(0,0,0,0.92)]">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
            <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-[#CBB079]">
              FLIGHT DECK NAVIGATION
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-[#22c55e]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              ONLINE
            </span>
          </div>

          <nav aria-label="Mobile flight stages" className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {NAV_STAGES.map((stage) => {
              const isActive = stage.id === activeId;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => navigateToStage(stage)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'border-[#CBB079]/50 bg-[#CBB079]/15 text-[#FFE57F]'
                      : 'border-white/[0.06] bg-white/[0.02] text-white/80 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span className="font-mono text-xs uppercase tracking-[0.2em] font-semibold">
                    {stage.label}
                  </span>
                  <span className="font-mono text-[9px] tracking-[0.2em] text-[#CBB079]/75">
                    SEC // {stage.code}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <a
              href="#roles"
              onClick={handleRequestFlight}
              className="champagne-btn-solid flex-1 rounded-xl py-2.5 px-4 text-center font-mono text-[11px] font-bold uppercase tracking-[0.22em]"
            >
              Request Flight Dispatch →
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCockpit();
              }}
              className="rounded-xl border border-[#CBB079]/35 bg-[#CBB079]/10 py-2.5 px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#FFE57F] hover:bg-[#CBB079]/20 transition-colors"
            >
              Launch Cockpit HUD
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default HudNavDock;