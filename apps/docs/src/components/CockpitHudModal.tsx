import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { AudioTelemetrySynth } from './AudioTelemetrySynth';

interface CockpitHudModalProps {
  open: boolean;
  audioActive: boolean;
  /** Oscilloscope canvas for the avionics audio console. */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onChirp: () => void;
  onClose: () => void;
  onDatalink: () => void;
  onToggleAudio: () => void;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
}

const CAMERA_PERSPECTIVES = [
  { label: '3D ORBIT', vector: 'VECTOR 090 // ORBITAL LOCK', pitch: '+2.4° // 00° LEVEL' },
  { label: 'CHASE CAM', vector: 'VECTOR 220 // TAIL PURSUIT', pitch: '+3.1° // 02° BANK' },
  { label: 'COCKPIT POV', vector: 'SYNTHETIC VISION // RWY 22L', pitch: '+2.0° // ILS LOCKED' },
  { label: 'TOP-DOWN RADAR', vector: 'AZIMUTH 360° // PLANAR', pitch: '00.0° // NADIR SCAN' },
] as const;

const RADAR_RANGES = ['25 NM', '50 NM', '150 NM', 'GLOBAL'] as const;

const ENVELOPE_TELEMETRY = [
  { label: 'CABIN ALTITUDE', value: '2,840 FT', tone: 'text-champagne font-bold' },
  { label: 'OUTSIDE AIR TEMP', value: '-54°C STATIC', tone: 'text-on-surface font-semibold' },
  { label: 'FUEL RESERVES', value: '14,200 LBS', tone: 'text-champagne font-semibold' },
  { label: 'KA-BAND DATALINK', value: '450 MBPS', tone: 'text-champagne font-bold' },
  { label: 'DIPLOMATIC CLEAR', value: '14 NATIONS', tone: 'text-champagne font-semibold' },
] as const;

