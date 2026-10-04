import { useEffect, useRef } from 'react';
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

const HUD_TELEMETRY = [
  { label: 'PITCH / ROLL', value: '+2.4° // 00° LEVEL', tone: 'text-champagne font-bold' },
  { label: 'MACH NO.', value: 'MACH 0.925', tone: 'text-champagne font-bold text-base' },
  { label: 'INDICATED KTAS', value: '540 KTS TRUE', tone: 'text-on-surface font-semibold' },
  { label: 'VSI CLIMB', value: '+2,400 FPM', tone: 'text-champagne font-semibold' },
  { label: 'TRANSPONDER', value: 'SQUAWK 4217 (ENC)', tone: 'text-champagne font-bold' },
] as const;

const ENVELOPE_TELEMETRY = [
  { label: 'CABIN ALTITUDE', value: '2,840 FT', tone: 'text-champagne font-bold' },
  { label: 'OUTSIDE AIR TEMP', value: '-54°C STATIC', tone: 'text-on-surface font-semibold' },
  { label: 'FUEL RESERVES', value: '14,200 LBS', tone: 'text-champagne font-semibold' },
  { label: 'KA-BAND DATALINK', value: '450 MBPS', tone: 'text-champagne font-bold' },
  { label: 'DIPLOMATIC CLEAR', value: '14 NATIONS', tone: 'text-champagne font-semibold' },
] as const;

const CAMERA_PERSPECTIVES = ['3D ORBIT', 'CHASE CAM', 'COCKPIT POV', 'TOP-DOWN RADAR'] as const;
const RADAR_RANGES = ['25 NM', '50 NM', '150 NM', 'GLOBAL'] as const;

