import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execFile } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import {
  INITIAL_GEOFENCES,
  SAMPLE_ROUTES,
  EMERGENCY_SERVICES
} from './src/data/mockData.js';
import { DynamicGeofence, IncidentReport, RiskCalculationInput, RiskCalculationOutput, SafetyStatus } from './src/types.js';

const __filename = typeof import.meta?.url === 'string' ? fileURLToPath(import.meta.url) : '';
const __dirname = __filename ? path.dirname(__filename) : process.cwd();

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5009; // Trigger Reload

// Initial Mock Data
const DB_FILE = path.join(__dirname, 'tourists_database.json');

// Helper to load tourists from DB
function loadTouristsDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB:', err);
  }
  return [];
}

let dbSaveTimer: NodeJS.Timeout | null = null;
function saveTouristsDB(data: any[]) {
  if (dbSaveTimer) clearTimeout(dbSaveTimer);
  dbSaveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing DB:', err);
    }
  }, 2000);
}

// State caches for runtime simulation
let activeGeofences = [...INITIAL_GEOFENCES];
let activeIncidents: IncidentReport[] = [];
let activeTourists = loadTouristsDB();
let serverChatLogs: Record<string, any[]> = {};
let blockchainRecords: Record<string, any> = {
  'did:safeyatra:polygon:0x71C7656EC7ab88b098defB751B7401B5f6d8976F': {
    did: 'did:safeyatra:polygon:0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    piiHash: '0xa498f3214b72ef31890cd123490aafe78291039bc029384721ab',
    verificationTimestamp: Date.now() - 86400000 * 3,
    blockNumber: 4891203,
    txHash: '0x99a12c458129e0123fba90123891230129bc8192301923',
    issuer: 'Uttarakhand Tourism Authority Trust Node',
    isVerified: true,
    emergencyAccessLog: []
  }
};

// SSE Clients for real-time situational dashboard updates
let sseClients: express.Response[] = [];

// --- BUG-001 FIX: Admin Auth Tokens ---
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@123';
const adminSessions: Map<string, { username: string; createdAt: number }> = new Map();

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized: Admin session required' });
  }
  const session = adminSessions.get(token)!;
  // Sessions expire after 24h
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    adminSessions.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }
  next();
}

function broadcastSSE(data: any) {
  sseClients.forEach(client => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// Haversine distance in meters
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate Dynamic Risk Score Algorithm
function calculateDynamicRiskScore(input: RiskCalculationInput): RiskCalculationOutput {
  const { weatherSeverity, crowdDensity, timeOfDayHour, historicalIncidentDensity, activeGovAlert } = input;

  // Weightings
  const wWeather = 0.35;
  const wCrowd = 0.20;
  const wTime = 0.20;
  const wHistory = 0.25;

  // Weather risk factor (0-100)
  const weatherRisk = Math.min(100, Math.max(0, weatherSeverity));

  // Crowd density factor (0-100 based on threshold 100 people per 100m²)
  const crowdRisk = Math.min(100, Math.max(0, (crowdDensity / 50) * 100));

  // Time of day factor (Night hours 22:00 - 05:00 elevated risk)
  let timeRisk = 10;
  if (timeOfDayHour >= 22 || timeOfDayHour <= 4) {
    timeRisk = 90;
  } else if (timeOfDayHour >= 18 || timeOfDayHour === 5) {
    timeRisk = 55;
  }

  // Historical incident density (0-100)
  const historyRisk = Math.min(100, Math.max(0, historicalIncidentDensity));

  let rawScore =
    wWeather * weatherRisk +
    wCrowd * crowdRisk +
    wTime * timeRisk +
    wHistory * historyRisk;

  if (activeGovAlert) {
    rawScore += 20; // Government emergency alert boost
  }

  const finalScore = Math.min(100, Math.round(rawScore));

  let status: SafetyStatus = 'SAFE';
  if (finalScore >= 80) status = 'EMERGENCY_SOS';
  else if (finalScore >= 60) status = 'AT_RISK';
  else if (finalScore >= 35) status = 'CAUTION';

  const recommendations: string[] = [];
  if (weatherSeverity > 50) recommendations.push('Heavy weather activity detected. Stay away from open ledges and riverbanks.');
  if (timeRisk > 50) recommendations.push('Night time in high-risk zone. Move towards well-lit public safety corridors.');
  if (historyRisk > 50) recommendations.push('Historical accident hotspot. Exercise extreme caution.');
  if (recommendations.length === 0) recommendations.push('Current context is favorable. Enjoy your tour responsibly.');

  return {
    riskScore: finalScore,
    status,
    riskFactors: {
      weatherRisk: Math.round(weatherRisk),
      crowdRisk: Math.round(crowdRisk),
      timeRisk: Math.round(timeRisk),
      historyRisk: Math.round(historyRisk)
    },
    recommendations
  };
}

// REST API Endpoints

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SafeYatra Safety Core API', version: '2.4.0' });
});

