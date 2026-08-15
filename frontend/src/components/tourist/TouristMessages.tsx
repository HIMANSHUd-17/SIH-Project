import React, { useState, useRef, useEffect } from 'react';
import { IncidentReport, TouristProfile } from '../../types';

interface TouristMessagesProps {
  tourist: TouristProfile;
  incidents: IncidentReport[];
  chatLogs: Record<string, { sender: string; text: string; time: string; latency?: string; senderRole?: string; recipientRole?: string; channel?: string; touristId?: string }[]>;
  onSendMessage: (text: string, recipient?: 'admin' | 'guide') => void;
}

interface Thread {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  isActive: boolean;
  isOnline: boolean;
}

export const TouristMessages: React.FC<TouristMessagesProps> = ({
  tourist,
  incidents,
  chatLogs,
  onSendMessage,
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [activeThreadId, setActiveThreadId] = useState('admin');
  const [assignedGuideName, setAssignedGuideName] = useState('RAMA PATILE');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchGuide = async () => {
      let targetGuideId = tourist.guide_id;
      if (!targetGuideId && tourist.id?.startsWith('T-')) {
        const parts = tourist.id.split('-');
        if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
          targetGuideId = `G-${parts[1]}`;
        }
      }
      if (!targetGuideId) targetGuideId = 'G-1001';

      try {
        const res = await fetch('/api/v1/guides');
        if (res.ok) {
          const guides = await res.json();
          const found = guides.find((g: any) => g.guide_id === targetGuideId);
          if (found && found.full_name) {
            setAssignedGuideName(found.full_name);
            return;
          }
        }
      } catch (e) {
        console.error('Error fetching guide in TouristMessages:', e);
      }
    };

    fetchGuide();
  }, [tourist.guide_id, tourist.id]);

  const guideInitials = assignedGuideName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'RP';

  // Active incident associated with this tourist
  const activeIncident = incidents?.find(
    (i) => (i.touristId === tourist.id || i.touristName === tourist.name) && i.status !== 'RESOLVED'
  );

  const lastAdminMsg = (() => {
    const fromAdminKey = chatLogs ? (chatLogs[`admin_${tourist.id}`] || []) : [];
    const fromInc = activeIncident && chatLogs ? (chatLogs[activeIncident.id] || []) : [];
    const fromId = (chatLogs && tourist.id ? (chatLogs[tourist.id] || []) : []).filter(
      (m: any) => m.channel === 'admin' || m.recipientRole === 'admin' || m.senderRole === 'admin'
    );
    const all = [...fromAdminKey, ...fromInc, ...fromId];
    if (all.length > 0) {
      return all[all.length - 1];
    }
    return null;
  })();

  const lastGuideMsg = (() => {
    const fromGuideKey = chatLogs ? (chatLogs[`guide_${tourist.id}`] || []) : [];
    if (fromGuideKey.length > 0) {
      return fromGuideKey[fromGuideKey.length - 1];
    }
    return null;
  })();

  // Build threads from chat logs
  const threads: Thread[] = [
    {
      id: 'admin',
      name: 'Admin Command Desk',
      initials: 'AD',
      lastMessage: lastAdminMsg ? lastAdminMsg.text : 'Safety monitoring is active and nominal.',
      time: lastAdminMsg ? lastAdminMsg.time : 'Just now',
      isActive: activeThreadId === 'admin',
      isOnline: true,
    },
    {
      id: 'guide',
      name: `Tour Guide (${assignedGuideName})`,
      initials: guideInitials,
      lastMessage: lastGuideMsg ? lastGuideMsg.text : "Stay with the tour group and keep in touch here.",
      time: lastGuideMsg ? lastGuideMsg.time : 'Active',
      isActive: activeThreadId === 'guide',
      isOnline: true,
    },
  ];

  let currentThreadMessages: { sender: string; text: string; time: string; latency?: string }[] = [];

  if (activeThreadId === 'admin') {
    // Isolated Admin channel only
    const fromAdminKey = chatLogs ? (chatLogs[`admin_${tourist.id}`] || []) : [];
    const fromInc = activeIncident && chatLogs ? (chatLogs[activeIncident.id] || []) : [];
    const fromId = (chatLogs && tourist.id ? (chatLogs[tourist.id] || []) : []).filter(
      (m: any) => m.channel === 'admin' || m.recipientRole === 'admin' || m.senderRole === 'admin' || (!m.channel && !m.recipientRole)
    );

    const combined = [...fromAdminKey, ...fromInc, ...fromId];
    const seen = new Set();
    currentThreadMessages = combined.filter(m => {
      // Must NOT be guide channel
      if (m.channel === 'guide' || m.recipientRole === 'guide' || m.senderRole === 'guide') {
        return false;
      }
      const key = `${m.sender}-${m.text}-${m.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } else {
    // Isolated Guide channel only
    const fromGuideKey = chatLogs ? (chatLogs[`guide_${tourist.id}`] || []) : [];
    const fromId = (chatLogs && tourist.id ? (chatLogs[tourist.id] || []) : []).filter(
      (m: any) => m.channel === 'guide' || m.recipientRole === 'guide' || m.senderRole === 'guide'
    );
    const combined = [...fromGuideKey, ...fromId];
    const seen = new Set();
    currentThreadMessages = combined.filter(m => {
      // Must NOT be admin channel
      if (m.channel === 'admin' || m.recipientRole === 'admin' || m.senderRole === 'admin') {
        return false;
      }
      const key = `${m.sender}-${m.text}-${m.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const defaultAdminMessages = [
    {
      sender: 'Admin desk',
      text: 'Hello! Safety monitoring is active and nominal. Contact the Authority Command Center if you need assistance.',
      time: 'Just now',
    },
  ];

  const defaultGuideMessages = [
    {
      sender: 'guide',
      text: `Hello ${tourist.name || 'Traveler'}! I am your Tour Guide (${assignedGuideName}). Stay with the group and reach out here if you have any questions.`,
      time: 'Just now',
    },
  ];

  const displayMessages = currentThreadMessages.length > 0 
    ? currentThreadMessages 
    : (activeThreadId === 'admin' ? defaultAdminMessages : defaultGuideMessages);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages.length, activeThreadId]);

  const handleSend = () => {
    if (!messageInput.trim()) return;
    onSendMessage(messageInput.trim(), activeThreadId === 'admin' ? 'admin' : 'guide');
    setMessageInput('');
  };

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  return (
    <div className="flex flex-1 bg-st-background" style={{ height: 'calc(100vh - 64px)' }}>
      {/* ═══════ Column 1: Conversation List (Desktop) ═══════ */}
      <aside className="w-full md:w-[280px] lg:w-[320px] bg-st-surface-white border-r border-st-outline-variant hidden md:flex flex-col shrink-0" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="p-4 border-b border-st-outline-variant/50">
          <h2 className="text-xl font-semibold text-st-text-dark leading-7">Inbox</h2>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setActiveThreadId(thread.id)}
              className={`w-full text-left rounded-xl p-3 flex gap-3 items-center transition-colors cursor-pointer ${
                activeThreadId === thread.id
                  ? 'bg-st-surface-container hover:bg-st-surface-container-high'
                  : 'hover:bg-st-surface-container-low'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                  activeThreadId === thread.id
                    ? 'bg-st-primary-fixed text-st-primary'
                    : 'bg-st-surface-variant text-st-on-surface-variant'
                }`}
              >
                {thread.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-semibold text-st-on-surface truncate leading-5">
                    {thread.name}
                  </span>
                  <span className="text-xs text-st-on-surface-variant">{thread.time}</span>
                </div>
                <p className="text-sm text-st-on-surface-variant truncate">{thread.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ═══════ Column 2: Chat Canvas ═══════ */}
      <section className="flex-1 flex flex-col bg-st-surface-white relative" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Chat Header */}
        <header className="h-16 px-4 md:px-6 border-b border-st-outline-variant/50 flex items-center justify-between shrink-0 bg-st-surface-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-st-on-surface-variant p-2 -ml-2 rounded-full hover:bg-st-surface-container-low">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-st-primary-fixed text-st-primary flex items-center justify-center text-sm font-semibold">
              {activeThread.initials}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-st-on-surface leading-5">{activeThread.name}</h2>
              {activeThread.isOnline && (
                <span className="text-xs text-st-secondary flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-st-secondary inline-block"></span> Online
                </span>
              )}
            </div>
          </div>
          <button className="text-st-on-surface-variant p-2 rounded-full hover:bg-st-surface-container-low">
            <span className="material-symbols-outlined">info</span>
          </button>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 space-y-6 bg-st-background flex flex-col">
          {/* Date Separator */}
          <div className="flex justify-center">
            <span className="text-xs font-medium text-st-on-surface-variant bg-st-surface-container-low px-3 py-1 rounded-full">
              Today
            </span>
          </div>

          {displayMessages.map((msg, idx) => {
            const isSent =
              msg.sender === tourist.name ||
              msg.sender === 'Tourist' ||
              msg.sender === tourist.id;

            return isSent ? (
              /* Sent Message */
              <div key={idx} className="flex items-end gap-2 self-end max-w-[85%] md:max-w-[70%]">
                <div className="bg-st-primary text-st-on-primary p-4 rounded-xl rounded-br-sm shadow-sm">
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <span className="text-[10px] text-st-on-primary-container block mt-2 opacity-80 text-right">
                    {msg.time}
                  </span>
                </div>
              </div>
            ) : (
              /* Received Message */
              <div key={idx} className="flex items-end gap-2 self-start max-w-[85%] md:max-w-[70%]">
                <div className="w-8 h-8 rounded-full bg-st-primary-fixed text-st-primary flex items-center justify-center text-xs shrink-0 mb-1">
                  {activeThread.initials}
                </div>
                <div className="bg-st-surface-container text-st-on-surface p-4 rounded-xl rounded-bl-sm">
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <span className="text-[10px] text-st-on-surface-variant block mt-2 opacity-80">
                    {msg.time}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Footer / Input */}
        <footer className="p-4 bg-st-surface-white border-t border-st-outline-variant/50 shrink-0">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <button className="p-3 text-st-outline hover:text-st-primary transition-colors rounded-full hover:bg-st-surface-container-low shrink-0 mb-1">
              <span className="material-symbols-outlined">photo_camera</span>
            </button>
            <div className="flex-1 bg-st-surface-container-low rounded-xl border border-st-outline-variant/30 focus-within:border-st-primary focus-within:ring-1 focus-within:ring-st-primary transition-all">
              <textarea
                className="w-full bg-transparent border-none focus:ring-0 resize-none p-3 text-sm text-st-on-surface placeholder-st-on-surface-variant min-h-[48px] max-h-[120px] outline-none"
                placeholder="Type a message..."
                rows={1}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onInput={(e) => {
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = '';
                  el.style.height = el.scrollHeight + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
            </div>
            <button
              onClick={handleSend}
              className="w-12 h-12 rounded-full bg-st-primary text-st-on-primary flex items-center justify-center shrink-0 hover:bg-st-primary-container transition-colors mb-0.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};
