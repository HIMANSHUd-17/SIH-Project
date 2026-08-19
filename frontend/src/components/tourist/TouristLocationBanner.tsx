import React, { useState } from 'react';
import { GeolocationPermissionState, TelemetryData } from '../../hooks/useTouristLiveLocation';

interface TouristLocationBannerProps {
  permissionState: GeolocationPermissionState;
  isTracking: boolean;
  coords: TelemetryData | null;
  address: string;
  error: string | null;
  batteryLevel?: number | null;
  onRequestPermission: () => void;
  onRecenter?: () => void;
}

export const TouristLocationBanner: React.FC<TouristLocationBannerProps> = ({
  permissionState,
  isTracking,
  coords,
  address,
  error,
  batteryLevel,
  onRequestPermission,
  onRecenter
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCoords = () => {
    if (!coords) return;
    navigator.clipboard.writeText(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Permission Granted & Live Tracking Active
  if (permissionState === 'granted' && isTracking && coords) {
    return (
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-xl p-3 sm:p-4 mb-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live GPS Active
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {coords.lat.toFixed(5)}°N, {coords.lng.toFixed(5)}°E
                </span>
                <span className="text-[11px] text-slate-400">
                  (±{coords.accuracy}m precision)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 truncate max-w-md">
                📍 {address || coords.address || 'Real-time location locked'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {coords.speed !== null && coords.speed !== undefined && coords.speed > 0 && (
              <div className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-mono hidden md:block">
                🏎️ {coords.speed} km/h
              </div>
            )}
            {batteryLevel !== null && batteryLevel !== undefined && (
              <div className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-mono hidden md:flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-emerald-400">battery_charging_full</span>
                {batteryLevel}%
              </div>
            )}

            <button
              onClick={handleCopyCoords}
              title="Copy GPS coordinates"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {onRecenter && (
              <button
                onClick={onRecenter}
                title="Recenter map to my position"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">my_location</span>
                <span>Recenter</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Permission Denied / Blocked
  if (permissionState === 'denied' || error) {
    return (
      <div className="bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-900 border border-red-500/40 rounded-xl p-3 sm:p-4 mb-4 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 shrink-0 mt-0.5 sm:mt-0">
              <span className="material-symbols-outlined text-xl">location_off</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-red-200 flex items-center gap-2">
                <span>Live GPS Permission Denied or Unavailable</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                {error || 'Your browser is currently blocking location access. SafeYatra is running in fallback simulation mode.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer px-2 py-1"
            >
              {showHelp ? 'Hide Instructions' : 'How to Enable?'}
            </button>

            <button
              onClick={onRequestPermission}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Retry Permission</span>
            </button>
          </div>
        </div>

        {/* Step-by-step unblocking guide */}
        {showHelp && (
          <div className="mt-3 pt-3 border-t border-red-500/20 text-xs text-slate-300 space-y-1.5 bg-slate-950/40 p-3 rounded-lg">
            <div className="font-semibold text-white">How to enable location in your browser:</div>
            <div>1. Click the <strong>lock / tune icon 🔒</strong> to the left of the URL address bar in Chrome, Edge, or Firefox.</div>
            <div>2. Find <strong>Location / Permissions</strong> and toggle it to <strong>"Allow"</strong> or <strong>"Reset permissions"</strong>.</div>
            <div>3. Refresh this page or click <strong>"Retry Permission"</strong> above.</div>
          </div>
        )}
      </div>
    );
  }

  // 3. Prompt state (Permission not yet asked)
  return (
    <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 rounded-xl p-3 sm:p-4 mb-4 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0">
            <span className="material-symbols-outlined text-xl">near_me</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-blue-200">
              Enable Real-Time GPS Safety Tracking
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Allow location access to activate live hazard geofence bounds and fast 1-tap SOS rescue dispatch.
            </p>
          </div>
        </div>

        <button
          onClick={onRequestPermission}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">my_location</span>
          <span>Enable Live Location</span>
        </button>
      </div>
    </div>
  );
};
