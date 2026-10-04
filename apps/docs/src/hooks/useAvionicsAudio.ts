import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Interaction-only audio. There are no background loops: no cabin hum, no
 * recurring radar ping and no datalink chatter, so the page is completely
 * silent on load. The one sound the deck makes by default is a whisper-soft
 * mechanical key click on a control, and even that is opt-in — sound stays off
 * until the operator turns it on with the header toggle or the [M] hotkey.
 *
 * The resonant chirp (880 Hz / 1760 Hz) and the Ka-band datalink burst exist
 * only as explicit buttons inside the cockpit console, never on a timer.
 */
export interface AvionicsAudio {
  /**
   * Master audio switch for interaction feedback, toggled with the [M] hotkey.
   * Off by default: the deck never makes a sound until it is asked to.
   */
  readonly active: boolean;
  readonly toggle: () => void;
  readonly chirp: () => void;
  readonly datalink: () => void;
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  readonly eqBarsRef: RefObject<HTMLDivElement | null>;
  readonly toast: string;
  readonly toastVisible: boolean;
}

const TOAST_TIMEOUT_MS = 2600;
/** Master bus ceiling. Kept deliberately low: the deck's loudest sound is a key click. */
const MASTER_GAIN = 0.22;
const CHIRP_HIGH_HZ = 1760;
const CHIRP_LOW_HZ = 880;
const DATALINK_MIN_HZ = 1200;
const DATALINK_MAX_HZ = 2400;
const TACTILE_CLICK_HZ = 1480;
/** Whisper-soft: felt rather than heard, so a page of links never turns talkative. */
const TACTILE_CLICK_GAIN = 0.045;

const ACTIVE_TOAST = 'Interaction sound on';
const MUTED_TOAST = 'Interaction sound muted';

interface AudioContextWindow {
  readonly webkitAudioContext?: typeof AudioContext;
}

function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextCtor =
    window.AudioContext ?? (window as unknown as AudioContextWindow).webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  return new AudioContextCtor();
}

