import { useState } from 'react';
import { HERO_STRATOSPHERE_ALT, HERO_STRATOSPHERE_URL } from '../data/assets';
import { MissionDispatchTerminal } from './MissionDispatchTerminal';

/**
 * 2. Cinematic Hero — one full-bleed stratosphere frame, a single editorial
 * display statement, and the mission dispatch dock resting at the base of the
 * frame. Instrument readouts are demoted to the cockpit HUD modal.
 */
export function HeroSection() {
  const [requesting, setRequesting] = useState(false);

  const handleRequest = () => {
    setRequesting(true);
    window.setTimeout(() => setRequesting(false), 900);
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-charcoal-black" id="top">
      {/* Full-bleed cinematic frame. The image is presented sharp and high
          contrast rather than dimmed: the source art ships graded violet at
          twilight, so it is rendered monochrome and re-tinted with a whisper of
          champagne — the deck's only hue — while a left-hand obsidian wash and a
          soft ambient vignette carry the type, not a global brightness cut. */}
      <div className="absolute inset-0 z-0">
        <img
          alt={HERO_STRATOSPHERE_ALT}
          className="w-full h-full object-cover object-center grayscale brightness-[0.85] contrast-[1.12]"
          src={HERO_STRATOSPHERE_URL}
        />
        <div className="absolute inset-0 bg-champagne/15 mix-blend-soft-light" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-black via-charcoal-black/70 to-charcoal-black/10" />
        <div className="hero-vignette absolute inset-0" />
      </div>

      {/* Editorial statement */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 pt-36 pb-44">
        <div className="max-w-4xl">
          <span
            className="block font-label-caps text-label-caps uppercase tracking-[0.34em] text-champagne/75 mb-8"
            data-reveal
          >
            Private Jet Pilots
          </span>

          {/* Sculptured editorial display statement: Syne at full weight on
              obsidian, with the PJP clause picked out in champagne gold. */}
          <h1
            className="font-headline text-display-hero-mobile md:text-display-hero text-on-surface mb-8 text-balance"
            data-reveal
            data-reveal-delay="0.08"
          >
            Precision Aviation for{' '}
            <span className="text-champagne-gold">PJP Flight Decks</span>
          </h1>

          <p
            className="max-w-xl font-sans text-[15px] md:text-[17px] leading-7 md:leading-8 font-light text-on-surface-variant/80 mb-10"
            data-reveal
            data-reveal-delay="0.16"
          >
            PJP transcontinental charter and bespoke aircraft management, arranged with the
            quiet precision that removes every trace of effort from the journey.
          </p>

          <div className="flex flex-wrap items-center gap-4" data-reveal data-reveal-delay="0.24">
            <a
              className="champagne-btn-solid rounded-sm px-7 py-3 font-label-caps text-label-caps uppercase inline-flex items-center gap-2"
              href="#charter"
            >
              Request a flight
            </a>
            <a
              className="champagne-btn rounded-sm px-7 py-3 font-label-caps text-label-caps uppercase inline-flex items-center gap-2"
              href="#fleet"
            >
              View the fleet
            </a>
          </div>
        </div>
      </div>

      {/* Floating mission dispatch dock */}
      <div className="absolute inset-x-0 bottom-6 z-10 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <MissionDispatchTerminal onRequest={handleRequest} requesting={requesting} />
        </div>
      </div>
    </section>
  );
}
