import React, { useState, useRef } from 'react';
import { HudNavDock } from './components/HudNavDock';
import { CockpitPortalHero } from './components/CockpitPortalHero';
import { FuselageScroller } from './components/FuselageScroller';
import { FleetBento } from './components/FleetBento';
import { ConciergeProtocols } from './components/ConciergeProtocols';
import { ExecutiveFooter } from './components/ExecutiveFooter';
import { CockpitHudModal } from './components/CockpitHudModal';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { useScrollReveals } from './hooks/useScrollReveals';
import { useDeckHotkeys } from './hooks/useDeckHotkeys';
import { useAvionicsAudio } from './hooks/useAvionicsAudio';
import { useReducedMotion } from './hooks/useReducedMotion';
import type { FleetCraft } from './data/fleet';

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

  const handleInspectCraft = (_craft: FleetCraft) => {
    handleOpenCockpit();
  };

  return (
    <div className="relative min-h-screen bg-charcoal-black text-on-surface selection:bg-champagne selection:text-charcoal-black">
      <HudNavDock
        audioActive={audioActive}
        onOpenCockpit={handleOpenCockpit}
        onToggleAudio={toggleAudio}
      />

      {/* Editorial presentation */}
      <main className="relative z-10 flex flex-col gap-24 pb-20">
        <CockpitPortalHero />
        <FuselageScroller />
        <FleetBento onInspect={handleInspectCraft} />
        <ConciergeProtocols />
      </main>

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
