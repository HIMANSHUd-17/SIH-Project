import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { TouristShell } from './components/tourist/TouristShell';
import { TouristLogin } from './components/TouristLogin';
import { GuideLogin } from './components/GuideLogin';
import { GuideDashboard } from './components/guide/GuideDashboard';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { IncidentForm } from './components/IncidentForm';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { SihMonitoringMap } from './components/SihMonitoringMap';
import { AuthGuard } from './components/AuthGuard';
import {
  INITIAL_TOURISTS,
  INITIAL_GEOFENCES,
  SAMPLE_INCIDENTS,
  SAMPLE_CHAT_LOGS
} from './data/mockData';
import { TouristProfile, DynamicGeofence, IncidentReport } from './types';

export const App: React.FC = () => {
  const navigate = useNavigate();

  // Primary State
  const [tourists, setTourists] = useState<TouristProfile[]>(INITIAL_TOURISTS);
  const [activeTourist, setActiveTourist] = useState<TouristProfile>(INITIAL_TOURISTS[0]);
  const [geofences, setGeofences] = useState<DynamicGeofence[]>(INITIAL_GEOFENCES);
  const [incidents, setIncidents] = useState<IncidentReport[]>(SAMPLE_INCIDENTS);
  const [chatLogs, setChatLogs] = useState<Record<string, any[]>>(SAMPLE_CHAT_LOGS);

  // Load tourists from API
  const fetchTourists = useCallback(async () => {
    try {
      const adminToken = localStorage.getItem('safeyatra_admin_token') || sessionStorage.getItem('safeyatra_admin_token') || '';
      const headers: Record<string, string> = {};
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      const res = await fetch('/api/tourists', { headers });
      if (res.ok) {
        const data: TouristProfile[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTourists(data);
          const activeId = sessionStorage.getItem('activeTouristId') || localStorage.getItem('activeTouristId');
          const found = data.find(t => t.id === activeId);
          if (found) {
            setActiveTourist(found);
          } else {
            setActiveTourist(data[0]);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch tourists from backend, using defaults.');
    }
  }, []);

  // SSE Live Stream Connection
  useEffect(() => {
    fetchTourists();

    fetch('/api/chat/messages')
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object') setChatLogs(data);
      })
      .catch(() => {});

    fetch('/api/incidents')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setIncidents(data);
      })
      .catch(() => {});

    const adminToken = localStorage.getItem('safeyatra_admin_token') || sessionStorage.getItem('safeyatra_admin_token') || '';
    const sseUrl = adminToken ? `/api/live-stream?token=${encodeURIComponent(adminToken)}` : '/api/live-stream';
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'INIT') {
          if (data.geofences) setGeofences(data.geofences);
          if (data.incidents) setIncidents(data.incidents);
          if (data.tourists) setTourists(data.tourists);
          if (data.chatLogs) setChatLogs(data.chatLogs);
        } else if (data.type === 'TOURISTS_LIST_UPDATED') {
          if (data.tourists) setTourists(data.tourists);
        } else if (data.type === 'TOURIST_LOCATION_UPDATE' || data.type === 'TOURIST_UPDATED') {
          if (data.tourists) setTourists(data.tourists);
          const activeId = sessionStorage.getItem('activeTouristId') || localStorage.getItem('activeTouristId');
          if (data.tourist && (data.tourist.id === activeId || !activeId)) {
            setActiveTourist(data.tourist);
          }
        } else if (data.type === 'NEW_INCIDENT') {
          if (data.allIncidents) setIncidents(data.allIncidents);
          if (data.tourists) setTourists(data.tourists);
          if (data.chatLogs) setChatLogs(data.chatLogs);
        } else if (data.type === 'SOS_STOPPED') {
          if (data.allIncidents) setIncidents(data.allIncidents);
          if (data.tourists) setTourists(data.tourists);
          if (data.chatLogs) setChatLogs(data.chatLogs);
          const activeId = sessionStorage.getItem('activeTouristId') || localStorage.getItem('activeTouristId');
          if (data.tourist && (data.tourist.id === activeId || !activeId)) {
            setActiveTourist(data.tourist);
          }
        } else if (data.type === 'INCIDENT_UPDATED') {
          if (data.allIncidents) setIncidents(data.allIncidents);
          else if (data.incident) {
            setIncidents(prev => prev.map(i => i.id === data.incident.id ? data.incident : i));
          }
          if (data.tourists) setTourists(data.tourists);
          const activeId = sessionStorage.getItem('activeTouristId') || localStorage.getItem('activeTouristId');
          if (data.tourist && (data.tourist.id === activeId || !activeId)) {
            setActiveTourist(data.tourist);
          }
        } else if (data.type === 'CHAT_MESSAGE' || data.type === 'CHAT_CLEARED') {
          if (data.chatLogs) {
            setChatLogs(data.chatLogs);
          } else if (data.message) {
            const msg = data.message;
            setChatLogs(prev => {
              const next = { ...prev };
              const keys = [msg.channel, msg.incidentId, msg.touristId, `guide_${msg.touristId}`, `admin_${msg.touristId}`].filter(Boolean);
              keys.forEach(k => {
                if (!next[k]) next[k] = [];
                if (!next[k].some(m => m.id === msg.id)) next[k].push(msg);
              });
              return next;
            });
          }
        } else if (data.type === 'GEOFENCE_UPDATED') {
          if (data.allGeofences) setGeofences(data.allGeofences);
          else if (data.geofence) {
            setGeofences(prev => prev.map(g => g.id === data.geofence.id ? data.geofence : g));
          }
        }
      } catch (err) {
        console.error('SSE Message parsing error:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [fetchTourists]);

  // SOS Trigger Handler
  const handleTriggerSOS = async (details?: {
    description?: string;
    mediaUrl?: string;
    serviceNeeded?: string;
    isGuideSOS?: boolean;
    guideId?: string;
    guideName?: string;
    guideMobile?: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }) => {
    try {
      const payload: any = {
        severity: details?.severity || 'CRITICAL',
        description: details?.description || 'Emergency SOS Triggered.',
        mediaUrl: details?.mediaUrl,
        serviceNeeded: details?.serviceNeeded,
        isGuideSOS: details?.isGuideSOS,
        guideId: details?.guideId,
        guideName: details?.guideName,
        guideMobile: details?.guideMobile
      };

      if (details?.isGuideSOS) {
        payload.touristId = details.guideId || 'G-1001';
        payload.touristName = `Guide: ${details.guideName || 'Tour Guide'}`;
        payload.location = activeTourist?.currentLocation || { lat: 20.5937, lng: 78.9629, address: 'India' };
      } else {
        payload.touristId = activeTourist.id;
        payload.touristName = activeTourist.name;
        payload.location = activeTourist.currentLocation;
      }

      const res = await fetch('/api/incidents/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.allIncidents) setIncidents(data.allIncidents);
      }
    } catch (err) {
      console.error('Failed to trigger SOS:', err);
    }
  };

  // Stop SOS Handler
  const handleStopSOS = async (targetId?: string) => {
    const touristId = targetId || activeTourist.id;
    try {
      const res = await fetch('/api/incidents/stop-sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ touristId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.allIncidents) setIncidents(data.allIncidents);
        if (data.tourist) {
          setActiveTourist(data.tourist);
          setTourists(prev => prev.map(t => t.id === data.tourist.id ? data.tourist : t));
        }
      }
    } catch (err) {
      console.error('Failed to stop SOS:', err);
    }
  };

  // Register Tourist Handler
  const handleRegisterTourist = async (touristData: any): Promise<TouristProfile | null> => {
    try {
      const res = await fetch('/api/tourists/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(touristData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tourist) {
          setTourists(prev => [...prev, data.tourist]);
          return data.tourist;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to register tourist.');
      }
    } catch (err) {
      console.error('Registration failed:', err);
    }
    return null;
  };

  // Delete Tourist Handler
  const handleDeleteTourist = async (id: string) => {
    const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/tourists/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setTourists(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Delete tourist error:', err);
    }
  };

  // Tourist Login Handler
  const handleLoginTourist = (touristId: string, _mobile?: string): TouristProfile | null => {
    const match = tourists.find(t => t.id.toLowerCase() === touristId.toLowerCase());
    if (match) {
      setActiveTourist(match);
      sessionStorage.setItem('activeTouristId', match.id);
      localStorage.setItem('activeTouristId', match.id);
      return match;
    }
    return null;
  };

  // Message Sender
  const handleSendMessage = async (text: string, recipient: 'admin' | 'guide' | 'guide_group' = 'admin') => {
    let targetGuideId = activeTourist.guide_id;
    if (!targetGuideId && activeTourist.id?.startsWith('T-')) {
      const parts = activeTourist.id.split('-');
      if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
        targetGuideId = `G-${parts[1]}`;
      }
    }
    if (!targetGuideId) targetGuideId = 'G-1001';

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const now = Date.now();
    const payload = {
      incidentId: undefined,
      touristId: activeTourist.id,
      touristName: activeTourist.name,
      guideId: targetGuideId,
      sender: activeTourist.name,
      senderRole: 'tourist',
      recipientRole: recipient,
      channel: recipient,
      text: text.trim(),
      time: timestamp,
      timestamp: now
    };

    // Optimistic local state update
    setChatLogs(prev => {
      const next = { ...prev };
      const keys = [
        recipient,
        activeTourist.id,
        `${recipient}_${activeTourist.id}`,
        `conv_${activeTourist.id}_${recipient}`
      ];
      if (recipient === 'guide_group') {
        keys.push(`group_${targetGuideId}`);
        keys.push('guide_group');
      }
      keys.forEach(k => {
        if (!next[k]) next[k] = [];
        next[k] = [...next[k], payload];
      });
      return next;
    });

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.chatLogs) setChatLogs(data.chatLogs);
      }
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Tourist Authentication & Portal */}
      <Route
        path="/tourist/login"
        element={
          <TouristLogin
            onLoginTourist={handleLoginTourist}
            onRegisterTourist={handleRegisterTourist}
          />
        }
      />
      <Route
        path="/tourist/*"
        element={
          <TouristShell
            tourist={activeTourist}
            setTourist={setActiveTourist}
            geofences={geofences}
            incidents={incidents}
            onTriggerSOS={handleTriggerSOS}
            onStopSOS={handleStopSOS}
            chatLogs={chatLogs}
            setChatLogs={setChatLogs}
            onSendAdminMessage={handleSendMessage}
          />
        }
      />

      {/* Guide Authentication & Portal */}
      <Route path="/guide/login" element={<GuideLogin />} />
      <Route
        path="/guide/*"
        element={
          <GuideDashboard
            tourists={tourists}
            incidents={incidents}
            onRegisterTourist={handleRegisterTourist}
            onDeleteTourist={handleDeleteTourist}
            onTriggerSOS={handleTriggerSOS}
            chatLogs={chatLogs}
            setChatLogs={setChatLogs}
          />
        }
      />

      {/* Admin Authentication & Portal */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/*"
        element={
          <AuthGuard role="admin">
            <AdminDashboard
              tourists={tourists}
              geofences={geofences}
              incidents={incidents}
              emergencyServices={[]}
              onDispatchUnit={async (incidentId, unitType, unitName) => {
                const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
                await fetch('/api/incidents/dispatch', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : ''
                  },
                  body: JSON.stringify({ incidentId, unitType, unitName, etaMinutes: 5 })
                });
              }}
              onUpdateGeofenceParams={async (params) => {
                const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
                await fetch('/api/geofence/update-params', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : ''
                  },
                  body: JSON.stringify(params)
                });
              }}
              onDeleteTourist={handleDeleteTourist}
              onExitAdmin={() => {
                sessionStorage.removeItem('adminToken');
                localStorage.removeItem('adminToken');
                navigate('/');
              }}
              chatLogs={chatLogs}
              setChatLogs={setChatLogs}
            />
          </AuthGuard>
        }
      />

      {/* Web3 / IPFS Incident Evidence Reporting */}
      <Route path="/report-incident" element={<IncidentForm />} />

      {/* Documentation & Interactive Monitoring Map */}
      <Route path="/docs" element={<ArchitectureDocs />} />
      <Route path="/map" element={<SihMonitoringMap />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
