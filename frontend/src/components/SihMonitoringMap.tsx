import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldAlert, ShieldCheck, Battery, Clock, Navigation, AlertTriangle } from 'lucide-react';
import L from 'leaflet';

interface DeviceLocation {
  device_id: string;
  tourist_name: string;
  latitude: number;
  longitude: number;
  status: 'safe' | 'warning' | 'danger' | 'sos';
  sos: boolean;
  battery: number;
  last_updated: number;
}

export const SihMonitoringMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  
  const [devices, setDevices] = useState<DeviceLocation[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/v1/devices/locations');
      if (!response.ok) throw new Error('Failed to fetch from backend');
      const data = await response.json();
      setDevices(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching device locations:', err);
      setError('Backend API is currently unreachable. Retrying...');
    }
  };

  // Setup Leaflet map on mount
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [18.5204, 73.8567],
        zoom: 12,
        zoomControl: true,
        attributionControl: false // Cleaner UI
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      mapRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
      
      // We want to force a resize after a tiny delay because Flexbox layouts can cause 
      // Leaflet to calculate wrong container size on mount.
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, []);

  // Update map markers when devices data changes
  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    if (!layerGroup || !mapRef.current) return;

    // Clear old markers
    layerGroup.clearLayers();

    devices.forEach(dev => {
      let pinColor = '#10B981'; // safe
      if (dev.status === 'warning') pinColor = '#F59E0B';
      if (dev.status === 'danger') pinColor = '#EF4444';
      if (dev.status === 'sos') pinColor = '#9333EA';

      const icon = L.divIcon({
        className: 'custom-sih-marker',
        html: `
          <div style="
            width: 24px; 
            height: 24px; 
            background: ${pinColor}; 
            border: 3px solid #18181B; 
            border-radius: 50%; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.5);
            ${dev.status === 'sos' ? 'animation: pulse 1.5s infinite;' : ''}
          "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });

      const popupHtml = `
        <div style="padding: 4px; min-width: 200px; font-family: 'Inter', sans-serif;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid #27272A; padding-bottom: 8px;">
            <div style="background: #061E34; color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; border: 1px solid #3F3F46;">
              ${dev.device_id}
            </div>
            <h3 style="margin: 0; font-weight: bold; font-size: 14px; color: #E4E4E7;">${dev.tourist_name}</h3>
          </div>
          
          <div style="font-size: 12px; color: #A1A1AA; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: 600; font-size: 10px; text-transform: uppercase; color: #71717A;">Status</span>
              <span style="font-weight: bold; text-transform: uppercase; color: ${pinColor};">${dev.status}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: 600; font-size: 10px; text-transform: uppercase; color: #71717A;">SOS Mode</span>
              <span style="font-weight: bold; color: ${dev.sos ? '#9333EA' : '#E4E4E7'}">${dev.sos ? 'ACTIVE' : 'NO'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: 600; font-size: 10px; text-transform: uppercase; color: #71717A;">Battery</span>
              <span style="font-weight: bold; color: #E4E4E7;">${dev.battery}%</span>
            </div>
          </div>
          <div style="font-size: 10px; color: #71717A; padding-top: 8px; border-top: 1px solid #27272A;">
            Last updated: ${new Date(dev.last_updated).toLocaleTimeString()}
          </div>
        </div>
      `;

      L.marker([dev.latitude, dev.longitude], { icon })
        .bindPopup(popupHtml)
        .addTo(layerGroup);
    });
  }, [devices]);

  useEffect(() => {
    // Initial fetch
    fetchDevices();
    
    // Polling interval
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full w-full gap-6">
      {/* Sidebar Layout */}
      <div className="w-80 flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-1">
            <Navigation className="w-5 h-5 text-[#061E34]" />
            SIH Monitoring
          </h2>
          <p className="text-xs text-slate-500 mb-6 font-medium">Real-time GPS Tracking Dashboard</p>

          {/* Legend */}
          <div className="space-y-3 mb-6">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-100 pb-2">Status Legend</h4>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span className="w-3 h-3 rounded-full bg-[#10B981] shadow-sm"></span> Safe
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span className="w-3 h-3 rounded-full bg-[#F59E0B] shadow-sm"></span> Warning
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span className="w-3 h-3 rounded-full bg-[#EF4444] shadow-sm"></span> Danger
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-[#9333EA]">
              <span className="w-3 h-3 rounded-full bg-[#9333EA] shadow-sm animate-pulse"></span> SOS Emergency
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-medium border border-red-100 mb-4">
              <AlertTriangle className="w-4 h-4 inline mr-1 mb-0.5" />
              {error}
            </div>
          )}

          {/* Device List Quick View */}
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-100 pb-2">Active Devices ({devices.length})</h4>
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
              {devices.map(dev => (
                <div 
                  key={dev.device_id}
                  onClick={() => {
                    setSelectedDevice(dev);
                    mapRef.current?.setView([dev.latitude, dev.longitude], 15);
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                    dev.status === 'sos' ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {dev.status === 'sos' ? <ShieldAlert className="w-4 h-4 text-purple-600" /> : <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                    <div>
                      <div className="text-xs font-bold text-slate-800">{dev.device_id}</div>
                      <div className="text-[10px] text-slate-500">{dev.tourist_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase" style={{ color: dev.status === 'sos' ? '#9333EA' : dev.status === 'danger' ? '#EF4444' : dev.status === 'warning' ? '#F59E0B' : '#10B981' }}>
                      {dev.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-1.5 relative">
        <div 
          ref={containerRef} 
          className="w-full h-full rounded-lg bg-slate-900 z-0 dark-map-tiles" 
          style={{ minHeight: '500px' }}
        ></div>
      </div>
    </div>
  );
};
