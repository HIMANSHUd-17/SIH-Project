# SafeYatra Tourist Safety Platform - Monorepo

Welcome to the **SafeYatra** monorepo workspace. This platform provides real-time smart tourist safety monitoring, dynamic hazard geofencing, blockchain identity anchoring, safe route guidance, and a multi-authority admin dashboard.

The project is structured into four main folders, matching the system design architecture:

```
├── ai-automation/     # Google Gemini safety agent monitoring tools
├── backend/           # Python FastAPI geospatial risk microservice
├── blockchain/        # Solidity smart contracts and anchoring protocols
└── frontend/          # Vite + React UI and Express middleware server
```

---

## Workspace Submodules

### 1. `ai-automation`
Hosts the AI safety monitor agent powered by Google Gemini. The agent reviews real-time coordinates, crowd density, and weather risk factors to draft hazard notifications and evacuation steps.
- See [ai-automation/README.md](file:///C:/Users/Siddharth/Downloads/nagarjuna-tourist-safety-platform%20(1)/ai-automation/README.md) for details.

### 2. `backend`
A standalone FastAPI microservice written in Python. It calculates Haversine spatial distances, crowd risk indices, and weather multipliers to evaluate localized tourist safety bounds.
- See [backend/README.md](file:///C:/Users/Siddharth/Downloads/nagarjuna-tourist-safety-platform%20(1)/backend/README.md) for details.

### 3. `blockchain`
Contains the `SafeYatraTouristIdentity.sol` Solidity contract, designed to anchor cryptographic zero-knowledge hashes of tourist PII on-chain (Polygon/Hyperledger EVM networks) to secure records and log emergency verification queries.
- See [blockchain/README.md](file:///C:/Users/Siddharth/Downloads/nagarjuna-tourist-safety-platform%20(1)/blockchain/README.md) for details.

### 4. `frontend`
The core user interface (Vite + React) combined with the Node.js/Express server. The server acts as a middleware router, orchestrating requests to the python risk engine and managing server-sent event (SSE) tracking feeds.
- See [frontend/README.md](file:///C:/Users/Siddharth/Downloads/nagarjuna-tourist-safety-platform%20(1)/frontend/README.md) (coming soon, or refer to instructions below).

---

## Local Execution Instructions

### Quick Start (Windows One-Click Launcher)
Double-click or run:
```bat
run_project.bat
```
*(or simply `run.bat`)*

This script automatically:
1. Verifies **Node.js** and **Python** runtime availability.
2. Checks and installs any missing **frontend** and **backend** dependencies.
3. Launches the **FastAPI Backend (Port 8000)** in a dedicated console window.
4. Launches the **Vite + React & Express Frontend (Port 5009)** in a dedicated console window.
5. Automatically opens your default web browser to `http://localhost:5009`.

To terminate all running services cleanly at once, execute:
```bat
stop_project.bat
```

---

### Manual Execution Instructions

#### 1. Running the Frontend & Express Middleware
2. **Configure your API Keys:**
   Create a `.env.local` inside `frontend` or set env variables in your terminal:
   ```bash
   GEMINI_API_KEY="your-api-key-here"
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the platform interface.

### Running the Python Backend Microservice

To run the FastAPI server standalone:

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the service:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   API Docs will be available at `http://localhost:8000/docs`.
