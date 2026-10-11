import { DynamicGeofence, EmergencyService, IncidentReport, RouteOption, TouristProfile } from '../types';

export const INITIAL_GEOFENCES: DynamicGeofence[] = [];

export const INITIAL_TOURIST: TouristProfile = {
  id: 'tourist-101',
  name: 'Unknown Tourist',
  nationality: 'Indian',
  blockchainDid: 'did:safeyatra:polygon:0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  identityHash: '0xa498f3214b72ef31890cd123490aafe78291039bc029384721ab',
  emergencyContact: '1800-123-4567',
  bloodType: 'O+',
  safetyStatus: 'SAFE',
  currentLocation: { lat: 30.1250, lng: 78.3180, address: 'Tapovan, Rishikesh' },
  lastUpdated: new Date().toLocaleTimeString(),
  batteryLevel: 84,
  currentRiskScore: 18
};

export const SAMPLE_OTHER_TOURISTS: TouristProfile[] = [
  {
    id: 'tourist-104',
    name: 'Siddharth Rao',
    nationality: 'Indian',
    blockchainDid: 'did:safeyatra:polygon:0x551a029381023812039812039120391203912039',
    identityHash: '0xaa771239012390123901239012390123901239',
    emergencyContact: '+91 99887 76655',
    bloodType: 'AB+',
    safetyStatus: 'CAUTION',
    currentLocation: { lat: 30.1030, lng: 78.2980, address: 'Triveni Ghat Crowd Area' },
    lastUpdated: 'Just now',
    batteryLevel: 68,
    currentRiskScore: 58
  },
  // ── Additional guide group tourists ──
  {
    id: 'tourist-102',
    name: 'John Doe',
    nationality: 'American',
    blockchainDid: 'did:safeyatra:polygon:0x62a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f801',
    identityHash: '0xb1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0',
    emergencyContact: '+1 555 0102',
    bloodType: 'A+',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1240, lng: 78.3170, address: 'Historic Plaza' },
    lastUpdated: 'Just now',
    batteryLevel: 85,
    currentRiskScore: 12
  },
  {
    id: 'tourist-103',
    name: 'Martha Stewart',
    nationality: 'British',
    blockchainDid: 'did:safeyatra:polygon:0x73b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f80200',
    identityHash: '0xc2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1',
    emergencyContact: '+44 7700 900100',
    bloodType: 'B-',
    safetyStatus: 'AT_RISK',
    currentLocation: { lat: 30.1400, lng: 78.3300, address: 'Out of Bounds Zone' },
    lastUpdated: '5 mins ago',
    batteryLevel: 15,
    currentRiskScore: 88
  },
  {
    id: 'tourist-105',
    name: 'Alex Smith',
    nationality: 'Canadian',
    blockchainDid: 'did:safeyatra:polygon:0x84c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8030100',
    identityHash: '0xd3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2',
    emergencyContact: '+1 416 555 0105',
    bloodType: 'O-',
    safetyStatus: 'CAUTION',
    currentLocation: { lat: 30.1180, lng: 78.3100, address: 'Edge of Zone' },
    lastUpdated: '2 mins ago',
    batteryLevel: 42,
    currentRiskScore: 45
  },
  {
    id: 'tourist-106',
    name: 'Elena Koval',
    nationality: 'Ukrainian',
    blockchainDid: 'did:safeyatra:polygon:0x95d4e5f6a7b8c9d0e1f2a3b4c5d6e7f804020100',
    identityHash: '0xe4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3',
    emergencyContact: '+380 50 123 4567',
    bloodType: 'A-',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1260, lng: 78.3195, address: 'North Gate' },
    lastUpdated: 'Just now',
    batteryLevel: 98,
    currentRiskScore: 5
  },
  {
    id: 'tourist-107',
    name: 'Raj Patel',
    nationality: 'Indian',
    blockchainDid: 'did:safeyatra:polygon:0xa6e5f6a7b8c9d0e1f2a3b4c5d6e7f80503020100',
    identityHash: '0xf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4',
    emergencyContact: '+91 98100 12345',
    bloodType: 'B+',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1235, lng: 78.3165, address: 'Temple Road' },
    lastUpdated: 'Just now',
    batteryLevel: 72,
    currentRiskScore: 8
  },
  {
    id: 'tourist-108',
    name: 'Maria Garcia',
    nationality: 'Spanish',
    blockchainDid: 'did:safeyatra:polygon:0xb7f6a7b8c9d0e1f2a3b4c5d6e7f8060403020100',
    identityHash: '0xa6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5',
    emergencyContact: '+34 612 345 678',
    bloodType: 'O+',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1248, lng: 78.3188, address: 'River Walk' },
    lastUpdated: '1 min ago',
    batteryLevel: 91,
    currentRiskScore: 10
  },
  {
    id: 'tourist-109',
    name: 'Takeshi Yamamoto',
    nationality: 'Japanese',
    blockchainDid: 'did:safeyatra:polygon:0xc8a7b8c9d0e1f2a3b4c5d6e7f807050403020100',
    identityHash: '0xb7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6',
    emergencyContact: '+81 90 1234 5678',
    bloodType: 'AB-',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1255, lng: 78.3175, address: 'Main Square' },
    lastUpdated: 'Just now',
    batteryLevel: 67,
    currentRiskScore: 14
  },
  {
    id: 'tourist-110',
    name: 'Sophie Laurent',
    nationality: 'French',
    blockchainDid: 'did:safeyatra:polygon:0xd9b8c9d0e1f2a3b4c5d6e7f80806050403020100',
    identityHash: '0xc8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7',
    emergencyContact: '+33 6 12 34 56 78',
    bloodType: 'A+',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1242, lng: 78.3182, address: 'Historic Plaza' },
    lastUpdated: '30s ago',
    batteryLevel: 55,
    currentRiskScore: 9
  },
  {
    id: 'tourist-111',
    name: 'Chen Wei',
    nationality: 'Chinese',
    blockchainDid: 'did:safeyatra:polygon:0xeac9d0e1f2a3b4c5d6e7f8090706050403020100',
    identityHash: '0xd9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8',
    emergencyContact: '+86 138 1234 5678',
    bloodType: 'O-',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1238, lng: 78.3168, address: 'East Bazaar' },
    lastUpdated: 'Just now',
    batteryLevel: 78,
    currentRiskScore: 11
  },
  {
    id: 'tourist-112',
    name: 'Olga Petrov',
    nationality: 'Russian',
    blockchainDid: 'did:safeyatra:polygon:0xfbd0e1f2a3b4c5d6e7f80a08070605040302010a',
    identityHash: '0xe0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
    emergencyContact: '+7 916 123 45 67',
    bloodType: 'B+',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1252, lng: 78.3190, address: 'West Pavilion' },
    lastUpdated: '1 min ago',
    batteryLevel: 63,
    currentRiskScore: 7
  },
  {
    id: 'tourist-113',
    name: 'Hassan Al-Rashid',
    nationality: 'Emirati',
    blockchainDid: 'did:safeyatra:polygon:0x0ce1f2a3b4c5d6e7f80b0908070605040302010b',
    identityHash: '0xf1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
    emergencyContact: '+971 50 123 4567',
    bloodType: 'A-',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1245, lng: 78.3172, address: 'Market Lane' },
    lastUpdated: 'Just now',
    batteryLevel: 89,
    currentRiskScore: 6
  },
  {
    id: 'tourist-114',
    name: 'Priya Nair',
    nationality: 'Indian',
    blockchainDid: 'did:safeyatra:polygon:0x1df2a3b4c5d6e7f80c0a09080706050403020100',
    identityHash: '0xa2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
    emergencyContact: '+91 94460 12345',
    bloodType: 'AB+',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1258, lng: 78.3186, address: 'Temple Steps' },
    lastUpdated: '2 mins ago',
    batteryLevel: 44,
    currentRiskScore: 15
  },
  {
    id: 'tourist-115',
    name: 'Lucas Müller',
    nationality: 'German',
    blockchainDid: 'did:safeyatra:polygon:0x2ea3b4c5d6e7f80d0b0a090807060504030201aa',
    identityHash: '0xb3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
    emergencyContact: '+49 171 234 5678',
    bloodType: 'O+',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1243, lng: 78.3177, address: 'South Garden' },
    lastUpdated: 'Just now',
    batteryLevel: 76,
    currentRiskScore: 13
  },
  {
    id: 'tourist-116',
    name: 'Amara Osei',
    nationality: 'Ghanaian',
    blockchainDid: 'did:safeyatra:polygon:0x3fb4c5d6e7f80e0c0b0a0908070605040302010b',
    identityHash: '0xc4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3',
    emergencyContact: '+233 24 123 4567',
    bloodType: 'B-',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1249, lng: 78.3183, address: 'River Walk' },
    lastUpdated: '30s ago',
    batteryLevel: 82,
    currentRiskScore: 4
  },
  {
    id: 'tourist-117',
    name: 'Kim Soo-Jin',
    nationality: 'Korean',
    blockchainDid: 'did:safeyatra:polygon:0x40c5d6e7f80f0d0c0b0a09080706050403020100',
    identityHash: '0xd5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4',
    emergencyContact: '+82 10 1234 5678',
    bloodType: 'A+',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1237, lng: 78.3169, address: 'Historic Plaza' },
    lastUpdated: 'Just now',
    batteryLevel: 94,
    currentRiskScore: 3
  },
  {
    id: 'tourist-118',
    name: 'Isabella Rossi',
    nationality: 'Italian',
    blockchainDid: 'did:safeyatra:polygon:0x51d6e7f8100e0d0c0b0a0908070605040302010c',
    identityHash: '0xe6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
    emergencyContact: '+39 338 123 4567',
    bloodType: 'O-',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1253, lng: 78.3191, address: 'North Gate' },
    lastUpdated: '1 min ago',
    batteryLevel: 58,
    currentRiskScore: 16
  },
  {
    id: 'tourist-119',
    name: 'David Kim',
    nationality: 'Australian',
    blockchainDid: 'did:safeyatra:polygon:0x62e7f811100f0e0d0c0b0a090807060504030201',
    identityHash: '0xf7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6',
    emergencyContact: '+61 412 345 678',
    bloodType: 'AB-',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1246, lng: 78.3174, address: 'Main Square' },
    lastUpdated: 'Just now',
    batteryLevel: 71,
    currentRiskScore: 9
  },
  {
    id: 'tourist-120',
    name: 'Fatima Khan',
    nationality: 'Pakistani',
    blockchainDid: 'did:safeyatra:polygon:0x73f812110f0e0d0c0b0a09080706050403020100',
    identityHash: '0xa8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7',
    emergencyContact: '+92 300 123 4567',
    bloodType: 'B+',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 30.1241, lng: 78.3179, address: 'West Pavilion' },
    lastUpdated: '30s ago',
    batteryLevel: 87,
    currentRiskScore: 7
  }
];

