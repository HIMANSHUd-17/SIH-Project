import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TouristApp } from './components/TouristApp';
import { AdminDashboard } from './components/AdminDashboard';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import {
  INITIAL_GEOFENCES,
  INITIAL_INCIDENTS,
  INITIAL_TOURIST,
  SAMPLE_OTHER_TOURISTS,
  SAMPLE_ROUTES,
  EMERGENCY_SERVICES
} from './data/mockData';
import { DynamicGeofence, EmergencyService, IncidentReport, RouteOption, TouristProfile } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tourist' | 'admin' | 'architecture'>('tourist');

  const [tourist, setTourist] = useState<TouristProfile>(INITIAL_TOURIST);
  const [otherTourists, setOtherTourists] = useState<TouristProfile[]>(SAMPLE_OTHER_TOURISTS);
  const [geofences, setGeofences] = useState<DynamicGeofence[]>(INITIAL_GEOFENCES);
  const [incidents, setIncidents] = useState<IncidentReport[]>(INITIAL_INCIDENTS);
  const [routes, setRoutes] = useState<RouteOption[]>(SAMPLE_ROUTES);
  const [emergencyServices] = useState<EmergencyService[]>(EMERGENCY_SERVICES);

  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  // Connect to SSE Live Feed
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/live-stream');

      eventSource.onopen = () => {
        setIsLiveConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'INIT') {
            if (payload.geofences) setGeofences(payload.geofences);
            if (payload.incidents) {
              const unique = Array.from(new Map(payload.incidents.map((i: IncidentReport) => [i.id, i])).values());
              setIncidents(unique as IncidentReport[]);
            }
          } else if (payload.type === 'GEOFENCE_UPDATED') {
            if (payload.allGeofences) setGeofences(payload.allGeofences);
          } else if (payload.type === 'NEW_INCIDENT') {
            if (payload.incident) {
              setIncidents(prev => [payload.incident, ...prev.filter(i => i.id !== payload.incident.id)]);
            }
          } else if (payload.type === 'INCIDENT_UPDATED') {
            if (payload.incident) {
              setIncidents(prev => prev.map(i => i.id === payload.incident.id ? payload.incident : i));
            }
          } else if (payload.type === 'TOURIST_UPDATED') {
            if (payload.tourist) {
              if (payload.tourist.id === tourist.id) {
                setTourist(payload.tourist);
              } else {
                setOtherTourists(prev => prev.map(t => t.id === payload.tourist.id ? payload.tourist : t));
              }
            }
          }
        } catch (err) {
          console.error('SSE JSON error:', err);
        }
      };

      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch (err) {
      console.error('SSE connect error:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [tourist.id]);

  // SOS Trigger Callback
  const handleTriggerSOS = async (details?: { description?: string; mediaUrl?: string }) => {
    try {
      const res = await fetch('/api/incidents/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touristId: tourist.id,
          location: tourist.currentLocation,
          description: details?.description || 'AUTOMATED SOS EMERGENCY TRIGGERED BY TOURIST.',
          mediaUrl: details?.mediaUrl,
          severity: 'CRITICAL'
        })
      });
      const data = await res.json();
      if (data.incident) {
        setIncidents(prev => [data.incident, ...prev.filter(i => i.id !== data.incident.id)]);
        setTourist(prev => ({
          ...prev,
          safetyStatus: 'EMERGENCY_SOS',
          currentRiskScore: 99
        }));
      }
    } catch (err) {
      console.error('SOS trigger error:', err);
    }
  };

  // Dispatch Emergency Unit Callback (Admin Action)
  const handleDispatchUnit = async (incidentId: string, unitType: string, unitName: string) => {
    try {
      const res = await fetch('/api/incidents/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId, unitType, unitName, etaMinutes: 6 })
      });
      const data = await res.json();
      if (data.incident) {
        setIncidents(prev => prev.map(i => i.id === incidentId ? data.incident : i));
      }
    } catch (err) {
      console.error('Dispatch error:', err);
    }
  };

  // Update Dynamic Geofence Parameters (Admin Action)
  const handleUpdateGeofenceParams = async (params: { geofenceId: string; weatherImpact: any; crowdDensityFactor: number }) => {
    try {
      const res = await fetch('/api/geofence/update-params', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (data.updatedGeofence) {
        setGeofences(prev => prev.map(g => g.id === params.geofenceId ? data.updatedGeofence : g));
      }
    } catch (err) {
      console.error('Geofence update error:', err);
    }
  };

  const allTouristsCombined = [tourist, ...otherTourists];
  const pendingIncidentsCount = incidents.filter(i => i.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E4E7] flex flex-col font-sans selection:bg-[#F27D26] selection:text-black">
      
      {/* Top Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLiveConnected={isLiveConnected}
        activeIncidentsCount={pendingIncidentsCount}
        onQuickSOS={() => handleTriggerSOS()}
      />

      {/* Main View Switcher Body */}
      <main className="flex-1">
        {activeTab === 'tourist' && (
          <TouristApp
            tourist={tourist}
            setTourist={setTourist}
            geofences={geofences}
            routes={routes}
            onTriggerSOS={handleTriggerSOS}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            tourists={allTouristsCombined}
            geofences={geofences}
            incidents={incidents}
            emergencyServices={emergencyServices}
            onDispatchUnit={handleDispatchUnit}
            onUpdateGeofenceParams={handleUpdateGeofenceParams}
          />
        )}

        {activeTab === 'architecture' && <ArchitectureDocs />}
      </main>

      {/* Footer */}
      <footer className="h-10 bg-[#09090B] border-t border-[#27272A] px-6 flex items-center justify-between shrink-0 text-[10px] uppercase font-bold text-[#71717A] tracking-wider">
        <div className="flex gap-4">
          <span>System Status: Optimal</span>
          <span className="text-[#F27D26]">Emergency Comms: Mesh Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#E4E4E7]">NAGARJUNA ENCRYPTION ENABLED (AES-256)</span>
        </div>
      </footer>

    </div>
  );
}
