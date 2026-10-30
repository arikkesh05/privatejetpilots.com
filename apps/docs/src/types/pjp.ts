// User Roles
export type UserRole =
  | "pilot"
  | "flight_attendant"
  | "recruiter"
  | "operator"
  | "fbo"
  | "aviation_school"
  | "academy"
  | "jet_owner";

export const USER_ROLES: Record<UserRole, string> = {
  pilot: "Pilot",
  flight_attendant: "Flight Attendant",
  recruiter: "Recruiter",
  operator: "Operator",
  fbo: "FBO",
  aviation_school: "Aviation School",
  academy: "Flight Academy / ATO",
  jet_owner: "Jet Owner",
};

// User Types
export interface User {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  profile: Profile;
  isVerified: boolean;
  subscriptionTier: "free" | "pilot_pro" | "operator_pro" | "pro" | "charter" | "premium" | "enterprise";
  createdAt: string;
  updatedAt: string;
  /** FBO brand crest mirrored from the Corporate Identity hub on save */
  profile_image?: string;
  /** Alias mirror of the crest for cross-screen resolution */
  logo_url?: string;
  /** Session-level convenience mirror of profiles.avatar_url */
  avatar_url?: string;
}

export interface Profile {
  id: string;
  userId: string;
  full_name?: string;
  firstName?: string;    
  lastName?: string;     
  displayName?: string;  
  avatar_url?: string;
  avatar?: string;       
  role?: UserRole;
  bio?: string;
  location?: Location;
  aircraftTypes?: string[];
  totalFlightHours?: number;
  licenses?: Document[];
  certifications?: Document[];
  medicals?: Document[];
  documents?: Document[];
  availability?: AvailabilityStatus; 
  profileViews?: number;
  recruiterInteractions?: number;
  jobSuccessRate?: number;
  matchScore?: number;
  connections?: string[];
  reputationScore?: number;

  // snake_case fields mirrored from the Supabase `profiles` row
  total_hours?: number;
  day_rate?: number;
  contract_rate?: number;
  night_hours?: number;
  primary_base?: string | null;
  company_name?: string;
  legal_name?: string;
  kyc_status?: string;
  is_verified?: boolean;
  argus_rating?: string | null;
  wyvern_rating?: string | null;
  is_bao_stage?: boolean;
  total_aircraft?: number;
  total_crew?: number;
  founded_year?: number | null;
  primary_vectors?: string[];
  rotation_policy?: string;
  training_bond_policy?: string;
  benefits_summary?: string;
  public_fleet_composition?: string[];
  operation_type?: string;
}

export type AvailabilityStatus = "available" | "unavailable" | "on_contract";

export interface Document {
  id: string;
  type: "license" | "certification" | "medical" | "resume" | "other";
  name: string;
  url: string;
  uploadedAt: string;
  verified: boolean;
  expiryDate?: string;
}

// Job Types
export interface Job {
  id: string;
  title: string;
  company: string;
  companyId: string;
  description: string;
  type?: string; 
  aircraftType?: string;
  location: Location;
  salary: {
    min: number;
    max: number;
    currency: string;
    period: "hourly" | "monthly" | "yearly" | "contract" | "day_rate";
  };
  requirements: string[];
  jobType: "full_time" | "part_time" | "contract" | "urgent";
  experienceLevel: "entry" | "intermediate" | "expert";
  postedBy: string;
  matchScore?: number;
  isFeatured: boolean;
  // snake_case aliases mirrored from the Supabase table (screens read these)
  aircraft_type?: string;
  is_stealth?: boolean;
  is_featured?: boolean;
  status: "active" | "closed" | "filled";
  createdAt: string;
  expiresAt: string;
  applications: JobApplication[];

  operationRule?: "part_91" | "part_135" | "part_91k";
  baseLocation?: string; 
  scheduleType?: "rotational" | "home_based" | "assigned_days";
  requiredTypeRating?: string;
  minTotalTime?: number; 
  minPicTime?: number; 
  requiredMedical?: "1st_class" | "2nd_class" | "3rd_class";
  dayRate?: number;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
}

export interface JobApplication {
  id: string;
  jobId: string;
  job_id?: string; 
  applicantId: string;
  status: "applied" | "shortlisted" | "rejected" | "hired" | "pending" | "contacted" | "declined" | "accepted"; 
  appliedAt: string;
  created_at?: string; 
  updatedAt: string;
  priority?: boolean;
  serviceCommission?: number;
}

// Location
export interface Location {
  city: string;
  state?: string;
  country: string;
  airport?: string;
  icao?: string;
  airportName?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Networking
export interface Connection {
  id: string;
  userId: string;
  connectedAt: string;
  mutualConnections: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments?: string[];
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

// Community Feed
export interface Post {
  id: string;
  authorId: string;
  author: User;
  content: string;
  images?: string[];
  type: "text" | "image" | "poll" | "article";
  likes: string[];
  comments: Comment[];
  shares: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

// Training
export interface Course {
  id: string;
  title: string;
  provider: string;
  description: string;
  category: "type_rating" | "certification" | "coaching" | "other";
  price: number;
  currency: string;
  duration: string;
  rating: number;
  enrolled: number;
  imageUrl?: string;
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  type:
    | "job_match"
    | "urgent_hiring"
    | "message"
    | "profile_view"
    | "application_update"
    | "connection_request";
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

// Dashboard Analytics
export interface PilotDashboard {
  profileViews: number;
  jobMatchRate: number;
  applicationSuccessRate: number;
  recruiterInterest: number;
  recommendedJobs: Job[];
}

// Flight Logbook / Cabin Crew Types
export interface FACabinLog {
  id: string;
  user_id: string;
  tail_number: string;
  aircraft_type: string;
  departure_icao: string;
  arrival_icao: string;
  duty_start: string;
  duty_end: string;
  ground_prep_minutes: number;
  catering_fbo: string;
  catering_perf: string;
  rest_received_hours: number;
  crew_notes: string;
  passenger_ids: string[]; 
  created_at: string;

