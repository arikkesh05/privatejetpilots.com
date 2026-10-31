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
          updated_at: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: string | null;
          bio: string | null;
          location: string | null;
          license_type: string | null;
          total_hours: number | null;
          aircraft_types: string[] | null;
          is_verified: boolean | null;
          primary_base: string | null;
          availability: string | null;
          total_flight_hours: number | null;
          push_token: string | null;
          subscription_tier: string | null;
          company_name: string | null;
          argus_rating: string | null;
          wyvern_rating: string | null;
          is_bao_stage: string | null;
          total_aircraft: number | null;
          total_crew: number | null;
          founded_year: number | null;
          primary_vectors: string | null;
          rotation_policy: string | null;
          training_bond_policy: string | null;
          benefits_summary: string | null;
          public_fleet_composition: string[] | null;
          operation_type: string[] | null;
          notification_preferences: Json | null;
          kyc_status: string | null;
          onboarding_completed: boolean | null;
          email: string | null;
          phone: string | null;
          languages: string[] | null;
          type_ratings: string[] | null;
          service_credentials: string[] | null;
          cabin_fleet: string[] | null;
          phone_country_code: string | null;
          night_hours: number | null;
          instrument_hours: number | null;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      pilot_credentials: {
        Row: {
          id: string;
          user_id: string;
          certificate_type: string;
          certificate_number: string;
          ratings: Json;
          type_ratings: Json;
          medical_class: string;
          medical_issued_date: string;
          medical_expiry_date: string;
          total_flight_hours: number;
          pic_hours: number;
          turbine_hours: number;
          document_url: string | null;
          verification_status: string;
          rejection_reason: string | null;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['pilot_credentials']['Row']> & { user_id: string; certificate_type: string; certificate_number: string };
        Update: Partial<Database['public']['Tables']['pilot_credentials']['Row']>;
        Relationships: [];
      };
      fleet_live_positions: {
        Row: {
          id: string;
          tail_number: string;
          aircraft_type: string;
          operator_name: string | null;
          departure_icao: string;
          arrival_icao: string;
          latitude: number;
          longitude: number;
          altitude_ft: number | null;
          ground_speed_kts: number | null;
          heading_deg: number | null;
          vertical_speed_fpm: number | null;
          squawk: string | null;
          status: string | null;
          eta: string | null;
          flight_plan: Json | null;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['fleet_live_positions']['Row']> & { tail_number: string; aircraft_type: string; departure_icao: string; arrival_icao: string; latitude: number; longitude: number };
        Update: Partial<Database['public']['Tables']['fleet_live_positions']['Row']>;
        Relationships: [];
      };
      fbo_stations: {
        Row: {
          id: string;
          icao_code: string;
          station_name: string;
          tier_level: string;
          is_bah_stage: string | null;
          is_bah_expiry: string | null;
          jet_a_available: boolean;
          avgas_available: boolean;
          customs_on_field: boolean;
          verification_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['fbo_stations']['Row']> & { icao_code: string; station_name: string };
        Update: Partial<Database['public']['Tables']['fbo_stations']['Row']>;
        Relationships: [];
      };
      fbo_ramp_reservations: {
        Row: {
          id: string;
          fbo_id: string | null;
          tail_number: string;
          aircraft_type: string;
          operator_name: string | null;
          origin_icao: string;
          eta: string;
          etd: string | null;
          pax_count: number | null;
          assigned_spot: string | null;
          status: string | null;
          fuel_requested_gal: number | null;
          gpu_requested: boolean | null;
          lav_requested: boolean | null;
          potable_water_requested: boolean | null;
          planeside_car_pass: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['fbo_ramp_reservations']['Row']> & { tail_number: string; aircraft_type: string; origin_icao: string; eta: string };
        Update: Partial<Database['public']['Tables']['fbo_ramp_reservations']['Row']>;
        Relationships: [];
      };
      crew_layovers: {
        Row: {
          id: string;
          mission_id: string;
          location: string;
          arrival: string;
          departure: string;
          nights: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['crew_layovers']['Row']> & { mission_id: string; location: string; arrival: string; departure: string };
        Update: Partial<Database['public']['Tables']['crew_layovers']['Row']>;
        Relationships: [];
      };

      crew_logbook: {
        Row: {
          id: string;
          pilot_id: string;
          aircraft_type: string;
          flight_date: string;
          hours: number;
          description: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['crew_logbook']['Row']> & { pilot_id: string; aircraft_type: string; flight_date: string; hours: number };
        Update: Partial<Database['public']['Tables']['crew_logbook']['Row']>;
        Relationships: [];
      };

      duty_logs: {
        Row: {
          id: string;
          pilot_id: string;
          duty_start: string;
          duty_end: string | null;
          flight_hours: number | null;
          status: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['duty_logs']['Row']> & { pilot_id: string; duty_start: string };
        Update: Partial<Database['public']['Tables']['duty_logs']['Row']>;
        Relationships: [];
      };

      empty_legs: {
        Row: {
          id: string;
          origin: string;
          destination: string;
          departure: string;
          arrival: string;
          aircraft_type: string;
          capacity: number;
          price: number;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['empty_legs']['Row']> & { origin: string; destination: string; departure: string; arrival: string; aircraft_type: string; capacity: number; price: number };
        Update: Partial<Database['public']['Tables']['empty_legs']['Row']>;
        Relationships: [];
      };

      escrow_transactions: {
        Row: {
          id: string;
          order_id: string;
          amount: number;
          currency: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['escrow_transactions']['Row']> & { order_id: string; amount: number };
        Update: Partial<Database['public']['Tables']['escrow_transactions']['Row']>;
        Relationships: [];
      };

      fa_duty_logs: {
        Row: {
          id: string;
          pilot_id: string;
          duty_start: string;
          duty_end: string | null;
          flight_hours: number | null;
          status: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['fa_duty_logs']['Row']> & { pilot_id: string; duty_start: string };
        Update: Partial<Database['public']['Tables']['fa_duty_logs']['Row']>;
        Relationships: [];
      };

      community_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['community_comments']['Row']> & { post_id: string; user_id: string; content: string };
        Update: Partial<Database['public']['Tables']['community_comments']['Row']>;
        Relationships: [];
      };

      community_posts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          tags: string[] | null;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['community_posts']['Row']> & { user_id: string; title: string; content: string; comments_count: number };
        Update: Partial<Database['public']['Tables']['community_posts']['Row']>;
        Relationships: [];
      };

      concierge_requests: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['concierge_requests']['Row']> & { user_id: string; title: string };
        Update: Partial<Database['public']['Tables']['concierge_requests']['Row']>;
        Relationships: [];
      };

      concierge_vehicles: {
        Row: {
          id: string;
          request_id: string;
          vehicle_type: string;
          license_plate: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['concierge_vehicles']['Row']> & { request_id: string; vehicle_type: string; license_plate: string };
        Update: Partial<Database['public']['Tables']['concierge_vehicles']['Row']>;
        Relationships: [];
      };

      crew_expenses: {
        Row: {
          id: string;
          mission_id: string;
          userId: string;
          category: string;
          amount: number;
          currency: string;
          description: string | null;
          receiptUrl: string | null;
          isPerDiemAccrual: boolean;
          loggedAt: string;
          status: string;
        };
        Insert: Partial<Database['public']['Tables']['crew_expenses']['Row']> & { mission_id: string; userId: string; category: string; amount: number; currency: string };
        Update: Partial<Database['public']['Tables']['crew_expenses']['Row']>;
        Relationships: [];
      };

      applications: {
        Row: {
          id: string;
          job_id: string;
          applicant_name: string;
          applicant_id: string;
          applicant_total_hours: number;
          applicant_pic_hours: number;
          match_status: string;
          attached_documents: string[] | null;
          cover_note: string | null;
          applied_at: string;
          status: string;
        };
        Insert: Partial<Database['public']['Tables']['applications']['Row']> & { job_id: string; applicant_name: string; applicant_id: string; applicant_total_hours: number; applicant_pic_hours: number; match_status: string; applied_at: string };
        Update: Partial<Database['public']['Tables']['applications']['Row']>;
        Relationships: [];
      };

      ato_sim_bays: {
        Row: {
          id: string;
          name: string;
          location: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['ato_sim_bays']['Row']>;
        Update: Partial<Database['public']['Tables']['ato_sim_bays']['Row']>;
        Relationships: [];
      };

      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['audit_logs']['Row']> & { user_id: string; action: string; resource: string };
        Update: Partial<Database['public']['Tables']['audit_logs']['Row']>;
        Relationships: [];
      };

      audit_logs_v2: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['audit_logs_v2']['Row']> & { user_id: string; action: string; resource: string };
        Update: Partial<Database['public']['Tables']['audit_logs_v2']['Row']>;
        Relationships: [];
      };

      cfa_gallery: {
        Row: {
          id: string;
          title: string;
          image_url: string;
          category: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['cfa_gallery']['Row']> & { title: string; image_url: string; category: string };
        Update: Partial<Database['public']['Tables']['cfa_gallery']['Row']>;
        Relationships: [];
      };

      cfa_menus: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          category: string;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['cfa_menus']['Row']> & { name: string; price: number; category: string; is_available: boolean };
        Update: Partial<Database['public']['Tables']['cfa_menus']['Row']>;
        Relationships: [];
      };

      charter_bookings: {
        Row: {
          id: string;
          pilot_id: string;
          aircraft_id: string | null;
          charter_details: Json;
          total_price: number;
          status: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['charter_bookings']['Row']> & { pilot_id: string; total_price: number };
        Update: Partial<Database['public']['Tables']['charter_bookings']['Row']>;
        Relationships: [];
      };

      charter_missions: {
        Row: {
          id: string;
          aircraft_id: string | null;
          origin: string;
          destination: string;
          departure: string;
          arrival: string;
          cabin_config: Json | null;
          status: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['charter_missions']['Row']> & { origin: string; destination: string; departure: string; arrival: string };
        Update: Partial<Database['public']['Tables']['charter_missions']['Row']>;
        Relationships: [];
      };

      chat_messages: {
        Row: {
          id: string;
          thread_id: string;
          user_id: string;
          message: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['chat_messages']['Row']> & { thread_id: string; user_id: string; message: string };
        Update: Partial<Database['public']['Tables']['chat_messages']['Row']>;
        Relationships: [];
      };

      chat_threads: {
        Row: {
          id: string;
          participant_ids: string[];
          last_message: string | null;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['chat_threads']['Row']>;
        Update: Partial<Database['public']['Tables']['chat_threads']['Row']>;
        Relationships: [];
      };

      acquisition_inquiries: {
        Row: {
          id: string;
          listing_id: string | null;
          buyer_id: string | null;
          offer_price_usd: number;
          escrow_deposit_usd: number;
          target_closing_date: string | null;
          pipeline_stage: string | null;
          buyer_notes: string | null;
          escrow_agent: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['acquisition_inquiries']['Row']> & { listing_id: string; buyer_id: string; offer_price_usd: number; escrow_deposit_usd: number };
        Update: Partial<Database['public']['Tables']['acquisition_inquiries']['Row']>;
        Relationships: [];
      };

      admin_roles: {
        Row: {
          id: string;
          name: string;
          description: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['admin_roles']['Row']>;
        Update: Partial<Database['public']['Tables']['admin_roles']['Row']>;
        Relationships: [];
      };

      admin_users: {
        Row: {
          id: string;
          email: string;
          role: string;
          is_active: boolean;
          mfa_enforced: boolean;
          invited_by: string | null;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['admin_users']['Row']> & { email: string; role: string; is_active: boolean; mfa_enforced: boolean };
        Update: Partial<Database['public']['Tables']['admin_users']['Row']>;
        Relationships: [];
      };

      aircraft_listings: {
        Row: {
          id: string;
          broker_id: string | null;
          transaction_type: string | null;
          make: string;
          model: string;
          year: number;
          serial_number: string | null;
          registration: string | null;
          asking_price: number | null;
          total_time: number;
          total_landings: number | null;
          home_base: string | null;
          engine_program: string | null;
          pax_capacity: number | null;
          status: string;
          is_stealth_listing: boolean;
          description: string | null;
          detailed_specs: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['aircraft_listings']['Row']> & { broker_id: string; make: string; model: string; year: number; total_time: number; status: string; is_stealth_listing: boolean };
        Update: Partial<Database['public']['Tables']['aircraft_listings']['Row']>;
        Relationships: [];
      };

      aircraft_media: {
        Row: {
          id: string;
          listing_id: string;
          media_type: 'image' | 'video' | 'matterport_3d';
          url: string;
          is_hero_image: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['aircraft_media']['Row']> & { listing_id: string; media_type: 'image' | 'video' | 'matterport_3d'; url: string; is_hero_image: boolean; display_order: number };
        Update: Partial<Database['public']['Tables']['aircraft_media']['Row']>;
        Relationships: [];
      };

      aog_applications: {
        Row: {
          id: string;
          pilot_id: string;
          mission_id: string | null;
          asset_type: string | null;
          urgency: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['aog_applications']['Row']> & { pilot_id: string };
        Update: Partial<Database['public']['Tables']['aog_applications']['Row']>;
        Relationships: [];
      };

      aog_missions: {
        Row: {
          id: string;
          asset_type: string;
          origin: string;
          destination: string;
          departure: string;
          arrival: string;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['aog_missions']['Row']> & { asset_type: string; origin: string; destination: string; departure: string; arrival: string };
        Update: Partial<Database['public']['Tables']['aog_missions']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
