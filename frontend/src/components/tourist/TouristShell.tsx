import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DynamicGeofence, IncidentReport, TouristProfile, Location } from '../../types';
import { TouristDashboard } from './TouristDashboard';
import { TouristMessages } from './TouristMessages';
import { TouristReportIncident } from './TouristReportIncident';
import { TouristProfileView } from './TouristProfileView';
import { TouristLocationBanner } from './TouristLocationBanner';
import { TouristLocationModal } from './TouristLocationModal';
import { TouristSettingsModal } from './TouristSettingsModal';
import { useTouristLiveLocation } from '../../hooks/useTouristLiveLocation';
import { useLanguage } from '../../utils/LanguageContext';

type TouristPage = 'dashboard' | 'messages' | 'report' | 'profile';

interface TouristShellProps {
  tourist: TouristProfile;
  setTourist: React.Dispatch<React.SetStateAction<TouristProfile>>;
  geofences: DynamicGeofence[];
  incidents: IncidentReport[];
  onTriggerSOS: (details?: { description?: string; mediaUrl?: string; serviceNeeded?: string }) => void;
  onStopSOS?: (touristId?: string) => void;
  chatLogs: Record<string, { sender: string; text: string; time: string; latency?: string }[]>;
  setChatLogs: React.Dispatch<React.SetStateAction<Record<string, { sender: string; text: string; time: string; latency?: string }[]>>>;
  onSendAdminMessage: (text: string, recipient?: 'admin' | 'guide') => void;
}

