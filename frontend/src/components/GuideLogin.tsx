import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const GuideLogin: React.FC = () => {
  const [guideId, setGuideId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/v1/guides/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideId,
          password
        })
      });

      if (!response.ok) {
        setError('Invalid Guide ID or Password. Please check with your Admin.');
        return;
      }

      const data = await response.json();
      localStorage.setItem('guide_token', data.access_token);
      navigate('/guide/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Is the backend running?');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E4E7] flex items-center justify-center font-sans">
      <div className="bg-[#18181B] p-8 rounded-2xl shadow-xl border border-[#27272A] w-full max-w-md">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-12 h-12 bg-st-secondary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl">map</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Guide Login</h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="text-red-500 text-sm font-semibold bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-[#A1A1AA] mb-1">Guide ID (e.g. G-1001)</label>
            <input
              type="text"
              value={guideId}
              onChange={(e) => setGuideId(e.target.value.toUpperCase())}
              className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-st-secondary font-mono"
              placeholder="G-1001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#A1A1AA] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-st-secondary"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-st-secondary text-white py-3 rounded-lg font-bold hover:bg-[#005321] transition-colors mt-4"
          >
            Login
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => navigate('/')} className="text-sm text-[#A1A1AA] hover:text-white transition-colors">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
