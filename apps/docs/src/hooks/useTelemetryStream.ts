import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database } from '../types/database.types';

type FleetLivePosition = Database['public']['Tables']['fleet_live_positions']['Row'];

/**
 * Live cockpit telemetry stream (10 Hz deck, 1.8 s sampling cadence in the deck UI).
 *
 * Connected to live Supabase `fleet_live_positions` table with real-time stream subscription
 * and graceful fallback to avionics jitter when offline or unconfigured.
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
  /** Active airframe tail number if streamed from Supabase. */
  readonly tailNumber?: string;
  /** Active flight status (e.g., 'en_route', 'climbing'). */
  readonly status?: string;
}

const SAMPLE_INTERVAL_MS = 1800;
const BASE_CABIN_ALT_FT = 2840;
const BASE_GROUNDSPEED_KTS = 540;
const BASE_BROADBAND_MBPS = 450;
const BASE_TAILWIND_KTS = 68;

function jitter(spread: number): number {
  return Math.floor(Math.random() * spread) - Math.floor(spread / 2);
}

export function useTelemetryStream(reducedMotion: boolean, targetTailNumber?: string): TelemetryStream {
  const [stream, setStream] = useState<TelemetryStream>({
    cabinAlt: '2,838 FT',
    broadband: '450 Mbps',
    groundspeed: '540',
    tailwind: '+67 KTS JETSTREAM',
    status: 'en_route',
  });

  // 1. Live Supabase Realtime Telemetry Subscription
  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let isMounted = true;

    async function fetchInitialPosition() {
      try {
        let query = supabase
          .from('fleet_live_positions')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (targetTailNumber) {
          query = supabase
            .from('fleet_live_positions')
            .select('*')
            .eq('tail_number', targetTailNumber)
            .limit(1);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          console.warn('[Telemetry] Error fetching live telemetry record:', error.message);
          return;
        }

        if (data && isMounted) {
          const row = data as FleetLivePosition;
          setStream((prev) => ({
            ...prev,
            groundspeed: row.ground_speed_kts ? `${row.ground_speed_kts}` : prev.groundspeed,
            tailNumber: row.tail_number,
            status: row.status ?? prev.status,
          }));
        }
      } catch (err) {
        console.warn('[Telemetry] Unexpected fetch error:', err);
      }
    }

    void fetchInitialPosition();

    // Setup Supabase Realtime channel for fleet_live_positions
    const channel = supabase
      .channel('fleet_live_telemetry_stream')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fleet_live_positions',
        },
        (payload) => {
          if (!isMounted) return;
          const newRecord = payload.new as FleetLivePosition;
          if (!newRecord) return;

          if (targetTailNumber && newRecord.tail_number !== targetTailNumber) {
            return;
          }

          setStream((prev) => ({
            ...prev,
            groundspeed: newRecord.ground_speed_kts ? `${newRecord.ground_speed_kts}` : prev.groundspeed,
            tailNumber: newRecord.tail_number ?? prev.tailNumber,
            status: newRecord.status ?? prev.status,
          }));
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [targetTailNumber]);

  // 2. Synthetic Avionics Tick (Micro-jitter for cabin altitude and Ka-band mesh)
  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const tick = window.setInterval(() => {
      setStream((current) => ({
        ...current,
        cabinAlt: `${(BASE_CABIN_ALT_FT + jitter(9)).toLocaleString()} FT`,
        broadband: Math.random() > 0.6 ? `${BASE_BROADBAND_MBPS + jitter(7)} Mbps` : current.broadband,
        groundspeed: current.tailNumber
          ? current.groundspeed
          : Math.random() > 0.4
          ? `${BASE_GROUNDSPEED_KTS + jitter(5)}`
          : current.groundspeed,
        tailwind: Math.random() > 0.7 ? `+${BASE_TAILWIND_KTS + jitter(3)} KTS JETSTREAM` : current.tailwind,
      }));
    }, SAMPLE_INTERVAL_MS);

    return () => window.clearInterval(tick);
  }, [reducedMotion]);

  return stream;
}