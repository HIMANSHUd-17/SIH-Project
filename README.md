# SafeYatra — Smart Tourist Safety & AI Incident Monitoring Platform

> **Merged Production Release (`SIH-FINAL-MERGE`)**  
> Complete unification of the SafeYatra AI Safety Engines, Multilingual Interface, Blockchain Decentralized Identity (DID), Real-Time Multi-Channel Chat, Emergency Audio SOS with Microphone Streaming, and Multi-Authority Command Center.

---

## 🌟 Core Feature Matrix

### 1. 🧠 Preserved AI Safety & Machine Learning
- **Situational Risk Engine (`ai/risk_engine.py`)**: XGBoost predictive risk modeling evaluating multi-factor situational hazards (0–100 score).
- **Behavioral Anomaly Detection (`ai/anomaly_engine.py`)**: Isolation Forest model detecting route deviations, prolonged inactivity, and speed shifts.
- **Safety Signal Fusion**: Merges situational risk and behavioral anomaly signals into fused operational tiers (`NORMAL`, `ADVISORY`, `ELEVATED`, `ESCALATED`, `CRITICAL`).
- **AI Safety Automation Agent (`ai_automation/safety_agent.py`)**: Google Gemini 2.5 Flash safety intelligence agent for localized context.
- **SafeYatra AI Chatbot**: Grounded floating AI assistant on the landing page connecting directly to FastAPI AI endpoints with reverse-geocoding.
- **Guide AI Safety Monitoring (`GuideAiMonitoring.tsx`)**: Real-time anomaly visualizer and traveler risk inspector for tour guides.

### 2. 👥 Registration & Profile Management
- **Solo & Team Registration**: Modal in Tourist portal supporting single and group travel registration with phone/email deduplication.
- **Tourist Profile View & Editor (`TouristProfileView.tsx`)**: In-app profile inspection and direct field editing.
- **FastAPI Unique Tourist ID Generation**: Cryptographically secure ID creation linked to assigned guides.

### 3. 🚨 Emergency Response & SOS Audio State Machine
- **Microphone Permission SOS State Machine**:
  `REQUESTING_MIC` ➔ `MIC_ACTIVE` (or `MIC_DENIED` fallback) ➔ `TRANSMITTING` (5-second cancel countdown) ➔ `SUBMITTED`.
- **Audio Alarm Synthesizer (`audioAlarm.ts`)**: Emergency alert siren for incident confirmation.
- **Dynamic 4-Tier Safety Status Banners**:
  - *Level 1 (0–25)*: Nominal Safe Corridor
  - *Level 2 (26–50)*: Advisory Notice
  - *Level 3 (51–75)*: Elevated Caution Zone
  - *Level 4 (76–100)*: Critical Emergency SOS Trigger

### 4. 💬 Real-Time Communications & Multi-Channel Chat
- **Multi-Channel SSE Streaming (`chat_database.json`)**:
  - `guide` channel (Tourist ↔ Guide direct link)
  - `group` channel (Guide ➔ All Tourists broadcast)
  - `admin` channel (Tourist ↔ Authority Admin)
- Chronological ordering and persistent JSON storage.

### 5. 🌐 Multilingual Accessibility (13 Indian Languages)
- Centralized `LanguageContext.tsx` and `i18n.ts` supporting Tourist, Guide, and Admin interfaces in:
  - English (`en`), Hindi (`hi`), Marathi (`mr`), Bengali (`bn`), Gujarati (`gu`)
  - Tamil (`ta`), Telugu (`te`), Kannada (`kn`), Malayalam (`ml`), Punjabi (`pa`)
  - Odia (`or`), Assamese (`as`), Urdu (`ur`)

### 6. ⛓️ Blockchain & Decentralized Identity (DID)
- **`NagarjunaTouristIdentity.sol` / `SafeYatraTouristIdentity.sol`**: DID registry with Keccak-256 hashed PII and emergency audit logging.
- **`IncidentRegistry.sol`**: Tamper-proof on-chain incident evidence storage.
- **Pinata IPFS Service (`ipfs_service.py`)**: Secure multimedia evidence pinning.
- **Web3 Client (`web3_client.py` & `web3.ts`)**: MetaMask connection and smart contract transaction execution.

---

## 🚀 Quick Start & Run Commands

### 1-Click Launch (Windows)
Double-click `run_project.bat` or run:
```cmd
run.bat
```

### Manual Service Launch

#### 1. Backend (FastAPI on Port 8000)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Frontend & Express Middleware (Port 5009)
```bash
cd frontend
npm install
npm run dev
```

### Stopping Services
```cmd
stop_project.bat
```

---

## 📁 Repository Structure

```
SIH-FINAL-MERGE/
├── ai/                      # XGBoost, Isolation Forest, models, and preprocessors
├── ai-automation/           # Gemini AI safety agent
├── backend/                 # FastAPI microservice, models, SQLite DB, Web3 & IPFS
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── auth.py
│   ├── risk_engine.py
│   ├── ipfs_service.py
│   ├── web3_client.py
│   └── requirements.txt
├── blockchain/              # Hardhat smart contracts (IncidentRegistry & DID)
│   ├── contracts/
│   └── hardhat.config.ts
├── frontend/                # Express + React 19 + Vite + TailwindCSS
│   ├── server.ts            # Integration middleware & SSE broadcast
│   └── src/
│       ├── components/      # Tourist, Guide, Admin, Chatbot, Maps, and Modals
│       ├── hooks/           # useTouristLiveLocation.ts
│       ├── services/        # aiChatbotService.ts
│       ├── utils/           # LanguageContext, i18n, web3, audioAlarm
│       └── types.ts
├── run_project.bat          # 1-Click launcher
├── stop_project.bat         # 1-Click shutdown
├── .env.example             # Environment variables template
└── README.md
```
