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

      {/* Seamless vertical handoff from Stage 7 Hero -> Ecosystem Entry -> Apron Ticker */}
      <main className="relative z-10 flex flex-col">
        <CinematicHero />
        <NetworkRoles />
      </main>

      {/* Pre-Apron Approach Ribbon */}
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