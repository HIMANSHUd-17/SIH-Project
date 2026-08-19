import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, MessageSquare, X, Send, Sparkles, RefreshCw,
  Compass, AlertTriangle, CloudRain, Flame, HelpCircle,
  ChevronDown, Bot, User, ArrowRight
} from 'lucide-react';
import { aiChatbotService, ChatMessage } from '../../services/aiChatbotService';

const DEFAULT_QUICK_ACTIONS = [
  { label: '📍 Check Location Safety', query: 'Check Location Safety' },
  { label: '🛡️ Safety Tips', query: 'Safety Tips' },
  { label: '🌦️ Weather Safety', query: 'Weather Safety' },
  { label: '🚨 Emergency Help', query: 'Emergency Help' },
  { label: '🤖 How SafeYatra Works', query: 'How does SafeYatra work?' },
];

interface SafeYatraChatbotProps {
  userLocation?: {
    lat: number | null;
    lng: number | null;
    address?: string;
    status: 'prompt' | 'granted' | 'denied' | 'unavailable';
  };
  onRequestLocation?: () => void;
}

export const SafeYatraChatbot: React.FC<SafeYatraChatbotProps> = ({
  userLocation,
  onRequestLocation
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMsg: ChatMessage = {
      id: 'welcome-msg',
      sender: 'bot',
      text: "👋 **Hi! I'm SafeYatra AI.**\nYour intelligent travel safety assistant.\n\nHow can I help you travel safer today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickActions: DEFAULT_QUICK_ACTIONS
    };
    setMessages([welcomeMsg]);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    setHasInteracted(true);
    setInputMessage('');

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const botResponse = await aiChatbotService.sendMessage(query, messages, userLocation);
      setMessages(prev => [...prev, botResponse]);
    } catch {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'bot',
        text: "I'm temporarily having trouble connecting to the safety network. Please check your internet connection or refer to the emergency helplines (`112`).",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: DEFAULT_QUICK_ACTIONS
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const welcomeMsg: ChatMessage = {
      id: 'welcome-reset-' + Date.now(),
      sender: 'bot',
      text: "👋 **Chat refreshed.**\nHow can I assist you with your travel safety?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickActions: DEFAULT_QUICK_ACTIONS
    };
    setMessages([welcomeMsg]);
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-[13px]">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Process markdown bold (**text**)
          const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
          return (
            <p key={idx} className={line.startsWith('•') || line.startsWith('   •') ? 'pl-2 text-slate-200' : 'text-slate-100'}>
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={pIdx} className="font-bold text-emerald-300">{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('`') && part.endsWith('`')) {
                  return (
                    <code key={pIdx} className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono font-bold">
                      {part.slice(1, -1)}
                    </code>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Floating Trigger Button (Bottom-Right)                                 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* Tooltip Pill (Shows before interaction) */}
        {!isOpen && !hasInteracted && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-slate-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl border border-emerald-500/30 backdrop-blur-xl cursor-pointer hover:border-emerald-400 hover:scale-105 transition-all duration-300 animate-fade-in group"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
            <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
              Ask SafeYatra AI
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        )}

        {/* Main Floating Bot Button */}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className={`relative group w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer ${
            isOpen
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 rotate-90'
              : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-sky-600 text-white hover:shadow-emerald-500/25 hover:scale-105'
          }`}
          aria-label={isOpen ? 'Close SafeYatra Chatbot' : 'Open SafeYatra Chatbot'}
        >
          {/* Subtle Outer Glow Ring */}
          {!isOpen && (
            <>
              <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 opacity-60 blur-sm group-hover:opacity-100 transition duration-500 -z-10 animate-pulse"></span>
              <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping"></span>
            </>
          )}

          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="flex items-center justify-center">
              <Shield className="w-7 h-7 text-white drop-shadow-md" />
              <Bot className="w-3.5 h-3.5 text-emerald-200 absolute -bottom-0.5 -right-0.5 bg-slate-900 p-0.5 rounded-full border border-emerald-400" />
            </div>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Luxury Glassmorphism Chat Window Modal                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-24 sm:inset-auto sm:right-6 sm:bottom-24 sm:w-[420px] h-[590px] max-h-[calc(100vh-120px)] z-50 flex flex-col rounded-3xl bg-slate-950/92 backdrop-blur-2xl border border-white/15 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] text-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300 font-sans">
          
          {/* ═══ Header ═══ */}
          <div className="px-4 py-3.5 bg-slate-900/80 border-b border-white/10 flex items-center justify-between backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white tracking-tight">SafeYatra AI</h3>
                  {userLocation?.status === 'granted' && typeof userLocation.lat === 'number' ? (
                    <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      GPS: {userLocation.lat.toFixed(2)}°, {userLocation.lng?.toFixed(2)}°
                    </span>
                  ) : (
                    <button
                      onClick={onRequestLocation}
                      className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Click to share live GPS location"
                    >
                      <span>📍 Enable GPS</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                  {userLocation?.address || 'Intelligent Travel Safety Assistant'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={handleClearChat}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Refresh Chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Minimize Window"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ═══ Scrollable Message Canvas ═══ */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isBot ? 'items-start' : 'items-end justify-end'}`}
                >
                  {isBot && (
                    <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                        isBot
                          ? msg.isEmergency
                            ? 'bg-red-950/80 border border-red-500/50 text-red-100 rounded-tl-sm'
                            : 'bg-slate-900/90 border border-white/10 text-slate-100 rounded-tl-sm backdrop-blur-md'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-sm'
                      }`}
                    >
                      {renderFormattedText(msg.text)}

                      {/* Optional Follow-up Quick Action Pills */}
                      {isBot && msg.quickActions && msg.quickActions.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-1.5">
                          {msg.quickActions.map((qa, qIdx) => (
                            <button
                              key={qIdx}
                              onClick={() => handleSendMessage(qa.query)}
                              disabled={isLoading}
                              className="text-[11px] font-medium bg-slate-800/90 hover:bg-emerald-950/80 hover:text-emerald-300 hover:border-emerald-500/40 text-slate-300 border border-white/10 px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
                            >
                              <span>{qa.label}</span>
                              <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>

                  {!isBot && (
                    <div className="w-7 h-7 rounded-lg bg-teal-900 border border-teal-500/40 text-teal-200 flex items-center justify-center shrink-0 mb-4 shadow-sm">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Animation */}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900/90 border border-white/10 px-4 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ═══ Default Quick Suggestions Strip (Horizontal Carousel) ═══ */}
          <div className="px-3 py-2 bg-slate-900/60 border-t border-white/5 overflow-x-auto flex gap-1.5 scrollbar-none shrink-0">
            {DEFAULT_QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(action.query)}
                disabled={isLoading}
                className="whitespace-nowrap text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-white/10 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* ═══ Input Footer ═══ */}
          <div className="p-3 bg-slate-900/95 border-t border-white/10 backdrop-blur-md shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 relative"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about travel safety, risk score, weather..."
                disabled={isLoading}
                className="w-full bg-slate-950 border border-white/15 focus:border-emerald-500/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all pr-10"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-600 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1">
              <span>⚡ SafeYatra AI Safety Network</span>
              <span>Emergency: Dial <strong className="text-red-400 font-mono">112</strong></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
