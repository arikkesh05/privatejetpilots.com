import type { TelemetryStream } from '../hooks/useTelemetryStream';
import { WebGLFlightScene } from './WebGLFlightScene';

interface AvionicsTelemetrySuiteProps {
  onOpenCockpit: () => void;
  telemetry: TelemetryStream;
}

interface CabinMetric {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
  readonly body: string;
}

/**
 * 4. Avionics & Cabin Intelligence — the editorial landing expression of the
 * avionics capability. Raw instrument readouts (oscilloscope, guard frequency,
 * transponder squawk, radar ranges, route vectors) are demoted to the cockpit
 * HUD modal; only the three cabin-outcome metrics remain on this surface.
 */
export function AvionicsTelemetrySuite({ onOpenCockpit, telemetry }: AvionicsTelemetrySuiteProps) {
  const metrics: readonly CabinMetric[] = [
    {
      body: 'Air pressure equivalent to Denver at FL450, so passengers step off with zero accumulated fatigue.',
      icon: 'air',
      label: 'Cabin altitude',
      value: telemetry.cabinAlt,
    },
    {
      body: 'A direct Ka-band satellite mesh with the stability to hold a 4K board meeting at altitude.',
      icon: 'satellite_alt',
      label: 'Streaming broadband',
      value: telemetry.broadband,
    },
    {
      body: 'Pre-authorised airway corridors with no intermediate holding and no terminal transition.',
      icon: 'verified_user',
      label: 'Diplomatic overflight',
      value: '14 nations cleared',
    },
  ];

  return (
    <section className="py-28 border-y border-champagne-hairline bg-charcoal-deep" id="operations">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14"
          data-reveal
        >
          <div className="max-w-2xl">
            <span className="block font-label-caps text-label-caps uppercase tracking-[0.34em] text-champagne mb-6">
              Avionics &amp; Cabin
            </span>
            <h2 className="font-headline text-headline-xl-mobile md:text-headline-xl text-on-surface mb-5">
              Instrumented for silence.
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Every aircraft in the fleet flies behind redundant avionics, dual flight crews and a
              live satellite link. The full instrument picture is held on demand, out of the way of
              the journey.
            </p>
          </div>
          <button
            className="champagne-btn shrink-0 rounded-sm px-6 py-3 font-label-caps text-label-caps uppercase inline-flex items-center gap-2 cursor-pointer"
            onClick={onOpenCockpit}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">fullscreen</span>
            <span>Open the cockpit</span>
          </button>
        </div>

        <div className="mb-14" data-reveal>
          <WebGLFlightScene />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((metric, index) => (
            <div
              className="glass-cockpit rounded-sm p-7"
              data-reveal
              data-reveal-delay={String(0.08 * index)}
              key={metric.label}
            >
              <span className="material-symbols-outlined text-[22px] text-champagne block mb-6">
                {metric.icon}
              </span>
              <span className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-3">
                {metric.label}
              </span>
              <span className="block font-headline text-headline-lg text-on-surface tabular-nums mb-3">
                {metric.value}
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                {metric.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
