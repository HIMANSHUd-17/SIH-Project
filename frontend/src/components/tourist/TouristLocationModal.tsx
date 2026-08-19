import React, { useState } from 'react';
import { GeolocationPermissionState } from '../../hooks/useTouristLiveLocation';

interface TouristLocationModalProps {
  permissionState: GeolocationPermissionState;
  isTracking: boolean;
  onRequestPermission: () => void;
  onDismiss?: () => void;
}

export const TouristLocationModal: React.FC<TouristLocationModalProps> = ({
  permissionState,
  isTracking,
  onRequestPermission,
  onDismiss
}) => {
  const [dismissed, setDismissed] = useState<boolean>(false);

  // If already granted and tracking, or dismissed, do not show modal
  if (dismissed || permissionState === 'granted' || isTracking) {
    return null;
  }

  const handleAllow = () => {
    onRequestPermission();
    setDismissed(true);
  };

  const handleSkip = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden p-6 sm:p-7 relative text-slate-100">
        {/* Glow ambient decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Radar Animation */}
        <div className="flex justify-center mb-5">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping opacity-75" />
            <span className="material-symbols-outlined text-4xl text-blue-400">my_location</span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Enable Live GPS Protection
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            SafeYatra uses your real-time location to safeguard your journey, calculate dynamic risk zones, and provide rapid rescue assistance.
          </p>
        </div>

        {/* Value Propositions */}
        <div className="space-y-3.5 mb-7">
          <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
              <span className="material-symbols-outlined text-xl">shield</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Dynamic Geofence Alerts</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Instant alarms when approaching flash-flood zones, landslides, or high-risk terrain.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <span className="material-symbols-outlined text-xl">sos</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">1-Tap Emergency SOS Dispatch</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Sends high-precision GPS coordinates directly to Police, SDRF, and Trauma Centers.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
              <span className="material-symbols-outlined text-xl">person_pin</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Verified Guide Coordination</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Enables your registered tour guide to monitor your group safety in real-time.
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleAllow}
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-98"
          >
            <span className="material-symbols-outlined text-lg">near_me</span>
            Allow Live Location Access
          </button>

          <button
            onClick={handleSkip}
            className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 text-xs font-medium transition-colors cursor-pointer"
          >
            Skip for now (Use Default Location)
          </button>
        </div>

        {/* Privacy Note */}
        <div className="text-center mt-4">
          <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[13px]">lock</span>
            Encrypted telemetry &middot; Only accessed for tourist safety bounds
          </span>
        </div>
      </div>
    </div>
  );
};
