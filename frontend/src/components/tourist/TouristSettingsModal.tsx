import React, { useState, useEffect } from 'react';
import { TouristProfile } from '../../types';
import { useLanguage, LanguageSelector } from '../../utils/LanguageContext';
import { LanguageCode } from '../../utils/i18n';

interface TouristSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourist: TouristProfile;
}

export const TouristSettingsModal: React.FC<TouristSettingsModalProps> = ({
  isOpen,
  onClose,
  tourist
}) => {
  const { t, lang, setLanguage, supportedLanguages } = useLanguage('tourist');

  // Local settings state with localStorage persistence
  const [geofenceSound, setGeofenceSound] = useState<boolean>(() => {
    return localStorage.getItem('sy_setting_geofence_sound') !== 'false';
  });
  const [sosSiren, setSosSiren] = useState<boolean>(() => {
    return localStorage.getItem('sy_setting_sos_siren') !== 'false';
  });
  const [batterySaver, setBatterySaver] = useState<boolean>(() => {
    return localStorage.getItem('sy_setting_battery_saver') === 'true';
  });
  const [gpsInterval, setGpsInterval] = useState<string>(() => {
    return localStorage.getItem('sy_setting_gps_interval') || '3';
  });
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('sy_setting_geofence_sound', String(geofenceSound));
    localStorage.setItem('sy_setting_sos_siren', String(sosSiren));
    localStorage.setItem('sy_setting_battery_saver', String(batterySaver));
    localStorage.setItem('sy_setting_gps_interval', gpsInterval);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-st-outline-variant/60 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-st-surface-container flex items-center justify-between border-b border-st-outline-variant/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-st-primary-fixed text-st-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">settings</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-st-on-surface">Tourist Safety Settings</h2>
              <p className="text-xs text-st-on-surface-variant">Preferences &amp; Emergency Telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-st-outline hover:text-st-on-surface hover:bg-st-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-st-on-surface">
          {/* 1. Language Preference */}
          <div>
            <label className="text-xs font-bold text-st-primary uppercase tracking-wider block mb-2">
              Language / भाषा
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {supportedLanguages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code as LanguageCode)}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs cursor-pointer flex flex-col justify-between ${
                    lang === l.code
                      ? 'border-st-primary bg-st-primary-fixed/40 text-st-primary font-bold shadow-xs'
                      : 'border-st-outline-variant/60 hover:bg-st-surface-container-low text-st-on-surface'
                  }`}
                >
                  <span className="font-semibold">{l.label}</span>
                  <span className="text-[10px] text-st-outline mt-0.5">{l.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-st-outline-variant/40" />

          {/* 2. Safety & Alert Toggles */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-st-primary uppercase tracking-wider block">
              Safety &amp; Audio Alerts
            </label>

            {/* Geofence Sound */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-st-surface-container-low border border-st-outline-variant/40">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl text-st-primary">volume_up</span>
                <div>
                  <div className="text-sm font-semibold text-st-on-surface">Hazard Geofence Audio Siren</div>
                  <div className="text-xs text-st-on-surface-variant">Play audio alarm when entering landslide / flood danger zones</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={geofenceSound}
                onChange={(e) => setGeofenceSound(e.target.checked)}
                className="w-5 h-5 accent-st-primary rounded cursor-pointer"
              />
            </div>

            {/* SOS Flash & Vibration */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-st-surface-container-low border border-st-outline-variant/40">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl text-st-error">sos</span>
                <div>
                  <div className="text-sm font-semibold text-st-on-surface">Emergency SOS Confirmation Sound</div>
                  <div className="text-xs text-st-on-surface-variant">Vibrate and beep loudly upon 1-tap SOS trigger</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={sosSiren}
                onChange={(e) => setSosSiren(e.target.checked)}
                className="w-5 h-5 accent-st-primary rounded cursor-pointer"
              />
            </div>

            {/* Battery Saver */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-st-surface-container-low border border-st-outline-variant/40">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl text-st-secondary">battery_saver</span>
                <div>
                  <div className="text-sm font-semibold text-st-on-surface">Battery Optimization Mode</div>
                  <div className="text-xs text-st-on-surface-variant">Throttles GPS sync when device battery is under 20%</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={batterySaver}
                onChange={(e) => setBatterySaver(e.target.checked)}
                className="w-5 h-5 accent-st-primary rounded cursor-pointer"
              />
            </div>
          </div>

          <hr className="border-st-outline-variant/40" />

          {/* 3. Live GPS Telemetry Sync Frequency */}
          <div>
            <label className="text-xs font-bold text-st-primary uppercase tracking-wider block mb-2">
              Live GPS Sync Frequency
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: '1', label: '1 sec', desc: 'Ultra-Realtime' },
                { id: '3', label: '3 sec', desc: 'Recommended' },
                { id: '10', label: '10 sec', desc: 'Power Saver' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGpsInterval(opt.id)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    gpsInterval === opt.id
                      ? 'border-st-primary bg-st-primary text-white font-bold shadow-sm'
                      : 'border-st-outline-variant/60 bg-st-surface-container-low hover:bg-st-surface-container text-st-on-surface'
                  }`}
                >
                  <div className="text-sm font-bold">{opt.label}</div>
                  <div className={`text-[10px] mt-0.5 ${gpsInterval === opt.id ? 'text-white/80' : 'text-st-on-surface-variant'}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-st-outline-variant/40" />

          {/* 4. Active Tourist & Identity Info */}
          <div className="p-3.5 rounded-xl bg-st-surface-container border border-st-outline-variant/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-st-primary">SafeYatra Digital Pass ID</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                ✓ Verified
              </span>
            </div>
            <div className="text-xs font-mono text-st-on-surface-variant break-all">
              {tourist?.id ? `did:safeyatra:${tourist.id}` : 'did:safeyatra:anonymous'}
            </div>
            <div className="text-[11px] text-st-outline flex items-center gap-1.5 pt-1">
              <span className="material-symbols-outlined text-sm text-st-secondary">verified_user</span>
              <span>Anchored to Polygon DID Registry &bull; Emergency Hash Validated</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-st-surface-container flex items-center justify-between border-t border-st-outline-variant/50 shrink-0">
          <span className="text-xs text-st-on-surface-variant">
            {savedToast ? '✅ Settings saved successfully!' : 'SafeYatra Sentinel v1.0'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-st-on-surface hover:bg-st-surface-container-high transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-st-primary hover:bg-st-primary-container text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
