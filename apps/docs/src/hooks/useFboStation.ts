import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database } from '../types/database.types';

type FboStationRow = Database['public']['Tables']['fbo_stations']['Row'];
type FboReservationRow = Database['public']['Tables']['fbo_ramp_reservations']['Row'];

export interface FboStationDetails {
  icao: string;
  name: string;
  tier: string;
  jetAAvailable: boolean;
  customsOnField: boolean;
  status: string;
  assignedSpot: string;
  fuelRequestedGal: number;
  gpuRequested: boolean;
  reservationStatus: string;
}

const DEFAULT_STATION_SPECIMEN: FboStationDetails = {
  icao: 'KTEB',
  name: 'Signature Flight Support - Teterboro',
  tier: 'TIER 1 PREMIER',
  jetAAvailable: true,
  customsOnField: true,
  status: 'VERIFIED',
  assignedSpot: 'RAMP 4A // JETWAY WEST',
  fuelRequestedGal: 1200,
  gpuRequested: true,
  reservationStatus: 'CONFIRMED',
};

export function useFboStation(targetIcao = 'KTEB', targetTailNumber?: string) {
  const [station, setStation] = useState<FboStationDetails>(DEFAULT_STATION_SPECIMEN);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStationData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setStation(DEFAULT_STATION_SPECIMEN);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Station Details
      const { data: stationData, error: stationErr } = await supabase
        .from('fbo_stations')
        .select('*')
        .ilike('icao_code', targetIcao)
        .maybeSingle();

      if (stationErr) {
        console.warn('[useFboStation] Station query error:', stationErr.message);
      }

      // 2. Fetch Active Ramp Reservation
      let reservationQuery = supabase
        .from('fbo_ramp_reservations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (targetTailNumber) {
        reservationQuery = supabase
          .from('fbo_ramp_reservations')
          .select('*')
          .eq('tail_number', targetTailNumber)
          .limit(1);
      }

      const { data: resData, error: resErr } = await reservationQuery.maybeSingle();

      if (resErr) {
        console.warn('[useFboStation] Reservation lookup error:', resErr.message);
      }

      const currentStation = stationData as FboStationRow | null;
      const currentRes = resData as FboReservationRow | null;

      setStation({
        icao: currentStation?.icao_code || targetIcao,
        name: currentStation?.station_name || DEFAULT_STATION_SPECIMEN.name,
        tier: currentStation?.tier_level ? currentStation.tier_level.toUpperCase() : DEFAULT_STATION_SPECIMEN.tier,
        jetAAvailable: currentStation ? currentStation.jet_a_available : DEFAULT_STATION_SPECIMEN.jetAAvailable,
        customsOnField: currentStation ? currentStation.customs_on_field : DEFAULT_STATION_SPECIMEN.customsOnField,
        status: currentStation?.verification_status ? currentStation.verification_status.toUpperCase() : 'VERIFIED',
        assignedSpot: currentRes?.assigned_spot || DEFAULT_STATION_SPECIMEN.assignedSpot,
        fuelRequestedGal: Number(currentRes?.fuel_requested_gal) || DEFAULT_STATION_SPECIMEN.fuelRequestedGal,
        gpuRequested: currentRes?.gpu_requested ?? DEFAULT_STATION_SPECIMEN.gpuRequested,
        reservationStatus: currentRes?.status ? currentRes.status.toUpperCase() : DEFAULT_STATION_SPECIMEN.reservationStatus,
      });
    } catch (err: any) {
      console.error('[useFboStation] Error fetching FBO data:', err);
      setError(err?.message || 'Failed to fetch station');
      setStation(DEFAULT_STATION_SPECIMEN);
    } finally {
      setLoading(false);
    }
  }, [targetIcao, targetTailNumber]);

  useEffect(() => {
    void fetchStationData();
  }, [fetchStationData]);

  return { station, loading, error, refresh: fetchStationData };
}