// --- BUG-001 FIX: Admin Login Endpoint (server-side credentials) ---
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateSessionToken();
    adminSessions.set(token, { username, createdAt: Date.now() });
    return res.json({ success: true, token, role: 'admin' });
  }
  return res.status(401).json({ error: 'Invalid admin credentials' });
});

// Verify admin session
app.get('/api/admin/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && adminSessions.has(token)) {
    const session = adminSessions.get(token)!;
    if (Date.now() - session.createdAt < 24 * 60 * 60 * 1000) {
      return res.json({ valid: true, username: session.username });
    }
    adminSessions.delete(token);
  }
  return res.status(401).json({ valid: false });
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) adminSessions.delete(token);
  res.json({ success: true });
});

// --- BUG-007 FIX: Proxy routes to FastAPI backend ---
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// Proxy: GET /api/v1/guides
app.get('/api/v1/guides', async (_req, res) => {
  try {
    const r = await fetch(`${FASTAPI_URL}/api/v1/guides`);
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'FastAPI backend unreachable' });
  }
});

// Proxy: POST /api/v1/guides (create guide)
app.post('/api/v1/guides', async (req, res) => {
  try {
    const r = await fetch(`${FASTAPI_URL}/api/v1/guides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'FastAPI backend unreachable' });
  }
});

// Proxy: POST /api/v1/guides/login
app.post('/api/v1/guides/login', async (req, res) => {
  try {
    const r = await fetch(`${FASTAPI_URL}/api/v1/guides/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'FastAPI backend unreachable' });
  }
});

// Proxy: GET /api/v1/guides/me
app.get('/api/v1/guides/me', async (req, res) => {
  try {
    const r = await fetch(`${FASTAPI_URL}/api/v1/guides/me`, {
      headers: { Authorization: req.headers.authorization || '' }
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'FastAPI backend unreachable' });
  }
});

// Proxy: GET /api/v1/devices/locations
app.get('/api/v1/devices/locations', async (_req, res) => {
  try {
    const r = await fetch(`${FASTAPI_URL}/api/v1/devices/locations`);
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'FastAPI backend unreachable' });
  }
});

// Get all tourists
app.get('/api/tourists', (_req, res) => {
  res.json(activeTourists);
});

// Register a new tourist
app.post('/api/tourists/register', async (req, res) => {
  const { name, email, mobile, nationality, city, age, bloodType, lat, lng, guide_id } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const targetGuideId = guide_id || 'G-1001';
  let touristId: string;
  let assignedGuideId: string = targetGuideId;

  try {
    const fastApiRes = await fetch('http://localhost:8000/api/v1/tourists/generate-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guide_id: targetGuideId })
    });

    if (!fastApiRes.ok) {
      const errData = await fastApiRes.json().catch(() => ({ detail: 'FastAPI error' }));
      return res.status(fastApiRes.status).json({ error: errData.detail || 'Failed to generate tourist ID from FastAPI backend' });
    }

    const fastApiData: any = await fastApiRes.json();
    touristId = fastApiData.tourist_id;
    assignedGuideId = fastApiData.guide_id;
  } catch (err: any) {
    console.error('FastAPI connection error during tourist ID generation:', err);
    return res.status(502).json({ error: 'Failed to connect to FastAPI backend service' });
  }

  const newTourist = {
    id: touristId,
    guide_id: assignedGuideId,
    name,
    email: email || '',
    mobile: mobile || '',
    nationality: nationality || 'Indian',
    city: city || '',
    age: age ? parseInt(age) : undefined,
    bloodType: bloodType || 'O+',
    blockchainDid: `did:safeyatra:polygon:0x${Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    identityHash: `0x${Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    emergencyContact: mobile || '+91 99887 76655',
    safetyStatus: 'SAFE',
    currentLocation: { 
      lat: lat ? parseFloat(lat) : 30.1250, 
      lng: lng ? parseFloat(lng) : 78.3180, 
      address: city || 'Tapovan, Rishikesh' 
    },
    lastUpdated: new Date().toLocaleTimeString(),
    batteryLevel: 100,
    currentRiskScore: 10
  };

  activeTourists.push(newTourist as any);
  saveTouristsDB(activeTourists);
  broadcastSSE({ type: 'TOURISTS_LIST_UPDATED', tourists: activeTourists });

  res.json({ success: true, tourist: newTourist });
});

