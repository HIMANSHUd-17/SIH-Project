import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DynamicGeofence, TouristProfile } from '../../types';
import { GeolocationPermissionState, TelemetryData } from '../../hooks/useTouristLiveLocation';

interface TouristDashboardProps {
  tourist: TouristProfile;
  geofences: DynamicGeofence[];
  onTriggerSOS: (details?: { description?: string; mediaUrl?: string }) => void;
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
  onTriggerSOS,
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

  useEffect(() => {
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
  }, [tourist.guide_id, tourist.id]);

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

  // SOS countdown logic
  const handleTriggerSOS = () => {
    setShowSosModal(true);
    setSosCountdown(5);

    sosTimerRef.current = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(sosTimerRef.current!);
          onTriggerSOS({ description: 'EMERGENCY SOS TRIGGERED BY TOURIST VIA LIVE LOCATION' });
          setTimeout(() => setShowSosModal(false), 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelSOS = () => {
    if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    setShowSosModal(false);
    setSosCountdown(5);
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
                  {tourist.currentLocation.address || 'Tapovan, Rishikesh'}
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
                    <span className="truncate">{tourist.blockchainDid?.slice(0, 18)}...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Safety Health Tile */}
            <div className="bg-st-surface-white rounded-xl border border-st-outline-variant p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-st-on-surface uppercase tracking-wider">Safety Status</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  tourist.safetyStatus === 'SAFE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : tourist.safetyStatus === 'WARNING' || tourist.safetyStatus === 'CAUTION'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800 animate-pulse'
                }`}>
                  {tourist.safetyStatus}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    tourist.currentRiskScore > 70
                      ? 'bg-red-500'
                      : tourist.currentRiskScore > 40
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
          </div>
        </div>

        {/* Bottom Info Strip */}
        <div className="bg-st-surface-white rounded-xl border border-st-outline-variant p-4 md:p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-st-outline-variant">
            <div className="flex items-center gap-3 py-2 md:py-0 px-2">
              <div className="w-10 h-10 bg-st-primary-container text-st-on-primary-container rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">person</span>
              </div>
              <div>
                <div className="text-xs font-medium text-st-on-surface-variant leading-4">Assigned Guide</div>
                <div className="text-sm font-semibold text-st-on-surface leading-5">
                  {assignedGuide ? assignedGuide.full_name : 'RAMA PATILE'} <span className="text-st-secondary font-normal">({assignedGuide?.status || 'Active'})</span>
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
              <div className="w-10 h-10 bg-st-surface-container text-st-outline rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">contact_phone</span>
              </div>
              <div>
                <div className="text-xs font-medium text-st-on-surface-variant leading-4">Emergency Contact</div>
                <div className="text-sm font-semibold text-st-outline leading-5">
                  {tourist.emergencyContact || tourist.mobile || (assignedGuide ? assignedGuide.mobile_number : '+91 99887 76655')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency SOS Card */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 text-white rounded-xl border border-red-700/50 p-6 sm:p-8 flex flex-col items-center justify-center text-center w-full mt-6 shadow-xl">
          <div className="p-3 bg-red-700/60 rounded-full mb-3 border border-red-500">
            <span className="material-symbols-outlined text-4xl text-white">emergency</span>
          </div>
          <h2 className="text-2xl font-bold mb-2 tracking-tight">Instant Emergency SOS</h2>
          <p className="text-sm text-red-100 max-w-lg mb-6 leading-relaxed">
            Transmits your live GPS coordinates ({tourist.currentLocation.lat.toFixed(5)}°N, {tourist.currentLocation.lng.toFixed(5)}°E) and medical profile immediately to Uttarakhand Police & Medical Dispatch.
          </p>
          <button
            onClick={handleTriggerSOS}
            className="bg-white hover:bg-red-50 text-red-600 font-extrabold text-base uppercase tracking-wider py-4 px-10 rounded-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-2 border-red-200"
          >
            <span className="material-symbols-outlined text-2xl animate-pulse">crisis_alert</span>
            Trigger SOS Dispatch
          </button>
        </div>
      </div>

      {/* ═══════ SOS Modal ═══════ */}
      {showSosModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[480px] p-6 sm:p-8 border border-slate-200 flex flex-col items-center text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-600 text-white rounded-full flex items-center justify-center mb-4 animate-pulse border-4 border-red-200">
              <span className="text-3xl font-black">
                {sosCountdown > 0 ? sosCountdown : '!'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Transmitting SOS Alert...</h2>
            <p className="text-sm text-slate-600 mb-6 px-2">
              Dispatching SOS signal with high-precision GPS coordinates to local emergency response units in {sosCountdown}s.
            </p>

            <div className="w-full grid grid-cols-3 gap-2.5 mb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-blue-600 mb-1">local_police</span>
                <span className="text-xs font-bold text-slate-800">Police 112</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-amber-600 mb-1">fire_truck</span>
                <span className="text-xs font-bold text-slate-800">SDRF</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-red-600 mb-1">ambulance</span>
                <span className="text-xs font-bold text-slate-800">Trauma ICU</span>
              </div>
            </div>

            <button
              onClick={handleCancelSOS}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-3.5 rounded-xl transition-colors active:scale-98 cursor-pointer"
            >
              Cancel Alert
            </button>
          </div>
        </div>
      )}
    </>
  );
};
