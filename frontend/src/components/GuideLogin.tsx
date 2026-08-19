import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const GuideLogin: React.FC = () => {
  const [guideId, setGuideId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/guides/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideId: guideId.trim().toUpperCase(), password })
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        sessionStorage.setItem('guide_token', data.access_token);
        localStorage.setItem('guide_token', data.access_token);
        navigate('/guide/dashboard');
      } else {
        setError(data.detail || data.error || 'Invalid Guide ID or Password');
      }
    } catch (err) {
      setError('Unable to reach authentication server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gd-bg text-gd-on-bg flex items-center justify-center font-guide p-4">
      <div className="bg-gd-surface p-8 rounded-2xl shadow-xl border border-gd-outline-var w-full max-w-md">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-12 h-12 bg-gd-primary rounded-xl flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-white text-2xl">badge</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gd-primary">Guide Login</h2>
            <p className="text-xs text-gd-on-surface-var">Tour Guide Safety Portal</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-600 px-4 py-2 rounded-lg mb-4 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gd-on-surface-var mb-1">Guide ID</label>
            <input
              type="text"
              placeholder="e.g. G-1001"
              value={guideId}
              onChange={(e) => setGuideId(e.target.value)}
              className="w-full bg-gd-surface-low border border-gd-outline-var rounded-lg px-4 py-2.5 text-sm font-semibold text-gd-on-bg focus:outline-none focus:border-gd-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gd-on-surface-var mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gd-surface-low border border-gd-outline-var rounded-lg px-4 py-2.5 text-sm font-semibold text-gd-on-bg focus:outline-none focus:border-gd-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gd-primary hover:bg-gd-primary-hover text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer mt-2"
          >
            {isLoading ? 'Authenticating...' : 'Sign In as Guide'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-gd-outline-var text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-semibold text-gd-on-surface-var hover:text-gd-primary transition-colors cursor-pointer"
          >
            ← Back to Role Selection
          </button>
        </div>
      </div>
    </div>
  );
};
