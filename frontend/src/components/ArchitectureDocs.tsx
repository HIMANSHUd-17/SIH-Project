import React, { useState } from 'react';
import {
  Database,
  Code2,
  Cpu,
  Globe,
  Layout,
  FileCode2,
  Copy,
  Check,
  Shield,
  Layers,
  Terminal,
  Share2
} from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'db' | 'solidity' | 'algorithms' | 'apis' | 'ui'>('system');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const MERMAID_DIAGRAM = `
gantt
    title NAGARJUNA Platform Data & System Flow
    
%% Data Flow Topology
graph TD
    subgraph Tourist App Client (PWA)
        TA1[GPS Location Telemetry]
        TA2[SOS & Incident Photo Evidence]
        TA3[Multilingual Voice Query]
        TA4[Offline SMS Fallback Generator]
    end

    subgraph Server Middleware & Risk Engine (Express + Node.js)
        RE1[Dynamic Risk Score Calculator]
        RE2[Geofence Proximity Evaluator]
        RE3[A* Safe Route Recommender]
        RE4[SSE Live Tracking Broadcaster]
    end

    subgraph AI Services (Google Gemini 2.5 Flash)
        AI1[Natural Language Safety Assistant]
        AI2[Real-time Hazard Contextualizer]
    end

    subgraph Blockchain Anchor Layer (Polygon / Hyperledger)
        BC1[NagarjunaTouristIdentity.sol]
        BC2[Zero-Knowledge PII Anchor Hash]
        BC3[Emergency Officer Audit Trail]
    end

    subgraph Multi-Authority Admin Dashboard
        AD1[Tactical Situational Map]
        AD2[Dynamic Geofence Radius Controller]
        AD3[Emergency Unit Dispatch Panel]
        AD4[Officer Identity Auditor]
    end

    TA1 -->|Lat/Lng + Sensor Data| RE2
    RE2 -->|Calculates Risk Index| RE1
    RE1 -->|Pushes Risk Badge & Siren Trigger| TA1
    TA2 -->|Geo-tagged Evidence| RE4
    TA3 -->|Natural Language Prompt| AI1
    AI1 -->|Multilingual Guidance| TA3

    RE2 -->|Anchor DID & PII Hash| BC1
    BC1 -->|Verifies Identity On-Chain| BC2
    AD4 -->|Audits Tourist DID| BC3

    RE4 -->|Real-time SSE Event Stream| AD1
    AD2 -->|Adjusts Weather/Crowd Params| RE2
    AD3 -->|Dispatches Rescue Units| TA2
`;

  const SQL_SCHEMA = `-- PostgreSQL + PostGIS Schema for NAGARJUNA Safety Platform

-- Enable PostGIS spatial extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users & Tourists Entity
CREATE TABLE tourists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(120) NOT NULL,
    nationality VARCHAR(60) NOT NULL,
    emergency_contact VARCHAR(20) NOT NULL,
    blood_type VARCHAR(5),
    blockchain_did VARCHAR(100) UNIQUE NOT NULL,
    identity_hash VARCHAR(66) NOT NULL, -- SHA-256 / Keccak256 PII hash
    current_risk_score INT DEFAULT 15 CHECK (current_risk_score BETWEEN 0 AND 100),
    safety_status VARCHAR(20) DEFAULT 'SAFE' CHECK (safety_status IN ('SAFE', 'CAUTION', 'AT_RISK', 'EMERGENCY_SOS')),
    battery_level INT DEFAULT 100,
    current_location GEOMETRY(Point, 4326), -- PostGIS Spatial Point (WGS 84)
    last_ping_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index for sub-millisecond proximity queries
CREATE INDEX idx_tourists_location ON tourists USING GIST (current_location);
CREATE INDEX idx_tourists_did ON tourists (blockchain_did);

-- 2. Dynamic Geofences Entity
CREATE TABLE dynamic_geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    fence_type VARCHAR(40) NOT NULL CHECK (fence_type IN ('UNMONITORED_WATERFALL', 'LANDSLIDE_PRONE', 'RESTRICTED_ARMY', 'HIGH_CROWD_STAMPEDE', 'WEATHER_HAZARD')),
    base_radius_meters DOUBLE PRECISION NOT NULL,
    current_radius_meters DOUBLE PRECISION NOT NULL,
    center_location GEOMETRY(Point, 4326) NOT NULL,
    risk_factor INT NOT NULL CHECK (risk_factor BETWEEN 0 AND 100),
    weather_impact VARCHAR(30) DEFAULT 'NONE',
    crowd_density_factor DOUBLE PRECISION DEFAULT 1.0,
    time_of_day_factor DOUBLE PRECISION DEFAULT 1.0,
    government_alert_active BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_geofences_center ON dynamic_geofences USING GIST (center_location);

-- 3. Incidents & Emergency SOS Entity
CREATE TABLE incidents (
    id VARCHAR(30) PRIMARY KEY,
    tourist_id UUID REFERENCES tourists(id) ON DELETE CASCADE,
    incident_type VARCHAR(30) NOT NULL CHECK (incident_type IN ('MEDICAL', 'ACCIDENT', 'LOST_PATH', 'CRIME', 'NATURAL_DISASTER', 'HARASSMENT', 'SOS_TRIGGERED')),
    location GEOMETRY(Point, 4326) NOT NULL,
    address_text TEXT,
    severity VARCHAR(20) DEFAULT 'HIGH' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DISPATCHED', 'ON_SITE', 'RESOLVED')),
    description TEXT,
    media_url VARCHAR(255),
    blockchain_proof_hash VARCHAR(66),
    assigned_unit_name VARCHAR(100),
    assigned_unit_phone VARCHAR(20),
    eta_minutes INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incidents_location ON incidents USING GIST (location);

-- 4. On-Chain Identity Verification Audit Log
CREATE TABLE verification_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blockchain_did VARCHAR(100) REFERENCES tourists(blockchain_did),
    accessed_by_officer VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    tx_hash VARCHAR(66),
    block_number BIGINT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

  const SOLIDITY_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NagarjunaTouristIdentity
 * @notice Privacy-Preserving Blockchain Digital Identity & Emergency Verification Ledger
 * @dev Anchors cryptographic zero-knowledge hashes of tourist identities and tracks emergency officer access.
 */
contract NagarjunaTouristIdentity {
    
    address public immutable authorityOwner;

    struct IdentityRecord {
        string did;
        bytes32 piiHash;             // Keccak256 hash of encrypted Passport/Aadhaar
        uint256 registeredAt;
        uint256 blockNumber;
        bool isVerified;
        address issuerNode;
    }

    struct EmergencyAccessLog {
        address officerAddress;
        string reason;
        uint256 timestamp;
    }

    // Mapping from DID string to IdentityRecord
    mapping(string => IdentityRecord) private records;
    
    // Mapping from DID to Emergency Audit Trail
    mapping(string => EmergencyAccessLog[]) private auditLogs;

    // Authorized Authority Nodes
    mapping(address => bool) public authorizedNodes;

    // Events
    event IdentityRegistered(string indexed did, bytes32 indexed piiHash, address issuerNode);
    event EmergencyAccessLogged(string indexed did, address indexed officer, string reason, uint256 timestamp);

    modifier onlyAuthority() {
        require(authorizedNodes[msg.sender] || msg.sender == authorityOwner, "Caller is not an authorized authority node");
        _;
    }

    constructor() {
        authorityOwner = msg.sender;
        authorizedNodes[msg.sender] = true;
    }

    function addAuthorityNode(address _node) external {
        require(msg.sender == authorityOwner, "Only owner can add nodes");
        authorizedNodes[_node] = true;
    }

    /**
     * @notice Register a new tourist digital identity hash on-chain
     */
    function registerIdentity(
        string calldata _did,
        bytes32 _piiHash
    ) external onlyAuthority {
        require(records[_did].registeredAt == 0, "DID already registered");

        records[_did] = IdentityRecord({
            did: _did,
            piiHash: _piiHash,
            registeredAt: block.timestamp,
            blockNumber: block.number,
            isVerified: true,
            issuerNode: msg.sender
        });

        emit IdentityRegistered(_did, _piiHash, msg.sender);
    }

    /**
     * @notice Verify identity on-chain and log officer emergency access
     */
    function verifyIdentityAndAudit(
        string calldata _did,
        string calldata _reason
    ) external onlyAuthority returns (bool isVerified, bytes32 piiHash, uint256 registeredAt) {
        IdentityRecord memory record = records[_did];
        require(record.registeredAt > 0, "Identity DID not found");

        auditLogs[_did].push(EmergencyAccessLog({
            officerAddress: msg.sender,
            reason: _reason,
            timestamp: block.timestamp
        }));

        emit EmergencyAccessLogged(_did, msg.sender, _reason, block.timestamp);

        return (record.isVerified, record.piiHash, record.registeredAt);
    }

    /**
     * @notice Retrieve audit log count for a given DID
     */
    function getAuditLogCount(string calldata _did) external view returns (uint256) {
        return auditLogs[_did].length;
    }
}
`;

  const ALGORITHM_CODE = `// Core Algorithms for NAGARJUNA Safety Platform

// 1. Dynamic Risk Score Calculation Logic
export function calculateDynamicRiskScore(input: {
  weatherSeverity: number;     // 0 to 100
  crowdDensity: number;        // people per 100m²
  timeOfDayHour: number;       // 0 to 23
  historicalIncidentDensity: number; // 0 to 100
  activeGovAlert: boolean;
}): number {
  const { weatherSeverity, crowdDensity, timeOfDayHour, historicalIncidentDensity, activeGovAlert } = input;

  // Weightings
  const wWeather = 0.35;
  const wCrowd = 0.20;
  const wTime = 0.20;
  const wHistory = 0.25;

  // Weather risk
  const weatherRisk = Math.min(100, Math.max(0, weatherSeverity));

  // Crowd density risk
  const crowdRisk = Math.min(100, Math.max(0, (crowdDensity / 50) * 100));

  // Time factor (Night 22:00 - 04:00 elevated)
  let timeRisk = 10;
  if (timeOfDayHour >= 22 || timeOfDayHour <= 4) timeRisk = 90;
  else if (timeOfDayHour >= 18 || timeOfDayHour === 5) timeRisk = 55;

  const historyRisk = Math.min(100, Math.max(0, historicalIncidentDensity));

  let rawScore =
    wWeather * weatherRisk +
    wCrowd * crowdRisk +
    wTime * timeRisk +
    wHistory * historyRisk;

  if (activeGovAlert) {
    rawScore += 20; // Emergency alert bonus
  }

  return Math.min(100, Math.round(rawScore));
}

// 2. Dynamic Geofence Alert Trigger Handler
export function evaluateDynamicGeofenceBreach(
  touristLoc: { lat: number; lng: number },
  geofence: {
    center: { lat: number; lng: number };
    baseRadiusMeters: number;
    weatherImpact: string;
    crowdDensityFactor: number;
    timeOfDayFactor: number;
  }
): { isBreached: boolean; distanceMeters: number; effectiveRadiusMeters: number } {
  // Haversine Distance
  const R = 6371000;
  const dLat = (geofence.center.lat - touristLoc.lat) * (Math.PI / 180);
  const dLon = (geofence.center.lng - touristLoc.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(touristLoc.lat * (Math.PI / 180)) * Math.cos(geofence.center.lat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const distMeters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Calculate dynamic expansion multiplier
  let weatherMult = 1.0;
  if (geofence.weatherImpact === 'HEAVY_DOWNPOUR') weatherMult = 1.4;
  else if (geofence.weatherImpact === 'LANDSLIDE_WARNING' || geofence.weatherImpact === 'FLASH_FLOOD') weatherMult = 1.6;

  const effectiveRadiusMeters = geofence.baseRadiusMeters * weatherMult * geofence.crowdDensityFactor * geofence.timeOfDayFactor;

  return {
    isBreached: distMeters <= effectiveRadiusMeters,
    distanceMeters: Math.round(distMeters),
    effectiveRadiusMeters: Math.round(effectiveRadiusMeters)
  };
}
`;

  const API_SPECS = `NAGARJUNA REST, PYTHON FASTAPI & SSE API SPECIFICATION

1. REST API Endpoints & Python Microservice
--------------------------------------------------------------------------------
GET /api/health
  - Response: { "status": "ok", "service": "NAGARJUNA Safety Core API", "version": "2.4.0" }

POST /api/py/risk-score (Invokes Python 3.10 Risk Engine - backend/risk_engine.py)
  - Body: { lat: 30.1410, lng: 78.3210, crowdDensity: 2.5, weatherFactor: "HEAVY_DOWNPOUR" }
  - Response: { status: "success", engine: "Python 3.10 Risk Analytics Core", riskScore: 88, safetyStatus: "EMERGENCY_SOS" }

POST /api/v1/analytics/evaluate-risk (FastAPI Microservice - backend/main.py)
  - Body: { touristId: "tourist-101", location: { lat: 30.138, lng: 78.318 }, crowdDensity: 1.5, weatherFactor: "HEAVY_DOWNPOUR" }
  - Response: { touristId: "tourist-101", calculatedScore: 88.0, safetyStatus: "EMERGENCY_SOS", engine: "Python FastAPI" }

POST /api/risk-score
  - Body: { touristLocation: { lat, lng }, crowdDensity, weatherSeverity, timeOfDayHour, historicalIncidentDensity, activeGovAlert }
  - Response: { riskScore: 88, status: "EMERGENCY_SOS", riskFactors: {...}, recommendations: [...] }

POST /api/geofence/check
  - Body: { lat: 30.1345, lng: 78.3241, touristId: "tourist-101" }
  - Response: { breaches: [...], inHazardZone: true, timestamp: "2026-08-10T10:44:00Z" }

GET /api/safe-route
  - Response: { routes: [ { id: "route-safe", isRecommended: true, overallRiskScore: 14, waypoints: [...] } ] }

POST /api/blockchain/register-id
  - Body: { name: "Ananya Sharma", passportOrAadhaar: "XXXX-XXXX-1234", emergencyContact: "+91 9876543210" }
  - Response: { success: true, did: "did:nagarjuna:polygon:...", record: {...} }

GET /api/blockchain/verify-id/:did
  - Response: { isVerified: true, record: { piiHash, blockNumber, txHash, emergencyAccessLog: [...] } }

POST /api/incidents/sos
  - Body: { touristId: "tourist-101", location: { lat, lng }, description: "SOS", severity: "CRITICAL" }
  - Response: { success: true, incident: {...}, fallbackTriggered: true, fallbackDetails: "Automated Voice/SMS alert dispatched" }

POST /api/incidents/dispatch
  - Body: { incidentId: "INC-2026-8801", unitType: "POLICE", unitName: "Uttarakhand Police Unit 4" }
  - Response: { success: true, incident: {...} }

POST /api/assistant/chat
  - Body: { message: "Is Neer Garh waterfall safe?", touristContext: {...}, language: "Hindi" }
  - Response: { reply: "...", suggestedActions: [...] }

2. Server-Sent Events (SSE / Real-time WebSocket Feed)
--------------------------------------------------------------------------------
GET /api/live-stream
  - Headers: Content-Type: text/event-stream
  - Event Payloads:
      - INIT: Initial snapshot of all geofences, tourists, and incidents
      - TOURIST_UPDATED: Live GPS & risk score broadcast
      - GEOFENCE_UPDATED: Geofence parameter expansion update
      - NEW_INCIDENT: Emergency SOS alert broadcast
`;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6 text-white bg-[#0A0A0B]">
      
      {/* Header */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#F27D26] text-black rounded-xl font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">NAGARJUNA Platform Core Architecture & Specifications</h1>
            <p className="text-xs text-[#71717A] mt-1">
              Technical blueprints mapping system topology, PostGIS spatial data schemas, Solidity smart contracts, risk algorithms, and REST APIs.
            </p>
          </div>
        </div>
      </div>

      {/* Docs Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#27272A] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'system' ? 'bg-[#F27D26] text-black shadow-md' : 'text-[#71717A] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>1. System Architecture</span>
        </button>

        <button
          onClick={() => setActiveTab('db')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'db' ? 'bg-[#F27D26] text-black shadow-md' : 'text-[#71717A] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>2. PostGIS Database Schema</span>
        </button>

        <button
          onClick={() => setActiveTab('solidity')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'solidity' ? 'bg-[#F27D26] text-black shadow-md' : 'text-[#71717A] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>3. Solidity Smart Contract</span>
        </button>

        <button
          onClick={() => setActiveTab('algorithms')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'algorithms' ? 'bg-[#F27D26] text-black shadow-md' : 'text-[#71717A] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>4. Core Risk Algorithms</span>
        </button>

        <button
          onClick={() => setActiveTab('apis')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'apis' ? 'bg-[#F27D26] text-black shadow-md' : 'text-[#71717A] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>5. REST & SSE APIs</span>
        </button>
      </div>

      {/* Content Panels */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-xl">
        
        {/* TAB 1: System Topology */}
        {activeTab === 'system' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#F27D26] flex items-center space-x-2">
                <Share2 className="w-5 h-5" />
                <span>Section 1: System Topology & Data Flow Map</span>
              </h2>
              <button
                onClick={() => copyToClipboard(MERMAID_DIAGRAM, 'mermaid')}
                className="bg-[#09090B] hover:bg-[#27272A] text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 border border-[#27272A] text-[#E4E4E7] cursor-pointer"
              >
                {copiedKey === 'mermaid' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Mermaid Code</span>
              </button>
            </div>

            <pre className="bg-[#09090B] p-4 rounded-xl border border-[#27272A] text-xs font-mono text-[#F27D26]/90 overflow-x-auto leading-relaxed">
              {MERMAID_DIAGRAM}
            </pre>
          </div>
        )}

        {/* TAB 2: PostGIS DB Schema */}
        {activeTab === 'db' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#F27D26] flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Section 2: PostgreSQL + PostGIS Spatial Schema</span>
              </h2>
              <button
                onClick={() => copyToClipboard(SQL_SCHEMA, 'sql')}
                className="bg-[#09090B] hover:bg-[#27272A] text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 border border-[#27272A] text-[#E4E4E7] cursor-pointer"
              >
                {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy SQL DDL</span>
              </button>
            </div>

            <pre className="bg-[#09090B] p-4 rounded-xl border border-[#27272A] text-xs font-mono text-[#E4E4E7] overflow-x-auto leading-relaxed">
              {SQL_SCHEMA}
            </pre>
          </div>
        )}

        {/* TAB 3: Solidity Smart Contract */}
        {activeTab === 'solidity' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#F27D26] flex items-center space-x-2">
                <Code2 className="w-5 h-5" />
                <span>Section 3: NagarjunaTouristIdentity.sol Smart Contract</span>
              </h2>
              <button
                onClick={() => copyToClipboard(SOLIDITY_CONTRACT, 'sol')}
                className="bg-[#09090B] hover:bg-[#27272A] text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 border border-[#27272A] text-[#E4E4E7] cursor-pointer"
              >
                {copiedKey === 'sol' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Solidity Contract</span>
              </button>
            </div>

            <pre className="bg-[#09090B] p-4 rounded-xl border border-[#27272A] text-xs font-mono text-[#10B981]/90 overflow-x-auto leading-relaxed">
              {SOLIDITY_CONTRACT}
            </pre>
          </div>
        )}

        {/* TAB 4: Core Risk Algorithms */}
        {activeTab === 'algorithms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#F27D26] flex items-center space-x-2">
                <Cpu className="w-5 h-5" />
                <span>Section 4: Core Risk Scoring & Geofence Handler Algorithms</span>
              </h2>
              <button
                onClick={() => copyToClipboard(ALGORITHM_CODE, 'algo')}
                className="bg-[#09090B] hover:bg-[#27272A] text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 border border-[#27272A] text-[#E4E4E7] cursor-pointer"
              >
                {copiedKey === 'algo' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Algorithm Code</span>
              </button>
            </div>

            <pre className="bg-[#09090B] p-4 rounded-xl border border-[#27272A] text-xs font-mono text-[#F27D26]/90 overflow-x-auto leading-relaxed">
              {ALGORITHM_CODE}
            </pre>
          </div>
        )}

        {/* TAB 5: REST & SSE APIs */}
        {activeTab === 'apis' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#F27D26] flex items-center space-x-2">
                <Terminal className="w-5 h-5" />
                <span>Section 5: REST API & SSE Real-Time Specification</span>
              </h2>
              <button
                onClick={() => copyToClipboard(API_SPECS, 'api')}
                className="bg-[#09090B] hover:bg-[#27272A] text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 border border-[#27272A] text-[#E4E4E7] cursor-pointer"
              >
                {copiedKey === 'api' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy API Specs</span>
              </button>
            </div>

            <pre className="bg-[#09090B] p-4 rounded-xl border border-[#27272A] text-xs font-mono text-[#E4E4E7] overflow-x-auto leading-relaxed">
              {API_SPECS}
            </pre>
          </div>
        )}

      </div>

    </div>
  );
};
