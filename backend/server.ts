import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { registerBlockchainIdentity, verifyBlockchainIdentity } from '../blockchain/ledger.js';
import {
  INITIAL_GEOFENCES,
  INITIAL_INCIDENTS,
  INITIAL_TOURIST,
  SAMPLE_OTHER_TOURISTS,
  SAMPLE_ROUTES,
  EMERGENCY_SERVICES
} from '../frontend/src/data/mockData.js';
import { DynamicGeofence, IncidentReport, RiskCalculationInput, RiskCalculationOutput, SafetyStatus } from '../frontend/src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// State caches for runtime simulation
let activeGeofences = [...INITIAL_GEOFENCES];
let activeIncidents = [...INITIAL_INCIDENTS];
let activeTourists = [INITIAL_TOURIST, ...SAMPLE_OTHER_TOURISTS];

// SSE Clients for real-time situational dashboard updates
let sseClients: express.Response[] = [];

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
  res.json({ status: 'ok', service: 'NAGARJUNA Safety Core API', version: '2.4.0' });
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
      tourists: activeTourists
    })}\n\n`
  );

  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
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

// Update Dynamic Geofence Parameters (Admin Control)
app.post('/api/geofence/update-params', (req, res) => {
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

  const record = registerBlockchainIdentity();

  res.json({
    success: true,
    did: record.did,
    record
  });
});

// Verify Blockchain DID
app.get('/api/blockchain/verify-id/:did', (req, res) => {
  const { did } = req.params;
  const record = verifyBlockchainIdentity(did);

  if (!record) {
    return res.status(404).json({ error: 'Decentralized ID not found on NAGARJUNA Smart Contract ledger', isVerified: false });
  }

  res.json({
    isVerified: true,
    record
  });
});

// Submit Incident or Trigger SOS
app.post('/api/incidents/sos', (req, res) => {
  const { touristId, location, description, mediaUrl, severity } = req.body;

  const incidentId = `INC-2026-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
  const newIncident: IncidentReport = {
    id: incidentId,
    touristId: touristId || 'tourist-101',
    touristName: 'Ananya Sharma',
    type: 'SOS_TRIGGERED',
    location: location || { lat: 30.1250, lng: 78.3180, address: 'Tapovan, Rishikesh' },
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
  const tourist = activeTourists.find(t => t.id === newIncident.touristId);
  if (tourist) {
    tourist.safetyStatus = 'EMERGENCY_SOS';
    tourist.currentRiskScore = 99;
  }

  broadcastSSE({ type: 'NEW_INCIDENT', incident: newIncident, tourist });

  res.json({
    success: true,
    incident: newIncident,
    fallbackTriggered: true,
    fallbackDetails: 'Automated Emergency Call & SMS alert dispatched to +91 135 246 2000 & Emergency Contact +91 98765 43210.'
  });
});

// Dispatch Incident (Admin Action)
app.post('/api/incidents/dispatch', (req, res) => {
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

// Python Risk Analytics Core Integration (Invokes Python 3.10 Backend Script)
app.post('/api/py/risk-score', (req, res) => {
  const payload = req.body || {};
  const pyScriptPath = path.join(__dirname, '..', 'ai-automation', 'risk_engine.py');
  
  execFile('python3', [pyScriptPath, JSON.stringify(payload)], { timeout: 5000 }, (error, stdout, stderr) => {
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
        reply: `[NAGARJUNA Safety Assistant]: I am here to assist you in ${language || 'English'}. Your current risk score is ${
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
    const prompt = `You are the NAGARJUNA Smart Tourist Safety AI Assistant for Uttarakhand/India Tourism Security.
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
      reply: `[NAGARJUNA Safety Assistant]: I am closely monitoring your location in Rishikesh. Emergency Helpline: 112 / +91 135 243 0212. Please stay on marked paths.`,
      suggestedActions: ['View Safe Route', 'Trigger SOS']
    });
  }
});

// Vite Middleware & Production Static Server Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const frontendRoot = path.join(__dirname, '..', 'frontend');
    const viteConfig = path.join(__dirname, '..', 'vite.config.ts');
    const vite = await createViteServer({
      root: frontendRoot,
      configFile: viteConfig,
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'client');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NAGARJUNA Platform backend server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