/** Fullscreen Cockpit HUD — [O] toggles it, ESC closes it. */
export function CockpitHudModal({
  open,
  audioActive,
  canvasRef,
  onChirp,
  onClose,
  onDatalink,
  onToggleAudio,
  closeButtonRef,
}: CockpitHudModalProps) {
  const restoreRef = useRef<HTMLElement | null>(null);
  const [cameraIdx, setCameraIdx] = useState<number>(0);
  const [rangeIdx, setRangeIdx] = useState<number>(0);

  const activeCamera = CAMERA_PERSPECTIVES[cameraIdx];
  const activeRange = RADAR_RANGES[rangeIdx];

  const primaryTelemetry = [
    { label: 'PITCH / ROLL', value: activeCamera.pitch, tone: 'text-champagne font-bold' },
    { label: 'MACH NO.', value: 'MACH 0.925', tone: 'text-champagne font-bold text-sm sm:text-base' },
    { label: 'INDICATED KTAS', value: '540 KTS TRUE', tone: 'text-on-surface font-semibold' },
    { label: 'RADAR SWEEP', value: `${activeRange} ACTIVE`, tone: 'text-champagne font-semibold' },
    { label: 'TRANSPONDER', value: 'SQUAWK 4217 (ENC)', tone: 'text-champagne font-bold' },
  ] as const;

  useEffect(() => {
    if (!open) {
      return;
    }

    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus();
    };
  }, [closeButtonRef, onClose, open]);

  return (
    <div
      aria-hidden={!open}
      aria-labelledby="hud-modal-title"
      aria-modal="true"
      className={`fixed inset-0 z-[100] bg-charcoal-black/95 backdrop-blur-2xl flex flex-col justify-between overflow-y-auto p-3 sm:p-5 md:p-6 transition-all duration-300${
        open ? ' opacity-100 pointer-events-auto' : ' opacity-0 pointer-events-none'
      }`}
      id="hud-modal"
      role="dialog"
    >
      {/* Top Cockpit HUD Navigation Bar */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-lg bg-surface-container-lowest/85 border border-champagne-hairline backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-champagne shrink-0 shadow-[0_0_8px_#CBB079]" />
          <span
            className="font-mono text-xs sm:text-sm md:text-base tracking-[0.18em] text-primary font-bold uppercase truncate"
            id="hud-modal-title"
          >
            COCKPIT HUD // FLIGHT ENVELOPE
          </span>
          <span className="hidden md:inline-block text-outline">|</span>
          <div className="hidden md:flex items-center gap-2 font-telemetry-sm text-telemetry-sm text-champagne">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            <span>SWEEP: {activeRange}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
          {/* Audio Synthesizer Quick State in HUD */}
          <button
            type="button"
            onClick={onToggleAudio}
            aria-pressed={audioActive}
            className="audio-toggle-btn px-2.5 sm:px-3 py-1.5 rounded-lg bg-surface-container-high/90 hover:bg-surface-container-highest border border-champagne-hairline text-champagne font-telemetry-sm text-[10px] sm:text-[11px] uppercase flex items-center gap-1.5 sm:gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-champagne">
              {audioActive ? 'volume_up' : 'volume_off'}
            </span>
            <span className="hidden xs:inline sm:inline">
              {audioActive ? 'AUDIO GUARD [M]' : 'AUDIO MUTED [M]'}
            </span>
          </button>

          <div className="hidden xl:flex items-center gap-3 text-telemetry-sm font-telemetry-sm text-outline border-r border-champagne-hairline pr-4">
            <span className="text-champagne font-semibold">SATCOM KA-BAND // 450 MBPS</span>
            <span>•</span>
            <span className="text-champagne">40°38&apos;23&quot;N 73°46&apos;44&quot;W</span>
          </div>

          {/* Exit HUD Button */}
          <button
            type="button"
            onClick={onClose}
            className="hud-close-btn champagne-btn-solid rounded-full px-3.5 sm:px-5 py-2 font-mono text-[10px] sm:text-[11px] tracking-[0.18em] font-bold uppercase flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 transition-all"
            ref={closeButtonRef}
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">close_fullscreen</span>
            <span>EXIT HUD</span>
            <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-surface-container-lowest/25 font-mono">
              ESC
            </span>
          </button>
        </div>
      </header>

      {/* Avionics audio console — oscilloscope, guard frequency, sound tests */}
      <div className="relative z-20 pointer-events-auto w-full pt-3 sm:pt-5 shrink-0">
        <AudioTelemetrySynth
          active={audioActive}
          canvasRef={canvasRef}
          onChirp={onChirp}
          onDatalink={onDatalink}
        />
      </div>

      {/* Midsection: responsive cockpit telemetry panels */}
      <div className="relative z-20 flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-center gap-4 lg:gap-6 py-4 sm:py-6 my-auto select-none">
        {/* Left instrument ladder: pitch, airspeed, Mach, altimeter */}
        <div className="glass-cockpit p-4 sm:p-5 rounded-lg border border-champagne-hairline w-full lg:max-w-xs pointer-events-none backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2 mb-3">
            <span className="font-mono text-[10px] sm:text-[11px] text-champagne uppercase tracking-[0.2em] font-semibold">
              PRIMARY FLIGHT VECTOR
            </span>
            <span className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e]" />
          </div>
          {primaryTelemetry.map((row, index) => (
            <div
              key={row.label}
              className={`flex items-center justify-between gap-2 py-2 pointer-events-none ${
                index === primaryTelemetry.length - 1 ? 'pt-2' : 'border-b border-outline-variant/20'
              }`}
            >
              <span className="font-mono text-[10px] sm:text-[11px] text-outline">{row.label}</span>
              <span className={`font-mono text-[11px] sm:text-xs text-right ${row.tone}`}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Center reticle graphic (interactive camera + range visualizer) */}
        <div className="hidden lg:flex flex-col items-center justify-center opacity-80 pointer-events-none">
          <div className="w-28 h-28 rounded-full border border-champagne-hairline flex items-center justify-center relative">
            <div className="w-18 h-18 rounded-full border border-champagne/40 absolute inset-4" />
            <div className="w-0.5 h-6 bg-champagne absolute -top-3" />
            <div className="w-0.5 h-6 bg-champagne absolute -bottom-3" />
            <div className="h-0.5 w-6 bg-champagne absolute -left-3" />
            <div className="h-0.5 w-6 bg-champagne absolute -right-3" />
            <div className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]" />
          </div>
          <span className="font-mono text-[10px] text-champagne mt-4 tracking-[0.22em] uppercase text-center">
            {activeCamera.vector}
          </span>
          <span className="font-mono text-[9px] text-white/45 mt-1 tracking-[0.2em] uppercase">
            MODE: {activeCamera.label} • RANGE: {activeRange}
          </span>
        </div>

        {/* Right systems ladder: aircraft envelope & systems */}
        <div className="glass-cockpit p-4 sm:p-5 rounded-lg border border-champagne-hairline w-full lg:max-w-xs lg:justify-self-end pointer-events-none backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2 mb-3">
            <span className="font-mono text-[10px] sm:text-[11px] text-champagne uppercase tracking-[0.2em] font-semibold">
              AIRCRAFT ENVELOPE
            </span>
            <span className="w-2 h-2 rounded-full bg-champagne" />
          </div>
          {ENVELOPE_TELEMETRY.map((row, index) => (
            <div
              key={row.label}
              className={`flex items-center justify-between gap-2 py-2 pointer-events-none ${
                index === ENVELOPE_TELEMETRY.length - 1 ? 'pt-2' : 'border-b border-outline-variant/20'
              }`}
            >
              <span className="font-mono text-[10px] sm:text-[11px] text-outline">{row.label}</span>
              <span className={`font-mono text-[11px] sm:text-xs text-right ${row.tone}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom cockpit HUD dock */}
      <footer className="relative z-20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-surface-container-lowest/85 border border-champagne-hairline backdrop-blur-md shrink-0">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
          <span className="font-mono text-[10px] text-outline uppercase tracking-[0.18em] mr-1 w-full sm:w-auto">
            CAMERA:
          </span>
          {CAMERA_PERSPECTIVES.map((perspective, index) => {
            const isSelected = index === cameraIdx;
            return (
              <button
                key={perspective.label}
                type="button"
                onClick={() => setCameraIdx(index)}
                className={
                  isSelected
                    ? 'px-2.5 sm:px-3 py-1.5 rounded bg-champagne text-charcoal-black font-mono text-[10px] sm:text-[11px] font-bold tracking-wider active:scale-95 transition-all cursor-pointer'
                    : 'px-2.5 sm:px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-champagne-hairline text-on-surface font-mono text-[10px] sm:text-[11px] tracking-wider active:scale-95 transition-all cursor-pointer'
                }
              >
                {perspective.label}
              </button>
            );
          })}
        </div>

        {/* Center Radar Range Toggles */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-mono text-[10px] tracking-[0.18em] text-outline">RADAR RANGE:</span>
          <div className="inline-flex rounded-lg border border-champagne-hairline p-0.5 bg-surface-container">
            {RADAR_RANGES.map((range, index) => {
              const isSelected = index === rangeIdx;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => setRangeIdx(index)}
                  className={
                    isSelected
                      ? 'px-2.5 py-1 text-[10px] sm:text-[11px] font-mono font-bold text-champagne bg-surface-container-highest rounded cursor-pointer transition-colors'
                      : 'px-2.5 py-1 text-[10px] sm:text-[11px] font-mono text-on-surface-variant hover:text-on-surface cursor-pointer transition-colors'
                  }
                >
                  {range}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Readout */}
        <div className="flex items-center gap-2 text-champagne font-mono text-[10px] tracking-[0.18em]">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e]" />
          <span>PRECISION VECTORING ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}

export default CockpitHudModal;