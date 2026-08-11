import { DynamicGeofence, EmergencyService, IncidentReport, RouteOption, TouristProfile } from '../types';

export const INITIAL_GEOFENCES: DynamicGeofence[] = [
  {
    id: 'fence-1',
    name: 'Neer Garh Waterfall Unmonitored Gorge',
    type: 'UNMONITORED_WATERFALL',
    baseRadiusMeters: 400,
    currentRadiusMeters: 650,
    center: { lat: 30.1345, lng: 78.3241, address: 'Neer Garh, Rishikesh, Uttarakhand' },
    riskFactor: 88,
    weatherImpact: 'HEAVY_DOWNPOUR',
    crowdDensityFactor: 1.4,
    timeOfDayFactor: 1.2,
    governmentAlertActive: true,
    description: 'Sudden flash flood surge risk during heavy rainfall. Slippery rocks and strong currents without lifeguards.',
    recommendedAction: 'Immediate eviction recommended. Move 200m uphill to marked shelter.'
  },
  {
    id: 'fence-2',
    name: 'Badrinath Highway Landslide Zone km 42',
    type: 'LANDSLIDE_PRONE',
    baseRadiusMeters: 500,
    currentRadiusMeters: 800,
    center: { lat: 30.1891, lng: 78.3612, address: 'NH-7 Bypass, Rishikesh-Devprayag Stretch' },
    riskFactor: 92,
    weatherImpact: 'LANDSLIDE_WARNING',
    crowdDensityFactor: 1.1,
    timeOfDayFactor: 1.0,
    governmentAlertActive: true,
    description: 'Active shooting stones reported from top ridge following continuous rains.',
    recommendedAction: 'Avoid stopping vehicles under overhangs. Follow state police detour.'
  },
  {
    id: 'fence-3',
    name: 'Triveni Ghat High-Density Surge Zone',
    type: 'HIGH_CROWD_STAMPEDE',
    baseRadiusMeters: 300,
    currentRadiusMeters: 450,
    center: { lat: 30.1031, lng: 78.2982, address: 'Triveni Ghat Ganga Aarti Sector' },
    riskFactor: 65,
    weatherImpact: 'NONE',
    crowdDensityFactor: 1.8,
    timeOfDayFactor: 1.4,
    governmentAlertActive: false,
    description: 'Extreme evening footfall during Evening Aarti. Bottlenecks near exit steps.',
    recommendedAction: 'Maintain buffer from edge steps. Keep children close.'
  },
  {
    id: 'fence-4',
    name: 'Rajaji Border Army Ammunition Sector',
    type: 'RESTRICTED_ARMY',
    baseRadiusMeters: 1000,
    currentRadiusMeters: 1000,
    center: { lat: 30.0754, lng: 78.2415, address: 'Restricted Defense Perimeter Zone B' },
    riskFactor: 95,
    weatherImpact: 'NONE',
    crowdDensityFactor: 0.8,
    timeOfDayFactor: 1.5,
    governmentAlertActive: true,
    description: 'Prohibited military firing range and tactical drone testing corridor.',
    recommendedAction: 'Strictly prohibited area. Trespassers subject to military detention.'
  }
];

export const INITIAL_TOURIST: TouristProfile = {
  id: 'tourist-101',
  name: 'Ananya Sharma',
  nationality: 'Indian',
  blockchainDid: 'did:nagarjuna:polygon:0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  identityHash: '0xa498f3214b72ef31890cd123490aafe78291039bc029384721ab',
  emergencyContact: '+91 98765 43210',
  bloodType: 'O+',
  safetyStatus: 'SAFE',
  currentLocation: { lat: 30.1250, lng: 78.3180, address: 'Tapovan, Rishikesh' },
  lastUpdated: new Date().toLocaleTimeString(),
  batteryLevel: 84,
  currentRiskScore: 18
};

