import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import {
  Users, CheckCircle, AlertTriangle, Map, RefreshCw, BellRing,
  MapPin, BatteryWarning, Clock, CloudRain, CheckCircle2,
  Flame, MessageSquare, PhoneCall, ShieldAlert, Activity
} from 'lucide-react';
import { IncidentReport, TouristProfile } from '../../types';
import { GUIDE_ALERTS, GuideAlert } from '../../data/mockData';

interface GuideOverviewProps {
  tourists: TouristProfile[];
  incidents?: IncidentReport[];
}

const alertIconMap: Record<GuideAlert['icon'], React.ReactNode> = {
  geofence: <MapPin className="w-5 h-5" />,
  battery: <BatteryWarning className="w-5 h-5" />,
  schedule: <Clock className="w-5 h-5" />,
  check: <CheckCircle2 className="w-5 h-5" />,
  weather: <CloudRain className="w-5 h-5" />,
};

const GuideLiveMap: React.FC<{
  tourists: TouristProfile[];
  incidents?: IncidentReport[];
  focusedTouristId?: string | null;
}> = ({ tourists, incidents, focusedTouristId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const [selectedId, setSelectedId] = useState<string>(focusedTouristId || '');

  // Initialize Map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let centerLat = 30.1250;
    let centerLng = 78.3180;
    
    if (tourists.length > 0 && tourists[0].currentLocation?.lat) {
      centerLat = tourists[0].currentLocation.lat;
      centerLng = tourists[0].currentLocation.lng;
    }

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

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
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
      }
    }
  };

  const focusTourist = (tId: string) => {
    setSelectedId(tId);
    const target = tourists.find(t => t.id === tId);
    if (target && mapRef.current && target.currentLocation?.lat && target.currentLocation?.lng) {
      mapRef.current.flyTo([target.currentLocation.lat, target.currentLocation.lng], 16, { animate: true, duration: 1.2 });
      const marker = markersRef.current[target.id];
      if (marker) marker.openPopup();
    }
  };

  useEffect(() => {
    if (!layerGroupRef.current) return;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();
    markersRef.current = {};

    tourists.forEach(t => {
      if (!t.currentLocation || typeof t.currentLocation.lat !== 'number' || typeof t.currentLocation.lng !== 'number' || t.currentLocation.lat === 0) {
        return;
      }

      const hasActiveIncident = incidents?.some(
        i => (i.touristId === t.id || i.touristName === t.name) && i.status !== 'RESOLVED'
      );

      let pinColor = '#10B981'; // Green (SAFE)
      if (t.safetyStatus === 'CAUTION') pinColor = '#F59E0B'; // Yellow
      if (t.safetyStatus === 'EMERGENCY_SOS' || t.safetyStatus === 'AT_RISK' || hasActiveIncident) {
        pinColor = '#EF4444'; // Red
      }

      const icon = L.divIcon({
        className: 'custom-guide-tourist-pin',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              background: #003d9b; color: #ffffff; padding: 2px 6px; border-radius: 10px;
              font-size: 10px; font-weight: 700; border: 1.5px solid ${pinColor};
              box-shadow: 0 2px 5px rgba(0,0,0,0.3); white-space: nowrap; margin-bottom: 2px;
              display: flex; align-items: center; gap: 3px;
            ">
              <span style="width: 5px; height: 5px; border-radius: 50%; background: ${pinColor}; display: inline-block; ${hasActiveIncident ? 'animation: ping 1s infinite;' : ''}"></span>
              <span>${t.name.split(' ')[0]}</span>
            </div>
            <div style="
              width: 22px; height: 22px; background: ${pinColor}; border: 2.5px solid #ffffff;
              border-radius: 50%; box-shadow: 0 0 8px ${pinColor};
              display: flex; align-items: center; justify-content: center; color: #ffffff;
              font-size: 10px; font-weight: bold;
            ">
              ${hasActiveIncident ? '🚨' : '👤'}
            </div>
          </div>
        `,
        iconAnchor: [11, 32],
        popupAnchor: [0, -32]
      });

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 12px; min-width: 200px; line-height: 1.4; color: #1e293b;">
          <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px;">${t.name}</div>
          <div style="margin-bottom: 4px;">Status: <b style="color: ${pinColor}">${hasActiveIncident ? '🚨 ACTIVE INCIDENT' : t.safetyStatus}</b> (Risk: ${t.currentRiskScore}/100)</div>
          <div style="margin-bottom: 4px; color: #475569;">📍 ${t.currentLocation.address || 'Live Telemetry'}</div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; margin-bottom: 4px;">
            GPS: ${t.currentLocation.lat.toFixed(5)}° N, ${t.currentLocation.lng.toFixed(5)}° E
          </div>
          <div style="font-size: 10px; color: #94a3b8;">Battery: ${t.batteryLevel ?? 100}% • Updated: ${t.lastUpdated || 'Just now'}</div>
        </div>
      `;

      const marker = L.marker([t.currentLocation.lat, t.currentLocation.lng], { icon })
        .addTo(layerGroup)
        .bindPopup(popupContent);

      markersRef.current[t.id] = marker;
    });
  }, [tourists, incidents]);

  useEffect(() => {
    if (focusedTouristId) {
      focusTourist(focusedTouristId);
    }
  }, [focusedTouristId]);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-2.5 right-2.5 z-[1000] flex items-center gap-2 pointer-events-auto">
        <select
          value={selectedId}
          onChange={(e) => focusTourist(e.target.value)}
          className="bg-white/95 border border-gd-outline-var text-gd-primary text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm focus:outline-none cursor-pointer"
        >
          <option value="">🎯 Focus Member...</option>
          {tourists.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.currentLocation.address ? t.currentLocation.address.split(',')[0] : `${t.currentLocation.lat.toFixed(2)}, ${t.currentLocation.lng.toFixed(2)}`})
            </option>
          ))}
        </select>
        <button
          onClick={fitAllTourists}
          className="bg-gd-primary hover:opacity-90 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Fit Group
        </button>
      </div>
      <div ref={containerRef} className="absolute inset-0 z-0" />
    </div>
  );
};

