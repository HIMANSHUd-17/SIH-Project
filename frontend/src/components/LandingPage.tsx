import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroImage from '../assets/hero_rishikesh_1786717495879.jpg';
import travelerImage from '../assets/traveler_portal.jpg';
import { SafeYatraChatbot } from './chatbot/SafeYatraChatbot';
import { TouristRegistrationModal } from './tourist/TouristRegistrationModal';

interface LandingPageProps {
  onSelectRole?: (role: 'tourist' | 'admin' | 'guide') => void;
}

const stats = [
  { value: '15,000+', label: 'Tourists Protected', icon: 'admin_panel_settings' },
  { value: '< 45s', label: 'Avg Response Time', icon: 'timer' },
  { value: '99.9%', label: 'Uptime Reliability', icon: 'verified' },
  { value: '24/7', label: 'Active Monitoring', icon: 'visibility' },
];

const capabilities = [
  {
    icon: 'my_location',
    title: 'Dynamic Geofencing',
    description: 'AI-adjustable safety perimeters that respond to weather, crowd density, and government alerts.',
    isEmergency: false,
  },
  {
    icon: 'smart_toy',
    title: 'AI Risk Engine',
    description: 'Gemini-powered risk assessment with real-time scoring across 6 threat dimensions.',
    isEmergency: false,
  },
  {
    icon: 'deployed_code',
    title: 'Blockchain Identity',
    description: 'Zero-knowledge verified digital passes on Polygon — privacy-first, tamper-proof.',
    isEmergency: false,
  },
  {
    icon: 'emergency',
    title: 'Emergency SOS',
    description: '5-second dispatch to police, fire, and ambulance with automatic GPS + ID sharing.',
    isEmergency: true,
  },
  {
    icon: 'chat',
    title: 'Multilingual AI Chat',
    description: 'Safety assistant supporting 9+ languages including Hindi, Tamil, Bengali, and Japanese.',
    isEmergency: false,
  },
  {
    icon: 'cell_tower',
    title: 'Mesh Network Fallback',
    description: 'Offline SMS payload generation when cellular connectivity fails in remote areas.',
    isEmergency: false,
  },
  {
    icon: 'route',
    title: 'Safe Route Planner',
    description: 'A*-based path finding weighted by road condition, patrol coverage, and network signal.',
    isEmergency: false,
  },
  {
    icon: 'monitoring',
    title: 'Real-Time Telemetry',
    description: 'SSE live streams for tourist locations, incidents, and geofence state — sub-second latency.',
    isEmergency: false,
  },
];