  // ✈️ Duty Tracking Milestone State
  duty_status: 'SCHEDULED' | 'GROUND_PREP' | 'IN_FLIGHT' | 'DEBRIEF' | 'COMPLETED';
  
  // 🛰️ Local-First Sync Matrix Failsafes
  sync_pending?: boolean;
  last_offline_update?: string;

  // 🛠️ Erroneous Briefing Entry Modification Fields
  correction_requested?: boolean;
  correction_notes?: string;
}

export interface RecruiterDashboard {
  activeJobs: number;
  candidatePipeline: number;
  hiringAnalytics: {
    totalHires: number;
    averageTimeToHire: number;
    successRate: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface ProfileForm {
  full_name: string;
  bio?: string;
  aircraftTypes?: string[];
  totalFlightHours?: number;
  location?: Location;
}

// Flight Logbook Types
export type FlightType =
  | "private"
  | "charter"
  | "cargo"
  | "ferry"
  | "training"
  | "medical"
  | "vip";

export type TimeOfDay = "day" | "night" | "dusk" | "dawn";

export type LandingType = "full_stop" | "touch_and_go";

export interface AirportRef {
  icao: string;
  iata: string;
  name: string;
  city: string;
  state?: string;
  country: string;
}

export interface FlightLogEntry {
  id: string;
  date: string; 
  aircraftType: string;
  registration: string; 
  flightType: FlightType;
  departure: AirportRef;
  arrival: AirportRef;
  wheelsUp: string; 
  wheelsDown: string; 
  flightDuration: number; 
  picTime: number;
  sicTime?: number;
  nightTime?: number; 
  instrumentTime: number; 
  dayLandings: number;
  nightLandings: number;
  nightLandingCount?: number; 
  landings: LandingType[];
  timeOfDay: TimeOfDay;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlightLogSummary {
  totalHours: number;
  totalFlights: number;
  nightHours: number;
  instrumentHours: number;
  crossCountryHours: number;
  last90DaysLandings: number;
  medicalExpiryDate?: string;
}

// Pilot Document Vault Types
export type DocumentCategory = 
  | "license" 
  | "medical" 
  | "type_rating" 
  | "passport" 
  | "safety_cert" 
  | "insurance_cert" 
  | "visa" 
  | "other";

export type DocumentStatus = "expired" | "warning" | "valid";

export type VerificationStatus = "pending" | "verified" | "rejected";

export interface LicenseMetadata {
  certificateNumber: string;
  issuingAuthority: string;
}

export interface MedicalMetadata {
  medicalClass: string;
  ameName: string;
}

export interface TypeRatingMetadata {
  aircraftCode: string;
  checkrideDate: string;
}

export interface PassportMetadata {
  fullLegalName: string;
  passportNumber: string;
  issuingCountry: string;
}

export type DocumentMetadata =
  | LicenseMetadata
  | MedicalMetadata
  | TypeRatingMetadata
  | PassportMetadata
  | Record<string, string>;

export interface PilotDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  documentNumber?: string;
  issueDate: string; 
  expiryDate?: string | null; 
  fileUri?: string; 
  fileName?: string;
  verificationStatus?: VerificationStatus;
  notes?: string;
  metadata?: DocumentMetadata; 
  createdAt?: string;
  updatedAt?: string;
}

// Employer Portal — Application Review Types
export type MatchStatus = "qualified" | "under_minimums";

export interface Application {
  id: string;
  jobId: string;
  applicantName: string;
  applicantId: string;
  applicantTotalHours: number;
  applicantPicHours: number;
  matchStatus: MatchStatus;
  attachedDocuments: string[]; 
  coverNote?: string;
  appliedAt: string;
  status: "pending" | "contacted" | "declined" | "accepted" | "shortlisted";
}

// Jet Brokerage & Acquisitions Ecosystem Types
export interface AircraftMedia {
  id: string;
  listing_id: string;
  media_type: 'image' | 'video' | 'matterport_3d';
  url: string;
  is_hero_image: boolean;
  display_order: number;
  created_at: string;
}

export interface AircraftListing {
  id: string;
  broker_id: string;
  transaction_type?: 'sale' | 'charter'; 
  make: string;
  model: string;
  year: number;
  serial_number?: string;
  registration?: string;
  asking_price?: number | null; 
  total_time: number;
  total_landings?: number;
  home_base?: string;
  pax_capacity?: number;
  engine_program?: string;
  status: 'available' | 'under_contract' | 'sold' | 'off_market';
  is_stealth_listing: boolean;
  description?: string;
  detailed_specs?: any; 
  created_at: string;
  updated_at: string;
  
  media?: AircraftMedia[]; 
  broker?: any; 
}

// =============================================================================
// Crew Expense & Per Diem Ledger Types (Epic 3 Additions)
// =============================================================================

export type ExpenseCategory = "hotel" | "transport" | "crew_meal" | "catering" | "fuel" | "fbo_fee" | "other";

export interface CrewExpense {
  id: string;
  missionId: string;
  userId: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  description: string;
  receiptUrl?: string;
  isPerDiemAccrual: boolean;
  loggedAt: string;
  status: "pending_review" | "approved" | "reimbursed" | "rejected" | "archived_locked";
}

export interface MissionExpenseSummary {
  missionId: string;
  totalExpenses: number;
  totalPerDiem: number;
  currency: string;
  items: CrewExpense[];
}