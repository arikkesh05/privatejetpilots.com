import { useEffect, useState } from 'react';

/**
 * Live cockpit telemetry stream (10 Hz deck, 1.8 s sampling cadence in the deck UI).
 *
 * Ported from the Stitch export's `initCockpitHUD` interval: cabin altitude,
 * Ka-band broadband throughput, groundspeed and the jetstream tailwind component.
 * Frozen at nominal values when the operator prefers reduced motion.
 */
export interface TelemetryStream {
  /** Denver-equivalent cabin pressure altitude, e.g. `2,838 FT`. */
  readonly cabinAlt: string;
  /** Ka-band mesh throughput, e.g. `450 Mbps`. */
  readonly broadband: string;
  /** Groundspeed in knots, e.g. `540`. */
  readonly groundspeed: string;
  /** Tailwind component, e.g. `+67 KTS JETSTREAM`. */
  readonly tailwind: string;
}

const SAMPLE_INTERVAL_MS = 1800;
const BASE_CABIN_ALT_FT = 2840;
const BASE_GROUNDSPEED_KTS = 540;
const BASE_BROADBAND_MBPS = 450;
const BASE_TAILWIND_KTS = 68;

function jitter(spread: number): number {
  return Math.floor(Math.random() * spread) - Math.floor(spread / 2);
}

export function useTelemetryStream(reducedMotion: boolean): TelemetryStream {
  const [stream, setStream] = useState<TelemetryStream>({
    cabinAlt: '2,838 FT',
    broadband: '450 Mbps',
    groundspeed: '540',
    tailwind: '+67 KTS JETSTREAM',
  });

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const tick = window.setInterval(() => {
      setStream((current) => ({
        cabinAlt: `${(BASE_CABIN_ALT_FT + jitter(9)).toLocaleString()} FT`,
        broadband: Math.random() > 0.6 ? `${BASE_BROADBAND_MBPS + jitter(7)} Mbps` : current.broadband,
        groundspeed: Math.random() > 0.4 ? `${BASE_GROUNDSPEED_KTS + jitter(5)}` : current.groundspeed,
        tailwind: Math.random() > 0.7 ? `+${BASE_TAILWIND_KTS + jitter(3)} KTS JETSTREAM` : current.tailwind,
      }));
    }, SAMPLE_INTERVAL_MS);

    return () => window.clearInterval(tick);
  }, [reducedMotion]);

  return stream;
}
