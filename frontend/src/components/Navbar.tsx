import React from 'react';
import { Shield, ShieldAlert, Smartphone, LayoutDashboard, Bell, Radio, CheckCircle, Flame, Map } from 'lucide-react';

interface NavbarProps {
  activeTab: 'tourist' | 'admin' | 'guide';
  setActiveTab: (tab: 'tourist' | 'admin' | 'guide') => void;
  isLiveConnected: boolean;
  activeIncidentsCount: number;
  onQuickSOS: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isLiveConnected,
  activeIncidentsCount,
  onQuickSOS
}) => {
  return (
    <header className="bg-[#09090B] border-b border-[#27272A] text-[#E4E4E7] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Platform Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('tourist')}>
            <div className="w-8 h-8 bg-[#F27D26] rounded-sm flex items-center justify-center font-bold text-black text-xl shadow-md">
              S
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm tracking-widest uppercase text-white">SafeYatra</span>
                <span className="text-[10px] text-[#71717A] font-mono bg-[#18181B] px-2 py-0.5 rounded border border-[#27272A]">
                  v4.2.0-SAFETY_CORE
                </span>
              </div>
              <p className="text-[11px] text-[#71717A] hidden md:block">Smart Tourist Safety Monitoring & Incident Response System</p>
            </div>
          </div>

          {/* Navigation View Switcher */}
          <nav className="flex items-center bg-[#0A0A0B] p-1 rounded-xl border border-[#27272A]">
            <button
              onClick={() => setActiveTab('tourist')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'tourist'
                  ? 'bg-[#F27D26] text-black font-bold shadow-md'
                  : 'text-[#71717A] hover:text-white hover:bg-[#18181B]'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Tourist App</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${
                activeTab === 'admin'
                  ? 'bg-[#F27D26] text-black font-bold shadow-md'
                  : 'text-[#71717A] hover:text-white hover:bg-[#18181B]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Authority Command</span>
              {activeIncidentsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse border border-[#09090B]">
                  {activeIncidentsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'guide'
                  ? 'bg-[#F27D26] text-black font-bold shadow-md'
                  : 'text-[#71717A] hover:text-white hover:bg-[#18181B]'
              }`}
            >
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">Guide Dashboard</span>
              <span className="sm:hidden">Guide</span>
            </button>


          </nav>

          {/* Status & Quick Emergency Actions */}
          <div className="flex items-center space-x-3">
            {/* Live Telemetry Status */}
            <div className="hidden lg:flex items-center space-x-2 bg-[#18181B] px-3 py-1.5 rounded-lg border border-[#27272A] text-[11px] font-mono">
              <div className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-[#10B981] animate-pulse' : 'bg-[#71717A]'}`}></div>
              <span className="text-[#E4E4E7] tracking-tighter uppercase">{isLiveConnected ? 'Blockchain: Syncing (0.4s)' : 'CONNECTING...'}</span>
            </div>

            {/* Quick SOS Action Button */}
            <button
              onClick={onQuickSOS}
              className="flex items-center space-x-1.5 bg-[#EF4444] hover:bg-red-600 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-md border border-red-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-white animate-bounce" />
              <span>EMERGENCY SOS</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