/** 7. Fullscreen Cockpit HUD — [O] toggles it, ESC closes it. */
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
      className={`fixed inset-0 z-[100] bg-charcoal-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 md:p-6 transition-all duration-300${
        open ? ' opacity-100 pointer-events-auto' : ' opacity-0 pointer-events-none'
      }`}
      id="hud-modal"
      role="dialog"
    >
      {/* Top Cockpit HUD Navigation Bar */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 p-4 rounded-sm bg-surface-container-lowest/80 border border-champagne-hairline backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-champagne" />
            <span
              className="font-headline-md text-headline-md tracking-wider text-primary font-bold uppercase"
              id="hud-modal-title"
            >
              COCKPIT HUD SYSTEM // LIVE FLIGHT ENVELOPE
            </span>
          </div>
          <span className="hidden sm:inline-block text-outline">|</span>
          <div className="hidden sm:flex items-center gap-2 font-telemetry-sm text-telemetry-sm text-champagne">
            <span className="w-1.5 h-1.5 rounded-full bg-champagne" />
            <span>RADAR AZIMUTH: 360°</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Synthesizer Quick State in HUD */}
          <button
            type="button"
            onClick={onToggleAudio}
            aria-pressed={audioActive}
            className="audio-toggle-btn px-3 py-1.5 rounded-lg bg-surface-container-high/90 hover:bg-surface-container-highest border border-champagne-hairline text-champagne font-telemetry-sm text-[11px] uppercase flex items-center gap-2 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px] text-champagne">
              {audioActive ? 'volume_up' : 'volume_off'}
            </span>
            <span>{audioActive ? 'AUDIO GUARD ACTIVE [M]' : 'AUDIO MUTED [M]'}</span>
          </button>

          <div className="hidden lg:flex items-center gap-3 text-telemetry-sm font-telemetry-sm text-outline border-r border-champagne-hairline pr-4">
            <span className="text-champagne font-semibold">SATCOM KA-BAND // 450 MBPS ENCRYPTED</span>
            <span>•</span>
            <span className="text-champagne">GPS: 40°38&apos;23&quot;N 73°46&apos;44&quot;W</span>
          </div>

          {/* Exit HUD Button */}
          <button
            type="button"
            onClick={onClose}
            className="hud-close-btn champagne-btn-solid rounded-full px-5 py-2.5 font-label-caps text-label-caps uppercase flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            ref={closeButtonRef}
          >
            <span className="material-symbols-outlined text-[18px]">close_fullscreen</span>
            <span>EXIT HUD MODE</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-lowest/20 font-telemetry-sm">ESC</span>
          </button>
        </div>
      </header>

      {/* Avionics audio console — oscilloscope, guard frequency, sound tests */}
      <div className="relative z-20 pointer-events-auto w-full pt-6">
        <AudioTelemetrySynth
          active={audioActive}
          canvasRef={canvasRef}
          onChirp={onChirp}
          onDatalink={onDatalink}
        />
      </div>

      {/* Midsection: floating cockpit telemetry panels */}
      <div className="relative z-20 flex-1 flex items-center justify-between pointer-events-none py-6 my-auto select-none">
        {/* Left instrument ladder: pitch, airspeed, Mach, altimeter */}
        <div className="glass-cockpit p-5 rounded-sm border border-champagne-hairline w-64 pointer-events-auto backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2 mb-3">
            <span className="font-label-caps text-label-caps text-champagne uppercase tracking-wider">
              PRIMARY FLIGHT VECTOR
            </span>
            <span className="w-2 h-2 rounded-full bg-champagne" />
          </div>
          {HUD_TELEMETRY.map((row, index) => (
            <div
              key={row.label}
              className={`flex items-center justify-between py-2 ${
                index === HUD_TELEMETRY.length - 1 ? 'pt-2' : 'border-b border-outline-variant/20'
              }`}
            >
              <span className="font-telemetry-sm text-outline">{row.label}</span>
              <span className={`font-telemetry-sm ${row.tone}`}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Center reticle graphic (cockpit visualiser marker) */}
        <div className="hidden md:flex flex-col items-center justify-center opacity-60 pointer-events-none">
          <div className="w-24 h-24 rounded-full border border-champagne-hairline flex items-center justify-center relative">
            <div className="w-16 h-16 rounded-full border border-champagne-hairline absolute" />
            <div className="w-1 h-6 bg-champagne absolute -top-3" />
            <div className="w-1 h-6 bg-champagne absolute -bottom-3" />
            <div className="h-1 w-6 bg-champagne absolute -left-3" />
            <div className="h-1 w-6 bg-champagne absolute -right-3" />
            <div className="w-2 h-2 rounded-full bg-champagne" />
          </div>
          <span className="font-telemetry-sm text-telemetry-sm text-champagne mt-2 tracking-widest uppercase">
            ENVELOPE GUIDANCE // VECTOR 090
          </span>
        </div>

        {/* Right systems ladder: aircraft envelope & systems */}
        <div className="glass-cockpit p-5 rounded-sm border border-champagne-hairline w-64 pointer-events-auto backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2 mb-3">
            <span className="font-label-caps text-label-caps text-champagne uppercase tracking-wider">
              AIRCRAFT ENVELOPE
            </span>
            <span className="w-2 h-2 rounded-full bg-champagne" />
          </div>
          {ENVELOPE_TELEMETRY.map((row, index) => (
            <div
              key={row.label}
              className={`flex items-center justify-between py-2 ${
                index === ENVELOPE_TELEMETRY.length - 1 ? 'pt-2' : 'border-b border-outline-variant/20'
              }`}
            >
              <span className="font-telemetry-sm text-outline">{row.label}</span>
              <span className={`font-telemetry-sm ${row.tone}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom cockpit HUD dock */}
      <footer className="relative z-20 flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-sm bg-surface-container-lowest/80 border border-champagne-hairline backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider mr-2">
            CAMERA PERSPECTIVE:
          </span>
          {CAMERA_PERSPECTIVES.map((perspective, index) => (
            <button
              key={perspective}
              type="button"
              className={
                index === 0
                  ? 'px-3 py-1.5 rounded bg-champagne text-charcoal-black font-telemetry-sm text-telemetry-sm font-semibold active:scale-95 transition-all'
                  : 'px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-champagne-hairline text-on-surface font-telemetry-sm text-telemetry-sm active:scale-95 transition-all'
              }
            >
              {perspective}
            </button>
          ))}
        </div>

        {/* Center Radar Range Toggles */}
        <div className="flex items-center gap-3">
          <span className="font-telemetry-sm text-telemetry-sm text-outline">RADAR RANGE:</span>
          <div className="inline-flex rounded-lg border border-champagne-hairline p-0.5 bg-surface-container">
            {RADAR_RANGES.map((range, index) => (
              <button
                key={range}
                type="button"
                className={
                  index === 0
                    ? 'px-2 py-0.5 text-[11px] font-telemetry-sm text-champagne bg-surface-container-highest rounded'
                    : 'px-2 py-0.5 text-[11px] font-telemetry-sm text-on-surface-variant hover:text-on-surface'
                }
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Status Readout */}
        <div className="flex items-center gap-2 text-champagne font-telemetry-sm text-telemetry-sm">
          <span className="w-2 h-2 rounded-full bg-champagne" />
          <span>PRECISION FLIGHT PATH VECTORING ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}
