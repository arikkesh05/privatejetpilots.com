import { useState } from 'react';

interface MissionDispatchTerminalProps {
  /** Confirms the charter request; drives the quiet acknowledgement state. */
  onRequest: () => void;
  requesting: boolean;
}

const LABEL_CLASS =
  'block font-label-caps text-label-caps uppercase text-on-surface-variant mb-2';

const INPUT_CLASS =
  'w-full bg-transparent border-0 border-b border-champagne-hairline pb-1.5 font-sans text-body-md text-on-surface transition-colors duration-300 focus:border-champagne focus:outline-none';

const SELECT_CLASS = `${INPUT_CLASS} cursor-pointer`;

const MANIFEST_OPTIONS = ['1 - 8 passengers', '9 - 13 passengers', '14 - 19 passengers'] as const;

/**
 * 2b. Mission Dispatch Dock — an understated translucent request bar resting at
 * the base of the hero: origin, destination, departure, manifest, and the single
 * quiet champagne action. No system revisions, no blinking cursor, no telemetry.
 */
export function MissionDispatchTerminal({ onRequest, requesting }: MissionDispatchTerminalProps) {
  const [manifest, setManifest] = useState<string>(MANIFEST_OPTIONS[0]);

  return (
    <div
      className="glass-cockpit-active rounded-sm px-6 py-5 md:px-8 md:py-4"
      data-reveal
      data-reveal-delay="0.32"
      id="charter"
    >
      <form className="flex flex-col md:flex-row md:items-end gap-5 md:gap-8">
        <div className="flex-1 min-w-0">
          <label className={LABEL_CLASS} htmlFor="dispatch-origin">
            From
          </label>
          <input
            className={INPUT_CLASS}
            defaultValue="Teterboro, New Jersey"
            id="dispatch-origin"
            name="origin"
            type="text"
          />
        </div>

        <div className="flex-1 min-w-0">
          <label className={LABEL_CLASS} htmlFor="dispatch-destination">
            To
          </label>
          <input
            className={INPUT_CLASS}
            defaultValue="Geneva, Switzerland"
            id="dispatch-destination"
            name="destination"
            type="text"
          />
        </div>

        <div className="flex-1 min-w-0">
          <label className={LABEL_CLASS} htmlFor="dispatch-departure">
            Departure
          </label>
          <input
            className={INPUT_CLASS}
            defaultValue="24 October, 14:00"
            id="dispatch-departure"
            name="departure"
            type="text"
          />
        </div>

        <div className="flex-1 min-w-0">
          <label className={LABEL_CLASS} htmlFor="dispatch-manifest">
            Passengers
          </label>
          <select
            className={SELECT_CLASS}
            id="dispatch-manifest"
            name="manifest"
            onChange={(event) => setManifest(event.target.value)}
            value={manifest}
          >
            {MANIFEST_OPTIONS.map((option) => (
              <option className="bg-charcoal text-on-surface" key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <button
          className="champagne-btn-solid w-full md:w-auto shrink-0 rounded-sm px-7 py-3.5 font-label-caps text-label-caps uppercase whitespace-nowrap cursor-pointer"
          id="request-charter-btn"
          onClick={onRequest}
          type="button"
        >
          {requesting ? 'Received' : 'Request flight'}
        </button>
      </form>
    </div>
  );
}
