import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  LayoutGrid,
  Users,
  MessageSquare,
  LogOut,
  AlertOctagon,
  UserPlus,
  Bell,
  Settings,
  Search,
  CheckCircle,
  TrendingUp,
  Flame,
  Clock,
  Droplet,
  Battery,
  Send,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Eye,
  Map,
  MapPin,
  Activity,
  ShieldAlert,
  Cpu,
  Radio,
  AlertTriangle,
  X,
  User,
  ShieldCheck,
  SlidersHorizontal,
  Info,
  Save,
  KeyRound,
  Globe,
  Lock,
  FileText
} from 'lucide-react';
import { DynamicGeofence, EmergencyService, IncidentReport, TouristProfile } from '../types';
import { useLanguage, LanguageSelector } from '../utils/LanguageContext';
import { TrustVaultView } from './admin/TrustVaultView';
import { AdminEFIRView } from './admin/AdminEFIRView';

interface AdminDashboardProps {
  tourists: TouristProfile[];
  geofences: DynamicGeofence[];
  incidents: IncidentReport[];
  emergencyServices: EmergencyService[];
  onDispatchUnit: (incidentId: string, unitType: string, unitName: string) => void;
  onUpdateGeofenceParams: (params: { geofenceId: string; weatherImpact: any; crowdDensityFactor: number }) => void;
  onDeleteTourist: (id: string) => Promise<void>;
  onExitAdmin: () => void;
  chatLogs?: Record<string, { sender: string; text: string; time: string; latency?: string }[]>;
  setChatLogs?: React.Dispatch<React.SetStateAction<Record<string, { sender: string; text: string; time: string; latency?: string }[]>>>;
}

