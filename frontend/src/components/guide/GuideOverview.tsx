import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import {
  Users, CheckCircle, AlertTriangle, Map, RefreshCw, BellRing,
  MapPin, BatteryWarning, Clock, CloudRain, CheckCircle2,
  Flame, MessageSquare, PhoneCall, ShieldAlert
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

const GuideLiveMap: React.FC<{ tourists: TouristProfile[]; incidents?: IncidentReport[] }> = ({ tourists, incidents }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let centerLat = 30.1250;
    let centerLng = 78.3180;
    
    if (tourists.length > 0) {
      centerLat = tourists.reduce((sum, t) => sum + t.currentLocation.lat, 0) / tourists.length;
      centerLng = tourists.reduce((sum, t) => sum + t.currentLocation.lng, 0) / tourists.length;
    }

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    tourists.forEach(t => {
      const hasActiveIncident = incidents?.some(
        i => (i.touristId === t.id || i.touristName === t.name) && i.status !== 'RESOLVED'
      );

      let pinColor = '#10B981'; // Green (SAFE)
      if (t.safetyStatus === 'CAUTION') pinColor = '#F59E0B'; // Yellow
      if (t.safetyStatus === 'EMERGENCY_SOS' || t.safetyStatus === 'AT_RISK' || hasActiveIncident) {
        pinColor = '#EF4444'; // Red
      }

      const icon = L.divIcon({
        className: 'tourist-dot-pulse',
        html: `<div style="
          width: ${hasActiveIncident ? '18px' : '14px'};
          height: ${hasActiveIncident ? '18px' : '14px'};
          background: ${pinColor};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 ${hasActiveIncident ? '14px' : '8px'} ${pinColor};
          ${hasActiveIncident ? 'animation: pulse 1.2s infinite;' : ''}
        "></div>`,
        iconAnchor: [hasActiveIncident ? 9 : 7, hasActiveIncident ? 9 : 7]
      });

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong>${t.name}</strong><br/>
          Status: <span style="color: ${pinColor}; font-weight: bold;">${hasActiveIncident ? '🚨 ACTIVE INCIDENT' : t.safetyStatus}</span><br/>
          Location: ${t.currentLocation.address || 'Rishikesh'}
        </div>
      `;

      L.marker([t.currentLocation.lat, t.currentLocation.lng], { icon }).addTo(map).bindPopup(popupContent);
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [tourists, incidents]);

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
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
        <div className="grid grid-cols-3 gap-4">
          {/* Total Members */}
          <div className="bg-gd-surface p-4 rounded-xl border border-gd-outline-var flex flex-col justify-between min-h-[110px]">
            <div className="flex justify-between items-start">
              <span className="text-[13px] font-medium text-gd-on-surface-var uppercase tracking-wide">
                Total Group
              </span>
              <Users className="w-5 h-5 text-gd-outline" />
            </div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-[32px] leading-[40px] font-bold text-gd-primary">{tourists.length}</span>
              <span className="text-sm text-gd-on-surface-var">Tourists</span>
            </div>
          </div>

          {/* Safe Status */}
          <div className="bg-gd-surface p-4 rounded-xl border border-gd-outline-var flex flex-col justify-between relative overflow-hidden min-h-[110px]">
            <div className="absolute top-0 left-0 w-1 h-full bg-gd-secondary" />
            <div className="flex justify-between items-start pl-2">
              <span className="text-[13px] font-medium text-gd-on-surface-var uppercase tracking-wide">
                Safe
              </span>
              <CheckCircle className="w-5 h-5 text-gd-secondary" />
            </div>
            <div className="mt-4 flex items-baseline gap-1.5 pl-2">
              <span className="text-[32px] leading-[40px] font-bold text-gd-secondary">{safeCount}</span>
              <span className="text-sm text-gd-on-surface-var">In Zone</span>
            </div>
          </div>

          {/* Caution / Incident Status */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between relative shadow-sm min-h-[110px] ${
            activeGroupIncidents.length > 0
              ? 'bg-red-50 border-red-300'
              : 'bg-gd-warn border-gd-warn-dim'
          }`}>
            <div className="flex justify-between items-start">
              <span className={`text-[13px] font-bold uppercase tracking-wide ${
                activeGroupIncidents.length > 0 ? 'text-red-700' : 'text-gd-warn-ctr'
              }`}>
                {activeGroupIncidents.length > 0 ? 'Incidents Active' : 'Caution'}
              </span>
              <AlertTriangle className={`w-5 h-5 fill-current ${
                activeGroupIncidents.length > 0 ? 'text-red-600' : 'text-gd-warn-ctr'
              }`} />
            </div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className={`text-[32px] leading-[40px] font-bold ${
                activeGroupIncidents.length > 0 ? 'text-red-700' : 'text-gd-warn-ctr'
              }`}>
                {activeGroupIncidents.length > 0 ? activeGroupIncidents.length : cautionCount}
              </span>
              <span className="text-sm text-gd-on-warn-ctr font-semibold">
                {activeGroupIncidents.length > 0 ? 'Urgent Alert' : 'Lagging'}
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
    </div>
  );
};
