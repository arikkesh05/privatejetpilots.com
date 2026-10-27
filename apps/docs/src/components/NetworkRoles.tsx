import React from 'react';

/* --------------------------------------------------------------------------
 * Post-hero ecosystem entry — the direct hand-off from the cinematic arc.
 *
 * The site is not a charter brochure: this is the first operational surface
 * after stage 7, offering the five dedicated access points into the verified
 * network. Cards rest composed in the markup (the reveal hook layers the
 * entrance on top for non-reduced-motion operators) and `data-reveal` sits on
 * the `li` so the card's own hover transform is never clobbered by GSAP's
 * inline transform on the anchor.
 * ------------------------------------------------------------------------ */

interface PathCard {
  id: string;
  code: string;
  eyebrow: string;
  title: string;
  blurb: string;
}

/** Reading order is the access order. Anchors settle on #roles until the
    operational destinations ship their own routes. */
const PATHS: PathCard[] = [
  {
    id: 'pilot',
    code: 'ACCESS // 01',
    eyebrow: 'Flight deck',
    title: "I'm a Pilot",
    blurb: 'Command & qualifications — verified pilot credentials, assignments and network presence.',
  },
  {
    id: 'crew',
    code: 'ACCESS // 02',
    eyebrow: 'Cabin',
    title: "I'm Crew",
    blurb: 'Flight service & readiness — crew availability, catering and cabin coordination.',
  },
  {
    id: 'operator',
    code: 'ACCESS // 03',
    eyebrow: 'Operations',
    title: "I'm an Operator",
    blurb: 'Operations & fleet control — dispatch, availability and inter-operator coordination.',
  },
  {
    id: 'fbo',
    code: 'ACCESS // 04',
    eyebrow: 'Ground',
    title: "I'm an FBO or Service Provider",
    blurb: 'Ramp, fuel & handling — ground services, handling and support partner access.',
  },
  {
    id: 'charter',
    code: 'ACCESS // 05',
    eyebrow: 'Charter',
    title: 'I need Charter or Trip Support',
    blurb: 'Mobility & empty-legs — charter requests, trip support and empty-leg matching.',
  },
];

export function NetworkRoles(): React.JSX.Element {
  return (
    <section
      id="roles"
      className="relative w-full scroll-mt-24 border-t border-white/[0.06] bg-[#090A0D] text-on-surface overflow-hidden"
    >
      {/* Secondary anchor target for CinematicHero drawer hand-off */}
      <div id="ecosystem" className="pointer-events-none absolute top-0 left-0 h-px w-px" aria-hidden="true" />

      {/* Subtle ambient champagne radial glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[380px] w-[75%] max-w-4xl opacity-35 blur-[110px]"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(203, 176, 121, 0.18) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pt-28 pb-20 sm:px-8 sm:pt-32 sm:pb-24 md:px-10 lg:pt-36 lg:pb-28">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2.5 mb-3" data-reveal>
          <span className="h-1.5 w-1.5 rounded-full bg-[#FFD700] shadow-[0_0_8px_#FFD700]" />
          <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.28em] text-[#E0CCA0] font-semibold">
            Ecosystem entry
          </p>
        </div>

        {/* Section Headline */}
        <h2
          className="mt-2 max-w-3xl font-playfair text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1]"
          data-reveal
        >
          Choose your path in the network.
        </h2>

        {/* Section Subtitle */}
        <p
          className="mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base md:text-lg text-white/65 leading-relaxed font-light"
          data-reveal
        >
          Five dedicated access points into the verified operational network behind every private flight.
        </p>

        {/* 5-Card Architectural Bento Matrix (1-col mobile, 2-col tablet, 6-col split on desktop) */}
        <ul className="mt-8 sm:mt-12 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-6">
          {PATHS.map((path, index) => {
            const spanClasses =
              index < 3
                ? 'lg:col-span-2'
                : index === 3
                ? 'lg:col-span-3'
                : 'md:col-span-2 lg:col-span-3';

            return (
              <li
                key={path.id}
                data-reveal
                data-reveal-delay={String(index * 0.08)}
                className={spanClasses}
              >
                <a
                  href={`#roles-${path.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                  className="glass-cockpit group relative flex h-full flex-col justify-between rounded-xl border border-[#CBB079]/20 bg-[#0D1016]/85 p-5 sm:p-6 md:p-7 backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#FFD700]/50 hover:bg-[#11151E]/95 hover:shadow-[0_14px_36px_rgba(0,0,0,0.75),0_0_24px_rgba(203,176,121,0.12)]"
                >
                  {/* Top Specular Hairline */}
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-40 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.65) 50%, transparent 100%)',
                    }}
                    aria-hidden="true"
                  />

                  <div>
                    {/* Card Header: Eyebrow + Telemetry Index */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-[#E0CCA0] font-semibold">
                        {path.eyebrow}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 font-mono text-[9px] tracking-[0.18em] text-white/45 transition-colors duration-300 group-hover:border-[#FFD700]/40 group-hover:text-[#FFD700]">
                        {path.code}
                      </span>
                    </div>

                    {/* Role Title */}
                    <h3 className="mt-3.5 font-playfair text-xl sm:text-2xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-[#FFE57F]">
                      {path.title}
                    </h3>

                    {/* Role Description */}
                    <p className="mt-2 text-xs sm:text-sm text-white/65 leading-relaxed font-light">
                      {path.blurb}
                    </p>
                  </div>

                  {/* Bottom-Aligned Action Trigger */}
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#CBB079] font-semibold transition-colors duration-300 group-hover:text-[#FFD700]">
                      Enter
                      <span
                        aria-hidden="true"
                        className="inline-block transition-transform duration-300 group-hover:translate-x-1.5"
                      >
                        →
                      </span>
                    </span>

                    <span className="h-1.5 w-1.5 rounded-full bg-white/15 transition-all duration-300 group-hover:bg-[#FFD700] group-hover:shadow-[0_0_8px_#FFD700]" />
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default NetworkRoles;