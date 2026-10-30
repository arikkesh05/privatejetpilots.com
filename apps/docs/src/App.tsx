import React, { useState, useRef, lazy, Suspense } from 'react';
import { IcaoAvionicsTicker } from '@pjp/ui';
import { HudNavDock } from './components/HudNavDock';
import { CinematicHero } from './components/CinematicHero';
import { NetworkRoles } from './components/NetworkRoles';
import { ExecutiveFooter } from './components/ExecutiveFooter';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { useScrollReveals } from './hooks/useScrollReveals';
import { useDeckHotkeys } from './hooks/useDeckHotkeys';
import { useAvionicsAudio } from './hooks/useAvionicsAudio';
import { useReducedMotion } from './hooks/useReducedMotion';

// Dynamic lazy imports for heavy off-canvas interactive modals
const CockpitHudModal = lazy(() =>
  import('./components/CockpitHudModal').then((m) => ({ default: m.CockpitHudModal }))
);
const FboScanModal = lazy(() =>
  import('./components/FboScanModal').then((m) => ({ default: m.FboScanModal }))
);
const RampBadgeModal = lazy(() =>
  import('./components/RampBadgeModal').then((m) => ({ default: m.RampBadgeModal }))
);

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

      <Suspense fallback={null}>
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
        <RampBadgeModal />
        <FboScanModal />
      </Suspense>
    </div>
  );
}
