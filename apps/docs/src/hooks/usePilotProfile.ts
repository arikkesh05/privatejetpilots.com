import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PilotCredential, DEFAULT_PILOT_SPECIMEN } from '../types/credential';

const DEFAULT_PILOT_UUID = 'eb90e6e9-88d0-4b2e-ad0a-1e4011a839ab';

export function usePilotProfile(explicitPilotId?: string) {
  const [profile, setProfile] = useState<PilotCredential | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPilot() {
      try {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured) {
          if (isMounted) {
            setProfile(DEFAULT_PILOT_SPECIMEN);
          }
          return;
        }

        // 1. Resolve target ID: Explicit prop -> Authenticated user -> Specimen fallback
        let targetId = explicitPilotId;

        if (!targetId) {
          const { data: { user } } = await supabase.auth.getUser();
          targetId = user?.id || DEFAULT_PILOT_UUID;
        }

        // 2. Fetch profile from Supabase
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data && isMounted) {
          const mappedProfile: PilotCredential = {
            id: data.id,
            name: data.full_name || DEFAULT_PILOT_SPECIMEN.name,
            role: data.certificate_grade 
              ? `${data.certificate_grade} // G650ER • GLOBAL 7500` 
              : DEFAULT_PILOT_SPECIMEN.role,
            portraitUrl: data.avatar_url || DEFAULT_PILOT_SPECIMEN.portraitUrl,
            faaCert: data.certificate_number || DEFAULT_PILOT_SPECIMEN.faaCert,
            medicalClass: data.medical_class || DEFAULT_PILOT_SPECIMEN.medicalClass,
            medicalStatus: DEFAULT_PILOT_SPECIMEN.medicalStatus,
            passId: 'B-90001',
            typeRatings: Array.isArray(data.type_ratings) && data.type_ratings.length > 0
              ? data.type_ratings
              : DEFAULT_PILOT_SPECIMEN.typeRatings,
            clearanceLevel: data.is_verified ? 'LEVEL 4 ACTIVE' : 'PENDING VERIFICATION',
            homeBaseIcao: data.primary_base || DEFAULT_PILOT_SPECIMEN.homeBaseIcao,
            hours: {
              total: Number(data.total_flight_hours) || DEFAULT_PILOT_SPECIMEN.hours.total,
              picTurbine: Number(data.pic_hours) || Number(data.turbine_hours) || DEFAULT_PILOT_SPECIMEN.hours.picTurbine,
              night: Number(data.night_hours) || DEFAULT_PILOT_SPECIMEN.hours.night,
              instrument: Number(data.instrument_hours) || DEFAULT_PILOT_SPECIMEN.hours.instrument,
            },
            certificateGrade: data.certificate_grade || DEFAULT_PILOT_SPECIMEN.certificateGrade,
            commercialPrivileges: DEFAULT_PILOT_SPECIMEN.commercialPrivileges,
            isActive: data.account_status === 'active' || Boolean(data.is_verified),
          };

          setProfile(mappedProfile);
        } else if (isMounted) {
          setProfile(DEFAULT_PILOT_SPECIMEN);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error fetching pilot profile from Supabase:', err);
          setError(err.message || 'Failed to fetch profile');
          setProfile(DEFAULT_PILOT_SPECIMEN);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPilot();

    return () => {
      isMounted = false;
    };
  }, [explicitPilotId]);

  return { profile, loading, error };
}