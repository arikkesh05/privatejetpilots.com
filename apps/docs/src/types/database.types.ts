export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          certificate_grade: string | null;
          certificate_number: string | null;
          medical_class: string | null;
          avatar_url: string | null;
          primary_base: string | null;
          type_ratings: string[] | null;
          is_verified: boolean | null;
          total_flight_hours: number | null;
          pic_hours: number | null;
          turbine_hours: number | null;
          night_hours: number | null;
          instrument_hours: number | null;
          account_status: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          certificate_grade?: string | null;
          certificate_number?: string | null;
          medical_class?: string | null;
          avatar_url?: string | null;
          primary_base?: string | null;
          type_ratings?: string[] | null;
          is_verified?: boolean | null;
          total_flight_hours?: number | null;
          pic_hours?: number | null;
          turbine_hours?: number | null;
          night_hours?: number | null;
          instrument_hours?: number | null;
          account_status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          certificate_grade?: string | null;
          certificate_number?: string | null;
          medical_class?: string | null;
          avatar_url?: string | null;
          primary_base?: string | null;
          type_ratings?: string[] | null;
          is_verified?: boolean | null;
          total_flight_hours?: number | null;
          pic_hours?: number | null;
          turbine_hours?: number | null;
          night_hours?: number | null;
          instrument_hours?: number | null;
          account_status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}