import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Users, AlertTriangle, MessageSquare,
  Flame, LogOut, Search, Bell, Settings,
  Activity, ShieldAlert, X, Megaphone, Send, CheckCircle,
  Phone, Mail, Globe, User, Edit2, Save, Mic, MicOff,
  SlidersHorizontal
} from 'lucide-react';
import { TouristProfile, DynamicGeofence, IncidentReport, EmergencyService } from '../../types';
import { GuideOverview } from './GuideOverview';
import { GuideGroupTable } from './GuideGroupTable';
import { GuideChat } from './GuideChat';
import { GuideAiMonitoring } from './GuideAiMonitoring';
import { useLanguage, LanguageSelector } from '../../utils/LanguageContext';

interface GuideDashboardProps {
  tourists: TouristProfile[];
  geofences?: DynamicGeofence[];
  incidents?: IncidentReport[];
  emergencyServices?: EmergencyService[];
  onTriggerSOS: (details?: { description?: string; mediaUrl?: string; isGuideSOS?: boolean; guideId?: string; guideName?: string; guideMobile?: string }) => void;
  onExitGuide?: () => void;
  onRegisterTourist: (data: any) => Promise<TouristProfile | null>;
  onDeleteTourist: (id: string) => Promise<void>;
  chatLogs?: Record<string, any[]>;
  setChatLogs?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

type SubTab = 'overview' | 'safety' | 'group' | 'chat';
type GuideSOSStep = 'IDLE' | 'REQUESTING_MIC' | 'MIC_ACTIVE' | 'MIC_DENIED' | 'TRANSMITTING' | 'SUBMITTED' | 'CANCELLED';

const navItems: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'safety', label: 'AI Safety Monitor', icon: Activity },
  { id: 'group', label: 'My Group', icon: Users },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
];

const broadcastTemplates = [
  { label: '📢 Assembly', text: 'Attention group: Please assemble at the designated meeting point immediately.' },
  { label: '⏰ Schedule', text: 'Schedule update: Our next stop departure has been adjusted. Please be ready in 10 minutes.' },
  { label: '⚠️ Weather', text: 'Weather advisory: Please prepare for changing conditions and carry your rain gear.' },
  { label: '🏛️ Destination', text: 'We have arrived at our next stop. Please stay together and follow guide instructions.' },
  { label: '✅ Status Check', text: 'Group check-in: Please reply with your status if you need assistance.' },
];