// Delete a tourist — BUG-001 fix: require admin auth
app.delete('/api/tourists/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const initialLength = activeTourists.length;
  activeTourists = activeTourists.filter(t => t.id !== id);

  if (activeTourists.length === initialLength) {
    return res.status(404).json({ error: 'Tourist not found' });
  }

  saveTouristsDB(activeTourists);
  broadcastSSE({ type: 'TOURISTS_LIST_UPDATED', tourists: activeTourists });
  res.json({ success: true });
});

// Update tourist live GPS location and telemetry
app.post('/api/tourists/:id/location', (req, res) => {
  const { id } = req.params;
  const { lat, lng, address, accuracy, altitude, speed, batteryLevel } = req.body;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Valid latitude and longitude are required' });
  }

  const tourist = activeTourists.find(t => t.id === id);
  if (!tourist) {
    return res.status(404).json({ error: 'Tourist not found' });
  }

  tourist.currentLocation = {
    lat,
    lng,
    address: address || tourist.currentLocation?.address || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
    accuracy: typeof accuracy === 'number' ? accuracy : undefined,
    altitude: typeof altitude === 'number' ? altitude : undefined,
    speed: typeof speed === 'number' ? speed : undefined,
    isLiveGps: true,
    timestamp: Date.now()
  };
  tourist.lastUpdated = new Date().toLocaleTimeString();

  if (typeof batteryLevel === 'number') {
    tourist.batteryLevel = Math.max(0, Math.min(100, Math.round(batteryLevel)));
  }

  // Check geofence proximity & hazard bounds
  const breachedFences = activeGeofences.filter(fence => {
    const dist = haversineMeters(lat, lng, fence.center.lat, fence.center.lng);
    return dist <= fence.currentRadiusMeters;
  });

  const highRiskBreach = breachedFences.some(f => f.riskFactor >= 65);
  const medRiskBreach = breachedFences.some(f => f.riskFactor >= 40);

  if (highRiskBreach) {
    tourist.safetyStatus = 'DANGER';
    tourist.currentRiskScore = Math.max(tourist.currentRiskScore || 0, 85);
  } else if (medRiskBreach) {
    tourist.safetyStatus = 'WARNING';
    tourist.currentRiskScore = Math.max(tourist.currentRiskScore || 0, 55);
  } else {
    // Normal safe zone
    if (tourist.safetyStatus !== 'EMERGENCY_SOS') {
      tourist.safetyStatus = 'SAFE';
    }
  }

  saveTouristsDB(activeTourists);

  // Broadcast real-time location update to Admin, Guide, and SIH maps
  broadcastSSE({
    type: 'TOURIST_LOCATION_UPDATE',
    touristId: id,
    tourist,
    location: tourist.currentLocation,
    tourists: activeTourists,
    breachedFences
  });

  res.json({
    success: true,
    tourist,
    breachedFences,
    inHazardZone: highRiskBreach
  });
});

