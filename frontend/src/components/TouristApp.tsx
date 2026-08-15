import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ShieldCheck,
  AlertTriangle,
  Flame,
  Navigation,
  MapPin,
  Volume2,
  VolumeX,
  Send,
  Camera,
  CheckCircle2,
  Lock,
  Compass,
  Mic,
  Activity,
  CloudRain,
  Users,
  Clock,
  Phone,
  FileCheck,
  Radio,
  ExternalLink
} from 'lucide-react';
import { DynamicGeofence, IncidentReport, RouteOption, TouristProfile } from '../types';
import { isSirenActive, startSirenSound, stopSirenSound } from '../utils/audioAlarm';

interface TouristAppProps {
  tourist: TouristProfile;
  setTourist: React.Dispatch<React.SetStateAction<TouristProfile>>;
  otherTourists: TouristProfile[];
  onLoginTourist: (touristId: string) => TouristProfile | null;
  geofences: DynamicGeofence[];
  routes: RouteOption[];
  onTriggerSOS: (details?: { description?: string; mediaUrl?: string }) => void;
}

export const TouristApp: React.FC<TouristAppProps> = ({
  tourist,
  setTourist,
  otherTourists,
  onLoginTourist,
  geofences,
  routes,
  onTriggerSOS,
  chatLogs,
  setChatLogs,
  onSendAdminMessage,
  incidents
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [sirenOn, setSirenOn] = useState<boolean>(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption>(routes[1] || routes[0]);
  const [activeSubTab, setActiveSubTab] = useState<'map' | 'routes' | 'blockchain' | 'sos' | 'assistant'>('map');

  // Login & Profile Modal States
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [loginIdInput, setLoginIdInput] = useState('');
  const [loginOtpInput, setLoginOtpInput] = useState('0000');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Force login if no tourist is set
  useEffect(() => {
    if (!tourist || !tourist.id) {
      setShowLoginModal(true);
    }
  }, [tourist]);
  const [operatorMessage, setOperatorMessage] = useState('');

  // AI Assistant state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  // Reset chatbot greetings on user profile switch
  useEffect(() => {
    setChatMessages([
      {
        sender: 'assistant',
        text: `Namaste ${tourist.name}! I am your SafeYatra AI Safety Companion. Your safety score is currently optimal (${tourist.currentRiskScore}/100). How can I assist your trip today?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [tourist.id]);

  // SOS Fallback Timer
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [incidentNote, setIncidentNote] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  // Blockchain Verification State
  const [blockchainVerification, setBlockchainVerification] = useState<{
    loading: boolean;
    data: any;
    error: string | null;
  }>({ loading: false, data: null, error: null });

  // Simulation controls
  const [simulatedCrowd, setSimulatedCrowd] = useState<number>(35);
  const [simulatedWeather, setSimulatedWeather] = useState<number>(20);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [tourist.currentLocation.lat, tourist.currentLocation.lng],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | SafeYatra Safety Engine'
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = markersGroupRef.current;

    if (layerGroup) {
      layerGroup.clearLayers();

      // Render Dynamic Geofences
      geofences.forEach(fence => {
        let color = '#3b82f6';
        if (fence.riskFactor >= 85) color = '#ef4444';
        else if (fence.riskFactor >= 60) color = '#f59e0b';

        const circle = L.circle([fence.center.lat, fence.center.lng], {
          color,
          fillColor: color,
          fillOpacity: 0.25,
          radius: fence.currentRadiusMeters,
          weight: 2,
          dashArray: fence.governmentAlertActive ? '6, 6' : undefined
        });

        circle.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <strong style="color: ${color}; font-size: 14px;">${fence.name}</strong><br/>
            <span style="font-size: 12px; color: #475569;">Risk Factor: <b>${fence.riskFactor}/100</b></span><br/>
            <span style="font-size: 11px; color: #64748b;">Dynamic Radius: ${fence.currentRadiusMeters}m</span><br/>
            <p style="font-size: 11px; margin-top: 4px; color: #334155;">${fence.description}</p>
          </div>
        `);
        circle.addTo(layerGroup);
      });

      // Render Selected Route Waypoints & Polyline
      if (selectedRoute && selectedRoute.waypoints.length > 0) {
        const routeLatLngs = selectedRoute.waypoints.map(w => [w.lat, w.lng] as [number, number]);
        const polyline = L.polyline(routeLatLngs, {
          color: selectedRoute.isRecommended ? '#10b981' : '#f43f5e',
          weight: 4,
          opacity: 0.85
        });
        polyline.addTo(layerGroup);
      }

      // Render Tourist Marker
      const touristIcon = L.divIcon({
        className: 'tourist-marker-icon',
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background-color: ${tourist.currentRiskScore > 75 ? '#ef4444' : tourist.currentRiskScore > 40 ? '#f59e0b' : '#10b981'};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 12px ${tourist.currentRiskScore > 75 ? '#ef4444' : '#10b981'};
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const touristMarker = L.marker([tourist.currentLocation.lat, tourist.currentLocation.lng], { icon: touristIcon });
      touristMarker.bindPopup(`
        <div style="font-family: sans-serif;">
          <strong>${tourist.name} (You)</strong><br/>
          <span>Status: <b>${tourist.safetyStatus}</b></span><br/>
          <span>Risk Index: <b>${tourist.currentRiskScore}/100</b></span>
        </div>
      `);
      touristMarker.addTo(layerGroup);
    }
  }, [tourist, geofences, selectedRoute]);

  // Recalculate Risk Score
  const updateRisk = async (lat: number, lng: number, crowd: number, weather: number) => {
    try {
      const res = await fetch('/api/risk-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touristLocation: { lat, lng },
          crowdDensity: crowd,
          weatherSeverity: weather,
          timeOfDayHour: new Date().getHours(),
          historicalIncidentDensity: 40,
          activeGovAlert: weather > 50
        })
      });
      const data = await res.json();
      setTourist(prev => ({
        ...prev,
        currentLocation: { lat, lng, address: prev.currentLocation.address },
        currentRiskScore: data.riskScore,
        safetyStatus: data.status
      }));

      // Check geofence breach
      const fenceRes = await fetch('/api/geofence/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, touristId: tourist.id })
      });
      const fenceData = await fenceRes.json();

      if (fenceData.inHazardZone) {
        if (!sirenOn) {
          setSirenOn(true);
          startSirenSound();
        }
      }
    } catch (err) {
      console.error('Risk update error:', err);
    }
  };

  const handleSimulateMoveToWaterfall = () => {
    // Move tourist right into Neer Garh Waterfall Gorge
    const targetLat = 30.1345;
    const targetLng = 78.3241;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([targetLat, targetLng], 15);
    }
    setSimulatedWeather(85);
    setSimulatedCrowd(80);
    updateRisk(targetLat, targetLng, 80, 85);
  };

  const handleSimulateSafeBypass = () => {
    const targetLat = 30.1250;
    const targetLng = 78.3180;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([targetLat, targetLng], 14);
    }
    setSimulatedWeather(15);
    setSimulatedCrowd(25);
    stopSirenSound();
    setSirenOn(false);
    updateRisk(targetLat, targetLng, 25, 15);
  };

  const toggleSiren = () => {
    if (sirenOn) {
      stopSirenSound();
      setSirenOn(false);
    } else {
      startSirenSound();
      setSirenOn(true);
    }
  };

  // Chat message submission
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setInputMessage('');
    const userMsg = {
      sender: 'user' as const,
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsAssistantLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          touristContext: tourist,
          language: selectedLanguage
        })
      });
      const data = await res.json();
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Emergency helplines active: Dial 112 for Police or +91 135 246 2000 for AIIMS Trauma Center.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsAssistantLoading(false);
    }
  };

  // SOS Countdown handling
  const handleStartSosCountdown = () => {
    setSosCountdown(30);
  };

  useEffect(() => {
    if (sosCountdown === null) return;
    if (sosCountdown <= 0) {
      onTriggerSOS({ description: incidentNote, mediaUrl: mediaPreview || undefined });
      setSosCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setSosCountdown(sosCountdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [sosCountdown]);

  // Blockchain Ledger Verification
  const verifyBlockchainIdentity = async () => {
    setBlockchainVerification({ loading: true, data: null, error: null });
    try {
      const res = await fetch(`/api/blockchain/verify-id/${encodeURIComponent(tourist.blockchainDid)}`);
      const data = await res.json();
      setBlockchainVerification({ loading: false, data: data.record, error: null });
    } catch (err: any) {
      setBlockchainVerification({ loading: false, data: null, error: 'Verification query failed' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6 bg-[#0A0A0B]">
      
      {/* Top Banner: Status Header & Risk Gauge */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F27D26]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Tourist Profile & Status */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[#09090B] border-2 border-[#F27D26]/60 flex items-center justify-center text-[#F27D26] font-bold text-lg">
                  {tourist.name.charAt(0)}
                </div>
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#18181B] ${
                  tourist.safetyStatus === 'SAFE' ? 'bg-[#10B981]' : tourist.safetyStatus === 'CAUTION' ? 'bg-[#F27D26]' : 'bg-[#EF4444]'
                }`}></div>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">{tourist.name}</h1>
                  <span className="text-[10px] bg-[#09090B] text-[#71717A] px-2 py-0.5 rounded border border-[#27272A] font-mono uppercase font-semibold">
                    {tourist.nationality}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[11px] text-[#71717A] font-medium">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-[#F27D26]" />
                    <span>{tourist.currentLocation.address}</span>
                  </div>
                  <span className="text-[#27272A] hidden sm:inline">•</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] bg-[#0A0A0B] text-[#8C8C90] px-1.5 py-0.2 rounded border border-[#27272A] font-mono font-bold uppercase">{tourist.id}</span>
                  </div>
                  <span className="text-[#27272A]">•</span>
                  <button 
                    onClick={() => setShowProfileCard(true)}
                    className="text-[#F27D26] hover:text-[#FA9A4B] transition-colors uppercase font-bold tracking-wider text-[9px] cursor-pointer"
                  >
                    View Info
                  </button>
                  <span className="text-[#27272A]">•</span>
                  <button 
                    onClick={() => {
                      setLoginIdInput('');
                      setLoginOtpInput('0000');
                      setLoginError(null);
                      setShowLoginModal(true);
                    }}
                    className="text-[#F27D26] hover:text-[#FA9A4B] transition-colors uppercase font-bold tracking-wider text-[9px] cursor-pointer"
                  >
                    Switch Profile
                  </button>
                  <span className="text-[#27272A]">•</span>
                  <button 
                    onClick={() => {
                      setTourist({
                        id: '', name: '', nationality: '', blockchainDid: '', identityHash: '', emergencyContact: '', bloodType: '', safetyStatus: 'SAFE', currentLocation: { lat: 0, lng: 0, address: '' }, lastUpdated: '', batteryLevel: 100, currentRiskScore: 0
                      });
                      setShowLoginModal(true);
                    }}
                    className="text-red-500 hover:text-red-400 transition-colors uppercase font-bold tracking-wider text-[9px] cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                tourist.safetyStatus === 'SAFE'
                  ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                  : tourist.safetyStatus === 'CAUTION'
                  ? 'bg-[#F27D26]/10 text-[#F27D26] border-[#F27D26]/30'
                  : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30 animate-pulse'
              }`}>
                {tourist.safetyStatus === 'SAFE' && <ShieldCheck className="w-4 h-4 text-[#10B981]" />}
                {tourist.safetyStatus === 'CAUTION' && <AlertTriangle className="w-4 h-4 text-[#F27D26]" />}
                {tourist.safetyStatus !== 'SAFE' && tourist.safetyStatus !== 'CAUTION' && <Flame className="w-4 h-4 text-[#EF4444]" />}
                <span className="uppercase tracking-wider font-mono text-[10px]">SAFETY STATUS: {tourist.safetyStatus}</span>
              </div>

              <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#09090B] rounded-full text-xs text-[#E4E4E7] border border-[#27272A]">
                <Lock className="w-3.5 h-3.5 text-[#F27D26]" />
                <span className="font-mono text-[11px] truncate max-w-[160px] sm:max-w-[220px]">
                  {tourist.blockchainDid}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic AI Risk Score Gauge */}
          <div className="md:col-span-5 bg-[#09090B] p-4 rounded-xl border border-[#27272A] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-[#71717A] uppercase tracking-widest font-bold font-mono">Dynamic AI Risk Score</span>
              <div className="flex items-baseline space-x-2">
                <span className={`text-3xl font-extrabold font-mono ${
                  tourist.currentRiskScore > 75 ? 'text-[#EF4444]' : tourist.currentRiskScore > 40 ? 'text-[#F27D26]' : 'text-[#10B981]'
                }`}>
                  {tourist.currentRiskScore}
                </span>
                <span className="text-xs text-[#71717A]">/ 100</span>
              </div>
              <p className="text-[11px] text-[#71717A]">
                {tourist.currentRiskScore < 30 ? 'Low threat level in current corridor' : tourist.currentRiskScore < 70 ? 'Moderate perimeter hazard detected' : 'CRITICAL DANGER: Evacuation advised'}
              </p>
            </div>

            {/* Siren Control Button */}
            <button
              onClick={toggleSiren}
              className={`p-3 rounded-xl border transition-all flex flex-col items-center space-y-1 cursor-pointer ${
                sirenOn
                  ? 'bg-[#EF4444] text-white border-red-400 animate-bounce shadow-lg shadow-red-600/50'
                  : 'bg-[#18181B] text-[#71717A] border-[#27272A] hover:text-white hover:bg-[#27272A]'
              }`}
              title="Toggle Auto Loud Perimeter Siren"
            >
              {sirenOn ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6" />}
              <span className="text-[10px] font-bold tracking-tight">{sirenOn ? 'SIREN ON' : 'SIREN OFF'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#27272A] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('map')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
            activeSubTab === 'map' ? 'bg-[#F27D26] text-black font-bold shadow-md' : 'text-[#71717A] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Dynamic Geofence Map</span>
        </button>

        <button
          onClick={() => setActiveSubTab('routes')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
            activeSubTab === 'routes' ? 'bg-[#F27D26] text-black font-bold shadow-md' : 'text-[#71717A] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>AI Safe Route Finder</span>
        </button>

        <button
          onClick={() => setActiveSubTab('blockchain')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
            activeSubTab === 'blockchain' ? 'bg-[#F27D26] text-black font-bold shadow-md' : 'text-[#71717A] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Blockchain Digital Safety Pass</span>
        </button>

        <button
          onClick={() => setActiveSubTab('assistant')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
            activeSubTab === 'assistant' ? 'bg-[#F27D26] text-black font-bold shadow-md' : 'text-[#71717A] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Multilingual Voice AI</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sos')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
            activeSubTab === 'sos' ? 'bg-[#EF4444] text-white font-bold shadow-md' : 'text-[#EF4444] hover:text-white hover:bg-[#EF4444]/20 border border-[#EF4444]/30'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Emergency SOS</span>
        </button>
        
        <button
          onClick={() => setActiveSubTab('operator')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
            activeSubTab === 'operator' ? 'bg-[#EF4444] text-white font-bold shadow-md' : 'text-[#71717A] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Live Operator</span>
        </button>
      </div>

      {/* SUB-TAB 1: DYNAMIC GEOFENCE MAP & SIMULATION */}
      {activeSubTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Interactive Map Container */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-2 shadow-xl relative overflow-hidden">
              <div ref={mapContainerRef} className="w-full h-[450px] rounded-xl z-10 dark-map-tiles" />

              {/* Map Overlay Badge */}
              <div className="absolute top-4 left-4 z-[400] bg-[#09090B]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#27272A] text-xs text-[#E4E4E7] flex items-center space-x-2 shadow-lg">
                <Radio className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
                <span className="text-[11px] font-mono">Geofences Shrink/Expand via Real-time Weather & Crowd Data</span>
              </div>
            </div>

            {/* Quick Simulation Triggers */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-[#F27D26] uppercase tracking-wider flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Simulate Tourist Movement & Perimeter Breaches</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSimulateMoveToWaterfall}
                  className="bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                  <span>Simulate Walk into Unmonitored Water Gorge</span>
                </button>

                <button
                  onClick={handleSimulateSafeBypass}
                  className="bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  <span>Return to Safe Tourist Zone (Tapovan)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Geofences List Panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 shadow-xl space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white flex items-center justify-between pb-2 border-b border-[#27272A]">
                <span>Active Dynamic Geofences</span>
                <span className="text-[10px] bg-[#09090B] text-[#F27D26] px-2 py-0.5 rounded font-mono border border-[#27272A]">
                  {geofences.length} Active
                </span>
              </h2>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {geofences.map(fence => (
                  <div key={fence.id} className="bg-[#09090B] p-3 rounded-xl border border-[#27272A] space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-bold text-white">{fence.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        fence.riskFactor >= 85 ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30' : 'bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/30'
                      }`}>
                        RISK {fence.riskFactor}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#71717A] leading-tight">{fence.description}</p>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 text-[#E4E4E7] border-t border-[#27272A]">
                      <div>
                        <span className="text-[#71717A]">Radius: </span>
                        <span className="text-[#F27D26] font-bold">{fence.currentRadiusMeters}m</span>
                      </div>
                      <div>
                        <span className="text-[#71717A]">Weather Impact: </span>
                        <span className="text-[#E4E4E7]">{fence.weatherImpact}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB: LIVE OPERATOR CHAT */}
      {activeSubTab === 'operator' && (
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
          <div className="bg-[#09090B] p-4 flex items-center justify-between border-b border-[#27272A]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Emergency Operator</h3>
                <p className="text-[10px] text-[#71717A] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active & Monitoring
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {(() => {
              const activeIncident = incidents?.find(i => i.touristId === tourist.id && i.status !== 'RESOLVED');
              const logs = activeIncident && chatLogs ? chatLogs[activeIncident.id] : [];
              return (logs || []).map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === tourist.name || msg.sender === 'Tourist' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                    msg.sender === tourist.name || msg.sender === 'Tourist' 
                      ? 'bg-[#EF4444] text-white rounded-br-sm' 
                      : 'bg-[#27272A] text-[#E4E4E7] rounded-bl-sm border border-[#3F3F46]'
                  }`}>
                    {msg.sender !== tourist.name && msg.sender !== 'Tourist' && (
                      <div className="text-[10px] font-bold text-[#A1A1AA] mb-1">{msg.sender}</div>
                    )}
                    <div>{msg.text}</div>
                    <div className="text-[9px] mt-1 opacity-70 text-right">{msg.time}</div>
                  </div>
                </div>
              ));
            })()}
            {(!incidents?.find(i => i.touristId === tourist.id && i.status !== 'RESOLVED') || (chatLogs && !chatLogs[incidents.find(i => i.touristId === tourist.id && i.status !== 'RESOLVED')?.id || '']?.length)) && (
              <div className="text-center text-slate-500 text-xs mt-10">
                Type a message below to instantly alert an emergency operator.
              </div>
            )}
          </div>
          <div className="p-4 bg-[#09090B] border-t border-[#27272A]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={operatorMessage}
                onChange={e => setOperatorMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && operatorMessage.trim() && onSendAdminMessage) {
                    onSendAdminMessage(operatorMessage);
                    setOperatorMessage('');
                  }
                }}
                placeholder="Message emergency operator..."
                className="flex-1 bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#EF4444] text-white"
              />
              <button
                onClick={() => {
                  if (operatorMessage.trim() && onSendAdminMessage) {
                    onSendAdminMessage(operatorMessage);
                    setOperatorMessage('');
                  }
                }}
                className="w-12 h-12 bg-[#EF4444] text-white rounded-xl flex items-center justify-center hover:bg-[#DC2626] transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AI SAFE ROUTE FINDER */}
      {activeSubTab === 'routes' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-12 bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-[#F27D26]" />
                <span>AI Safe Route Recommender (A* Risk-Weighted Engine)</span>
              </h2>
              <p className="text-xs text-[#71717A] mt-1">
                Comparing fast direct mountain passes vs. SafeYatra safe routes guarded by continuous 5G telemetry and Tourist Kiosks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {routes.map(route => (
                <div
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all space-y-4 ${
                    selectedRoute.id === route.id
                      ? 'bg-[#09090B] border-[#F27D26] ring-1 ring-[#F27D26]/50'
                      : 'bg-[#09090B]/60 border-[#27272A] hover:border-[#71717A]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono ${
                        route.isRecommended ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30'
                      }`}>
                        {route.isRecommended ? 'RECOMMENDED SAFE ROUTE' : 'HIGH RISK FAST ROUTE'}
                      </span>
                      <h3 className="text-base font-bold text-white mt-2">{route.name}</h3>
                    </div>

                    <div className="text-right">
                      <span className={`text-2xl font-mono font-extrabold ${route.isRecommended ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {route.overallRiskScore}
                      </span>
                      <span className="block text-[10px] text-[#71717A]">Risk Score</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-[#E4E4E7] border-t border-b border-[#27272A] py-2 font-mono">
                    <div>
                      <span className="text-[#71717A]">Distance: </span>
                      <span className="font-bold">{route.distanceKm} km</span>
                    </div>
                    <div>
                      <span className="text-[#71717A]">Duration: </span>
                      <span className="font-bold">{route.estimatedMinutes} mins</span>
                    </div>
                  </div>

                  {/* Risk Factor Breakdown */}
                  <div className="space-y-1.5 text-xs">
                    <div className="text-[10px] uppercase font-bold text-[#F27D26] tracking-wider">Route Hazard Analysis:</div>
                    <p className="text-[#E4E4E7]"><strong className="text-[#71717A]">Road Condition:</strong> {route.riskFactorBreakdown.roadCondition}</p>
                    <p className="text-[#E4E4E7]"><strong className="text-[#71717A]">Weather Hazard:</strong> {route.riskFactorBreakdown.weatherHazard}</p>
                    <p className="text-[#E4E4E7]"><strong className="text-[#71717A]">Network Signal:</strong> {route.riskFactorBreakdown.mobileNetworkCoverage}</p>
                    <p className="text-[#E4E4E7]"><strong className="text-[#71717A]">Police Coverage:</strong> {route.riskFactorBreakdown.policePatrolFrequency}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: BLOCKCHAIN DIGITAL SAFETY PASS */}
      {activeSubTab === 'blockchain' && (
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                <Lock className="w-5 h-5 text-[#F27D26]" />
                <span>Blockchain-Verified Decentralized Identity (DID)</span>
              </h2>
              <p className="text-xs text-[#71717A] mt-1">
                PII remains encrypted locally. Immutable zero-knowledge verification hash is anchored on Polygon testnet ledger.
              </p>
            </div>

            <button
              onClick={verifyBlockchainIdentity}
              disabled={blockchainVerification.loading}
              className="bg-[#F27D26] hover:bg-orange-500 text-black font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center space-x-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>{blockchainVerification.loading ? 'Querying Ledger...' : 'Verify On-Chain Ledger'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#09090B] p-5 rounded-xl border border-[#27272A] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#F27D26]">Tourist Identity Record</h3>
              <div className="space-y-2 text-xs font-mono text-[#E4E4E7]">
                <div>
                  <span className="text-[#71717A]">Name:</span> {tourist.name}
                </div>
                <div>
                  <span className="text-[#71717A]">DID:</span> {tourist.blockchainDid}
                </div>
                <div>
                  <span className="text-[#71717A]">Encrypted PII Hash:</span>
                  <p className="text-[#F27D26] text-[11px] truncate mt-0.5">{tourist.identityHash}</p>
                </div>
                <div>
                  <span className="text-[#71717A]">Emergency Contact:</span> {tourist.emergencyContact}
                </div>
                <div>
                  <span className="text-[#71717A]">Blood Type:</span> {tourist.bloodType}
                </div>
              </div>
            </div>

            <div className="bg-[#09090B] p-5 rounded-xl border border-[#27272A] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#F27D26]">Ledger Verification Status</h3>
              {blockchainVerification.data ? (
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center space-x-2 text-[#10B981] font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ON-CHAIN ANCHOR VERIFIED PERFECT</span>
                  </div>
                  <div className="text-[#E4E4E7]">
                    <span className="text-[#71717A]">Issuer Node:</span> {blockchainVerification.data.issuer}
                  </div>
                  <div className="text-[#E4E4E7]">
                    <span className="text-[#71717A]">Block Number:</span> {blockchainVerification.data.blockNumber}
                  </div>
                  <div className="text-[#E4E4E7]">
                    <span className="text-[#71717A]">Tx Hash:</span>
                    <p className="text-[#F27D26] text-[10px] truncate mt-0.5">{blockchainVerification.data.txHash}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#71717A]">
                  Click 'Verify On-Chain Ledger' above to query the smart contract state via REST endpoint.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: MULTILINGUAL AI VOICE ASSISTANT */}
      {activeSubTab === 'assistant' && (
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                <Mic className="w-5 h-5 text-[#F27D26]" />
                <span>Multilingual AI Safety Companion (Gemini 2.5)</span>
              </h2>
              <p className="text-xs text-[#71717A] mt-1">
                Voice-to-text safety query assistant operating in regional Indian languages and international languages.
              </p>
            </div>

            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value)}
              className="bg-[#09090B] text-[#F27D26] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#27272A] focus:outline-none"
            >
              <option value="English">English</option>
              <option value="Hindi">हिन्दी (Hindi)</option>
              <option value="Tamil">தமிழ் (Tamil)</option>
              <option value="Bengali">বাংলা (Bengali)</option>
              <option value="Marathi">मराठी (Marathi)</option>
              <option value="French">Français</option>
              <option value="German">Deutsch</option>
              <option value="Spanish">Español</option>
              <option value="Japanese">日本語</option>
            </select>
          </div>

          {/* Chat Messages Log */}
          <div className="bg-[#09090B] p-4 rounded-xl border border-[#27272A] h-[320px] overflow-y-auto space-y-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#F27D26] text-black font-medium rounded-br-none'
                      : 'bg-[#18181B] text-[#E4E4E7] border border-[#27272A] rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="text-[10px] opacity-60 mt-1 block text-right">{msg.time}</span>
                </div>
              </div>
            ))}
            {isAssistantLoading && (
              <div className="text-xs text-[#F27D26] animate-pulse flex items-center space-x-2">
                <Radio className="w-3.5 h-3.5 animate-spin" />
                <span>Gemini is generating safety response...</span>
              </div>
            )}
          </div>

          {/* Input Field */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Ask safety queries in ${selectedLanguage} (e.g. "Is Neer Garh waterfall safe right now?")`}
              className="flex-1 bg-[#09090B] border border-[#27272A] text-white placeholder-[#71717A] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#F27D26]"
            />
            <button
              onClick={handleSendMessage}
              disabled={isAssistantLoading}
              className="bg-[#F27D26] hover:bg-orange-500 text-black p-2.5 rounded-xl font-bold transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SOS & INCIDENT REPORTING */}
      {activeSubTab === 'sos' && (
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-[#27272A] pb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#EF4444] flex items-center space-x-2">
              <Flame className="w-6 h-6 animate-pulse" />
              <span>Emergency SOS & Incident Evidentiary Reporting</span>
            </h2>
            <p className="text-xs text-[#71717A] mt-1">
              Immediate authority dispatch pipeline with automated fallback voice call / SMS alerts if unacknowledged within 30s.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* SOS Countdown Box */}
            <div className="md:col-span-6 bg-[#EF4444]/10 border border-[#EF4444]/30 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 bg-[#EF4444]/20 rounded-full border border-[#EF4444]/40">
                <Flame className="w-12 h-12 text-[#EF4444] animate-bounce" />
              </div>

              {sosCountdown !== null ? (
                <div className="space-y-2">
                  <span className="text-4xl font-mono font-extrabold text-white animate-pulse">{sosCountdown}s</span>
                  <p className="text-xs text-red-300">
                    Automated Voice Call & SMS Alert will trigger automatically to State Emergency Helpline (112) & Emergency Contacts.
                  </p>
                  <button
                    onClick={() => setSosCountdown(null)}
                    className="bg-[#09090B] hover:bg-black text-white text-xs px-4 py-1.5 rounded-lg border border-[#27272A] cursor-pointer"
                  >
                    Cancel Emergency SOS
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleStartSosCountdown}
                    className="bg-[#EF4444] hover:bg-red-600 text-white font-extrabold text-sm tracking-wider uppercase px-8 py-4 rounded-2xl shadow-xl transition-all hover:scale-105 border border-red-400/50 cursor-pointer"
                  >
                    TRIGGER IMMEDIATE SOS NOW
                  </button>
                  <p className="text-[11px] text-[#71717A]">
                    Sends real-time GPS coordinates ({tourist.currentLocation.lat.toFixed(4)}, {tourist.currentLocation.lng.toFixed(4)}) to Police & Medical Dispatch.
                  </p>
                </div>
              )}
            </div>

            {/* Evidentiary Incident Upload & Offline SMS Payload */}
            <div className="md:col-span-6 space-y-4">
              <div className="bg-[#09090B] p-4 rounded-xl border border-[#27272A] space-y-3">
                <h3 className="text-xs font-bold text-[#F27D26] uppercase tracking-wider">Report Incident Evidence (Photo/Video)</h3>
                <textarea
                  value={incidentNote}
                  onChange={e => setIncidentNote(e.target.value)}
                  placeholder="Describe incident (e.g. 'Flash flood rising near waterfall trail...')"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg p-3 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#F27D26] h-20"
                ></textarea>

                <div className="flex items-center space-x-3">
                  <label className="cursor-pointer bg-[#18181B] hover:bg-[#27272A] text-[#E4E4E7] border border-[#27272A] px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#F27D26]" />
                    <span>Upload Geo-Tagged Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setMediaPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>

                  {mediaPreview && <span className="text-xs text-[#10B981] font-mono">Photo attached ✓</span>}
                </div>
              </div>

              {/* Offline Emergency SMS Fallback Payload */}
              <div className="bg-[#09090B] p-4 rounded-xl border border-[#27272A] space-y-2">
                <h3 className="text-xs font-bold text-[#E4E4E7] flex items-center space-x-1.5 uppercase tracking-wider">
                  <Radio className="w-3.5 h-3.5 text-[#F27D26]" />
                  <span>Offline Mesh/SMS Fallback Payload Generator</span>
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  If cellular internet fails, copy this compressed SMS payload to send via standard SMS to 112:
                </p>
                <div className="bg-[#18181B] p-2.5 rounded border border-[#27272A] text-[10px] font-mono text-[#F27D26] select-all">
                  SAFEYATRA_SOS|DID:{tourist.blockchainDid.slice(0, 16)}|LAT:{tourist.currentLocation.lat}|LNG:{tourist.currentLocation.lng}|RISK:{tourist.currentRiskScore}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 1. Sleek Login/Switch Profile Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-[#09090B]/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-[#09090B] border-b border-[#27272A] px-5 py-4 flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-widest text-[#E4E4E7]">Tourist Login</span>
              {tourist && tourist.id !== '' && (
                <button 
                  onClick={() => setShowLoginModal(false)}
                  className="text-[#71717A] hover:text-white transition-colors text-lg font-bold cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-[#71717A] tracking-wider">Tourist Login ID</label>
                <div className="flex space-x-2">
                  <input 
                    type="text"
                    value={loginIdInput}
                    onChange={(e) => {
                      setLoginIdInput(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="Tourist ID"
                    className="flex-1 text-xs border border-[#27272A] bg-[#09090B] focus:bg-transparent focus:outline-none focus:border-[#F27D26] rounded-lg px-3 py-2 text-white font-mono uppercase"
                  />
                  <input 
                    type="password"
                    value={loginOtpInput}
                    onChange={(e) => {
                      setLoginOtpInput(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="OTP"
                    className="w-16 text-xs border border-[#27272A] bg-[#09090B] focus:bg-transparent focus:outline-none focus:border-[#F27D26] rounded-lg px-3 py-2 text-center text-white font-mono"
                    maxLength={4}
                  />
                  <button
                    onClick={() => {
                      if (!loginIdInput.trim()) {
                        setLoginError('Tourist ID is required.');
                        return;
                      }
                      if (loginOtpInput !== '0000') {
                        setLoginError('Invalid OTP. Please use the default OTP (0000).');
                        return;
                      }
                      const res = onLoginTourist(loginIdInput.trim());
                      if (res) {
                        setShowLoginModal(false);
                        setLoginError(null);
                      } else {
                        setLoginError('Tourist ID not found. Ensure spelling is correct.');
                      }
                    }}
                    className="bg-[#F27D26] hover:bg-[#FA9A4B] text-black font-bold text-xs px-4 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                  >
                    Login
                  </button>
                </div>
                {loginError && <p className="text-[10px] text-red-500 font-medium pt-1">{loginError}</p>}
              </div>

              {/* Suggestions / List of Registered Profiles */}
              <div className="space-y-2 border-t border-[#27272A] pt-3">
                <span className="block text-[9px] uppercase font-bold text-[#71717A] tracking-wider">Registered Profiles (Click to login)</span>
                <div className="max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-[#27272A] pr-1">
                  {[tourist, ...otherTourists].map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => {
                        onLoginTourist(t.id);
                        setShowLoginModal(false);
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                        t.id === tourist.id 
                          ? 'bg-[#F27D26]/10 border-[#F27D26]/40 text-[#F27D26]' 
                          : 'bg-[#09090B] border-[#27272A] hover:border-[#F27D26]/30 text-[#71717A] hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-sans font-bold text-[11px] text-[#E4E4E7]">{t.name}</span>
                        <span className="text-[9px] text-[#71717A] pt-0.5">{t.id}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 font-sans">
                        <span className="text-[10px]">{t.nationality}</span>
                        {t.id === tourist.id && <span className="text-[9px] bg-[#F27D26] text-black px-1 py-0.2 rounded font-bold uppercase">Active</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 2. Sleek Profile Details Modal */}
      {showProfileCard && (
        <div className="fixed inset-0 bg-[#09090B]/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="bg-[#09090B] border-b border-[#27272A] px-5 py-4 flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-widest text-[#E4E4E7]">Tourist Profile Credentials</span>
              <button 
                onClick={() => setShowProfileCard(false)}
                className="text-[#71717A] hover:text-white transition-colors text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Profile Info Details Grid */}
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-4 border-b border-[#27272A] pb-4">
                <div className="w-14 h-14 rounded-full bg-[#09090B] border-2 border-[#F27D26] flex items-center justify-center text-[#F27D26] font-bold text-xl">
                  {tourist.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">{tourist.name}</h3>
                  <span className="text-[9px] bg-[#09090B] text-[#F27D26] px-2 py-0.5 rounded border border-[#F27D26]/30 font-mono font-bold mt-1 inline-block uppercase font-semibold">
                    {tourist.id}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs text-[#E4E4E7]">
                
                <div>
                  <span className="block text-[9px] uppercase font-bold text-[#71717A] tracking-wider mb-0.5">Email Address</span>
                  <span className="font-mono text-[11px] text-[#A1A1AA] break-all">{tourist.email || 'not provided'}</span>
                </div>
                
                <div>
                  <span className="block text-[9px] uppercase font-bold text-[#71717A] tracking-wider mb-0.5">Mobile / Contact</span>
                  <span className="font-mono text-[11px] text-[#A1A1AA]">{tourist.mobile || tourist.emergencyContact || 'not provided'}</span>
                </div>

                <div>
                  <span className="block text-[9px] uppercase font-bold text-[#71717A] tracking-wider mb-0.5">Nationality (Country)</span>
                  <span className="text-[#A1A1AA]">{tourist.nationality}</span>
                </div>

                <div>
                  <span className="block text-[9px] uppercase font-bold text-[#71717A] tracking-wider mb-0.5">Current City</span>
                  <span className="text-[#A1A1AA]">{tourist.city || 'Rishikesh'}</span>
                </div>

                <div>
                  <span className="block text-[9px] uppercase font-bold text-[#71717A] tracking-wider mb-0.5">Age</span>
                  <span className="text-[#A1A1AA]">{tourist.age || '25'} years old</span>
                </div>

                <div>
                  <span className="block text-[9px] uppercase font-bold text-[#71717A] tracking-wider mb-0.5">Blood Group</span>
                  <span className="font-bold text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 px-2 py-0.5 rounded inline-block text-[10px]">{tourist.bloodType || 'O+'}</span>
                </div>

                <div className="col-span-2 border-t border-[#27272A] pt-3.5 space-y-2 font-mono text-[10px]">
                  <div>
                    <span className="block text-[9px] font-sans uppercase font-bold text-[#71717A] tracking-wider mb-0.5">Decentralized DID</span>
                    <span className="text-[#71717A] text-[9px] break-all">{tourist.blockchainDid}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-sans uppercase font-bold text-[#71717A] tracking-wider mb-0.5">ZKP Identity Hash</span>
                    <span className="text-[#71717A] text-[9px] break-all">{tourist.identityHash}</span>
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-4 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowProfileCard(false)}
                  className="bg-[#27272A] hover:bg-[#3F3F46] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Close Profile
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};
