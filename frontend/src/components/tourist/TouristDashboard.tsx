import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DynamicGeofence, TouristProfile, IncidentReport } from '../../types';
import { GeolocationPermissionState, TelemetryData } from '../../hooks/useTouristLiveLocation';
import { maskDid } from '../../utils/didUtils';

interface TouristDashboardProps {
  tourist: TouristProfile;
  geofences: DynamicGeofence[];
  incidents?: IncidentReport[];
  onTriggerSOS: (details?: { description?: string; mediaUrl?: string; serviceNeeded?: string }) => void;
  onStopSOS?: (touristId?: string) => void;
  permissionState?: GeolocationPermissionState;
  isTracking?: boolean;
  coords?: TelemetryData | null;
  onRequestPermission?: () => void;
  onRecenter?: () => void;
}

interface GuideInfo {
  guide_id: string;
  full_name: string;
  mobile_number: string;
  status: string;
}

export const TouristDashboard: React.FC<TouristDashboardProps> = ({
  tourist,
  geofences,
  incidents = [],
  onTriggerSOS,
  onStopSOS,
  permissionState,
  isTracking,
  coords,
  onRequestPermission,
  onRecenter
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Dynamic Assigned Guide State
  const [assignedGuide, setAssignedGuide] = useState<GuideInfo | null>(null);
  const isSoloTourist = Boolean(tourist.isSolo || tourist.id?.startsWith('S-') || !tourist.guide_id);

  useEffect(() => {
    if (isSoloTourist) {
      setAssignedGuide(null);
      return;
    }

    const fetchAssignedGuide = async () => {
      let targetGuideId = tourist.guide_id;
      if (!targetGuideId && tourist.id?.startsWith('T-')) {
        const parts = tourist.id.split('-');
        if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
          targetGuideId = `G-${parts[1]}`;
        }
      }
      if (!targetGuideId) targetGuideId = 'G-1001';

      try {
        const res = await fetch('/api/v1/guides');
        if (res.ok) {
          const guides: GuideInfo[] = await res.json();
          const match = guides.find(g => g.guide_id === targetGuideId);
          if (match) {
            setAssignedGuide(match);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching assigned guide:', err);
      }

      if (targetGuideId === 'G-1001') {
        setAssignedGuide({
          guide_id: 'G-1001',
          full_name: 'RAMA PATILE',
          mobile_number: '+91 99887 76655',
          status: 'Active'
        });
      }
    };

    fetchAssignedGuide();
  }, [tourist.guide_id, tourist.id, isSoloTourist]);

  // SOS Modal state
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const sosTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recenter helper
  const handleRecenter = () => {
    if (mapInstanceRef.current && tourist.currentLocation) {
      mapInstanceRef.current.setView(
        [tourist.currentLocation.lat, tourist.currentLocation.lng],
        16,
        { animate: true }
      );
    }
    onRecenter?.();
  };

  // Initialize & Update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [tourist.currentLocation.lat, tourist.currentLocation.lng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | SafeYatra Sentinel Engine',
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = markersGroupRef.current;

    if (layerGroup && map) {
      layerGroup.clearLayers();

      // Render geofences
      geofences.forEach((fence) => {
        let color = '#003d9b';
        if (fence.riskFactor >= 85) color = '#ba1a1a';
        else if (fence.riskFactor >= 60) color = '#f59e0b';

        const circle = L.circle([fence.center.lat, fence.center.lng], {
          color,
          fillColor: color,
          fillOpacity: 0.2,
          radius: fence.currentRadiusMeters,
          weight: 2,
          dashArray: fence.governmentAlertActive ? '6, 6' : undefined,
        });

        circle.bindPopup(`
          <div style="font-family: Inter, sans-serif; padding: 4px;">
            <strong style="color: ${color}; font-size: 14px;">${fence.name}</strong><br/>
            <span style="font-size: 12px; color: #434654;">Risk Factor: <b>${fence.riskFactor}/100</b></span><br/>
            <span style="font-size: 11px; color: #737685;">Dynamic Radius: ${fence.currentRadiusMeters}m</span><br/>
            <p style="font-size: 11px; margin-top: 4px; color: #191c1e;">${fence.description}</p>
          </div>
        `);
        circle.addTo(layerGroup);
      });

      const isLive = tourist.currentLocation.isLiveGps || isTracking;
      const accuracyRadius = coords?.accuracy || tourist.currentLocation.accuracy || 15;

      // Accuracy circle if live GPS
      if (isLive) {
        const accuracyCircle = L.circle(
          [tourist.currentLocation.lat, tourist.currentLocation.lng],
          {
            radius: Math.min(accuracyRadius, 150),
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            weight: 1.5,
            dashArray: '4, 4'
          }
        );
        accuracyCircle.addTo(layerGroup);
      }

      // Render tourist marker
      const touristIcon = L.divIcon({
        className: 'custom-tourist-pin',
        html: `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            ${isLive ? '<div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(59, 130, 246, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
            <div style="
              position: relative;
              width: 24px;
              height: 24px;
              background-color: ${isLive ? '#2563eb' : '#003d9b'};
              border: 3px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 2px 10px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const touristMarker = L.marker(
        [tourist.currentLocation.lat, tourist.currentLocation.lng],
        { icon: touristIcon }
      );

      touristMarker.bindPopup(`
        <div style="font-family: Inter, sans-serif; font-size: 13px; line-height: 1.4;">
          <div style="font-weight: 700; color: #1e293b; font-size: 14px;">${tourist.name} (You)</div>
          <div style="color: #64748b; font-size: 12px;">${tourist.currentLocation.address || 'Live Location'}</div>
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
            <span>Status: <b style="color: ${tourist.safetyStatus === 'SAFE' ? '#10b981' : '#ef4444'}">${tourist.safetyStatus}</b></span><br/>
            <span>Risk Index: <b>${tourist.currentRiskScore}/100</b></span><br/>
            ${isLive ? `<span style="color: #2563eb; font-size: 11px;">📍 GPS Precision: ±${accuracyRadius}m</span>` : ''}
          </div>
        </div>
      `);
      touristMarker.addTo(layerGroup);
    }
  }, [tourist, geofences, isTracking, coords]);

  // SOS countdown & selective service logic
  const [selectedSosService, setSelectedSosService] = useState<'POLICE' | 'SDRF' | 'MEDICAL' | null>(null);
  const selectedSosServiceRef = useRef<'POLICE' | 'SDRF' | 'MEDICAL' | null>(null);
  const [sosSentService, setSosSentService] = useState<string | null>(null);

  const dispatchSOSNow = (serviceOverride?: 'POLICE' | 'SDRF' | 'MEDICAL') => {
    if (sosTimerRef.current) {
      clearInterval(sosTimerRef.current);
      sosTimerRef.current = null;
    }
    const currentChoice = serviceOverride !== undefined ? serviceOverride : selectedSosServiceRef.current;

    let serviceDesc = `EMERGENCY SOS TRIGGERED: Tourist ${tourist.name} requires immediate emergency assistance via live GPS coordinates.`;
    if (currentChoice === 'POLICE') {
      serviceDesc = `EMERGENCY POLICE 112 NEEDED: Tourist ${tourist.name} urgently requires Police security and law enforcement response.`;
    } else if (currentChoice === 'SDRF') {
      serviceDesc = `EMERGENCY SDRF RESCUE NEEDED: Tourist ${tourist.name} urgently requires SDRF Disaster & Mountain Rescue team.`;
    } else if (currentChoice === 'MEDICAL') {
      serviceDesc = `EMERGENCY TRAUMA ICU NEEDED: Tourist ${tourist.name} urgently requires Trauma ICU Emergency Ambulance & Critical Medical Care.`;
    }

    setSosSentService(currentChoice || 'GENERAL');
    onTriggerSOS({
      description: serviceDesc,
      serviceNeeded: currentChoice || undefined
    });

    setTimeout(() => {
      setShowSosModal(false);
      setSelectedSosService(null);
      selectedSosServiceRef.current = null;
      setSosSentService(null);
    }, 1800);
  };

  const handleTriggerSOS = (defaultService?: 'POLICE' | 'SDRF' | 'MEDICAL') => {
    if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    setSelectedSosService(defaultService || null);
    selectedSosServiceRef.current = defaultService || null;
    setSosSentService(null);
    setShowSosModal(true);
    setSosCountdown(5);

    let count = 5;
    sosTimerRef.current = setInterval(() => {
      count -= 1;
      setSosCountdown(count);
      if (count <= 0) {
        if (sosTimerRef.current) {
          clearInterval(sosTimerRef.current);
          sosTimerRef.current = null;
        }
        dispatchSOSNow();
      }
    }, 1000);
  };

  const handleCancelSOS = () => {
    if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    setShowSosModal(false);
    setSosCountdown(5);
    setSelectedSosService(null);
    selectedSosServiceRef.current = null;
    setSosSentService(null);
  };

  const handleMarkSafe = async () => {
    try {
      const res = await fetch(`/api/tourists/${tourist.id}/safe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.tourist) {
        tourist.sosTriggered = false;
        tourist.safetyStatus = 'SAFE';
      }
    } catch (err) {
      console.error('Failed to mark safe:', err);
    }
  };

  const hasActiveSOS = tourist.safetyStatus === 'EMERGENCY_SOS' || Boolean(
    incidents.some(i => i.touristId === tourist.id && (i.status === 'PENDING' || i.status === 'DISPATCHED' || (i.type === 'SOS_TRIGGERED' && i.status !== 'RESOLVED')))
  );

  const handleStopActiveSOS = async () => {
    if (onStopSOS) {
      await onStopSOS(tourist.id);
    } else {
      await handleMarkSafe();
    }
  };

  useEffect(() => {
    return () => {
      if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    };
  }, []);

  const isLive = tourist.currentLocation.isLiveGps || isTracking;

  return (
    <>
      <div className="p-5 md:p-8 max-w-[1200px] mx-auto w-full space-y-6">
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Location Card */}
          <div className="lg:col-span-2 bg-st-surface-white rounded-xl border border-st-outline-variant p-4 flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-st-on-surface uppercase tracking-wider">Live Safety Map</h2>
                {isLive ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    GPS Live (±{coords?.accuracy || tourist.currentLocation.accuracy || 10}m)
                  </span>
                ) : (
                  <button
                    onClick={onRequestPermission}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">near_me</span>
                    Enable Live GPS
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-st-on-surface-variant bg-st-surface-container px-2.5 py-1 rounded leading-4 font-mono">
                  ID: {tourist.id}
                </span>
              </div>
            </div>

            {/* Interactive Map View */}
            <div className="relative w-full h-[260px] md:h-[340px] bg-st-surface-container-low rounded-lg border border-st-outline-variant overflow-hidden">
              <div ref={mapContainerRef} className="w-full h-full z-10" />

              {/* Floating Recenter & Live Location Overlay Controls */}
              <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
                <button
                  onClick={handleRecenter}
                  title="Recenter to my location"
                  className="bg-white hover:bg-slate-50 text-slate-800 p-2.5 rounded-lg shadow-lg border border-slate-200 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-blue-600 text-xl">my_location</span>
                </button>
              </div>

              {/* Bottom Map Status Bar */}
              <div className="absolute bottom-2 left-2 right-2 z-20 bg-slate-950/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs flex items-center justify-between pointer-events-none">
                <span className="font-mono">
                  {tourist.currentLocation.lat.toFixed(5)}°N, {tourist.currentLocation.lng.toFixed(5)}°E
                </span>
                <span className="text-slate-300 text-[11px]">
                  Updated: {tourist.lastUpdated || 'Just now'}
                </span>
              </div>
            </div>

            {/* Address & Telemetry Bar */}
            <div className="mt-3.5 flex items-center justify-between text-st-on-surface-variant text-sm gap-2">
              <div className="flex items-center gap-2 truncate">
                <span className="material-symbols-outlined text-st-secondary text-lg shrink-0">location_on</span>
                <span className="font-medium text-st-on-surface truncate">
                  {tourist.currentLocation?.address || (tourist.currentLocation?.lat ? `${tourist.currentLocation.lat.toFixed(4)}°N, ${tourist.currentLocation.lng.toFixed(4)}°E` : 'Live Location')}
                </span>
              </div>

              {coords?.speed !== null && coords?.speed !== undefined && coords?.speed > 0 && (
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono shrink-0">
                  {coords.speed} km/h
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Profile + SOS */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            {/* User Information Card */}
            <div className="bg-st-surface-white rounded-xl border border-st-outline-variant p-6 flex items-center gap-6 py-6 shadow-sm">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-st-primary-fixed flex-shrink-0 bg-st-surface-container flex items-center justify-center">
                <span className="text-2xl font-bold text-st-primary">{tourist.name?.charAt(0) || 'T'}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-lg font-bold text-st-on-surface truncate">{tourist.name}</div>
                <div className="flex flex-col mt-1 space-y-0.5 text-xs text-st-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span>Age: <b>{tourist.age || 28}</b></span>
                    <span>&middot;</span>
                    <span>Blood: <b className="text-red-600">{tourist.bloodType || 'O+'}</b></span>
                  </div>
                  {tourist.mobile && (
                    <div className="truncate">
                      📞 {tourist.mobile}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-1">
                    <span>DID:</span>
                    <span className="truncate">{maskDid(tourist.blockchainDid)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Safety Health Tile */}
            <div className="bg-st-surface-white rounded-xl border border-st-outline-variant p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-st-on-surface uppercase tracking-wider">Safety Status</span>
                {(() => {
                  const score = typeof tourist.currentRiskScore === 'number' ? tourist.currentRiskScore : 10;
                  let label = 'LOW';
                  let badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300';

                  if (score > 75.0) {
                    label = 'CRITICAL';
                    badgeClass = 'bg-red-100 text-red-800 border border-red-300 animate-pulse';
                  } else if (score > 50.0) {
                    label = 'HIGH';
                    badgeClass = 'bg-orange-100 text-orange-800 border border-orange-300';
                  } else if (score > 25.0) {
                    label = 'MODERATE';
                    badgeClass = 'bg-amber-100 text-amber-800 border border-amber-300';
                  } else {
                    label = 'LOW';
                    badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
                  }

                  return (
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badgeClass}`}>
                      {label}
                    </span>
                  );
                })()}
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    (tourist.currentRiskScore || 10) > 75
                      ? 'bg-red-500'
                      : (tourist.currentRiskScore || 10) > 50
                      ? 'bg-orange-500'
                      : (tourist.currentRiskScore || 10) > 25
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, tourist.currentRiskScore || 10)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>Calculated Risk: {tourist.currentRiskScore || 10}/100</span>
                <span>Battery: {tourist.batteryLevel || 100}%</span>
              </div>
            </div>

            {/* Phase 3 Behavioral Anomaly Detection Tile */}
            <div className="bg-st-surface-white rounded-xl border border-st-outline-variant p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-st-on-surface uppercase tracking-wider">Anomaly Status</span>
                {(() => {
                  const isDetected = Boolean(tourist.anomaly?.anomaly_detected);
                  return (
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isDetected
                          ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {isDetected ? 'DETECTED' : 'NORMAL'}
                    </span>
                  );
                })()}
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Anomaly Score:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {typeof tourist.anomaly?.anomaly_score === 'number'
                      ? tourist.anomaly.anomaly_score.toFixed(4)
                      : '0.0000'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Anomaly Type:</span>
                  <span className="font-semibold text-slate-800">
                    {tourist.anomaly?.anomaly_type || 'NONE'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Severity:</span>
                  <span
                    className={`font-bold ${
                      tourist.anomaly?.severity === 'CRITICAL'
                        ? 'text-red-600'
                        : tourist.anomaly?.severity === 'HIGH'
                        ? 'text-orange-600'
                        : tourist.anomaly?.severity === 'MODERATE'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {tourist.anomaly?.severity || 'LOW'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Strip */}
        <div className="bg-st-surface-white rounded-xl border border-st-outline-variant p-4 md:p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-st-outline-variant">
            <div className="flex items-center gap-3 py-2 md:py-0 px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isSoloTourist ? 'bg-emerald-100 text-emerald-800' : 'bg-st-primary-container text-st-on-primary-container'
              }`}>
                <span className="material-symbols-outlined">{isSoloTourist ? 'shield_person' : 'person'}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-st-on-surface-variant leading-4">
                  {isSoloTourist ? 'Traveler Protection' : 'Assigned Guide'}
                </div>
                <div className="text-sm font-semibold text-st-on-surface leading-5">
                  {isSoloTourist ? (
                    <>Solo Explorer <span className="text-emerald-600 font-normal">(Direct Admin Monitored)</span></>
                  ) : (
                    <>{assignedGuide ? assignedGuide.full_name : 'RAMA PATILE'} <span className="text-st-secondary font-normal">({assignedGuide?.status || 'Active'})</span></>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2 md:py-0 px-2 md:pl-6">
              <div className="w-10 h-10 bg-st-surface-container text-st-on-surface-variant rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <div className="text-xs font-medium text-st-on-surface-variant leading-4">Trip Schedule</div>
                <div className="text-sm font-semibold text-st-on-surface leading-5">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · 18:00
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2 md:py-0 px-2 md:pl-6">
              <div className="w-10 h-10 bg-red-100 text-red-700 rounded-full flex items-center justify-center border border-red-200">
                <span className="material-symbols-outlined text-red-600">contact_phone</span>
              </div>
              <div>
                <div className="text-xs font-medium text-st-on-surface-variant leading-4">Emergency Contact (Admin)</div>
                <a href="tel:18001234567" className="text-sm font-extrabold text-red-600 hover:underline leading-5">
                  1800-123-4567
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Level-Wise Status & SOS Action Card */}
        {(() => {
          const score = typeof tourist.currentRiskScore === 'number' ? tourist.currentRiskScore : 10;

          if (hasActiveSOS || score > 75.0) {
            // Level 4 / Active SOS: CRITICAL / ACTIVE SOS
            return (
              <div className="bg-gradient-to-r from-red-800 via-red-900 to-rose-950 text-white rounded-xl border-2 border-red-500 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 w-full shadow-2xl animate-pulse">
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3.5 bg-red-700/80 rounded-full border border-red-400 shrink-0">
                    <span className="material-symbols-outlined text-4xl text-white">emergency</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-black text-white tracking-tight uppercase">Emergency SOS State Active</h2>
                      <span className="bg-white text-red-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        LIVE DISPATCH
                      </span>
                    </div>
                    <p className="text-xs text-red-100 max-w-lg mt-1 leading-relaxed">
                      Emergency telemetry active with Police, SDRF, and Assigned Guide ({assignedGuide?.full_name || 'Rama Patile'}). Press <b>“Stop SOS”</b> beside Emergency SOS to resolve alert.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
                  <button
                    onClick={handleTriggerSOS}
                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider px-5 py-3 rounded-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-red-400"
                  >
                    <span className="material-symbols-outlined text-lg animate-pulse">crisis_alert</span>
                    Emergency SOS
                  </button>

                  <button
                    onClick={handleStopActiveSOS}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider px-6 py-3 rounded-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-2 border-emerald-300 hover:border-white"
                  >
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                    Stop SOS
                  </button>
                </div>
              </div>
            );
          } else if (score > 50) {
            // Level 3: HIGH RISK (50.1 - 75)
            return (
              <div className="bg-gradient-to-r from-orange-900 to-amber-900 text-white rounded-xl border border-orange-700/50 p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 w-full shadow-lg">
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-orange-800/80 rounded-full border border-orange-500 shrink-0">
                    <span className="material-symbols-outlined text-3xl text-orange-200">warning</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Elevated Caution Zone (High Risk: {score}/100)</h2>
                    <p className="text-xs text-orange-100 max-w-md mt-0.5 leading-relaxed">
                      You are in or approaching a high-hazard area. Please stay vigilant, remain on designated paths, or follow guide instructions.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <button
                    onClick={handleTriggerSOS}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border border-orange-400"
                  >
                    <span className="material-symbols-outlined text-lg">crisis_alert</span>
                    Emergency SOS
                  </button>
                  <button
                    onClick={handleStopActiveSOS}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border border-emerald-500"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Stop SOS
                  </button>
                </div>
              </div>
            );
          } else if (score > 25) {
            // Level 2: MODERATE RISK (25.1 - 50)
            return (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 text-slate-800 rounded-xl border border-amber-200 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 w-full shadow-sm">
                <div className="flex items-center gap-3.5 text-left">
                  <div className="p-2.5 bg-amber-100 rounded-full border border-amber-300 shrink-0">
                    <span className="material-symbols-outlined text-2xl text-amber-700">shield_with_heart</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-amber-950">Advisory Notice (Moderate Risk: {score}/100)</h2>
                    <p className="text-xs text-amber-800 max-w-md mt-0.5 leading-relaxed">
                      Terrain elevation or moderate environmental factors present. Safe travel corridor active.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <button
                    onClick={handleTriggerSOS}
                    className="bg-white hover:bg-amber-100 text-amber-900 font-semibold text-xs px-4 py-2.5 rounded-lg border border-amber-300 shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base text-red-500">sos</span>
                    Emergency SOS
                  </button>
                  <button
                    onClick={handleStopActiveSOS}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border border-emerald-500"
                  >
                    <span className="material-symbols-outlined text-base text-white">check_circle</span>
                    Stop SOS
                  </button>
                </div>
              </div>
            );
          } else {
            // Level 1: LOW RISK (0 - 25)
            return (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 text-slate-800 rounded-xl border border-emerald-200 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 w-full shadow-sm">
                <div className="flex items-center gap-3.5 text-left">
                  <div className="p-2.5 bg-emerald-100 rounded-full border border-emerald-300 shrink-0">
                    <span className="material-symbols-outlined text-2xl text-emerald-700">verified_user</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-emerald-950">Safe Corridor Active (Low Risk: {score}/100)</h2>
                    <p className="text-xs text-emerald-800 max-w-md mt-0.5 leading-relaxed">
                      You are in a fully monitored safe tourist corridor with nominal hazard parameters.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <button
                    onClick={handleTriggerSOS}
                    className="bg-white hover:bg-emerald-100 text-emerald-900 font-semibold text-xs px-4 py-2.5 rounded-lg border border-emerald-300 shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base text-red-500">sos</span>
                    Emergency SOS
                  </button>
                  <button
                    onClick={handleStopActiveSOS}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border border-emerald-500"
                  >
                    <span className="material-symbols-outlined text-base text-white">check_circle</span>
                    Stop SOS
                  </button>
                </div>
              </div>
            );
          }
        })()}
      </div>

      {/* ═══════ SOS Modal ═══════ */}
      {showSosModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[480px] p-6 sm:p-8 border border-slate-200 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
            {/* Top pulsing indicator */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 animate-pulse border-4 transition-all ${
              sosSentService
                ? 'bg-emerald-600 border-emerald-200 text-white'
                : 'bg-red-600 border-red-200 text-white'
            }`}>
              {sosSentService ? (
                <span className="material-symbols-outlined text-4xl">check</span>
              ) : (
                <span className="text-3xl font-black">
                  {sosCountdown > 0 ? sosCountdown : '!'}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-1.5">
              {sosSentService ? 'Emergency Signal Transmitted!' : 'Transmitting SOS Alert...'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 px-2">
              {sosSentService ? (
                <span className="text-emerald-700 font-semibold">
                  High-priority dispatch sent for <b>{
                    selectedSosService === 'POLICE' ? 'Police 112' : selectedSosService === 'SDRF' ? 'SDRF Rescue' : selectedSosService === 'MEDICAL' ? 'Trauma ICU Medical' : 'Emergency Team'
                  }</b> with live coordinates.
                </span>
              ) : (
                <>Select an emergency unit or dispatching automatic signal with live coordinates in <b>{sosCountdown}s</b>.</>
              )}
            </p>

            {/* 3 Selectable Emergency Service Options */}
            <div className="w-full grid grid-cols-3 gap-2.5 mb-5">
              {/* 1. Police 112 */}
              <button
                type="button"
                onClick={() => {
                  setSelectedSosService('POLICE');
                  selectedSosServiceRef.current = 'POLICE';
                }}
                className={`border-2 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none ${
                  selectedSosService === 'POLICE'
                    ? 'border-blue-600 bg-blue-50/90 shadow-md ring-2 ring-blue-400 scale-[1.03]'
                    : 'bg-slate-50 border-slate-200 hover:bg-blue-50/30 hover:border-blue-300'
                }`}
              >
                <span className="material-symbols-outlined text-blue-600 text-2xl mb-1">local_police</span>
                <span className="text-xs font-bold text-slate-800">Police 112</span>
                <span className={`text-[9px] mt-1 font-bold px-1.5 py-0.2 rounded-full ${
                  selectedSosService === 'POLICE' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}>
                  {selectedSosService === 'POLICE' ? 'SELECTED ✓' : 'Security'}
                </span>
              </button>

              {/* 2. SDRF Rescue */}
              <button
                type="button"
                onClick={() => {
                  setSelectedSosService('SDRF');
                  selectedSosServiceRef.current = 'SDRF';
                }}
                className={`border-2 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none ${
                  selectedSosService === 'SDRF'
                    ? 'border-amber-600 bg-amber-50/90 shadow-md ring-2 ring-amber-400 scale-[1.03]'
                    : 'bg-slate-50 border-slate-200 hover:bg-amber-50/30 hover:border-amber-300'
                }`}
              >
                <span className="material-symbols-outlined text-amber-600 text-2xl mb-1">fire_truck</span>
                <span className="text-xs font-bold text-slate-800">SDRF</span>
                <span className={`text-[9px] mt-1 font-bold px-1.5 py-0.2 rounded-full ${
                  selectedSosService === 'SDRF' ? 'bg-amber-600 text-white' : 'text-slate-400'
                }`}>
                  {selectedSosService === 'SDRF' ? 'SELECTED ✓' : 'Disaster/Rescue'}
                </span>
              </button>

              {/* 3. Trauma ICU */}
              <button
                type="button"
                onClick={() => {
                  setSelectedSosService('MEDICAL');
                  selectedSosServiceRef.current = 'MEDICAL';
                }}
                className={`border-2 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none ${
                  selectedSosService === 'MEDICAL'
                    ? 'border-red-600 bg-red-50/90 shadow-md ring-2 ring-red-400 scale-[1.03]'
                    : 'bg-slate-50 border-slate-200 hover:bg-red-50/30 hover:border-red-300'
                }`}
              >
                <span className="material-symbols-outlined text-red-600 text-2xl mb-1">ambulance</span>
                <span className="text-xs font-bold text-slate-800">Trauma ICU</span>
                <span className={`text-[9px] mt-1 font-bold px-1.5 py-0.2 rounded-full ${
                  selectedSosService === 'MEDICAL' ? 'bg-red-600 text-white' : 'text-slate-400'
                }`}>
                  {selectedSosService === 'MEDICAL' ? 'SELECTED ✓' : 'Medical ICU'}
                </span>
              </button>
            </div>

            {/* Instant Send & Cancel buttons */}
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => dispatchSOSNow()}
                className="w-full bg-[#C62828] hover:bg-[#B71C1C] text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-base">emergency_share</span>
                <span>Send {selectedSosService ? (selectedSosService === 'POLICE' ? 'Police 112 SOS Now' : selectedSosService === 'SDRF' ? 'SDRF Rescue SOS Now' : 'Trauma ICU SOS Now') : 'SOS Alert Now'}</span>
              </button>

              <button
                type="button"
                onClick={handleCancelSOS}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-colors active:scale-98 cursor-pointer"
              >
                Cancel Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
