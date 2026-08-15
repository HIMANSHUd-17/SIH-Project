import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TouristProfile } from '../types';

interface TouristLoginProps {
  onLoginTourist?: (touristId: string, mobileNumber?: string) => Promise<TouristProfile | null> | TouristProfile | null;
}

export const TouristLogin: React.FC<TouristLoginProps> = ({ onLoginTourist }) => {
  const [touristId, setTouristId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
                value={touristId}
                onChange={(e) => setTouristId(e.target.value)}
                placeholder="e.g. T-1001-643B"
                className="w-full bg-st-surface-container border border-st-outline-variant/50 rounded-xl pl-11 pr-4 py-2.5 text-st-on-surface font-mono font-bold focus:outline-none focus:ring-2 focus:ring-st-primary focus:border-st-primary transition-all text-sm uppercase"
                required
              />
            </div>
            <p className="text-[10px] text-st-on-surface-variant mt-1">Unique ID issued during tour registration</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-st-on-surface-variant mb-1.5">
              Registered Mobile Number / Email <span className="text-st-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-st-outline text-lg">
                phone_iphone
              </span>
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="e.g. 7721087445 or +91 9876543210"
                className="w-full bg-st-surface-container border border-st-outline-variant/50 rounded-xl pl-11 pr-4 py-2.5 text-st-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-st-primary focus:border-st-primary transition-all text-sm"
                required
              />
            </div>
            <p className="text-[10px] text-st-on-surface-variant mt-1">Verification credential matched with your profile</p>
          </div>

          <button
            type="submit"
            disabled={loading || !touristId.trim() || !mobileNumber.trim()}
            className="w-full bg-st-primary text-white py-3 rounded-xl font-bold hover:bg-st-primary-fixed transition-colors mt-3 shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Verifying Credentials...</span>
            ) : (
              <>
                <span>Secure Sign In</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-st-outline-variant/40 text-center">
          <button onClick={() => navigate('/')} className="text-xs font-semibold text-st-on-surface-variant hover:text-st-primary transition-colors cursor-pointer">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