export const TouristShell: React.FC<TouristShellProps> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage('tourist');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Initialize live geolocation tracking for the tourist
  const {
    permissionState,
    isTracking,
    coords,
    address,
    error: locationError,
    batteryLevel,
    startLiveTracking,
    stopLiveTracking,
    recenterLocation
  } = useTouristLiveLocation({
    tourist: props.tourist,
    autoSyncServer: true,
    onLocationUpdate: (newLoc: Location) => {
      props.setTourist((prev) => ({
        ...prev,
        currentLocation: newLoc,
        lastUpdated: new Date().toLocaleTimeString(),
        batteryLevel: batteryLevel ?? prev.batteryLevel
      }));
    }
  });

  let activePage: TouristPage = 'dashboard';
  if (location.pathname.endsWith('/messages')) activePage = 'messages';
  else if (location.pathname.endsWith('/report-incident')) activePage = 'report';
  else if (location.pathname.endsWith('/profile')) activePage = 'profile';

  const sidebarNavItems: { id: TouristPage; icon: string; label: string; labelShort?: string }[] = [
    { id: 'dashboard', icon: 'dashboard', label: t('nav.dashboard') },
    { id: 'messages', icon: 'chat', label: t('nav.messages') },
    { id: 'report', icon: 'report', label: t('nav.report'), labelShort: t('report.submitBtn').split(' ')[0] }
  ];

  const mobileNavItems: { id: TouristPage; icon: string; label: string; labelShort?: string }[] = [
    ...sidebarNavItems,
    { id: 'profile', icon: 'account_circle', label: t('nav.profile') }
  ];

  return (
    <div className="sentinel-tourist min-h-screen bg-st-surface text-st-on-surface font-[Inter,sans-serif] text-base leading-6">
      {/* Geolocation Permission Explanation & Request Modal */}
      <TouristLocationModal
        permissionState={permissionState}
        isTracking={isTracking}
        onRequestPermission={startLiveTracking}
      />

      {/* ═══════ SideNavBar — Desktop Only ═══════ */}
      <nav className="hidden md:flex h-screen w-64 fixed left-0 top-0 border-r border-st-outline-variant bg-st-surface-white flex-col py-4 px-2 gap-4 z-40">
        {/* Brand */}
        <div className="flex flex-col gap-2 px-4 mt-2 mb-4">
          <span className="text-xl font-black text-st-primary uppercase tracking-wider">🛡️ SAFEYATRA</span>
          <div className="text-base font-bold text-st-on-surface-variant uppercase tracking-widest mt-0.5">Tourist Safety</div>
        </div>

        {/* Nav Links */}
        <div className="flex flex-col gap-1 flex-grow">
          {sidebarNavItems.map((item) => {
            const getPath = (id: string) => {
              if (id === 'report') return '/tourist/report-incident';
              return `/tourist/${id}`;
            };
            return (
              <button
                key={item.id}
                onClick={() => navigate(getPath(item.id))}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 w-full text-left cursor-pointer ${activePage === item.id
                  ? 'bg-st-surface-container text-st-primary font-bold scale-[0.98] shadow-sm'
                  : 'text-st-on-surface-variant hover:bg-st-surface-container-low active:scale-95'
                  }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User Card & 3-Dots Menu — Single profile access at the bottom */}
        <div className={`relative px-2 mt-auto mb-2 border-t border-st-outline-variant/40 pt-4 flex items-center justify-between transition-colors ${activePage === 'profile' ? 'bg-st-surface-container -mx-2 px-4 py-2 rounded-xl' : ''
          }`} ref={userMenuRef}>
          <div
            onClick={() => navigate('/tourist/profile')}
            className="flex items-center gap-2.5 overflow-hidden flex-1 cursor-pointer group hover:opacity-90 transition-opacity"
            title="View Profile"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base shrink-0 shadow-xs transition-all ${activePage === 'profile'
              ? 'bg-st-primary text-white ring-2 ring-st-primary/30'
              : 'bg-st-primary-fixed text-st-on-primary-fixed group-hover:ring-2 group-hover:ring-st-primary/40'
              }`}>
              {props.tourist?.name ? props.tourist.name.charAt(0).toUpperCase() : 'T'}
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="text-base font-bold text-st-on-surface truncate group-hover:text-st-primary transition-colors">
                {props.tourist?.name || 'Tourist'}
              </div>
              <div className="text-sm text-st-on-surface-variant truncate font-mono">
                {props.tourist?.id ? `${props.tourist.id}` : 'ID: ...'}
              </div>
            </div>
          </div>

          {/* Three Dots Button */}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            title="User Options"
            className={`p-1.5 rounded-lg text-st-outline hover:text-st-on-surface hover:bg-st-surface-container-high transition-colors cursor-pointer shrink-0 ml-1 ${showUserMenu ? 'bg-st-surface-container-high text-st-primary' : ''
              }`}
          >
            <span className="material-symbols-outlined text-lg leading-none">more_vert</span>
          </button>

          {/* Three Dots Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border border-st-outline-variant/80 py-1.5 z-50 animate-fade-in">
              <div className="px-3 py-1 text-sm font-bold uppercase tracking-wider text-st-outline border-b border-st-outline-variant/40 mb-1 flex items-center justify-between">
                <span>Account</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>

              {/* 1. Profile */}
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/tourist/profile');
                }}
                className="w-full px-3 py-2 text-left text-base font-semibold text-st-on-surface hover:bg-st-surface-container flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-st-primary">account_circle</span>
                <span>Profile</span>
              </button>

              {/* 2. Settings */}
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setShowSettingsModal(true);
                }}
                className="w-full px-3 py-2 text-left text-base font-semibold text-st-on-surface hover:bg-st-surface-container flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-st-outline">settings</span>
                <span>Settings</span>
              </button>

              <div className="border-t border-st-outline-variant/40 my-1" />

              {/* 3. Log Out */}
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  sessionStorage.clear();
                  localStorage.removeItem('activeTouristId');
                  navigate('/tourist/login');
                }}
                className="w-full px-3 py-2 text-left text-base font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-red-600">logout</span>
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ═══════ Main Content Container ═══════ */}
      <div className="md:pl-64 flex flex-col h-screen overflow-hidden pb-16 md:pb-0 relative">
        {/* Top Location Telemetry Banner */}
        <div className="flex-shrink-0 z-10 w-full">
          <TouristLocationBanner
            permissionState={permissionState}
            isTracking={isTracking}
            coords={coords}
            address={address}
            error={locationError}
            batteryLevel={batteryLevel}
            onRequestPermission={startLiveTracking}
            onRecenter={recenterLocation}
          />
        </div>

        {/* Dynamic Route Pages - Enforce flex-1 min-h-0 strictly for scrolling within */}
        <main className="flex-1 min-h-0 overflow-y-auto flex flex-col w-full relative">
          {activePage === 'dashboard' && (
            <TouristDashboard
              tourist={props.tourist}
              geofences={props.geofences}
              incidents={props.incidents}
              onTriggerSOS={props.onTriggerSOS}
              onStopSOS={props.onStopSOS}
              permissionState={permissionState}
              isTracking={isTracking}
              coords={coords}
              onRequestPermission={startLiveTracking}
              onRecenter={recenterLocation}
            />
          )}

          {activePage === 'messages' && (
            <div className="flex-1 flex flex-col min-h-0 w-full">
              <TouristMessages
                tourist={props.tourist}
                incidents={props.incidents}
                chatLogs={props.chatLogs}
                onSendMessage={props.onSendAdminMessage}
              />
            </div>
          )}

          {activePage === 'report' && (
            <TouristReportIncident
              tourist={props.tourist}
              incidents={props.incidents}
              onTriggerSOS={props.onTriggerSOS}
            />
          )}

          {activePage === 'profile' && (
            <TouristProfileView
              tourist={props.tourist}
              setTourist={props.setTourist}
            />
          )}
        </main>
      </div>

      {/* ═══════ Bottom Navigation — Mobile Only ═══════ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-st-surface-white border-t border-st-outline-variant flex items-center justify-around h-16 px-2 shadow-lg">
        {mobileNavItems.map((item) => {
          const getPath = (id: string) => {
            if (id === 'report') return '/tourist/report-incident';
            if (id === 'profile') return '/tourist/profile';
            return `/tourist/${id}`;
          };
          return (
            <button
              key={item.id}
              onClick={() => navigate(getPath(item.id))}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${activePage === item.id
                ? 'text-st-primary font-bold'
                : 'text-st-on-surface-variant'
                }`}
            >
              <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              <span className="text-sm font-semibold leading-3 mt-0.5">{item.labelShort || item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tourist Safety Settings Modal */}
      <TouristSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        tourist={props.tourist}
      />
    </div>
  );
};