export const GuideOverview: React.FC<GuideOverviewProps> = ({ tourists, incidents = [] }) => {
  const [alertFilter, setAlertFilter] = useState<'all' | 'caution' | 'system'>('all');
  const navigate = useNavigate();

  const safeTourists = tourists.filter(t => t.safetyStatus === 'SAFE');
  const cautionTourists = tourists.filter(t =>
    t.safetyStatus === 'CAUTION' || t.safetyStatus === 'AT_RISK' || t.safetyStatus === 'EMERGENCY_SOS'
  );

  // Group-specific active incidents
  const groupTouristIds = new Set(tourists.map(t => t.id));
  const activeGroupIncidents = incidents.filter(
    i => (groupTouristIds.has(i.touristId) || tourists.some(t => t.name === i.touristName)) && i.status !== 'RESOLVED'
  );

  const cautionCount = cautionTourists.length;
  const safeCount = safeTourists.length;

  // Convert real incidents into dynamic alert objects
  const dynamicIncidentAlerts = activeGroupIncidents.map(inc => ({
    id: `inc-alert-${inc.id}`,
    title: `🚨 Emergency SOS: ${inc.touristName}`,
    description: inc.description || 'Immediate emergency response reported by tourist.',
    time: inc.timestamp || 'Just now',
    type: 'caution' as const,
    icon: 'geofence' as const,
    hasAction: true,
    isIncident: true,
    touristId: inc.touristId,
    severity: inc.severity
  }));

  const allAlerts = [...dynamicIncidentAlerts, ...GUIDE_ALERTS];

  const filteredAlerts = alertFilter === 'all'
    ? allAlerts
    : allAlerts.filter(a => a.type === alertFilter);

  return (
    <div className="grid grid-cols-12 gap-4 content-start">
      {/* ═══ Top Banner for Active Incidents ═══ */}
      {activeGroupIncidents.length > 0 && (
        <div className="col-span-12 bg-red-600 text-white p-4 rounded-xl shadow-lg border border-red-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base uppercase tracking-wide flex items-center gap-2">
                <span>Critical Alert ({activeGroupIncidents.length} Active Incident{activeGroupIncidents.length > 1 ? 's' : ''})</span>
              </h3>
              <p className="text-xs text-red-100 mt-0.5">
                {activeGroupIncidents.map(i => `${i.touristName}: "${i.description}"`).join(' | ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => navigate('/guide/chat')}
              className="bg-white text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
            >
              <MessageSquare className="w-4 h-4" /> Open Group Chat
            </button>
          </div>
        </div>
      )}

      {/* Page Title */}
      <div className="col-span-12 flex justify-between items-end mb-2">
        <div>
          <h1 className="text-[32px] leading-[40px] font-bold tracking-tight text-gd-primary font-guide">
            Group Status Overview
          </h1>
          <p className="text-gd-on-surface-var text-base">
            Real-time telemetry and safety tracking for assigned group
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-1.5 bg-gd-surface-top border border-gd-outline-var rounded-md text-[13px] font-medium hover:bg-gd-surface-variant transition-colors flex items-center gap-1.5 text-gd-on-surface cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Sync Now
        </button>
      </div>

      {/* ═══ Left Column: Summary + Map ═══ */}
      <div className="col-span-12 xl:col-span-8 flex flex-col gap-4">
        {/* Status Summary Bento */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Members */}
          <div className="bg-gd-surface p-4 rounded-xl border border-gd-outline-var flex flex-col justify-between min-h-[110px]">
            <div className="flex justify-between items-start">
              <span className="text-[12px] font-medium text-gd-on-surface-var uppercase tracking-wide">
                Total Group
              </span>
              <Users className="w-4 h-4 text-gd-outline" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-[28px] leading-[36px] font-bold text-gd-primary">{tourists.length}</span>
              <span className="text-xs text-gd-on-surface-var">Tourists</span>
            </div>
          </div>

          {/* Safe Status */}
          <div className="bg-gd-surface p-4 rounded-xl border border-gd-outline-var flex flex-col justify-between relative overflow-hidden min-h-[110px]">
            <div className="absolute top-0 left-0 w-1 h-full bg-gd-secondary" />
            <div className="flex justify-between items-start pl-2">
              <span className="text-[12px] font-medium text-gd-on-surface-var uppercase tracking-wide">
                Safe
              </span>
              <CheckCircle className="w-4 h-4 text-gd-secondary" />
            </div>
            <div className="mt-2 flex items-baseline gap-1 pl-2">
              <span className="text-[28px] leading-[36px] font-bold text-gd-secondary">{safeCount}</span>
              <span className="text-xs text-gd-on-surface-var">In Zone</span>
            </div>
          </div>

          {/* AI Anomalies Flagged */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between min-h-[110px] ${
            tourists.some(t => t.anomaly?.anomaly_detected)
              ? 'bg-amber-50 border-amber-300'
              : 'bg-gd-surface border-gd-outline-var'
          }`}>
            <div className="flex justify-between items-start">
              <span className={`text-[12px] font-bold uppercase tracking-wide ${
                tourists.some(t => t.anomaly?.anomaly_detected) ? 'text-amber-900' : 'text-gd-on-surface-var'
              }`}>
                Anomalies
              </span>
              <Activity className={`w-4 h-4 ${
                tourists.some(t => t.anomaly?.anomaly_detected) ? 'text-amber-600 animate-pulse' : 'text-gd-outline'
              }`} />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={`text-[28px] leading-[36px] font-bold ${
                tourists.some(t => t.anomaly?.anomaly_detected) ? 'text-amber-900' : 'text-gd-primary'
              }`}>
                {tourists.filter(t => t.anomaly?.anomaly_detected).length}
              </span>
              <span className="text-xs text-gd-on-surface-var">Flagged</span>
            </div>
          </div>

          {/* Caution / Incident Status */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between relative shadow-sm min-h-[110px] ${
            activeGroupIncidents.length > 0
              ? 'bg-red-50 border-red-300'
              : 'bg-gd-warn border-gd-warn-dim'
          }`}>
            <div className="flex justify-between items-start">
              <span className={`text-[12px] font-bold uppercase tracking-wide ${
                activeGroupIncidents.length > 0 ? 'text-red-700' : 'text-gd-warn-ctr'
              }`}>
                {activeGroupIncidents.length > 0 ? 'Incidents' : 'Caution'}
              </span>
              <AlertTriangle className={`w-4 h-4 fill-current ${
                activeGroupIncidents.length > 0 ? 'text-red-600' : 'text-gd-warn-ctr'
              }`} />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={`text-[28px] leading-[36px] font-bold ${
                activeGroupIncidents.length > 0 ? 'text-red-700' : 'text-gd-warn-ctr'
              }`}>
                {activeGroupIncidents.length > 0 ? activeGroupIncidents.length : cautionCount}
              </span>
              <span className="text-xs text-gd-on-warn-ctr font-semibold">
                {activeGroupIncidents.length > 0 ? 'Urgent' : 'Lagging'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Group Map */}
        <div className="bg-gd-surface rounded-xl border border-gd-outline-var flex flex-col h-[500px] overflow-hidden">
          {/* Map Header */}
          <div className="px-4 py-2.5 border-b border-gd-outline-var flex justify-between items-center bg-gd-surface-bright">
            <h3 className="text-xl font-semibold text-gd-primary flex items-center gap-2 font-guide">
              <Map className="w-5 h-5" /> Live Group Map
            </h3>
            <span className={`px-2 py-1 rounded-full text-[13px] font-guide-mono font-medium flex items-center gap-1.5 ${
              activeGroupIncidents.length > 0
                ? 'bg-red-100 text-red-800'
                : 'bg-gd-secondary-ctr text-gd-on-secondary-ctr'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                activeGroupIncidents.length > 0 ? 'bg-red-600 animate-ping' : 'bg-gd-secondary'
              }`} />
              {activeGroupIncidents.length > 0 ? 'Alert Active' : 'Safe Zone Active'}
            </span>
          </div>

          {/* Dynamic Leaflet Map */}
          <div className="flex-1 relative w-full h-full bg-gd-surface-high">
            <GuideLiveMap tourists={tourists} incidents={incidents} />
          </div>
        </div>
      </div>

      {/* ═══ Right Column: Recent Alerts & Live Incident Feed ═══ */}
      <div className="col-span-12 xl:col-span-4 flex flex-col h-full">
        <div className="bg-gd-surface rounded-xl border border-gd-outline-var flex flex-col h-full overflow-hidden xl:max-h-[660px]">
          {/* Feed Header */}
          <div className="px-4 py-2.5 border-b border-gd-outline-var flex justify-between items-center bg-gd-surface-bright">
            <h3 className="text-xl font-semibold text-gd-primary flex items-center gap-2 font-guide">
              <BellRing className="w-5 h-5" /> Recent Alerts
            </h3>
            {activeGroupIncidents.length > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {activeGroupIncidents.length} Urgent
              </span>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 p-2 border-b border-gd-outline-var bg-gd-surface-low overflow-x-auto">
            {(['all', 'caution', 'system'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setAlertFilter(filter)}
                className={`px-2 py-1 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  alertFilter === filter
                    ? 'bg-gd-primary text-gd-on-primary'
                    : 'border border-gd-outline-var text-gd-on-surface-var hover:bg-gd-surface-variant'
                }`}
              >
                {filter === 'all' ? `All (${allAlerts.length})` :
                 filter === 'caution' ? `Caution (${allAlerts.filter(a => a.type === 'caution').length})` :
                 `System (${allAlerts.filter(a => a.type === 'system' || (a as any).type === 'info').length})`}
              </button>
            ))}
          </div>

          {/* Alert List */}
          <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-gd-surface-variant">
            {filteredAlerts.map(alert => {
              const isDynamic = (alert as any).isIncident;
              return (
                <div
                  key={alert.id}
                  className={`p-4 transition-colors flex gap-3 ${
                    isDynamic
                      ? 'bg-red-50/80 hover:bg-red-100/80 border-l-4 border-l-red-600'
                      : 'hover:bg-gd-surface-low'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isDynamic
                      ? 'bg-red-600 text-white shadow-sm'
                      : alert.type === 'caution'
                      ? 'bg-gd-warn text-gd-warn-ctr'
                      : 'bg-gd-surface-dim text-gd-on-surface'
                  }`}>
                    {isDynamic ? <Flame className="w-5 h-5" /> : alertIconMap[alert.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[13px] font-bold ${isDynamic ? 'text-red-700' : 'text-gd-on-surface'}`}>
                        {alert.title}
                      </span>
                      <span className="text-[11px] font-guide-mono text-gd-on-surface-var ml-2 shrink-0">
                        {alert.time}
                      </span>
                    </div>
                    <p className="text-sm text-gd-on-surface-var line-clamp-2">{alert.description}</p>
                    {alert.hasAction && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => navigate('/guide/chat')}
                          className="text-[13px] font-guide-mono font-bold text-gd-secondary border border-gd-secondary px-2.5 py-1 rounded hover:bg-gd-secondary hover:text-gd-on-secondary transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Full Width: AI Safety & Risk Sentinel Preview Table ═══ */}
      <div className="col-span-12 bg-gd-surface rounded-xl border border-gd-outline-var shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gd-outline-var bg-gd-surface-bright flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gd-secondary" />
            <h3 className="text-xl font-semibold text-gd-primary font-guide">
              AI Risk & Behavioral Anomaly Monitor
            </h3>
            <span className="text-xs text-gd-on-surface-var hidden sm:inline font-mono">
              (Live XGBoost & Isolation Forest telemetry)
            </span>
          </div>
          <button
            onClick={() => navigate('/guide/safety')}
            className="bg-gd-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs hover:opacity-95 transition-all cursor-pointer flex items-center gap-1 font-guide"
          >
            <span>Full Safety View</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="overflow-x-auto min-h-0">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="bg-gd-surface-bright border-b border-gd-outline-var text-gd-on-surface-var text-[11px] uppercase font-bold tracking-wider">
                <th className="px-4 py-3">Tourist / ID</th>
                <th className="px-4 py-3">Live Location</th>
                <th className="px-4 py-3">Risk Score</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Anomaly Status</th>
                <th className="px-4 py-3">Anomaly Type</th>
                <th className="px-4 py-3">Safety Status</th>
                <th className="px-4 py-3">SOS State</th>
                <th className="px-4 py-3">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gd-outline-var font-sans">
              {tourists.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gd-on-surface-var">
                    No assigned tourists in group.
                  </td>
                </tr>
              ) : (
                tourists.map(t => {
                  const score = typeof t.currentRiskScore === 'number' ? t.currentRiskScore : 10;
                  const isAnomaly = Boolean(t.anomaly?.anomaly_detected);
                  const anomalyType = t.anomaly?.anomaly_type || 'NONE';
                  const riskLevel = t.riskLevel || (score <= 25 ? 'LOW' : score <= 50 ? 'MODERATE' : score <= 75 ? 'HIGH' : 'CRITICAL');
                  const safetyStatus = t.safetyDetails?.status || t.safetyStatus || 'NORMAL';
                  const isSos = Boolean(t.sosTriggered || t.safetyStatus === 'EMERGENCY_SOS');

                  let riskBadgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  if (riskLevel === 'CRITICAL') riskBadgeStyle = 'bg-red-50 text-red-800 border-red-200 animate-pulse font-bold';
                  else if (riskLevel === 'HIGH') riskBadgeStyle = 'bg-orange-50 text-orange-800 border-orange-200 font-semibold';
                  else if (riskLevel === 'MODERATE') riskBadgeStyle = 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';

                  let safetyStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  if (safetyStatus === 'CRITICAL' || safetyStatus === 'EMERGENCY_SOS' || safetyStatus === 'EMERGENCY') {
                    safetyStyle = 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse';
                  } else if (safetyStatus === 'ESCALATED') {
                    safetyStyle = 'bg-orange-100 text-orange-800 border-orange-300 font-semibold';
                  } else if (safetyStatus === 'ELEVATED') {
                    safetyStyle = 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
                  } else if (safetyStatus === 'ADVISORY') {
                    safetyStyle = 'bg-sky-100 text-sky-800 border-sky-300 font-semibold';
                  }

                  return (
                    <tr key={t.id} className="hover:bg-gd-surface-bright/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gd-primary flex items-center gap-1.5">
                          <span>{t.name}</span>
                          {isSos && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>}
                        </div>
                        <div className="text-[10px] font-mono text-gd-on-surface-var">ID: {t.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="truncate max-w-[150px] font-medium" title={t.currentLocation?.address || 'Live Location'}>
                          {t.currentLocation?.address || 'Live Location'}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-gd-primary">
                        {score.toFixed(1)}/100
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${riskBadgeStyle}`}>
                          {riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isAnomaly
                            ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {isAnomaly ? 'DETECTED' : 'NORMAL'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-medium text-gd-on-surface">
                        {anomalyType}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${safetyStyle}`}>
                          {safetyStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isSos ? (
                          <span className="inline-flex items-center gap-1 bg-red-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full animate-bounce shadow-2xs">
                            <Flame className="w-2.5 h-2.5" />
                            ACTIVE SOS
                          </span>
                        ) : (
                          <span className="text-gd-on-surface-var text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-medium border border-slate-200">
                            OFF
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gd-on-surface-var font-mono text-[10px] whitespace-nowrap">
                        {t.lastUpdated || 'Live'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
