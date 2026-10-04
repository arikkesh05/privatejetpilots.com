import { useEffect, useState } from 'react';

interface HudNavDockProps {
  /** Interaction-sound state; drives the toggle icon and accessible label. */
  audioActive: boolean;
  onOpenCockpit: () => void;
  onToggleAudio: () => void;
}

const NAV_LINKS = [
  { href: '#fleet', label: 'Fleet' },
  { href: '#charter', label: 'Charter' },
  { href: '#concierge', label: 'Concierge' },
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

  /* Active-route indicator — resolves which anchored section currently owns the
     viewport. Lenis drives native scroll, so a passive scroll listener sees the
     smoothed position; reads are coalesced to one per frame and state is written
     only when the route actually changes, so the dock never re-renders per tick.
     Anchors with no matching section on the deck (e.g. `#charter`) are dropped. */
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
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-8 py-3 rounded-[9999px] bg-black/60 backdrop-blur-xl border border-white/15 text-white/90 shadow-[0_12px_36px_rgba(0,0,0,0.7)] max-w-[calc(100%-1.5rem)]">
      <div className="flex flex-nowrap justify-between items-center gap-3 sm:gap-6 w-full">
        {/* Brand */}
        <a className="flex flex-nowrap items-center min-h-[24px] shrink-0 group" href="#top">
          <span className="uppercase text-brand-lockup text-white/90 transition-colors duration-300 group-hover:text-white sm:hidden">
            PJP
          </span>
          <span className="hidden uppercase text-brand-lockup text-white/90 transition-colors duration-300 group-hover:text-white sm:inline">
            PJP // PRIVATE JET PILOTS
          </span>
        </a>

        {/* Navigation */}
        <nav className="hidden lg:flex flex-nowrap items-center gap-2 min-[1792px]:gap-3">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === activeHref;

            return (
              <a
                aria-current={isActive ? 'true' : undefined}
                className={`${LINK_BASE} ${isActive ? 'text-white' : 'text-white/70 hover:text-white'}`}
                href={link.href}
                key={link.href}
              >
                {/* Active-route pill — soft champagne luminescence behind the
                    current section. Opacity-only, so it never shifts layout. */}
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

        {/* Actions — instrument controls stay quiet icon buttons; only the
            charter action carries the champagne fill. */}
        <div className="flex flex-nowrap items-center gap-2.5 shrink-0">
          {/* Micro-beacon — amber bars that breathe only while interaction
              sound is live and hold dim in standby, mirroring the audio toggle
              beside them. Decorative: the button carries the state for AT. */}
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
            href="#charter"
          >
            Request Flight
          </a>
        </div>
      </div>
    </header>
  );
}
