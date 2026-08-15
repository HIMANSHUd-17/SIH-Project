import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Users, AlertTriangle, MessageSquare,
  Flame, HelpCircle, LogOut, Search, Bell, Settings
} from 'lucide-react';
import { TouristProfile, DynamicGeofence, IncidentReport, EmergencyService } from '../../types';
import { GuideOverview } from './GuideOverview';
import { GuideGroupTable } from './GuideGroupTable';
import { GuideChat } from './GuideChat';

interface GuideDashboardProps {
  tourists: TouristProfile[];
  geofences: DynamicGeofence[];
  incidents: IncidentReport[];
  emergencyServices: EmergencyService[];
  onTriggerSOS: () => void;
  onExitGuide: () => void;
  onRegisterTourist: (data: any) => Promise<TouristProfile | null>;
  onDeleteTourist: (id: string) => Promise<void>;
  chatLogs?: Record<string, any[]>;
  setChatLogs?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

type SubTab = 'overview' | 'group' | 'chat';

const navItems: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'group', label: 'My Group', icon: Users },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
];

export const GuideDashboard: React.FC<GuideDashboardProps> = ({
  tourists,
  geofences,
  incidents,
  emergencyServices,
  onTriggerSOS,
  onExitGuide,
  onRegisterTourist,
  onDeleteTourist,
  chatLogs,
  setChatLogs
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentGuide, setCurrentGuide] = useState<any>(null);
  const [loadingGuide, setLoadingGuide] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchGuide = async () => {
      const token = localStorage.getItem('guide_token') || localStorage.getItem('guideToken');
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
      } catch (err) {
        console.error(err);
        localStorage.removeItem('guide_token');
        localStorage.removeItem('guideToken');
        navigate('/guide/login');
      } finally {
        setLoadingGuide(false);
      }
    };

    fetchGuide();
  }, [navigate]);

  if (loadingGuide) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gd-bg text-gd-primary font-guide text-sm font-bold tracking-widest uppercase">
        Loading Guide Portal...
      </div>
    );
  }

  let activeSubTab: SubTab = 'overview';
  if (location.pathname.endsWith('/group')) activeSubTab = 'group';
  else if (location.pathname.endsWith('/chat')) activeSubTab = 'chat';

  const pendingAlerts = incidents.filter(i => i.status === 'PENDING' || i.status === 'DISPATCHED').length;

  // Filter tourists specifically for this logged-in guide's group
  const guideTourists = currentGuide
    ? tourists.filter(t => {
        if (t.guide_id) return t.guide_id === currentGuide.guide_id;
        if (t.id && t.id.startsWith('T-')) {
          const parts = t.id.split('-');
          if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
            return `G-${parts[1]}` === currentGuide.guide_id;
          }
        }
        return currentGuide.guide_id === 'G-1001';
      })
    : tourists;

  return (
    <div className="guide-dashboard flex h-screen w-full bg-gd-bg text-gd-on-bg font-guide antialiased overflow-hidden">
      {/* ═══════════════════════════════════════════════ */}
      {/* SideNavBar                                      */}
      {/* ═══════════════════════════════════════════════ */}
      <nav className="bg-gd-surface text-gd-primary fixed left-0 top-0 h-full w-[280px] border-r border-gd-outline-var flex flex-col py-4 px-2 gap-4 z-30">
        {/* Header */}
        <div className="flex flex-col gap-2 px-2 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gd-primary flex items-center justify-center text-white font-bold text-xl border border-gd-outline-var">
              {currentGuide ? currentGuide.full_name.charAt(0).toUpperCase() : 'G'}
            </div>
            <div>
              <h2 className="text-xl font-black text-gd-primary font-guide">{currentGuide ? currentGuide.full_name : 'Loading...'}</h2>
              <p className="text-[13px] font-medium text-gd-on-surface-var">ID: {currentGuide ? currentGuide.guide_id : '...'}</p>
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
                className={`flex items-center gap-4 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 w-full text-left ${
                  isActive
                    ? 'bg-gd-secondary-ctr text-gd-on-secondary-ctr font-bold scale-[0.97]'
                    : 'text-gd-on-surface-var hover:bg-gd-surface-low'
                }`}
              >
                <IconComp className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Emergency SOS CTA */}
        <div className="px-2 mt-auto mb-4">
          <button
            onClick={onTriggerSOS}
            className="w-full bg-gd-error text-gd-on-error py-2 rounded-lg flex items-center justify-center gap-2 text-xl font-semibold hover:bg-gd-on-error-ctr transition-colors shadow-sm font-guide"
          >
            <Flame className="w-5 h-5" />
            Emergency SOS
          </button>
        </div>

        {/* Footer Links */}
        <div className="mt-auto flex flex-col gap-1">
          <button className="flex items-center gap-4 px-4 py-2 rounded-lg text-[13px] font-medium text-gd-on-surface-var hover:bg-gd-surface-low transition-all duration-200">
            <HelpCircle className="w-5 h-5" />
            <span>Support</span>
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('guide_token');
              onExitGuide();
            }}
            className="flex items-center gap-4 px-4 py-2 rounded-lg text-[13px] font-medium text-gd-on-surface-var hover:bg-gd-surface-low transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
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
          <div className="text-xl font-bold text-gd-secondary font-guide">
            SafeYatra Guide Portal
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden lg:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gd-on-primary-ctr" />
              <input
                type="text"
                placeholder="Search tourists or alerts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-gd-surface-mid text-gd-on-surface pl-9 pr-3 py-1.5 rounded-full border-none text-sm w-64 placeholder:text-gd-on-surface-var focus:outline-none focus:ring-2 focus:ring-gd-secondary"
              />
            </div>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gd-surface-variant/20 transition-colors text-gd-on-primary-ctr relative">
              <Bell className="w-5 h-5" />
              {pendingAlerts > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-gd-error rounded-full" />
              )}
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gd-surface-variant/20 transition-colors text-gd-on-primary-ctr">
              <Settings className="w-5 h-5" />
            </button>
            <img
              alt="Guide Profile"
              className="w-8 h-8 rounded-full border border-gd-outline-var ml-2 cursor-pointer hover:ring-2 hover:ring-gd-secondary transition-all"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD10-FznhZVLfuFhTnAMTNvlLA4yr3TvOuncT9O4sUhOVdmJns0wKIQH5SAV0ahIrQ2P7J-w_FVy8mPj2cNPQiSuKUvauZaq8IKtnOcn2krtC9Kd9umhd2YbuRfHnYRsIj-UyAOLnaptVAse0brKI5GjTx0WADfFtG3KfpbuGfrRKE46PrAGRGOzoi24IIbXFZXBdGZlkbrUVQOY4PNM7mAiNnTHJ7t1-2Lce8WV9Bxijc1yNT5neX6"
            />
          </div>
        </header>

        {/* Dashboard Canvas */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 bg-gd-bg ${activeSubTab === 'chat' ? 'flex flex-col' : ''}`}>
          {activeSubTab === 'overview' && (
            <GuideOverview tourists={guideTourists} incidents={incidents} />
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
    </div>
  );
};
