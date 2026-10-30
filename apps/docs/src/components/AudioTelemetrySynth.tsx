import type { RefObject } from 'react';

interface AudioTelemetrySynthProps {
  /** Guard receiver transmit state. */
  active: boolean;
  /** Oscilloscope canvas, drawn by the avionics audio engine. */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Manual 880 Hz / 1760 Hz resonant chirp trigger. */
  onChirp: () => void;
  /** Manual 1200-2400 Hz datalink packet burst trigger. */
  onDatalink: () => void;
}

/**
 * 4a. Avionics audio console — the instrument surface for the interaction-sound
 * engine: guard frequency readout, dual-waveform oscilloscope and the manual
 * sound-test triggers. It lives inside the cockpit HUD modal, on demand; the
 * landing page carries no oscilloscope.
 */
export function AudioTelemetrySynth({
  active,
  canvasRef,
  onChirp,
  onDatalink,
}: AudioTelemetrySynthProps) {
  return (
    <div className="glass-cockpit rounded-sm p-4 mb-6">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Channel status */}
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="w-10 h-10 rounded-lg border border-champagne-hairline flex items-center justify-center text-champagne shrink-0">
            <span className="material-symbols-outlined text-[20px]">
              {active ? 'graphic_eq' : 'volume_off'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-caps text-label-caps text-on-surface uppercase">
                Avionics audio guard
              </span>
              <span className="px-2 py-0.5 rounded-full border border-champagne-hairline font-label-caps text-[9px] uppercase tracking-[0.14em] text-champagne/80">
                {active ? 'Transmitting' : 'Muted'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-telemetry-sm text-[12px] text-on-surface-variant/80">
              <span>
                Guard: <span className="text-champagne/90">121.500 MHz</span>
              </span>
              <span className="text-outline/50">/</span>
              <span>
                Chirp: <span className="text-champagne/90">880 / 1760 Hz</span>
              </span>
              <span className="text-outline/50">/</span>
              <span>
                Datalink: <span className="text-champagne/90">2.4 kHz</span>
              </span>
            </div>
          </div>
        </div>

        {/* Dual-waveform oscilloscope */}
        <div className="w-full lg:w-96 h-12 bg-charcoal-black/90 rounded border border-champagne-hairline relative overflow-hidden flex items-center px-3 py-1">
          <canvas className="w-full h-full block pointer-events-none" height={44} ref={canvasRef} width={380} />
          <div className="absolute right-2 bottom-1 font-telemetry-sm text-[9px] text-champagne/50 pointer-events-none">
            48 kHz PCM
          </div>
        </div>

        {/* Manual sound tests */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <button
            className="champagne-btn rounded-full px-3.5 py-1.5 font-label-caps text-[10px] uppercase tracking-[0.16em] inline-flex items-center gap-1.5 cursor-pointer"
            id="btn-manual-chirp"
            onClick={onChirp}
            title="Send an on-demand avionics chirp"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">sensors</span>
            <span>Chirp</span>
          </button>
          <button
            className="champagne-btn rounded-full px-3.5 py-1.5 font-label-caps text-[10px] uppercase tracking-[0.16em] inline-flex items-center gap-1.5 cursor-pointer"
            id="btn-manual-datalink"
            onClick={onDatalink}
            title="Send a simulated datalink packet burst"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">send_time_extension</span>
            <span>Datalink</span>
          </button>
        </div>
      </div>
    </div>
  );
}
