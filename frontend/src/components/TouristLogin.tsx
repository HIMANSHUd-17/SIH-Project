import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TouristProfile } from '../types';
import { TouristRegistrationModal } from './tourist/TouristRegistrationModal';

interface TouristLoginProps {
  onLoginTourist?: (touristId: string, mobileNumber?: string) => Promise<TouristProfile | null> | TouristProfile | null;
  onRegisterTourist?: (data: any) => Promise<TouristProfile | null>;
}

export const TouristLogin: React.FC<TouristLoginProps> = ({ onLoginTourist, onRegisterTourist }) => {
  const [touristId, setTouristId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!touristId.trim() || !mobileNumber.trim()) {
      setError('Please enter both your Tourist ID and registered Mobile Number.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (onLoginTourist) {
        const result = await onLoginTourist(touristId.trim(), mobileNumber.trim());
        if (result) {
          sessionStorage.setItem('activeTouristId', touristId.trim());
          localStorage.setItem('activeTouristId', touristId.trim());
          navigate('/tourist/dashboard');
          return;
        }
      }

      // Fallback verification
      const res = await fetch('/api/tourists');
      if (res.ok) {
        const list: TouristProfile[] = await res.json();
        const cleanId = touristId.trim().toLowerCase();
        const cleanInputMobile = mobileNumber.replace(/\D/g, '');

        const match = list.find(t => {
          if (t.id.toLowerCase() !== cleanId) return false;
          const cleanMobile = (t.mobile || '').replace(/\D/g, '');
          const cleanEmerg = (t.emergencyContact || '').replace(/\D/g, '');
          return (
            (cleanMobile && (cleanMobile.endsWith(cleanInputMobile) || cleanInputMobile.endsWith(cleanMobile))) ||
            (cleanEmerg && (cleanEmerg.endsWith(cleanInputMobile) || cleanInputMobile.endsWith(cleanEmerg))) ||
            (t.email && t.email.toLowerCase() === mobileNumber.trim().toLowerCase())
          );
        });

        if (match) {
          sessionStorage.setItem('activeTouristId', match.id);
          localStorage.setItem('activeTouristId', match.id);
          if (onLoginTourist) await onLoginTourist(match.id, mobileNumber.trim());
          navigate('/tourist/dashboard');
          return;
        }
      }

      setError('Authentication failed: Invalid Tourist ID or Mobile Number. Please check your credentials provided by your Tour Guide.');
    } catch (err) {
      console.error(err);
      setError('An error occurred during authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSuccess = (newId: string, newMobile: string) => {
    setTouristId(newId);
    setMobileNumber(newMobile);
    setError(null);
    setIsRegisterOpen(false);
  };

  return (
    <div className="min-h-screen bg-st-surface text-st-on-surface flex items-center justify-center font-[Inter,sans-serif] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-st-outline-variant/30 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-12 h-12 bg-st-primary rounded-xl flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-white text-2xl">lock</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-st-on-surface">Tourist Login</h2>
            <p className="text-xs text-st-on-surface-variant">Secure Traveler Verification</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-st-error-container text-st-on-error-container rounded-xl text-xs font-medium border border-st-error/30 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-sm mt-0.5 shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1.5">
              Tourist ID <span className="text-st-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-st-outline text-lg">
                badge
              </span>
              <input
                type="text"
                placeholder="e.g. T-1001-492M"
                value={touristId}
                onChange={(e) => setTouristId(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-2.5 bg-st-surface border border-st-outline-variant rounded-xl text-sm font-semibold text-st-on-surface focus:outline-none focus:border-st-primary focus:ring-1 focus:ring-st-primary"
                required
              />
            </div>
            <p className="text-[11px] text-st-outline mt-1">Provided by your Guide upon group registration.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1.5">
              Registered Mobile Number <span className="text-st-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-st-outline text-lg">
                call
              </span>
              <input
                type="tel"
                placeholder="e.g. +91 99887 76655"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-st-surface border border-st-outline-variant rounded-xl text-sm font-semibold text-st-on-surface focus:outline-none focus:border-st-primary focus:ring-1 focus:ring-st-primary"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-st-primary hover:bg-st-primary/90 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
                Verifying Credentials...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">login</span>
                Access Tourist Dashboard
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-st-outline-variant/30 text-center">
          <p className="text-xs text-st-on-surface-variant mb-2">New traveler or visiting as a group?</p>
          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="w-full py-2.5 bg-st-surface-container hover:bg-st-surface-container-high text-st-primary font-bold text-xs rounded-xl border border-st-outline-variant/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Register Solo / Team Profile
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-st-outline-variant/20 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-semibold text-st-outline hover:text-st-primary transition-colors cursor-pointer"
          >
            ← Back to Role Selection
          </button>
        </div>
      </div>

      {/* Solo / Team Registration Modal */}
      <TouristRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
};