export const GuideDashboard: React.FC<GuideDashboardProps> = ({
  tourists,
  geofences = [],
  incidents = [],
  emergencyServices = [],
  onTriggerSOS,
  onExitGuide,
  onRegisterTourist,
  onDeleteTourist,
  chatLogs,
  setChatLogs
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage('guide');
  const [currentGuide, setCurrentGuide] = useState<any>(null);
  const [loadingGuide, setLoadingGuide] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ── New SIH-2026 Modals State ──
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showSOS, setShowSOS] = useState(false);

  // ── Guide SOS state machine ──
  const [guideSOSStep, setGuideSOSStep] = useState<GuideSOSStep>('IDLE');
  const [guideSOSCountdown, setGuideSOSCountdown] = useState(5);
  const guideSOSTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const guideMicStreamRef = useRef<MediaStream | null>(null);

  // ── Profile edit state ──
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Record<string, string>>({});
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Settings state ──
  const [settings, setSettings] = useState({
    sosAlerts: true,
    messageNotifications: true,
    soundEnabled: true,
  });

  // ── Broadcast state ──
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  useEffect(() => {
    const fetchGuide = async () => {
      const token = sessionStorage.getItem('guide_token') || sessionStorage.getItem('guideToken') || localStorage.getItem('guide_token') || localStorage.getItem('guideToken');
      if (!token) {
        navigate('/guide/login');
        return;
      }

      try {
        const response = await fetch('/api/v1/guides/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Unauthorized');
        }

        const data = await response.json();
        setCurrentGuide(data);
        setProfileForm({
          full_name: data.full_name || '',
          email: data.email || 'guide@safeyatra.gov.in',
          phone: data.mobile_number || data.phone || '+91 98765 43210',
          languages: data.languages || 'English, Hindi',
          license_number: data.license_number || data.license_no || 'UK-GD-2026-8841',
          experience_years: String(data.years_experience || 5),
        });
      } catch (err) {
        console.error(err);
        sessionStorage.removeItem('guide_token');
        sessionStorage.removeItem('guideToken');
        localStorage.removeItem('guide_token');
        localStorage.removeItem('guideToken');
        navigate('/guide/login');
      } finally {
        setLoadingGuide(false);
      }
    };

    fetchGuide();
  }, [navigate]);

  // Clean up timer and media stream
  useEffect(() => {
    return () => {
      if (guideSOSTimerRef.current) clearInterval(guideSOSTimerRef.current);
      if (guideMicStreamRef.current) {
        guideMicStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (loadingGuide) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gd-bg text-gd-primary font-guide text-sm font-bold tracking-widest uppercase">
        Loading Guide Portal...
      </div>
    );
  }

  let activeSubTab: SubTab = 'overview';
  if (location.pathname.endsWith('/safety') || location.pathname.endsWith('/ai-monitoring')) activeSubTab = 'safety';
  else if (location.pathname.endsWith('/group')) activeSubTab = 'group';
  else if (location.pathname.endsWith('/chat')) activeSubTab = 'chat';

  const pendingAlerts = incidents.filter(i => i.status === 'PENDING' || i.status === 'DISPATCHED').length;

  // Filter tourists for this logged-in guide
  const guideTourists = currentGuide
    ? tourists.filter(t => {
        if (t.guide_id) return t.guide_id === currentGuide.guide_id;
        if (t.id && t.id.startsWith('T-')) {
          const parts = t.id.split('-');
          if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
            return `G-${parts[1]}` === currentGuide.guide_id;
          }
        }
        return true;
      })
    : tourists;

  // ── Guide SOS Handler ──
  const handleStartGuideSOS = () => {
    setShowSOS(true);
    setGuideSOSStep('REQUESTING_MIC');
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(stream => {
        guideMicStreamRef.current = stream;
        setGuideSOSStep('MIC_ACTIVE');
        startGuideSOSCountdown();
      })
      .catch(() => {
        setGuideSOSStep('MIC_DENIED');
        startGuideSOSCountdown();
      });
  };

  const startGuideSOSCountdown = () => {
    if (guideSOSTimerRef.current) clearInterval(guideSOSTimerRef.current);
    setGuideSOSStep('TRANSMITTING');
    setGuideSOSCountdown(5);

    let count = 5;
    guideSOSTimerRef.current = setInterval(() => {
      count -= 1;
      setGuideSOSCountdown(count);
      if (count <= 0) {
        if (guideSOSTimerRef.current) {
          clearInterval(guideSOSTimerRef.current);
          guideSOSTimerRef.current = null;
        }
        onTriggerSOS({
          description: `Group Emergency SOS initiated by Tour Guide ${currentGuide?.full_name || 'Officer'} (${currentGuide?.guide_id || 'G-1001'}).`,
          isGuideSOS: true,
          guideId: currentGuide?.guide_id || 'G-1001',
          guideName: currentGuide?.full_name || 'Tour Guide',
          guideMobile: currentGuide?.mobile_number
        });
        setGuideSOSStep('SUBMITTED');
      }
    }, 1000);
  };

  const handleCancelGuideSOS = () => {
    if (guideSOSTimerRef.current) {
      clearInterval(guideSOSTimerRef.current);
      guideSOSTimerRef.current = null;
    }
    if (guideMicStreamRef.current) {
      guideMicStreamRef.current.getTracks().forEach(track => track.stop());
      guideMicStreamRef.current = null;
    }
    setGuideSOSStep('CANCELLED');
    setTimeout(() => {
      setShowSOS(false);
      setGuideSOSStep('IDLE');
    }, 1200);
  };

  // ── Broadcast Sender ──
  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'guide',
          sender: currentGuide?.full_name || 'Tour Guide',
          senderRole: 'guide',
          recipientRole: 'tourist',
          text: `📢 [BROADCAST]: ${broadcastText.trim()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
      });
      setBroadcastSent(true);
      setTimeout(() => {
        setBroadcastSent(false);
        setBroadcastText('');
        setShowBroadcast(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const token = sessionStorage.getItem('guide_token') || localStorage.getItem('guide_token');
      if (token && currentGuide?.guide_id) {
        await fetch(`/api/v1/guides/${currentGuide.guide_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(profileForm)
        });
      }
      setCurrentGuide((prev: any) => ({ ...prev, ...profileForm }));
      setEditingProfile(false);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="guide-dashboard flex h-screen w-full bg-gd-bg text-gd-on-bg font-guide antialiased overflow-hidden">
      {/* ═══════════════════════════════════════════════ */}
      {/* SideNavBar (Original SIH-Project Layout)        */}
      {/* ═══════════════════════════════════════════════ */}
      <nav className="bg-gd-surface text-gd-primary fixed left-0 top-0 h-full w-[280px] border-r border-gd-outline-var flex flex-col py-4 px-2 gap-4 z-30">
        {/* Header */}
        <div className="flex flex-col gap-2 px-2 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gd-primary flex items-center justify-center text-white font-bold text-xl border border-gd-outline-var shadow-sm">
              {currentGuide ? currentGuide.full_name.charAt(0).toUpperCase() : 'G'}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-gd-primary font-guide truncate">{currentGuide ? currentGuide.full_name : 'Tour Guide'}</h2>
              <p className="text-[11px] font-medium text-gd-on-surface-var">ID: {currentGuide ? currentGuide.guide_id : '...'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-1 flex-1">
          {navItems.map(item => {
            const isActive = activeSubTab === item.id;
            const IconComp = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/guide/${item.id === 'overview' ? 'dashboard' : item.id}`)}
                className={`flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 w-full text-left cursor-pointer ${
                  isActive
                    ? 'bg-gd-secondary-ctr text-gd-on-secondary-ctr font-bold scale-[0.98] shadow-sm'
                    : 'text-gd-on-surface-var hover:bg-gd-surface-low'
                }`}
              >
                <IconComp className={`w-5 h-5 ${isActive ? 'fill-current text-gd-primary' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Emergency SOS CTA */}
        <div className="px-2 mt-auto mb-2">
          <button
            onClick={handleStartGuideSOS}
            className="w-full bg-[#C62828] hover:bg-[#B71C1C] text-white py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-md active:scale-98 cursor-pointer font-guide uppercase tracking-wider"
          >
            <Flame className="w-4 h-4" />
            Emergency SOS
          </button>
        </div>

        {/* Footer Links */}
        <div className="mt-auto flex flex-col gap-1 border-t border-gd-outline-var/40 pt-2">
          <button
            onClick={() => {
              sessionStorage.removeItem('guide_token');
              localStorage.removeItem('guide_token');
              if (onExitGuide) onExitGuide();
              else navigate('/');
            }}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-[12px] font-semibold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Guide View</span>
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════ */}
      {/* Main Content Area                               */}
      {/* ═══════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col ml-[280px] h-screen relative">
        {/* TopNavBar */}
        <header className="bg-gd-primary-ctr text-gd-on-primary-ctr flex justify-between items-center w-full px-6 h-16 border-b border-gd-outline-var shrink-0 z-20">
          {/* Brand */}
          <div className="text-base font-black text-gd-secondary font-guide uppercase tracking-wider flex items-center gap-2">
            <span>🛡️ SafeYatra Guide Portal</span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">Live</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden lg:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gd-on-surface-var" />
              <input
                type="text"
                placeholder="Search tourists or alerts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-gd-surface-mid text-gd-on-surface pl-9 pr-3 py-1.5 rounded-full border border-gd-outline-var text-xs w-56 placeholder:text-gd-on-surface-var focus:outline-none focus:ring-2 focus:ring-gd-secondary"
              />
            </div>

            {/* Notifications Button */}
            <button
              onClick={() => {
                setShowNotifications(v => !v);
                setShowSettings(false);
                setShowProfile(false);
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gd-surface-variant/20 transition-colors text-gd-on-primary-ctr relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {pendingAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => {
                setShowSettings(v => !v);
                setShowNotifications(false);
                setShowProfile(false);
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gd-surface-variant/20 transition-colors text-gd-on-primary-ctr cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Guide Avatar Profile Button */}
            <button
              onClick={() => {
                setShowProfile(v => !v);
                setShowNotifications(false);
                setShowSettings(false);
              }}
              className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-gd-surface-variant/20 transition-colors ml-1"
              title="Guide Profile"
            >
              <div className="w-8 h-8 rounded-full bg-gd-primary text-white flex items-center justify-center text-xs font-bold border border-gd-outline-var shadow-sm">
                {currentGuide ? currentGuide.full_name.charAt(0).toUpperCase() : 'G'}
              </div>
            </button>
          </div>
        </header>

        {/* Dashboard Canvas */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-6 bg-gd-bg ${activeSubTab === 'chat' ? 'flex flex-col' : ''}`}>
          {activeSubTab === 'overview' && (
            <GuideOverview tourists={guideTourists} incidents={incidents} />
          )}
          {activeSubTab === 'safety' && (
            <GuideAiMonitoring
              tourists={guideTourists}
              guide_id={currentGuide?.guide_id}
              guide_name={currentGuide?.full_name}
            />
          )}
          {activeSubTab === 'group' && (
            <GuideGroupTable
              tourists={guideTourists}
              guide_id={currentGuide?.guide_id}
              onRegisterTourist={onRegisterTourist}
              onDeleteTourist={onDeleteTourist}
            />
          )}
          {activeSubTab === 'chat' && (
            <GuideChat 
              tourists={guideTourists} 
              currentGuide={currentGuide}
              chatLogs={chatLogs}
              setChatLogs={setChatLogs}
            />
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── BROADCAST MODAL ──                           */}
      {/* ═══════════════════════════════════════════════ */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
                <Megaphone className="w-5 h-5" />
                <span>Broadcast to Group ({guideTourists.length} Travelers)</span>
              </div>
              <button onClick={() => setShowBroadcast(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">Quick Preset Announcements:</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {broadcastTemplates.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => setBroadcastText(t.text)}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 font-medium transition-colors cursor-pointer"
                >
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={broadcastText}
              onChange={e => setBroadcastText(e.target.value)}
              placeholder="Type your message to broadcast to all group members..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500 mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBroadcast(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBroadcast}
                disabled={!broadcastText.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {broadcastSent ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                <span>{broadcastSent ? 'Broadcast Sent!' : 'Send Broadcast'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── NOTIFICATIONS MODAL ──                        */}
      {/* ═══════════════════════════════════════════════ */}
      {showNotifications && (
        <div className="fixed top-16 right-6 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden max-h-[80vh]">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="font-bold text-xs uppercase tracking-widest text-slate-700">Guide Notifications</span>
            <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-2.5 overflow-y-auto">
            {incidents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">All group safety parameters nominal.</p>
            ) : (
              incidents.map(inc => (
                <div key={inc.id} className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs">
                  <div className="flex justify-between items-center font-bold text-red-800 mb-1">
                    <span>{inc.type} Incident</span>
                    <span className="text-[10px] text-red-600">{inc.severity}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{inc.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── SETTINGS MODAL ──                             */}
      {/* ═══════════════════════════════════════════════ */}
      {showSettings && (
        <div className="fixed top-16 right-6 w-84 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="font-bold text-xs uppercase tracking-widest text-slate-700">Guide Settings</span>
            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-4 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 font-medium">Critical SOS Audio Alerts</span>
              <input
                type="checkbox"
                checked={settings.sosAlerts}
                onChange={e => setSettings(s => ({ ...s, sosAlerts: e.target.checked }))}
                className="accent-[#061E34]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 font-medium">Group Chat Alerts</span>
              <input
                type="checkbox"
                checked={settings.messageNotifications}
                onChange={e => setSettings(s => ({ ...s, messageNotifications: e.target.checked }))}
                className="accent-[#061E34]"
              />
            </label>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Language</p>
              <LanguageSelector role="guide" showLabel={false} selectClassName="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── PROFILE MODAL ──                              */}
      {/* ═══════════════════════════════════════════════ */}
      {showProfile && (
        <div className="fixed top-16 right-6 w-88 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden max-h-[85vh]">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="font-bold text-xs uppercase tracking-widest text-slate-700">Guide Profile</span>
            <button onClick={() => setShowProfile(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-4 overflow-y-auto text-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-gd-primary text-white flex items-center justify-center font-bold text-lg">
                {currentGuide?.full_name?.charAt(0) || 'G'}
              </div>
              <div>
                <p className="font-bold text-slate-800">{currentGuide?.full_name}</p>
                <p className="text-[10px] text-slate-400 font-mono">ID: {currentGuide?.guide_id}</p>
              </div>
            </div>

            {editingProfile ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.full_name || ''}
                    onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone || ''}
                    onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setEditingProfile(false)} className="flex-1 py-2 text-slate-500 font-semibold cursor-pointer">Cancel</button>
                  <button onClick={handleSaveProfile} disabled={profileSaving} className="flex-1 bg-gd-primary text-white font-bold py-2 rounded-lg cursor-pointer">
                    {profileSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-[11px] text-slate-600">
                <p><b className="text-slate-700">License:</b> {currentGuide?.license_no || currentGuide?.license_number || 'Official Verified'}</p>
                <p><b className="text-slate-700">Phone:</b> {currentGuide?.mobile_number || currentGuide?.phone || '+91 98765 43210'}</p>
                <p><b className="text-slate-700">Languages:</b> {currentGuide?.languages || 'English, Hindi'}</p>
                <button
                  onClick={() => setEditingProfile(true)}
                  className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}



      {/* ═══════════════════════════════════════════════ */}
      {/* ── GUIDE EMERGENCY SOS MODAL ──                  */}
      {/* ═══════════════════════════════════════════════ */}
      {showSOS && (
        <div className="fixed inset-0 bg-red-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#18181B] text-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-red-600/40 text-center space-y-4">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Flame className="w-8 h-8 text-white" />
            </div>

            <div>
              <h3 className="text-xl font-black text-red-500 uppercase tracking-wide">Guide Emergency SOS</h3>
              <p className="text-xs text-slate-400 mt-1">Transmitting group hazard beacon to NDRF / SDRF Control Center</p>
            </div>

            {guideSOSStep === 'TRANSMITTING' && (
              <div className="bg-red-950/50 border border-red-800/50 p-4 rounded-xl">
                <p className="text-xs text-red-300 font-semibold mb-1">Auto-Dispatching in:</p>
                <span className="text-4xl font-black font-mono text-red-400">{guideSOSCountdown}s</span>
              </div>
            )}

            {guideSOSStep === 'SUBMITTED' && (
              <div className="bg-emerald-950/50 border border-emerald-800/50 p-4 rounded-xl">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-emerald-400">Emergency Dispatched</p>
                <p className="text-xs text-slate-400">Audio stream and telemetry locked to central dispatch.</p>
              </div>
            )}

            <button
              onClick={handleCancelGuideSOS}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider"
            >
              {guideSOSStep === 'SUBMITTED' ? 'Close Emergency Screen' : 'Abort SOS'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideDashboard;