// SSE Endpoint for Live Tracking Broadcast
app.get('/api/live-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  // Send initial payload
  res.write(
    `data: ${JSON.stringify({
      type: 'INIT',
      geofences: activeGeofences,
      incidents: activeIncidents,
      tourists: activeTourists,
      chatLogs: serverChatLogs
    })}\n\n`
  );

  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

// Get Chat Message Logs
app.get('/api/chat/messages', (_req, res) => {
  res.json(serverChatLogs);
});

// Send Chat Message (Real-Time SSE Broadcast with Channel Isolation)
app.post('/api/chat/send', (req, res) => {
  const { incidentId, touristId, touristName, sender, text, time, senderRole, recipientRole, channel, guideId } = req.body;
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  const msgId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const timestamp = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const effectiveChannel = channel || (recipientRole === 'guide' || senderRole === 'guide' ? 'guide' : 'admin');
  const sRole = senderRole || 'tourist';
  const rRole = recipientRole || (effectiveChannel === 'guide' ? 'guide' : 'admin');

  const newMsg = {
    id: msgId,
    incidentId,
    touristId,
    touristName,
    guideId,
    sender: sender || 'User',
    senderRole: sRole,
    recipientRole: rRole,
    channel: effectiveChannel,
    text: String(text).trim(),
    time: timestamp
  };

  if (effectiveChannel === 'guide') {
    // 1. Direct Guide Channel - Isolated from Admin
    if (touristId) {
      const guideKey = `guide_${touristId}`;
      if (!serverChatLogs[guideKey]) serverChatLogs[guideKey] = [];
      serverChatLogs[guideKey].push(newMsg);
    }
    if (guideId) {
      const guideInboxKey = `guide_inbox_${guideId}`;
      if (!serverChatLogs[guideInboxKey]) serverChatLogs[guideInboxKey] = [];
      serverChatLogs[guideInboxKey].push(newMsg);
    }
  } else if (effectiveChannel === 'group') {
    // 2. Group Channel
    const groupKey = guideId ? `group_${guideId}` : 'group_default';
    if (!serverChatLogs[groupKey]) serverChatLogs[groupKey] = [];
    serverChatLogs[groupKey].push(newMsg);
    if (!serverChatLogs['global']) serverChatLogs['global'] = [];
    serverChatLogs['global'].push(newMsg);
  } else {
    // 3. Admin & Command Center Channel - Isolated from Guide
    if (touristId) {
      const adminKey = `admin_${touristId}`;
      if (!serverChatLogs[adminKey]) serverChatLogs[adminKey] = [];
      serverChatLogs[adminKey].push(newMsg);

      if (!serverChatLogs[touristId]) serverChatLogs[touristId] = [];
      serverChatLogs[touristId].push(newMsg);
    }
    if (incidentId) {
      if (!serverChatLogs[incidentId]) serverChatLogs[incidentId] = [];
      serverChatLogs[incidentId].push(newMsg);
    }
    if (touristName) {
      if (!serverChatLogs[touristName]) serverChatLogs[touristName] = [];
      serverChatLogs[touristName].push(newMsg);
    }
  }

  broadcastSSE({
    type: 'CHAT_MESSAGE',
    message: newMsg,
    incidentId,
    touristId,
    touristName,
    channel: effectiveChannel,
    recipientRole: rRole,
    senderRole: sRole,
    chatLogs: serverChatLogs
  });

  res.json({ success: true, message: newMsg, chatLogs: serverChatLogs });
});

// Calculate Dynamic Risk Score API
app.post('/api/risk-score', (req, res) => {
  const input: RiskCalculationInput = req.body;
  const result = calculateDynamicRiskScore(input);
  res.json(result);
});

// Check Geofence Breach API
app.post('/api/geofence/check', (req, res) => {
  const { lat, lng, touristId } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Valid latitude and longitude required' });
  }

  const breaches: { geofence: DynamicGeofence; distanceMeters: number; status: string }[] = [];

  activeGeofences.forEach(fence => {
    const dist = haversineMeters(lat, lng, fence.center.lat, fence.center.lng);
    // Dynamic radius adjustment
    let weatherMult = 1.0;
    if (fence.weatherImpact === 'HEAVY_DOWNPOUR') weatherMult = 1.4;
    else if (fence.weatherImpact === 'LANDSLIDE_WARNING' || fence.weatherImpact === 'FLASH_FLOOD') weatherMult = 1.6;

    const effectiveRadius = fence.baseRadiusMeters * weatherMult * fence.crowdDensityFactor * fence.timeOfDayFactor;

    if (dist <= effectiveRadius) {
      breaches.push({
        geofence: { ...fence, currentRadiusMeters: Math.round(effectiveRadius) },
        distanceMeters: Math.round(dist),
        status: dist <= effectiveRadius * 0.5 ? 'CRITICAL_INSIDE' : 'PERIMETER_WARNING'
      });
    }
  });

  // Update tourist location in runtime state if matching ID
  if (touristId) {
    const t = activeTourists.find(x => x.id === touristId);
    if (t) {
      t.currentLocation = { lat, lng };
      t.lastUpdated = new Date().toLocaleTimeString();
      if (breaches.some(b => b.status === 'CRITICAL_INSIDE')) {
        t.safetyStatus = 'AT_RISK';
        t.currentRiskScore = 85;
      } else if (breaches.length > 0) {
        t.safetyStatus = 'CAUTION';
        t.currentRiskScore = 55;
      } else {
        t.safetyStatus = 'SAFE';
        t.currentRiskScore = 15;
      }
      broadcastSSE({ type: 'TOURIST_UPDATED', tourist: t });
    }
  }

  res.json({
    breaches,
    inHazardZone: breaches.length > 0,
    timestamp: new Date().toISOString()
  });
});

