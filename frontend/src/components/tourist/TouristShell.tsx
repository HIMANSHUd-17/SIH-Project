import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DynamicGeofence, IncidentReport, TouristProfile, Location } from '../../types';
import { TouristDashboard } from './TouristDashboard';
import { TouristMessages } from './TouristMessages';
import { TouristReportIncident } from './TouristReportIncident';
import { TouristLocationBanner } from './TouristLocationBanner';
import { TouristLocationModal } from './TouristLocationModal';
import { useTouristLiveLocation } from '../../hooks/useTouristLiveLocation';

type TouristPage = 'dashboard' | 'messages' | 'report';

interface TouristShellProps {
  tourist: TouristProfile;
  setTourist: React.Dispatch<React.SetStateAction<TouristProfile>>;
  geofences: DynamicGeofence[];
  incidents: IncidentReport[];
  onTriggerSOS: (details?: { description?: string; mediaUrl?: string }) => void;
  chatLogs: Record<string, { sender: string; text: string; time: string; latency?: string }[]>;
  setChatLogs: React.Dispatch<React.SetStateAction<Record<string, { sender: string; text: string; time: string; latency?: string }[]>>>;
  onSendAdminMessage: (text: string, recipient?: 'admin' | 'guide') => void;
}

export const TouristShell: React.FC<TouristShellProps> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();

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

  const navItems: { id: TouristPage; icon: string; label: string; labelShort?: string }[] = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'messages', icon: 'chat', label: 'Messages' },
    { id: 'report', icon: 'report', label: 'Report Incident', labelShort: 'Report' },
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
      <nav className="hidden md:flex h-screen w-[180px] fixed left-0 top-0 border-r border-st-outline-variant bg-st-surface-white flex-col py-6 px-4 z-40">
        {/* Brand */}
        <div className="mb-8 px-3">
          <span className="text-xl font-bold text-st-primary leading-7">SafeYatra</span>
          <div className="text-xs font-medium text-st-on-surface-variant leading-4 mt-0.5">Tourist Safety</div>
        </div>

        {/* Nav Links */}
        <div className="flex flex-col gap-2 flex-grow">
          {navItems.map((item) => {
            const getPath = (id: string) => id === 'report' ? '/tourist/report-incident' : `/tourist/${id}`;
            return (
              <button
                key={item.id}
                onClick={() => navigate(getPath(item.id))}
                className={`rounded-xl px-3 py-2 flex items-center gap-3 transition-colors duration-100 text-left cursor-pointer ${
                  activePage === item.id
                    ? 'bg-st-surface-container text-st-primary font-semibold'
                    : 'text-st-on-surface-variant hover:bg-st-surface-container-low active:scale-95'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm font-semibold leading-5">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live GPS Status Pill in Nav */}
        <div className="mb-4 px-2">
          {isTracking ? (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live GPS Active
              </div>
              <div className="text-[10px] text-emerald-600 mt-1 truncate">
                ±{coords?.accuracy || 10}m precision
              </div>
            </div>
          ) : (
            <button
              onClick={startLiveTracking}
              className="w-full p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold text-left transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>Enable GPS</span>
              <span className="material-symbols-outlined text-sm">near_me</span>
            </button>
          )}
        </div>

        {/* Logout / Switch Tourist */}
        <div className="mt-auto pt-4 border-t border-st-outline-variant/40 flex flex-col gap-1">
          <button
            onClick={() => {
              stopLiveTracking();
              localStorage.removeItem('activeTouristId');
              navigate('/tourist/login');
            }}
            className="rounded-xl px-3 py-2 flex items-center gap-3 transition-colors duration-100 text-left text-st-on-surface-variant hover:bg-st-surface-container-low hover:text-st-error cursor-pointer"
          >
            <span className="material-symbols-outlined text-st-outline">logout</span>
            <span className="text-sm font-semibold leading-5">Log Out</span>
          </button>
        </div>
      </nav>

      {/* ═══════ BottomNavBar — Mobile Only ═══════ */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 border-t border-st-outline-variant bg-st-surface-white rounded-t-xl">
        {navItems.map((item) => {
          const getPath = (id: string) => id === 'report' ? '/tourist/report-incident' : `/tourist/${id}`;
          return (
            <button
              key={item.id}
              onClick={() => navigate(getPath(item.id))}
              className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-colors cursor-pointer ${
                activePage === item.id
                  ? 'bg-st-surface-container text-st-primary'
                  : 'text-st-on-surface-variant active:bg-st-surface-container-high hover:bg-st-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-xs font-medium mt-1 leading-4">{item.labelShort || item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ═══════ Main Content Area ═══════ */}
      <main className="md:ml-[180px] min-h-screen pb-24 md:pb-6">
        {/* Top App Bar */}
        <header className="sticky top-0 bg-st-surface/95 backdrop-blur-md z-30 px-5 md:px-8 h-16 flex justify-between items-center max-w-[1200px] mx-auto w-full border-b border-st-outline-variant">
          {/* Mobile: Brand */}
          <h1 className="text-xl font-bold text-st-primary md:hidden leading-7">SafeYatra</h1>
          {/* Desktop: Greeting */}
          <div className="hidden md:block text-xl font-semibold text-st-on-surface leading-7">
            Namaskar, {props.tourist.name || 'Traveler'}
          </div>

          <div className="flex items-center gap-3">
            {/* Live GPS Chip */}
            {isTracking ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="hidden sm:inline">Live GPS Active</span>
                <span className="sm:hidden">GPS Live</span>
              </div>
            ) : (
              <button
                onClick={startLiveTracking}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold border border-blue-300 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">my_location</span>
                <span>Enable GPS</span>
              </button>
            )}

            {/* Safety Badge (desktop) */}
            <div className="hidden sm:flex bg-st-secondary-container text-st-on-secondary-container px-3 py-1.5 rounded-full items-center gap-1.5 border border-st-secondary">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span className="text-xs font-semibold">ID Verified</span>
            </div>

            <button
              onClick={() => {
                stopLiveTracking();
                localStorage.removeItem('activeTouristId');
                navigate('/tourist/login');
              }}
              title="Log Out / Switch Account"
              className="text-st-on-surface-variant hover:bg-st-surface-container hover:text-st-error rounded-full p-2 transition-all duration-200 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </header>

        {/* Top Location Status Banner */}
        <div className="px-5 md:px-8 max-w-[1200px] mx-auto w-full pt-4">
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

        {/* Page Content */}
        {activePage === 'dashboard' && (
          <TouristDashboard
            tourist={props.tourist}
            geofences={props.geofences}
            onTriggerSOS={props.onTriggerSOS}
            permissionState={permissionState}
            isTracking={isTracking}
            coords={coords}
            onRequestPermission={startLiveTracking}
            onRecenter={recenterLocation}
          />
        )}
        {activePage === 'messages' && (
          <TouristMessages
            tourist={props.tourist}
            incidents={props.incidents}
            chatLogs={props.chatLogs}
            onSendMessage={props.onSendAdminMessage}
          />
        )}
        {activePage === 'report' && (
          <TouristReportIncident
            tourist={props.tourist}
            incidents={props.incidents}
            onTriggerSOS={props.onTriggerSOS}
          />
        )}
      </main>
    </div>
  );
};
