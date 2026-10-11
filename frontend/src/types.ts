export type SafetyStatus = 'SAFE' | 'CAUTION' | 'AT_RISK' | 'EMERGENCY_SOS' | 'DANGER' | 'WARNING';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  accuracy?: number;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp?: number;
  isLiveGps?: boolean;
}

export interface TouristProfile {
  id: string;
  guide_id?: string;
  name: string;
  nationality: string;
  blockchainDid: string;
  identityHash: string;
  emergencyContact: string;
  bloodType?: string;
  safetyStatus: SafetyStatus;
  currentLocation: Location;
  lastUpdated: string;
  batteryLevel: number;
  currentRiskScore: number;
  email?: string;
  mobile?: string;
  city?: string;
  age?: number;
  groupId?: string;
  groupName?: string;
  isLeader?: boolean;
  medicalConditions?: string;
  customMedicalInfo?: string;
  idProofType?: 'AADHAAR' | 'PASSPORT' | 'DRIVING_LICENSE' | 'OTHER';
  idProofImage?: string;
  idProofHash?: string;
  idProofVerified?: boolean;
  sosTriggered?: boolean;
  riskLevel?: string;
  anomaly?: any;
  safetyDetails?: any;
  isSolo?: boolean;
  assignedGuide?: any;
  aiFeatures?: any;
}

export interface DynamicGeofence {
  id: string;
  name: string;
  type: 'UNMONITORED_WATERFALL' | 'LANDSLIDE_PRONE' | 'RESTRICTED_ARMY' | 'HIGH_CROWD_STAMPEDE' | 'WEATHER_HAZARD';
  baseRadiusMeters: number;
  currentRadiusMeters: number;
  center: Location;
  riskFactor: number; // 0 to 100
  weatherImpact: 'NONE' | 'MODERATE_RAIN' | 'HEAVY_DOWNPOUR' | 'LANDSLIDE_WARNING' | 'FLASH_FLOOD';
  crowdDensityFactor: number; // 0.0 to 2.0 multiplier
  timeOfDayFactor: number; // 0.0 to 1.5
  governmentAlertActive: boolean;
  description: string;
  recommendedAction: string;
}

export interface RouteOption {
  id: string;
  name: string;
  distanceKm: number;
  estimatedMinutes: number;
  overallRiskScore: number; // 0-100
  isRecommended: boolean;
  waypoints: Location[];
  riskFactorBreakdown: {
    roadCondition: string;
    weatherHazard: string;
    mobileNetworkCoverage: string;
    policePatrolFrequency: string;
  };
}

export interface IncidentReport {
  id: string;
  touristId: string;
  touristName: string;
  type: 'MEDICAL' | 'ACCIDENT' | 'LOST_PATH' | 'CRIME' | 'NATURAL_DISASTER' | 'HARASSMENT' | 'SOS_TRIGGERED' | 'GUIDE_SOS_TRIGGERED';
  location: Location;
  timestamp: string;
  status: 'PENDING' | 'DISPATCHED' | 'ON_SITE' | 'RESOLVED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  mediaUrl?: string;
  assignedUnit?: {
    type: 'POLICE' | 'AMBULANCE' | 'MOUNTAIN_RESCUE' | 'TOURISM_HELPLINE';
    unitName: string;
    etaMinutes: number;
    contactPhone: string;
  };
  blockchainProofHash?: string;
  blockchainIncidentId?: number;
  isAIVerified?: boolean;
  isGuideSOS?: boolean;
  guideId?: string;
  guideName?: string;
}

export interface EmergencyService {
  id: string;
  name: string;
  type: 'HOSPITAL' | 'POLICE_STATION' | 'FIRE_STATION' | 'RESCUE_BASE';
  location: Location;
  phone: string;
  availableUnits: number;
  distanceKm?: number;
}

export interface RiskCalculationInput {
  touristLocation: Location;
  crowdDensity: number; // people per 100m²
  weatherSeverity: number; // 0 (clear) to 100 (extreme storm)
  timeOfDayHour: number; // 0 to 23
  historicalIncidentDensity: number; // 0 to 100
  activeGovAlert: boolean;
}

export interface RiskCalculationOutput {
  riskScore: number; // 0 to 100
  status: SafetyStatus;
  riskFactors: {
    weatherRisk: number;
    crowdRisk: number;
    timeRisk: number;
    historyRisk: number;
  };
  recommendations: string[];
}

export interface BlockchainRecord {
  did: string;
  piiHash: string;
  verificationTimestamp: number;
  blockNumber: number;
  txHash: string;
  issuer: string;
  isVerified: boolean;
  emergencyAccessLog: {
    accessedBy: string;
    reason: string;
    timestamp: number;
    ipAddress?: string;
  }[];
}

export interface EFIRRecord {
  id: string;
  efirNumber: string; // Format: EFIR-YYYY-XXXX (e.g. EFIR-2026-0001)
  status: 'DRAFT' | 'GENERATED';
  createdAt: string;
  generatedAt?: string;
  generatedBy?: string;
  // FIR Details
  policeStation: string;
  jurisdiction: string;
  // Complainant Details
  complainantName: string;
  complainantMobile: string;
  complainantAddress?: string;
  // Case Details
  caseType: string;
  occurrenceDate: string;
  occurrencePlace: string;
  // Content
  description: string;
  additionalInfo?: string;
  // Digital Signature / Hash
  recordHash?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'bot';
  text: string;
  timestamp: string;
  language?: string;
  quickActions?: { label: string; query: string }[];
  isEmergency?: boolean;
}
