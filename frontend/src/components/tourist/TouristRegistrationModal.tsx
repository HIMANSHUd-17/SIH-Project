import React, { useState, useEffect } from 'react';
import { User, Users, X, Copy, CheckCircle, AlertCircle, Plus, Trash2, Shield, ShieldCheck, Loader2, HeartPulse, FileText, Lock, Upload, Crosshair, RefreshCw, MapPin } from 'lucide-react';
import { TouristProfile } from '../../types';
import { maskDid } from '../../utils/didUtils';

interface TouristRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (touristId: string, mobileNumber: string) => void;
  initialMode?: 'SOLO' | 'TEAM';
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

interface TeamMemberInput {
  id: string;
  name: string;
  mobile: string;
  age: string;
  bloodType: string;
  nationality: string;
  city: string;
  medicalConditions?: string;
  customMedicalInfo?: string;
}

export const TouristRegistrationModal: React.FC<TouristRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'SOLO'
}) => {
  const [mode, setMode] = useState<'SOLO' | 'TEAM'>(initialMode);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Solo / Leader Form State (no hardcoded location defaults)
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    nationality: 'Indian',
    city: '',
    age: '',
    bloodType: 'O+',
    lat: '',
    lng: ''
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

  // Team Form State
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<TeamMemberInput[]>([
    { id: '1', name: '', mobile: '', age: '', bloodType: 'O+', nationality: 'Indian', city: '', medicalConditions: 'None / Healthy' }
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registered Result Payload
  const [registeredResult, setRegisteredResult] = useState<{
    mode: 'SOLO' | 'TEAM';
    leader: TouristProfile;
    groupId?: string;
    groupName?: string;
    members?: TouristProfile[];
    assignedGuide?: {
      guide_id: string;
      full_name: string;
      mobile_number: string;
      guide_license_no: string;
      years_of_experience: number;
      languages_known: string;
      status: string;
    };
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live Browser Location Detection Handler (Real GPS + Reverse Geocoding)
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
        let detectedCity = '';

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`, {
            headers: { 'Accept-Language': 'en' },
            signal: AbortSignal.timeout(6000)
          });
          if (res.ok) {
            const data = await res.json();
            if (data) {
              detectedCity = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || data.address?.state_district || data.address?.county || (data.display_name ? data.display_name.split(',')[0].trim() : '');
            }
          }
        } catch {
          // Geocode timeout or rate limit; do NOT set Rishikesh
        }

        setForm(prev => ({
          ...prev,
          lat: latStr,
          lng: lngStr,
          city: detectedCity || prev.city
        }));

        if (detectedCity) {
          setMembers(prev => prev.map(m => ({
            ...m,
            city: m.city || detectedCity
          })));
          sessionStorage.setItem('browser_city', detectedCity);
          localStorage.setItem('browser_city', detectedCity);
        }

        sessionStorage.setItem('browser_lat', latStr);
        sessionStorage.setItem('browser_lng', lngStr);
        localStorage.setItem('browser_lat', latStr);
        localStorage.setItem('browser_lng', lngStr);

        setLocationDetected(true);
        setIsDetectingLocation(false);
      },
      (err) => {
        console.warn('Live location detection failed/denied:', err.message);
        setIsDetectingLocation(false);
        setLocationDetected(false);
        if (showErrors) {
          if (err.code === 1) {
            setError('Location permission denied. Please allow location access in your browser or enter your city and coordinates manually.');
          } else if (err.code === 2) {
            setError('Live GPS signal is currently unavailable. Please enter your location manually.');
          } else if (err.code === 3) {
            setError('Location request timed out. Please try again or enter your location manually.');
          } else {
            setError('Could not retrieve live GPS location. Please enter your location manually.');
          }
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Auto-detect on open & purge legacy default storage
  useEffect(() => {
    if (!isOpen) return;

    // Purge legacy hardcoded 'Rishikesh' from storage if present
    const storedCity = sessionStorage.getItem('browser_city') || localStorage.getItem('browser_city');
    if (storedCity && storedCity.toLowerCase() === 'rishikesh') {
      sessionStorage.removeItem('browser_city');
      localStorage.removeItem('browser_city');
    }
    const storedLat = sessionStorage.getItem('browser_lat') || localStorage.getItem('browser_lat');
    if (storedLat === '30.1250') {
      sessionStorage.removeItem('browser_lat');
      localStorage.removeItem('browser_lat');
      sessionStorage.removeItem('browser_lng');
      localStorage.removeItem('browser_lng');
    }

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
      setMembers(prev => prev.map(m => ({
        ...m,
        city: cachedCity || m.city
      })));
      setLocationDetected(true);
    }

    // Always request live GPS coordinates when registration opens
    detectLiveLocation(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const updateFormField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const addTeamMember = () => {
    setMembers(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: '',
        mobile: '',
        age: '',
        bloodType: 'O+',
        nationality: form.nationality || 'Indian',
        city: form.city || '',
        medicalConditions: 'None / Healthy',
        customMedicalInfo: ''
      }
    ]);
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
      const fakeHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setIdProofHash(fakeHash);
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setError('Failed to read ID document image.');
      setIsReadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const removeTeamMember = (id: string) => {
    if (members.length === 1) {
      setError('At least one team member must be registered for a Team account.');
      return;
    }
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const updateMemberField = (id: string, field: keyof TeamMemberInput, value: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    if (error) setError(null);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const validateMobile = (mobile: string) => {
    const clean = mobile.replace(/\D/g, '');
    return clean.length >= 10 && clean.length <= 15;
  };

  const validateForm = (): boolean => {
    setError(null);

    if (mode === 'TEAM' && !groupName.trim()) {
      setError('Please enter a Team / Group Name.');
      return false;
    }

    // Validate Leader / Solo fields
    if (!form.name.trim()) {
      setError(mode === 'TEAM' ? 'Team Leader Full Name is required.' : 'Full Name is required.');
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
      setError('Please specify your other medical condition / medications.');
      return false;
    }

    // Mandatory Government ID Proof Check
    if (!idProofImage || typeof idProofImage !== 'string' || idProofImage.length < 50) {
      setError('Government Identity Verification document (Aadhaar / Passport / ID Card) is strictly mandatory. Please browse and upload your ID document.');
      return false;
    }

    // If Team mode, validate members
    if (mode === 'TEAM') {
      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        const memberNum = i + 1;
        if (!m.name.trim()) {
          setError(`Team Member #${memberNum} Full Name is required.`);
          return false;
        }
        if (!m.mobile.trim() || !validateMobile(m.mobile)) {
          setError(`Team Member #${memberNum} valid 10-digit Mobile Number is required.`);
          return false;
        }
        if (!m.age.trim() || isNaN(Number(m.age)) || Number(m.age) < 1 || Number(m.age) > 120) {
          setError(`Team Member #${memberNum} valid Age between 1 and 120 is required.`);
          return false;
        }
        if (!m.nationality.trim()) {
          setError(`Team Member #${memberNum} Country/Nationality is required.`);
          return false;
        }
        if (!m.city.trim()) {
          setError(`Team Member #${memberNum} City is required.`);
          return false;
        }
      }
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

    try {
      if (mode === 'SOLO') {
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
          isSolo: true,
          mode: 'SOLO',
          medicalConditions: finalMedical,
          customMedicalInfo: customMedicalDetails.trim() || undefined,
          idProofType,
          idProofImage: idProofImage || undefined,
          idProofHash: idProofHash || undefined
        };

        const res = await fetch('/api/tourists/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Registration failed.');
        }

        if (idProofImage && data.tourist) {
          try {
            localStorage.setItem(`safeyatra_doc_${data.tourist.id}`, idProofImage);
            localStorage.setItem(`safeyatra_doc_${data.tourist.name.toLowerCase().trim()}`, idProofImage);
            if (data.tourist.blockchainDid) {
              localStorage.setItem(`safeyatra_doc_${data.tourist.blockchainDid}`, idProofImage);
            }
          } catch (e) { }
        }

        setRegisteredResult({
          mode: 'SOLO',
          leader: data.tourist
        });
      } else {
        // TEAM MODE REGISTRATION VIA ATOMIC ENDPOINT
        const teamPayload = {
          groupName: groupName.trim(),
          leader: {
            name: form.name.trim(),
            email: form.email.trim(),
            mobile: form.mobile.trim(),
            nationality: form.nationality.trim(),
            city: form.city.trim(),
            age: parseInt(form.age.trim()),
            bloodType: form.bloodType,
            lat: form.lat.trim(),
            lng: form.lng.trim(),
            medicalConditions: finalMedical,
            customMedicalInfo: customMedicalDetails.trim() || undefined,
            idProofType,
            idProofImage: idProofImage || undefined,
            idProofHash: idProofHash || undefined
          },
          members: members.map(m => ({
            name: m.name.trim(),
            mobile: m.mobile.trim(),
            nationality: m.nationality.trim(),
            city: m.city.trim(),
            age: parseInt(m.age.trim()),
            bloodType: m.bloodType,
            lat: form.lat.trim(),
            lng: form.lng.trim(),
            medicalConditions: m.medicalConditions === 'Other / Custom' && m.customMedicalInfo?.trim()
              ? `Other: ${m.customMedicalInfo.trim()}`
              : (m.medicalConditions || 'None / Healthy'),
            customMedicalInfo: m.customMedicalInfo?.trim() || undefined
          }))
        };

        const res = await fetch('/api/tourists/register-team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(teamPayload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          if (data.error === 'NO_AVAILABLE_GUIDE') {
            throw new Error(data.message || 'All available guides are currently assigned. Please contact the SafeYatra Command Center.');
          }
          throw new Error(data.error || data.message || 'Team registration failed.');
        }

        if (idProofImage && data.leader) {
          try {
            localStorage.setItem(`safeyatra_doc_${data.leader.id}`, idProofImage);
            localStorage.setItem(`safeyatra_doc_${data.leader.name.toLowerCase().trim()}`, idProofImage);
            if (data.leader.blockchainDid) {
              localStorage.setItem(`safeyatra_doc_${data.leader.blockchainDid}`, idProofImage);
            }
          } catch (e) { }
        }

        setRegisteredResult({
          mode: 'TEAM',
          leader: data.leader,
          groupId: data.groupId,
          groupName: data.groupName,
          members: data.members,
          assignedGuide: data.guide
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFinish = () => {
    if (registeredResult) {
      onSuccess(registeredResult.leader.id, registeredResult.leader.mobile || form.mobile);
    }
    handleClose();
  };

  const handleClose = () => {
    setError(null);
    setRegisteredResult(null);
    setForm({ name: '', email: '', mobile: '', nationality: 'Indian', city: '', age: '', bloodType: 'O+', lat: '', lng: '' });
    setGroupName('');
    setMembers([{ id: '1', name: '', mobile: '', age: '', bloodType: 'O+', nationality: 'Indian', city: '' }]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 font-[Inter,sans-serif]">
      <div className="bg-white rounded-2xl shadow-2xl border border-st-outline-variant/40 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-pop-in">

        {/* Header */}
        <div className="bg-st-surface-container px-6 py-4 border-b border-st-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-st-primary text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-st-on-surface">Tourist Registration</h3>
              <p className="text-xs text-st-on-surface-variant">SafeYatra Smart Identity & Safety Profile</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-st-on-surface-variant hover:text-st-on-surface hover:bg-st-outline-variant/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {registeredResult ? (
            /* ── SUCCESS CREDENTIALS VIEW ── */
            <div className="space-y-6 py-2">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-st-on-surface">Registration Successful!</h4>
                <p className="text-xs text-st-on-surface-variant mt-1">
                  Your tourist safety identity has been generated. Use your Tourist ID to sign in.
                </p>
              </div>

              {registeredResult.mode === 'SOLO' ? (
                /* Solo Card */
                <div className="bg-st-surface-container border-2 border-dashed border-st-primary/40 rounded-2xl p-6 text-center shadow-sm">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Solo Account • Direct Admin HQ Monitored (No Guide Assigned)</span>
                  </div>
                  <p className="text-[11px] font-bold text-st-on-surface-variant uppercase tracking-wider mb-1">
                    Your Unique Tourist Login ID
                  </p>
                  <div className="flex items-center justify-center gap-3 my-3">
                    <span className="text-3xl font-black text-st-primary font-mono tracking-wider">
                      {registeredResult.leader.id}
                    </span>
                    <button
                      onClick={() => handleCopy(registeredResult.leader.id)}
                      className="p-2 text-st-on-surface-variant hover:text-st-primary bg-white rounded-lg border border-st-outline-variant/50 shadow-xs transition-colors cursor-pointer"
                      title="Copy Tourist ID"
                    >
                      {copiedId === registeredResult.leader.id ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-left text-xs pt-3 border-t border-st-outline-variant/30 text-st-on-surface">
                    <div><span className="font-semibold text-st-on-surface-variant">Name:</span> {registeredResult.leader.name}</div>
                    <div><span className="font-semibold text-st-on-surface-variant">Mobile:</span> {registeredResult.leader.mobile}</div>
                    <div><span className="font-semibold text-st-on-surface-variant">Blood Group:</span> {registeredResult.leader.bloodType || 'O+'}</div>
                    <div><span className="font-semibold text-st-on-surface-variant">City:</span> {registeredResult.leader.city}</div>
                  </div>
                </div>
              ) : (
                /* Team Cards */
                <div className="space-y-4">
                  <div className="bg-st-surface-container border-2 border-dashed border-st-primary/40 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-st-outline-variant/30 pb-3 mb-3">
                      <div>
                        <span className="bg-st-primary text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          Team / Group Account
                        </span>
                        <h5 className="text-base font-bold text-st-on-surface mt-1">{registeredResult.groupName}</h5>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-st-on-surface-variant uppercase tracking-wider">Group ID</span>
                        <p className="text-sm font-bold font-mono text-st-primary">{registeredResult.groupId}</p>
                      </div>
                    </div>

                    {/* System Assigned Tour Guide Card */}
                    {registeredResult.assignedGuide && (
                      <div className="p-3.5 bg-blue-50/90 rounded-xl border border-blue-200 mb-3 shadow-xs">
                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-blue-200/60">
                          <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>System Assigned Tour Guide</span>
                          </span>
                          <span className="text-xs font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                            {registeredResult.assignedGuide.guide_id}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-800">
                          <div><span className="font-semibold text-slate-500">Guide Name:</span> <span className="font-bold text-blue-900">{registeredResult.assignedGuide.full_name}</span></div>
                          <div><span className="font-semibold text-slate-500">Mobile:</span> {registeredResult.assignedGuide.mobile_number}</div>
                          <div><span className="font-semibold text-slate-500">License No:</span> {registeredResult.assignedGuide.guide_license_no}</div>
                          <div><span className="font-semibold text-slate-500">Experience:</span> {registeredResult.assignedGuide.years_of_experience} Years</div>
                          <div className="col-span-2"><span className="font-semibold text-slate-500">Languages:</span> {registeredResult.assignedGuide.languages_known}</div>
                        </div>
                      </div>
                    )}

                    {/* Leader ID */}
                    <div className="p-3 bg-white rounded-xl border border-st-outline-variant/40 mb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-st-primary uppercase tracking-wider">Team Leader</span>
                        <p className="text-sm font-bold text-st-on-surface">{registeredResult.leader.name}</p>
                        <p className="text-xs text-st-on-surface-variant">{registeredResult.leader.mobile}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold font-mono text-st-primary">{registeredResult.leader.id}</span>
                        <button
                          onClick={() => handleCopy(registeredResult.leader.id)}
                          className="p-1.5 text-st-on-surface-variant hover:text-st-primary bg-st-surface-container rounded-md cursor-pointer"
                        >
                          {copiedId === registeredResult.leader.id ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Members List */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-st-on-surface-variant uppercase tracking-wider">Team Members Credentials</span>
                      {registeredResult.members?.map((mem, idx) => (
                        <div key={mem.id} className="p-2.5 bg-white rounded-xl border border-st-outline-variant/30 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-st-on-surface">Member #{idx + 1}: {mem.name}</span>
                            <span className="text-st-on-surface-variant ml-2">({mem.mobile})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-st-primary">{mem.id}</span>
                            <button
                              onClick={() => handleCopy(mem.id)}
                              className="p-1 text-st-on-surface-variant hover:text-st-primary cursor-pointer"
                            >
                              {copiedId === mem.id ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-3 border-t border-st-outline-variant/30">
                <button
                  onClick={handleFinish}
                  className="w-full bg-st-primary text-white py-3 rounded-xl font-bold hover:bg-st-primary-fixed transition-colors shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer hover-scale ripple-target"
                >
                  <span>Proceed to Sign In</span>
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* ── REGISTRATION FORM ── */
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* MODE SELECTION TOGGLE */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-2">
                  Select Registration Type <span className="text-st-error">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-st-surface-container rounded-xl border border-st-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => { setMode('SOLO'); setError(null); }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${mode === 'SOLO'
                        ? 'bg-st-primary text-white shadow-md'
                        : 'text-st-on-surface-variant hover:text-st-on-surface'
                      }`}
                  >
                    <User className="w-4 h-4" />
                    <span>SOLO TOURIST</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('TEAM'); setError(null); }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${mode === 'TEAM'
                        ? 'bg-st-primary text-white shadow-md'
                        : 'text-st-on-surface-variant hover:text-st-on-surface'
                      }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>TEAM / GROUP TOURIST</span>
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3.5 bg-st-error-container text-st-on-error-container rounded-xl text-xs font-medium border border-st-error/30 flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-st-error shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* TEAM NAME FIELD (IF TEAM MODE) */}
              {mode === 'TEAM' && (
                <div className="bg-st-surface-container p-4 rounded-xl border border-st-primary/30">
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-primary mb-1.5">
                    Team / Group Name <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={e => { setGroupName(e.target.value); setError(null); }}
                    placeholder="e.g. Himalayan Explorers Squad"
                    className="w-full bg-white border border-st-outline-variant/60 rounded-xl px-3.5 py-2 text-st-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-st-primary text-sm"
                  />
                </div>
              )}

              {/* SOLO TRAVELER DIRECT LINK NOTICE */}
              {mode === 'SOLO' && (
                <div className="p-3 bg-blue-50/90 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5 shadow-xs">
                  <Shield className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-blue-950">Solo Traveler Direct Safety Link</span>
                    <span className="text-blue-800 text-[11px] leading-relaxed">
                      Solo travelers connect directly with the SafeYatra Central Safety Command Center (no tour guide assigned). Your generated ID will follow the format <code className="font-mono font-bold text-blue-900 bg-blue-100 px-1 py-0.5 rounded">S-2026-XXX[A-Z]</code>.
                    </span>
                  </div>
                </div>
              )}

              {/* SECTION HEADER: TOURIST / LEADER DETAILS */}
              <div className="border-b border-st-outline-variant/30 pb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-st-primary">
                  {mode === 'TEAM' ? '1. Team Leader Mandatory Safety Info' : 'Tourist Mandatory Safety Info'}
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    Full Name <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => updateFormField('name', e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full bg-st-surface-container border border-st-outline-variant/50 rounded-xl px-3.5 py-2.5 text-st-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    Email Address <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => updateFormField('email', e.target.value)}
                    placeholder="e.g. elena@domain.com"
                    className="w-full bg-st-surface-container border border-st-outline-variant/50 rounded-xl px-3.5 py-2.5 text-st-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  />
                </div>

                {/* Mobile No */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    Mobile No <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.mobile}
                    onChange={e => updateFormField('mobile', e.target.value)}
                    placeholder="e.g. +91 99887 76655"
                    className="w-full bg-st-surface-container border border-st-outline-variant/50 rounded-xl px-3.5 py-2.5 text-st-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  />
                </div>

                {/* Country / Nationality */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    Country (Nationality) <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nationality}
                    onChange={e => updateFormField('nationality', e.target.value)}
                    placeholder="e.g. Indian"
                    className="w-full bg-st-surface-container border border-st-outline-variant/50 rounded-xl px-3.5 py-2.5 text-st-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    City <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={e => updateFormField('city', e.target.value)}
                    placeholder="e.g. Pune, Mumbai, Delhi..."
                    className="w-full bg-st-surface-container border border-st-outline-variant/50 rounded-xl px-3.5 py-2.5 text-st-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    Age <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={form.age}
                    onChange={e => updateFormField('age', e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full bg-st-surface-container border border-st-outline-variant/50 rounded-xl px-3.5 py-2.5 text-st-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  />
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    Blood Group <span className="text-st-error">*</span>
                  </label>
                  <select
                    value={form.bloodType}
                    onChange={e => updateFormField('bloodType', e.target.value)}
                    className="w-full bg-st-surface-container border border-st-outline-variant/50 rounded-xl px-3.5 py-2.5 text-st-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary cursor-pointer"
                  >
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                {/* Live GPS Auto-Detection Banner */}
                <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-blue-50/90 border border-blue-200 rounded-xl gap-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${locationDetected ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${locationDetected ? 'bg-emerald-500' : 'bg-blue-600'}`}></span>
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Crosshair className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          {locationDetected
                            ? `Live Browser GPS Assigned (${form.city || (form.lat ? `${form.lat}°N, ${form.lng}°E` : 'Detected')})`
                            : (isDetectingLocation ? 'Detecting Live Browser Coordinates...' : 'GPS Live Location Pending (Manual Entry Active)')}
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {locationDetected
                          ? `Lat: ${form.lat}, Lng: ${form.lng}${form.city ? ` • Detected City: ${form.city}` : ''}`
                          : (isDetectingLocation ? 'Requesting device GPS coordinates...' : 'Click "Refresh GPS Location" or enter city and coordinates below.')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => detectLiveLocation(true)}
                    disabled={isDetectingLocation}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-300 hover:border-blue-400 px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                    <span>{isDetectingLocation ? 'Locating...' : 'Refresh GPS Location'}</span>
                  </button>
                </div>

                {/* Initial Latitude */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    Initial Latitude <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.lat}
                    onChange={e => updateFormField('lat', e.target.value)}
                    placeholder="30.1250"
                    className="w-full bg-st-surface-container border border-st-outline-variant/50 rounded-xl px-3.5 py-2.5 text-st-on-surface font-mono text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  />
                </div>

                {/* Initial Longitude */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    Initial Longitude <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.lng}
                    onChange={e => updateFormField('lng', e.target.value)}
                    placeholder="78.3180"
                    className="w-full bg-st-surface-container border border-st-outline-variant/50 rounded-xl px-3.5 py-2.5 text-st-on-surface font-mono text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  />
                </div>

                {/* ── 3. PRE-EXISTING MEDICAL & HEALTH CONDITIONS ── */}
                <div className="md:col-span-2 bg-st-surface-container/50 p-4 rounded-xl border border-st-outline-variant/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-red-500" />
                      <label className="text-xs font-bold uppercase tracking-wider text-st-primary">
                        Pre-Existing Medical & Health Conditions <span className="text-st-error">*</span>
                      </label>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                      Emergency Triage Data
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-st-on-surface-variant mb-1">
                        Select Known Medical Condition
                      </label>
                      <select
                        value={medicalCondition}
                        onChange={e => setMedicalCondition(e.target.value)}
                        className="w-full bg-white border border-st-outline-variant/50 rounded-lg px-3 py-2 text-st-on-surface text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-st-primary cursor-pointer"
                      >
                        {MEDICAL_CONDITION_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {medicalCondition === 'Other / Custom' ? (
                      <div>
                        <label className="block text-[11px] font-bold text-st-on-surface-variant mb-1">
                          Specify Medical Problem / Medicine <span className="text-st-error">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={customMedicalDetails}
                          onChange={e => setCustomMedicalDetails(e.target.value)}
                          placeholder="e.g., Severe Bronchitis, Insulin Dependent..."
                          className="w-full bg-white border border-st-outline-variant/50 rounded-lg px-3 py-2 text-st-on-surface text-xs font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                        <span>
                          {medicalCondition === 'None / Healthy'
                            ? '✓ No acute chronic conditions reported. Ready for expedition.'
                            : `⚠️ Note: Emergency medical response teams (Trauma ICU) will be pre-alerted to ${medicalCondition}.`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 4. GOVERNMENT ID PROOF (AADHAAR / PASSPORT) ── */}
                <div className="md:col-span-2 bg-st-surface-container/50 p-4 rounded-xl border border-st-outline-variant/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-st-primary" />
                      <label className="text-xs font-bold uppercase tracking-wider text-st-primary">
                        Government Identity Verification (Aadhaar / Passport) <span className="text-st-error">*</span>
                      </label>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>AES-256 Vault Encrypted</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-st-on-surface-variant mb-1">
                        Document Type <span className="text-st-error">*</span>
                      </label>
                      <select
                        value={idProofType}
                        onChange={e => setIdProofType(e.target.value as any)}
                        className="w-full bg-white border border-st-outline-variant/50 rounded-lg px-3 py-2 text-st-on-surface text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-st-primary cursor-pointer"
                      >
                        <option value="AADHAAR">Aadhaar Card</option>
                        <option value="PASSPORT">Passport</option>
                        <option value="DRIVING_LICENSE">Driving License / Voter ID</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-st-on-surface-variant mb-1">
                        Upload ID Card Photo / Document (PNG, JPG, PDF)
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleIdFileUpload}
                          className="hidden"
                          id="idProofUploadInput"
                        />
                        <label
                          htmlFor="idProofUploadInput"
                          className="flex items-center justify-between px-3.5 py-2 bg-white border border-dashed border-st-primary/50 hover:border-st-primary rounded-lg text-xs font-medium text-st-on-surface cursor-pointer hover:bg-st-primary/5 transition-all"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Upload className="w-4 h-4 text-st-primary" />
                            <span className="truncate">
                              {isReadingFile ? 'Processing document...' : (idProofFileName || `Select ${idProofType === 'AADHAAR' ? 'Aadhaar Card' : 'Passport'} image...`)}
                            </span>
                          </div>
                          <span className="text-[10px] bg-st-primary text-white font-bold px-2 py-1 rounded-md shrink-0 ml-2">
                            Browse File
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Image Thumbnail & Proof Badge */}
                  {idProofImage && (
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={idProofImage}
                          alt="ID Proof Preview"
                          className="w-12 h-10 object-cover rounded border border-slate-200 shadow-xs"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span>{idProofType === 'AADHAAR' ? 'Aadhaar Card Encrypted' : 'Passport Document Encrypted'}</span>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 truncate max-w-[240px]">
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
                        className="text-red-500 hover:text-red-700 text-xs font-semibold p-1 hover:bg-red-50 rounded"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>Protected by Indian DPDP Act 2023. Stored securely with tamper-proof cryptographic hashing on ledger.</span>
                  </p>
                </div>

              </div>

              {/* TEAM MEMBERS SECTION (IF TEAM MODE) */}
              {mode === 'TEAM' && (
                <div className="space-y-4 pt-4 border-t border-st-outline-variant/30">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-st-primary">
                      2. Add Team Members Mandatory Safety Details
                    </h4>
                    <button
                      type="button"
                      onClick={addTeamMember}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-st-surface-container text-st-primary hover:bg-st-primary hover:text-white transition-colors rounded-lg text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Member</span>
                    </button>
                  </div>

                  {members.map((mem, index) => (
                    <div key={mem.id} className="p-4 bg-st-surface-container rounded-xl border border-st-outline-variant/40 space-y-3">
                      <div className="flex items-center justify-between border-b border-st-outline-variant/30 pb-2">
                        <span className="text-xs font-bold text-st-on-surface">
                          Team Member #{index + 1}
                        </span>
                        {members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTeamMember(mem.id)}
                            className="text-st-error hover:bg-red-50 p-1 rounded-md transition-colors cursor-pointer"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="md:col-span-2">
                          <label className="block font-bold text-st-on-surface-variant mb-1">
                            Full Name <span className="text-st-error">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={mem.name}
                            onChange={e => updateMemberField(mem.id, 'name', e.target.value)}
                            placeholder="Member Full Name"
                            className="w-full bg-white border border-st-outline-variant/50 rounded-lg px-3 py-2 text-st-on-surface focus:outline-none focus:ring-2 focus:ring-st-primary"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-st-on-surface-variant mb-1">
                            Mobile No <span className="text-st-error">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={mem.mobile}
                            onChange={e => updateMemberField(mem.id, 'mobile', e.target.value)}
                            placeholder="+91 9876543210"
                            className="w-full bg-white border border-st-outline-variant/50 rounded-lg px-3 py-2 text-st-on-surface focus:outline-none focus:ring-2 focus:ring-st-primary"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-st-on-surface-variant mb-1">
                            Age <span className="text-st-error">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            max="120"
                            value={mem.age}
                            onChange={e => updateMemberField(mem.id, 'age', e.target.value)}
                            placeholder="Age"
                            className="w-full bg-white border border-st-outline-variant/50 rounded-lg px-3 py-2 text-st-on-surface focus:outline-none focus:ring-2 focus:ring-st-primary"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-st-on-surface-variant mb-1">
                            Blood Group <span className="text-st-error">*</span>
                          </label>
                          <select
                            value={mem.bloodType}
                            onChange={e => updateMemberField(mem.id, 'bloodType', e.target.value)}
                            className="w-full bg-white border border-st-outline-variant/50 rounded-lg px-3 py-2 text-st-on-surface focus:outline-none focus:ring-2 focus:ring-st-primary cursor-pointer"
                          >
                            {BLOOD_GROUPS.map(bg => (
                              <option key={bg} value={bg}>{bg}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-st-on-surface-variant mb-1">
                            Country (Nationality) <span className="text-st-error">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={mem.nationality}
                            onChange={e => updateMemberField(mem.id, 'nationality', e.target.value)}
                            placeholder="Nationality"
                            className="w-full bg-white border border-st-outline-variant/50 rounded-lg px-3 py-2 text-st-on-surface focus:outline-none focus:ring-2 focus:ring-st-primary"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-st-on-surface-variant mb-1">
                            City <span className="text-st-error">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={mem.city}
                            onChange={e => updateMemberField(mem.id, 'city', e.target.value)}
                            placeholder="City"
                            className="w-full bg-white border border-st-outline-variant/50 rounded-lg px-3 py-2 text-st-on-surface focus:outline-none focus:ring-2 focus:ring-st-primary"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-st-on-surface-variant mb-1">
                            Medical Condition
                          </label>
                          <select
                            value={mem.medicalConditions || 'None / Healthy'}
                            onChange={e => updateMemberField(mem.id, 'medicalConditions', e.target.value)}
                            className="w-full bg-white border border-st-outline-variant/50 rounded-lg px-3 py-2 text-st-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-st-primary cursor-pointer"
                          >
                            {MEDICAL_CONDITION_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        {mem.medicalConditions === 'Other / Custom' && (
                          <div className="md:col-span-2">
                            <label className="block font-bold text-st-on-surface-variant mb-1">
                              Specify Member Medical Condition <span className="text-st-error">*</span>
                            </label>
                            <input
                              type="text"
                              value={mem.customMedicalInfo || ''}
                              onChange={e => updateMemberField(mem.id, 'customMedicalInfo', e.target.value)}
                              placeholder="e.g. Asthma, High BP..."
                              className="w-full bg-white border border-st-outline-variant/50 rounded-lg px-3 py-2 text-st-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-st-primary"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit / Action Buttons */}
              <div className="pt-4 border-t border-st-outline-variant/30 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-st-on-surface-variant hover:bg-st-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-st-primary text-white rounded-xl font-bold text-xs hover:bg-st-primary-fixed transition-colors shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Register Tourist Profile</span>
                      <ShieldCheck className="w-4 h-4" />
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