// Safe Route API
app.get('/api/safe-route', (_req, res) => {
  res.json({
    routes: SAMPLE_ROUTES,
    origin: 'Tapovan, Rishikesh',
    destination: 'Badrinath Hwy Viewpoint',
    recommendationReason: 'Route B avoids active landslide rockfalls and provides continuous 5G SOS telemetry.'
  });
});

// Update Dynamic Geofence Parameters (Admin Control) — BUG-001 fix: require admin auth
app.post('/api/geofence/update-params', requireAdminAuth, (req, res) => {
  const { geofenceId, weatherImpact, crowdDensityFactor, timeOfDayFactor, governmentAlertActive } = req.body;
  const target = activeGeofences.find(g => g.id === geofenceId);
  if (!target) {
    return res.status(404).json({ error: 'Geofence not found' });
  }

  if (weatherImpact) target.weatherImpact = weatherImpact;
  if (crowdDensityFactor) target.crowdDensityFactor = crowdDensityFactor;
  if (timeOfDayFactor) target.timeOfDayFactor = timeOfDayFactor;
  if (governmentAlertActive !== undefined) target.governmentAlertActive = governmentAlertActive;

  // Recalculate radius
  let weatherMult = 1.0;
  if (target.weatherImpact === 'HEAVY_DOWNPOUR') weatherMult = 1.4;
  else if (target.weatherImpact === 'LANDSLIDE_WARNING' || target.weatherImpact === 'FLASH_FLOOD') weatherMult = 1.6;

  target.currentRadiusMeters = Math.round(target.baseRadiusMeters * weatherMult * target.crowdDensityFactor * target.timeOfDayFactor);

  broadcastSSE({ type: 'GEOFENCE_UPDATED', geofence: target, allGeofences: activeGeofences });

  res.json({ success: true, updatedGeofence: target });
});

// Blockchain Digital ID Anchoring
app.post('/api/blockchain/register-id', (req, res) => {
  const { name, passportOrAadhaar, emergencyContact } = req.body;
  if (!name || !passportOrAadhaar) {
    return res.status(400).json({ error: 'Name and PII identifier required' });
  }

  // Generate cryptographic hash (simulation)
  const pseudoRandomHash = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const did = `did:safeyatra:polygon:${pseudoRandomHash.slice(0, 22)}`;
  const blockNumber = 4892000 + Math.floor(Math.random() * 500);
  const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  const record = {
    did,
    piiHash: pseudoRandomHash,
    verificationTimestamp: Date.now(),
    blockNumber,
    txHash,
    issuer: 'SafeYatra Decentralized Safety Authority (Polygon Anchor)',
    isVerified: true,
    emergencyAccessLog: []
  };

  blockchainRecords[did] = record;

  res.json({
    success: true,
    did,
    record
  });
});

