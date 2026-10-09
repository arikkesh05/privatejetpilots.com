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
  eyebrow: string;
  title: string;
  blurb: string;
}

/** Reading order is the access order. Anchors settle on #roles until the
    operational destinations ship their own routes. */
const PATHS: PathCard[] = [
  {
    id: 'pilot',
    eyebrow: 'Flight deck',
    title: "I'm a Pilot",
    blurb: 'Command & qualifications — verified pilot credentials, assignments and network presence.',
  },
  {
    id: 'crew',
    eyebrow: 'Cabin',
    title: "I'm Crew",
    blurb: 'Flight service & readiness — crew availability, catering and cabin coordination.',
  },
  {
    id: 'operator',
    eyebrow: 'Operations',
    title: "I'm an Operator",
    blurb: 'Operations & fleet control — dispatch, availability and inter-operator coordination.',
  },
  {
    id: 'fbo',
    eyebrow: 'Ground',
    title: "I'm an FBO or Service Provider",
    blurb: 'Ramp, fuel & handling — ground services, handling and support partner access.',
  },
  {
    id: 'charter',
    eyebrow: 'Charter',
    title: 'I need Charter or Trip Support',
    blurb: 'Mobility & empty-legs — charter requests, trip support and empty-leg matching.',
  },
];

export function NetworkRoles(): React.JSX.Element {
  return (
    <section id="roles" className="relative w-full bg-charcoal-black text-on-surface">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:px-10 md:py-24">
        <p className="font-label-caps text-label-caps uppercase text-champagne-gold" data-reveal>
          Ecosystem entry
        </p>
        <h2
          className="mt-4 max-w-3xl font-headline-xl text-headline-xl-mobile md:text-headline-xl"
          data-reveal
        >
          Choose your path in the network.
        </h2>
        <p className="mt-4 max-w-2xl font-body-lg text-body-lg text-on-surface-variant" data-reveal>
          Five dedicated access points into the verified operational network behind every private flight.
        </p>

        <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PATHS.map((path, index) => (
            <li key={path.id} data-reveal data-reveal-delay={String(index * 0.08)}>
              <a href="#roles" className="glass-cockpit flex h-full flex-col rounded-lg p-6">
                <span className="font-label-caps text-label-caps uppercase text-champagne-gold">
                  {path.eyebrow}
                </span>
                <span className="mt-3 font-headline-md text-headline-md">{path.title}</span>
                <span className="mt-2 font-body-md text-body-md text-on-surface-variant">{path.blurb}</span>
                <span className="mt-4 inline-flex items-center gap-2 font-telemetry-sm text-telemetry-sm uppercase text-champagne">
                  Enter <span aria-hidden="true">→</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