// Subcomponent: Leaflet Map for the Overview tab
const OverviewMap: React.FC<{
  tourists: TouristProfile[];
  geofences: DynamicGeofence[];
  incidents: IncidentReport[];
  emergencyServices: EmergencyService[];
  focusedTouristId?: string | null;
  onSelectTourist?: (tourist: TouristProfile) => void;
}> = ({ tourists, geofences, incidents, emergencyServices, focusedTouristId, onSelectTourist }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const [selectedId, setSelectedId] = useState<string>(focusedTouristId || '');

  // Initialize Map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let initialLat = 30.1300;
    let initialLng = 78.3200;
    if (tourists.length > 0 && tourists[0].currentLocation?.lat) {
      initialLat = tourists[0].currentLocation.lat;
      initialLng = tourists[0].currentLocation.lng;
    }

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap | SafeGuard Command Center'
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  const fitAllTourists = () => {
    if (!mapRef.current) return;
    const validCoords = tourists
      .filter(t => t.currentLocation && typeof t.currentLocation.lat === 'number' && typeof t.currentLocation.lng === 'number' && t.currentLocation.lat !== 0)
      .map(t => [t.currentLocation.lat, t.currentLocation.lng] as [number, number]);

    if (validCoords.length > 0) {
      if (validCoords.length === 1) {
        mapRef.current.setView(validCoords[0], 14, { animate: true });
      } else {
        const bounds = L.latLngBounds(validCoords);
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
      }
    }
  };

  const focusTourist = (tId: string) => {
    setSelectedId(tId);
    const target = tourists.find(t => t.id === tId);
    if (target && mapRef.current && target.currentLocation?.lat && target.currentLocation?.lng) {
      mapRef.current.flyTo([target.currentLocation.lat, target.currentLocation.lng], 16, { animate: true, duration: 1.2 });
      const marker = markersRef.current[target.id];
      if (marker) {
        marker.openPopup();
      }
      onSelectTourist?.(target);
    }
  };

  // Update layers when data updates without rebuilding the whole map
  useEffect(() => {
    if (!layerGroupRef.current) return;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();
    markersRef.current = {};

    // Geofences
    geofences.forEach(fence => {
      let color = '#3b82f6';
      if (fence.riskFactor >= 85) color = '#ef4444';
      else if (fence.riskFactor >= 60) color = '#f59e0b';

      L.circle([fence.center.lat, fence.center.lng], {
        color,
        fillColor: color,
        fillOpacity: 0.15,
        radius: fence.currentRadiusMeters,
        weight: 1.5
      }).bindPopup(`<b>${fence.name}</b><br/>Radius: ${fence.currentRadiusMeters}m<br/>Risk: ${fence.riskFactor}/100`).addTo(layerGroup);
    });

    // Emergency Services
    emergencyServices.forEach(es => {
      const icon = L.divIcon({
        className: 'es-icon',
        html: `<div style="background:#0284c7; color:white; padding:3px 7px; border-radius:6px; font-weight:bold; font-size:10px; border:1px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3); white-space:nowrap;">
          🏥 ${es.name.split(' ')[0]}
        </div>`,
        iconAnchor: [25, 12]
      });
      L.marker([es.location.lat, es.location.lng], { icon })
        .bindPopup(`<b>${es.name}</b><br/>Phone: ${es.phone}`)
        .addTo(layerGroup);
    });

    // Tourists Live Markers
    tourists.forEach(t => {
      if (!t.currentLocation || typeof t.currentLocation.lat !== 'number' || typeof t.currentLocation.lng !== 'number' || t.currentLocation.lat === 0) {
        return;
      }

      let pinColor = '#10B981'; // LOW / SAFE
      if (t.currentRiskScore > 75 || t.safetyStatus === 'EMERGENCY_SOS') pinColor = '#EF4444';
      else if (t.currentRiskScore > 50 || t.safetyStatus === 'AT_RISK') pinColor = '#F97316';
      else if (t.currentRiskScore > 25 || t.safetyStatus === 'CAUTION') pinColor = '#F59E0B';

      const isSos = t.safetyStatus === 'EMERGENCY_SOS' || t.currentRiskScore > 75;

      const icon = L.divIcon({
        className: 'custom-admin-tourist-pin',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              background: #061E34; color: #ffffff; padding: 2px 7px; border-radius: 10px;
              font-size: 10px; font-weight: 700; border: 1.5px solid ${pinColor};
              box-shadow: 0 2px 6px rgba(0,0,0,0.35); white-space: nowrap; margin-bottom: 2px;
              display: flex; align-items: center; gap: 4px;
            ">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: ${pinColor}; display: inline-block;"></span>
              <span>${t.name}</span>
              <span style="background: ${pinColor}33; color: ${pinColor}; padding: 0 3px; border-radius: 4px; font-size: 9px; font-family: monospace;">${t.currentRiskScore}</span>
            </div>
            <div style="
              width: 24px; height: 24px; background: ${pinColor}; border: 2.5px solid #ffffff;
              border-radius: 50%; box-shadow: 0 0 10px ${pinColor}, 0 2px 5px rgba(0,0,0,0.4);
              display: flex; align-items: center; justify-content: center; color: #ffffff;
              font-size: 11px; font-weight: bold;
            ">
              ${isSos ? '🚨' : '👤'}
            </div>
          </div>
        `,
        iconAnchor: [12, 34],
        popupAnchor: [0, -34]
      });

      const popupHtml = `
        <div style="font-family: Inter, sans-serif; font-size: 12px; min-width: 220px; line-height: 1.5; color: #1e293b;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
            <div>
              <strong style="font-size: 14px; color: #0f172a;">${t.name}</strong>
              <div style="font-size: 10px; color: #64748b; font-family: monospace;">ID: ${t.id}</div>
            </div>
            <span style="background: ${pinColor}20; color: ${pinColor}; border: 1px solid ${pinColor}40; padding: 2px 6px; border-radius: 999px; font-weight: 700; font-size: 10px;">
              ${t.safetyStatus}
            </span>
          </div>

          <div style="margin-bottom: 4px; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 4px;">
            <span>📍</span>
            <span>${t.currentLocation.address || 'Live Telemetry Location'}</span>
          </div>

          <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-bottom: 6px; background: #f8fafc; padding: 4px 6px; border-radius: 6px;">
            GPS: ${t.currentLocation.lat.toFixed(5)}° N, ${t.currentLocation.lng.toFixed(5)}° E
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 8px;">
            <div style="background: #f1f5f9; padding: 4px 6px; border-radius: 6px;">
              <span style="color: #64748b; font-size: 9px; text-transform: uppercase; font-weight: bold; display: block;">Risk Score</span>
              <b style="color: ${pinColor}; font-size: 13px;">${t.currentRiskScore}</b> <span style="font-size: 9px; color: #64748b;">/ 100</span>
            </div>
            <div style="background: #f1f5f9; padding: 4px 6px; border-radius: 6px;">
              <span style="color: #64748b; font-size: 9px; text-transform: uppercase; font-weight: bold; display: block;">Battery</span>
              <b style="color: #0f172a; font-size: 13px;">${t.batteryLevel ?? 100}%</b> 🔋
            </div>
          </div>

          <div style="font-size: 10px; color: #94a3b8; text-align: right;">
            Updated: ${t.lastUpdated || 'Just now'}
          </div>
        </div>
      `;

      const marker = L.marker([t.currentLocation.lat, t.currentLocation.lng], { icon })
        .bindPopup(popupHtml)
        .addTo(layerGroup);

      markersRef.current[t.id] = marker;
    });

    // Incidents
    incidents.forEach(inc => {
      const icon = L.divIcon({
        className: 'inc-icon',
        html: `<div style="background:#dc2626; color:white; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid white; animation: pulse 1s infinite; font-size: 12px; box-shadow: 0 0 10px #dc2626;">
          🚨
        </div>`,
        iconAnchor: [13, 13]
      });

      L.marker([inc.location.lat, inc.location.lng], { icon })
        .bindPopup(`
          <div>
            <strong style="color:#dc2626">${inc.id} - ${inc.type}</strong><br/>
            Tourist: <b>${inc.touristName}</b><br/>
            Severity: <b>${inc.severity}</b><br/>
            Place: ${inc.location.address || 'Unknown Location'}
          </div>
        `)
        .addTo(layerGroup);
    });
  }, [tourists, geofences, incidents, emergencyServices]);

  // Handle external focus request
  useEffect(() => {
    if (focusedTouristId) {
      focusTourist(focusedTouristId);
    }
  }, [focusedTouristId]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden">
      {/* Top Map Action Bar Overlay */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-800">
            📍 {tourists.length} Live Tourists Tracked
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Tourist Quick Selector */}
          <select
            value={selectedId}
            onChange={(e) => focusTourist(e.target.value)}
            className="bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md focus:outline-none hover:bg-slate-50 cursor-pointer"
          >
            <option value="">🎯 Locate Tourist on Map...</option>
            {tourists.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.currentLocation.address ? t.currentLocation.address.split(',')[0] : `(${t.currentLocation.lat.toFixed(2)}, ${t.currentLocation.lng.toFixed(2)})`} [Risk: {t.currentRiskScore}]
              </option>
            ))}
          </select>

          {/* Fit All Button */}
          <button
            onClick={fitAllTourists}
            className="bg-[#061E34] hover:bg-[#0A2640] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            <span>Fit All</span>
          </button>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full rounded-xl z-10" />
    </div>
  );
};

// Subcomponent: Leaflet Map for the Inbox detail tab
const InboxMap: React.FC<{ lat: number; lng: number; title: string }> = ({ lat, lng, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const pinColor = '#ef4444';
      const icon = L.divIcon({
        className: 'tourist-dot-pulse',
        html: `<div style="
          width: 14px; height: 14px; background: ${pinColor}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px ${pinColor};
        "></div>`,
        iconAnchor: [7, 7]
      });

      markerRef.current = L.marker([lat, lng], { icon }).addTo(map).bindPopup(title);
      mapRef.current = map;
    } else {
      mapRef.current.setView([lat, lng], 14);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]).bindPopup(title);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [lat, lng, title]);

  return <div ref={containerRef} className="w-full h-full relative z-10" />;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  tourists,
  geofences,
  incidents,
  emergencyServices,
  onDispatchUnit,
  onUpdateGeofenceParams,
  onDeleteTourist,
  onExitAdmin,
  chatLogs = {},
  setChatLogs
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive adminTab from current path
  let adminTab: 'overview' | 'tourists' | 'inbox' | 'guides' | 'ai-monitoring' | 'trust-vault' | 'efir' = 'overview';
  if (location.pathname.endsWith('/tourists')) adminTab = 'tourists';
  else if (location.pathname.endsWith('/inbox')) adminTab = 'inbox';
  else if (location.pathname.endsWith('/guides')) adminTab = 'guides';
  else if (location.pathname.endsWith('/ai-monitoring') || location.pathname.endsWith('/risk-monitoring')) adminTab = 'ai-monitoring';
  else if (location.pathname.endsWith('/trust-vault')) adminTab = 'trust-vault';
  else if (location.pathname.endsWith('/efir')) adminTab = 'efir';

  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(incidents[0] || null);
  const [inboxTab, setInboxTab] = useState<'incidents' | 'tourists' | 'guides'>('incidents');
  const [selectedChatTourist, setSelectedChatTourist] = useState<TouristProfile | null>(null);
  const [selectedChatGuide, setSelectedChatGuide] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SAFE' | 'CAUTION' | 'AT_RISK'>('ALL');
  const [aiRiskFilter, setAiRiskFilter] = useState<'ALL' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'>('ALL');
  const [aiAnomalyFilter, setAiAnomalyFilter] = useState<'ALL' | 'DETECTED' | 'NORMAL'>('ALL');
  const [aiSosFilter, setAiSosFilter] = useState<'ALL' | 'SOS_ONLY'>('ALL');
  const [localTourists, setLocalTourists] = useState<TouristProfile[]>(tourists);
  const [chatMessage, setChatMessage] = useState('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title?: string } | null>(null);

  const [selectedInspectorTourist, setSelectedInspectorTourist] = useState<TouristProfile | null>(null);
  const [focusedTouristId, setFocusedTouristId] = useState<string | null>(null);

  // Modals from SIH-2026
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [settingsNotifSOS, setSettingsNotifSOS] = useState(true);
  const [settingsNotifIncident, setSettingsNotifIncident] = useState(true);
  const [settingsNotifMessage, setSettingsNotifMessage] = useState(true);
  const [settingsNotifSafety, setSettingsNotifSafety] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [adminDisplayName, setAdminDisplayName] = useState(() => sessionStorage.getItem('adminDisplayName') || 'Super Admin');
  const [adminDisplayNameEdit, setAdminDisplayNameEdit] = useState(() => sessionStorage.getItem('adminDisplayName') || 'Super Admin');
  const adminUsername = 'admin@gmail.com';

  const notifications = [
    ...incidents.map(i => ({
      id: `inc-${i.id}`,
      title: `${i.type} Incident (${i.severity})`,
      body: `${i.touristName || 'Tourist'} — ${i.description}`,
      time: i.timestamp || 'Recent',
      type: (i.severity === 'CRITICAL' ? 'SOS' : 'INCIDENT') as 'SOS' | 'INCIDENT' | 'MESSAGE' | 'SAFETY',
      read: i.status === 'RESOLVED'
    })),
    ...localTourists.filter(t => t.safetyStatus === 'EMERGENCY_SOS').map(t => ({
      id: `sos-${t.id}`,
      title: `EMERGENCY SOS: ${t.name}`,
      body: `Location: ${t.currentLocation.address || 'Active Hazard Coordinates'}`,
      time: t.lastUpdated || 'Live',
      type: 'SOS' as const,
      read: false
    }))
  ];

  // Guide Management State
  const [guideList, setGuideList] = useState<any[]>([]);
  const [showCreateGuideForm, setShowCreateGuideForm] = useState(false);
  const [showGuidePassword, setShowGuidePassword] = useState(false);
  const [guideForm, setGuideForm] = useState({
    fullName: '',
    mobileNumber: '',
    licenseNo: '',
    yearsExperience: '',
    languages: '',
    password: ''
  });
  const [createdGuide, setCreatedGuide] = useState<any>(null);
  const [selectedGuideDetails, setSelectedGuideDetails] = useState<any | null>(null);

  const fetchGuides = async () => {
    try {
      const response = await fetch('/api/v1/guides');
      if (response.ok) {
        const data = await response.json();
        setGuideList(data);
      }
    } catch (err) {
      console.error('Failed to fetch guides', err);
    }
  };

  const handleDeleteGuide = async (guideId: string) => {
    if (!window.confirm(`Are you sure you want to delete Guide ${guideId}?`)) return;
    try {
      const response = await fetch(`/api/v1/guides/${guideId}`, { method: 'DELETE' });
      if (response.ok) {
        setGuideList(prev => prev.filter(g => g.guide_id !== guideId));
      }
    } catch (err) {
      console.error('Failed to delete guide', err);
    }
  };

  useEffect(() => {
    fetchGuides();
    const interval = setInterval(fetchGuides, 5000);
    return () => clearInterval(interval);
  }, [adminTab]);

  const handleCreateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: guideForm.fullName,
          mobileNumber: guideForm.mobileNumber,
          licenseNo: guideForm.licenseNo,
          yearsExperience: parseInt(guideForm.yearsExperience, 10),
          languages: guideForm.languages,
          password: guideForm.password
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create guide');
      }

      const data = await response.json();
      
      setCreatedGuide({
        id: data.guide_id,
        fullName: data.full_name,
        password: guideForm.password, // Only display once
        status: data.status
      });
      setGuideForm({ fullName: '', mobileNumber: '', licenseNo: '', yearsExperience: '', languages: '', password: '' });
      fetchGuides(); // Refresh the list
    } catch (error) {
      console.error(error);
      alert('Error creating guide account. Is the backend running?');
    }
  };

  // BUG-017 FIX: Handle Resolve Incident
  const handleResolveIncident = async (incidentId: string) => {
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      const res = await fetch('/api/incidents/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {})
        },
        body: JSON.stringify({ incidentId })
      });
      if (res.ok) {
        if (selectedIncident?.id === incidentId) {
          setSelectedIncident(prev => prev ? { ...prev, status: 'RESOLVED', mediaUrl: undefined } : null);
        }
        if (previewImage) {
          setPreviewImage(null);
        }
      }
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    }
  };

  // Sync prop changes
  useEffect(() => {
    setLocalTourists(tourists);
  }, [tourists]);

  // Chat message send handler (Isolated Admin Channel)
  const handleSendChat = async (text: string) => {
    const targetTouristId = selectedIncident?.touristId || selectedChatGuide?.guide_id || selectedChatTourist?.id;
    const targetTouristName = selectedIncident?.touristName || selectedChatGuide?.full_name || selectedChatTourist?.name || 'Tourist';
    const incId = selectedIncident?.id;
    if (!targetTouristId || !text.trim()) return;

    const isTargetGuide = Boolean(
      selectedChatGuide ||
      targetTouristId.startsWith('G-') ||
      selectedIncident?.isGuideSOS ||
      targetTouristName.toLowerCase().includes('guide')
    );
    const targetGuideId = isTargetGuide ? (selectedChatGuide?.guide_id || targetTouristId) : (selectedIncident?.guideId || selectedChatTourist?.guide_id);

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const now = Date.now();
    const newMsg = {
      id: `msg-admin-${now}`,
      sender: 'Operator',
      senderRole: 'admin',
      recipientRole: isTargetGuide ? 'guide' : 'tourist',
      channel: 'admin',
      text: text.trim(),
      time: timestamp,
      timestamp: now,
      touristId: targetTouristId,
      touristName: targetTouristName,
      guideId: targetGuideId,
      incidentId: incId
    };

    if (setChatLogs) {
      setChatLogs(prev => ({
        ...prev,
        ...(incId ? { [incId]: [...(prev[incId] || []), newMsg] } : {}),
        [`admin_${targetTouristId}`]: [...(prev[`admin_${targetTouristId}`] || []), newMsg],
        ...(targetGuideId ? { [`guide_inbox_${targetGuideId}`]: [...(prev[`guide_inbox_${targetGuideId}`] || []), newMsg] } : {}),
        [targetTouristId]: [...(prev[targetTouristId] || []), newMsg]
      }));
    }
    setChatMessage('');

    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: incId,
          touristId: targetTouristId,
          touristName: targetTouristName,
          guideId: targetGuideId,
          sender: 'Operator',
          senderRole: 'admin',
          recipientRole: isTargetGuide ? 'guide' : 'tourist',
          channel: 'admin',
          text: text.trim(),
          time: timestamp
        })
      });
    } catch (err) {
      console.error('Failed to post admin chat message to server:', err);
    }
  };

  const [isAdminClearing, setIsAdminClearing] = useState(false);

  const handleClearAdminChat = async (touristId?: string, incId?: string, touristName?: string) => {
    const targetId = touristId || selectedChatGuide?.guide_id;
    if (!targetId && !incId) return;
    const name = touristName || selectedChatGuide?.full_name || 'this conversation';
    if (!window.confirm(`Are you sure you want to clear chat history with ${name}?`)) return;
    setIsAdminClearing(true);
    try {
      await fetch('/api/chat/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touristId: targetId,
          guideId: selectedChatGuide?.guide_id || (targetId?.startsWith('G-') ? targetId : undefined),
          incidentId: incId,
          channel: 'admin'
        })
      });
    } catch (err) {
      console.error('Failed to clear admin chat:', err);
    } finally {
      setIsAdminClearing(false);
    }
  };

  const activeSOSCount = localTourists.filter(t => t.safetyStatus === 'EMERGENCY_SOS').length;
  const pendingIncidentsCount = incidents.filter(i => i.status === 'PENDING').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F7FA] text-slate-800 font-sans">
      
      {/* 1. Left Sidebar Navigation Panel */}
      <aside className="w-64 bg-[#061E34] text-white flex flex-col justify-between flex-shrink-0 border-r border-[#0A2640]">
        <div className="flex flex-col">
          {/* Logo & Platform Info Header */}
          <div className="p-6 flex items-center space-x-3 border-b border-[#0C2A47]">
            <div className="w-10 h-10 rounded-full bg-[#1C3D5A] flex items-center justify-center border border-[#2A5278] shadow-inner text-white font-bold">
              🛡️
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-wide text-white uppercase leading-none">SafeYatra</h2>
              <span className="text-[10px] text-[#8FA5C0] font-medium tracking-widest uppercase mt-1 inline-block">Command Center</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                adminTab === 'overview'
                  ? 'bg-[#0D2E4D] text-[#2CD3C3] border-l-4 border-[#2CD3C3] shadow-md'
                  : 'text-[#A0B6CD] hover:text-white hover:bg-[#0A253F]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => navigate('/admin/tourists')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                adminTab === 'tourists'
                  ? 'bg-[#0D2E4D] text-[#2CD3C3] border-l-4 border-[#2CD3C3] shadow-md'
                  : 'text-[#A0B6CD] hover:text-white hover:bg-[#0A253F]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Tourists</span>
            </button>

            <button
              onClick={() => navigate('/admin/ai-monitoring')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 relative ${
                adminTab === 'ai-monitoring'
                  ? 'bg-[#0D2E4D] text-[#2CD3C3] border-l-4 border-[#2CD3C3] shadow-md'
                  : 'text-[#A0B6CD] hover:text-white hover:bg-[#0A253F]'
              }`}
            >
              <Activity className="w-4 h-4 text-[#2CD3C3]" />
              <span>AI Risk Monitor</span>
              {localTourists.some(t => t.safetyStatus === 'EMERGENCY_SOS' || (Boolean(t.anomaly?.anomaly_detected) && t.safetyStatus !== 'SAFE')) && (
                <span className="absolute right-3 w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => navigate('/admin/inbox')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 relative ${
                adminTab === 'inbox'
                  ? 'bg-[#0D2E4D] text-[#2CD3C3] border-l-4 border-[#2CD3C3] shadow-md'
                  : 'text-[#A0B6CD] hover:text-white hover:bg-[#0A253F]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Inbox</span>
              {pendingIncidentsCount > 0 && (
                <span className="absolute right-4 bg-[#EF4444] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  {pendingIncidentsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/admin/guides')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                adminTab === 'guides'
                  ? 'bg-[#0D2E4D] text-[#2CD3C3] border-l-4 border-[#2CD3C3] shadow-md'
                  : 'text-[#A0B6CD] hover:text-white hover:bg-[#0A253F]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Guides</span>
            </button>

            <button
              onClick={() => navigate('/admin/efir')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                adminTab === 'efir'
                  ? 'bg-[#0D2E4D] text-[#2CD3C3] border-l-4 border-[#2CD3C3] shadow-md'
                  : 'text-[#A0B6CD] hover:text-white hover:bg-[#0A253F]'
              }`}
            >
              <FileText className="w-4 h-4 text-[#2CD3C3]" />
              <span>E-FIR</span>
            </button>

            <button
              onClick={() => navigate('/admin/trust-vault')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                adminTab === 'trust-vault'
                  ? 'bg-[#0D2E4D] text-[#2CD3C3] border-l-4 border-[#2CD3C3] shadow-md'
                  : 'text-[#A0B6CD] hover:text-white hover:bg-[#0A253F]'
              }`}
            >
              <Lock className="w-4 h-4 text-[#2CD3C3]" />
              <span>Trust Vault</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-[#0C2A47] space-y-2">
          <button
            onClick={onExitAdmin}
            className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-[10px] uppercase tracking-widest text-[#8FA5C0] hover:text-white hover:bg-[#0A253F] transition-all font-bold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Admin</span>
          </button>

          <button
            onClick={() => {
              navigate('/admin/inbox');
              if (incidents.length > 0) setSelectedIncident(incidents[0]);
            }}
            className="w-full bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold py-3.5 rounded-lg text-xs flex items-center justify-center space-x-2 transition-all shadow-md uppercase tracking-wider active:scale-98 cursor-pointer"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Emergency Dispatch</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Window Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              {adminTab === 'overview' && 'SafeGuard Command'}
              {adminTab === 'tourists' && 'Tourist Directory'}
              {adminTab === 'inbox' && 'Incident Inbox'}
              {adminTab === 'guides' && 'Guide Management'}
              {adminTab === 'trust-vault' && 'Cryptographic Trust Vault'}
              {adminTab === 'efir' && 'E-FIR Incident Records'}
            </h1>
            <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>System Nominal</span>
            </div>
          </div>

          {/* Header Action Items */}
          <div className="flex items-center space-x-4">
            {/* Global Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Locate Tourist ID..."
                className="bg-[#EAF0F6] hover:bg-[#DFE7EE] text-slate-700 placeholder-slate-400 pl-9 pr-4 py-1.5 w-60 rounded-full text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#061E34]/30 focus:bg-white transition-all border border-transparent focus:border-slate-300"
              />
            </div>

            {/* Icons Actions */}
            <button
              onClick={() => {
                setShowNotifications(v => !v);
                setShowSettings(false);
                setShowProfile(false);
              }}
              className="text-slate-400 hover:text-slate-600 relative cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="System Notifications"
            >
              <Bell className="w-5 h-5" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => {
                setShowSettings(v => !v);
                setShowNotifications(false);
                setShowProfile(false);
              }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Admin Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Profile Avatar Button */}
            <button
              onClick={() => {
                setShowProfile(v => !v);
                setShowNotifications(false);
                setShowSettings(false);
              }}
              className="flex items-center space-x-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Admin Profile"
            >
              <div className="w-8 h-8 rounded-full bg-[#061E34] text-white flex items-center justify-center text-xs font-bold border border-[#2CD3C3] shadow-sm">
                {adminDisplayName ? adminDisplayName.slice(0, 2).toUpperCase() : 'AD'}
              </div>
            </button>
          </div>
        </header>

        {/* Dynamic Inner Tab Router Panel */}
        <main className="flex-1 overflow-hidden min-h-0 bg-[#F4F7FA]">
          {/* A. OVERVIEW SUB-TAB VIEW */}
          {adminTab === 'overview' && (
            <div className="h-full flex p-6 gap-6 overflow-hidden">
              {/* Left Side: Map Panel */}
              <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col relative">
                <div className="w-full h-full relative">
                  <OverviewMap
                    tourists={localTourists}
                    geofences={geofences}
                    incidents={incidents}
                    emergencyServices={emergencyServices}
                    focusedTouristId={focusedTouristId}
                    onSelectTourist={(t) => setSelectedInspectorTourist(t)}
                  />

                  {/* Map Pin Legend (Bottom-Left overlay) */}
                  <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md z-[1000] border border-slate-200 flex items-center space-x-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] mr-1.5"></span>
                      Safe
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B] mr-1.5"></span>
                      Caution
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-[#EF4444] mr-1.5"></span>
                      Restricted
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Analytics & Alerts Side Column */}
              <div className="w-80 flex flex-col space-y-6 flex-shrink-0 overflow-y-auto">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Real-Time Overview</h3>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Update: Live Feed</span>
                  </div>

                  {/* 1. Total Monitored Card — BUG-019 fix: dynamic count */}
                  <div className="bg-[#EAF0F6] border border-[#D9E3ED] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Monitored</span>
                      <div className="flex items-end space-x-2 mt-1">
                        <span className="text-3xl font-bold text-slate-800 font-mono">{localTourists.length}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                        <TrendingUp className="w-3 h-3 mr-0.5" /> Live
                      </span>
                      <span className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">Live stream</span>
                    </div>
                  </div>

                  {/* 2. Active SOS & Pending count grid cards — BUG-019 fix: no fake || fallback */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl p-4 text-center">
                      <Flame className="w-5 h-5 text-[#C62828] mx-auto animate-pulse" />
                      <div className="text-2xl font-bold text-[#C62828] font-mono mt-1">{activeSOSCount}</div>
                      <span className="text-[9px] text-[#C62828] uppercase font-bold tracking-wider block mt-0.5">Active SOS</span>
                    </div>

                    <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 text-center">
                      <Clock className="w-5 h-5 text-[#F57F17] mx-auto" />
                      <div className="text-2xl font-bold text-[#F57F17] font-mono mt-1">{pendingIncidentsCount}</div>
                      <span className="text-[9px] text-[#F57F17] uppercase font-bold tracking-wider block mt-0.5">Pending</span>
                    </div>
                  </div>

                  {/* AI Sentinel Quick Overview Pill */}
                  <div
                    onClick={() => navigate('/admin/ai-monitoring')}
                    className="bg-gradient-to-r from-[#061E34] to-[#0D2E4D] rounded-xl p-3.5 text-white shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#1C3D5A] flex items-center justify-center text-[#2CD3C3]">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-[#8FA5C0]">AI Risk Sentinel</div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                          <span>{localTourists.filter(t => t.anomaly?.anomaly_detected).length} Anomalies</span>
                          <span className="text-[#8FA5C0]">•</span>
                          <span>{localTourists.filter(t => (t.currentRiskScore || 0) > 50).length} High Risk</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8FA5C0] group-hover:text-[#2CD3C3] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* 3. Recent Alerts Mini-Table Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Recent Alerts</h3>
                    <button
                      onClick={() => navigate('/admin/inbox')}
                      className="text-[10px] font-bold text-sky-600 hover:text-sky-700 uppercase tracking-wider cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-0">
                    <table className="w-full text-[11px] font-medium text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider text-left">
                          <th className="pb-2">ID</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {incidents.slice(0, 4).map((inc) => (
                          <tr
                            key={inc.id}
                            className="hover:bg-slate-50 cursor-pointer"
                            onClick={() => {
                              setSelectedIncident(inc);
                              navigate('/admin/inbox');
                            }}
                          >
                            <td className="py-2.5 font-bold text-slate-800">{inc.id.split('-').pop()}</td>
                            <td className="py-2.5">
                              {inc.status === 'PENDING' ? (
                                <span className="text-[#F57F17] flex items-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#F57F17] mr-1 inline-block"></span>
                                  Zone Breach
                                </span>
                              ) : (
                                <span className="text-[#C62828] flex items-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#C62828] mr-1 inline-block"></span>
                                  SOS Trigger
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-right text-slate-400">{inc.timestamp || 'Just now'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* B. TOURISTS DIRECTORY TABLE VIEW */}
          {adminTab === 'tourists' && (
            <div className="h-full p-8 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Tourist Directory</h2>
                  <p className="text-xs text-slate-500 mt-1">Manage and register active visitors within municipal boundaries.</p>
                </div>
              </div>

              {/* Filtering Controls Row */}
              <div className="bg-white border border-slate-200 rounded-t-xl p-4 flex items-center justify-between text-xs font-semibold text-slate-600 border-b-0 shadow-sm">
                <div className="flex items-center space-x-3">
                  <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none hover:bg-slate-100 cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SAFE">Safe Only</option>
                    <option value="CAUTION">Caution</option>
                    <option value="AT_RISK">At Risk / SOS</option>
                  </select>
                </div>
                <span className="font-bold text-slate-500">
                  Showing: {
                    localTourists.filter(t => {
                      const matchesSearch = !searchQuery.trim() || 
                        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.nationality.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesStatus = statusFilter === 'ALL' || t.safetyStatus === statusFilter || (statusFilter === 'AT_RISK' && (t.safetyStatus === 'EMERGENCY_SOS' || t.safetyStatus === 'AT_RISK'));
                      return matchesSearch && matchesStatus;
                    }).length
                  } / {localTourists.length} Active
                </span>
              </div>

              {/* Table Body Container */}
              <div className="flex-1 bg-white border border-slate-200 rounded-b-xl shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="overflow-x-auto min-h-0">
                  <table className="w-full text-left text-xs font-medium text-slate-600 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                        <th className="px-6 py-3.5">Tourist ID</th>
                        <th className="px-6 py-3.5">Name</th>
                        <th className="px-6 py-3.5">Nationality</th>
                        <th className="px-6 py-3.5">Current Status</th>
                        <th className="px-6 py-3.5">Assigned Guide</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {localTourists
                        .filter(t => {
                          const matchesSearch = !searchQuery.trim() || 
                            t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.nationality.toLowerCase().includes(searchQuery.toLowerCase());
                          const matchesStatus = statusFilter === 'ALL' || t.safetyStatus === statusFilter || (statusFilter === 'AT_RISK' && (t.safetyStatus === 'EMERGENCY_SOS' || t.safetyStatus === 'AT_RISK'));
                          return matchesSearch && matchesStatus;
                        })
                        .map((t) => {
                        let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        let badgeDot = 'bg-emerald-500';
                        if (t.safetyStatus === 'EMERGENCY_SOS' || t.safetyStatus === 'AT_RISK') {
                          badgeBg = 'bg-red-50 text-red-700 border-red-200';
                          badgeDot = 'bg-red-500';
                        } else if (t.safetyStatus === 'CAUTION') {
                          badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
                          badgeDot = 'bg-amber-500';
                        }

                        return (
                          <tr 
                            key={t.id} 
                            onClick={(e) => {
                              if ((e.target as HTMLElement).closest('button')) return;
                              setSelectedInspectorTourist(t);
                            }}
                            className="hover:bg-slate-100/70 transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4 font-mono font-bold text-slate-800 uppercase">{t.id}</td>
                            <td className="px-6 py-4 font-bold text-slate-800">{t.name}</td>
                            <td className="px-6 py-4 text-slate-500">{t.nationality}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center space-x-1 border px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeBg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badgeDot}`}></span>
                                <span>{t.safetyStatus}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {t.isSolo || t.id?.startsWith('S-') || !t.guide_id ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                  Solo Explorer
                                </span>
                              ) : (
                                <span className="text-slate-600 font-mono font-semibold text-xs">{t.guide_id}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setFocusedTouristId(t.id);
                                  navigate('/admin/dashboard');
                                }}
                                className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                                title="Locate Live on Map"
                              >
                                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Live Map</span>
                              </button>
                              <button 
                                onClick={() => setSelectedInspectorTourist(t)}
                                className="text-slate-400 hover:text-[#F27D26] transition-colors p-1.5 rounded hover:bg-orange-50 cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4 inline-block" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete tourist ${t.name}?`)) {
                                    onDeleteTourist(t.id);
                                  }
                                }}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-50 cursor-pointer"
                                title="Delete Tourist"
                              >
                                <Trash2 className="w-4 h-4 inline-block" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Pagination */}
                <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 font-semibold rounded-b-xl">
                  <span>Showing 1-{localTourists.length} of {localTourists.length}</span>
                  <div className="flex space-x-2">
                    <button className="p-1 border border-slate-300 rounded hover:bg-white text-slate-400 hover:text-slate-600">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="p-1 border border-slate-300 rounded hover:bg-white text-slate-400 hover:text-slate-600">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* C. AI RISK & ANOMALY MONITORING VIEW */}
          {adminTab === 'ai-monitoring' && (
            <div className="h-full p-6 md:p-8 flex flex-col overflow-hidden space-y-6">
              {/* Header Title & Live Badge */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-[#061E34] text-[#2CD3C3] flex items-center justify-center shadow-sm">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">AI Risk & Behavioral Anomaly Monitor</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Live multi-signal safety surveillance powered by Phase 1 XGBoost Situational Risk and Phase 3 Isolation Forest Anomaly Detection.
                  </p>
                </div>
                <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs self-start md:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">FastAPI Sentinel AI Live</span>
                </div>
              </div>

              {/* Summary KPI Cards Row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 flex-shrink-0">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Active</div>
                  <div className="text-2xl font-bold text-slate-800 font-mono mt-0.5">{localTourists.length}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Monitored Visitors</div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Nominal Safety</div>
                  <div className="text-2xl font-bold text-emerald-800 font-mono mt-0.5">
                    {localTourists.filter(t => (t.currentRiskScore || 0) <= 25 && !t.anomaly?.anomaly_detected).length}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">Low Risk & No Anomaly</div>
                </div>

                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Moderate / Advisory</div>
                  <div className="text-2xl font-bold text-amber-800 font-mono mt-0.5">
                    {localTourists.filter(t => (t.currentRiskScore || 0) > 25 && (t.currentRiskScore || 0) <= 50).length}
                  </div>
                  <div className="text-[10px] text-amber-600 mt-0.5">Elevated Caution</div>
                </div>

                <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] uppercase font-bold text-orange-700 tracking-wider">Anomalies Flagged</div>
                  <div className="text-2xl font-bold text-orange-800 font-mono mt-0.5 flex items-center gap-1">
                    <span>{localTourists.filter(t => t.anomaly?.anomaly_detected).length}</span>
                    {localTourists.some(t => t.anomaly?.anomaly_detected) && (
                      <AlertTriangle className="w-4 h-4 text-orange-600 animate-pulse" />
                    )}
                  </div>
                  <div className="text-[10px] text-orange-600 mt-0.5">Phase 3 Outliers</div>
                </div>

                <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-3.5 shadow-xs col-span-2 md:col-span-1">
                  <div className="text-[10px] uppercase font-bold text-red-700 tracking-wider">Active SOS / Critical</div>
                  <div className="text-2xl font-bold text-red-800 font-mono mt-0.5 flex items-center gap-1">
                    <span>{localTourists.filter(t => t.safetyStatus === 'EMERGENCY_SOS' || t.sosTriggered || (t.currentRiskScore || 0) > 75).length}</span>
                    {localTourists.some(t => t.safetyStatus === 'EMERGENCY_SOS' || t.sosTriggered) && (
                      <Flame className="w-4 h-4 text-red-600 animate-bounce" />
                    )}
                  </div>
                  <div className="text-[10px] text-red-600 mt-0.5">Emergency Triggers</div>
                </div>
              </div>

              {/* Table Body Container */}
              <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
                {/* Filtering Controls Row */}
                <div className="bg-slate-50 border-b border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-600">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search Name, ID, City..."
                        className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#061E34]/30 w-48"
                      />
                    </div>

                    {/* Risk Tier Filter */}
                    <select
                      value={aiRiskFilter}
                      onChange={e => setAiRiskFilter(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <option value="ALL">All Risk Tiers</option>
                      <option value="LOW">Low Risk (0–25)</option>
                      <option value="MODERATE">Moderate Risk (25–50)</option>
                      <option value="HIGH">High Risk (50–75)</option>
                      <option value="CRITICAL">Critical Risk (75–100)</option>
                    </select>

                    {/* Anomaly Filter */}
                    <select
                      value={aiAnomalyFilter}
                      onChange={e => setAiAnomalyFilter(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <option value="ALL">All Anomaly States</option>
                      <option value="DETECTED">Anomaly Detected Only</option>
                      <option value="NORMAL">Normal Behavior Only</option>
                    </select>

                    {/* SOS Filter */}
                    <select
                      value={aiSosFilter}
                      onChange={e => setAiSosFilter(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <option value="ALL">All SOS States</option>
                      <option value="SOS_ONLY">Active SOS Only</option>
                    </select>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    Live Stream: {
                      localTourists.filter(t => {
                        const q = searchQuery.toLowerCase().trim();
                        const matchesSearch = !q ||
                          t.name.toLowerCase().includes(q) ||
                          t.id.toLowerCase().includes(q) ||
                          (t.currentLocation?.address || '').toLowerCase().includes(q) ||
                          (t.nationality || '').toLowerCase().includes(q);

                        const score = t.currentRiskScore || 0;
                        const riskLevel = t.riskLevel || (score <= 25 ? 'LOW' : score <= 50 ? 'MODERATE' : score <= 75 ? 'HIGH' : 'CRITICAL');
                        const matchesRisk = aiRiskFilter === 'ALL' || riskLevel === aiRiskFilter;

                        const isAnomaly = Boolean(t.anomaly?.anomaly_detected);
                        const matchesAnomaly = aiAnomalyFilter === 'ALL' || (aiAnomalyFilter === 'DETECTED' ? isAnomaly : !isAnomaly);

                        const isSos = Boolean(t.sosTriggered || t.safetyStatus === 'EMERGENCY_SOS');
                        const matchesSos = aiSosFilter === 'ALL' || (aiSosFilter === 'SOS_ONLY' ? isSos : true);

                        return matchesSearch && matchesRisk && matchesAnomaly && matchesSos;
                      }).length
                    } / {localTourists.length} Tourists
                  </span>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0">
                  <table className="w-full min-w-[1400px] text-left text-xs font-medium text-slate-600 border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider z-10 shadow-2xs">
                      <tr>
                        <th className="px-4 py-3.5 min-w-[180px]">Tourist Name</th>
                        <th className="px-4 py-3.5 min-w-[200px]">Current GPS Location</th>
                        <th className="px-4 py-3.5 min-w-[160px]">Phase 1 Risk Score</th>
                        <th className="px-4 py-3.5 min-w-[110px]">Risk Level</th>
                        <th className="px-4 py-3.5 min-w-[140px]">Anomaly Status</th>
                        <th className="px-4 py-3.5 min-w-[120px]">Anomaly Score</th>
                        <th className="px-4 py-3.5 min-w-[250px]">Anomaly Type</th>
                        <th className="px-4 py-3.5 min-w-[110px]">Severity</th>
                        <th className="px-4 py-3.5 min-w-[130px]">Safety Status</th>
                        <th className="px-4 py-3.5 min-w-[110px]">SOS State</th>
                        <th className="px-4 py-3.5 min-w-[110px]">Last Updated</th>
                        <th className="px-4 py-3.5 text-right min-w-[100px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {localTourists
                        .filter(t => {
                          const q = searchQuery.toLowerCase().trim();
                          const matchesSearch = !q ||
                            t.name.toLowerCase().includes(q) ||
                            t.id.toLowerCase().includes(q) ||
                            (t.currentLocation?.address || '').toLowerCase().includes(q) ||
                            (t.nationality || '').toLowerCase().includes(q);

                          const score = t.currentRiskScore || 0;
                          const riskLevel = t.riskLevel || (score <= 25 ? 'LOW' : score <= 50 ? 'MODERATE' : score <= 75 ? 'HIGH' : 'CRITICAL');
                          const matchesRisk = aiRiskFilter === 'ALL' || riskLevel === aiRiskFilter;

                          const isAnomaly = Boolean(t.anomaly?.anomaly_detected);
                          const matchesAnomaly = aiAnomalyFilter === 'ALL' || (aiAnomalyFilter === 'DETECTED' ? isAnomaly : !isAnomaly);

                          const isSos = Boolean(t.sosTriggered || t.safetyStatus === 'EMERGENCY_SOS');
                          const matchesSos = aiSosFilter === 'ALL' || (aiSosFilter === 'SOS_ONLY' ? isSos : true);

                          return matchesSearch && matchesRisk && matchesAnomaly && matchesSos;
                        })
                        .map(t => {
                          const score = typeof t.currentRiskScore === 'number' ? t.currentRiskScore : 10;
                          const riskLevel = t.riskLevel || (score <= 25 ? 'LOW' : score <= 50 ? 'MODERATE' : score <= 75 ? 'HIGH' : 'CRITICAL');
                          const isAnomaly = Boolean(t.anomaly?.anomaly_detected);
                          const anomalyScore = typeof t.anomaly?.anomaly_score === 'number' ? t.anomaly.anomaly_score : 0.0;
                          const anomalyType = t.anomaly?.anomaly_type || 'NONE';
                          const anomalySeverity = (t.anomaly?.severity || 'LOW').toUpperCase();
                          const safetyStatus = t.safetyDetails?.status || t.safetyStatus || 'NORMAL';
                          const isSosActive = Boolean(t.sosTriggered || t.safetyStatus === 'EMERGENCY_SOS');

                          // Risk Level Badge Styling
                          let riskBadgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          let riskBarColor = 'bg-emerald-500';
                          if (riskLevel === 'CRITICAL') {
                            riskBadgeStyle = 'bg-red-50 text-red-700 border-red-200 animate-pulse font-bold';
                            riskBarColor = 'bg-red-500';
                          } else if (riskLevel === 'HIGH') {
                            riskBadgeStyle = 'bg-orange-50 text-orange-700 border-orange-200 font-semibold';
                            riskBarColor = 'bg-orange-500';
                          } else if (riskLevel === 'MODERATE') {
                            riskBadgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
                            riskBarColor = 'bg-amber-500';
                          }

                          // Severity Badge Styling
                          let severityStyle = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                          if (anomalySeverity === 'CRITICAL') severityStyle = 'text-red-700 bg-red-50 border-red-200 font-bold';
                          else if (anomalySeverity === 'HIGH') severityStyle = 'text-orange-700 bg-orange-50 border-orange-200 font-semibold';
                          else if (anomalySeverity === 'MODERATE') severityStyle = 'text-amber-700 bg-amber-50 border-amber-200 font-semibold';

                          // Safety Status Badge Styling
                          let safetyBadgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          if (safetyStatus === 'CRITICAL' || safetyStatus === 'EMERGENCY_SOS' || safetyStatus === 'EMERGENCY') {
                            safetyBadgeStyle = 'bg-red-50 text-red-700 border-red-200 font-bold animate-pulse';
                          } else if (safetyStatus === 'ESCALATED') {
                            safetyBadgeStyle = 'bg-orange-50 text-orange-700 border-orange-200 font-semibold';
                          } else if (safetyStatus === 'ELEVATED') {
                            safetyBadgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
                          } else if (safetyStatus === 'ADVISORY') {
                            safetyBadgeStyle = 'bg-sky-50 text-sky-700 border-sky-200 font-semibold';
                          }

                          return (
                            <tr
                              key={t.id}
                              className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                              onClick={(e) => {
                                if ((e.target as HTMLElement).closest('button')) return;
                                setSelectedInspectorTourist(t);
                              }}
                            >
                              {/* Tourist Name */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <span className="text-sm font-bold text-slate-900">{t.name}</span>
                                  {isSosActive && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" title="Active SOS"></span>
                                  )}
                                </div>
                                {t.nationality && (
                                  <span className="text-[10px] text-slate-400 font-medium">{t.nationality}</span>
                                )}
                              </td>

                              {/* Current GPS Location */}
                              <td className="px-4 py-3.5">
                                <div className="font-mono text-[11px] text-slate-700 font-semibold">
                                  {t.currentLocation ? `${t.currentLocation.lat.toFixed(4)}°, ${t.currentLocation.lng.toFixed(4)}°` : '0.0000°, 0.0000°'}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[170px]" title={t.currentLocation?.address || 'Live Location'}>
                                  {t.currentLocation?.address || 'Live Location'}
                                </div>
                              </td>

                              {/* Risk Score (0-100, 1 decimal) */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono font-bold text-slate-800 text-xs w-12">
                                    {score.toFixed(1)}/100
                                  </span>
                                  <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                                    <div
                                      className={`h-full ${riskBarColor} transition-all`}
                                      style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Risk Level */}
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${riskBadgeStyle}`}>
                                  {riskLevel}
                                </span>
                              </td>

                              {/* Anomaly Status */}
                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isAnomaly
                                      ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {isAnomaly && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
                                  {isAnomaly ? 'DETECTED' : 'NORMAL'}
                                </span>
                              </td>

                              {/* Anomaly Score (0-1) */}
                              <td className="px-4 py-3.5 font-mono text-[11px] font-semibold text-slate-700">
                                {anomalyScore.toFixed(4)}
                              </td>

                              {/* Anomaly Type */}
                              <td className="px-4 py-3.5 min-w-[250px]">
                                <span className={`font-mono text-[10px] px-2 py-1 rounded border inline-block ${
                                  anomalyType !== 'NONE'
                                    ? 'bg-slate-100 text-slate-800 font-bold border-slate-300 shadow-2xs'
                                    : 'text-slate-400 border-transparent'
                                }`}>
                                  {anomalyType}
                                </span>
                              </td>

                              {/* Anomaly Severity */}
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${severityStyle}`}>
                                  {anomalySeverity}
                                </span>
                              </td>

                              {/* Safety Status */}
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${safetyBadgeStyle}`}>
                                  {safetyStatus}
                                </span>
                              </td>

                              {/* SOS Status */}
                              <td className="px-4 py-3.5">
                                {isSosActive ? (
                                  <span className="inline-flex items-center gap-1 bg-red-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full animate-bounce shadow-xs">
                                    <Flame className="w-2.5 h-2.5" />
                                    ACTIVE SOS
                                  </span>
                                ) : (
                                  <span className="inline-flex text-[10px] text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                                    INACTIVE
                                  </span>
                                )}
                              </td>

                              {/* Last Updated */}
                              <td className="px-4 py-3.5 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                                {t.lastUpdated || (t.currentLocation?.timestamp ? new Date(t.currentLocation.timestamp).toLocaleTimeString() : 'Live')}
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={() => {
                                      setFocusedTouristId(t.id);
                                      navigate('/admin/dashboard');
                                    }}
                                    className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                    title="Locate Live on Map"
                                  >
                                    <MapPin className="w-3 h-3 text-emerald-600" />
                                    <span>Map</span>
                                  </button>
                                  <button
                                    onClick={() => setSelectedInspectorTourist(t)}
                                    className="text-slate-400 hover:text-[#061E34] transition-colors p-1 rounded hover:bg-slate-100 cursor-pointer"
                                    title="View Full Profile"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span className="text-[11px] font-mono">
                    Monitoring {localTourists.length} live telemetry streams • Real-Time AI Inference Active
                  </span>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span>Phase 1 XGBoost</span>
                    <span>•</span>
                    <span>Phase 3 Isolation Forest</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* C. INBOX INCIDENT & TOURIST CHAT TRIAGE SPLIT VIEW */}
          {adminTab === 'inbox' && (
            <div className="h-full flex overflow-hidden">
              
              {/* Left Column: Dual Mode Feeds (Incidents vs Direct Tourist Chats) */}
              <div className="w-80 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 h-full">
                {/* Mode Selector Tabs */}
                <div className="p-2.5 border-b border-slate-200 bg-slate-50 flex items-center gap-1.5">
                  <button
                    onClick={() => { setInboxTab('incidents'); setSelectedChatGuide(null); if (incidents.length > 0 && !selectedIncident) setSelectedIncident(incidents[0]); }}
                    className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      inboxTab === 'incidents'
                        ? 'bg-[#061E34] text-white shadow-xs'
                        : 'bg-slate-200/70 text-slate-600 hover:bg-slate-300/70'
                    }`}
                  >
                    <span>🚨 Incidents</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${inboxTab === 'incidents' ? 'bg-red-500 text-white' : 'bg-slate-300 text-slate-700'}`}>
                      {incidents.length}
                    </span>
                  </button>

                  <button
                    onClick={() => { setInboxTab('tourists'); setSelectedChatGuide(null); if (localTourists.length > 0 && !selectedChatTourist) setSelectedChatTourist(localTourists[0]); }}
                    className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      inboxTab === 'tourists'
                        ? 'bg-[#061E34] text-white shadow-xs'
                        : 'bg-slate-200/70 text-slate-600 hover:bg-slate-300/70'
                    }`}
                  >
                    <span>💬 Tourists</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${inboxTab === 'tourists' ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-700'}`}>
                      {localTourists.length}
                    </span>
                  </button>

                  <button
                    onClick={() => { 
                      setInboxTab('guides'); 
                      setSelectedChatTourist(null); 
                      setSelectedIncident(null);
                      const defaultGuides = guideList.length > 0 ? guideList : [{ guide_id: 'G-1001', full_name: 'Vishal Kadam', mobile_number: '+91 94111 12985', status: 'ACTIVE' }];
                      if (!selectedChatGuide) setSelectedChatGuide(defaultGuides[0]);
                    }}
                    className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      inboxTab === 'guides'
                        ? 'bg-[#061E34] text-white shadow-xs'
                        : 'bg-slate-200/70 text-slate-600 hover:bg-slate-300/70'
                    }`}
                  >
                    <span>🛡️ Guides</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${inboxTab === 'guides' ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-700'}`}>
                      {guideList.length || 1}
                    </span>
                  </button>
                </div>

                {/* Feed List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {inboxTab === 'incidents' ? (
                    incidents.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs font-semibold">
                        No active incidents in queue
                      </div>
                    ) : (
                      incidents.map((inc) => {
                        const isSelected = selectedIncident?.id === inc.id && !selectedChatTourist && !selectedChatGuide;
                        const isGuideIncident = inc.isGuideSOS || inc.touristId?.startsWith('G-') || inc.touristName?.toLowerCase().includes('guide');
                        const isActiveSOS = inc.type === 'SOS_TRIGGERED' || (inc.type as any) === 'GUIDE_SOS_TRIGGERED';

                        return (
                          <div
                            key={inc.id}
                            onClick={() => { setSelectedIncident(inc); setSelectedChatTourist(null); setSelectedChatGuide(null); }}
                            className={`p-4 cursor-pointer transition-all hover:bg-slate-50 flex flex-col space-y-1 relative border-l-4 ${
                              isSelected ? 'bg-slate-50 border-l-[#C62828]' : 'border-l-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5 truncate">
                                {isGuideIncident && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#C62828] text-white font-bold tracking-wide shrink-0">
                                    GUIDE SOS
                                  </span>
                                )}
                                <span className="truncate">{inc.touristName}</span>
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 font-mono">{inc.timestamp || 'Just now'}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">{inc.location.address || 'Unknown Location'}</div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                              {isGuideIncident 
                                ? '🚨 Guide Team SOS Triggered. Immediate rescue dispatched for tour team...' 
                                : (isActiveSOS ? '🚨 SOS Triggered. Immediate assistance requested...' : inc.description)}
                            </p>

                            {inc.mediaUrl && inc.status !== 'RESOLVED' && (
                              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  📷 Photo Evidence
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImage({ url: inc.mediaUrl!, title: `Evidence: Incident #${inc.id} (${inc.touristName})` });
                                  }}
                                  className="flex items-center gap-1 px-2 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded text-[10px] font-bold transition-colors cursor-pointer"
                                  title="View Evidence Image"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View Photo</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )
                  ) : inboxTab === 'tourists' ? (
                    (() => {
                      const getTouristLatestTimeMs = (t: TouristProfile): number => {
                        const tMsgs = [
                          ...(chatLogs[`admin_${t.id}`] || []),
                          ...(chatLogs[t.id] || [])
                        ].filter((m: any) => m.channel === 'admin' || m.recipientRole === 'admin' || m.senderRole === 'admin' || (!m.channel && !m.recipientRole));
                        if (tMsgs.length === 0) return 0;
                        const lastMsg = tMsgs[tMsgs.length - 1];
                        if (typeof lastMsg.timestamp === 'number' && !isNaN(lastMsg.timestamp)) return lastMsg.timestamp;
                        if (typeof lastMsg.timestamp === 'string' && !isNaN(Number(lastMsg.timestamp))) return Number(lastMsg.timestamp);
                        if (lastMsg.time) {
                          const today = new Date().toDateString();
                          const parsed = Date.parse(`${today} ${lastMsg.time}`);
                          if (!isNaN(parsed)) return parsed;
                        }
                        return 0;
                      };

                      const sortedTourists = [...localTourists].sort((a, b) => {
                        const timeA = getTouristLatestTimeMs(a);
                        const timeB = getTouristLatestTimeMs(b);
                        if (timeA !== timeB) return timeB - timeA; // Descending: latest first
                        return a.name.localeCompare(b.name);
                      });

                      return sortedTourists.map((t) => {
                        const isSelected = selectedChatTourist?.id === t.id && !selectedChatGuide;
                        const tMsgs = [
                          ...(chatLogs[`admin_${t.id}`] || []),
                          ...(chatLogs[t.id] || [])
                        ].filter((m: any) => m.channel === 'admin' || m.recipientRole === 'admin' || m.senderRole === 'admin' || (!m.channel && !m.recipientRole));
                        const lastMsg = tMsgs.length > 0 ? tMsgs[tMsgs.length - 1] : null;

                        let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                        if (t.safetyStatus === 'EMERGENCY_SOS' || t.safetyStatus === 'AT_RISK') {
                          badgeColor = 'bg-red-100 text-red-800 border-red-200 animate-pulse';
                        } else if (t.safetyStatus === 'CAUTION') {
                          badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                        }

                        return (
                          <div
                            key={t.id}
                            onClick={() => { setSelectedChatTourist(t); setSelectedIncident(null); setSelectedChatGuide(null); }}
                            className={`p-3.5 cursor-pointer transition-all hover:bg-slate-50 flex flex-col space-y-1 relative border-l-4 ${
                              isSelected ? 'bg-slate-50 border-l-[#061E34]' : 'border-l-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-800 truncate max-w-[140px]">{t.name}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${badgeColor}`}>
                                {t.safetyStatus || 'SAFE'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                              <span>ID: {t.id}</span>
                              <span>{lastMsg ? lastMsg.time : (t.lastUpdated || 'Active')}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {lastMsg ? lastMsg.text : 'Safety monitoring active. Tap to chat.'}
                            </p>
                          </div>
                        );
                      });
                    })()
                  ) : (
                    (() => {
                      const displayGuides = guideList.length > 0 
                        ? guideList 
                        : [{ guide_id: 'G-1001', full_name: 'Vishal Kadam', mobile_number: '+91 94111 12985', status: 'ACTIVE', languages: 'Hindi, English' }];

                      return displayGuides.map((g) => {
                        const isSelected = selectedChatGuide?.guide_id === g.guide_id;
                        const gMsgs = [
                          ...(chatLogs[`admin_${g.guide_id}`] || []),
                          ...(chatLogs[`guide_inbox_${g.guide_id}`] || []),
                          ...(chatLogs[g.guide_id] || [])
                        ];
                        const lastMsg = gMsgs.length > 0 ? gMsgs[gMsgs.length - 1] : null;

                        return (
                          <div
                            key={g.guide_id}
                            onClick={() => { setSelectedChatGuide(g); setSelectedIncident(null); setSelectedChatTourist(null); }}
                            className={`p-3.5 cursor-pointer transition-all hover:bg-slate-50 flex flex-col space-y-1 relative border-l-4 ${
                              isSelected ? 'bg-slate-50 border-l-amber-500' : 'border-l-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5 truncate max-w-[140px]">
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#061E34] text-amber-400 font-mono font-bold">GUIDE</span>
                                <span className="truncate">{g.full_name}</span>
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
                                {g.status || 'ACTIVE'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                              <span>ID: {g.guide_id}</span>
                              <span>{lastMsg ? lastMsg.time : 'Live'}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {lastMsg ? lastMsg.text : 'Official guide channel. Tap to communicate.'}
                            </p>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
              </div>

              {/* Right Column: Selected Incident / Tourist Details and Live Communication Link */}
              {(() => {
                const isSelectedGuideSOS = Boolean(
                  selectedChatGuide ||
                  selectedIncident?.isGuideSOS ||
                  selectedIncident?.touristId?.startsWith('G-') ||
                  selectedIncident?.touristName?.toLowerCase().includes('guide')
                );

                const activeSubjectTourist = selectedChatGuide ? {
                  id: selectedChatGuide.guide_id,
                  name: selectedChatGuide.full_name,
                  currentLocation: { lat: 20.5937, lng: 78.9629, address: 'India' },
                  safetyStatus: selectedChatGuide.status === 'ACTIVE' ? 'SAFE' : 'NORMAL',
                  bloodType: 'O+',
                  nationality: 'Indian',
                  age: 34,
                  mobile: selectedChatGuide.mobile_number || '+91 94111 12985',
                  email: 'guide@safeyatra.in',
                  blockchainDid: `did:safeyatra:guide:${selectedChatGuide.guide_id}`,
                  guide_id: selectedChatGuide.guide_id
                } as any : (selectedChatTourist || localTourists.find(
                  t => t.id === selectedIncident?.touristId || t.name === selectedIncident?.touristName
                ) || (selectedIncident ? {
                  id: selectedIncident.touristId,
                  name: selectedIncident.touristName,
                  currentLocation: selectedIncident.location,
                  safetyStatus: selectedIncident.severity === 'CRITICAL' ? 'EMERGENCY_SOS' : 'AT_RISK',
                  bloodType: 'O+',
                  nationality: 'Indian',
                  age: 34,
                  mobile: '+91 94111 12985',
                  email: 'guide@safeyatra.in',
                  blockchainDid: `did:safeyatra:guide:${selectedIncident.guideId || selectedIncident.touristId}`,
                  guide_id: selectedIncident.guideId || selectedIncident.touristId
                } as any : localTourists[0]));

                if (!activeSubjectTourist) {
                  return (
                    <div className="flex-1 flex items-center justify-center text-slate-400 font-semibold text-xs">
                      Select a tourist, guide, or incident from the left feed to open communication channel
                    </div>
                  );
                }

                const touristInitials = isSelectedGuideSOS ? 'G' : (activeSubjectTourist.name || 'T').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'T';
                const lat = activeSubjectTourist.currentLocation?.lat || (selectedIncident ? selectedIncident.location.lat : 30.1250);
                const lng = activeSubjectTourist.currentLocation?.lng || (selectedIncident ? selectedIncident.location.lng : 78.3180);
                const address = activeSubjectTourist.currentLocation?.address || (selectedIncident ? selectedIncident.location.address : 'Unknown Location');

                return (
                  <div className="flex-1 flex flex-col overflow-hidden h-full p-6 space-y-5">
                    
                    {/* Header Bar */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between flex-shrink-0">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                            {selectedIncident ? (isSelectedGuideSOS ? `Incident #${selectedIncident.id} (Guide Group SOS)` : `Incident #${selectedIncident.id}`) : `Direct Safety Link: ${activeSubjectTourist.name}`}
                          </h2>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                            activeSubjectTourist.safetyStatus === 'EMERGENCY_SOS' || activeSubjectTourist.safetyStatus === 'AT_RISK' || selectedIncident?.severity === 'CRITICAL'
                              ? 'bg-red-50 border-red-200 text-red-700 animate-pulse'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}>
                            {selectedIncident?.severity || activeSubjectTourist.safetyStatus || 'ACTIVE'}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1 flex space-x-3">
                          <span>{isSelectedGuideSOS ? `Guide ID: ${activeSubjectTourist.id}` : `Tourist ID: ${activeSubjectTourist.id}`}</span>
                          <span>•</span>
                          <span>
                            {isSelectedGuideSOS
                              ? 'Role: Official Tour Guide'
                              : (activeSubjectTourist.isSolo || activeSubjectTourist.id?.startsWith('S-') || !activeSubjectTourist.guide_id
                                ? 'Role: Solo Explorer (Direct Admin Link)'
                                : `Guide: ${activeSubjectTourist.guide_id || 'G-1001'}`)}
                          </span>
                          <span>•</span>
                          <span>Status: Connected</span>
                        </div>
                      </div>

                      {selectedIncident && (
                        <div className="flex items-center space-x-2">
                          <select
                            onChange={(e) => onDispatchUnit(selectedIncident.id, e.target.value, `Rescue Squad Unit`)}
                            className="bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold px-3 py-1.5 text-slate-700 focus:outline-none hover:bg-slate-100 cursor-pointer"
                          >
                            <option>Assign Unit: Unassigned</option>
                            <option value="MOUNTAIN_RESCUE">Dispatch SDRF Mountain Unit</option>
                            <option value="AMBULANCE">Dispatch Emergency Medical</option>
                            <option value="POLICE">Dispatch Tourism Police</option>
                          </select>
                          <button 
                            onClick={() => handleResolveIncident(selectedIncident.id)}
                            className="bg-[#061E34] hover:bg-[#0D2E4D] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer uppercase tracking-wider"
                          >
                            {selectedIncident.status === 'RESOLVED' ? 'Resolved ✓' : 'Resolve'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Single-line Photo Evidence Banner with Eye Button */}
                    {selectedIncident?.mediaUrl && selectedIncident?.status !== 'RESOLVED' && (
                      <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-3 flex items-center justify-between shadow-xs flex-shrink-0">
                        <div className="flex items-center gap-2.5 text-xs text-sky-950">
                          <span className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs shadow-xs">
                            📷
                          </span>
                          <div>
                            <span className="font-bold text-slate-800">Live Photo Evidence Attached</span>
                            <p className="text-[10px] text-sky-700 font-medium">Uploaded by traveler during incident report submission</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewImage({ url: selectedIncident.mediaUrl!, title: `Incident #${selectedIncident.id} Evidence - ${selectedIncident.touristName}` })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Full Photo</span>
                        </button>
                      </div>
                    )}

                    {/* Metadata Cards Row: Subject ID Card + GPS Map Card */}
                    <div className="grid grid-cols-12 gap-5 min-h-0 flex-shrink-0">
                      {/* A. Subject ID Card */}
                      <div className="col-span-6 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                            {isSelectedGuideSOS ? '🛡️ Tour Guide & Team Identity' : 'Traveler Identity'}
                          </h3>
                          <span className="text-[9px] font-mono text-slate-400">{activeSubjectTourist.blockchainDid?.slice(0, 22) || activeSubjectTourist.id}</span>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className={`w-13 h-13 rounded-xl ${isSelectedGuideSOS ? 'bg-[#061E34] text-amber-400' : 'bg-slate-800 text-white'} font-bold text-base flex items-center justify-center border border-slate-300 shadow-xs flex-shrink-0`}>
                            {touristInitials}
                          </div>
                          <div className="space-y-0.5 overflow-hidden">
                            <h4 className="font-extrabold text-sm text-slate-800 leading-tight truncate">{activeSubjectTourist.name}</h4>
                            <span className="text-[10px] text-slate-400 font-semibold font-mono">
                              {isSelectedGuideSOS ? `Guide ID: ${activeSubjectTourist.id}` : `ID: ${activeSubjectTourist.id}`}
                            </span>
                            
                            <div className="flex items-center space-x-3 pt-0.5 text-[11px] font-semibold text-slate-500">
                              {isSelectedGuideSOS ? (
                                <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                  Official Tour Guide
                                </span>
                              ) : (
                                <>
                                  <span className="flex items-center text-[#C62828]">
                                    <Droplet className="w-3 h-3 mr-0.5 fill-[#C62828]" />
                                    {activeSubjectTourist.bloodType || 'O+'}
                                  </span>
                                  <span>{activeSubjectTourist.age ? `Age: ${activeSubjectTourist.age}` : 'Adult'}</span>
                                  <span>{activeSubjectTourist.nationality || 'Indian'}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] font-medium text-slate-500 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Emergency Contact</span>
                            <div className="text-slate-800 font-bold text-xs">{activeSubjectTourist.emergencyContact || activeSubjectTourist.mobile || '+91 94111 12985'}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">{isSelectedGuideSOS ? 'Team Status' : 'Risk Score'}</span>
                            <span className={`text-xs font-mono font-bold ${isSelectedGuideSOS ? 'text-red-600' : 'text-slate-700'}`}>
                              {isSelectedGuideSOS ? 'CRITICAL RESCUE' : `${activeSubjectTourist.currentRiskScore ?? 15}/100`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* B. GPS Map Card */}
                      <div className="col-span-6 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Live GPS Coordinates</h3>
                            <span className="text-[9px] font-mono text-slate-400 block">
                              Lat: {lat.toFixed(4)}° N, Lng: {lng.toFixed(4)}° E
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold truncate max-w-[120px]">
                              {address}
                            </span>
                            <span className="bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded text-[9px] font-bold flex items-center">
                              <Battery className="w-3 h-3 mr-0.5 text-red-500 rotate-90" />
                              {activeSubjectTourist.batteryLevel ?? 85}%
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200 min-h-[95px]">
                          <InboxMap
                            lat={lat}
                            lng={lng}
                            title={activeSubjectTourist.name}
                          />
                        </div>
                      </div>
                    </div>

                    {/* C. Direct Communication Link (Chat View) */}
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col overflow-hidden min-h-0">
                      {/* Communication header status */}
                      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <span>🛡️</span>
                          <span>Direct Real-Time Message Channel ({activeSubjectTourist.name})</span>
                        </h3>
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleClearAdminChat(activeSubjectTourist.id, selectedIncident?.id, activeSubjectTourist.name)}
                            disabled={isAdminClearing}
                            title="Clear Chat History for this traveler"
                            className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{isAdminClearing ? 'Clearing...' : 'Clear Chat'}</span>
                          </button>

                          <span className="text-[10px] text-emerald-600 font-bold flex items-center uppercase font-mono">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse inline-block"></span>
                            Channel Live
                          </span>
                        </div>
                      </div>

                      {/* Dotted Grid Chat Log Container */}
                      <div
                        className="flex-1 p-5 overflow-y-auto bg-slate-50 space-y-3 relative min-h-0"
                        style={{
                          backgroundImage: 'radial-gradient(#e2e8f0 1.2px, transparent 1.2px)',
                          backgroundSize: '16px 16px'
                        }}
                      >
                        {/* System trigger notification */}
                        <div className="flex justify-center">
                          <div className="bg-slate-200/80 text-slate-700 text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                            Live Secure Channel Active • E2EE Verified
                          </div>
                        </div>

                        {/* Chat Messages */}
                        {(() => {
                          const rawList = [
                            ...(selectedIncident ? (chatLogs[selectedIncident.id] || []) : []),
                            ...(activeSubjectTourist.id ? (
                              chatLogs[`admin_${activeSubjectTourist.id}`] ||
                              chatLogs[`guide_inbox_${activeSubjectTourist.id}`] ||
                              chatLogs[activeSubjectTourist.id] ||
                              chatLogs[`conv_${activeSubjectTourist.id}_admin`] ||
                              []
                            ) : []),
                            ...(activeSubjectTourist.name ? (chatLogs[activeSubjectTourist.name] || []) : [])
                          ];

                          const getTimestampMs = (m: any): number => {
                            if (typeof m.timestamp === 'number' && !isNaN(m.timestamp)) return m.timestamp;
                            if (typeof m.timestamp === 'string' && !isNaN(Number(m.timestamp))) return Number(m.timestamp);
                            if (m.time) {
                              const today = new Date().toDateString();
                              const parsed = Date.parse(`${today} ${m.time}`);
                              if (!isNaN(parsed)) return parsed;
                            }
                            return 0;
                          };

                          const seen = new Set();
                          const uniqueMsgs = rawList.filter((m: any) => {
                            // If we are currently chatting with a tourist (not a guide), exclude internal guide<->tourist chats
                            if (!isSelectedGuideSOS && (m.channel === 'guide' || m.channel === 'guide_group') && m.senderRole !== 'admin') {
                              return false;
                            }
                            const key = (m.id && String(m.id).trim()) ? String(m.id).trim() : `${m.sender || ''}-${m.text || ''}-${m.time || ''}`;
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                          });

                          // Sort chronologically ascending
                          uniqueMsgs.sort((a, b) => getTimestampMs(a) - getTimestampMs(b));

                          if (uniqueMsgs.length === 0) {
                            return (
                              <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                                No messages yet. Send a broadcast or direct inquiry below.
                              </div>
                            );
                          }

                          return uniqueMsgs.map((msg, index) => {
                            const isOperator = msg.sender === 'Operator' || msg.sender === 'Admin' || msg.senderRole === 'admin';

                            return (
                              <div
                                key={index}
                                className={`flex ${isOperator ? 'justify-end' : 'justify-start'} items-start space-x-2.5`}
                              >
                                {!isOperator && (
                                  <div className="w-7 h-7 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-xs font-bold text-red-600 shrink-0">
                                    {(msg.sender || 'T').slice(0, 2).toUpperCase()}
                                  </div>
                                )}

                                <div className="max-w-[75%] space-y-1">
                                  <div className={`p-3 rounded-2xl shadow-xs text-xs leading-relaxed border ${
                                    isOperator
                                      ? 'bg-[#061E34] text-white border-[#0A2640] rounded-tr-none'
                                      : 'bg-white text-slate-700 border-slate-200 rounded-tl-none'
                                  }`}>
                                    <p>{msg.text}</p>
                                    {msg.mediaUrl && (
                                      <div className={`mt-2 pt-2 border-t flex items-center justify-between gap-2 ${
                                        isOperator ? 'border-white/20' : 'border-slate-200'
                                      }`}>
                                        <span className={`text-[10px] font-medium flex items-center gap-1 ${
                                          isOperator ? 'text-slate-300' : 'text-slate-500'
                                        }`}>
                                          📷 Photo Evidence
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setPreviewImage({ url: msg.mediaUrl, title: `Evidence from ${msg.sender || 'Traveler'}` })}
                                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                            isOperator
                                              ? 'bg-white/20 hover:bg-white/30 text-white'
                                              : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200'
                                          }`}
                                        >
                                          <Eye className="w-3 h-3" />
                                          <span>View Photo</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className={`text-[9px] text-slate-400 font-mono flex items-center ${isOperator ? 'justify-end' : 'justify-start'} space-x-2`}>
                                    <span>{msg.sender || 'User'}</span>
                                    <span>•</span>
                                    <span>{msg.time}</span>
                                    {msg.latency && (
                                      <>
                                        <span>•</span>
                                        <span>Latency: {msg.latency}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Chat Footer: Suggestion chips & input box */}
                      <div className="p-3.5 border-t border-slate-200 space-y-2.5 flex-shrink-0 bg-white">
                        {/* Suggestion Chips */}
                        <div className="flex space-x-2 text-[10px] font-bold uppercase tracking-wider overflow-x-auto pb-1">
                          {['Help is on the way', 'Stay where you are', 'Are you injured?', 'Please acknowledge safety check'].map((chip) => (
                            <button
                              key={chip}
                              onClick={() => handleSendChat(chip)}
                              className="bg-[#EAF0F6] hover:bg-[#D9E3ED] text-[#061E34] px-3 py-1 rounded-full transition-all border border-[#DFE7EE] cursor-pointer whitespace-nowrap"
                            >
                              "{chip}"
                            </button>
                          ))}
                        </div>

                        {/* Chat Input Text Area */}
                        <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:border-[#061E34]/30 focus-within:bg-white transition-all">
                          <textarea
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendChat(chatMessage);
                              }
                            }}
                            placeholder={`Type a message to ${activeSubjectTourist.name}...`}
                            className="flex-1 bg-transparent resize-none h-9 max-h-16 text-xs text-slate-700 placeholder-slate-400 focus:outline-none px-2 py-1"
                          />
                          <button
                            onClick={() => handleSendChat(chatMessage)}
                            className="bg-[#061E34] hover:bg-[#0D2E4D] text-white p-2 rounded-xl transition-all shadow-xs active:scale-95 flex-shrink-0 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* D. Guides Tab */}
          {adminTab === 'guides' && (
            <div className="flex-1 overflow-auto bg-[#F4F7FA] p-8">
              {!showCreateGuideForm ? (
                <div className="max-w-5xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-800">Guide Management</h2>
                    <button
                      onClick={() => { setShowCreateGuideForm(true); setCreatedGuide(null); }}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors flex items-center space-x-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Create a Guide</span>
                    </button>
                  </div>
                  
                  <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                          <th className="px-6 py-4">Guide ID</th>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Mobile</th>
                          <th className="px-6 py-4">License No</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {guideList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                              No guides created yet.
                            </td>
                          </tr>
                        ) : (
                          guideList.map(g => (
                            <tr key={g.id || g.guide_id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedGuideDetails(g)}>
                              <td className="px-6 py-4 font-mono font-bold">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedGuideDetails(g); }}
                                  className="text-sky-700 hover:text-sky-900 font-bold underline cursor-pointer flex items-center gap-1"
                                  title="Click to view full registration details"
                                >
                                  <span className="material-symbols-outlined text-sm">badge</span>
                                  <span>{g.guide_id}</span>
                                </button>
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-800">{g.full_name}</td>
                              <td className="px-6 py-4 text-slate-600">{g.mobile_number}</td>
                              <td className="px-6 py-4 text-slate-600">{g.guide_license_no}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${g.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {g.status || 'Active'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedGuideDetails(g); }}
                                    className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteGuide(g.guide_id); }}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                    title="Delete Guide"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-start">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 max-w-2xl w-full">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                        <UserPlus className="w-5 h-5 text-sky-600" />
                        <span>Create Guide Account</span>
                      </h2>
                      <button
                        onClick={() => setShowCreateGuideForm(false)}
                        className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Back to List
                      </button>
                    </div>
                    
                    {createdGuide ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 space-y-4">
                        <div className="flex items-center space-x-2 text-emerald-700 font-bold text-lg mb-2">
                          <CheckCircle className="w-5 h-5" />
                          <span>Guide Account Created Successfully</span>
                        </div>
                        <div className="space-y-2 text-sm text-slate-700">
                          <div className="flex"><span className="w-32 font-bold uppercase text-xs text-slate-500 tracking-wider">Guide ID:</span> <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-100">{createdGuide.id}</span></div>
                          <div className="flex"><span className="w-32 font-bold uppercase text-xs text-slate-500 tracking-wider">Name:</span> <span className="font-semibold">{createdGuide.fullName}</span></div>
                          <div className="flex"><span className="w-32 font-bold uppercase text-xs text-slate-500 tracking-wider">Password:</span> <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-100">{createdGuide.password}</span></div>
                          <div className="flex"><span className="w-32 font-bold uppercase text-xs text-slate-500 tracking-wider">Status:</span> <span className="text-emerald-600 font-bold uppercase">{createdGuide.status}</span></div>
                        </div>
                        <div className="mt-6 flex space-x-3">
                          <button
                            onClick={() => setCreatedGuide(null)}
                            className="bg-[#061E34] hover:bg-[#0D2E4D] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-all"
                          >
                            Create Another Guide
                          </button>
                          <button
                            onClick={() => setShowCreateGuideForm(false)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-all"
                          >
                            Back to List
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleCreateGuide} className="space-y-5 text-sm">
                        <div className="grid grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                            <input required type="text" value={guideForm.fullName} onChange={e => setGuideForm({...guideForm, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500" placeholder="e.g. Rahul Patil" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mobile Number</label>
                            <input required type="text" value={guideForm.mobileNumber} onChange={e => setGuideForm({...guideForm, mobileNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500" placeholder="e.g. 9876543210" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Guide License No</label>
                            <input required type="text" value={guideForm.licenseNo} onChange={e => setGuideForm({...guideForm, licenseNo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500" placeholder="e.g. GL-45821" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Years Experience</label>
                            <input required type="number" min="0" value={guideForm.yearsExperience} onChange={e => setGuideForm({...guideForm, yearsExperience: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500" placeholder="e.g. 5" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Languages Known</label>
                          <input required type="text" value={guideForm.languages} onChange={e => setGuideForm({...guideForm, languages: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500" placeholder="e.g. Marathi, Hindi, English" />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Password</label>
                            <button
                              type="button"
                              onClick={() => setShowGuidePassword(!showGuidePassword)}
                              className="text-[10px] font-semibold text-sky-600 hover:text-sky-700"
                            >
                              {showGuidePassword ? 'Hide' : 'Show'}
                            </button>
                          </div>
                          <input 
                            required 
                            type={showGuidePassword ? 'text' : 'password'} 
                            value={guideForm.password} 
                            onChange={e => setGuideForm({...guideForm, password: e.target.value})} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500 font-mono" 
                            placeholder="Set Password" 
                          />
                        </div>

                        <div className="pt-4 flex justify-end space-x-3">
                          <button type="button" onClick={() => setShowCreateGuideForm(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-lg transition-colors cursor-pointer shadow-sm">
                            Cancel
                          </button>
                          <button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors cursor-pointer shadow flex items-center space-x-2">
                            <span>Create Guide</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* E. TRUST VAULT SUB-TAB VIEW */}
          {adminTab === 'trust-vault' && (
            <TrustVaultView
              tourists={localTourists}
              adminDisplayName={adminDisplayName}
            />
          )}

          {/* F. E-FIR SUB-TAB VIEW */}
          {adminTab === 'efir' && (
            <AdminEFIRView
              adminDisplayName={adminDisplayName}
            />
          )}

        </main>
      </div>
      {/* 2. Detailed Profile Inspector Modal */}
      {selectedInspectorTourist && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in duration-205">
            
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xs uppercase tracking-widest text-slate-800">Tourist Profile Inspector</span>
                <span className="text-[9px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded border border-orange-200 font-mono font-bold uppercase">
                  {selectedInspectorTourist.safetyStatus}
                </span>
              </div>
              <button 
                onClick={() => setSelectedInspectorTourist(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Profile Grid */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Profile Avatar Card */}
              <div className="flex items-center space-x-4 border-b border-slate-100 pb-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 border-2 border-orange-500 flex items-center justify-center text-orange-600 font-bold text-2xl shadow-sm">
                  {selectedInspectorTourist.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">{selectedInspectorTourist.name}</h3>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono font-bold mt-1 inline-block uppercase">
                    {selectedInspectorTourist.id}
                  </span>
                </div>
              </div>

              {/* Grid 1: Personal info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Email Address</span>
                  <span className="font-mono text-[11px] text-slate-600 break-all">{selectedInspectorTourist.email || 'not provided'}</span>
                </div>
                
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Mobile No</span>
                  <span className="font-mono text-[11px] text-slate-600">{selectedInspectorTourist.mobile || selectedInspectorTourist.emergencyContact || 'not provided'}</span>
                </div>

                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Nationality (Country)</span>
                  <span className="text-slate-600 font-medium">{selectedInspectorTourist.nationality}</span>
                </div>

                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Current City</span>
                  <span className="text-slate-600 font-medium">{selectedInspectorTourist.city || 'Unknown Location'}</span>
                </div>

                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Age</span>
                  <span className="text-slate-600 font-medium">{selectedInspectorTourist.age || '25'} years old</span>
                </div>

                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Blood Group</span>
                  <span className="font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded inline-block text-[10px]">{selectedInspectorTourist.bloodType || 'O+'}</span>
                </div>
              </div>

              {/* Grid 2: Device metrics */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Device & Risk Metrics</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Battery Level</span>
                    <span className="text-slate-600 font-semibold flex items-center space-x-1.5">
                      <Battery className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{selectedInspectorTourist.batteryLevel ?? 100}%</span>
                    </span>
                  </div>

                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Risk Score</span>
                    <span className="text-slate-600 font-semibold flex items-center space-x-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                      <span>{selectedInspectorTourist.currentRiskScore ?? 10} / 100</span>
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Current GPS Location</span>
                    <span className="font-mono text-[10px] text-slate-600">
                      Latitude: {selectedInspectorTourist.currentLocation?.lat.toFixed(6)}, Longitude: {selectedInspectorTourist.currentLocation?.lng.toFixed(6)}
                      <span className="block text-[10px] text-slate-400 font-sans mt-0.5">({selectedInspectorTourist.currentLocation?.address || 'Unknown Location'})</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 3: AI Behavioral Anomaly Metrics */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phase 3 AI Behavioral Anomaly</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    selectedInspectorTourist.anomaly?.anomaly_detected
                      ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {selectedInspectorTourist.anomaly?.anomaly_detected ? 'ANOMALY DETECTED' : 'NORMAL BEHAVIOR'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Anomaly Score</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {typeof selectedInspectorTourist.anomaly?.anomaly_score === 'number'
                        ? selectedInspectorTourist.anomaly.anomaly_score.toFixed(4)
                        : '0.0000'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Anomaly Type</span>
                    <span className="font-semibold text-slate-800">
                      {selectedInspectorTourist.anomaly?.anomaly_type || 'NONE'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Anomaly Severity</span>
                    <span className="font-bold text-slate-800">
                      {selectedInspectorTourist.anomaly?.severity || 'LOW'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Safety Fusion Status</span>
                    <span className="font-bold text-slate-800">
                      {selectedInspectorTourist.safetyDetails?.status || selectedInspectorTourist.safetyStatus || 'NORMAL'}
                    </span>
                  </div>

                  {selectedInspectorTourist.safetyDetails?.decision_summary?.action_recommendation && (
                    <div className="col-span-2 text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                      <span className="font-bold text-slate-700">Action: </span>
                      {selectedInspectorTourist.safetyDetails.decision_summary.action_recommendation}
                    </div>
                  )}
                </div>
              </div>

              {/* Blockchain info */}
              <div className="col-span-2 border-t border-slate-100 pt-4 space-y-2 font-mono text-[10px] text-slate-500">
                <div>
                  <span className="block text-[9px] font-sans uppercase font-bold text-slate-400 tracking-wider mb-0.5">Decentralized DID</span>
                  <span className="text-slate-400 text-[9px] break-all select-all">{selectedInspectorTourist.blockchainDid}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-sans uppercase font-bold text-slate-400 tracking-wider mb-0.5">ZKP Identity Hash</span>
                  <span className="text-slate-400 text-[9px] break-all select-all">{selectedInspectorTourist.identityHash}</span>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const tId = selectedInspectorTourist.id;
                    setSelectedInspectorTourist(null);
                    setFocusedTouristId(tId);
                    navigate('/admin/dashboard');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>View on Live Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInspectorTourist(null)}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS PANEL ── */}
      {showNotifications && (
        <div className="fixed top-16 right-4 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[1000] flex flex-col overflow-hidden max-h-[80vh]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-[#061E34]" />
              <span className="font-extrabold text-xs uppercase tracking-widest text-slate-700">Live Notifications</span>
            </div>
            <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">No active notifications</div>
            ) : (
              notifications.map(n => {
                const iconMap = { SOS: '🆘', INCIDENT: '⚠️', MESSAGE: '💬', SAFETY: '🚧' };
                const colorMap = {
                  SOS: 'border-l-red-500 bg-red-50/50',
                  INCIDENT: 'border-l-amber-500 bg-amber-50/50',
                  MESSAGE: 'border-l-sky-500 bg-sky-50/50',
                  SAFETY: 'border-l-orange-500 bg-orange-50/50'
                };
                return (
                  <div
                    key={n.id}
                    className={`px-5 py-3.5 border-l-4 ${colorMap[n.type]} ${n.read ? 'opacity-60' : ''} cursor-pointer hover:bg-slate-50 transition-all`}
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/admin/inbox');
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-base mt-0.5">{iconMap[n.type]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 truncate">{n.title}</span>
                          <span className="text-[9px] text-slate-400 font-mono ml-2 flex-shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={() => { setShowNotifications(false); navigate('/admin/inbox'); }}
                className="text-xs font-bold text-[#061E34] hover:text-[#0A2640] uppercase tracking-wider cursor-pointer"
              >
                View Incident Inbox →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS PANEL ── */}
      {showSettings && (
        <div className="fixed top-16 right-4 w-84 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[1000] flex flex-col overflow-hidden max-h-[80vh]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-600" />
              <span className="font-extrabold text-xs uppercase tracking-widest text-slate-700">Admin Settings</span>
            </div>
            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5 overflow-y-auto">
            {/* Notification Preferences */}
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-3">Live Feed Filters</p>
              <div className="space-y-3">
                {[
                  { label: 'Critical SOS Alarms', value: settingsNotifSOS, setter: setSettingsNotifSOS },
                  { label: 'Incident Dispatches', value: settingsNotifIncident, setter: setSettingsNotifIncident },
                  { label: 'Tourist Inquiries', value: settingsNotifMessage, setter: setSettingsNotifMessage },
                  { label: 'AI Anomaly Feeds', value: settingsNotifSafety, setter: setSettingsNotifSafety },
                ].map(item => (
                  <label key={item.label} className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => item.setter(v => !v)}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 cursor-pointer ${item.value ? 'bg-[#061E34]' : 'bg-slate-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.value ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </label>
                ))}
              </div>
            </div>

            {/* Language Selector */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-2 flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> Preferred Language
              </p>
              <LanguageSelector
                role="admin"
                selectClassName="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#061E34]/40 cursor-pointer"
                showLabel={false}
              />
            </div>

            {/* System Info */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-2">Authority Node</p>
              <div className="space-y-1.5 text-[11px] text-slate-500 font-mono">
                <div className="flex justify-between"><span className="font-sans font-semibold text-slate-600">Platform:</span><span>SafeYatra v2.5</span></div>
                <div className="flex justify-between"><span className="font-sans font-semibold text-slate-600">Role:</span><span>System Administrator</span></div>
                <div className="flex justify-between"><span className="font-sans font-semibold text-slate-600">Security:</span><span className="text-emerald-600 font-bold">Encrypted TLS</span></div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 2000); }}
              className="w-full bg-[#061E34] hover:bg-[#0D2E4D] text-white text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 mt-2 cursor-pointer shadow-md"
            >
              {settingsSaved ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
              <span>{settingsSaved ? 'Settings Saved' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── PROFILE PANEL ── */}
      {showProfile && (
        <div className="fixed top-16 right-4 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[1000] flex flex-col overflow-hidden max-h-[80vh]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-slate-600" />
              <span className="font-extrabold text-xs uppercase tracking-widest text-slate-700">Admin Profile</span>
            </div>
            <button onClick={() => setShowProfile(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5 overflow-y-auto">
            {/* Avatar */}
            <div className="flex flex-col items-center space-y-2 pb-4 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-[#061E34] border-2 border-[#2CD3C3] flex items-center justify-center text-white text-2xl font-bold shadow">
                {adminDisplayName ? adminDisplayName.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800 text-sm">{adminDisplayName || 'System Administrator'}</p>
                <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mt-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Authority Command Node</span>
                </span>
              </div>
            </div>

            {/* Account Info */}
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-3">Officer Credentials</p>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center space-x-2">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-500 font-semibold">User:</span>
                  <span className="font-mono text-slate-700 truncate">{adminUsername}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-500 font-semibold">Access:</span>
                  <span className="text-slate-700">Full Clearance</span>
                </div>
              </div>
            </div>

            {/* Editable Display Name */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-2">Display Name</p>
              <input
                type="text"
                value={adminDisplayNameEdit}
                onChange={e => setAdminDisplayNameEdit(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#061E34]/40 bg-slate-50"
                placeholder="Enter display name..."
                maxLength={40}
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = adminDisplayNameEdit.trim();
                  if (trimmed) {
                    setAdminDisplayName(trimmed);
                    sessionStorage.setItem('adminDisplayName', trimmed);
                    setProfileSaved(true);
                    setTimeout(() => setProfileSaved(false), 2000);
                  }
                }}
                className="w-full mt-2 bg-[#061E34] hover:bg-[#0D2E4D] text-white text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
              >
                {profileSaved ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
                <span>{profileSaved ? 'Saved!' : 'Save Display Name'}</span>
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={async () => {
                  const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
                  if (token) {
                    try { await fetch('/api/admin/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); } catch {}
                  }
                  sessionStorage.removeItem('adminToken');
                  localStorage.removeItem('adminToken');
                  sessionStorage.removeItem('adminDisplayName');
                  setShowProfile(false);
                  onExitAdmin();
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 border border-red-200 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ═══════ Guide Registration Details Modal ═══════ */}
      {selectedGuideDetails && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-[#061E34] text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-full bg-[#1C3D5A] border-2 border-[#2CD3C3] flex items-center justify-center text-xl font-bold text-white shadow-inner">
                  {(selectedGuideDetails.full_name || 'G').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-white">{selectedGuideDetails.full_name}</h2>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border border-emerald-400/30">
                      {selectedGuideDetails.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-[#8FA5C0] font-mono mt-0.5">
                    Guide ID: <span className="text-[#2CD3C3] font-bold">{selectedGuideDetails.guide_id}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedGuideDetails(null)}
                className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
              <div>
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-sky-600">badge</span>
                  Registration & Identity Profile
                </h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Full Registered Name</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedGuideDetails.full_name}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Official Guide ID</span>
                    <span className="font-mono font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded inline-block text-xs">
                      {selectedGuideDetails.guide_id}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Mobile Number</span>
                    <span className="font-semibold text-slate-800">📞 {selectedGuideDetails.mobile_number || selectedGuideDetails.mobileNumber || 'N/A'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Guide License No</span>
                    <span className="font-mono font-semibold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded inline-block text-xs">
                      🪪 {selectedGuideDetails.guide_license_no || selectedGuideDetails.licenseNo || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Years of Experience</span>
                    <span className="font-semibold text-slate-800">
                      ⏳ {selectedGuideDetails.years_of_experience || selectedGuideDetails.yearsExperience || 5} Years
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Languages Known</span>
                    <span className="font-semibold text-slate-800">
                      🗣️ {selectedGuideDetails.languages_known || selectedGuideDetails.languages || 'Marathi, Hindi, English'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned Tourists Summary */}
              <div>
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-emerald-600">groups</span>
                  Assigned Tourists ({localTourists.filter(t => t.guide_id === selectedGuideDetails.guide_id || t.assignedGuide?.guide_id === selectedGuideDetails.guide_id || t.assignedGuide?.full_name === selectedGuideDetails.full_name).length})
                </h3>
                <div className="space-y-2">
                  {(() => {
                    const assigned = localTourists.filter(
                      t => t.guide_id === selectedGuideDetails.guide_id || t.assignedGuide?.guide_id === selectedGuideDetails.guide_id || t.assignedGuide?.full_name === selectedGuideDetails.full_name
                    );
                    if (assigned.length === 0) {
                      return (
                        <div className="text-center py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs font-semibold">
                          No active tourists assigned currently
                        </div>
                      );
                    }
                    return assigned.map(t => (
                      <div key={t.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{t.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2 font-mono">({t.id})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.safetyStatus === 'EMERGENCY_SOS'
                            ? 'bg-red-100 text-red-700 animate-pulse'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {t.safetyStatus || 'SAFE'}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button
                onClick={() => setSelectedGuideDetails(null)}
                className="bg-[#061E34] hover:bg-[#0D2E4D] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PHOTO EVIDENCE LIGHTBOX MODAL ── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">📸</span>
                <h3 className="font-bold text-sm text-slate-100 truncate">{previewImage.title || 'Incident Photo Evidence'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Body */}
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/60 min-h-[300px]">
              <img
                src={previewImage.url}
                alt="Incident Photo Evidence"
                className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-2xl border border-slate-700/60"
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 bg-slate-800 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protected evidentiary photo attached by tourist. Deleted automatically upon resolving.</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