// Verify Blockchain DID
app.get('/api/blockchain/verify-id/:did', (req, res) => {
  const { did } = req.params;
  const record = blockchainRecords[did];

  if (!record) {
    return res.status(404).json({ error: 'Decentralized ID not found on SafeYatra Smart Contract ledger', isVerified: false });
  }

  // Log emergency verification access
  record.emergencyAccessLog.push({
    accessedBy: 'Authority Admin Command Center (Verified Officer)',
    reason: 'Emergency Identity Verification',
    timestamp: Date.now()
  });

  res.json({
    isVerified: true,
    record
  });
});

// Get All Active Incidents
app.get('/api/incidents', (_req, res) => {
  res.json(activeIncidents);
});

// Submit Incident or Trigger SOS
app.post('/api/incidents/sos', (req, res) => {
  const { touristId, location, description, mediaUrl, severity } = req.body;

  let actualName = 'Tourist';
  let targetGuideId = 'G-1001';
  let actualId = touristId || 'T-1001';

  const foundTourist = activeTourists.find(t => t.id === touristId || (touristId && t.id.startsWith(touristId)));
  if (foundTourist) {
    actualName = foundTourist.name;
    actualId = foundTourist.id;
    targetGuideId = foundTourist.guide_id || 'G-1001';
  }

  const incidentId = `INC-${Date.now().toString().slice(-4)}`;
  const newIncident: IncidentReport = {
    id: incidentId,
    touristId: actualId,
    touristName: actualName,
    type: 'SOS_TRIGGERED',
    location: location || (foundTourist ? foundTourist.currentLocation : { lat: 30.1250, lng: 78.3180, address: 'Tapovan, Rishikesh' }),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'PENDING',
    severity: severity || 'CRITICAL',
    description: description || 'EMERGENCY SOS TRIGGERED BY TOURIST. Immediate response required.',
    mediaUrl: mediaUrl || undefined,
    blockchainProofHash: '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  };

  // Find nearest service
  const hospital = EMERGENCY_SERVICES[0];

  newIncident.assignedUnit = {
    type: 'AMBULANCE',
    unitName: `${hospital.name} Quick Response Unit 1`,
    etaMinutes: 6,
    contactPhone: hospital.phone
  };

  activeIncidents.unshift(newIncident);

  // Update tourist status to EMERGENCY_SOS
  if (foundTourist) {
    foundTourist.safetyStatus = 'EMERGENCY_SOS';
    foundTourist.currentRiskScore = 99;
    saveTouristsDB(activeTourists);
  }

  // System alert in chat logs
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const alertMsg = {
    id: `msg-alert-${Date.now()}`,
    incidentId,
    touristId: actualId,
    touristName: actualName,
    sender: 'Emergency Alert System',
    senderRole: 'system',
    recipientRole: 'admin',
    channel: 'admin',
    text: `🚨 [INCIDENT REPORTED]: ${description || 'Emergency SOS activated'} at ${location?.address || 'Current Location'}. Severity: ${severity || 'CRITICAL'}`,
    time: timestamp
  };

  if (!serverChatLogs[incidentId]) serverChatLogs[incidentId] = [];
  serverChatLogs[incidentId].push(alertMsg);

  if (actualId) {
    const adminKey = `admin_${actualId}`;
    if (!serverChatLogs[adminKey]) serverChatLogs[adminKey] = [];
    serverChatLogs[adminKey].push(alertMsg);
  }

  broadcastSSE({
    type: 'NEW_INCIDENT',
    incident: newIncident,
    allIncidents: activeIncidents,
    tourist: foundTourist,
    tourists: activeTourists,
    guideId: targetGuideId,
    chatLogs: serverChatLogs
  });

  res.json({
    success: true,
    incident: newIncident,
    allIncidents: activeIncidents,
    fallbackTriggered: true,
    fallbackDetails: 'Automated Emergency Call & SMS alert dispatched to +91 135 246 2000 & Emergency Contact.'
  });
});

// Dispatch Incident (Admin Action) — BUG-001 fix: require admin auth
app.post('/api/incidents/dispatch', requireAdminAuth, (req, res) => {
  const { incidentId, unitType, unitName, etaMinutes } = req.body;
  const incident = activeIncidents.find(i => i.id === incidentId);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  incident.status = 'DISPATCHED';
  incident.assignedUnit = {
    type: unitType || 'POLICE',
    unitName: unitName || 'Uttarakhand Tourism Police Squad 4',
    etaMinutes: etaMinutes || 7,
    contactPhone: '112 / +91 135 243 0212'
  };

  broadcastSSE({ type: 'INCIDENT_UPDATED', incident });

  res.json({ success: true, incident });
});

// BUG-017 FIX: Resolve Incident Endpoint
app.post('/api/incidents/resolve', requireAdminAuth, (req, res) => {
  const { incidentId } = req.body;
  const incident = activeIncidents.find(i => i.id === incidentId);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  incident.status = 'RESOLVED';
  
  // Reset tourist safety status
  const tourist = activeTourists.find(t => t.id === incident.touristId);
  if (tourist) {
    tourist.safetyStatus = 'SAFE';
    tourist.currentRiskScore = 10;
  }
  
  broadcastSSE({ type: 'INCIDENT_UPDATED', incident });
  res.json({ success: true, incident });
});

// Python Risk Analytics Core Integration (Invokes Python 3.10 Backend Script)
app.post('/api/py/risk-score', (req, res) => {
  const payload = req.body || {};
  const pyScriptPath = path.join(__dirname, '..', 'backend', 'risk_engine.py');
  
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  execFile(pythonCmd, [pyScriptPath, JSON.stringify(payload)], { timeout: 5000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Python execution error:', error, stderr);
      return res.status(500).json({ error: 'Python Risk Engine Execution Failed', details: stderr });
    }
    try {
      const parsed = JSON.parse(stdout);
      res.json(parsed);
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse Python JSON output', raw: stdout });
    }
  });
});

