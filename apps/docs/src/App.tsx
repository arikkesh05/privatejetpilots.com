import React, { useState, useRef } from 'react';
import { IcaoAvionicsTicker } from '@pjp/ui';
import { HudNavDock } from './components/HudNavDock';
import { CinematicHero } from './components/CinematicHero';
import { NetworkRoles } from './components/NetworkRoles';
import { ExecutiveFooter } from './components/ExecutiveFooter';
import { CockpitHudModal } from './components/CockpitHudModal';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { useScrollReveals } from './hooks/useScrollReveals';
import { useDeckHotkeys } from './hooks/useDeckHotkeys';
import { useAvionicsAudio } from './hooks/useAvionicsAudio';
import { useReducedMotion } from './hooks/useReducedMotion';

export default function App(): React.JSX.Element {
  const [hudModalOpen, setHudModalOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Inertial smooth scroll
  useSmoothScroll();

  // Scroll-linked entrance choreography for every [data-reveal] node
  useScrollReveals();

  // Accessibility & cabin telemetry
  const reducedMotion = useReducedMotion();

  // Interaction-sound engine
  const {
    active: audioActive,
    toggle: toggleAudio,
    chirp,
    datalink,
    canvasRef,
  } = useAvionicsAudio(reducedMotion);

  /* Cockpit controls. These deliberately do not chirp: opening a panel is an
     ordinary interaction, so it takes only the tactile key click the document
     listener already plays. The instrument chirp stays an on-demand control
     inside the cockpit console. */
  const handleOpenCockpit = () => {
    setHudModalOpen(true);
  };

  const handleCloseCockpit = () => {
    setHudModalOpen(false);
  };

  useDeckHotkeys({
    onToggleCockpit: () => {
      setHudModalOpen((prev) => !prev);
    },
    onToggleAudio: () => {
      toggleAudio();
    },
    onCloseCockpit: () => {
      handleCloseCockpit();
    },
  });

  return (
    <div className="relative min-h-screen bg-charcoal-black text-on-surface selection:bg-champagne selection:text-charcoal-black">
      <HudNavDock
        audioActive={audioActive}
        onOpenCockpit={handleOpenCockpit}
        onToggleAudio={toggleAudio}
      />

      {/* Editorial presentation — the seven-stage cinematic hero resolves the
          full 0→100% narrative arc, then hands directly into the network
          role selection. The luxury-charter brochure layer (FuselageScroller,
          FleetBento, ConciergeProtocols) is retired. */}
      <main className="relative z-10 flex flex-col gap-24 pb-12">
        <CinematicHero />
        <NetworkRoles />
      </main>

      {/* Position B: Pre-Apron Approach Ribbon */}
      <div className="relative z-20 w-full">
        <IcaoAvionicsTicker />
      </div>

      <ExecutiveFooter />

      <CockpitHudModal
        open={hudModalOpen}
        audioActive={audioActive}
        canvasRef={canvasRef}
        closeButtonRef={closeButtonRef}
        onChirp={chirp}
        onClose={handleCloseCockpit}
        onDatalink={datalink}
        onToggleAudio={toggleAudio}
      />
    </div>
  );
}