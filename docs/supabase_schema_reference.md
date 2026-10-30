# Supabase Schema Reference — PJP-Cloud (jjsctuwfghabkwvfldqg)

Generated from live database introspection (public schema).

## Overview
- **Project:** PJP-Cloud (ACTIVE_HEALTHY), region us-east-2, Postgres 17.6
- **Public tables:** 68
- **Foreign keys:** 84
- **Custom enums:** 8 (admin_role_type, app_status, job_status, reservation_status, sim_bay_status, training_type, user_role)
- **Functions:** 21 (incl. triggers)
- **RLS policies:** 153 (public schema)
- **Storage buckets:** 9

## Public Tables
acquisition_inquiries, admin_roles, admin_users, aircraft_listings, aircraft_media, aog_applications, aog_missions, applications, ato_sim_bays, audit_logs, audit_logs_v2, cfa_gallery, cfa_menus, charter_bookings, charter_missions, chat_messages, chat_threads, community_comments, community_posts, concierge_requests, concierge_vehicles, crew_expenses, crew_layovers, crew_logbook, duty_logs, empty_legs, escrow_transactions, fa_duty_logs, fbo_dispatch_briefs, fbo_fuel_slips, fbo_ramp_requests, fbo_ramp_reservations, fbo_service_orders, fbo_stations, fleet, fleet_live_positions, fleet_mel_deferrals, fleet_telemetry_records, flight_logs, flight_releases, inflight_catering_orders, jobs, jumpseat_bookings, kyc_documents, lounge_content, marketplace_listings, mission_telemetry_logs, missions, notifications, offline_sync_outbox, permissions, pilot_credentials, pilot_documents, pilot_dossiers, pilot_duty_logs, pilot_push_tokens, pilot_trainings, profile_views, profiles, push_campaigns, push_dispatch_logs, push_tokens, role_permissions, sim_reservations, training_applications, training_courses, training_institutions, vip_passengers

## Key Models

### profiles
- id (uuid, PK, FK → auth.users.id)

### pilot_credentials
- id (uuid, PK)
- user_id (uuid, FK → auth.users.id)
- verified_by (uuid, FK → admin_users.id)

### pilots / auth
- user_role enum: pilot, operator, recruiter, admin, flight_attendant, fbo, aviation_school, jet_owner, academy

## Custom Enums
- admin_role_type: super_admin, operations_admin, verification_admin, support_admin, finance_admin
- app_status: pending, reviewed, shortlisted, rejected, accepted, contacted, declined
- job_status: open, filled, cancelled, expired
- reservation_status: pending_escrow, confirmed, completed, cancelled
- sim_bay_status: operational, maintenance, offline
- training_type: recurrent_check, initial_type_rating, uprt_tactical, dpe_checkride
- user_role: pilot, operator, recruiter, admin, flight_attendant, fbo, aviation_school, jet_owner, academy

## Functions (public)
book_sim_bay_slot, broadcast_aog_emergency_push, cancel_charter_escrow_booking, claim_aog_mission, create_charter_escrow_booking, delete_user_account, enforce_institution_course_limit, get_admin_user_directory, get_pilot_aog_alerts, get_pilot_credential_dossier, get_pilot_far_currency, get_pilot_telemetry, handle_new_user, has_admin_role, is_admin, notify_pilot_on_unicom_status_change, prevent_audit_log_modification, protect_last_super_admin, sync_offline_flight_logs, update_fbo_dispatch_timestamp

## Foreign Keys (summary)
84 FK constraints; notable:
- profiles.id → auth.users.id
- pilot_credentials.user_id → auth.users.id; verified_by → admin_users.id
- missions: aircraft_id→fleet, employer_id→profiles, pilot_id→profiles
- charter_missions: aircraft_id→aircraft_listings, operator_id→users, moderated_by→admin_users
- applications: pilot_id→profiles, job_id→jobs
- training_courses.institution_id→training_institutions; training_institutions.user_id→users
- vip_passengers: employer_id→users, user_id→users
- profile_views: viewer_id→profiles, profile_id→profiles

## RLS Policies
153 policies across public tables. Common patterns:
- Public SELECT on listings/courses/institutions
- Owner-scoped ALL/SELECT/UPDATE (auth.uid() = user_id / pilot_id)
- Admin ALL via is_admin()/has_admin_role()
- Universal authenticated access on several tables (training_*, etc.)

## Storage Buckets
- aircraft-documents (public)
- aircraft-media (public)
- avatars (public)
- cfa-portfolio (public)
- community_media (public)
- compliance-vault (public)
- crew-receipts (private)
- kyc_vault (private)
- pilot-vault (private)

## Auth Providers
Configured via Supabase Auth (email/password + OAuth providers per project settings); storage of identities in auth.identities.

## Notes
- Full per-column dump (1006 columns) captured during introspection; rerun SUPABASE_RUN_READ_ONLY_QUERY against information_schema.columns for authoritative detail.
- Zero RLS gaps should be verified per-table before production use.