export const SAMPLE_ROUTES: RouteOption[] = [
  {
    id: 'route-fast',
    name: 'Route A: Direct Highway Corridor (High Risk)',
    distanceKm: 12.4,
    estimatedMinutes: 22,
    overallRiskScore: 84,
    isRecommended: false,
    waypoints: [
      { lat: 30.1250, lng: 78.3180 },
      { lat: 30.1345, lng: 78.3241 },
      { lat: 30.1891, lng: 78.3612 }
    ],
    riskFactorBreakdown: {
      roadCondition: 'Active shooting rockfall hazard & narrow blind curves',
      weatherHazard: 'Heavy downpour leading to potential torrent runoff',
      mobileNetworkCoverage: 'Patchy 2G/3G in deep cutting sections',
      policePatrolFrequency: 'Low (1 patrol per 3 hours)'
    }
  },
  {
    id: 'route-safe',
    name: 'Route B: SafeYatra Smart Recommended Safe Bypass',
    distanceKm: 15.8,
    estimatedMinutes: 31,
    overallRiskScore: 14,
    isRecommended: true,
    waypoints: [
      { lat: 30.1250, lng: 78.3180 },
      { lat: 30.1180, lng: 78.3100 },
      { lat: 30.1450, lng: 78.3400 },
      { lat: 30.1800, lng: 78.3650 }
    ],
    riskFactorBreakdown: {
      roadCondition: 'Reinforced dual-carriageway with avalanche netting',
      weatherHazard: 'Low slope angle, clear drainage culverts',
      mobileNetworkCoverage: 'Strong 5G coverage throughout',
      policePatrolFrequency: 'High (Tourist Safety Kiosk every 2.5 km)'
    }
  }
];

