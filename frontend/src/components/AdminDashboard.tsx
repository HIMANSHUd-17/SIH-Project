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
  Map
} from 'lucide-react';
import { DynamicGeofence, EmergencyService, IncidentReport, TouristProfile } from '../types';

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
}> = ({ tourists, geofences, incidents, emergencyServices }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Rishikesh coordinates
    const map = L.map(containerRef.current, {
      center: [30.1300, 78.3200],
      zoom: 12,
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

  // Update layers when data updates without rebuilding the whole map (BUG-014 fix)
  useEffect(() => {
    if (!layerGroupRef.current) return;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

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
      }).bindPopup(`<b>${fence.name}</b><br/>Radius: ${fence.currentRadiusMeters}m`).addTo(layerGroup);
    });

    // Emergency Services
    emergencyServices.forEach(es => {
      const icon = L.divIcon({
        className: 'es-icon',
        html: `<div style="background:#0284c7; color:white; padding:4px 8px; border-radius:6px; font-weight:bold; font-size:10px; border:1px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3);">
          🏥 ${es.name.split(' ')[0]}
        </div>`,
        iconAnchor: [30, 15]
      });
      L.marker([es.location.lat, es.location.lng], { icon })
        .bindPopup(`<b>${es.name}</b><br/>Phone: ${es.phone}`)
        .addTo(layerGroup);
    });

    // Tourists
    tourists.forEach(t => {
      let pinColor = '#10b981';
      if (t.safetyStatus === 'EMERGENCY_SOS') pinColor = '#ef4444';
      else if (t.safetyStatus === 'AT_RISK') pinColor = '#f97316';
      else if (t.safetyStatus === 'CAUTION') pinColor = '#f59e0b';

      const icon = L.divIcon({
        className: 'tourist-dot',
        html: `<div style="
          width:16px; height:16px; background:${pinColor}; border:2px solid white; border-radius:50%; box-shadow: 0 0 6px ${pinColor};
        "></div>`,
        iconAnchor: [8, 8]
      });

      L.marker([t.currentLocation.lat, t.currentLocation.lng], { icon })
        .bindPopup(`
          <div>
            <strong>${t.name}</strong><br/>
            Status: <b style="color:${pinColor}">${t.safetyStatus}</b><br/>
            Risk Score: <b>${t.currentRiskScore}/100</b>
          </div>
        `)
        .addTo(layerGroup);
    });

    // Incidents
    incidents.forEach(inc => {
      const icon = L.divIcon({
        className: 'inc-icon',
        html: `<div style="background:#dc2626; color:white; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid white; animation: pulse 1s infinite; font-size: 12px;">
          🚨
        </div>`,
        iconAnchor: [13, 13]
      });

      L.marker([inc.location.lat, inc.location.lng], { icon })
        .bindPopup(`
          <div>
            <strong style="color:#dc2626">${inc.id} - ${inc.type}</strong><br/>
            Tourist: ${inc.touristName}<br/>
            Severity: <b>${inc.severity}</b>
          </div>
        `)
        .addTo(layerGroup);
    });
  }, [tourists, geofences, incidents, emergencyServices]);

  return <div ref={containerRef} className="w-full h-full rounded-xl z-10" />;
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
  let adminTab: 'overview' | 'tourists' | 'inbox' | 'guides' = 'overview';
  if (location.pathname.endsWith('/tourists')) adminTab = 'tourists';
  else if (location.pathname.endsWith('/inbox')) adminTab = 'inbox';
  else if (location.pathname.endsWith('/guides')) adminTab = 'guides';

  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(incidents[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SAFE' | 'CAUTION' | 'AT_RISK'>('ALL');
  const [localTourists, setLocalTourists] = useState<TouristProfile[]>(tourists);
  const [chatMessage, setChatMessage] = useState('');

  const [selectedInspectorTourist, setSelectedInspectorTourist] = useState<TouristProfile | null>(null);

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

  useEffect(() => {
    if (adminTab === 'guides') {
      fetchGuides();
    }
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
          setSelectedIncident(prev => prev ? { ...prev, status: 'RESOLVED' } : null);
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

  // Chat message send handler
  // Chat message send handler (Isolated Admin Channel)
  const handleSendChat = async (text: string) => {
    if (!selectedIncident || !text.trim()) return;
    const incId = selectedIncident.id;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newMsg = {
      sender: 'Operator',
      senderRole: 'admin',
      recipientRole: 'tourist',
      channel: 'admin',
      text: text.trim(),
      time: timestamp,
      touristId: selectedIncident.touristId,
      incidentId: incId
    };

    if (setChatLogs) {
      setChatLogs(prev => ({
        ...prev,
        [incId]: [...(prev[incId] || []), newMsg],
        ...(selectedIncident.touristId ? { [`admin_${selectedIncident.touristId}`]: [...(prev[`admin_${selectedIncident.touristId}`] || []), newMsg] } : {})
      }));
    }
    setChatMessage('');

    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: incId,
          touristId: selectedIncident.touristId,
          touristName: selectedIncident.touristName,
          sender: 'Operator',
          senderRole: 'admin',
          recipientRole: 'tourist',
          channel: 'admin',
          text: text.trim(),
          time: timestamp
        })
      });
    } catch (err) {
      console.error('Failed to post admin chat message to server:', err);
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
            <button className="text-slate-400 hover:text-slate-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500"></span>
            </button>

            <button className="text-slate-400 hover:text-slate-600">
              <Settings className="w-5 h-5" />
            </button>

            {/* Profile Avatar */}
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
              alt="User profile avatar"
              className="w-8 h-8 rounded-full border border-slate-300 shadow-sm"
            />
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
                            <td className="px-6 py-4 text-slate-500 font-mono font-semibold">{t.guide_id || 'G-1001'}</td>
                            <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                              <button 
                                onClick={() => setSelectedInspectorTourist(t)}
                                className="text-slate-400 hover:text-[#F27D26] transition-colors p-1 rounded hover:bg-orange-50 cursor-pointer"
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
                                className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 cursor-pointer"
                                title="Delete Tourist"
                              >
                                <Trash2 className="w-4 h-4 inline-block" />
                              </button>
                              <button className="text-slate-400 hover:text-slate-600 p-1">
                                <MoreVertical className="w-4 h-4 inline-block" />
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

          {/* C. INBOX INCIDENT TRIAGE SPLIT VIEW */}
          {adminTab === 'inbox' && (
            <div className="h-full flex overflow-hidden">
              
              {/* Left Column list of incidents */}
              <div className="w-80 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 h-full">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Live Feed</h3>
                  <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    {incidents.length} Active
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {incidents.map((inc) => {
                    const isSelected = selectedIncident?.id === inc.id;
                    const isActiveSOS = inc.type === 'SOS_TRIGGERED';

                    return (
                      <div
                        key={inc.id}
                        onClick={() => setSelectedIncident(inc)}
                        className={`p-4 cursor-pointer transition-all hover:bg-slate-50 flex flex-col space-y-1 relative border-l-4 ${
                          isSelected ? 'bg-slate-50 border-l-[#C62828]' : 'border-l-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800">{inc.touristName}</span>
                          <span className="text-[9px] font-bold text-slate-400 font-mono">{inc.timestamp || 'Just now'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">Tapovan, Rishikesh</div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                          {isActiveSOS ? 'SOS Triggered. Immediate assistance...' : inc.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Incident Details and triage panel */}
              {selectedIncident ? (
                <div className="flex-1 flex flex-col overflow-hidden h-full p-6 space-y-6">
                  
                  {/* Detailed Incident header bar */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Incident #{selectedIncident.id}</h2>
                        <span className="bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                          {selectedIncident.severity}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1 flex space-x-3">
                        <span>Opened: {selectedIncident.timestamp || '10:42 AM'}</span>
                        <span>•</span>
                        <span>Elapsed: 00:04:32</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        onChange={(e) => onDispatchUnit(selectedIncident.id, e.target.value, `Rescue Squad Unit`)}
                        className="bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 focus:outline-none hover:bg-slate-100 cursor-pointer"
                      >
                        <option>Assign Unit: Unassigned</option>
                        <option value="MOUNTAIN_RESCUE">Dispatch SDRF Mountain Unit</option>
                        <option value="AMBULANCE">Dispatch Emergency Medical</option>
                        <option value="POLICE">Dispatch Tourism Police</option>
                      </select>
                      <button 
                        onClick={() => handleResolveIncident(selectedIncident.id)}
                        className="bg-[#061E34] hover:bg-[#0D2E4D] text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow cursor-pointer uppercase tracking-wider"
                      >
                        {selectedIncident.status === 'RESOLVED' ? 'Resolved ✓' : 'Resolve'}
                      </button>
                    </div>
                  </div>

                  {/* Metadata Cards Row: Subject ID Card + GPS Map Card — BUG-020 fix: real dynamic data */}
                  {(() => {
                    const subjectTourist = localTourists.find(
                      t => t.id === selectedIncident.touristId || t.name === selectedIncident.touristName
                    );
                    const touristInitials = (selectedIncident.touristName || 'T').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                    return (
                      <div className="grid grid-cols-12 gap-6 min-h-0 flex-shrink-0">
                        {/* A. Subject ID Card */}
                        <div className="col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Subject ID</h3>
                            <span className="text-[9px] font-mono text-slate-400">{subjectTourist?.blockchainDid?.slice(0, 18) || selectedIncident.id}</span>
                          </div>

                          <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 rounded-xl bg-slate-800 text-white font-bold text-lg flex items-center justify-center border border-slate-300 shadow-sm flex-shrink-0">
                              {touristInitials}
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-sm text-slate-800 leading-none">{selectedIncident.touristName}</h4>
                              <span className="text-[10px] text-slate-400 font-semibold font-mono">ID: {subjectTourist?.id || selectedIncident.touristId}</span>
                              
                              <div className="flex items-center space-x-4 pt-1 text-[11px] font-semibold text-slate-500">
                                <span className="flex items-center text-[#C62828]">
                                  <Droplet className="w-3.5 h-3.5 mr-0.5 fill-[#C62828]" />
                                  {subjectTourist?.bloodType || 'O+'}
                                </span>
                                <span>{subjectTourist?.age ? `Age: ${subjectTourist.age}` : (subjectTourist?.nationality ? `Nat: ${subjectTourist.nationality}` : 'Verified')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-[11px] font-medium text-slate-500 pt-2 border-t border-slate-100">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Emergency Contact / Phone</span>
                            <div className="text-slate-800 font-bold">{subjectTourist?.emergencyContact || subjectTourist?.mobile || 'Emergency Helpline 112'}</div>
                            <div className="text-slate-500 font-mono mt-0.5">{subjectTourist?.email || subjectTourist?.mobile || '+91 135 246 2000'}</div>
                          </div>
                        </div>

                        {/* B. GPS Map Card */}
                        <div className="col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Last Known Location</h3>
                              <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                                Lat: {selectedIncident.location.lat.toFixed(4)}° N, Lng: {selectedIncident.location.lng.toFixed(4)}° E
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5">
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold">
                                {selectedIncident.location.address || 'Rishikesh Zone'}
                              </span>
                              <span className="bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded text-[9px] font-bold flex items-center">
                                <Battery className="w-3 h-3 mr-0.5 text-red-500 rotate-90" />
                                {subjectTourist?.batteryLevel ?? 85}%
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200 min-h-[110px]">
                            <InboxMap
                              lat={selectedIncident.location.lat}
                              lng={selectedIncident.location.lng}
                              title={selectedIncident.touristName}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* C. Direct Communication Link (Chat View) */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden min-h-0">
                    {/* Communication header status */}
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center">
                        🛡️ Direct Communication Link
                      </h3>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center uppercase font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse inline-block"></span>
                        Connection Stable
                      </span>
                    </div>

                    {/* Dotted Grid Chat Log Container */}
                    <div
                      className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-4 relative min-h-0"
                      style={{
                        backgroundImage: 'radial-gradient(#e2e8f0 1.2px, transparent 1.2px)',
                        backgroundSize: '16px 16px'
                      }}
                    >
                      {/* System trigger notification */}
                      <div className="flex justify-center">
                        <div className="bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                          SOS Triggered - 14:02:11
                        </div>
                      </div>

                      {/* Chat Messages */}
                      {(() => {
                        const rawList = [
                          ...(chatLogs[selectedIncident.id] || []),
                          ...(selectedIncident.touristId ? (chatLogs[`admin_${selectedIncident.touristId}`] || chatLogs[selectedIncident.touristId] || []) : []),
                          ...(selectedIncident.touristName ? (chatLogs[selectedIncident.touristName] || []) : [])
                        ];
                        const seen = new Set();
                        const uniqueMsgs = rawList.filter((m: any) => {
                          // Exclude messages intended solely for tour guide
                          if (m.channel === 'guide' || m.recipientRole === 'guide' || m.senderRole === 'guide') {
                            return false;
                          }
                          const key = `${m.id || ''}-${m.sender}-${m.text}-${m.time}`;
                          if (seen.has(key)) return false;
                          seen.add(key);
                          return true;
                        });

                        return uniqueMsgs.map((msg, index) => {
                          const isOperator = msg.sender === 'Operator' || msg.sender === 'Admin';

                          return (
                            <div
                              key={index}
                              className={`flex ${isOperator ? 'justify-end' : 'justify-start'} items-start space-x-3`}
                            >
                              {!isOperator && (
                                <div className="w-8 h-8 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-xs font-bold text-red-600 shrink-0">
                                  {msg.sender.slice(0, 2).toUpperCase()}
                                </div>
                              )}

                              <div className="max-w-[70%] space-y-1">
                                <div className={`p-3.5 rounded-2xl shadow-sm text-xs leading-relaxed border ${
                                  isOperator
                                    ? 'bg-[#061E34] text-white border-[#0A2640] rounded-tr-none'
                                    : 'bg-white text-slate-700 border-slate-200 rounded-tl-none'
                                }`}>
                                  <p>{msg.text}</p>
                                </div>
                                <div className={`text-[9px] text-slate-400 font-mono flex items-center ${isOperator ? 'justify-end' : 'justify-start'} space-x-2`}>
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
                    <div className="p-4 border-t border-slate-200 space-y-3 flex-shrink-0">
                      {/* Suggestion Chips */}
                      <div className="flex space-x-2 text-[10px] font-bold uppercase tracking-wider">
                        {['Help is on the way', 'Stay where you are', 'Are you injured?'].map((chip) => (
                          <button
                            key={chip}
                            onClick={() => handleSendChat(chip)}
                            className="bg-[#EAF0F6] hover:bg-[#D9E3ED] text-[#061E34] px-3.5 py-1.5 rounded-full transition-all border border-[#DFE7EE] cursor-pointer"
                          >
                            "{chip}"
                          </button>
                        ))}
                      </div>

                      {/* Chat Input Text Area */}
                      <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:border-[#061E34]/30 focus-within:bg-white transition-all">
                        <textarea
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendChat(chatMessage);
                            }
                          }}
                          placeholder="Type a message to the tourist..."
                          className="flex-1 bg-transparent resize-none h-10 max-h-16 text-xs text-slate-700 placeholder-slate-400 focus:outline-none px-2 py-1"
                        />
                        <button
                          onClick={() => handleSendChat(chatMessage)}
                          className="bg-[#061E34] hover:bg-[#0D2E4D] text-white p-2.5 rounded-xl transition-all shadow active:scale-95 flex-shrink-0 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 font-semibold">
                  Select an incident from the Live Feed to display triage controls
                </div>
              )}
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
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {guideList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                              No guides created yet.
                            </td>
                          </tr>
                        ) : (
                          guideList.map(g => (
                            <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-mono font-bold text-sky-700">{g.guide_id}</td>
                              <td className="px-6 py-4 font-medium text-slate-800">{g.full_name}</td>
                              <td className="px-6 py-4 text-slate-600">{g.mobile_number}</td>
                              <td className="px-6 py-4 text-slate-600">{g.guide_license_no}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${g.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {g.status}
                                </span>
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
                  <span className="text-slate-600 font-medium">{selectedInspectorTourist.city || 'Rishikesh'}</span>
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
                      <span className="block text-[10px] text-slate-400 font-sans mt-0.5">({selectedInspectorTourist.currentLocation?.address || 'Tapovan, Rishikesh'})</span>
                    </span>
                  </div>
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
              <div className="flex justify-end pt-4 border-t border-slate-100">
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
    </div>
  );
};