export function useAvionicsAudio(reducedMotion: boolean): AvionicsAudio {
  /* Sound is opt-in. The deck is silent on load and stays that way until the
     operator asks for the tactile click. */
  const [active, setActive] = useState(false);
  const [toast, setToast] = useState(ACTIVE_TOAST);
  const [toastVisible, setToastVisible] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const eqBarsRef = useRef<HTMLDivElement | null>(null);

  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const activeRef = useRef(active);
  const burstRef = useRef(0);
  const phaseRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  /** Lazily boots the graph; also resumes a context suspended by autoplay policy. */
  const ensureContext = useCallback((): AudioContext | null => {
    if (!contextRef.current) {
      const context = createAudioContext();

      if (!context) {
        return null;
      }

      const master = context.createGain();
      master.gain.setValueAtTime(MASTER_GAIN, context.currentTime);
      master.connect(context.destination);

      contextRef.current = context;
      masterRef.current = master;
    }

    if (contextRef.current.state === 'suspended') {
      void contextRef.current.resume();
    }

    return contextRef.current;
  }, []);

  const chirp = useCallback(() => {
    const context = contextRef.current ?? ensureContext();
    const master = masterRef.current;

    if (!activeRef.current || !context || !master) {
      return;
    }

    try {
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      const startFrequency = Math.random() > 0.6 ? CHIRP_HIGH_HZ : CHIRP_LOW_HZ;

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(startFrequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(startFrequency * 0.72, now + 0.28);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(startFrequency, now);
      filter.Q.setValueAtTime(4.2, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      oscillator.start(now);
      oscillator.stop(now + 0.4);

      burstRef.current = Math.max(burstRef.current, 0.9);
    } catch {
      /* silent fail on restricted environments */
    }
  }, [ensureContext]);

  const datalink = useCallback(() => {
    const context = contextRef.current ?? ensureContext();
    const master = masterRef.current;

    if (!activeRef.current || !context || !master) {
      return;
    }

    try {
      const now = context.currentTime;
      const clickCount = Math.floor(Math.random() * 3) + 2;

      for (let index = 0; index < clickCount; index += 1) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const clickTime = now + index * 0.045;

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(
          DATALINK_MIN_HZ + Math.random() * (DATALINK_MAX_HZ - DATALINK_MIN_HZ),
          clickTime,
        );

        gain.gain.setValueAtTime(0.001, clickTime);
        gain.gain.linearRampToValueAtTime(0.06, clickTime + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, clickTime + 0.025);

        oscillator.connect(gain);
        gain.connect(master);

        oscillator.start(clickTime);
        oscillator.stop(clickTime + 0.03);
      }

      burstRef.current = Math.max(burstRef.current, 0.6);
    } catch {
      /* audio restriction fallback */
    }
  }, [ensureContext]);

  /** Crisp mechanical avionics key click used as tactile feedback on controls. */
  const tactile = useCallback(() => {
    /* Built inside the click handler, so the browser sees a user gesture. */
    const context = contextRef.current ?? ensureContext();
    const master = masterRef.current;

    if (!activeRef.current || !context || !master) {
      return;
    }

    try {
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(TACTILE_CLICK_HZ, now);
      oscillator.frequency.exponentialRampToValueAtTime(TACTILE_CLICK_HZ * 0.5, now + 0.035);

      gain.gain.setValueAtTime(TACTILE_CLICK_GAIN, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      oscillator.connect(gain);
      gain.connect(master);

      oscillator.start(now);
      oscillator.stop(now + 0.05);
    } catch {
      /* silent fallback */
    }
  }, [ensureContext]);

  const announce = useCallback((message: string) => {
    setToast(message);
    setToastVisible(true);

    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
    }, TOAST_TIMEOUT_MS);
  }, []);

  const toggle = useCallback(() => {
    setActive((current) => {
      const next = !current;

      if (next) {
        ensureContext();
        announce(ACTIVE_TOAST);
      } else {
        announce(MUTED_TOAST);
      }

      return next;
    });
  }, [announce, ensureContext]);

  /* Dual-trace oscilloscope + navigation equalizer render loop. */
  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    let cancelled = false;

    const render = () => {
      if (cancelled) {
        return;
      }

      const canvas = canvasRef.current;
      const context2d = canvas?.getContext('2d') ?? null;

      if (canvas && context2d) {
        const width = canvas.width;
        const height = canvas.height;
        const transmitting = activeRef.current;

        context2d.clearRect(0, 0, width, height);

        context2d.strokeStyle = 'rgba(203, 176, 121, 0.18)';
        context2d.lineWidth = 1;
        context2d.beginPath();
        context2d.moveTo(0, height / 2);
        context2d.lineTo(width, height / 2);
        context2d.stroke();

        phaseRef.current += transmitting ? 0.08 : 0.01;
        burstRef.current = Math.max(0, burstRef.current - 0.035);

        const phase = phaseRef.current;
        const burst = burstRef.current;

        /* Champagne carrier (#CBB079) */
        context2d.beginPath();
        context2d.lineWidth = 1.8;
        context2d.strokeStyle = transmitting ? '#CBB079' : 'rgba(153, 144, 125, 0.4)';
        context2d.shadowColor = transmitting ? '#CBB079' : 'transparent';
        context2d.shadowBlur = transmitting ? 4 : 0;

        for (let x = 0; x < width; x += 1) {
          const normX = x / width;
          const amplitude = transmitting ? 10 + burst * 14 : 1.5;
          const primary = Math.sin(normX * 14 + phase) * amplitude;
          const harmonic = Math.cos(normX * 28 - phase * 1.5) * (amplitude * 0.4);
          const y = height / 2 + primary + harmonic;

          if (x === 0) {
            context2d.moveTo(x, y);
          } else {
            context2d.lineTo(x, y);
          }
        }

        context2d.stroke();

        /* Champagne dim (#9A825A) secondary telemetry harmonic */
        if (transmitting) {
          context2d.beginPath();
          context2d.lineWidth = 1.2;
          context2d.strokeStyle = 'rgba(154, 130, 90, 0.75)';
          context2d.shadowColor = '#9A825A';
          context2d.shadowBlur = 3;

          for (let x = 0; x < width; x += 2) {
            const normX = x / width;
            const amplitude = 6 + burst * 9;
            const y = height / 2 + Math.sin(normX * 22 - phase * 2.2) * amplitude;

            if (x === 0) {
              context2d.moveTo(x, y);
            } else {
              context2d.lineTo(x, y);
            }
          }

          context2d.stroke();
        }

        /* Mini navigation equalizer jitter */
        const eqBars = eqBarsRef.current;

        if (eqBars && transmitting) {
          const bars = eqBars.querySelectorAll('span');

          bars.forEach((bar, index) => {
            const wave = Math.sin(phase * 2 + index) * 5;
            const next = 4 + Math.floor(wave + 5 + burst * 6);
            bar.style.height = `${Math.min(14, Math.max(3, next))}px`;
          });
        }
      }

      frameRef.current = window.requestAnimationFrame(render);
    };

    frameRef.current = window.requestAnimationFrame(render);

    return () => {
      cancelled = true;

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [reducedMotion]);

  /* Tactile mechanical key feedback on every control, as in the export. */
  useEffect(() => {
    const onControlClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest('button, a[href], input, select, textarea, [role="tab"], [role="button"]')) {
        tactile();
      }
    };

    document.addEventListener('click', onControlClick);

    return () => document.removeEventListener('click', onControlClick);
  }, [tactile]);

  /* Release the audio graph on unmount. */
  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }

      void contextRef.current?.close();
      contextRef.current = null;
      masterRef.current = null;
    },
    [],
  );

  return {
    active,
    toggle,
    chirp,
    datalink,
    canvasRef,
    eqBarsRef,
    toast,
    toastVisible,
  };
}
