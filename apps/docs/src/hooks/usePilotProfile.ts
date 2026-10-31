import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PilotCredential, DEFAULT_PILOT_SPECIMEN } from '../types/credential';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type PilotCredentialRow = Database['public']['Tables']['pilot_credentials']['Row'];

const DEFAULT_PILOT_UUID = 'eb90e6e9-88d0-4b2e-ad0a-1e4011a839ab';

export function usePilotProfile(explicitPilotId?: string) {
  const { user, isGuestMode } = useAuth();
  const [profile, setProfile] = useState<PilotCredential | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPilot = useCallback(async (isMounted: () => boolean) => {
    try {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured || (isGuestMode && !explicitPilotId)) {
        if (isMounted()) {
          setProfile(DEFAULT_PILOT_SPECIMEN);
          setLoading(false);
        }
        return;
      }

      // 1. Target ID resolution: Explicit ID -> Authenticated session user -> Specimen fallback
      const targetId = explicitPilotId || user?.id || DEFAULT_PILOT_UUID;

      // 2. Query profiles and pilot_credentials in parallel
      const [profileRes, credsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', targetId)
          .maybeSingle(),
        supabase
          .from('pilot_credentials')
          .select('*')
          .eq('user_id', targetId)
          .maybeSingle(),
      ]);

      if (profileRes.error) {
        console.warn('[usePilotProfile] Profile lookup warning:', profileRes.error.message);
      }

      const profileData = profileRes.data as ProfileRow | null;
      const credsData = credsRes.data as PilotCredentialRow | null;

      if (profileData && isMounted()) {
        let resolvedTypeRatings: string[] = DEFAULT_PILOT_SPECIMEN.typeRatings;
        if (Array.isArray(credsData?.type_ratings) && credsData.type_ratings.length > 0) {
          resolvedTypeRatings = credsData.type_ratings as string[];
        } else if (Array.isArray(profileData.type_ratings) && profileData.type_ratings.length > 0) {
          resolvedTypeRatings = profileData.type_ratings;
        }

        const certType = credsData?.certificate_type || profileData.license_type || 'AIRLINE TRANSPORT PILOT';
        const certNumber = credsData?.certificate_number || DEFAULT_PILOT_SPECIMEN.faaCert;
        const medClass = credsData?.medical_class || DEFAULT_PILOT_SPECIMEN.medicalClass;

        const mappedProfile: PilotCredential = {
          id: profileData.id,
          name: profileData.full_name || DEFAULT_PILOT_SPECIMEN.name,
          role: `${certType} // G650ER • GLOBAL 7500`,
          portraitUrl: profileData.avatar_url || DEFAULT_PILOT_SPECIMEN.portraitUrl,
          faaCert: certNumber,
          medicalClass: medClass,
          medicalStatus: credsData?.verification_status === 'verified' ? 'VALID // FIRST CLASS' : DEFAULT_PILOT_SPECIMEN.medicalStatus,
          passId: 'B-90001',
          typeRatings: resolvedTypeRatings,
          clearanceLevel: profileData.is_verified ? 'LEVEL 4 ACTIVE' : 'PENDING VERIFICATION',
          homeBaseIcao: profileData.primary_base || DEFAULT_PILOT_SPECIMEN.homeBaseIcao,
          hours: {
            total: Number(credsData?.total_flight_hours) || Number(profileData.total_flight_hours) || Number(profileData.total_hours) || DEFAULT_PILOT_SPECIMEN.hours.total,
            picTurbine:
              Number(credsData?.pic_hours) ||
              Number(credsData?.turbine_hours) ||
              DEFAULT_PILOT_SPECIMEN.hours.picTurbine,
            night: Number(profileData.night_hours) || DEFAULT_PILOT_SPECIMEN.hours.night,
            instrument: Number(profileData.instrument_hours) || DEFAULT_PILOT_SPECIMEN.hours.instrument,
          },
          certificateGrade: certType,
          commercialPrivileges: DEFAULT_PILOT_SPECIMEN.commercialPrivileges,
          isActive: profileData.is_verified ?? true,
        };

        setProfile(mappedProfile);
      } else if (isMounted()) {
        setProfile(DEFAULT_PILOT_SPECIMEN);
      }
    } catch (err: any) {
      if (isMounted()) {
        console.error('[usePilotProfile] Error fetching pilot profile:', err);
        setError(err?.message || 'Failed to fetch profile');
        setProfile(DEFAULT_PILOT_SPECIMEN);
      }
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
    }
  }, [explicitPilotId, user?.id, isGuestMode]);

  useEffect(() => {
    let mounted = true;
    void fetchPilot(() => mounted);

    return () => {
      mounted = false;
    };
  }, [fetchPilot]);

  return { profile, loading, error, refetch: () => fetchPilot(() => true) };
}