export const INITIAL_EMERGENCY_SERVICES: EmergencyService[] = [];

export const INITIAL_INCIDENTS: IncidentReport[] = [];

// ── Guide Dashboard Alert Feed Data ──
export interface GuideAlert {
  id: string;
  type: 'caution' | 'system' | 'info';
  title: string;
  description: string;
  time: string;
  icon: 'geofence' | 'battery' | 'schedule' | 'check' | 'weather';
  touristId?: string;
  hasAction?: boolean;
}

export const GUIDE_ALERTS: GuideAlert[] = [];

// ── Guide Chat Mock Data ──
export interface GuideChatMessage {
  id: string;
  channelId: string;
  sender: { id: string; name: string; role: 'guide' | 'tourist' | 'system' };
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface GuideChatChannel {
  id: string;
  name: string;
  type: 'group' | 'direct' | 'broadcast';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  memberCount?: number;
  touristId?: string;
}

export const GUIDE_CHAT_CHANNELS: GuideChatChannel[] = [];

export const GUIDE_CHAT_MESSAGES: GuideChatMessage[] = [];

export const INITIAL_TOURISTS: TouristProfile[] = [INITIAL_TOURIST, ...SAMPLE_OTHER_TOURISTS];
export const SAMPLE_INCIDENTS: IncidentReport[] = INITIAL_INCIDENTS;
export const SAMPLE_CHAT_LOGS: Record<string, any[]> = {};
