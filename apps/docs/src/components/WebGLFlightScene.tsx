import { useMemo } from 'react';
import { THREE_SCENE_SRCDOC } from '../data/threeScene';

/**
 * 4c. Aircraft envelope viewport. The three.js scene runs inside a sandboxed
 * iframe exactly as the Stitch export ships it, so a WebGL failure can never
 * take down the surrounding deck. Radar range rings, coordinate reticles and
 * target-card readouts are demoted to the cockpit HUD modal.
 */
export function WebGLFlightScene() {
  const srcdoc = useMemo(() => THREE_SCENE_SRCDOC, []);

  return (
    <div className="editorial-frame relative rounded-sm border border-champagne-hairline bg-charcoal">
      <div className="w-full h-96 md:h-[520px] relative flex items-center justify-center">
        <iframe
          className="w-full h-full border-0"
          srcDoc={srcdoc}
          title="Three-dimensional aircraft envelope visualisation"
        />
      </div>
      <span className="absolute bottom-4 left-5 font-label-caps text-label-caps uppercase text-champagne/80">
        Envelope Visualisation
      </span>
    </div>
  );
}
