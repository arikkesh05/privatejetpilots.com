import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { user, isGuestMode, signOut } = useAuth();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setProfileMenuOpen(false);
    }
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

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

      setActiveId((current) => (current === nextId ? current : nextId));
    };

    const handleScroll = (): void => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(sync);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    sync();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  const navigateToStage = (stage: NavStage): void => {
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

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setMobileMenuOpen(false);
    window.dispatchEvent(new CustomEvent('pjp:open-auth', { detail: { mode } }));
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
          {/* Audio Beacon */}
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

          {/* Airman Access / In-Dock Sliding Capsule */}
          <div className="relative hidden lg:block" ref={profileMenuRef}>
            {isGuestMode ? (
              <button
                type="button"
                onClick={() => handleOpenAuth('signin')}
                className="inline-flex items-center px-4 py-2 rounded-full border border-[#CBB079]/40 bg-[#0B0E14]/80 text-[#CBB079] hover:text-[#FFE57F] hover:border-[#FFD700]/70 font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.6)] active:scale-95"
              >
                AIRMEN SIGN IN
              </button>
            ) : (
              <div
                className={'flex items-center h-9 rounded-full border transition-all duration-200 ease-out bg-[#07090E]/95 backdrop-blur-xl ' + (
                  profileMenuOpen
                    ? 'border-[#FFD700]/70 shadow-[0_0_16px_rgba(203,176,121,0.2)] px-2 gap-1.5'
                    : 'border-[#CBB079]/35 hover:border-[#FFD700]/60 shadow-[0_0_10px_rgba(203,176,121,0.06)] px-3 gap-1.5'
                )}
              >
                {/* Callsign / Toggle Button */}
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  aria-expanded={profileMenuOpen}
                  className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-white hover:text-[#FFE57F] cursor-pointer transition-colors active:scale-95 py-0.5"
                >
                  <span className="text-[#CBB079] text-xs">✦</span>
                  <span className="font-semibold uppercase tracking-wider text-white/95">
                    {user?.fullName?.split(' ')[0] || 'AIRMAN'}
                  </span>
                  <span
                    className={'material-symbols-outlined text-[14px] text-[#CBB079]/70 transition-transform duration-200 ' + (
                      profileMenuOpen ? 'rotate-90 text-[#FFD700]' : ''
                    )}
                  >
                    chevron_right
                  </span>
                </button>

                {/* Inline Machined Instrument Strip */}
                {profileMenuOpen && (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-150 pl-1 border-l border-white/10">
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[#CBB079] font-mono text-[9px] tracking-widest uppercase font-semibold">
                      {user?.primaryBase || 'KTEB'}
                    </span>

                    <button
                      type="button"
                      onClick={async () => {
                        setProfileMenuOpen(false);
                        await signOut();
                      }}
                      title="Disconnect Flight Deck Session"
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#180A0A] hover:bg-red-950/60 border border-red-500/40 hover:border-red-500/70 text-red-300 hover:text-white font-mono text-[9px] tracking-[0.12em] uppercase transition-all duration-150 cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[11px]">power_settings_new</span>
                      <span>DISCONNECT</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop / Tablet Primary Action */}
          <a
            className="hidden sm:inline-flex champagne-btn-solid rounded-full px-4 py-2 font-mono text-[10px] tracking-[0.2em] font-bold uppercase whitespace-nowrap active:scale-[0.97] transition-all cursor-pointer"
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
                  <span className="font-mono text-xs uppercase tracking-wider">{stage.label}</span>
                  <span className="font-mono text-[10px] text-white/40">{stage.code}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
            {isGuestMode ? (
              <button
                type="button"
                onClick={() => handleOpenAuth('signin')}
                className="w-full py-2.5 rounded-xl bg-white/5 border border-[#CBB079]/30 text-[#CBB079] font-mono text-xs uppercase tracking-widest hover:bg-[#CBB079]/10"
              >
                AIRMEN SIGN IN / REGISTER
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="truncate">
                    <p className="font-mono text-xs font-bold text-white truncate">{user?.fullName}</p>
                    <p className="font-mono text-[9px] text-white/50">{user?.primaryBase || 'KTEB'} • {user?.subscriptionTier || 'PRO'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#CBB079]/15 border border-[#CBB079]/30 text-[#FFE57F] font-mono text-[9px] uppercase">
                    {user?.role || 'PILOT'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await signOut();
                  }}
                  className="w-full py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-mono text-xs uppercase tracking-widest"
                >
                  SIGN OUT
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
