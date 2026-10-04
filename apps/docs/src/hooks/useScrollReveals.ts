import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from './useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

const REVEAL_SELECTOR = '[data-reveal]';
const REVEAL_DISTANCE_PX = 28;
const REVEAL_DURATION_S = 1.1;
const REVEAL_START = 'top 88%';

function parseDelay(value: string | undefined): number {
  const delay = Number(value ?? 0);

  return Number.isFinite(delay) && delay > 0 ? delay : 0;
}

/**
 * Scroll-linked reveals for every `[data-reveal]` node.
 *
 * Progressive enhancement only: the resting state lives in the markup, GSAP
 * layers the entrance on top, and `once: true` means each element settles for
 * good. Reduced-motion operators never enter this hook, so the deck renders
 * fully composed with zero animation. `gsap.context()` scopes teardown so the
 * React StrictMode double-mount cannot leave orphaned triggers behind.
 */
export function useScrollReveals(): void {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(REVEAL_SELECTOR).forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: REVEAL_DISTANCE_PX },
          {
            autoAlpha: 1,
            y: 0,
            delay: parseDelay(element.dataset.revealDelay),
            duration: REVEAL_DURATION_S,
            ease: 'power3.out',
            scrollTrigger: {
              once: true,
              start: REVEAL_START,
              trigger: element,
            },
          },
        );
      });
    });

    return () => context.revert();
  }, [reducedMotion]);
}