export const SAMPLE_OTHER_TOURISTS: TouristProfile[] = [
  {
    id: 'tourist-102',
    name: 'David Miller',
    nationality: 'American',
    blockchainDid: 'did:nagarjuna:polygon:0x3f8a02c918374ba39120de840293ab341098421a',
    identityHash: '0x12bc9038d721901a88b90123fcd83921021bc',
    emergencyContact: '+1 415 555 0199',
    bloodType: 'A+',
    safetyStatus: 'AT_RISK',
    currentLocation: { lat: 30.1340, lng: 78.3235, address: 'Near Neer Garh Gorge' },
    lastUpdated: new Date().toLocaleTimeString(),
    batteryLevel: 42,
    currentRiskScore: 78
  },
  {
    id: 'tourist-103',
    name: 'Priya Verma',
    nationality: 'Indian',
    blockchainDid: 'did:nagarjuna:polygon:0x9812ab3490cd123490aafe78291039bc02938472',
    identityHash: '0x99281bc89210291023bc891023bc891023',
    emergencyContact: '+91 91234 56789',
    bloodType: 'B+',
    safetyStatus: 'EMERGENCY_SOS',
    currentLocation: { lat: 30.1885, lng: 78.3610, address: 'Badrinath Hwy Landslide Zone' },
    lastUpdated: '1 min ago',
    batteryLevel: 12,
    currentRiskScore: 96
  },
  {
    id: 'tourist-104',
    name: 'Siddharth Rao',
    nationality: 'Indian',
    blockchainDid: 'did:nagarjuna:polygon:0x551a029381023812039812039120391203912039',
    identityHash: '0xaa771239012390123901239012390123901239',
    emergencyContact: '+91 99887 76655',
    bloodType: 'AB+',
    safetyStatus: 'CAUTION',
    currentLocation: { lat: 30.1030, lng: 78.2980, address: 'Triveni Ghat Crowd Area' },
    lastUpdated: 'Just now',
    batteryLevel: 68,
    currentRiskScore: 58
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
    name: 'Route B: NAGARJUNA Smart Recommended Safe Bypass',
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

export const EMERGENCY_SERVICES: EmergencyService[] = [
  {
    id: 'es-1',
    name: 'AIIMS Rishikesh Trauma & Emergency Center',
    type: 'HOSPITAL',
    location: { lat: 30.0768, lng: 78.2881, address: 'Virbhadra Road, Rishikesh' },
    phone: '+91 135 246 2000',
    availableUnits: 8,
    distanceKm: 4.2
  },
  {
    id: 'es-2',
    name: 'Uttarakhand Tourism Police Post - Lakshman Jhula',
    type: 'POLICE_STATION',
    location: { lat: 30.1281, lng: 78.3275, address: 'Lakshman Jhula Bridge Chowk' },
    phone: '+91 135 243 0212',
    availableUnits: 14,
    distanceKm: 1.1
  },
  {
    id: 'es-3',
    name: 'SDRF Disaster Rescue Base Camp Rishikesh',
    type: 'RESCUE_BASE',
    location: { lat: 30.1120, lng: 78.3050, address: 'Jolly Grant Operational Sector' },
    phone: '112 / +91 94111 12985',
    availableUnits: 5,
    distanceKm: 3.8
  }
];

export const INITIAL_INCIDENTS: IncidentReport[] = [
  {
    id: 'INC-2026-8801',
    touristId: 'tourist-103',
    touristName: 'Priya Verma',
    type: 'SOS_TRIGGERED',
    location: { lat: 30.1885, lng: 78.3610, address: 'Badrinath Hwy Landslide Zone km 42' },
    timestamp: '10:42 AM',
    status: 'DISPATCHED',
    severity: 'CRITICAL',
    description: 'Automated SOS triggered after 30s unacknowledged breach into high-risk landslide zone. Battery 12%.',
    mediaUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
    assignedUnit: {
      type: 'MOUNTAIN_RESCUE',
      unitName: 'SDRF Alpha Rapid Squad',
      etaMinutes: 8,
      contactPhone: '+91 94111 12985'
    },
    blockchainProofHash: '0x88f12a981c7209123bc7890123cba789'
  },
  {
    id: 'INC-2026-8802',
    touristId: 'tourist-102',
    touristName: 'David Miller',
    type: 'LOST_PATH',
    location: { lat: 30.1340, lng: 78.3235, address: 'Near Neer Garh Gorge trail end' },
    timestamp: '10:30 AM',
    status: 'PENDING',
    severity: 'HIGH',
    description: 'Tourist reported slipping off marked trail near waterfall top. Mobile signal degrading.',
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
  }
];
