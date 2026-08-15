import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroImage from '../assets/hero_rishikesh_1786717495879.jpg';

interface LandingPageProps {
  onSelectRole?: (role: 'tourist' | 'admin' | 'guide') => void;
}

const roles = [
  {
    id: 'tourist' as const,
    icon: 'hiking',
    title: 'Tourist',
    subtitle: 'Traveler Portal',
    description: 'Access your safety dashboard, live location tracking, emergency SOS, and chat with your assigned guide.',
    color: 'bg-st-primary',
    colorLight: 'bg-st-primary-fixed',
    colorText: 'text-st-primary',
    borderColor: 'border-st-primary/20',
    hoverBorder: 'hover:border-st-primary',
    btnBg: 'bg-st-primary hover:bg-st-primary-container',
    btnText: 'text-st-on-primary',
    features: ['Live GPS Tracking', 'Emergency SOS', 'Guide Chat'],
  }
];

const stats = [
  { value: '15,000+', label: 'Tourists Protected', icon: 'shield_person' },
  { value: '< 45s', label: 'Avg Response Time', icon: 'timer' },
  { value: '99.9%', label: 'Uptime Reliability', icon: 'verified' },
  { value: '24/7', label: 'Active Monitoring', icon: 'visibility' },
];

export const LandingPage: React.FC<LandingPageProps> = () => {
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Staggered fade-in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="sentinel-tourist min-h-screen bg-st-surface text-st-on-surface font-[Inter,sans-serif] overflow-x-hidden">

      {/* ═══════ Top Navigation ═══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-st-outline-variant/50">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-st-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">shield</span>
            </div>
            <div>
              <span className="text-lg font-bold text-st-primary tracking-tight">SafeYatra</span>
              <span className="hidden sm:inline text-xs font-medium text-st-on-surface-variant ml-2">Tourist Safety Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:flex items-center gap-1.5 text-xs font-medium text-st-secondary bg-[#E8F5E9] px-3 py-1.5 rounded-full border border-st-secondary/20">
              <span className="w-2 h-2 rounded-full bg-st-secondary animate-pulse"></span>
              System Online
            </span>
            <span className="text-xs font-medium text-st-on-surface-variant bg-st-surface-container px-3 py-1.5 rounded-full">
              v4.2.0
            </span>
          </div>
        </div>
      </nav>

      {/* ═══════ Hero Section ═══════ */}
      <section className="relative pt-16 overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 top-16">
          <img
            src={heroImage}
            alt="Rishikesh landscape"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#001848]/70 via-[#001848]/50 to-st-surface"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#001848]/40 to-transparent"></div>
        </div>

        <div className={`relative z-10 max-w-[1200px] mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-20 md:pb-32 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white/90 px-4 py-2 rounded-full text-xs font-semibold mb-6 border border-white/20">
            <span className="material-symbols-outlined text-base">security</span>
            Powered by AI · Blockchain Verified · Real-Time Geofencing
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 max-w-3xl">
            SafeYatra<br/>
            <span className="text-st-primary-fixed-dim">Tourist Safety</span><br/>
            Platform
          </h1>

          <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed mb-10">
            Real-time monitoring, AI-powered risk assessment, and instant emergency response
            for every traveler exploring India's most beautiful destinations.
          </p>

          {/* CTA */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/tourist/login')}
              className="bg-white text-st-primary px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-st-primary-fixed transition-all active:scale-95 shadow-lg shadow-black/20 cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">login</span>
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* ═══════ Stats Strip ═══════ */}
      <section className={`relative z-10 -mt-10 md:-mt-14 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <div className="bg-white rounded-2xl border border-st-outline-variant/50 shadow-xl shadow-black/5 p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-11 h-11 bg-st-primary-fixed rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-st-primary text-xl">{stat.icon}</span>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-st-on-surface leading-tight">{stat.value}</div>
                  <div className="text-xs font-medium text-st-on-surface-variant leading-4">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Role Selection Cards ═══════ */}
      <section id="roles" className={`py-16 md:py-24 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-st-on-surface mb-4">Tourist Portal</h2>
            <p className="text-base md:text-lg text-st-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Log in to your safety dashboard to start tracking your journey.
            </p>
          </div>

          <div className="grid grid-cols-1 max-w-md mx-auto gap-6 md:gap-8">
            {roles.map((role) => (
              <div
                key={role.id}
                onMouseEnter={() => setHoveredRole(role.id)}
                onMouseLeave={() => setHoveredRole(null)}
                onClick={() => navigate(`/${role.id}/login`)}
                className={`group relative bg-white rounded-2xl border-2 ${role.borderColor} ${role.hoverBorder} p-6 md:p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 active:scale-[0.98]`}
              >
                {/* Icon Circle */}
                <div className={`w-16 h-16 ${role.colorLight} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <span className={`material-symbols-outlined text-3xl ${role.colorText}`}>{role.icon}</span>
                </div>

                {/* Content */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-st-on-surface">{role.title}</h3>
                    <span className={`text-xs font-semibold ${role.colorText} ${role.colorLight} px-2.5 py-1 rounded-full`}>
                      {role.subtitle}
                    </span>
                  </div>
                  <p className="text-sm text-st-on-surface-variant leading-relaxed">{role.description}</p>
                </div>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {role.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs font-medium text-st-on-surface-variant bg-st-surface-container px-3 py-1.5 rounded-lg"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Login Button */}
                <button
                  className={`w-full ${role.btnBg} ${role.btnText} py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer`}
                >
                  <span className="material-symbols-outlined text-xl">login</span>
                  Enter as {role.title}
                </button>

                {/* Hover glow */}
                <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none ${hoveredRole === role.id ? 'opacity-100' : 'opacity-0'}`}>
                  <div className={`absolute -inset-px ${role.borderColor} rounded-2xl`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Features Grid ═══════ */}
      <section className="py-16 md:py-20 bg-white border-t border-b border-st-outline-variant/30">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-st-on-surface mb-4">Platform Capabilities</h2>
            <p className="text-base text-st-on-surface-variant max-w-2xl mx-auto">
              Built for India's most challenging tourist environments — from Himalayan treks to crowded heritage sites.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: 'my_location', title: 'Dynamic Geofencing', desc: 'AI-adjustable safety perimeters that respond to weather, crowd density, and government alerts.' },
              { icon: 'smart_toy', title: 'AI Risk Engine', desc: 'Gemini-powered risk assessment with real-time scoring across 6 threat dimensions.' },
              { icon: 'token', title: 'Blockchain Identity', desc: 'Zero-knowledge verified digital passes on Polygon — privacy-first, tamper-proof.' },
              { icon: 'crisis_alert', title: 'Emergency SOS', desc: '5-second dispatch to police, fire, and ambulance with automatic GPS + ID sharing.' },
              { icon: 'chat', title: 'Multilingual AI Chat', desc: 'Safety assistant supporting 9+ languages including Hindi, Tamil, Bengali, and Japanese.' },
              { icon: 'cell_tower', title: 'Mesh Network Fallback', desc: 'Offline SMS payload generation when cellular connectivity fails in remote areas.' },
              { icon: 'route', title: 'Safe Route Planner', desc: 'A*-based path finding weighted by road condition, patrol coverage, and network signal.' },
              { icon: 'monitoring', title: 'Real-Time Telemetry', desc: 'SSE live streams for tourist locations, incidents, and geofence state — sub-second latency.' },
            ].map((feature, idx) => (
              <div key={idx} className="bg-st-surface-container-low rounded-xl p-5 border border-st-outline-variant/30 hover:border-st-primary/20 hover:shadow-md transition-all group">
                <div className="w-11 h-11 bg-st-primary-fixed rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-st-primary text-xl">{feature.icon}</span>
                </div>
                <h3 className="text-sm font-bold text-st-on-surface mb-2">{feature.title}</h3>
                <p className="text-xs text-st-on-surface-variant leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Footer ═══════ */}
      <footer className="py-8 bg-st-surface">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-st-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">shield</span>
            </div>
            <div>
              <span className="text-sm font-bold text-st-primary">SafeYatra</span>
              <span className="text-xs text-st-on-surface-variant ml-2">Smart Tourist Safety Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-st-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">lock</span>
              AES-256 Encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">token</span>
              Polygon Testnet
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">smart_toy</span>
              Gemini 2.5
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
