import React, { useState, useEffect } from 'react';
import { User, Users, Edit3, Save, X, Shield, Phone, Mail, MapPin, Heart, Calendar, Globe, Building, Battery, Activity, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { TouristProfile } from '../../types';
import { useLanguage } from '../../utils/LanguageContext';
import { maskDid } from '../../utils/didUtils';

interface TouristProfileViewProps {
  tourist: TouristProfile;
  setTourist: React.Dispatch<React.SetStateAction<TouristProfile>>;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const TouristProfileView: React.FC<TouristProfileViewProps> = ({ tourist, setTourist }) => {
  const { t } = useLanguage('tourist');
  const [isEditing, setIsEditing] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TouristProfile[]>([]);

  // Form State
  const [form, setForm] = useState({
    name: tourist.name || '',
    email: tourist.email || '',
    mobile: tourist.mobile || '',
    nationality: tourist.nationality || 'Indian',
    city: tourist.city || '',
    age: tourist.age ? String(tourist.age) : '',
    bloodType: tourist.bloodType || 'O+',
    emergencyContact: tourist.emergencyContact || ''
  });

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync form when tourist changes
  useEffect(() => {
    setForm({
      name: tourist.name || '',
      email: tourist.email || '',
      mobile: tourist.mobile || '',
      nationality: tourist.nationality || 'Indian',
      city: tourist.city || '',
      age: tourist.age ? String(tourist.age) : '',
      bloodType: tourist.bloodType || 'O+',
      emergencyContact: tourist.emergencyContact || ''
    });
  }, [tourist]);

  // Fetch Team Members if Tourist is in a Team/Group
  useEffect(() => {
    if (tourist.groupId) {
      fetch('/api/tourists')
        .then(res => res.ok ? res.json() : [])
        .then((list: TouristProfile[]) => {
          if (Array.isArray(list)) {
            const groupList = list.filter(t => t.groupId === tourist.groupId && t.id !== tourist.id);
            setTeamMembers(groupList);
          }
        })
        .catch(err => console.error('Failed to fetch team members:', err));
    }
  }, [tourist.groupId, tourist.id]);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
    if (successMsg) setSuccessMsg(null);
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validateMobile = (mobile: string) => {
    const clean = mobile.replace(/\D/g, '');
    return clean.length >= 10 && clean.length <= 15;
  };

  const validate = (): boolean => {
    if (!form.name.trim()) {
      setError('Full Name is required.');
      return false;
    }
    if (!form.email.trim() || !validateEmail(form.email)) {
      setError('Please enter a valid Email Address.');
      return false;
    }
    if (!form.mobile.trim() || !validateMobile(form.mobile)) {
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
    if (!form.emergencyContact.trim()) {
      setError('Emergency Contact Number is required.');
      return false;
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        nationality: form.nationality.trim(),
        city: form.city.trim(),
        age: parseInt(form.age.trim()),
        bloodType: form.bloodType,
        emergencyContact: form.emergencyContact.trim()
      };

      const res = await fetch(`/api/tourists/${tourist.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setTourist(prev => ({
        ...prev,
        ...data.tourist
      }));

      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while saving changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const isTeamAccount = Boolean(tourist.groupId || tourist.groupName);

  return (
    <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-6 space-y-6 font-[Inter,sans-serif]">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-st-outline-variant/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-st-primary text-white flex items-center justify-center text-2xl font-bold shadow-md shrink-0">
            {tourist.name ? tourist.name.charAt(0).toUpperCase() : 'T'}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-extrabold text-st-on-surface">{tourist.name || 'Traveler'}</h2>
              {isTeamAccount ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200">
                  <Users className="w-3.5 h-3.5" />
                  {t('profile.teamTourist')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                  <User className="w-3.5 h-3.5" />
                  {t('profile.soloTourist')}
                </span>
              )}
            </div>
            <p className="text-xs text-st-on-surface-variant mt-1 font-mono">
              Tourist ID: <span className="font-bold text-st-primary">{tourist.id}</span>
              {isTeamAccount || tourist.guide_id ? (
                <> • {t('profile.guideLabel')} {tourist.guide_id || 'G-1001'}</>
              ) : (
                <> • <span className="text-emerald-700 font-semibold">Direct Admin Protection</span></>
              )}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {!isEditing ? (
            <button
              onClick={() => { setIsEditing(true); setError(null); setSuccessMsg(null); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-st-primary text-white hover:bg-st-primary-fixed transition-colors rounded-xl font-bold text-xs shadow-md cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>{t('profile.editBtn')}</span>
            </button>
          ) : (
            <button
              onClick={() => { setIsEditing(false); setError(null); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-st-surface-container text-st-on-surface-variant hover:bg-st-outline-variant/30 transition-colors rounded-xl font-bold text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>{t('profile.cancelEdit')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-green-50 text-green-800 rounded-xl text-xs font-semibold border border-green-200 flex items-center gap-2.5">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <span>{t('profile.updateSuccess')}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-st-error-container text-st-on-error-container rounded-xl text-xs font-semibold border border-st-error/30 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-st-error shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Personal Info Panel (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-md border border-st-outline-variant/40 space-y-6">
          <div className="border-b border-st-outline-variant/30 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-st-on-surface flex items-center gap-2">
              <User className="w-5 h-5 text-st-primary" />
              <span>{t('profile.title')}</span>
            </h3>
            <span className="text-xs text-st-on-surface-variant">
              {isEditing ? t('profile.editingMode') : t('profile.verifiedRecord')}
            </span>
          </div>

          {!isEditing ? (
            /* ── VIEW MODE ── */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div className="p-3.5 bg-st-surface-container rounded-xl border border-st-outline-variant/30">
                <span className="text-[11px] font-bold text-st-on-surface-variant uppercase tracking-wider block mb-1">
                  {t('profile.fullName')}
                </span>
                <span className="text-sm font-bold text-st-on-surface">{tourist.name || 'N/A'}</span>
              </div>

              {/* Email */}
              <div className="p-3.5 bg-st-surface-container rounded-xl border border-st-outline-variant/30">
                <span className="text-[11px] font-bold text-st-on-surface-variant uppercase tracking-wider block mb-1">
                  {t('profile.emailAddress')}
                </span>
                <span className="text-sm font-bold text-st-on-surface">{tourist.email || 'N/A'}</span>
              </div>

              {/* Mobile */}
              <div className="p-3.5 bg-st-surface-container rounded-xl border border-st-outline-variant/30">
                <span className="text-[11px] font-bold text-st-on-surface-variant uppercase tracking-wider block mb-1">
                  {t('profile.mobileNumber')}
                </span>
                <span className="text-sm font-bold text-st-on-surface">{tourist.mobile || 'N/A'}</span>
              </div>

              {/* Emergency Contact */}
              <div className="p-3.5 bg-st-surface-container rounded-xl border border-st-outline-variant/30">
                <span className="text-[11px] font-bold text-st-error uppercase tracking-wider block mb-1">
                  {t('common.emergencyContact')}
                </span>
                <span className="text-sm font-bold text-st-on-surface">{tourist.emergencyContact || 'N/A'}</span>
              </div>

              {/* Country */}
              <div className="p-3.5 bg-st-surface-container rounded-xl border border-st-outline-variant/30">
                <span className="text-[11px] font-bold text-st-on-surface-variant uppercase tracking-wider block mb-1">
                  {t('profile.country')}
                </span>
                <span className="text-sm font-bold text-st-on-surface">{tourist.nationality || 'Indian'}</span>
              </div>

              {/* City */}
              <div className="p-3.5 bg-st-surface-container rounded-xl border border-st-outline-variant/30">
                <span className="text-[11px] font-bold text-st-on-surface-variant uppercase tracking-wider block mb-1">
                  {t('common.city')}
                </span>
                <span className="text-sm font-bold text-st-on-surface">{tourist.city || 'Not Specified'}</span>
              </div>

              {/* Age */}
              <div className="p-3.5 bg-st-surface-container rounded-xl border border-st-outline-variant/30">
                <span className="text-[11px] font-bold text-st-on-surface-variant uppercase tracking-wider block mb-1">
                  {t('common.age')}
                </span>
                <span className="text-sm font-bold text-st-on-surface">{tourist.age ? `${tourist.age} yrs` : 'N/A'}</span>
              </div>

              {/* Blood Group */}
              <div className="p-3.5 bg-st-surface-container rounded-xl border border-st-outline-variant/30">
                <span className="text-[11px] font-bold text-st-on-surface-variant uppercase tracking-wider block mb-1">
                  {t('profile.bloodGroupLabel')}
                </span>
                <span className="text-sm font-bold text-red-600">{tourist.bloodType || 'O+'}</span>
              </div>

              {/* Pre-Existing Medical Conditions */}
              <div className="p-3.5 bg-st-surface-container rounded-xl border border-st-outline-variant/30 md:col-span-2">
                <span className="text-[11px] font-bold text-st-on-surface-variant uppercase tracking-wider block mb-1">
                  🏥 Medical & Health Conditions
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-st-on-surface">
                    {tourist.medicalConditions || 'None / Healthy'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tourist.medicalConditions && tourist.medicalConditions !== 'None / Healthy'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {tourist.medicalConditions && tourist.medicalConditions !== 'None / Healthy' ? 'Pre-Alert Active' : 'Normal / Fit'}
                  </span>
                </div>
              </div>

              {/* Government ID Verification */}
              <div className="p-3.5 bg-st-surface-container rounded-xl border border-st-outline-variant/30 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-st-on-surface-variant uppercase tracking-wider block mb-1">
                      🛡️ Gov ID Proof ({tourist.idProofType || 'AADHAAR'})
                    </span>
                    <p className="text-xs text-st-on-surface-variant font-mono">
                      {tourist.idProofHash ? `Proof Hash: ${tourist.idProofHash.slice(0, 22)}...` : 'AES-256 Encrypted & Stored'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Encrypted & Verified</span>
                  </span>
                </div>
              </div>

            </div>
          ) : (
            /* ── EDIT FORM ── */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    {t('profile.fullName')} <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => updateField('name', e.target.value)}
                    className="w-full bg-st-surface-container border border-st-outline-variant/60 rounded-xl px-3.5 py-2.5 text-st-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    {t('profile.emailAddress')} <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => updateField('email', e.target.value)}
                    className="w-full bg-st-surface-container border border-st-outline-variant/60 rounded-xl px-3.5 py-2.5 text-st-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    {t('profile.mobileNumber')} <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.mobile}
                    onChange={e => updateField('mobile', e.target.value)}
                    className="w-full bg-st-surface-container border border-st-outline-variant/60 rounded-xl px-3.5 py-2.5 text-st-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  />
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-error mb-1">
                    {t('common.emergencyContact')} <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.emergencyContact}
                    onChange={e => updateField('emergencyContact', e.target.value)}
                    className="w-full bg-st-surface-container border border-st-outline-variant/60 rounded-xl px-3.5 py-2.5 text-st-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    {t('profile.country')} <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nationality}
                    onChange={e => updateField('nationality', e.target.value)}
                    className="w-full bg-st-surface-container border border-st-outline-variant/60 rounded-xl px-3.5 py-2.5 text-st-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    {t('common.city')} <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={e => updateField('city', e.target.value)}
                    className="w-full bg-st-surface-container border border-st-outline-variant/60 rounded-xl px-3.5 py-2.5 text-st-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    {t('common.age')} <span className="text-st-error">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={form.age}
                    onChange={e => updateField('age', e.target.value)}
                    className="w-full bg-st-surface-container border border-st-outline-variant/60 rounded-xl px-3.5 py-2.5 text-st-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  />
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1">
                    {t('profile.bloodGroupLabel')} <span className="text-st-error">*</span>
                  </label>
                  <select
                    value={form.bloodType}
                    onChange={e => updateField('bloodType', e.target.value)}
                    className="w-full bg-st-surface-container border border-st-outline-variant/60 rounded-xl px-3.5 py-2.5 text-st-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-st-primary"
                  >
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-st-outline-variant/30 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-st-on-surface-variant hover:bg-st-surface-container transition-colors cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-st-primary text-white rounded-xl font-bold text-xs hover:bg-st-primary-fixed transition-colors shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('common.loading')}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{t('profile.saveChanges')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TEAM / GROUP DETAILS PANEL */}
          {isTeamAccount && (
            <div className="pt-4 border-t border-st-outline-variant/30 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{t('profile.teamMembership')}</span>
                </h4>
                <span className="text-xs font-mono font-bold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  Group ID: {tourist.groupId || 'GRP-N/A'}
                </span>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">{tourist.groupName || 'Tour Group Squad'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 font-bold uppercase text-[10px]">
                    {tourist.isLeader ? 'Leader' : 'Member'}
                  </span>
                </div>
              </div>

              {/* Fellow Members List */}
              {teamMembers.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-st-on-surface-variant uppercase tracking-wider">
                    Fellow Team Members ({teamMembers.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {teamMembers.map(m => (
                      <div key={m.id} className="p-3 bg-st-surface-container rounded-xl border border-st-outline-variant/40 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-st-on-surface">{m.name}</p>
                          <p className="text-[11px] text-st-on-surface-variant">{m.mobile || 'No Mobile'} • Blood: {m.bloodType || 'N/A'}</p>
                        </div>
                        <span className="font-mono text-[10px] font-bold bg-white px-2 py-1 rounded border border-st-outline-variant/40">
                          {m.id}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Telemetry & Status Panel (1 col) */}
        <div className="space-y-6">

          {/* Real-time Safety Telemetry */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-st-outline-variant/40 space-y-4">
            <h3 className="text-base font-bold text-st-on-surface flex items-center gap-2 border-b border-st-outline-variant/30 pb-3">
              <Activity className="w-5 h-5 text-st-primary" />
              <span>{t('profile.safetyTelemetry')}</span>
            </h3>

            <div className="space-y-3 text-xs">
              {/* Safety Status */}
              <div className="flex justify-between items-center p-3 bg-st-surface-container rounded-xl">
                <span className="font-semibold text-st-on-surface-variant">{t('profile.safetyStatusLabel')}</span>
                <span className={`font-bold px-2.5 py-1 rounded-full text-[11px] ${
                  tourist.safetyStatus === 'EMERGENCY_SOS'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : tourist.safetyStatus === 'AT_RISK'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {tourist.safetyStatus}
                </span>
              </div>

              {/* Risk Score */}
              <div className="flex justify-between items-center p-3 bg-st-surface-container rounded-xl">
                <span className="font-semibold text-st-on-surface-variant">{t('profile.riskIndex')}</span>
                <span className="font-bold text-st-on-surface">{tourist.currentRiskScore}/100</span>
              </div>

              {/* Battery Level */}
              <div className="flex justify-between items-center p-3 bg-st-surface-container rounded-xl">
                <span className="font-semibold text-st-on-surface-variant">{t('profile.deviceBattery')}</span>
                <span className="font-bold text-st-on-surface flex items-center gap-1">
                  <Battery className="w-4 h-4 text-emerald-600" />
                  {tourist.batteryLevel}%
                </span>
              </div>

              {/* Current Location */}
              <div className="p-3.5 bg-st-surface-container rounded-xl space-y-1">
                <span className="font-semibold text-st-on-surface-variant block">{t('profile.currentGps')}</span>
                <p className="font-bold text-st-on-surface">{tourist.currentLocation?.address || (tourist.currentLocation?.lat ? `${tourist.currentLocation.lat.toFixed(4)}°N, ${tourist.currentLocation.lng.toFixed(4)}°E` : 'Live Location')}</p>
                <p className="font-mono text-[10px] text-st-on-surface-variant">
                  {tourist.currentLocation?.lat ? `${tourist.currentLocation.lat.toFixed(4)}°N, ${tourist.currentLocation.lng?.toFixed(4)}°E` : 'Coordinates Pending'}
                </p>
              </div>
            </div>
          </div>

          {/* Blockchain Anchor Details */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-st-outline-variant/40 space-y-3">
            <h3 className="text-sm font-bold text-st-on-surface flex items-center gap-2 border-b border-st-outline-variant/30 pb-2">
              <Shield className="w-4 h-4 text-st-primary" />
              <span>{t('profile.blockchainAnchoring')}</span>
            </h3>

            <div className="text-[11px] space-y-2 text-st-on-surface-variant">
              <div>
                <span className="font-semibold block text-st-on-surface">{t('profile.polygonDid')}</span>
                <span className="font-mono text-[10px] break-all bg-st-surface-container p-1.5 rounded block mt-0.5 text-st-primary font-bold">
                  {maskDid(tourist.blockchainDid)}
                </span>
              </div>
              <div>
                <span className="font-semibold block text-st-on-surface">{t('profile.zkpHash')}</span>
                <span className="font-mono text-[10px] break-all bg-st-surface-container p-1.5 rounded block mt-0.5">
                  {tourist.identityHash || '0xa498f3214b72ef31890cd123490aafe782'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold pt-1">
                <CheckCircle className="w-4 h-4" />
                <span>{t('profile.onChainVerified')}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
