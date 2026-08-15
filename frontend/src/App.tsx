import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { LandingPage } from './components/LandingPage';
import { TouristShell } from './components/tourist/TouristShell';
import { AdminDashboard } from './components/AdminDashboard';
import { GuideDashboard } from './components/guide/GuideDashboard';
import { AdminLogin } from './components/AdminLogin';
import { GuideLogin } from './components/GuideLogin';
import { TouristLogin } from './components/TouristLogin';
import { AuthGuard } from './components/AuthGuard';
import {
  INITIAL_GEOFENCES,
  SAMPLE_ROUTES,
  EMERGENCY_SERVICES
} from './data/mockData';
import { DynamicGeofence, EmergencyService, IncidentReport, RouteOption, TouristProfile } from './types';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();


  const [tourist, setTourist] = useState<TouristProfile>({
    id: '',
    name: '',
    nationality: '',
    blockchainDid: '',
    identityHash: '',
    emergencyContact: '',
    bloodType: '',
    safetyStatus: 'SAFE',
    currentLocation: { lat: 0, lng: 0, address: '' },
    lastUpdated: '',
    batteryLevel: 100,
    currentRiskScore: 0
  });
  const [otherTourists, setOtherTourists] = useState<TouristProfile[]>([]);
  const [geofences, setGeofences] = useState<DynamicGeofence[]>(INITIAL_GEOFENCES);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>(SAMPLE_ROUTES);
  const [emergencyServices] = useState<EmergencyService[]>(EMERGENCY_SERVICES);

  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  // Shared Chat State between Tourist and Admin
  const [chatLogs, setChatLogs] = useState<Record<string, { sender: string; text: string; time: string; latency?: string }[]>>({});

  // Load tourists from API on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [tRes, cRes, iRes] = await Promise.all([
          fetch('/api/tourists'),
          fetch('/api/chat/messages'),
          fetch('/api/incidents')
        ]);
        if (tRes.ok) {
          const data: TouristProfile[] = await tRes.json();
          if (data && data.length > 0) {
            const savedId = localStorage.getItem('activeTouristId');
            const active = (savedId ? data.find(t => t.id === savedId) : null) || data[0];
            setTourist(active);
            setOtherTourists(data.filter(t => t.id !== active.id));
          }
        }
        if (cRes.ok) {
          const logs = await cRes.json();
          setChatLogs(logs || {});
        }
        if (iRes.ok) {
          const incData = await iRes.json();
          if (Array.isArray(incData) && incData.length > 0) {
            setIncidents(incData);
          }
        }
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    };
    fetchInitialData();
  }, []);

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
            if (payload.tourists && payload.tourists.length > 0) {
              const savedId = localStorage.getItem('activeTouristId') || tourist.id;
              const active = payload.tourists.find((t: any) => t.id === savedId) || payload.tourists[0];
              setTourist(active);
              setOtherTourists(payload.tourists.filter((t: any) => t.id !== active.id));
            }
          } else if (payload.type === 'TOURISTS_LIST_UPDATED') {
            if (payload.tourists && payload.tourists.length > 0) {
              const savedId = localStorage.getItem('activeTouristId') || tourist.id;
              const active = payload.tourists.find((t: any) => t.id === savedId) || payload.tourists[0];
              setTourist(active);
              setOtherTourists(payload.tourists.filter((t: any) => t.id !== active.id));
            }
          } else if (payload.type === 'CHAT_MESSAGE') {
            if (payload.chatLogs) {
              setChatLogs(payload.chatLogs);
            } else if (payload.message) {
              const msg = payload.message;
              setChatLogs(prev => {
                const next = { ...prev };
                if (msg.channel === 'guide') {
                  if (msg.touristId) {
                    next[`guide_${msg.touristId}`] = [...(next[`guide_${msg.touristId}`] || []), msg];
                  }
                } else if (msg.channel === 'group') {
                  const gKey = msg.guideId ? `group_${msg.guideId}` : 'group_default';
                  next[gKey] = [...(next[gKey] || []), msg];
                  next['global'] = [...(next['global'] || []), msg];
                } else {
                  if (payload.incidentId) {
                    next[payload.incidentId] = [...(next[payload.incidentId] || []), msg];
                  }
                  if (msg.touristId) {
                    next[`admin_${msg.touristId}`] = [...(next[`admin_${msg.touristId}`] || []), msg];
                    next[msg.touristId] = [...(next[msg.touristId] || []), msg];
                  }
                }
                return next;
              });
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
          } else if (payload.type === 'TOURIST_LOCATION_UPDATE') {
            if (payload.tourists && payload.tourists.length > 0) {
              const savedId = localStorage.getItem('activeTouristId') || tourist.id;
              const active = payload.tourists.find((t: any) => t.id === savedId) || payload.tourists[0];
              if (active) setTourist(active);
              setOtherTourists(payload.tourists.filter((t: any) => t.id !== active?.id));
            } else if (payload.tourist) {
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
  const handleTriggerSOS = async (details?: { description?: string; mediaUrl?: string; severity?: any }) => {
    try {
      const res = await fetch('/api/incidents/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touristId: tourist.id,
          location: tourist.currentLocation,
          description: details?.description || 'AUTOMATED SOS EMERGENCY TRIGGERED BY TOURIST.',
          mediaUrl: details?.mediaUrl,
          severity: details?.severity || 'CRITICAL'
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
      if (data.allIncidents) {
        setIncidents(data.allIncidents);
      }
    } catch (err) {
      console.error('SOS trigger error:', err);
    }
  };

  // Dispatch Emergency Unit Callback (Admin Action)
  const handleDispatchUnit = async (incidentId: string, unitType: string, unitName: string) => {
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      const res = await fetch('/api/incidents/dispatch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {})
        },
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
      const adminToken = sessionStorage.getItem('adminToken');
      const res = await fetch('/api/geofence/update-params', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {})
        },
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

  const handleLoginTourist = async (touristId: string, mobileNumber?: string): Promise<TouristProfile | null> => {
    let list = [tourist, ...otherTourists];
    try {
      const res = await fetch('/api/tourists');
      if (res.ok) {
        list = await res.json();
      }
    } catch (e) {
      console.error(e);
    }
    const cleanId = touristId.trim().toLowerCase();
    const target = list.find(t => t.id.toLowerCase() === cleanId);
    if (!target) return null;

    if (mobileNumber && mobileNumber.trim()) {
      const cleanInput = mobileNumber.replace(/\D/g, '');
      const cleanTargetMobile = (target.mobile || '').replace(/\D/g, '');
      const cleanEmergency = (target.emergencyContact || '').replace(/\D/g, '');

      const isMobileMatch = (cleanTargetMobile && (cleanTargetMobile.endsWith(cleanInput) || cleanInput.endsWith(cleanTargetMobile))) ||
                            (cleanEmergency && (cleanEmergency.endsWith(cleanInput) || cleanInput.endsWith(cleanEmergency))) ||
                            (target.email && target.email.toLowerCase() === mobileNumber.trim().toLowerCase());

      if (!isMobileMatch && cleanTargetMobile.length > 0) {
        return null;
      }
    }

    localStorage.setItem('activeTouristId', target.id);
    setTourist(target);
    setOtherTourists(list.filter(t => t.id !== target.id));
    return target;
  };

  const handleRegisterTourist = async (touristData: any): Promise<TouristProfile | null> => {
    try {
      const res = await fetch('/api/tourists/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(touristData)
      });
      const data = await res.json();
      if (data.success && data.tourist) {
        setOtherTourists(prev => {
          if (prev.some(t => t.id === data.tourist.id)) return prev;
          return [...prev, data.tourist];
        });
        return data.tourist;
      }
    } catch (err) {
      console.error('Registration error:', err);
    }
    return null;
  };

  const handleDeleteTourist = async (touristId: string) => {
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      const res = await fetch(`/api/tourists/${touristId}`, {
        method: 'DELETE',
        headers: {
          ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        if (tourist.id === touristId) {
          const freshRes = await fetch('/api/tourists');
          const freshData: TouristProfile[] = await freshRes.json();
          const fallback = freshData[0] || null;
          if (fallback) {
            localStorage.setItem('activeTouristId', fallback.id);
            setTourist(fallback);
            setOtherTourists(freshData.filter(t => t.id !== fallback.id));
          }
        } else {
          setOtherTourists(prev => prev.filter(t => t.id !== touristId));
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Handle Tourist Messages to Admin vs Guide
  const handleTouristMessage = async (text: string, recipient: 'admin' | 'guide' = 'admin') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const targetGuideId = tourist.guide_id || 'G-1001';

    if (recipient === 'guide') {
      const newMsg = {
        sender: tourist.name || 'Tourist',
        senderRole: 'tourist',
        recipientRole: 'guide',
        channel: 'guide',
        text,
        time: timestamp,
        touristId: tourist.id,
        touristName: tourist.name,
        guideId: targetGuideId
      };

      setChatLogs(prev => ({
        ...prev,
        [`guide_${tourist.id}`]: [...(prev[`guide_${tourist.id}`] || []), newMsg]
      }));

      try {
        await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            touristId: tourist.id,
            touristName: tourist.name,
            guideId: targetGuideId,
            sender: tourist.name || 'Tourist',
            senderRole: 'tourist',
            recipientRole: 'guide',
            channel: 'guide',
            text,
            time: timestamp
          })
        });
      } catch (err) {
        console.error('Failed to post tourist guide message to server:', err);
      }
    } else {
      // Recipient is ADMIN (Authority Command Center)
      let activeInc = incidents.find(i => (i.touristId === tourist.id || i.touristName === tourist.name) && i.status !== 'RESOLVED');
      let incId = activeInc ? activeInc.id : '';
      if (!incId) {
        const newIncId = `INC-${Date.now().toString().slice(-4)}`;
        const mockIncident: IncidentReport = {
          id: newIncId,
          touristId: tourist.id,
          touristName: tourist.name,
          type: 'SOS_TRIGGERED',
          description: `Direct inquiry from tourist ${tourist.name}`,
          location: tourist.currentLocation,
          timestamp: new Date().toLocaleTimeString(),
          status: 'PENDING',
          severity: 'LOW',
          assignedUnit: undefined
        };
        setIncidents(prev => [mockIncident, ...prev]);
        incId = newIncId;
      }

      const newMsg = {
        sender: tourist.name || 'Tourist',
        senderRole: 'tourist',
        recipientRole: 'admin',
        channel: 'admin',
        text,
        time: timestamp,
        latency: '12ms',
        touristId: tourist.id,
        touristName: tourist.name,
        incidentId: incId
      };

      setChatLogs(prev => ({
        ...prev,
        [incId]: [...(prev[incId] || []), newMsg],
        [`admin_${tourist.id}`]: [...(prev[`admin_${tourist.id}`] || []), newMsg],
        [tourist.id]: [...(prev[tourist.id] || []), newMsg],
        [tourist.name]: [...(prev[tourist.name] || []), newMsg]
      }));

      try {
        await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incidentId: incId,
            touristId: tourist.id,
            touristName: tourist.name,
            sender: tourist.name || 'Tourist',
            senderRole: 'tourist',
            recipientRole: 'admin',
            channel: 'admin',
            text,
            time: timestamp
          })
        });
      } catch (err) {
        console.error('Failed to post tourist message to server:', err);
      }
    }
  };

  const allTouristsCombined = [tourist, ...otherTourists];
  const pendingIncidentsCount = incidents.filter(i => i.status === 'PENDING').length;

  if (!tourist) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-[#E4E4E7] flex items-center justify-center font-bold text-xs uppercase tracking-widest">
        Loading Tourist Safety System...
      </div>
    );
  }

  const isLanding = location.pathname === '/';
  const isTourist = location.pathname.startsWith('/tourist');
  const isAdmin = location.pathname.startsWith('/admin');
  const isGuide = location.pathname.startsWith('/guide');
  const isLogin = location.pathname.endsWith('/login');

  return (
    <>
    <div className={`min-h-screen flex flex-col font-sans ${isTourist || isLanding ? '' : 'bg-[#0A0A0B] text-[#E4E4E7] selection:bg-[#F27D26] selection:text-black'}`}>
      


      <main className="flex-1 flex flex-col min-h-0 min-w-0">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/guide/login" element={<GuideLogin />} />
          <Route path="/tourist/login" element={<TouristLogin onLoginTourist={handleLoginTourist} />} />

          {/* Tourist Routes */}
          <Route path="/tourist/dashboard" element={
            <TouristShell
              tourist={tourist}
              setTourist={setTourist}
              geofences={geofences}
              incidents={incidents}
              onTriggerSOS={handleTriggerSOS}
              chatLogs={chatLogs}
              setChatLogs={setChatLogs}
              onSendAdminMessage={handleTouristMessage}
            />
          } />
          <Route path="/tourist/messages" element={
            <TouristShell
              tourist={tourist}
              setTourist={setTourist}
              geofences={geofences}
              incidents={incidents}
              onTriggerSOS={handleTriggerSOS}
              chatLogs={chatLogs}
              setChatLogs={setChatLogs}
              onSendAdminMessage={handleTouristMessage}
            />
          } />
          <Route path="/tourist/report-incident" element={
            <TouristShell
              tourist={tourist}
              setTourist={setTourist}
              geofences={geofences}
              incidents={incidents}
              onTriggerSOS={handleTriggerSOS}
              chatLogs={chatLogs}
              setChatLogs={setChatLogs}
              onSendAdminMessage={handleTouristMessage}
            />
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <AuthGuard role="admin">
              <AdminDashboard
                tourists={allTouristsCombined}
                geofences={geofences}
                incidents={incidents}
                emergencyServices={emergencyServices}
                onDispatchUnit={handleDispatchUnit}
                onUpdateGeofenceParams={handleUpdateGeofenceParams}
                onRegisterTourist={handleRegisterTourist}
                onDeleteTourist={handleDeleteTourist}
                onExitAdmin={() => navigate('/')}
                chatLogs={chatLogs}
                setChatLogs={setChatLogs}
              />
            </AuthGuard>
          } />
          <Route path="/admin/tourists" element={
            <AuthGuard role="admin">
              <AdminDashboard
                tourists={allTouristsCombined}
                geofences={geofences}
                incidents={incidents}
                emergencyServices={emergencyServices}
                onDispatchUnit={handleDispatchUnit}
                onUpdateGeofenceParams={handleUpdateGeofenceParams}
                onRegisterTourist={handleRegisterTourist}
                onDeleteTourist={handleDeleteTourist}
                onExitAdmin={() => navigate('/')}
                chatLogs={chatLogs}
                setChatLogs={setChatLogs}
              />
            </AuthGuard>
          } />
          <Route path="/admin/inbox" element={
            <AuthGuard role="admin">
              <AdminDashboard
                tourists={allTouristsCombined}
                geofences={geofences}
                incidents={incidents}
                emergencyServices={emergencyServices}
                onDispatchUnit={handleDispatchUnit}
                onUpdateGeofenceParams={handleUpdateGeofenceParams}
                onRegisterTourist={handleRegisterTourist}
                onDeleteTourist={handleDeleteTourist}
                onExitAdmin={() => navigate('/')}
                chatLogs={chatLogs}
                setChatLogs={setChatLogs}
              />
            </AuthGuard>
          } />
          <Route path="/admin/guides" element={
            <AuthGuard role="admin">
              <AdminDashboard
                tourists={allTouristsCombined}
                geofences={geofences}
                incidents={incidents}
                emergencyServices={emergencyServices}
                onDispatchUnit={handleDispatchUnit}
                onUpdateGeofenceParams={handleUpdateGeofenceParams}
                onRegisterTourist={handleRegisterTourist}
                onDeleteTourist={handleDeleteTourist}
                onExitAdmin={() => navigate('/')}
                chatLogs={chatLogs}
                setChatLogs={setChatLogs}
              />
            </AuthGuard>
          } />

          {/* Guide Routes */}
          <Route path="/guide/dashboard" element={
            <AuthGuard role="guide">
              <GuideDashboard
                tourists={allTouristsCombined}
                geofences={geofences}
                incidents={incidents}
                emergencyServices={emergencyServices}
                onTriggerSOS={() => handleTriggerSOS()}
                onExitGuide={() => navigate('/')}
                onRegisterTourist={handleRegisterTourist}
                onDeleteTourist={handleDeleteTourist}
                chatLogs={chatLogs}
                setChatLogs={setChatLogs}
              />
            </AuthGuard>
          } />
          <Route path="/guide/group" element={
            <AuthGuard role="guide">
              <GuideDashboard
                tourists={allTouristsCombined}
                geofences={geofences}
                incidents={incidents}
                emergencyServices={emergencyServices}
                onTriggerSOS={() => handleTriggerSOS()}
                onExitGuide={() => navigate('/')}
                onRegisterTourist={handleRegisterTourist}
                onDeleteTourist={handleDeleteTourist}
                chatLogs={chatLogs}
                setChatLogs={setChatLogs}
              />
            </AuthGuard>
          } />
          <Route path="/guide/chat" element={
            <AuthGuard role="guide">
              <GuideDashboard
                tourists={allTouristsCombined}
                geofences={geofences}
                incidents={incidents}
                emergencyServices={emergencyServices}
                onTriggerSOS={() => handleTriggerSOS()}
                onExitGuide={() => navigate('/')}
                onRegisterTourist={handleRegisterTourist}
                onDeleteTourist={handleDeleteTourist}
                chatLogs={chatLogs}
                setChatLogs={setChatLogs}
              />
            </AuthGuard>
          } />
          <Route path="/guide/alerts" element={
            <AuthGuard role="guide">
              <GuideDashboard
                tourists={allTouristsCombined}
                geofences={geofences}
                incidents={incidents}
                emergencyServices={emergencyServices}
                onTriggerSOS={() => handleTriggerSOS()}
                onExitGuide={() => navigate('/')}
                onRegisterTourist={handleRegisterTourist}
                onDeleteTourist={handleDeleteTourist}
                chatLogs={chatLogs}
                setChatLogs={setChatLogs}
              />
            </AuthGuard>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

    </div>
    </>
  );
}