export const LandingPage: React.FC<LandingPageProps> = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerMode, setRegisterMode] = useState<'SOLO' | 'TEAM'>('TEAM');
  const [userLocation, setUserLocation] = useState<{
    lat: number | null;
    lng: number | null;
    address?: string;
    status: 'prompt' | 'granted' | 'denied' | 'unavailable';
  }>({
    lat: null,
    lng: null,
    status: 'prompt',
  });
  const navigate = useNavigate();

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setUserLocation(prev => ({ ...prev, status: 'unavailable' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let address = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
        let detectedCity = '';

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`, {
            headers: { 'Accept-Language': 'en' },
            signal: AbortSignal.timeout(6000)
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              const parts = data.display_name.split(',');
              address = parts.slice(0, 3).join(', ').trim();
              detectedCity = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || data.address?.state_district || parts[0]?.trim() || '';
            }
          }
        } catch {
          // No fallback to Rishikesh
        }

        const latStr = lat.toFixed(4);
        const lngStr = lng.toFixed(4);

        sessionStorage.setItem('browser_lat', latStr);
        sessionStorage.setItem('browser_lng', lngStr);
        sessionStorage.setItem('browser_address', address);
        localStorage.setItem('browser_lat', latStr);
        localStorage.setItem('browser_lng', lngStr);

        if (detectedCity && detectedCity.toLowerCase() !== 'rishikesh') {
          sessionStorage.setItem('browser_city', detectedCity);
          localStorage.setItem('browser_city', detectedCity);
        }

        setUserLocation({
          lat,
          lng,
          address,
          status: 'granted'
        });
      },
      (err) => {
        console.warn('Geolocation permission not granted:', err.message);
        setUserLocation(prev => ({ ...prev, status: 'denied' }));
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  useEffect(() => {
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

    requestLocation();

    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#121c2a] font-['Hanken_Grotesk',Inter,sans-serif] selection:bg-[#003d9b] selection:text-white antialiased overflow-x-hidden">

      {/* ═══════ Header (TopAppBar) ═══════ */}
      <header
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md py-3.5 border-b border-[#dfe9fc]'
            : 'bg-white/80 backdrop-blur-sm shadow-sm py-4 border-b border-[#e6eeff]'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 md:px-12 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-[#001a4d] flex items-center justify-center text-white shadow-sm ring-2 ring-[#003d9b]/20">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                security
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#001a4d] tracking-tight">SafeYatra</span>
              <span className="text-xs font-semibold text-[#003d9b] hidden md:inline-block bg-[#e6eeff] px-2.5 py-0.5 rounded-full">
                Tourist Safety Platform
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('hero')}
              className="text-sm font-bold text-[#001a4d] hover:text-[#003d9b] transition-colors pb-0.5 border-b-2 border-[#003d9b]"
            >
              Platform
            </button>
            <button
              onClick={() => scrollToSection('capabilities')}
              className="text-sm font-medium text-[#44464f] hover:text-[#001a4d] transition-colors pb-0.5 border-b-2 border-transparent hover:border-[#003d9b]/30"
            >
              Security
            </button>
            <button
              onClick={() => scrollToSection('stats')}
              className="text-sm font-medium text-[#44464f] hover:text-[#001a4d] transition-colors pb-0.5 border-b-2 border-transparent hover:border-[#003d9b]/30"
            >
              Stats
            </button>
            <button
              onClick={() => scrollToSection('portal')}
              className="text-sm font-medium text-[#44464f] hover:text-[#001a4d] transition-colors pb-0.5 border-b-2 border-transparent hover:border-[#003d9b]/30"
            >
              Portal
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e6eeff] border border-[#dfe9fc] shadow-xs">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
              <span className="text-xs font-bold text-[#001852]">System Online</span>
            </div>
            <div className="hidden sm:block text-xs font-bold text-[#003d9b] px-3 py-1.5 rounded-full bg-[#d9e3f7]">
              v4.2.0
            </div>
            <button
              onClick={() => navigate('/tourist/login')}
              className="bg-[#003d9b] text-white hover:bg-[#002d72] text-xs md:text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Tourist Login</span>
              <span className="material-symbols-outlined text-sm">login</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-[#001a4d] p-1.5 rounded-lg hover:bg-[#eff3ff]"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#dfe9fc] px-6 py-4 space-y-3 shadow-lg">
            <button
              onClick={() => scrollToSection('hero')}
              className="block w-full text-left font-bold text-sm text-[#001a4d] py-1"
            >
              Platform
            </button>
            <button
              onClick={() => scrollToSection('capabilities')}
              className="block w-full text-left font-medium text-sm text-[#44464f] py-1"
            >
              Security
            </button>
            <button
              onClick={() => scrollToSection('stats')}
              className="block w-full text-left font-medium text-sm text-[#44464f] py-1"
            >
              Stats
            </button>
            <button
              onClick={() => scrollToSection('portal')}
              className="block w-full text-left font-medium text-sm text-[#44464f] py-1"
            >
              Tourist Portal
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/tourist/login');
              }}
              className="w-full bg-[#003d9b] text-white font-bold text-sm py-2.5 rounded-lg shadow flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>Enter Tourist Portal</span>
            </button>
          </div>
        )}
      </header>

      <main className="pt-[72px]">
        {/* ═══════ Hero Section ═══════ */}
        <section id="hero" className="relative w-full min-h-[780px] md:min-h-[850px] flex items-center justify-center overflow-hidden">
          {/* Background Image using project's local image */}
          <div className="absolute inset-0 z-0">
            <img
              src={heroImage}
              alt="SafeYatra landscape view"
              className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
            />
            {/* Rich gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#121c2a]/85 via-[#121c2a]/60 to-[#f8f9ff] z-10"></div>
            <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#001a4d]/20 to-[#121c2a]/70 z-10 pointer-events-none"></div>
          </div>

          <div className="relative z-20 w-full max-w-[1280px] mx-auto px-5 sm:px-8 md:px-12 py-20 text-white">
            {/* Feature Tag Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md mb-8 border border-white/30 text-white shadow-lg">
              <span className="material-symbols-outlined text-base text-[#b2c5ff]">verified_user</span>
              <span className="text-xs md:text-sm font-semibold tracking-wide">
                Powered by AI • Blockchain Verified • Real-Time Geofencing
              </span>
            </div>

            <div className="max-w-3xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-md tracking-tight">
                SafeYatra <br />
                <span className="text-[#b2c5ff]">Tourist Safety</span> <br />
                Platform
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-10 max-w-2xl drop-shadow leading-relaxed font-medium">
                Real-time monitoring, AI-powered risk assessment, and instant emergency response for every traveler exploring India's most beautiful destinations.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3.5 mb-10">
                <button
                  onClick={() => {
                    setRegisterMode('TEAM');
                    setIsRegisterModalOpen(true);
                  }}
                  className="bg-[#003d9b] hover:bg-[#0052cc] text-white font-bold text-base py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">group_add</span>
                  <span>Register Team</span>
                </button>
                <button
                  onClick={() => {
                    setRegisterMode('SOLO');
                    setIsRegisterModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">person_add</span>
                  <span>Register Solo</span>
                </button>
                <button
                  onClick={() => navigate('/tourist/login')}
                  className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 font-bold text-base py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined">login</span>
                  <span>Tourist Login</span>
                </button>
                <button
                  onClick={() => scrollToSection('capabilities')}
                  className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 font-bold text-base py-4 px-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined">explore</span>
                  <span>Explore</span>
                </button>
              </div>

              {/* Glassmorphic Stats bar inside hero */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-2xl">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 shadow-md">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-[#b2c5ff] text-xl">{stat.icon}</span>
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">{stat.value}</span>
                    </div>
                    <span className="text-[11px] sm:text-xs text-white/75 font-medium">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ Capabilities Section (Bento Grid) ═══════ */}
        <section id="capabilities" className="max-w-[1280px] mx-auto px-5 sm:px-8 md:px-12 py-20">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eff3ff] text-[#003d9b] text-xs font-bold uppercase tracking-wider mb-3">
              <span className="material-symbols-outlined text-sm">shield</span>
              Next-Gen Protection
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#121c2a] mb-4 tracking-tight">
              Platform Capabilities
            </h2>
            <p className="text-base sm:text-lg text-[#44464f] font-normal leading-relaxed">
              Built for India's most challenging tourist environments — from Himalayan treks to crowded heritage sites.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((cap, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,26,77,0.04)] hover:shadow-[0_12px_32px_rgba(0,26,77,0.1)] transition-all duration-300 flex flex-col h-full group relative overflow-hidden ${
                  cap.isEmergency
                    ? 'border-2 border-[#ffdad6] hover:border-[#DC2626]/30'
                    : 'border border-[#e6eeff] hover:border-[#b2c5ff]'
                }`}
              >
                {cap.isEmergency && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffdad6] rounded-bl-full -mr-4 -mt-4 opacity-50 z-0 pointer-events-none"></div>
                )}

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200 z-10 ${
                    cap.isEmergency
                      ? 'bg-[#ba1a1a] text-white shadow-md'
                      : 'bg-[#eff3ff] text-[#003d9b]'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {cap.icon}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#121c2a] mb-3 z-10">
                  {cap.title}
                </h3>
                <p className="text-sm text-[#44464f] leading-relaxed mt-auto z-10">
                  {cap.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ Tourist Portal Entry ═══════ */}
        <section id="portal" className="max-w-[1280px] mx-auto px-5 sm:px-8 md:px-12 py-16 mb-20">
          <div className="bg-[#eff3ff] rounded-3xl relative overflow-hidden flex flex-col lg:flex-row shadow-xl border border-[#dfe9fc]">
            {/* Left Column: Visual Display / Features Panel */}
            <div className="w-full lg:w-1/2 relative min-h-[420px] lg:min-h-[520px] overflow-hidden flex flex-col justify-end p-6 sm:p-8 bg-[#001a4d] text-white">
              {/* Traveler in Himalayas Image */}
              <img
                src={travelerImage}
                alt="Traveler using SafeYatra in the Himalayas"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001a4d]/95 via-[#001a4d]/40 to-transparent z-10"></div>

              {/* Interactive Floating Info Card */}
              <div className="relative z-20 w-full bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl p-5 shadow-2xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#003d9b] text-white flex items-center justify-center font-bold shadow-sm">
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        shield
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white leading-tight">SafeYatra Active Shield</div>
                      <div className="text-[11px] text-white/80">Real-Time Traveler Protection</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#10B981]/25 text-[#10B981] px-2.5 py-1 rounded-full border border-[#10B981]/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
                    Protected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/15">
                    <div className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">GPS Telemetry</div>
                    <div className="font-mono text-white font-bold text-xs mt-0.5 truncate">
                      {userLocation.lat ? `${userLocation.lat.toFixed(2)}°N, ${userLocation.lng?.toFixed(2)}°E` : 'Active / Calibrated'}
                    </div>
                  </div>

                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/15">
                    <div className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">Identity Pass</div>
                    <div className="font-mono text-[#b2c5ff] font-bold text-xs mt-0.5">
                      Polygon ZK
                    </div>
                  </div>

                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/15">
                    <div className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">Emergency SOS</div>
                    <div className="text-emerald-300 font-bold text-xs mt-0.5">
                      &lt; 5s Ready
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Tourist Entry Card */}
            <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white">
              <div className="mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6eeff] text-[#003d9b] text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="material-symbols-outlined text-sm">hiking</span>
                  Personal Safety Companion
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#121c2a] mb-3 tracking-tight">
                  Tourist Portal
                </h2>
                <p className="text-base text-[#44464f]">
                  Log in to your safety dashboard to start tracking your journey and unlock AI protection.
                </p>
              </div>

              <div className="bg-[#f8f9ff] rounded-2xl border border-[#dfe9fc] p-6 sm:p-8 shadow-md relative overflow-hidden w-full">
                <div className="w-14 h-14 rounded-2xl bg-[#001a4d] flex items-center justify-center text-white mb-6 shadow-sm">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    hiking
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-2xl font-extrabold text-[#121c2a]">Tourist</h3>
                  <span className="px-2.5 py-1 bg-[#e6eeff] rounded-md text-xs text-[#001852] font-bold">
                    Traveler Portal
                  </span>
                </div>

                <p className="text-sm text-[#44464f] mb-6 leading-relaxed">
                  Access your safety dashboard, live location tracking, emergency SOS, and chat with your assigned guide.
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="px-3 py-1 bg-[#dfe9fc] text-[#121c2a] rounded-full text-xs font-semibold">
                    Live GPS Tracking
                  </span>
                  <span className="px-3 py-1 bg-[#dfe9fc] text-[#121c2a] rounded-full text-xs font-semibold">
                    Emergency SOS
                  </span>
                  <span className="px-3 py-1 bg-[#dfe9fc] text-[#121c2a] rounded-full text-xs font-semibold">
                    Guide Chat
                  </span>
                  <span className="px-3 py-1 bg-[#dfe9fc] text-[#121c2a] rounded-full text-xs font-semibold">
                    AI Safety Voice
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate('/tourist/login')}
                    className="flex-1 bg-[#003d9b] text-white hover:bg-[#002d72] font-bold text-sm py-3.5 px-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-98 transition-all duration-200 flex items-center justify-center gap-1.5 group cursor-pointer"
                  >
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-lg">
                      login
                    </span>
                    <span>Tourist Login</span>
                  </button>
                  <button
                    onClick={() => {
                      setRegisterMode('TEAM');
                      setIsRegisterModalOpen(true);
                    }}
                    className="flex-1 bg-[#eff3ff] text-[#003d9b] hover:bg-[#dfe9fc] border border-[#003d9b]/30 font-bold text-sm py-3.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">group_add</span>
                    <span>Register Team</span>
                  </button>
                  <button
                    onClick={() => {
                      setRegisterMode('SOLO');
                      setIsRegisterModalOpen(true);
                    }}
                    className="flex-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-bold text-sm py-3.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg text-emerald-700">person_add</span>
                    <span>Register Solo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════ Footer ═══════ */}
      <footer className="w-full bg-[#d9e3f7] border-t border-[#c5c6d1] px-5 sm:px-8 md:px-12 py-14">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#001a4d] flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  security
                </span>
              </div>
              <span className="text-2xl font-extrabold text-[#121c2a] tracking-tight">SafeYatra</span>
              <span className="text-xs font-semibold text-[#003d9b] ml-2 border-l border-[#c5c6d1] pl-3">
                Smart Tourist Safety Platform
              </span>
            </div>
            <p className="text-sm text-[#44464f] max-w-sm mb-6 leading-relaxed">
              © 2024 SafeYatra. Enterprise-grade Security Architecture. Built for resilience in low-connectivity environments.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-bold text-[#44464f]">
              <div className="flex items-center gap-1.5 bg-white/70 px-3 py-1.5 rounded-lg border border-[#c5c6d1]/40">
                <span className="material-symbols-outlined text-base text-[#003d9b]">lock</span>
                <span>AES-256 Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/70 px-3 py-1.5 rounded-lg border border-[#c5c6d1]/40">
                <span className="material-symbols-outlined text-base text-[#003d9b]">deployed_code</span>
                <span>Polygon Testnet</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/70 px-3 py-1.5 rounded-lg border border-[#c5c6d1]/40">
                <span className="material-symbols-outlined text-base text-[#003d9b]">smart_toy</span>
                <span>Gemini 2.5</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-4">Legal & Privacy</h4>
            <ul className="space-y-3 text-sm font-medium text-[#44464f]">
              <li>
                <a href="#portal" className="hover:text-[#001a4d] hover:underline transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#portal" className="hover:text-[#001a4d] hover:underline transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#portal" className="hover:text-[#001a4d] hover:underline transition-colors">
                  Data Processing Agreement
                </a>
              </li>
              <li>
                <a href="/docs" className="hover:text-[#001a4d] hover:underline transition-colors">
                  Architecture Documentation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-4">System Status</h4>
            <ul className="space-y-3 text-sm font-medium text-[#44464f]">
              <li>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                  AES-256 Encryption Active
                </span>
              </li>
              <li>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                  Gemini AI Status Operational
                </span>
              </li>
              <li className="pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-[#c5c6d1]/50 shadow-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></div>
                  <span className="text-xs font-bold text-[#001852]">All Systems Operational</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      {/* ═══════ SafeYatra AI Floating Chatbot ═══════ */}
      <SafeYatraChatbot
        userLocation={userLocation}
        onRequestLocation={requestLocation}
      />

      {/* ═══════ Solo / Team Registration Modal ═══════ */}
      <TouristRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        initialMode={registerMode}
        onSuccess={() => {
          setIsRegisterModalOpen(false);
          navigate('/tourist/login');
        }}
      />
    </div>
  );
};

