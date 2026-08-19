import React, { useState, useEffect, useRef } from 'react';
import { IncidentReport, TouristProfile } from '../../types';

interface TouristReportIncidentProps {
  tourist: TouristProfile;
  incidents: IncidentReport[];
  onTriggerSOS?: (details?: { description?: string; mediaUrl?: string; severity?: Severity }) => void;
}

type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export const TouristReportIncident: React.FC<TouristReportIncidentProps> = ({
  tourist,
  incidents,
  onTriggerSOS,
}) => {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('HIGH');
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (onTriggerSOS) {
        await onTriggerSOS({
          description: description.trim(),
          mediaUrl: capturedImage || undefined,
          severity
        });
      } else {
        await fetch('/api/incidents/sos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            touristId: tourist.id,
            location: tourist.currentLocation,
            description: description.trim(),
            severity: severity,
            mediaUrl: capturedImage || undefined,
          }),
        });
      }
    } catch (err) {
      console.error('Report submit error:', err);
    } finally {
      setIsSubmitting(false);
    }

    setShowToast(true);
    setDescription('');
    setCapturedImage(null);
    setTimeout(() => setShowToast(false), 4000);
  };

  // Auto-hide toast
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const severityOptions: { value: Severity; label: string }[] = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Mod' },
    { value: 'HIGH', label: 'High' },
  ];

  return (
    <>
      {/* Success Toast */}
      <div
        className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#e6f4ea] text-[#137333] border border-[#ceead6] rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${
          showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <span className="material-symbols-outlined fill">check_circle</span>
        Report submitted successfully. Monitoring team notified.
      </div>

      <div className="flex-1 overflow-y-auto bg-st-surface-container-low pt-12 pb-32 md:pb-12 px-5 md:px-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-semibold text-st-text-dark mb-2 leading-10">Report an Incident</h1>
            <p className="text-st-on-surface-variant text-base leading-6">
              Provide details to alert the monitoring team immediately.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Column: Form */}
            <div className="flex flex-col gap-6">
              {/* Textarea */}
              <div className="bg-st-surface-white rounded-xl p-4 border border-st-outline-variant">
                <label
                  className="block text-sm font-semibold text-st-on-surface mb-2 leading-5"
                  htmlFor="incident_desc"
                >
                  What happened
                </label>
                <textarea
                  id="incident_desc"
                  className="w-full bg-st-surface-white border border-st-outline-variant rounded-lg p-3 text-base text-st-on-surface focus:outline-none focus:border-st-primary focus:border-2 focus:ring-0 resize-none transition-all placeholder:text-st-outline leading-6"
                  placeholder="Describe the incident clearly..."
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* 2-up Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Severity */}
                <div className="bg-st-surface-white rounded-xl p-4 border border-st-outline-variant flex flex-col justify-between">
                  <label className="block text-sm font-semibold text-st-on-surface mb-2 leading-5">
                    Severity
                  </label>
                  <div className="flex gap-2">
                    {severityOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSeverity(opt.value)}
                        className={`flex-1 py-2 text-center rounded-lg text-xs font-medium transition-colors cursor-pointer leading-4 ${
                          severity === opt.value
                            ? opt.value === 'HIGH'
                              ? 'border-2 border-st-error bg-[#fff1f0] text-st-error font-bold'
                              : 'border-2 border-st-primary bg-st-primary-fixed text-st-primary font-bold'
                            : 'border border-st-outline-variant text-st-on-surface-variant hover:bg-st-surface-container'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sent to */}
                <div className="bg-st-surface-white rounded-xl p-4 border border-st-outline-variant flex flex-col justify-between">
                  <label className="block text-sm font-semibold text-st-on-surface mb-2 leading-5">
                    Sent to
                  </label>
                  <div className="flex items-center gap-2 p-2 bg-st-surface-container-low rounded-lg border border-st-outline-variant">
                    <span className="material-symbols-outlined text-st-on-surface-variant">
                      admin_panel_settings
                    </span>
                    <span className="text-base text-st-on-surface-variant leading-6">Admin + guide</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full bg-st-primary text-st-on-primary text-sm font-semibold py-4 rounded-xl hover:bg-st-primary-container transition-colors flex justify-center items-center gap-2 mt-2 cursor-pointer leading-5"
              >
                <span className="material-symbols-outlined">send</span>
                Submit report
              </button>
            </div>

            {/* Right Column: Evidence */}
            <div className="flex flex-col gap-4 h-full">
              <div className="bg-st-surface-white rounded-xl p-4 border border-st-outline-variant flex flex-col h-full min-h-[400px]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-semibold text-st-on-surface leading-5">Live photo evidence</h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium leading-4 ${
                    capturedImage ? 'bg-emerald-100 text-emerald-800' : 'bg-st-surface-container-high text-st-on-surface-variant'
                  }`}>
                    {capturedImage ? 'Captured ✓' : 'Optional Photo'}
                  </span>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleImageCapture}
                  className="hidden"
                />

                {/* Camera / Preview Area */}
                {capturedImage ? (
                  <div className="flex-1 rounded-lg overflow-hidden relative group min-h-[220px] flex items-center justify-center bg-black/5 border border-st-outline-variant">
                    <img
                      src={capturedImage}
                      alt="Incident Evidence"
                      className="max-h-[280px] w-auto object-contain rounded-lg shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setCapturedImage(null)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 shadow hover:bg-red-700 transition-colors"
                      title="Remove image"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-st-surface-container-low border border-st-outline-variant rounded-lg flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group cursor-pointer hover:bg-st-surface-container transition-colors"
                  >
                    <div className="w-16 h-16 bg-st-surface-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-st-outline-variant group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-3xl text-st-primary">
                        photo_camera
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-st-on-surface mb-1 leading-5">
                      Tap to open camera / upload photo
                    </p>
                    <p className="text-xs font-medium text-st-on-surface-variant leading-4">
                      Attach photo evidence for rescue teams
                    </p>
                  </div>
                )}

                {/* Geo-tag Telemetry Info */}
                <div className="mt-4 flex items-start gap-2.5 bg-blue-50/80 p-3 rounded-lg border border-blue-200">
                  <span className="material-symbols-outlined text-blue-600 text-lg">location_on</span>
                  <div className="text-xs text-blue-900 leading-4">
                    <div className="font-semibold">Live GPS Telemetry Attached:</div>
                    <div className="font-mono mt-0.5 text-blue-700">
                      {tourist.currentLocation.lat.toFixed(5)}°N, {tourist.currentLocation.lng.toFixed(5)}°E
                      {tourist.currentLocation.accuracy ? ` (±${tourist.currentLocation.accuracy}m)` : ''}
                    </div>
                    <div className="text-[11px] text-blue-600 mt-0.5 truncate">
                      {tourist.currentLocation.address || 'Real-time location'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
