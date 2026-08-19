import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        sessionStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminToken', data.token);
        navigate('/admin/dashboard');
      } else {
        setError(data.error || 'Invalid username or password');
      }
    } catch (err) {
      setError('Unable to reach authentication server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E4E7] flex items-center justify-center font-sans p-4">
      <div className="bg-[#18181B] p-8 rounded-2xl shadow-xl border border-[#27272A] w-full max-w-md">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-12 h-12 bg-[#F27D26] rounded-xl flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-white text-2xl">admin_panel_settings</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Admin Login</h2>
            <p className="text-xs text-[#A1A1AA]">Command Center Portal</p>
          </div>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg mb-4 text-xs font-semibold text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">Username / Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#F27D26]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#F27D26]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F27D26] hover:bg-[#E06C15] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer mt-2"
          >
            {isLoading ? 'Authenticating...' : 'Sign In as Administrator'}
          </button>
        </form>
        <div className="mt-4 pt-3 border-t border-[#27272A] text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-semibold text-[#A1A1AA] hover:text-[#F27D26] transition-colors cursor-pointer"
          >
            ← Back to Role Selection
          </button>
        </div>
      </div>
    </div>
  );
};
