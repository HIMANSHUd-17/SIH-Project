/**
 * SafeYatra AI Chatbot Service Layer
 * ----------------------------------
 * Handles intelligent conversation processing, domain-specific tourist safety reasoning,
 * and integration with the backend assistant API.
 */

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  quickActions?: { label: string; query: string }[];
  isEmergency?: boolean;
}

const KNOWLEDGE_BASE: {
  keywords: string[];
  response: string;
  quickActions?: { label: string; query: string }[];
  isEmergency?: boolean;
}[] = [
  // 1. How SafeYatra Works
  {
    keywords: ['how safeyatra works', 'how does it work', 'how it works', 'about safeyatra', 'what is safeyatra'],
    response: `SafeYatra continuously uses your location and safety conditions to understand whether your current travel situation is safe. It checks factors such as location, weather, terrain, crowd conditions and movement patterns. If it detects increasing risk or unusual movement, it can alert the tourist, guide and Admin. The SOS feature provides an additional emergency mechanism.`,
    quickActions: [
      { label: '📍 Check Location Safety', query: 'Check Location Safety' },
      { label: '🛡️ Safety Tips', query: 'Safety Tips' },
      { label: '🌦️ Weather Safety', query: 'Weather Safety' }
    ]
  },

  // 2. Explain AI Risk Score
  {
    keywords: ['risk score', 'ai risk score', 'explain risk', 'how risk is calculated'],
    response: `**SafeYatra Risk Score (0–100):**\n\n` +
      `The Risk Score is a continuous safety index calculated from real-time travel conditions:\n\n` +
      `• **0 – 25 (LOW):** Optimal, safe conditions on established paths.\n` +
      `• **26 – 50 (MODERATE):** Advisory state — moderate crowd density or minor weather shifts.\n` +
      `• **51 – 75 (HIGH):** Elevated caution — rugged terrain, bad weather, or remote transit.\n` +
      `• **76 – 100 (CRITICAL):** High hazard — severe weather alerts or hazard zone breaches.\n\n` +
      `*Note: The Risk Score evaluates external situational risk and remains independent from emergency SOS triggers.*`,
    quickActions: [
      { label: '📍 Check Location Safety', query: 'Check Location Safety' },
      { label: '🛡️ Safety Tips', query: 'Safety Tips' }
    ]
  },

  // 3. Explain Anomaly Detection
  {
    keywords: ['anomaly', 'anomaly detection', 'movement monitoring', 'behavioral anomaly', 'route deviation', 'inactivity'],
    response: `**Movement & Behavior Monitoring:**\n\n` +
      `SafeYatra monitors movement patterns in real-time to safeguard tourists:\n\n` +
      `• **Route Deviation:** Detects movement far off designated safe paths.\n` +
      `• **Prolonged Inactivity:** Flags stationary behavior in remote hazard areas (potential fall or injury).\n` +
      `• **Sudden Speed Changes:** Flags unexpected velocity shifts or vehicle distress.\n` +
      `• **Restricted Zone Alerts:** Warns guides when travelers approach hazardous cliffs or riverbanks.`,
    quickActions: [
      { label: '🛡️ Safety Tips', query: 'Safety Tips' },
      { label: '🚨 Emergency Help', query: 'Emergency Help' }
    ]
  },

  // 4. Emergency Guidance
  {
    keywords: ['emergency', 'sos', 'help me', 'danger', 'rescue', 'police', 'ambulance', 'hospital', 'accident'],
    response: `🚨 **EMERGENCY SAFETY GUIDANCE**\n\n` +
      `If you are currently in danger or need immediate emergency assistance:\n\n` +
      `1. **Trigger SafeYatra SOS:** Use the red **Emergency SOS button** inside the Tourist or Guide app to instantly broadcast your live GPS coordinates to the Admin Command Center and assigned guide.\n` +
      `2. **Direct Emergency Helplines (India):**\n` +
      `   • **National Emergency Number:** \`112\` (All-in-one Police, Fire, Medical)\n` +
      `   • **Police:** \`100\` | **Ambulance:** \`108\` / \`102\`\n` +
      `   • **Tourist Helpline:** \`1363\` / \`1800-11-1363\`\n` +
      `   • **Disaster Management (NDRF/SDRF):** \`1070\` / \`1077\`\n` +
      `3. **Stay in a visible, safe area** if possible and keep your device battery preserved.`,
    quickActions: [
      { label: '📍 Check Location Safety', query: 'Check Location Safety' },
      { label: '🌦️ Weather Safety Guidelines', query: 'Weather Safety Guidelines' }
    ],
    isEmergency: true
  },

  // 5. General Travel Safety Tips
  {
    keywords: ['safety tips', 'travel tips', 'safe travel', 'precautions', 'tips for tourists', 'travel safety advice'],
    response: `🛡️ **Essential Travel Safety Tips for India & Mountain Regions:**\n\n` +
      `• **Keep SafeYatra Active:** Ensure background GPS tracking is enabled so your guide and control room know your status.\n` +
      `• **Check Weather Forecasts:** Avoid trekking during heavy rain or post-sunset hours in hilly terrains.\n` +
      `• **Stay Within Marked Zones:** Adhere to dynamic geofence boundaries and heed warning flags near rivers or cliffs.\n` +
      `• **Hydration & Acclimatization:** In high-altitude zones (e.g. Kedarnath, Badrinath, Ladakh), rest adequately to prevent Acute Mountain Sickness (AMS).\n` +
      `• **Emergency Offline Readiness:** Save offline emergency contacts and carry an external power bank for your mobile phone.`,
    quickActions: [
      { label: '🌦️ Weather Safety', query: 'Weather safety guidance' },
      { label: '📍 Location Safety', query: 'Check location safety for Uttarakhand' }
    ]
  },

  // 6. Weather & Environmental Safety Guidance
  {
    keywords: ['weather', 'rain', 'monsoon', 'landslide', 'snow', 'flash flood', 'weather safety', 'climate'],
    response: `🌦️ **Weather & Environmental Safety Guidance:**\n\n` +
      `• **Monsoon & Flash Floods:** Stay at least 100 meters away from fast-flowing mountain rivers (like the Ganga or Alaknanda) during heavy rainfalls.\n` +
      `• **Landslide Prone Zones:** Do not stop vehicles under active cutting zones or steep loose slopes during or immediately after torrential rain.\n` +
      `• **Winter & High Altitude:** Carry thermal layering, waterproof windcheaters, and UV-blocking sunglasses for snow glare.\n` +
      `• **Real-time SafeYatra Weather Multiplier:** SafeYatra automatically scales situational risk scores when severe meteorological alerts are detected.`,
    quickActions: [
      { label: '📍 Check Location Safety', query: 'Check Location Safety' },
      { label: '🚨 Emergency Help', query: 'Emergency Help' }
    ]
  },

  // 7. Role Features (Tourist, Guide, Admin)
  {
    keywords: ['tourist guide admin', 'roles', 'features', 'portal', 'tourist portal', 'guide portal', 'admin dashboard'],
    response: `👥 **SafeYatra Multi-Portal Architecture:**\n\n` +
      `• **Tourist Portal:** Live GPS breadcrumb tracking, battery & elevation monitor, 1-tap SOS trigger, real-time AI risk indicator, and direct guide chat.\n` +
      `• **Guide Dashboard:** Group telemetry dashboard with strict guide isolation, AI safety & behavioral anomaly tracker for assigned tourists, and instant distress notifications.\n` +
      `• **Admin Command Center:** Pan-India real-time monitoring map, AI Risk Sentinel table, dynamic geofence parameter management, and multi-agency unit dispatch.`,
    quickActions: [
      { label: '🤖 How SafeYatra Works', query: 'How does SafeYatra work?' },
      { label: '🛡️ Safety Tips', query: 'Safety Tips' }
    ]
  },

  // 8. Location-specific checks
  {
    keywords: ['rishikesh', 'haridwar', 'kedarnath', 'badrinath', 'manali', 'shimla', 'uttarakhand', 'goa', 'jaipur', 'location safety', 'check location'],
    response: `📍 **Location Safety Guidelines:**\n\n` +
      `• **Uttarakhand / Char Dham (Rishikesh, Kedarnath, Badrinath):** Always register biometric biometric/DID passes, verify daily SDRF weather bulletins, and strictly avoid riverbanks during high water alerts.\n` +
      `• **Himachal (Manali, Shimla, Spiti):** Watch for sudden road blockages, maintain 4x4 chains in winter, and carry sufficient offline cash.\n` +
      `• **Heritage Cities (Jaipur, Agra, Varanasi):** Keep valuables secure in crowded bazaars, use verified government guides, and stay hydrated.\n` +
      `• **Coastal / Beach Destinations (Goa, Kerala):** Heed lifeguard flags (Red = No Swimming) and avoid isolated beaches post midnight.\n\n` +
      `*To check safety for a specific town or trail, please mention your destination name!*`,
    quickActions: [
      { label: '🌦️ Weather Safety', query: 'Weather safety guidance' },
      { label: '🛡️ General Safety Tips', query: 'Travel safety tips' }
    ]
  }
];

