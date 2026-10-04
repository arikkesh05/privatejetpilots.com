import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { FLEET, type FleetCraft } from '../data/fleet';

gsap.registerPlugin(ScrollTrigger);

interface FleetBentoProps {
  /** Opens the cockpit HUD envelope inspector for the selected aircraft. */
  onInspect: (craft: FleetCraft) => void;
}

/** Ultra-luxury glassmorphic elevation — frosted obsidian held by a white
 *  hairline over a deep cinematic drop shadow, so the sky reads through. */
const GLASS_SURFACE =
  'bg-[#0B0D10]/70 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]';

/**
 * 3. Fleet Assortment — alternating full-width showcases floating as glass
 * modules over the descending dusk. Imagery carries roughly 60% of the visual
 * weight; the only figures shown are range, Mach speed and guest capacity, set
 * in one tabular row under a gold hairline. Cards reveal with a staggered
 * ScrollTrigger batch (y 40 → 0, opacity 0 → 1); reduced-motion operators see
 * the section fully composed with no animation.
 */
export function FleetBento({ onInspect }: FleetBentoProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = gsap.utils.toArray<HTMLElement>('[data-fleet-card]', section);

    /* Cursor spotlight — each card writes two CSS custom properties on a
       passive pointermove; the highlight itself is a pseudo-element gradient
       (see `.fleet-card` in index.css), so a move costs one property write and
       never triggers a React render or a layout invalidation. It runs in both
       motion states: this is a hover affordance, not an entrance animation,
       and the deck-wide reduced-motion rule already collapses its transition. */
    const detachSpotlights = cards.map((card) => {
      const handlePointerMove = (event: PointerEvent): void => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
      };

      card.addEventListener('pointermove', handlePointerMove, { passive: true });

      return () => card.removeEventListener('pointermove', handlePointerMove);
    });

    /* Entrance reveal — motion-safe only. Cards sit below the fold (400vh of
       pinned hero precedes them), so hiding them here cannot flash. */
    const context =
      reduced || cards.length === 0
        ? null
        : gsap.context(() => {
            gsap.set(cards, { autoAlpha: 0, y: 40 });
            ScrollTrigger.batch(cards, {
              start: 'top 85%',
              once: true,
              onEnter: (batch) =>
                gsap.to(batch, {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.9,
                  ease: 'power3.out',
                  stagger: 0.12,
                  overwrite: true,
                }),
            });
          }, section);

    return () => {
      detachSpotlights.forEach((detach) => detach());
      context?.revert();
    };
  }, [reduced]);

  return (
    <section
      className="bg-gradient-to-b from-transparent via-[#0B0D10]/80 to-[#0B0D10] pt-28 md:pt-40"
      id="fleet"
      ref={sectionRef}
    >
      <div
        className={`max-w-7xl mx-auto px-6 md:px-10 mb-20 rounded-sm p-7 md:p-10 ${GLASS_SURFACE}`}
        data-reveal
      >
        <span className="block font-label-caps text-label-caps uppercase tracking-[0.34em] text-champagne mb-6">
          PJP Fleet
        </span>
        <h2 className="font-headline text-headline-xl-mobile md:text-headline-xl text-on-surface max-w-3xl">
          Three aircraft. One standard of arrival.
        </h2>
      </div>

      <div className="flex flex-col gap-28 md:gap-36">
        {FLEET.map((craft, index) => {
          const mirrored = index % 2 === 1;

          return (
            <article
              className={`fleet-card w-full max-w-7xl mx-auto px-6 md:px-10 py-8 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center rounded-sm ${GLASS_SURFACE}`}
              data-fleet-card
              key={craft.id}
            >
              {/* Imagery — the dominant element, framed by a gold hairline. */}
              <div
                className={`lg:col-span-7 editorial-frame relative rounded-sm border border-amber-400/20${mirrored ? ' lg:order-2' : ''}`}
              >
                <img
                  alt={craft.imageAlt}
                  className="w-full h-[300px] md:h-[460px] lg:h-[560px] object-cover"
                  src={craft.image}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-black/85 via-transparent to-transparent" />
                <span className="absolute bottom-5 left-6 font-label-caps text-label-caps uppercase text-champagne-bright">
                  {craft.imageCaption}
                </span>
              </div>

              {/* Editorial column */}
              <div className={`lg:col-span-5${mirrored ? ' lg:order-1' : ''}`}>
                <span className="block font-label-caps text-label-caps uppercase tracking-[0.28em] text-champagne mb-4">
                  {craft.eyebrow}
                </span>
                <h3 className="font-headline text-headline-lg text-on-surface mb-5">{craft.model}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-9">
                  {craft.blurb}
                </p>

                <dl className="grid grid-cols-3 border-t border-amber-400/20 mb-9">
                  {craft.dimensions.map((dimension) => (
                    <div className="pt-4 pr-4" key={dimension.label}>
                      <dt className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-2">
                        {dimension.label}
                      </dt>
                      <dd className="font-telemetry text-telemetry-md text-on-surface">
                        {dimension.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <button
                  className="champagne-btn rounded-sm px-6 py-3 font-label-caps text-label-caps uppercase inline-flex items-center gap-2 cursor-pointer"
                  onClick={() => onInspect(craft)}
                  type="button"
                >
                  <span>{craft.cta.label}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