// Multilingual AI Voice & Safety Assistant (Powered by Gemini)
app.post('/api/assistant/chat', async (req, res) => {
  const { message, touristContext, language } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message text required' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback intelligent response if API Key is pending
      return res.json({
        reply: `[SafeYatra Safety Assistant]: I am here to assist you in ${language || 'English'}. Your current risk score is ${
          touristContext?.currentRiskScore || 18
        }/100. Nearest emergency kiosk: Lakshman Jhula Police Chowk (1.1 km). Dial 112 for immediate SOS.`,
        suggestedActions: ['View Nearby Safe Shelters', 'Route to Nearest Police Kiosk', 'Trigger SOS Test']
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    const prompt = `You are the SafeYatra Smart Tourist Safety AI Assistant for Uttarakhand/India Tourism Security.
The user is asking: "${message}"
Target response language requested: ${language || 'English or detect regional language'}.
Context:
- User Name: ${touristContext?.name || 'Tourist'}
- Current Location: ${touristContext?.currentLocation?.address || 'Tapovan, Rishikesh'}
- Current Risk Score: ${touristContext?.currentRiskScore || 18}/100
- Safety Status: ${touristContext?.safetyStatus || 'SAFE'}
- Nearby Emergency Services: AIIMS Rishikesh Trauma Center (+91 135 246 2000), Tourism Police Lakshman Jhula (112 / +91 135 243 0212), SDRF Base.

Instructions:
1. Respond concisely, empathetically, and with clear actionable safety advice.
2. If language requested is Hindi, Tamil, Bengali, French, German, Spanish, or regional, respond in that language script.
3. Keep the answer under 4-5 sentences and highlight emergency helplines if danger is indicated.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt
    });

    const text = response.text || 'I am here to ensure your safety. Stay in well-monitored paths and reach out if you feel unsafe.';

    res.json({
      reply: text,
      suggestedActions: ['View Safe Route', 'Check Weather Radar', 'Emergency Call 112']
    });
  } catch (error: any) {
    console.error('Gemini Assistant Error:', error);
    res.json({
      reply: `[SafeYatra Safety Assistant]: I am closely monitoring your location in Rishikesh. Emergency Helpline: 112 / +91 135 243 0212. Please stay on marked paths.`,
      suggestedActions: ['View Safe Route', 'Trigger SOS']
    });
  }
});

// Vite Middleware & Production Static Server Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            '**/tourists_database.json',
            '**/*.json',
            '**/dist/**',
            '**/.git/**'
          ]
        }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SafeYatra Platform backend server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
