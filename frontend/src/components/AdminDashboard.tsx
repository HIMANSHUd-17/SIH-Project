import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ShieldAlert,
  Users,
  Building2,
  Phone,
  Siren,
  Radio,
  FileCheck,
  Flame,
  CloudRain,
  MapPin,
  CheckCircle2,
  Navigation,
  Send,
  AlertOctagon,
  TrendingUp,
  Clock
} from 'lucide-react';
import { DynamicGeofence, EmergencyService, IncidentReport, TouristProfile } from '../types';

interface AdminDashboardProps {
  tourists: TouristProfile[];
  geofences: DynamicGeofence[];
  incidents: IncidentReport[];
  emergencyServices: EmergencyService[];
  onDispatchUnit: (incidentId: string, unitType: string, unitName: string) => void;
  onUpdateGeofenceParams: (params: { geofenceId: string; weatherImpact: any; crowdDensityFactor: number }) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  tourists,
  geofences,
  incidents,
  emergencyServices,
  onDispatchUnit,
  onUpdateGeofenceParams
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(incidents[0] || null);
  const [didSearchInput, setDidSearchInput] = useState('');
  const [auditResult, setAuditResult] = useState<any>(null);

  // Dynamic Geofence Parameter Adjustment State
  const [selectedFenceId, setSelectedFenceId] = useState<string>(geofences[0]?.id || '');
  const [weatherInput, setWeatherInput] = useState<string>('HEAVY_DOWNPOUR');
  const [crowdMult, setCrowdMult] = useState<number>(1.4);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [30.1300, 78.3200],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap | NAGARJUNA Multi-Authority Command Center'
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = markersGroupRef.current;

