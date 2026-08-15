import React, { useState } from 'react';
import { UserPlus, X, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { TouristProfile } from '../../types';

interface GuideRegisterModalProps {
  isOpen: boolean;
  guide_id?: string;
  onClose: () => void;
  onRegister: (data: any) => Promise<TouristProfile | null>;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const GuideRegisterModal: React.FC<GuideRegisterModalProps> = ({
  isOpen,
  guide_id,
  onClose,
  onRegister
}) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    nationality: 'Indian',
    city: 'Rishikesh',
    age: '',
    bloodType: 'O+',
    lat: '30.1250',
    lng: '78.3180'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredTourist, setRegisteredTourist] = useState<TouristProfile | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await onRegister({ ...form, guide_id });
      if (result) {
        setRegisteredTourist(result);
      }
    } catch (err) {
      console.error('Registration failed:', err);
    }
    setIsSubmitting(false);
  };

  const handleCopyId = () => {
    if (registeredTourist) {
      navigator.clipboard.writeText(registeredTourist.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setForm({ name: '', email: '', mobile: '', nationality: 'Indian', city: 'Rishikesh', age: '', bloodType: 'O+', lat: '30.1250', lng: '78.3180' });
    setRegisteredTourist(null);
    setCopied(false);
    onClose();
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 font-guide">
      <div className="bg-gd-surface rounded-2xl shadow-2xl border border-gd-outline-var max-w-lg w-full overflow-hidden">

        {/* ── Modal Header ── */}
        <div className="bg-gd-primary-ctr px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gd-secondary/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-gd-secondary-ctr" />
            </div>
            <h3 className="text-base font-bold text-gd-on-primary-ctr">Register New Tourist</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gd-on-primary-ctr/60 hover:text-gd-on-primary-ctr hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Success View ── */}
        {registeredTourist ? (
          <div className="p-8 text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-gd-secondary-ctr/30 text-gd-secondary flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-gd-on-surface mb-1">Registration Successful!</h4>
            <p className="text-sm text-gd-on-surface-var mb-6">
              Tourist has been registered. Share the Login ID below.
            </p>

            {/* ID Card */}
            <div className="bg-gd-surface-low border-2 border-dashed border-gd-secondary/40 rounded-xl p-5 mb-6">
              <p className="text-[11px] font-bold text-gd-on-surface-var uppercase tracking-widest mb-2">
                Tourist Login ID
              </p>
              <p className="text-3xl font-black text-gd-secondary font-guide-mono tracking-wider mb-4">
                {registeredTourist.id}
              </p>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-left text-[13px] text-gd-on-surface-var border-t border-gd-outline-var pt-3">
                <div><span className="font-semibold text-gd-on-surface">Name:</span> {registeredTourist.name}</div>
                <div><span className="font-semibold text-gd-on-surface">Blood:</span> {registeredTourist.bloodType || 'N/A'}</div>
                <div><span className="font-semibold text-gd-on-surface">Mobile:</span> {registeredTourist.mobile || 'N/A'}</div>
                <div><span className="font-semibold text-gd-on-surface">Country:</span> {registeredTourist.nationality}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3">
              <button
                onClick={handleCopyId}
                className="flex items-center gap-2 px-5 py-2.5 border border-gd-outline-var rounded-lg text-sm font-semibold text-gd-on-surface hover:bg-gd-surface-low transition-colors"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-gd-secondary" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Login ID'}
              </button>
              <button
                onClick={handleClose}
                className="px-5 py-2.5 bg-gd-secondary text-gd-on-secondary rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
              >
                Close & Finish
              </button>
            </div>
          </div>
        ) : (
          /* ── Registration Form ── */
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-2 gap-4">

              {/* Full Name */}
              <div className="col-span-2">
                <label className="block text-[11px] uppercase font-bold text-gd-on-surface-var tracking-wider mb-1.5">
                  Full Name <span className="text-gd-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full text-sm border border-gd-outline-var bg-gd-surface-low focus:bg-gd-surface focus:outline-none focus:ring-2 focus:ring-gd-secondary/40 focus:border-gd-secondary rounded-lg px-3.5 py-2.5 text-gd-on-surface placeholder:text-gd-outline transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-gd-on-surface-var tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  placeholder="e.g. elena@domain.com"
                  className="w-full text-sm border border-gd-outline-var bg-gd-surface-low focus:bg-gd-surface focus:outline-none focus:ring-2 focus:ring-gd-secondary/40 focus:border-gd-secondary rounded-lg px-3.5 py-2.5 text-gd-on-surface placeholder:text-gd-outline transition-colors"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-gd-on-surface-var tracking-wider mb-1.5">
                  Mobile No
                </label>
                <input
                  type="text"
                  value={form.mobile}
                  onChange={e => updateField('mobile', e.target.value)}
                  placeholder="e.g. +91 99887 76655"
                  className="w-full text-sm border border-gd-outline-var bg-gd-surface-low focus:bg-gd-surface focus:outline-none focus:ring-2 focus:ring-gd-secondary/40 focus:border-gd-secondary rounded-lg px-3.5 py-2.5 text-gd-on-surface placeholder:text-gd-outline transition-colors"
                />
              </div>

              {/* Country / Nationality */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-gd-on-surface-var tracking-wider mb-1.5">
                  Country (Nationality)
                </label>
                <input
                  type="text"
                  value={form.nationality}
                  onChange={e => updateField('nationality', e.target.value)}
                  placeholder="e.g. Indian"
                  className="w-full text-sm border border-gd-outline-var bg-gd-surface-low focus:bg-gd-surface focus:outline-none focus:ring-2 focus:ring-gd-secondary/40 focus:border-gd-secondary rounded-lg px-3.5 py-2.5 text-gd-on-surface placeholder:text-gd-outline transition-colors"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-gd-on-surface-var tracking-wider mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => updateField('city', e.target.value)}
                  placeholder="e.g. Rishikesh"
                  className="w-full text-sm border border-gd-outline-var bg-gd-surface-low focus:bg-gd-surface focus:outline-none focus:ring-2 focus:ring-gd-secondary/40 focus:border-gd-secondary rounded-lg px-3.5 py-2.5 text-gd-on-surface placeholder:text-gd-outline transition-colors"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-gd-on-surface-var tracking-wider mb-1.5">
                  Age
                </label>
                <input
                  type="number"
                  value={form.age}
                  onChange={e => updateField('age', e.target.value)}
                  placeholder="25"
                  min="1"
                  max="120"
                  className="w-full text-sm border border-gd-outline-var bg-gd-surface-low focus:bg-gd-surface focus:outline-none focus:ring-2 focus:ring-gd-secondary/40 focus:border-gd-secondary rounded-lg px-3.5 py-2.5 text-gd-on-surface placeholder:text-gd-outline transition-colors"
                />
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-gd-on-surface-var tracking-wider mb-1.5">
                  Blood Group
                </label>
                <select
                  value={form.bloodType}
                  onChange={e => updateField('bloodType', e.target.value)}
                  className="w-full text-sm border border-gd-outline-var bg-gd-surface-low focus:bg-gd-surface focus:outline-none focus:ring-2 focus:ring-gd-secondary/40 focus:border-gd-secondary rounded-lg px-3.5 py-2.5 text-gd-on-surface cursor-pointer transition-colors"
                >
                  {BLOOD_GROUPS.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              {/* Latitude */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-gd-on-surface-var tracking-wider mb-1.5">
                  Initial Latitude
                </label>
                <input
                  type="text"
                  value={form.lat}
                  onChange={e => updateField('lat', e.target.value)}
                  placeholder="30.1250"
                  className="w-full text-sm border border-gd-outline-var bg-gd-surface-low focus:bg-gd-surface focus:outline-none focus:ring-2 focus:ring-gd-secondary/40 focus:border-gd-secondary rounded-lg px-3.5 py-2.5 text-gd-on-surface placeholder:text-gd-outline transition-colors"
                />
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-gd-on-surface-var tracking-wider mb-1.5">
                  Initial Longitude
                </label>
                <input
                  type="text"
                  value={form.lng}
                  onChange={e => updateField('lng', e.target.value)}
                  placeholder="78.3180"
                  className="w-full text-sm border border-gd-outline-var bg-gd-surface-low focus:bg-gd-surface focus:outline-none focus:ring-2 focus:ring-gd-secondary/40 focus:border-gd-secondary rounded-lg px-3.5 py-2.5 text-gd-on-surface placeholder:text-gd-outline transition-colors"
                />
              </div>

            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-gd-outline-var">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 text-sm font-semibold text-gd-on-surface-var hover:text-gd-on-surface transition-colors rounded-lg hover:bg-gd-surface-low"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !form.name.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gd-secondary text-gd-on-secondary rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register User'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
