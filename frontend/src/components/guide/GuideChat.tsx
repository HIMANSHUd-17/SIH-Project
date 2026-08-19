import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Paperclip, Users, Radio, MessageSquare, Search,
  Smile, Image as ImageIcon, AlertCircle, ChevronDown, Trash2, Shield
} from 'lucide-react';
import { TouristProfile } from '../../types';

interface GuideChatProps {
  tourists: TouristProfile[];
  currentGuide?: any;
  chatLogs?: Record<string, any[]>;
  setChatLogs?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

interface ChannelItem {
  id: string;
  name: string;
  type: 'admin' | 'group' | 'broadcast' | 'direct';
  touristId?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  memberCount?: number;
  latestTimeMs?: number;
}

const quickReplies = [
  'Stay with the group',
  'We\'re leaving in 5 mins',
  'Meet at the plaza',
  'Are you okay?',
  'Check your surroundings',
];

const broadcastTemplates = [
  { label: '📢 Assembly', text: 'Attention group: Please assemble at the meeting point immediately.' },
  { label: '⏰ Schedule', text: 'Schedule update: Our next stop departure has been adjusted.' },
  { label: '⚠️ Weather', text: 'Weather advisory: Please prepare for changing conditions.' },
  { label: '🏛️ Arrival', text: 'We have arrived at our next destination. Please stay together.' },
];

export const GuideChat: React.FC<GuideChatProps> = ({
  tourists,
  currentGuide,
  chatLogs = {},
  setChatLogs
}) => {
  const [activeChannel, setActiveChannel] = useState<string>('ch-admin');
  const [inputText, setInputText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Admin Command Desk Channel
  const guideId = currentGuide?.guide_id || 'G-1001';
  const adminMsgs = [
    ...(chatLogs[`admin_${guideId}`] || []),
    ...(chatLogs[`guide_inbox_${guideId}`] || []),
    ...(chatLogs[guideId] || []),
    ...(chatLogs[`conv_${guideId}_admin`] || [])
  ];
  const lastAdminMsg = adminMsgs.length > 0 ? adminMsgs[adminMsgs.length - 1] : null;
  let adminLatestTimeMs = 0;
  if (lastAdminMsg) {
    if (typeof lastAdminMsg.timestamp === 'number') adminLatestTimeMs = lastAdminMsg.timestamp;
    else if (typeof lastAdminMsg.timestamp === 'string' && !isNaN(Number(lastAdminMsg.timestamp))) adminLatestTimeMs = Number(lastAdminMsg.timestamp);
    else if (lastAdminMsg.time) {
      const parsed = Date.parse(`${new Date().toDateString()} ${lastAdminMsg.time}`);
      if (!isNaN(parsed)) adminLatestTimeMs = parsed;
    }
  }

  const adminChannel: ChannelItem = {
    id: 'ch-admin',
    name: 'Admin Command Center',
    type: 'admin',
    lastMessage: lastAdminMsg ? lastAdminMsg.text : 'Official line to Tourism Authority & Dispatch Desk',
    lastMessageTime: lastAdminMsg ? lastAdminMsg.time : 'Live Desk',
    latestTimeMs: adminLatestTimeMs,
    memberCount: 2
  };

  // Build dynamic channels sorted chronologically by latest message
  const touristChannels = tourists.map(t => {
    const tMsgs = (chatLogs[`guide_${t.id}`] || []).filter(
      (m: any) => m.channel === 'guide' || m.recipientRole === 'guide' || m.senderRole === 'guide' || (!m.channel && !m.recipientRole)
    );
    const lastMsg = tMsgs.length > 0 ? tMsgs[tMsgs.length - 1] : null;
    let latestTimeMs = 0;
    if (lastMsg) {
      if (typeof lastMsg.timestamp === 'number') latestTimeMs = lastMsg.timestamp;
      else if (typeof lastMsg.timestamp === 'string' && !isNaN(Number(lastMsg.timestamp))) latestTimeMs = Number(lastMsg.timestamp);
      else if (lastMsg.time) {
        const parsed = Date.parse(`${new Date().toDateString()} ${lastMsg.time}`);
        if (!isNaN(parsed)) latestTimeMs = parsed;
      }
    }

    return {
      id: t.id,
      name: t.name,
      type: 'direct' as const,
      touristId: t.id,
      lastMessage: lastMsg ? lastMsg.text : 'Direct safety channel',
      lastMessageTime: lastMsg ? lastMsg.time : 'Active',
      latestTimeMs,
      memberCount: 2
    };
  }).sort((a, b) => {
    if (a.latestTimeMs !== b.latestTimeMs) return (b.latestTimeMs || 0) - (a.latestTimeMs || 0);
    return a.name.localeCompare(b.name);
  });

  const channels: ChannelItem[] = [
    adminChannel,
    {
      id: 'ch-group',
      name: currentGuide?.full_name ? `Team Group (${currentGuide.full_name}'s Team)` : 'Team Group Chat',
      type: 'group',
      memberCount: tourists.length,
      lastMessage: 'Team group discussion channel',
      lastMessageTime: 'Live'
    },
    ...touristChannels
  ];

  const activeChannelData = channels.find(c => c.id === activeChannel) || channels[0];
  const activeTourist = tourists.find(t => t.id === activeChannel);

  const getTimestampMs = (m: any): number => {
    if (typeof m.timestamp === 'number' && !isNaN(m.timestamp)) return m.timestamp;
    if (typeof m.timestamp === 'string' && !isNaN(Number(m.timestamp))) return Number(m.timestamp);
    if (m.time) {
      const today = new Date().toDateString();
      const parsed = Date.parse(`${today} ${m.time}`);
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  };

  // Extract messages for active channel
  const getChannelMessages = () => {
    const currentGuideId = currentGuide?.guide_id || 'G-1001';

    if (activeChannel === 'ch-admin') {
      const adminMsgs = [
        ...(chatLogs[`admin_${currentGuideId}`] || []),
        ...(chatLogs[`guide_inbox_${currentGuideId}`] || []),
        ...(chatLogs[currentGuideId] || []),
        ...(chatLogs[`conv_${currentGuideId}_admin`] || [])
      ];
      const seen = new Set();
      const filtered = adminMsgs.filter(m => {
        if (m.senderRole === 'tourist') return false;
        if (m.channel === 'guide' || m.channel === 'guide_group') return false;

        const key = (m.id && String(m.id).trim()) ? String(m.id).trim() : `${m.sender || ''}-${m.text || ''}-${m.time || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return filtered.sort((a, b) => getTimestampMs(a) - getTimestampMs(b));
    } else if (activeChannel === 'ch-group') {
      const groupMsgs = [
        ...(chatLogs[`group_${currentGuideId}`] || []),
        ...(chatLogs['guide_group'] || []),
        ...(chatLogs['global'] || [])
      ].filter((m: any) =>
        m.channel === 'group' ||
        m.channel === 'guide_group' ||
        m.recipientRole === 'all' ||
        m.recipientRole === 'guide_group' ||
        m.senderRole === 'guide' ||
        m.senderRole === 'tourist'
      );

      const seen = new Set();
      const filtered = groupMsgs.filter(m => {
        const key = (m.id && String(m.id).trim()) ? String(m.id).trim() : `${m.sender || ''}-${m.text || ''}-${m.time || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return filtered.sort((a, b) => getTimestampMs(a) - getTimestampMs(b));
    } else if (activeTourist) {
      // Direct message with specific tourist — EXCLUDE any admin-only messages
      const fromGuide = chatLogs[`guide_${activeTourist.id}`] || [];
      const fromId = (chatLogs[activeTourist.id] || []).filter(
        (m: any) => m.channel === 'guide' || m.recipientRole === 'guide' || m.senderRole === 'guide'
      );

      const combined = [...fromGuide, ...fromId];
      const seen = new Set();
      const filtered = combined.filter(m => {
        // Must NOT be an admin-directed message
        if (m.channel === 'admin' || m.recipientRole === 'admin' || m.senderRole === 'admin') {
          return false;
        }
        const key = (m.id && String(m.id).trim()) ? String(m.id).trim() : `${m.sender || ''}-${m.text || ''}-${m.time || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return filtered.sort((a, b) => getTimestampMs(a) - getTimestampMs(b));
    }
    return [];
  };

  const channelMessages = getChannelMessages();

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length, activeChannel]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const text = inputText.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const guideName = currentGuide?.full_name || 'Guide (Rama)';
    const guideId = currentGuide?.guide_id || 'G-1001';
    const isAdmin = activeChannel === 'ch-admin';
    const isDirect = !!activeTourist && !isAdmin;

    const newMsg = {
      id: `msg-guide-${Date.now()}`,
      sender: guideName,
      senderRole: 'guide',
      recipientRole: isAdmin ? 'admin' : (isDirect ? 'tourist' : 'guide_group'),
      channel: isAdmin ? 'admin' : (isDirect ? 'guide' : 'guide_group'),
      text,
      time: timestamp,
      timestamp: Date.now(),
      touristId: isAdmin ? guideId : (activeTourist ? activeTourist.id : undefined),
      touristName: isAdmin ? `Guide: ${guideName}` : (activeTourist ? activeTourist.name : undefined),
      guideId
    };

    // Optimistically update local chat logs
    if (setChatLogs) {
      setChatLogs(prev => {
        const next = { ...prev };
        if (isAdmin) {
          next[`admin_${guideId}`] = [...(next[`admin_${guideId}`] || []), newMsg];
          next[`guide_inbox_${guideId}`] = [...(next[`guide_inbox_${guideId}`] || []), newMsg];
          next[guideId] = [...(next[guideId] || []), newMsg];
        } else if (activeTourist) {
          next[`guide_${activeTourist.id}`] = [...(next[`guide_${activeTourist.id}`] || []), newMsg];
        } else {
          next[`group_${guideId}`] = [...(next[`group_${guideId}`] || []), newMsg];
          next['guide_group'] = [...(next['guide_group'] || []), newMsg];
          next['global'] = [...(next['global'] || []), newMsg];
        }
        return next;
      });
    }

    setInputText('');
    setShowTemplates(false);

    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touristId: isAdmin ? guideId : (activeTourist ? activeTourist.id : undefined),
          touristName: isAdmin ? `Guide: ${guideName}` : (activeTourist ? activeTourist.name : undefined),
          guideId,
          sender: guideName,
          senderRole: 'guide',
          recipientRole: isAdmin ? 'admin' : (isDirect ? 'tourist' : 'guide_group'),
          channel: isAdmin ? 'admin' : (isDirect ? 'guide' : 'guide_group'),
          text,
          time: timestamp
        })
      });
    } catch (err) {
      console.error('Failed to post guide message:', err);
    }
  };

  const [isClearing, setIsClearing] = useState(false);

  const handleClearChat = async () => {
    const channelName = activeChannelData?.name || 'this conversation';
    if (!window.confirm(`Are you sure you want to clear chat history for ${channelName}?`)) return;
    setIsClearing(true);
    try {
      const guideId = currentGuide?.guide_id || 'G-1001';
      const isAdmin = activeChannel === 'ch-admin';
      await fetch('/api/chat/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touristId: isAdmin ? guideId : (activeTourist ? activeTourist.id : undefined),
          guideId: guideId,
          channel: isAdmin ? 'admin' : (activeTourist ? 'guide' : 'group')
        })
      });
    } catch (err) {
      console.error('Failed to clear guide chat:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleQuickReply = (text: string) => {
    setInputText(text);
  };

  const handleTemplateSelect = (text: string) => {
    setInputText(text);
    setShowTemplates(false);
  };

  const getChannelIcon = (type: ChannelItem['type']) => {
    switch (type) {
      case 'admin': return <Shield className="w-5 h-5" />;
      case 'group': return <Users className="w-5 h-5" />;
      case 'broadcast': return <Radio className="w-5 h-5" />;
      case 'direct': return <MessageSquare className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Title */}
      <div className="mb-4">
        <h2 className="text-[32px] leading-[40px] font-bold tracking-tight text-gd-on-bg font-guide">
          Guide Communications & Chat
        </h2>
        <p className="text-base text-gd-on-surface-var mt-1">
          Direct line with Admin Command Control Desk, Team Group discussions, and individual travelers.
        </p>
      </div>

      {/* Chat Layout */}
      <div className="flex-1 flex rounded-xl border border-gd-outline-var overflow-hidden bg-gd-surface shadow-sm min-h-0">
        {/* ── Left: Channel List ── */}
        <div className="w-[300px] border-r border-gd-outline-var flex flex-col bg-gd-surface-low shrink-0">
          {/* Search */}
          <div className="p-3 border-b border-gd-outline-var">
            <div className="flex items-center bg-gd-surface-variant/30 rounded-full px-3 py-1.5 border border-gd-outline-var/30 focus-within:border-gd-secondary transition-colors">
              <Search className="w-4 h-4 text-gd-outline mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="bg-transparent border-none outline-none text-base text-gd-on-surface placeholder:text-gd-outline w-full focus:ring-0 p-0"
              />
            </div>
          </div>

          {/* Channel List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChannels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-gd-outline-var/30 transition-colors ${activeChannel === channel.id
                  ? (channel.type === 'admin' ? 'bg-[#061E34]/20 border-l-2 border-l-amber-500' : 'bg-gd-secondary-ctr/30 border-l-2 border-l-gd-secondary')
                  : 'hover:bg-gd-surface-mid'
                  }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${channel.type === 'admin' ? 'bg-[#061E34] text-amber-400 border border-amber-500/40 shadow-xs' :
                  channel.type === 'group' ? 'bg-gd-secondary-ctr text-gd-on-secondary-ctr' :
                    channel.type === 'broadcast' ? 'bg-gd-warn text-gd-warn-ctr' :
                      'bg-gd-surface-high text-gd-on-surface-var font-bold'
                  }`}>
                  {channel.type === 'direct'
                    ? (channel.name.slice(0, 2).toUpperCase())
                    : getChannelIcon(channel.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className={`text-base font-semibold truncate flex items-center gap-1.5 ${activeChannel === channel.id
                      ? (channel.type === 'admin' ? 'text-amber-400 font-bold' : 'text-gd-on-secondary-ctr')
                      : 'text-gd-on-surface'
                      }`}>
                      {channel.name}
                      {channel.type === 'admin' && (
                        <span className="px-1 py-0.2 text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-mono font-bold">
                          ADMIN
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-gd-on-surface-var font-guide-mono ml-2 shrink-0">
                      {channel.lastMessageTime}
                    </span>
                  </div>
                  <p className="text-[13px] text-gd-on-surface-var truncate mt-0.5">
                    {channel.lastMessage}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {channel.memberCount && (
                      <span className="text-sm text-gd-outline font-guide-mono">
                        {channel.type === 'admin' ? 'Authority Control Desk' : channel.type === 'direct' ? 'Direct message' : `${channel.memberCount} members`}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: Active Chat ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-gd-outline-var bg-gd-surface-bright flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeChannelData?.type === 'admin' ? 'bg-[#061E34] text-amber-400 border border-amber-500/40 shadow-xs' :
                activeChannelData?.type === 'group' ? 'bg-gd-secondary-ctr text-gd-on-secondary-ctr' :
                  activeChannelData?.type === 'broadcast' ? 'bg-gd-warn text-gd-warn-ctr' :
                    'bg-gd-surface-high text-gd-on-surface-var font-bold'
                }`}>
                {activeChannelData?.type === 'direct'
                  ? (activeChannelData.name.slice(0, 2).toUpperCase())
                  : (activeChannelData && getChannelIcon(activeChannelData.type))}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gd-primary font-guide flex items-center gap-2">
                  <span>{activeChannelData?.name || 'Select a conversation'}</span>
                  {activeChannelData?.type === 'admin' && (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono font-bold">
                      OFFICIAL DESK
                    </span>
                  )}
                </h3>
                <p className="text-[12px] text-gd-on-surface-var font-guide-mono">
                  {activeChannelData?.type === 'admin' ? 'Official Dedicated Secure Line to Tourism Authority Command Center' :
                    activeChannelData?.type === 'group' ? `${tourists.length} team members · Live Two-Way Team Chat` :
                      `Direct conversation with ${activeChannelData?.name}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearChat}
                disabled={isClearing}
                title="Clear Chat History for this conversation"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/30 rounded-lg text-[13px] font-semibold transition-colors font-guide cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isClearing ? 'Clearing...' : 'Clear Chat'}</span>
              </button>

              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gd-warn text-gd-warn-ctr rounded-lg text-[13px] font-semibold hover:opacity-90 transition-opacity font-guide cursor-pointer"
              >
                <AlertCircle className="w-4 h-4" />
                Templates
                <ChevronDown className={`w-3 h-3 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Template Dropdown */}
          {showTemplates && (
            <div className="px-4 py-2 bg-gd-warn/30 border-b border-gd-warn-dim flex flex-wrap gap-2">
              {broadcastTemplates.map((t, i) => (
                <button
                  key={i}
                  onClick={() => handleTemplateSelect(t.text)}
                  className="px-3 py-1.5 bg-gd-surface border border-gd-outline-var rounded-lg text-[13px] text-gd-on-surface hover:bg-gd-surface-low transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gd-bg">
            {channelMessages.length === 0 && (
              <div className="flex items-center justify-center h-full text-gd-on-surface-var text-base">
                No messages yet. Send a message to start communicating!
              </div>
            )}
            {channelMessages.map((msg, index) => {
              const isGuide = msg.senderRole === 'guide' || msg.sender === currentGuide?.full_name || msg.sender === 'Guide';
              return (
                <div
                  key={msg.id || index}
                  className={`flex ${isGuide ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isGuide ? 'order-2' : 'order-1'}`}>
                    {/* Sender name for non-guide */}
                    {!isGuide && (
                      <p className="text-sm font-semibold text-gd-on-surface-var mb-1 ml-1">
                        {msg.sender || 'Tourist'}
                      </p>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl ${isGuide
                      ? 'bg-gd-primary-ctr text-gd-on-primary-ctr rounded-br-md shadow-sm'
                      : 'bg-gd-surface border border-gd-outline-var text-gd-on-surface rounded-bl-md shadow-sm'
                      }`}>
                      <p className="text-lg leading-relaxed">{msg.text}</p>
                    </div>
                    <p className={`text-xs font-guide-mono text-gd-outline mt-1 ${isGuide ? 'text-right mr-1' : 'ml-1'}`}>
                      {msg.time || msg.timestamp || 'Just now'}
                      {isGuide && ' ✓✓'}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="px-4 py-2 border-t border-gd-outline-var/50 bg-gd-surface-low flex gap-2 overflow-x-auto">
            {quickReplies.map((qr, i) => (
              <button
                key={i}
                onClick={() => handleQuickReply(qr)}
                className="px-3 py-1 rounded-full border border-gd-outline-var text-[12px] font-medium text-gd-on-surface-var hover:bg-gd-surface-variant hover:text-gd-primary whitespace-nowrap transition-colors"
              >
                {qr}
              </button>
            ))}
          </div>

          {/* Message Input */}
          <div className="px-4 py-3 border-t border-gd-outline-var bg-gd-surface flex items-end gap-3">
            <button className="p-2 text-gd-outline hover:text-gd-primary hover:bg-gd-surface-low rounded-lg transition-colors shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="p-2 text-gd-outline hover:text-gd-primary hover:bg-gd-surface-low rounded-lg transition-colors shrink-0">
              <ImageIcon className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Message ${activeChannelData?.name || 'group'}...`}
                rows={1}
                className="w-full bg-gd-surface-low border border-gd-outline-var rounded-xl px-4 py-2.5 text-base text-gd-on-surface placeholder:text-gd-outline resize-none focus:outline-none focus:ring-2 focus:ring-gd-secondary/50 focus:border-gd-secondary transition-colors"
              />
            </div>
            <button className="p-2 text-gd-outline hover:text-gd-primary hover:bg-gd-surface-low rounded-lg transition-colors shrink-0">
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="p-2.5 bg-gd-secondary text-gd-on-secondary rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