export const aiChatbotService = {
  /**
   * Processes a user message and returns a rich AI response.
   * Calls the backend `/api/assistant/chat` if available, or leverages the built-in
   * specialized safety reasoning engine.
   */
  async sendMessage(
    message: string,
    history: ChatMessage[] = [],
    location?: { lat: number | null; lng: number | null; address?: string }
  ): Promise<ChatMessage> {
    const trimmed = message.trim();
    if (!trimmed) {
      return {
        id: 'msg-' + Date.now(),
        sender: 'bot',
        text: "I didn't catch that. Could you please specify how I can assist with your travel safety?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    // Try Backend API first if available (Passes live GPS location to FastAPI + Gemini)
    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          language: 'English',
          location: location?.lat && location?.lng ? {
            lat: location.lat,
            lng: location.lng,
            address: location.address
          } : undefined,
          touristContext: {
            name: 'Public Visitor',
            currentLocation: location?.lat && location?.lng ? {
              lat: location.lat,
              lng: location.lng,
              address: location.address || 'Live Location'
            } : undefined
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.reply) {
          const quickActions = (data.suggestedActions || []).map((act: string) => ({
            label: act,
            query: act
          }));

          return {
            id: 'msg-' + Date.now(),
            sender: 'bot',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickActions: quickActions.length > 0 ? quickActions : [
              { label: '📍 Check Location Safety', query: 'Check Location Safety' },
              { label: '🛡️ Safety Tips', query: 'Safety Tips' },
              { label: '🌦️ Weather Safety', query: 'Weather Safety' }
            ]
          };
        }
      }
    } catch {
      // Backend not running or offline, proceed to client reasoning engine
    }

    // Client-side Specialized Tourist Safety Intelligence Engine
    const lower = trimmed.toLowerCase();

    // Check knowledge base matching
    for (const item of KNOWLEDGE_BASE) {
      if (item.keywords.some(k => lower.includes(k))) {
        return {
          id: 'msg-' + Date.now(),
          sender: 'bot',
          text: item.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickActions: item.quickActions,
          isEmergency: item.isEmergency
        };
      }
    }

    // Check for specific location queries
    const locationKeywords = ['pune', 'mumbai', 'delhi', 'ladakh', 'kullu', 'nainital', 'mussoorie', 'kerala', 'kashmir', 'ooty', 'darjeeling'];
    const matchedLocation = locationKeywords.find(loc => lower.includes(loc));
    if (matchedLocation) {
      const locCapitalized = matchedLocation.charAt(0).toUpperCase() + matchedLocation.slice(1);
      return {
        id: 'msg-' + Date.now(),
        sender: 'bot',
        text: `📍 **Travel Safety Insights for ${locCapitalized}:**\n\n` +
          `• **Safety Status:** Popular tourist destination with active police patrols.\n` +
          `• **Recommended Precautions:** Check current seasonal weather before embarking on outdoor tours, stick to verified transport providers, and maintain active GPS location sharing.\n` +
          `• **Emergency Access:** Dial \`112\` for local police and ambulance assistance across all districts.\n\n` +
          `Would you like specific trekking safety guidelines or weather safety tips for this region?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: '🌦️ Weather Safety', query: `Weather safety guidance for ${locCapitalized}` },
          { label: '🛡️ General Safety Tips', query: 'Safety Tips' },
          { label: '🚨 Emergency Help', query: 'Emergency Help' }
        ]
      };
    }

    // Default intelligent conversational safety fallback
    return {
      id: 'msg-' + Date.now(),
      sender: 'bot',
      text: `I'm here to help with your tourist and travel safety questions!\n\n` +
        `You can ask me about:\n` +
        `• **Location Safety & Weather Guidelines** (e.g. *"Is it safe to visit Rishikesh right now?"*)\n` +
        `• **SafeYatra AI Risk Score & Anomaly Detection** (e.g. *"How does the AI Risk Score work?"*)\n` +
        `• **Emergency Guidance & Helplines** (e.g. *"What are the emergency numbers in India?"*)\n` +
        `• **Platform Portals & Features** (e.g. *"How do tourist and guide dashboards work?"*)`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickActions: [
        { label: '📍 Check Location Safety', query: 'Check Location Safety' },
        { label: '🛡️ Safety Tips', query: 'Safety Tips' },
        { label: '🌦️ Weather Safety', query: 'Weather Safety' },
        { label: '🚨 Emergency Help', query: 'Emergency Help' },
        { label: '🤖 How SafeYatra Works', query: 'How does SafeYatra work?' }
      ]
    };
  }
};
