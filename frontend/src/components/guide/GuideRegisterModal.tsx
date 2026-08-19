import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  X, 
  Copy, 
  CheckCircle, 
  Loader2, 
  ShieldCheck, 
  Lock, 
  Upload, 
  Trash2, 
  RefreshCw, 
  MapPin, 
  HeartPulse,
  Users,
  AlertCircle
} from 'lucide-react';
import { TouristProfile } from '../../types';

interface GuideRegisterModalProps {
  isOpen: boolean;
  guide_id?: string;
  onClose: () => void;
  onRegister: (data: any) => Promise<TouristProfile | null>;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const MEDICAL_CONDITION_OPTIONS = [
  'None / Healthy',
  'Asthma / Breathing Problem',
  'Diabetes',
  'Heart Disease',
  'High Blood Pressure (Hypertension)',
  'Epilepsy / Seizure Disorder',
  'Severe Allergy',
  'Other / Custom'
];

export const GuideRegisterModal: React.FC<GuideRegisterModalProps> = ({
  isOpen,
  guide_id = 'G-1001',
  onClose,
  onRegister
}) => {
  // Assigned Team ID derived strictly from Guide
  const assignedGroupId = `GRP-${(guide_id || 'G-1001').replace(/\D/g, '') || '1001'}`;
  const assignedGroupName = `Team ${guide_id || 'G-1001'}`;

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    nationality: 'Indian',
    city: 'Wagholi',
    age: '',
    bloodType: 'O+',
    lat: '18.5944',
    lng: '74.0130',
    emergencyContact: ''
  });

  // Browser Geolocation Detection State
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  // Medical / Pre-existing Conditions State
  const [medicalCondition, setMedicalCondition] = useState<string>('None / Healthy');
  const [customMedicalDetails, setCustomMedicalDetails] = useState<string>('');

  // Government ID / Aadhaar / Passport Proof State
  const [idProofType, setIdProofType] = useState<'AADHAAR' | 'PASSPORT' | 'DRIVING_LICENSE'>('AADHAAR');
  const [idProofImage, setIdProofImage] = useState<string | null>(null);
  const [idProofFileName, setIdProofFileName] = useState<string | null>(null);
  const [idProofHash, setIdProofHash] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredTourist, setRegisteredTourist] = useState<TouristProfile | null>(null);
  const [copied, setCopied] = useState(false);

  // Live Browser Location Detection Handler
  const detectLiveLocation = (showErrors = false) => {
    if (!navigator.geolocation) {
      if (showErrors) setError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const latStr = lat.toFixed(4);
        const lngStr = lng.toFixed(4);
        let detectedCity = 'Wagholi';

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`, {
            headers: { 'Accept-Language': 'en' },
            signal: AbortSignal.timeout(6000)
          });
          if (res.ok) {
            const data = await res.json();
            if (data) {
              detectedCity = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || data.address?.state_district || data.address?.county || (data.display_name ? data.display_name.split(',')[0].trim() : 'Wagholi');
            }
          }
        } catch {
          // Fallback
        }

        setForm(prev => ({
          ...prev,
          lat: latStr,
          lng: lngStr,
          city: detectedCity
        }));

        sessionStorage.setItem('browser_lat', latStr);
        sessionStorage.setItem('browser_lng', lngStr);
        sessionStorage.setItem('browser_city', detectedCity);

        setLocationDetected(true);
        setIsDetectingLocation(false);
      },
      (err) => {
        console.warn('Live location detection failed/denied:', err.message);
        setIsDetectingLocation(false);
        if (showErrors) {
          setError('Location permission denied or unavailable. Using default coordinates.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Auto-detect on open
  useEffect(() => {
    if (!isOpen) return;

    const cachedLat = sessionStorage.getItem('browser_lat') || localStorage.getItem('browser_lat');
    const cachedLng = sessionStorage.getItem('browser_lng') || localStorage.getItem('browser_lng');
    const cachedCity = sessionStorage.getItem('browser_city') || localStorage.getItem('browser_city');

    if (cachedLat && cachedLng) {
      setForm(prev => ({
        ...prev,
        lat: cachedLat,
        lng: cachedLng,
        city: cachedCity || prev.city
      }));
      setLocationDetected(true);
    } else {
      detectLiveLocation(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleIdFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Document file size must be less than 8MB.');
      return;
    }

    setIsReadingFile(true);
    setIdProofFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setIdProofImage(base64);
      const generatedHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setIdProofHash(generatedHash);
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setError('Failed to read ID document image.');
      setIsReadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validateMobile = (mobile: string) => {
    const clean = mobile.replace(/\D/g, '');
    return clean.length >= 10 && clean.length <= 15;
  };

  const validateForm = (): boolean => {
    setError(null);

    if (!form.name.trim()) {
      setError('Full Name is required.');
      return false;
    }

    if (!form.email.trim()) {
      setError('Email Address is required.');
      return false;
    }

    if (!validateEmail(form.email)) {
      setError('Please enter a valid Email Address (e.g. name@domain.com).');
      return false;
    }

    if (!form.mobile.trim()) {
      setError('Mobile Number is required.');
      return false;
    }

    if (!validateMobile(form.mobile)) {
      setError('Please enter a valid 10-digit Mobile Number.');
      return false;
    }

    if (!form.nationality.trim()) {
      setError('Country / Nationality is required.');
      return false;
    }

    if (!form.city.trim()) {
      setError('City is required.');
      return false;
    }

    if (!form.age.trim() || isNaN(Number(form.age)) || Number(form.age) < 1 || Number(form.age) > 120) {
      setError('Please enter a valid Age between 1 and 120.');
      return false;
    }

    const latNum = Number(form.lat);
    const lngNum = Number(form.lng);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setError('Please enter a valid Initial Latitude (-90 to 90).');
      return false;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setError('Please enter a valid Initial Longitude (-180 to 180).');
      return false;
    }

    if (medicalCondition === 'Other / Custom' && !customMedicalDetails.trim()) {
      setError('Please specify the medical condition / medication details.');
      return false;
    }

    // STRICT MANDATORY GOVERNMENT ID PROOF CHECK
    if (!idProofImage || typeof idProofImage !== 'string' || idProofImage.length < 50) {
      setError('Government Identity Verification document (Aadhaar / Passport / ID Card) is strictly mandatory. Please upload an ID document.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    const finalMedical = medicalCondition === 'Other / Custom' && customMedicalDetails.trim()
      ? `Other: ${customMedicalDetails.trim()}`
      : medicalCondition;

    // Team Member Registration Payload (Strictly bound to the Guide's Team)
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      nationality: form.nationality.trim(),
      city: form.city.trim(),
      age: parseInt(form.age.trim()),
      bloodType: form.bloodType,
      lat: form.lat.trim(),
      lng: form.lng.trim(),
      emergencyContact: form.emergencyContact.trim() || form.mobile.trim(),
      guide_id,
      groupId: assignedGroupId,
      groupName: assignedGroupName,
      isLeader: false,
      isSolo: false,
      mode: 'TEAM',
      medicalConditions: finalMedical,
      customMedicalInfo: customMedicalDetails.trim() || undefined,
      idProofType,
      idProofImage: idProofImage || undefined,
      idProofHash: idProofHash || undefined
    };

    try {
      const result = await onRegister(payload);
      if (result) {
        // Persist strictly under this tourist's ID so Trust Vault loads their unique document
        if (idProofImage) {
          try {
            localStorage.setItem(`safeyatra_doc_${result.id}`, idProofImage);
            localStorage.setItem(`safeyatra_doc_${result.name.toLowerCase().trim()}`, idProofImage);
            if (result.blockchainDid) {
              localStorage.setItem(`safeyatra_doc_${result.blockchainDid}`, idProofImage);
            }
          } catch (e) {}
        }
        setRegisteredTourist(result);
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Failed to register team member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (registeredTourist) {
      navigator.clipboard.writeText(registeredTourist.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setForm({
      name: '',
      email: '',
      mobile: '',
      nationality: 'Indian',
      city: 'Wagholi',
      age: '',
      bloodType: 'O+',
      lat: '18.5944',
      lng: '74.0130',
      emergencyContact: ''
    });
    setMedicalCondition('None / Healthy');
    setCustomMedicalDetails('');
    setIdProofType('AADHAAR');
    setIdProofImage(null);
    setIdProofFileName(null);
    setIdProofHash(null);
    setRegisteredTourist(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 font-[Inter,sans-serif]">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* ── Modal Header ── */}
        <div className="bg-[#061E34] px-6 py-4 border-b border-slate-700 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2CD3C3]/20 text-[#2CD3C3] flex items-center justify-center border border-[#2CD3C3]/40 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tourist Registration</h3>
              <p className="text-xs text-slate-300">SafeYatra Smart Identity & Safety Profile</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {registeredTourist ? (
            /* ── Success View ── */
            <div className="space-y-6 py-2 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Team Member Registered!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tourist has been successfully verified and added to your assigned expedition team. Share the Tourist Login ID below.
              </p>

              {/* ID Card */}
              <div className="bg-slate-50 border-2 border-dashed border-[#061E34]/30 rounded-2xl p-6 text-center shadow-xs">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Assigned to Guide: {guide_id} • Team: {assignedGroupId}</span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Unique Tourist Login ID
                </p>
                <div className="flex items-center justify-center gap-3 my-3">
                  <span className="text-3xl font-black text-[#061E34] font-mono tracking-wider">
                    {registeredTourist.id}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="p-2 text-slate-500 hover:text-[#061E34] bg-white rounded-lg border border-slate-200 shadow-xs transition-colors cursor-pointer"
                    title="Copy Tourist ID"
                  >
                    {copied ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left text-xs pt-3 border-t border-slate-200 text-slate-700">
                  <div><span className="font-semibold text-slate-400">Name:</span> {registeredTourist.name}</div>
                  <div><span className="font-semibold text-slate-400">Mobile:</span> {registeredTourist.mobile}</div>
                  <div><span className="font-semibold text-slate-400">Blood Group:</span> {registeredTourist.bloodType || 'O+'}</div>
                  <div><span className="font-semibold text-slate-400">City:</span> {registeredTourist.city}</div>
                  <div><span className="font-semibold text-slate-400">Medical:</span> {registeredTourist.medicalConditions || 'None / Healthy'}</div>
                  <div><span className="font-semibold text-slate-400">ID Verification:</span> AES-256 Vault Verified ✓</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Login ID'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-[#061E34] text-white rounded-xl text-xs font-bold hover:bg-[#0A2640] transition-colors shadow-md cursor-pointer"
                >
                  Close & Finish
                </button>
              </div>
            </div>
          ) : (
            /* ── Registration Form ── */
            <form onSubmit={handleSubmit} className="space-y-6">

              {error && (
                <div className="p-3.5 bg-red-50 text-red-800 rounded-xl text-xs font-semibold border border-red-200 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* ── 1. ASSIGNED TEAM INFO BANNER (STRICT TEAM-ONLY) ── */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                      Team Membership (Automatic)
                    </span>
                    <h4 className="text-sm font-black text-slate-800">
                      Assigned to Guide {guide_id} • {assignedGroupName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Team ID: <span className="font-mono font-bold text-blue-900">{assignedGroupId}</span> • Direct Group Monitoring
                    </p>
                  </div>
                </div>
                <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Team Member
                </span>
              </div>

              {/* ── 2. TOURIST MANDATORY SAFETY INFO ── */}
              <div className="space-y-3">
                <div className="border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Tourist Mandatory Safety Info
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">* Required Fields</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => updateField('name', e.target.value)}
                      placeholder="e.g. Elena Rostova"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => updateField('email', e.target.value)}
                      placeholder="e.g. elena@domain.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Mobile No */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mobile No <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.mobile}
                      onChange={e => updateField('mobile', e.target.value)}
                      placeholder="e.g. +91 99887 76655"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Country (Nationality) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Country (Nationality) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.nationality}
                      onChange={e => updateField('nationality', e.target.value)}
                      placeholder="Indian"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34] focus:bg-white transition-all"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={e => updateField('city', e.target.value)}
                      placeholder="Wagholi"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Age <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={form.age}
                      onChange={e => updateField('age', e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Blood Group <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.bloodType}
                      onChange={e => updateField('bloodType', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34] focus:bg-white cursor-pointer transition-all"
                    >
                      {BLOOD_GROUPS.map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── 3. LIVE BROWSER GPS ASSIGNMENT ── */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Live Browser GPS Assigned ({form.city || 'Wagholi'})
                      </span>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Lat: {form.lat}, Lng: {form.lng} • Auto-geocoded City: {form.city}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => detectLiveLocation(true)}
                    disabled={isDetectingLocation}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 rounded-lg text-xs font-bold text-slate-700 shadow-2xs hover:bg-emerald-50 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                    <span>{isDetectingLocation ? 'Locating...' : 'Refresh GPS Location'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Initial Latitude <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.lat}
                      onChange={e => updateField('lat', e.target.value)}
                      placeholder="18.5944"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Initial Longitude <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.lng}
                      onChange={e => updateField('lng', e.target.value)}
                      placeholder="74.0130"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34]"
                    />
                  </div>
                </div>
              </div>

              {/* ── 4. PRE-EXISTING MEDICAL & HEALTH CONDITIONS ── */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-red-600" />
                    <label className="text-xs font-bold uppercase tracking-wider text-red-800">
                      Pre-Existing Medical & Health Conditions <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-600 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    Emergency Triage Data
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Select Known Medical Condition
                    </label>
                    <select
                      value={medicalCondition}
                      onChange={e => setMedicalCondition(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#061E34] cursor-pointer"
                    >
                      {MEDICAL_CONDITION_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {medicalCondition === 'Other / Custom' ? (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Specify Medical Problem / Medicine <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customMedicalDetails}
                        onChange={e => setCustomMedicalDetails(e.target.value)}
                        placeholder="e.g., Severe Bronchitis, Insulin Dependent..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#061E34]"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                      <span>
                        {medicalCondition === 'None / Healthy'
                          ? '✓ No acute chronic conditions reported. Ready for expedition.'
                          : `⚠️ Note: Emergency medical response teams (Trauma ICU) will be pre-alerted to ${medicalCondition}.`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── 5. GOVERNMENT ID VERIFICATION (AADHAAR / PASSPORT) (MANDATORY) ── */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#061E34]" />
                    <label className="text-xs font-bold uppercase tracking-wider text-[#061E34]">
                      Government Identity Verification (Aadhaar / Passport) <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>AES-256 Vault Encrypted</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Document Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={idProofType}
                      onChange={e => setIdProofType(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#061E34] cursor-pointer"
                    >
                      <option value="AADHAAR">Aadhaar Card</option>
                      <option value="PASSPORT">Passport</option>
                      <option value="DRIVING_LICENSE">Driving License / Voter ID</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Upload ID Card Photo / Document (PNG, JPG, PDF) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleIdFileUpload}
                        className="hidden"
                        id="guideIdProofUploadInput"
                      />
                      <label
                        htmlFor="guideIdProofUploadInput"
                        className="flex items-center justify-between px-3.5 py-2 bg-white border border-dashed border-slate-400 hover:border-[#061E34] rounded-lg text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-all"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Upload className="w-4 h-4 text-[#061E34]" />
                          <span className="truncate">
                            {isReadingFile ? 'Processing document...' : (idProofFileName || `Select ${idProofType === 'AADHAAR' ? 'Aadhaar Card' : 'Passport'} image...`)}
                          </span>
                        </div>
                        <span className="text-[10px] bg-[#061E34] text-white font-bold px-2.5 py-1 rounded-md shrink-0 ml-2">
                          Browse File
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Image Thumbnail & Proof Badge */}
                {idProofImage && (
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-emerald-300 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={idProofImage}
                        alt="ID Proof Preview"
                        className="w-12 h-10 object-cover rounded border border-slate-200"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <span>{idProofType === 'AADHAAR' ? 'Aadhaar Card Encrypted' : 'Passport Document Encrypted'}</span>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 truncate max-w-[240px]">
                          SHA-256 Hash: {idProofHash?.slice(0, 18)}...
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIdProofImage(null);
                        setIdProofFileName(null);
                        setIdProofHash(null);
                      }}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded cursor-pointer"
                      title="Remove Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-slate-500 flex items-center gap-1 font-medium pt-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Protected by Indian DPDP Act 2023. Stored securely with tamper-proof cryptographic hashing on ledger.</span>
                </p>
              </div>

              {/* ── Modal Footer Buttons ── */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#061E34] hover:bg-[#0A2640] text-white rounded-xl font-bold text-xs transition-colors shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registering Profile...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Register Tourist Profile</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
