# 🛰️ SafeYatra AI Engine Architecture

> **Smart Tourist Safety Monitoring & Incident Response System using AI, Geo-Fencing, and Blockchain-based Digital ID**

---

## 📁 Unified Directory Structure

```text
ai/
│
├── data/
│   ├── tourist_safety_dataset.csv     # 15,000 baseline telemetry training records
│   ├── historical_incidents.json      # Local spatial incident database (DEMO/SYNTHETIC)
│   └── geofences.geojson              # Safe & restricted zone spatial boundaries
│
├── models/
│   ├── risk_model.joblib              # Trained Phase 1 XGBoost Situational Risk Regressor
│   ├── risk_preprocessor.joblib       # Preprocessing and scaling pipeline for Risk Engine
│   ├── anomaly_model.joblib           # Trained Phase 3 Isolation Forest Anomaly Detector
│   ├── anomaly_preprocessor.joblib    # Preprocessor and scaler for Anomaly Engine
│   └── model_metadata.json            # Model parameters, evaluation metrics, and contracts
│
├── risk_engine.py                     # Phase 1 & 2: Feature Engineering & XGBoost Risk Prediction
├── anomaly_engine.py                  # Phase 3: Isolation Forest & Multi-Signal Safety Fusion
├── data_sources.py                    # 100% Free Open Data Adapters (Weather, Geofence, Crowd, Incidents)
├── training.py                        # End-to-end dataset generator, model trainer & validator
├── automation.py                      # Autonomous real-time safety monitoring agent
├── api.py                             # FastAPI APIRouter & Pydantic request/response schemas
├── tests.py                           # Consolidated master unit & integration test suite
└── README.md                          # Complete AI documentation
```

---

## 📊 Core AI Components

### 1. 🎯 Situational Risk Engine (`risk_engine.py`)
Predicts a continuous **`risk_score` (0.0 – 100.0)** and classifies the safety risk tier:
* **`0 – 30`:** **`LOW`** *(Normal baseline safety)*
* **`31 – 60`:** **`MODERATE`** *(Advisory caution)*
* **`61 – 80`:** **`HIGH`** *(Escalated hazard warning)*
* **`81 – 100`:** **`CRITICAL`** *(Immediate emergency alert)*

#### The 9 Canonical Features Contract:
| Feature | Range | Semantic Role | Source Adapter |
|---|---|---|---|
| `location_risk` | `0.0 – 1.0` | Terrain / physical hazard vulnerability | Local terrain elevation & cliff mapper |
| `time_risk` | `0.0 – 1.0` | Diurnal time-of-day hazard (night danger) | Continuous mathematical solar model |
| `geofence_risk` | `0.0 – 1.0` | Administrative zone breach / proximity buffer | `data/geofences.geojson` Ray-Casting |
| `crowd_density` | `0.0 – 1.0` | Aggregated local tourist density index | Privacy-preserving proximity counter |
| `weather_risk` | `0.0 – 1.0` | Real-time environmental weather hazard | Free **Open-Meteo REST API** (WMO codes) |
| `historical_incidents` | `0 – 30` | Sector recorded historical incidents count | `data/historical_incidents.json` |
| `movement_speed` | `0.0 – 50.0 km/h` | Tourist velocity across fixes | Sequential Haversine delta |
| `route_deviation` | `0.0 – 1500.0 m` | Perpendicular offset from safe corridor | Cross-track polyline analyzer |
| `inactivity_minutes` | `0.0 – 360.0 min`| Stationary idle duration | Timestamp inactivity counter |

---

### 2. 🔍 Anomaly Detection & Fusion (`anomaly_engine.py`)
* **Model:** Unsupervised **Isolation Forest** fitted on nominal walking behavior.
* **Kinematics Tracked:** `speed_kmh`, `speed_delta_kmh`, `route_deviation_m`, `inactivity_min`, `heading_delta_deg`, `spatial_jump_m`, `heart_rate_bpm`.
* **Semantic Classifier:** Maps numerical outliers into human-interpretable categories:
  - `ROUTE_DEVIATION`
  - `PROLONGED_INACTIVITY`
  - `SUDDEN_SPEED_CHANGE`
  - `RESTRICTED_ZONE_ENTRY`
  - `UNUSUAL_MOVEMENT_PATTERN`
* **Safety Signal Fusion:** Combines situational risk (XGBoost) and behavioral anomaly (Isolation Forest) into an operational safety status (`NORMAL`, `ADVISORY`, `ELEVATED`, `ESCALATED`, `CRITICAL`).

---

### 3. 🌐 Free & Open Data Sources (`data_sources.py`)
* **Zero Paid APIs Used ($0.00).**
* **Weather:** Open-Meteo (No API key needed, 15-min spatial cache, offline fallback).
* **Geofence:** Local ray-casting polygon & circular buffer engine.
* **Crowd:** Privacy-preserving count of active SafeYatra tourists within 500m.
* **Historical Incidents:** Local JSON database with distance decay weighting.

---

## 🚀 Quick Start & Usage

### 1. Run All Tests
```bash
python ai/tests.py
```

### 2. Train Models from Scratch
```bash
python -m ai.training
```

### 3. Run Autonomous Monitoring Agent
```bash
python -m ai.automation
```

### 4. Single-Sample Python Inference
```python
from ai import build_risk_features, predict_risk_from_dict, detect_anomaly, combine_safety_signals

telemetry = {
    "tourist_id": "T-1001-643B",
    "lat": 30.1340,
    "lng": 78.3240,
    "speed": 3.5,
    "timestamp": "2026-08-16T12:00:00Z"
}

# 1. Generate 9 Canonical Features
features = build_risk_features(telemetry)

# 2. Predict Situational Risk (XGBoost)
risk = predict_risk_from_dict(features)

# 3. Detect Behavioral Anomaly (Isolation Forest)
anomaly = detect_anomaly(telemetry)

# 4. Fuse Signals into Safety Status
safety = combine_safety_signals(risk, anomaly)

print(risk)     # {'risk_score': 18.2, 'risk_level': 'LOW'}
print(anomaly)  # {'anomaly_detected': False, 'anomaly_type': 'NONE'}
print(safety)   # {'safety_status': 'NORMAL', ...}
```