    if (layerGroup) {
      layerGroup.clearLayers();

      // Render Geofences
      geofences.forEach(fence => {
        let color = '#3b82f6';
        if (fence.riskFactor >= 85) color = '#ef4444';
        else if (fence.riskFactor >= 60) color = '#f59e0b';

        const circle = L.circle([fence.center.lat, fence.center.lng], {
          color,
          fillColor: color,
          fillOpacity: 0.2,
          radius: fence.currentRadiusMeters,
          weight: 2
        });

        circle.bindPopup(`<b>${fence.name}</b><br/>Radius: ${fence.currentRadiusMeters}m`);
        circle.addTo(layerGroup);
      });

      // Render Emergency Service Kiosks & Hospitals
      emergencyServices.forEach(es => {
        const icon = L.divIcon({
          className: 'es-icon',
          html: `<div style="background:#0284c7; color:white; padding:4px 8px; border-radius:6px; font-weight:bold; font-size:10px; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4);">
            🏥 ${es.name.split(' ')[0]}
          </div>`,
          iconAnchor: [30, 15]
        });
        const marker = L.marker([es.location.lat, es.location.lng], { icon });
        marker.bindPopup(`<b>${es.name}</b><br/>Phone: ${es.phone}`);
        marker.addTo(layerGroup);
      });

      // Render Tourist Pins
      tourists.forEach(t => {
        let pinColor = '#10b981';
        if (t.safetyStatus === 'EMERGENCY_SOS') pinColor = '#ef4444';
        else if (t.safetyStatus === 'AT_RISK') pinColor = '#f97316';
        else if (t.safetyStatus === 'CAUTION') pinColor = '#f59e0b';

        const icon = L.divIcon({
          className: 'tourist-dot',
          html: `<div style="
            width:18px; height:18px; background:${pinColor}; border:2px solid white; border-radius:50%; box-shadow: 0 0 8px ${pinColor};
          "></div>`,
          iconAnchor: [9, 9]
        });

        const m = L.marker([t.currentLocation.lat, t.currentLocation.lng], { icon });
        m.bindPopup(`
          <div>
            <strong>${t.name}</strong><br/>
            Status: <b style="color:${pinColor}">${t.safetyStatus}</b><br/>
            Risk Score: <b>${t.currentRiskScore}/100</b>
          </div>
        `);
        m.addTo(layerGroup);
      });

      // Render Incident Locations
      incidents.forEach(inc => {
        const icon = L.divIcon({
          className: 'inc-icon',
          html: `<div style="background:#dc2626; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-center:center; font-weight:bold; border:2px solid white; animation: pulse 1s infinite;">
            🚨
          </div>`,
          iconAnchor: [14, 14]
        });

        const incMarker = L.marker([inc.location.lat, inc.location.lng], { icon });
        incMarker.bindPopup(`
          <div>
            <strong style="color:#dc2626">${inc.id} - ${inc.type}</strong><br/>
            Tourist: ${inc.touristName}<br/>
            Severity: <b>${inc.severity}</b>
          </div>
        `);
        incMarker.addTo(layerGroup);
      });
    }
  }, [tourists, geofences, incidents, emergencyServices]);

  const handleApplyParamUpdate = () => {
    if (!selectedFenceId) return;
    onUpdateGeofenceParams({
      geofenceId: selectedFenceId,
      weatherImpact: weatherInput,
      crowdDensityFactor: crowdMult
    });
  };

  const handleAuditDid = async () => {
    if (!didSearchInput.trim()) return;
    try {
      const res = await fetch(`/api/blockchain/verify-id/${encodeURIComponent(didSearchInput.trim())}`);
      const data = await res.json();
      setAuditResult(data);
    } catch (err) {
      setAuditResult({ error: 'Failed to query smart contract ledger' });
    }
  };

  const emergencySosCount = tourists.filter(t => t.safetyStatus === 'EMERGENCY_SOS').length;
  const atRiskCount = tourists.filter(t => t.safetyStatus === 'AT_RISK').length;
  const displayIncidents: IncidentReport[] = Array.from(new Map<string, IncidentReport>(incidents.map((inc, idx) => [inc.id || `inc-${idx}`, inc])).values());

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6 bg-[#0A0A0B]">
      
      {/* Header Dashboard Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex items-center justify-between text-white shadow-md">
          <div>
            <span className="text-[10px] text-[#71717A] uppercase tracking-widest font-bold">Monitored Tourists</span>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-mono font-bold text-white">{tourists.length}</span>
              <span className="text-[10px] text-[#10B981] mb-1 font-mono">+14% Peak</span>
            </div>
          </div>
          <div className="bg-[#09090B] p-2.5 rounded-lg text-[#F27D26] border border-[#27272A]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] border-l-4 border-l-[#EF4444] p-4 rounded-xl flex items-center justify-between text-white shadow-md">
          <div>
            <span className="text-[10px] text-[#71717A] uppercase tracking-widest font-bold">Unresolved SOS</span>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-mono font-bold text-[#EF4444]">{emergencySosCount}</span>
              <span className="text-[10px] text-[#EF4444] mb-1 font-mono uppercase font-bold">Critical</span>
            </div>
          </div>
          <div className="bg-[#EF4444]/10 p-2.5 rounded-lg text-[#EF4444] border border-[#EF4444]/30">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex items-center justify-between text-white shadow-md">
          <div>
            <span className="text-[10px] text-[#71717A] uppercase tracking-widest font-bold">In High-Risk Perimeter</span>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-mono font-bold text-[#F27D26]">{atRiskCount}</span>
              <span className="text-[10px] text-[#F27D26] mb-1 font-mono">Warning</span>
            </div>
          </div>
          <div className="bg-[#F27D26]/10 p-2.5 rounded-lg text-[#F27D26] border border-[#F27D26]/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex items-center justify-between text-white shadow-md">
          <div>
            <span className="text-[10px] text-[#71717A] uppercase tracking-widest font-bold">Active Geofences</span>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-mono font-bold text-[#10B981]">{geofences.length}</span>
              <span className="text-[10px] text-[#10B981] mb-1 font-mono">Scaled Dynamic</span>
            </div>
          </div>
          <div className="bg-[#09090B] p-2.5 rounded-lg text-[#10B981] border border-[#27272A]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
        </div>

      </div>

      {/* Main Grid: Interactive Map + Geofence Control */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Command Map */}
        <div className="lg:col-span-8 bg-[#18181B] border border-[#27272A] rounded-2xl p-3 shadow-xl space-y-2">
          <div className="flex items-center justify-between px-2 py-1 border-b border-[#27272A] pb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white flex items-center space-x-2">
              <Siren className="w-4 h-4 text-[#F27D26]" />
              <span>Situational Tactical Command Map</span>
            </h2>
            <div className="flex items-center space-x-3 text-[10px] font-mono uppercase text-[#71717A]">
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#10B981] mr-1"></span>Safe</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#F27D26] mr-1"></span>Caution</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#EF4444] mr-1"></span>SOS</span>
            </div>
          </div>

          <div ref={mapContainerRef} className="w-full h-[420px] rounded-xl z-10 dark-map-tiles" />
        </div>

        {/* Dynamic Geofence Parameter Control Panel */}
        <div className="lg:col-span-4 bg-[#18181B] border border-[#27272A] rounded-2xl p-5 shadow-xl space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#F27D26] flex items-center space-x-2">
              <Radio className="w-4 h-4 text-[#F27D26]" />
              <span>Dynamic Geofence Controller</span>
            </h3>
            <p className="text-xs text-[#71717A] mt-1">
              Adjust parameters to dynamically expand or contract high-risk hazard zones in real-time.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-[#71717A] block mb-1">Select Active Geofence Zone:</label>
              <select
                value={selectedFenceId}
                onChange={e => setSelectedFenceId(e.target.value)}
                className="w-full bg-[#09090B] border border-[#27272A] text-[#F27D26] text-xs font-mono rounded-lg p-2 focus:outline-none"
              >
                {geofences.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[#71717A] block mb-1">Weather Impact Multiplier:</label>
              <select
                value={weatherInput}
                onChange={e => setWeatherInput(e.target.value)}
                className="w-full bg-[#09090B] border border-[#27272A] text-white text-xs rounded-lg p-2 focus:outline-none"
              >
                <option value="NONE">NONE (Standard Radius)</option>
                <option value="HEAVY_DOWNPOUR">HEAVY DOWNPOUR (1.4x Radius)</option>
                <option value="LANDSLIDE_WARNING">LANDSLIDE WARNING (1.6x Radius)</option>
                <option value="FLASH_FLOOD">FLASH FLOOD SURGE (1.8x Radius)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[10px] uppercase font-bold text-[#71717A] mb-1">
                <span>Crowd Density Multiplier:</span>
                <span className="font-mono text-[#F27D26]">{crowdMult}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.0"
                step="0.1"
                value={crowdMult}
                onChange={e => setCrowdMult(parseFloat(e.target.value))}
                className="w-full accent-[#F27D26] cursor-pointer"
              />
            </div>

            <button
              onClick={handleApplyParamUpdate}
              className="w-full bg-[#F27D26] hover:bg-orange-500 text-black font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Geofence Expansion</span>
            </button>
          </div>
        </div>

      </div>

      {/* Incident Dispatch Command Hub & Blockchain Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Incident Dispatch Hub */}
        <div className="lg:col-span-7 bg-[#18181B] border border-[#27272A] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white flex items-center space-x-2">
              <Flame className="w-4 h-4 text-[#EF4444]" />
              <span>Emergency Incident Dispatch Hub</span>
            </h2>
            <span className="text-[10px] bg-[#EF4444]/10 text-[#EF4444] font-mono px-2 py-0.5 rounded border border-[#EF4444]/30">
              {displayIncidents.length} Reported Incidents
            </span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {displayIncidents.map((inc, idx) => (
              <div
                key={inc.id || `inc-${idx}`}
                onClick={() => setSelectedIncident(inc)}
                className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                  selectedIncident?.id === inc.id ? 'bg-[#09090B] border-[#F27D26]' : 'bg-[#09090B]/60 border-[#27272A] hover:border-[#71717A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-[#F27D26]">{inc.id}</span>
                    <span className="text-xs font-bold text-white">{inc.type}</span>
                  </div>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                    inc.severity === 'CRITICAL' ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30' : 'bg-[#F27D26]/10 text-[#F27D26]'
                  }`}>
                    {inc.severity}
                  </span>
                </div>

                <p className="text-xs text-[#E4E4E7]">{inc.description}</p>

                <div className="flex items-center justify-between text-[11px] text-[#71717A] pt-1 border-t border-[#27272A] font-mono">
                  <span>Tourist: <strong className="text-white">{inc.touristName}</strong></span>
                  <span>Status: <strong className="text-[#10B981]">{inc.status}</strong></span>
                  {inc.assignedUnit && (
                    <span>Assigned: <strong className="text-[#F27D26]">{inc.assignedUnit.unitName} (ETA {inc.assignedUnit.etaMinutes}m)</strong></span>
                  )}
                </div>

                {inc.status === 'PENDING' && (
                  <div className="pt-2 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDispatchUnit(inc.id, 'POLICE', 'Uttarakhand Tourism Police Rapid Unit');
                      }}
                      className="bg-[#EF4444] hover:bg-red-600 text-white font-bold px-3 py-1 rounded text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Dispatch Police
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDispatchUnit(inc.id, 'AMBULANCE', 'AIIMS Trauma Ambulance Alpha');
                      }}
                      className="bg-[#F27D26] hover:bg-orange-500 text-black font-bold px-3 py-1 rounded text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Dispatch Medical
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Blockchain Officer Audit Tool */}
        <div className="lg:col-span-5 bg-[#18181B] border border-[#27272A] rounded-2xl p-5 shadow-xl space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#F27D26] flex items-center space-x-2">
              <FileCheck className="w-4 h-4" />
              <span>Officer On-Chain Identity Auditor</span>
            </h2>
            <p className="text-xs text-[#71717A] mt-1">
              Emergency verification tool for rescue teams to audit tourist identity hash on-chain without exposing unencrypted PII.
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={didSearchInput}
              onChange={e => setDidSearchInput(e.target.value)}
              placeholder="Enter DID (e.g. did:nagarjuna:polygon:...)"
              className="w-full bg-[#09090B] border border-[#27272A] text-white placeholder-[#71717A] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#F27D26]"
            />
            <button
              onClick={handleAuditDid}
              className="w-full bg-[#09090B] hover:bg-[#27272A] text-[#F27D26] font-bold py-2 rounded-xl text-xs border border-[#27272A] transition-all cursor-pointer uppercase tracking-wider font-mono"
            >
              Query Smart Contract Ledger
            </button>

            {auditResult && (
              <div className="bg-[#09090B] p-3 rounded-xl border border-[#27272A] text-xs font-mono space-y-1">
                {auditResult.isVerified ? (
                  <>
                    <div className="text-[#10B981] font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ON-CHAIN IDENTITY VERIFIED</span>
                    </div>
                    <div className="text-[#E4E4E7] text-[11px]">Issuer: {auditResult.record.issuer}</div>
                    <div className="text-[#E4E4E7] text-[11px]">Block: #{auditResult.record.blockNumber}</div>
                  </>
                ) : (
                  <div className="text-[#EF4444]">{auditResult.error || 'Identity not found'}</div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
